/**
 * POST /api/email/mark-read
 *
 * Marks a single email as read — sets \Seen flag via IMAP and updates the DB row.
 * IMAP failure is non-fatal: DB is updated regardless so the UI stays consistent.
 *
 * Body: { id: string }  — Supabase row ID of the email to mark read
 *
 * Returns: { success: boolean, alreadyRead?: boolean, imapError?: string }
 */

import { NextResponse } from "next/server";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";
import { getImapClient } from "@/lib/email-client";
import { requireEmailAuth } from "@/lib/email-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

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
    .select("id, uid, email_account, is_read")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (fetchError || !email) {
    return NextResponse.json({ error: "Email not found" }, { status: 404 });
  }

  if (email.is_read) {
    return NextResponse.json({ success: true, alreadyRead: true });
  }

  // Attempt IMAP flag
  let imapError: string | undefined;
  const client = getImapClient(email.email_account as "ncho" | "gmail_personal" | "gmail_ncho", {
    socketTimeout: 15000,
  });

  if (client) {
    try {
      await client.connect();
      const lock = await client.getMailboxLock("INBOX");
      try {
        await client.messageFlagsAdd(String(email.uid), ["\\Seen"], { uid: true });
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

  // Update DB regardless of IMAP result
  await supabase
    .from("emails")
    .update({ is_read: true })
    .eq("id", id)
    .eq("user_id", userId);

  return NextResponse.json({
    success: true,
    ...(imapError ? { imapError } : {}),
  });
}
