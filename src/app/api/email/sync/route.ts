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
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

type EmailAccount = 'ncho' | 'gmail_personal' | 'gmail_ncho';

function getImapClient(account: EmailAccount): ImapFlow | null {
  let host: string | undefined;
  let user: string | undefined;
  let password: string | undefined;

  if (account === 'ncho') {
    host = process.env.NCHO_EMAIL_HOST;
    user = process.env.NCHO_EMAIL_USER;
    password = process.env.NCHO_EMAIL_PASSWORD;
  } else if (account === 'gmail_personal') {
    host = 'imap.gmail.com';
    user = process.env.GMAIL_PERSONAL_USER;
    password = process.env.GMAIL_PERSONAL_APP_PASSWORD;
  } else {
    // gmail_ncho
    host = 'imap.gmail.com';
    user = process.env.GMAIL_NCHO_USER;
    password = process.env.GMAIL_NCHO_APP_PASSWORD;
  }

  if (!host || !user || !password) return null;

  return new ImapFlow({
    host,
    port: 993,
    secure: true,
    auth: { user, pass: password },
    logger: false,
    tls: { rejectUnauthorized: false },
    socketTimeout: 20000,
    greetingTimeout: 8000,
  });
}

function getConfiguredAccounts(): EmailAccount[] {
  const accounts: EmailAccount[] = [];
  if (process.env.NCHO_EMAIL_HOST && process.env.NCHO_EMAIL_USER && process.env.NCHO_EMAIL_PASSWORD) {
    accounts.push('ncho');
  }
  if (process.env.GMAIL_PERSONAL_USER && process.env.GMAIL_PERSONAL_APP_PASSWORD) {
    accounts.push('gmail_personal');
  }
  if (process.env.GMAIL_NCHO_USER && process.env.GMAIL_NCHO_APP_PASSWORD) {
    accounts.push('gmail_ncho');
  }
  return accounts;
}

export async function POST(): Promise<NextResponse> {
  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database not available" }, { status: 503 });
  }

  const { data: usersData } = await supabase.auth.admin.listUsers();
  const userId = usersData?.users?.[0]?.id;
  if (!userId) {
    return NextResponse.json({ error: "No user found" }, { status: 500 });
  }

  const accounts = getConfiguredAccounts();
  if (accounts.length === 0) {
    return NextResponse.json({ error: "No email accounts configured" }, { status: 503 });
  }

  let totalInserted = 0;
  let totalSkipped = 0;
  let totalScanned = 0;
  const accountResults: Record<string, { inserted: number; skipped: number; total: number }> = {};

  for (const account of accounts) {
    const client = getImapClient(account);
    if (!client) continue;

    let inserted = 0;
    let skipped = 0;
    let total = 0;

    try {
      await client.connect();
      const lock = await client.getMailboxLock("INBOX");

      try {
        // Fetch last 30 days of messages
        const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const searchResult = await client.search({ since });

        if (!searchResult || searchResult.length === 0) {
          accountResults[account] = { inserted: 0, skipped: 0, total: 0 };
          continue;
        }

        total = searchResult.length;

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
      console.error(`[email/sync:${account}] Connection failed:`, err);
    } finally {
      try { await client.logout(); } catch { /* ignore disconnect errors */ }
    }

    accountResults[account] = { inserted, skipped, total };
    totalInserted += inserted;
    totalSkipped += skipped;
    totalScanned += total;
  }

  return NextResponse.json({
    inserted: totalInserted,
    skipped: totalSkipped,
    total: totalScanned,
    accounts: accountResults,
  });
}
