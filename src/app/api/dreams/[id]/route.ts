import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

// GET /api/dreams/[id]
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) return Response.json({ error: "Database not available" }, { status: 503 });

  const { data, error } = await supabase.from("dreams").select("*").eq("id", id).single();
  if (error) return Response.json({ error: error.message }, { status: 404 });
  return Response.json({ dream: data });
}

// PATCH /api/dreams/[id] — update any fields
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const supabase = getSupabaseServiceRoleClient();
    if (!supabase) return Response.json({ error: "Database not available" }, { status: 503 });

    // Build the update payload — only include explicitly provided fields
    const allowed = ["text", "notes", "status", "category", "priority_score", "sort_order", "source_label"];
    const updates: Record<string, unknown> = {};
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }

    if (Object.keys(updates).length === 0) {
      return Response.json({ error: "No valid fields to update" }, { status: 400 });
    }

    // Track lifecycle timestamps on status changes
    if (updates.status) {
      const newStatus = updates.status as string;
      if (newStatus === "active" || newStatus === "building") {
        // Fetch current to check if it was previously a seed
        const { data: current } = await supabase.from("dreams").select("status, promoted_at").eq("id", id).single();
        if (current && !current.promoted_at && current.status === "seed") {
          updates.promoted_at = new Date().toISOString();
        }
      }
      if (newStatus === "archived" || newStatus === "dismissed") {
        updates.archived_at = new Date().toISOString();
      }
    }

    const { data, error } = await supabase
      .from("dreams")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ dream: data });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

// DELETE /api/dreams/[id] — permanent delete (use archive/dismiss for soft removal)
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) return Response.json({ error: "Database not available" }, { status: 503 });

  const { error } = await supabase.from("dreams").delete().eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ deleted: true });
}
