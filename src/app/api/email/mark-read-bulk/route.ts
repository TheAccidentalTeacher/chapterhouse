/**
 * POST /api/email/mark-read-bulk
 *
 * Marks a batch of emails as read (\\Seen) on IMAP.
 * Groups by account so we only need one connection per account.
 *
 * Body: { emails: Array<{ uid: number; account: string }> }
 * Returns: { marked: number; failed: number; byAccount: Record<string, number> }
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { getImapClient, type EmailAccount } from "@/lib/email-client";
import { requireEmailAuth } from "@/lib/email-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const bodySchema = z.object({
  emails: z.array(
    z.object({
      uid: z.number().int().positive(),
      account: z.string().min(1),
    })
  ).min(1),
});

export async function POST(req: Request): Promise<NextResponse> {
  const emailAuth = await requireEmailAuth(req);
  if (!emailAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const { emails } = parsed.data;

  // Group UIDs by account
  const grouped = new Map<string, number[]>();
  for (const { uid, account } of emails) {
    if (!grouped.has(account)) grouped.set(account, []);
    grouped.get(account)!.push(uid);
  }

  let marked = 0;
  let failed = 0;
  const byAccount: Record<string, number> = {};

  for (const [account, uids] of grouped.entries()) {
    const client = getImapClient(account as EmailAccount, { socketTimeout: 15000 });
    if (!client) {
      failed += uids.length;
      byAccount[account] = 0;
      continue;
    }

    try {
      await client.connect();
      const lock = await client.getMailboxLock("INBOX");
      try {
        // Pass all UIDs as a comma-separated string in one round-trip
        await client.messageFlagsAdd(uids.join(","), ["\\Seen"], { uid: true });
        marked += uids.length;
        byAccount[account] = uids.length;
      } finally {
        lock.release();
      }
    } catch (err) {
      console.error(`[mark-read-bulk] IMAP error on ${account}:`, err);
      failed += uids.length;
      byAccount[account] = 0;
    } finally {
      try {
        await client.logout();
      } catch {
        // ignore logout errors
      }
    }
  }

  return NextResponse.json({ marked, failed, byAccount });
}
