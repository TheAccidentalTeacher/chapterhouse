/**
 * GET /api/email/action-items
 *
 * Lightweight endpoint that returns the top 5 unread action-required emails.
 * Used by the EmailActionBanner component on the home page.
 *
 * Returns: { items: Array<{ id, subject, from_name, category, urgency }>, count: number }
 */

import { NextResponse } from "next/server";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";
import { requireEmailAuth } from "@/lib/email-auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request): Promise<NextResponse> {
  const emailAuth = await requireEmailAuth(req);
  if (!emailAuth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { userId } = emailAuth;

  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database not available" }, { status: 503 });
  }

  // Total count of unread action items
  const { count } = await supabase
    .from("emails")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("action_required", true)
    .eq("is_read", false);

  // Top 5 for display
  const { data: items } = await supabase
    .from("emails")
    .select("id, subject, from_name, from_address, category, urgency, email_account")
    .eq("user_id", userId)
    .eq("action_required", true)
    .eq("is_read", false)
    .order("urgency", { ascending: false })
    .order("received_at", { ascending: false })
    .limit(5);

  return NextResponse.json({
    items: (items ?? []).map((e) => ({
      id: e.id,
      subject: e.subject,
      from_name: e.from_name || e.from_address,
      category: e.category,
      urgency: e.urgency,
      email_account: e.email_account,
    })),
    count: count ?? 0,
  });
}
