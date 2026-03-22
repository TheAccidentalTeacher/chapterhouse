/**
 * POST /api/email/sync
 *
 * Fetches recent emails from IMAP and persists new ones to the Supabase `emails` table.
 * Deduplicates by IMAP UID — already-stored emails are never re-inserted.
 *
 * Returns: { inserted: number, total: number, skipped: number }
 *
 * Called by:
 *   - /api/cron/email-digest (daily cron, automatic)
 *   - Email inbox UI "Sync & Categorize" button (manual)
 */

import { NextResponse } from "next/server";
import { simpleParser } from "mailparser";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";
import { getImapClient, getConfiguredAccounts } from "@/lib/email-client";
import { requireEmailAuth } from "@/lib/email-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: Request): Promise<NextResponse> {
  const emailAuth = await requireEmailAuth(req);
  if (!emailAuth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { userId } = emailAuth;

  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database not available" }, { status: 503 });
  }

  const accounts = getConfiguredAccounts();
  if (accounts.length === 0) {
    return NextResponse.json({ error: "No email accounts configured" }, { status: 503 });
  }

  // Purge emails older than 7 days — keeps the inbox clean on every sync
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  await supabase
    .from("emails")
    .delete()
    .eq("user_id", userId)
    .lt("received_at", cutoff);

  let totalInserted = 0;
  let totalSkipped = 0;
  let totalScanned = 0;
  const accountResults: Record<string, { inserted: number; skipped: number; total: number; error?: string }> = {};

  for (const account of accounts) {
    const client = getImapClient(account, { socketTimeout: 20000 });
    if (!client) continue;

    let inserted = 0;
    let skipped = 0;
    let total = 0;
    let accountError: string | undefined;

    try {
      await client.connect();
      const lock = await client.getMailboxLock("INBOX");

      try {
        // Fetch last 7 days of messages — bootstrap window.
        // Run a few syncs and the DB will accumulate history going forward.
        const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const searchResult = await client.search({ since });

        if (!searchResult || searchResult.length === 0) {
          accountResults[account] = { inserted: 0, skipped: 0, total: 0 };
          continue;
        }

        total = searchResult.length;

        // Sort descending: highest UID = newest email. Gmail IMAP SINCE is unreliable
        // (can return old UIDs) — sorting ensures we always process newest mail first.
        searchResult.sort((a: number, b: number) => b - a);

        // Check which UIDs are already stored for this specific account
        const { data: existingRows } = await supabase
          .from("emails")
          .select("uid")
          .eq("user_id", userId)
          .eq("email_account", account)
          .in("uid", searchResult.slice(0, 1000));

        const existingUids = new Set((existingRows ?? []).map((r) => r.uid as number));

        // Only fetch UIDs not already stored for this account
        const newUids = searchResult.filter((uid: number) => !existingUids.has(uid));
        skipped = searchResult.length - newUids.length;

        if (newUids.length === 0) {
          accountResults[account] = { inserted: 0, skipped, total };
          continue;
        }

        // Fetch new messages in batches of 10 to stay within Vercel time limits
        const batchSize = 10;
        const rows: Array<{
          user_id: string;
          email_account: string;
          uid: number;
          subject: string;
          from_name: string | null;
          from_address: string;
          to_address: string | null;
          received_at: string;
          has_attachment: boolean;
          is_read: boolean;
          snippet: string | null;
          text_body: string | null;
          html_body: string | null;
        }> = [];

        for (let i = 0; i < Math.min(newUids.length, 50); i += batchSize) {
          const batch = newUids.slice(i, i + batchSize);

          for await (const msg of client.fetch(
            batch,
            { envelope: true, uid: true, source: true, flags: true, bodyStructure: true },
            { uid: true }
          )) {
            try {
              const env = msg.envelope;
              // Hard date guard: skip emails older than the 7-day cutoff regardless
              // of what IMAP SINCE returned. Checked before body parse (stays fast).
              const emailDate = env?.date ?? new Date();
              if (emailDate < since) {
                skipped++;
                continue;
              }
              const fromEntry = env?.from?.[0];
              const toEntry = env?.to?.[0];

              // Parse full body for snippet + text + html
              let textBody: string | null = null;
              let htmlBody: string | null = null;
              let snippet: string | null = null;
              let hasAttachment = false;

              if (msg.source) {
                const parsed = await simpleParser(msg.source as Buffer);
                textBody = parsed.text ?? null;
                htmlBody = typeof parsed.html === "string" ? parsed.html : null;
                snippet = textBody?.slice(0, 500).replace(/\s+/g, " ").trim() ?? null;
                hasAttachment = (parsed.attachments?.length ?? 0) > 0;
              }

              rows.push({
                user_id: userId,
                email_account: account,
                uid: msg.uid,
                subject: env?.subject ?? "(no subject)",
                from_name: fromEntry?.name ?? null,
                from_address: fromEntry?.address ?? "unknown@unknown",
                to_address: toEntry?.address ?? null,
                received_at: (env?.date ?? new Date()).toISOString(),
                has_attachment: hasAttachment,
                is_read: msg.flags?.has("\\Seen") ?? false,
                snippet,
                text_body: textBody ? textBody.slice(0, 50000) : null,
                html_body: htmlBody ? htmlBody.slice(0, 100000) : null,
              });
            } catch (parseErr) {
              console.warn(`[email/sync:${account}] Failed to parse UID ${msg.uid}:`, parseErr);
            }
          }
        }

        if (rows.length > 0) {
          // Upsert — conflict on (user_id, email_account, uid) is a no-op
          const { error: insertError } = await supabase
            .from("emails")
            .upsert(rows, { onConflict: "user_id,email_account,uid", ignoreDuplicates: true });

          if (insertError) {
            console.error(`[email/sync:${account}] Upsert failed:`, insertError);
          } else {
            inserted = rows.length;
          }
        }
      } finally {
        lock.release();
      }
    } catch (err) {
      accountError = err instanceof Error ? err.message : String(err);
      console.error(`[email/sync:${account}] Connection failed:`, accountError);
    } finally {
      try { await client.logout(); } catch { /* ignore disconnect errors */ }
    }

    accountResults[account] = { inserted, skipped, total, ...(accountError ? { error: accountError } : {}) };
    totalInserted += inserted;
    totalSkipped += skipped;
    totalScanned += total;
  }

  const errors = Object.entries(accountResults)
    .filter(([, v]) => v.error)
    .map(([acct, v]) => ({ account: acct, error: v.error! }));

  return NextResponse.json({
    inserted: totalInserted,
    skipped: totalSkipped,
    total: totalScanned,
    accounts: accountResults,
    ...(errors.length > 0 ? { errors } : {}),
  });
}
