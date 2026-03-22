/**
 * GET /api/email/persisted/[uid]?account=<account>
 *
 * Fetches a full email from the Supabase `emails` table.
 * Used by the AI/categorized inbox view — the full body is already synced and
 * stored, so there is no need to open an IMAP connection.
 *
 * This is the counterpart to /api/email/messages/[uid] (which uses live IMAP
 * and only works for the NCHO Mailcow account).
 *
 * Also marks the email as read in Supabase (`is_read = true`).
 * Returns the FullMessage shape used by the inbox message pane.
 *
 * Auth: Supabase session cookie (browser) OR Bearer CRON_SECRET.
 */
import { NextResponse } from "next/server";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";
import { requireEmailAuth } from "@/lib/email-auth";
import type { FullMessage } from "@/lib/email-client";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ uid: string }> }
) {
  const emailAuth = await requireEmailAuth(req);
  if (!emailAuth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { userId } = emailAuth;

  const { uid: uidParam } = await params;
  const uid = parseInt(uidParam, 10);
  if (isNaN(uid) || uid <= 0) {
    return NextResponse.json({ error: "Invalid UID" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const account = searchParams.get("account") ?? "ncho";

  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database not available" }, { status: 503 });
  }

  const { data: row, error } = await supabase
    .from("emails")
    .select(
      "id, uid, subject, from_name, from_address, to_address, received_at, is_read, has_attachment, text_body, html_body, email_account"
    )
    .eq("user_id", userId)
    .eq("email_account", account)
    .eq("uid", uid)
    .single();

  if (error || !row) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  // Mark as read in Supabase (fire-and-forget — don't block the response)
  if (!row.is_read) {
    void supabase
      .from("emails")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("email_account", account)
      .eq("uid", uid);
  }

  const message: FullMessage = {
    uid: row.uid as number,
    subject: (row.subject as string) || "(no subject)",
    from: (row.from_name as string) || (row.from_address as string) || "Unknown",
    fromAddress: (row.from_address as string) || "",
    to: (row.to_address as string) || "",
    toAddress: (row.to_address as string) || "",
    date: (row.received_at as string) || new Date().toISOString(),
    isRead: true,
    hasAttachment: false, // stored emails don't expose attachment objects
    text: (row.text_body as string | null) ?? null,
    html: (row.html_body as string | null) ?? null,
    email_account: row.email_account as string | undefined,
    supabaseId: row.id as string,
  };

  return NextResponse.json(message);
}
