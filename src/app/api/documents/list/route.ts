/**
 * GET /api/documents/list
 *
 * Returns saved documents for the authenticated user.
 *
 * Query params:
 *   doc_type?: string   — filter by doc type
 *   limit?: number      — default 50, max 100
 *   offset?: number     — pagination offset
 */

import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";
import { getAuthenticatedUserId } from "@/lib/auth-context";

export async function GET(request: Request) {
  const userId = await getAuthenticatedUserId().catch(() => null);
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const doc_type = searchParams.get("doc_type") ?? undefined;
  const limit = Math.min(Number(searchParams.get("limit") ?? "50"), 100);
  const offset = Number(searchParams.get("offset") ?? "0");

  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) {
    return Response.json({ error: "Service unavailable" }, { status: 503 });
  }

  let query = supabase
    .from("documents")
    .select("id, doc_type, title, word_count, created_at, updated_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (doc_type) {
    query = query.eq("doc_type", doc_type);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Documents list error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ documents: data ?? [], offset, limit });
}
