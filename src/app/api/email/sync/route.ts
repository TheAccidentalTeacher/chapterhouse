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
  const accountResults: Record<string, { inserted: number; skipped: number; total: number; fetchedCount: number; parseErrors: number; rowsBuilt: number; upsertError?: string; error?: string }> = {};

  for (const account of accounts) {
    const client = getImapClient(account, { socketTimeout: 20000 });
    if (!client) continue;

    let inserted = 0;
    let skipped = 0;
    let total = 0;
    let accountError: string | undefined;
    // Diagnostic counters — identify exactly where Gmail 0-insertions happen
    let fetchedCount = 0;   // msgs the for-await loop actually yielded
    let parseErrors = 0;    // msgs that threw inside the body-parse try-catch
    let rowsBuilt = 0;      // rows ready for upsert after the loop
    let upsertErrorMsg: string | undefined; // Supabase upsert error message

    try {
      await client.connect();
      const lock = await client.getMailboxLock("INBOX");

      try {
        // 7-day recency window for filtering
        const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        // Use IMAP sequence numbers — NOT SEARCH SINCE, NOT UID ordering.
        // Sequence numbers ARE chronologically ordered (highest = most recent).
        // This sidesteps Gmail's broken SEARCH SINCE (returns 412 ancient UIDs)
        // and non-chronological UID assignment.
        const mb = client.mailbox;
        const totalMessages = mb && typeof mb === "object" && "exists" in mb ? (mb.exists as number) : 0;
        total = totalMessages;

        if (totalMessages === 0) {
          accountResults[account] = { inserted: 0, skipped: 0, total: 0, fetchedCount: 0, parseErrors: 0, rowsBuilt: 0 };
          continue;
        }

        // Fetch the last 50 messages by sequence number (most recently arrived)
        const fetchLimit = Math.min(totalMessages, 50);
        const startSeq = Math.max(1, totalMessages - fetchLimit + 1);
        const seqRange = `${startSeq}:*`;

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

        // Fetch by SEQUENCE NUMBER — no { uid: true } third arg.
        // uid: true in the second arg means "include UID in response data".
        for await (const msg of client.fetch(seqRange, {
          envelope: true,
          internalDate: true,
          uid: true,
          source: true,
          flags: true,
          bodyStructure: true,
        })) {
          fetchedCount++;
          try {
            const env = msg.envelope;
            const internalDate = msg.internalDate ? new Date(msg.internalDate) : null;
            if (internalDate && internalDate < since) {
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
              received_at: (internalDate ?? env?.date ?? new Date()).toISOString(),
              has_attachment: hasAttachment,
              is_read: msg.flags?.has("\\Seen") ?? false,
              snippet,
              text_body: textBody ? textBody.slice(0, 50000) : null,
              html_body: htmlBody ? htmlBody.slice(0, 100000) : null,
            });
          } catch (parseErr) {
            parseErrors++;
            console.warn(`[email/sync:${account}] Failed to parse UID ${msg.uid}:`, parseErr);
          }
        }

        // Dedup: remove rows whose UIDs are already stored for this account
        if (rows.length > 0) {
          const allUids = rows.map((r) => r.uid);
          const { data: existingRows } = await supabase
            .from("emails")
            .select("uid")
            .eq("user_id", userId)
            .eq("email_account", account)
            .in("uid", allUids);

          const existingUids = new Set((existingRows ?? []).map((r) => r.uid as number));
          const beforeDedup = rows.length;
          for (let i = rows.length - 1; i >= 0; i--) {
            if (existingUids.has(rows[i].uid)) {
              rows.splice(i, 1);
            }
          }
          skipped += beforeDedup - rows.length;
        }

        rowsBuilt = rows.length;
        if (rows.length > 0) {
          // Upsert — conflict on (user_id, email_account, uid) is a no-op
          const { error: insertError } = await supabase
            .from("emails")
            .upsert(rows, { onConflict: "user_id,email_account,uid", ignoreDuplicates: true });

          if (insertError) {
            upsertErrorMsg = insertError.message;
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

    accountResults[account] = {
      inserted, skipped, total,
      // diagnostic fields — shows exactly where Gmail insertions stall
      fetchedCount, parseErrors, rowsBuilt,
      ...(upsertErrorMsg ? { upsertError: upsertErrorMsg } : {}),
      ...(accountError ? { error: accountError } : {}),
    };
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
