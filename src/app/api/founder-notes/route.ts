import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

// GET /api/founder-notes — list all founder notes
export async function GET() {
  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) return Response.json({ error: "Database not available" }, { status: 503 });

  const { data, error } = await supabase
    .from("founder_notes")
    .select("id, content, category, source, created_at")
    .order("created_at", { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ notes: data ?? [] });
}

// POST /api/founder-notes — save a note
export async function POST(request: Request) {
  try {
    const { content, category = "general", source = "manual" } = await request.json();

    if (!content || typeof content !== "string" || content.trim().length < 2) {
      return Response.json({ error: "content is required" }, { status: 400 });
    }

    const supabase = getSupabaseServiceRoleClient();
    if (!supabase) return Response.json({ error: "Database not available" }, { status: 503 });

    const { data, error } = await supabase
      .from("founder_notes")
      .insert({ content: content.trim(), category, source })
      .select("id, content, category, source, created_at")
      .single();

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ note: data }, { status: 201 });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}

// DELETE /api/founder-notes — delete a note by id
export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) return Response.json({ error: "id is required" }, { status: 400 });

    const supabase = getSupabaseServiceRoleClient();
    if (!supabase) return Response.json({ error: "Database not available" }, { status: 503 });

    const { error } = await supabase.from("founder_notes").delete().eq("id", id);
    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ ok: true });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
