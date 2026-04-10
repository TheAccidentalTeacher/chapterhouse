/**
 * POST /api/email/bulk-archive
 *
 * Archives all emails of a given category (e.g. "newsletter", "spam", "notification").
 *
 * - Gmail accounts → moves each message to "[Gmail]/All Mail"
 * - NCHO SiteGround → permanently deletes each message
 *
 * IMAP failures per message are counted but non-fatal. DB rows are removed regardless.
 *
 * Body:
 *   {
 *     category: string,       — required; one of the 10 valid categories
 *     account?: string,       — optional; restrict to one account
 *     dryRun?: boolean        — optional; if true, returns count without doing anything
 *   }
 *
 * Returns:
 *   {
 *     archived: number,
 *     failed: number,
 *     byAccount: Record<string, number>,
 *     dryRun: boolean
 *   }
 */

import { NextResponse } from "next/server";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";
import { getImapClient } from "@/lib/email-client";
import { requireEmailAuth } from "@/lib/email-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const VALID_CATEGORIES = new Set([
  "spam", "newsletter", "notification", "vendor",
  "sales_inquiry", "customer", "order", "media", "internal", "other",
]);

type EmailAccount = "ncho" | "gmail_personal" | "gmail_ncho";

function isGmailAccount(account: string): boolean {
  return account === "gmail_personal" || account === "gmail_ncho";
}

interface EmailRow {
  id: string;
  uid: number;
  email_account: string;
}

export async function POST(req: Request): Promise<NextResponse> {
  const emailAuth = await requireEmailAuth(req);
  if (!emailAuth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { userId } = emailAuth;

  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Database not available" }, { status: 503 });

  let body: { category?: string; account?: string; dryRun?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { category, account: filterAccount, dryRun = false } = body;

  if (!category || !VALID_CATEGORIES.has(category)) {
    return NextResponse.json(
      { error: `category must be one of: ${[...VALID_CATEGORIES].join(", ")}` },
      { status: 400 },
    );
  }

  // Fetch all emails matching this category
  let query = supabase
    .from("emails")
    .select("id, uid, email_account")
    .eq("user_id", userId)
    .eq("category", category);

  if (filterAccount) {
    query = query.eq("email_account", filterAccount);
  }

  const { data: emails, error: fetchError } = await query;
  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  const rows = (emails ?? []) as EmailRow[];

  // Dry run — return count only
  if (dryRun) {
    return NextResponse.json({ dryRun: true, wouldArchive: rows.length });
  }

  if (rows.length === 0) {
    return NextResponse.json({ archived: 0, failed: 0, byAccount: {}, dryRun: false });
  }

  // Group by account for efficient IMAP connections
  const byAccount = new Map<string, EmailRow[]>();
  for (const row of rows) {
    const acc = row.email_account;
    if (!byAccount.has(acc)) byAccount.set(acc, []);
    byAccount.get(acc)!.push(row);
  }

  let totalFailed = 0;
  const countByAccount: Record<string, number> = {};

  // Process each account's batch
  for (const [account, accountRows] of byAccount) {
    const accSucceeded: string[] = [];
    countByAccount[account] = 0;

    const client = getImapClient(account as EmailAccount, { socketTimeout: 20000 });
    if (!client) {
      // No IMAP client configured for this account — still delete from DB
      totalFailed += accountRows.length;
      continue;
    }

    try {
      await client.connect();
      const lock = await client.getMailboxLock("INBOX");
      try {
        for (const row of accountRows) {
          try {
            if (isGmailAccount(account)) {
              await client.messageMove(String(row.uid), "[Gmail]/All Mail", { uid: true });
            } else {
              await client.messageDelete(String(row.uid), { uid: true });
            }
            accSucceeded.push(row.id);
            countByAccount[account]++;
          } catch {
            totalFailed++;
          }
        }
      } finally {
        lock.release();
      }
    } catch {
      totalFailed += accountRows.length;
    } finally {
      try {
        await client.logout();
      } catch {
        // ignore
      }
    }

    void accSucceeded; // IMAP success tracked but DB deletion covers all rows (see below)
  }

  // DB: remove ALL rows from this category regardless of IMAP outcome
  const allIds = rows.map((r) => r.id);
  await supabase
    .from("emails")
    .delete()
    .in("id", allIds)
    .eq("user_id", userId);

  return NextResponse.json({
    archived: rows.length - totalFailed,
    failed: totalFailed,
    byAccount: countByAccount,
    dryRun: false,
  });
}
