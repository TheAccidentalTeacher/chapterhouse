/**
 * POST /api/email/archive
 *
 * Archives a single email:
 *   - Gmail accounts → moves to "[Gmail]/All Mail" (removes INBOX label, keeps email)
 *   - NCHO (SiteGround) → deletes permanently (no Archive mailbox on the server)
 *
 * IMAP failure is non-fatal: the DB row is deleted regardless so the UI reflects the action.
 *
 * Body: { id: string }  — Supabase row ID of the email to archive
 *
 * Returns: { success: boolean, imapError?: string }
 */

import { NextResponse } from "next/server";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";
import { getImapClient } from "@/lib/email-client";
import { requireEmailAuth } from "@/lib/email-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

type EmailAccount = "ncho" | "gmail_personal" | "gmail_ncho";

function isGmailAccount(account: string): boolean {
  return account === "gmail_personal" || account === "gmail_ncho";
}

export async function POST(req: Request): Promise<NextResponse> {
  const emailAuth = await requireEmailAuth(req);
  if (!emailAuth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { userId } = emailAuth;

  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Database not available" }, { status: 503 });

  let body: { id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { id } = body;
  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  // Fetch the email row
  const { data: email, error: fetchError } = await supabase
    .from("emails")
    .select("id, uid, email_account")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (fetchError || !email) {
    return NextResponse.json({ error: "Email not found" }, { status: 404 });
  }

  // Attempt IMAP archive/delete
  let imapError: string | undefined;
  const account = email.email_account as EmailAccount;
  const client = getImapClient(account, { socketTimeout: 15000 });

  if (client) {
    try {
      await client.connect();
      const lock = await client.getMailboxLock("INBOX");
      try {
        if (isGmailAccount(account)) {
          // Gmail: move to All Mail (removes INBOX label, keeps the message)
          await client.messageMove(String(email.uid), "[Gmail]/All Mail", { uid: true });
        } else {
          // NCHO SiteGround: no Archive folder — permanently delete
          await client.messageDelete(String(email.uid), { uid: true });
        }
      } finally {
        lock.release();
      }
    } catch (err) {
      imapError = err instanceof Error ? err.message : String(err);
    } finally {
      try {
        await client.logout();
      } catch {
        // ignore logout errors
      }
    }
  }

  // Remove from DB regardless of IMAP result — keeps UI consistent
  await supabase
    .from("emails")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  return NextResponse.json({
    success: true,
    ...(imapError ? { imapError } : {}),
  });
}
