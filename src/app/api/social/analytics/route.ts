import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

export async function POST() {
  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) return Response.json({ error: "DB unavailable" }, { status: 503 });

  const bufferToken = process.env.BUFFER_ACCESS_TOKEN;
  if (!bufferToken) return Response.json({ error: "Buffer not configured" }, { status: 503 });

  const { data: published, error } = await supabase
    .from("social_posts")
    .select("id, buffer_update_id")
    .eq("status", "published")
    .not("buffer_update_id", "is", null);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!published || published.length === 0) return Response.json({ updated: 0 });

  let updated = 0;
  for (const post of published) {
    try {
      const res = await fetch(
        `https://api.bufferapp.com/1/updates/${post.buffer_update_id}.json`,
        { headers: { Authorization: `Bearer ${bufferToken}` } }
      );
      if (!res.ok) continue;
      const data = await res.json() as {
        statistics?: { reach?: number; clicks?: number; likes?: number; comments?: number; shares?: number };
      };
      if (!data.statistics) continue;

      await supabase
        .from("social_posts")
        .update({ buffer_stats: data.statistics })
        .eq("id", post.id);
      updated++;
    } catch (err) {
      console.error("[social/analytics] fetch error for", post.buffer_update_id, err);
    }
  }

  return Response.json({ updated });
}
