import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

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

  const source = body.source ?? "manual";

  // Manual items float to top; AI items append to bottom
  let sortOrder: number;
  if (source === "manual") {
    const { data: minRow } = await supabase
      .from("focus_items")
      .select("sort_order")
      .order("sort_order", { ascending: true })
      .limit(1)
      .maybeSingle();
    sortOrder = ((minRow?.sort_order as number | null) ?? 1) - 1;
  } else {
    const { data: maxRow } = await supabase
      .from("focus_items")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    sortOrder = ((maxRow?.sort_order as number | null) ?? -1) + 1;
  }

  const { data, error } = await supabase
    .from("focus_items")
    .insert({
      content,
      source,
      sort_order: sortOrder,
      user_id: userId,
    })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}
