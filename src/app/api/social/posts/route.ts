import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

export async function GET(req: Request) {
  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) return Response.json({ error: "DB unavailable" }, { status: 503 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const brand = searchParams.get("brand");

  let query = supabase
    .from("social_posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (status) query = query.eq("status", status);
  if (brand) query = query.eq("brand", brand);

  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ posts: data });
}
