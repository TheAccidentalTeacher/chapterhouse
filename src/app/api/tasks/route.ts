import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

// GET /api/tasks — list all tasks, newest first
export async function GET() {
  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) return Response.json({ error: "Database not available" }, { status: 503 });

  const { data, error } = await supabase
    .from("tasks")
    .select("id, title, description, source_type, source_id, source_title, status, parent_id, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ tasks: data ?? [] });
}

// POST /api/tasks — create a task
export async function POST(request: Request) {
  try {
    const { title, description, source_type, source_id, source_title, parent_id } = await request.json();
    if (!title?.trim()) return Response.json({ error: "title is required" }, { status: 400 });

    const supabase = getSupabaseServiceRoleClient();
    if (!supabase) return Response.json({ error: "Database not available" }, { status: 503 });

    const { data, error } = await supabase
      .from("tasks")
      .insert({ title: title.trim(), description, source_type, source_id, source_title, status: "open", ...(parent_id ? { parent_id } : {}) })
      .select()
      .single();

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ task: data }, { status: 201 });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
