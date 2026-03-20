import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

// GET /api/dreams — list all dreams, optionally filtered by status or category
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const category = searchParams.get("category");

  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) return Response.json({ error: "Database not available" }, { status: 503 });

  let query = supabase
    .from("dreams")
    .select("id, text, notes, status, category, priority_score, source_type, source_label, sort_order, promoted_at, archived_at, created_at, updated_at")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (category) query = query.eq("category", category);

  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ dreams: data ?? [] });
}

// POST /api/dreams — create a new dream seed
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text, notes, status = "seed", category = "general", priority_score = 50, source_type = "manual", source_label } = body;

    if (!text?.trim()) return Response.json({ error: "text is required" }, { status: 400 });

    const supabase = getSupabaseServiceRoleClient();
    if (!supabase) return Response.json({ error: "Database not available" }, { status: 503 });

    // Get the first user (Scott-only app)
    const { data: users } = await supabase.auth.admin.listUsers();
    const userId = users?.users?.[0]?.id;
    if (!userId) return Response.json({ error: "No user found" }, { status: 500 });

    // Put new dreams at the top of their column
    const { data: topDream } = await supabase
      .from("dreams")
      .select("sort_order")
      .eq("status", status)
      .order("sort_order", { ascending: true })
      .limit(1)
      .maybeSingle();

    const sort_order = topDream ? Math.max(0, topDream.sort_order - 10) : 0;

    const { data, error } = await supabase
      .from("dreams")
      .insert({
        user_id: userId,
        text: text.trim(),
        notes: notes?.trim() || null,
        status,
        category,
        priority_score,
        source_type,
        source_label: source_label || `Added manually on ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`,
        sort_order,
      })
      .select()
      .single();

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ dream: data }, { status: 201 });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
