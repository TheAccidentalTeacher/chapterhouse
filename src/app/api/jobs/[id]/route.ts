import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) {
    return Response.json({ error: "Database not available" }, { status: 503 });
  }

  const { data: job, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !job) {
    return Response.json({ error: "Job not found" }, { status: 404 });
  }

  // Also fetch child jobs if this is a parent batch job
  let children: unknown[] = [];
  if (!job.parent_job_id) {
    const { data } = await supabase
      .from("jobs")
      .select("id, label, status, progress, progress_message, created_at, completed_at, type")
      .eq("parent_job_id", id)
      .order("created_at", { ascending: true });
    children = data ?? [];
  }

  return Response.json({ job, children });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) {
    return Response.json({ error: "Database not available" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Only allow status updates via PATCH (worker owns other fields)
  const allowed = ["status", "progress_message"];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (body && typeof body === "object" && key in (body as object)) {
      update[key] = (body as Record<string, unknown>)[key];
    }
  }

  if (Object.keys(update).length === 0) {
    return Response.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const { data: job, error } = await supabase
    .from("jobs")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error || !job) {
    return Response.json({ error: "Failed to update job" }, { status: 500 });
  }

  return Response.json({ job });
}
