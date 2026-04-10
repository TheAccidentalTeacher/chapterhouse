/**
 * POST /api/email/bulk-triage
 *
 * Fetches a large batch of emails from IMAP and persists new ones to Supabase.
 * Unlike /api/email/sync, this route:
 *   - Does NOT purge old emails
 *   - Does NOT filter by date (fetches all, up to limit)
 *   - Uses a higher default fetch limit (200, max 500)
 *
 * Use this to bulk-ingest a backlog of messages that sync missed.
 * After triage, run /api/email/categorize to AI-tag the new rows.
 *
 * Body: { limit?: number }   — defaults to 200, max 500
 * Returns: { fetched: number, inserted: number, skipped: number, byAccount: Record<string, {fetched: number, inserted: number}> }
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

  // Parse limit — default 200, max 500
  let limit = 200;
  try {
    const body = await req.json().catch(() => ({})) as { limit?: unknown };
    if (typeof body.limit === "number") {
      limit = Math.min(Math.max(1, Math.floor(body.limit)), 500);
    }
  } catch {
    // use default
  }

  let totalFetched = 0;
  let totalInserted = 0;
  let totalSkipped = 0;
  const byAccount: Record<string, { fetched: number; inserted: number }> = {};

  for (const account of accounts) {
    const client = getImapClient(account, { socketTimeout: 20000 });
    if (!client) continue;

    let acctFetched = 0;
    let acctInserted = 0;

    try {
      await client.connect();
      const lock = await client.getMailboxLock("INBOX");

      try {
        const mb = client.mailbox;
        const totalMessages =
          mb && typeof mb === "object" && "exists" in mb ? (mb.exists as number) : 0;

        if (totalMessages === 0) {
          byAccount[account] = { fetched: 0, inserted: 0 };
          continue;
        }

        // Fetch the last `limit` messages by sequence number (most recently arrived)
        const fetchLimit = Math.min(totalMessages, limit);
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

        for await (const msg of client.fetch(seqRange, {
          envelope: true,
          internalDate: true,
          uid: true,
          source: true,
          flags: true,
          bodyStructure: true,
        })) {
          acctFetched++;
          try {
            const env = msg.envelope;
            const internalDate = msg.internalDate ? new Date(msg.internalDate) : null;
            const fromEntry = env?.from?.[0];
            const toEntry = env?.to?.[0];

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
            console.warn(`[email/bulk-triage:${account}] Failed to parse UID ${msg.uid}:`, parseErr);
          }
        }

        // Dedup against existing rows for this account
        if (rows.length > 0) {
          const allUids = rows.map((r) => r.uid);
          const { data: existingRows } = await supabase
            .from("emails")
            .select("uid")
            .eq("user_id", userId)
            .eq("email_account", account)
            .in("uid", allUids);

          const existingUids = new Set((existingRows ?? []).map((r) => r.uid as number));
          const newRows = rows.filter((r) => !existingUids.has(r.uid));
          totalSkipped += rows.length - newRows.length;

          if (newRows.length > 0) {
            const { error: insertError } = await supabase
              .from("emails")
              .upsert(newRows, { onConflict: "user_id,email_account,uid", ignoreDuplicates: true });

            if (!insertError) {
              acctInserted = newRows.length;
            } else {
              console.error(`[email/bulk-triage:${account}] Upsert failed:`, insertError);
            }
          }
        }
      } finally {
        lock.release();
      }
    } catch (err) {
      console.error(`[email/bulk-triage:${account}] Connection failed:`, err instanceof Error ? err.message : String(err));
    } finally {
      try { await client.logout(); } catch { /* ignore */ }
    }

    byAccount[account] = { fetched: acctFetched, inserted: acctInserted };
    totalFetched += acctFetched;
    totalInserted += acctInserted;
  }

  return NextResponse.json({
    fetched: totalFetched,
    inserted: totalInserted,
    skipped: totalSkipped,
    byAccount,
  });
}
