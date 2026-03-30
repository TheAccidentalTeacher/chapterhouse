import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

export async function GET() {
  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) return Response.json({ error: "Unavailable" }, { status: 503 });

  const { data, error } = await supabase
    .from("folio_entries")
    .select("id, entry_date, top_action, track_signals, source_counts, build_duration_ms, tokens_used, created_at")
    .order("entry_date", { ascending: false })
    .limit(30);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ entries: data ?? [] });
}
