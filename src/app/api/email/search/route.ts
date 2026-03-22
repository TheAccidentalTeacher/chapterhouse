/**
 * GET /api/email/search?q=<query>&category=<category>&page=<page>&limit=<limit>
 *
 * Full-text search across the persisted emails table using Postgres tsvector.
 * Also supports filtering by category (e.g. ?category=sales_inquiry).
 * Used by the email inbox search bar.
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

  const { searchParams } = new URL(req.url);
  const query = (searchParams.get("q") ?? "").trim();
  const category = searchParams.get("category") ?? "";
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "30", 10)));
  const offset = (page - 1) * limit;

  let dbQuery = supabase
    .from("emails")
    .select(
      "id, uid, subject, from_name, from_address, received_at, is_read, has_attachment, snippet, category, ai_summary, action_required, urgency, email_account",
      { count: "exact" }
    )
    .eq("user_id", userId)
    .order("received_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (query) {
    // Use Postgres full-text search on the generated search_vector column
    // phraseto_tsquery handles multi-word phrases; plainto_tsquery for loose terms
    dbQuery = dbQuery.textSearch("search_vector", query, {
      type: "plain",
      config: "english",
    });
  }

  if (category) {
    dbQuery = dbQuery.eq("category", category);
  }

  const account = searchParams.get("account") ?? "";
  if (account && account !== "all") {
    dbQuery = dbQuery.eq("email_account", account);
  }

  const { data: emails, error, count } = await dbQuery;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    emails: emails ?? [],
    total: count ?? 0,
    page,
    limit,
  });
}
