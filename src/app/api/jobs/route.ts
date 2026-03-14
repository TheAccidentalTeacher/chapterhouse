import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

export async function GET(req: Request) {
  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) {
    return Response.json({ error: "Database not available" }, { status: 503 });
  }

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const parentId = url.searchParams.get("parent_id");

  let query = supabase
    .from("jobs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (status) {
    query = query.eq("status", status);
  }

  if (parentId) {
    query = query.eq("parent_job_id", parentId);
  } else {
    // By default, only return top-level (non-child) jobs in the main list
    // Child jobs are loaded separately when viewing a batch
    query = query.is("parent_job_id", null);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[jobs] GET error:", error);
    return Response.json({ error: "Failed to fetch jobs" }, { status: 500 });
  }

  return Response.json({ jobs: data ?? [] });
}
