import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) return Response.json({ error: "DB not configured" }, { status: 500 });

  // Single row per user — just grab the first
  const { data, error } = await supabase
    .from("scratch_notes")
    .select("*")
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") {
    // PGRST116 = no rows — that's fine, return empty
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json(data ?? { content: "" });
}

export async function POST(req: Request) {
  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) return Response.json({ error: "DB not configured" }, { status: 500 });

  // Get the first user (Scott-only app)
  const { data: users } = await supabase.auth.admin.listUsers();
  const userId = users?.users?.[0]?.id;
  if (!userId) return Response.json({ error: "No user found" }, { status: 500 });

  const body = await req.json();
  const content = body.content ?? "";

  // Upsert — single row per user
  const { data, error } = await supabase
    .from("scratch_notes")
    .upsert(
      {
        user_id: userId,
        content,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}
