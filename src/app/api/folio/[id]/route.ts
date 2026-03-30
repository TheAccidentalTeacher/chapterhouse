import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) return Response.json({ error: "Unavailable" }, { status: 503 });

  const { data, error } = await supabase
    .from("folio_entries")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!data) return Response.json({ error: "Not found" }, { status: 404 });

  return Response.json({ entry: data });
}
