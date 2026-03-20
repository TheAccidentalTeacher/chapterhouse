import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

// GET /api/dream-log — get all log entries, newest first
export async function GET() {
  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) return Response.json({ error: "Database not available" }, { status: 503 });

  const { data, error } = await supabase
    .from("dream_log")
    .select("id, entry_date, content, mood, created_at, updated_at")
    .order("entry_date", { ascending: false })
    .limit(30);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ entries: data ?? [] });
}

// POST /api/dream-log — upsert today's entry (one per day)
export async function POST(request: Request) {
  try {
    const { content, mood, entry_date } = await request.json();

    if (!content?.trim()) return Response.json({ error: "content is required" }, { status: 400 });

    const supabase = getSupabaseServiceRoleClient();
    if (!supabase) return Response.json({ error: "Database not available" }, { status: 503 });

    const { data: users } = await supabase.auth.admin.listUsers();
    const userId = users?.users?.[0]?.id;
    if (!userId) return Response.json({ error: "No user found" }, { status: 500 });

    const date = entry_date || new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("dream_log")
      .upsert(
        { user_id: userId, entry_date: date, content: content.trim(), mood: mood || null },
        { onConflict: "user_id,entry_date" }
      )
      .select()
      .single();

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ entry: data }, { status: 201 });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
