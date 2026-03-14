import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) {
    return Response.json({ error: "Database not available" }, { status: 503 });
  }

  // Only queued jobs can be cancelled — running jobs are owned by the Railway worker
  const { data: job, error: fetchError } = await supabase
    .from("jobs")
    .select("id, status")
    .eq("id", id)
    .single();

  if (fetchError || !job) {
    return Response.json({ error: "Job not found" }, { status: 404 });
  }

  if (job.status !== "queued") {
    return Response.json(
      { error: `Cannot cancel a job with status '${job.status}' — only 'queued' jobs can be cancelled` },
      { status: 409 }
    );
  }

  const { error: updateError } = await supabase
    .from("jobs")
    .update({ status: "cancelled" })
    .eq("id", id);

  if (updateError) {
    return Response.json({ error: "Failed to cancel job" }, { status: 500 });
  }

  return Response.json({ cancelled: true, jobId: id });
}
