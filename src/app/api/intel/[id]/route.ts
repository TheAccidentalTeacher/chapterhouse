import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

// GET /api/intel/[id] — get a single Intel session with full processed_output
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) return Response.json({ error: "id required" }, { status: 400 });

  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) return Response.json({ error: "Database not available" }, { status: 503 });

  const { data, error } = await supabase
    .from("intel_sessions")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return Response.json({ error: error.message }, { status: error.code === "PGRST116" ? 404 : 500 });
  return Response.json({ session: data });
}

// PATCH /api/intel/[id] — update processed_output (e.g., mark seed dismissed/added client-side)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) return Response.json({ error: "id required" }, { status: 400 });

  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) return Response.json({ error: "Database not available" }, { status: 503 });

  const body = await request.json();
  const allowed = ["session_label", "processed_output"];
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (key in body) update[key] = body[key];
  }

  if (Object.keys(update).length === 0) {
    return Response.json({ error: "Nothing to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("intel_sessions")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ session: data });
}

// DELETE /api/intel/[id] — remove a session
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!id) return Response.json({ error: "id required" }, { status: 400 });

  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) return Response.json({ error: "Database not available" }, { status: 503 });

  const { error } = await supabase.from("intel_sessions").delete().eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
