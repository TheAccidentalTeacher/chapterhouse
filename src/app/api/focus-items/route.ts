import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

const MAX_ITEMS = 10;

export async function GET() {
  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) return Response.json({ error: "DB not configured" }, { status: 500 });

  const { data, error } = await supabase
    .from("focus_items")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data ?? []);
}

export async function POST(req: Request) {
  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) return Response.json({ error: "DB not configured" }, { status: 500 });

  // Get the first user (Scott-only app)
  const { data: users } = await supabase.auth.admin.listUsers();
  const userId = users?.users?.[0]?.id;
  if (!userId) return Response.json({ error: "No user found" }, { status: 500 });

  const body = await req.json();
  const content = (body.content ?? "").trim();
  if (!content) return Response.json({ error: "content required" }, { status: 400 });

  // Enforce 10-item cap
  const { count } = await supabase
    .from("focus_items")
    .select("id", { count: "exact", head: true });

  if ((count ?? 0) >= MAX_ITEMS) {
    return Response.json({ error: "Maximum 10 items. Delete one first." }, { status: 409 });
  }

  const { data, error } = await supabase
    .from("focus_items")
    .insert({
      content,
      source: body.source ?? "manual",
      sort_order: body.sort_order ?? (count ?? 0),
      user_id: userId,
    })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}
