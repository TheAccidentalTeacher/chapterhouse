import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

// PATCH /api/tasks/[id] — update status or fields on a task
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const supabase = getSupabaseServiceRoleClient();
    if (!supabase) return Response.json({ error: "Database not available" }, { status: 503 });

    const { data, error } = await supabase
      .from("tasks")
      .update({ ...body, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) return Response.json({ error: error.message }, { status: 500 });

    // Cascade status to sub-tasks when parent is completed or canceled
    if (body.status === "done" || body.status === "canceled") {
      await supabase
        .from("tasks")
        .update({ status: body.status, updated_at: new Date().toISOString() })
        .eq("parent_id", id)
        .in("status", ["open", "in-progress", "blocked"]);
    }

    return Response.json({ task: data });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

// DELETE /api/tasks/[id] — remove a task
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const supabase = getSupabaseServiceRoleClient();
    if (!supabase) return Response.json({ error: "Database not available" }, { status: 503 });

    const { error } = await supabase.from("tasks").delete().eq("id", id);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
