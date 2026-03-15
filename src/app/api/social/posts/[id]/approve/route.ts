import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";
import { z } from "zod";

const approveSchema = z.object({
  scheduled_for: z.string(),
  buffer_profile_id: z.string(),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) return Response.json({ error: "DB unavailable" }, { status: 503 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = approveSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });

  const { scheduled_for, buffer_profile_id } = parsed.data;

  const { data: post, error: fetchErr } = await supabase
    .from("social_posts")
    .select("post_text, hashtags")
    .eq("id", id)
    .single();

  if (fetchErr || !post) return Response.json({ error: "Post not found" }, { status: 404 });

  // Build full post text with hashtags
  const hashtags: string[] = Array.isArray(post.hashtags) ? post.hashtags : [];
  const fullText = hashtags.length
    ? `${post.post_text}\n\n${hashtags.join(" ")}`
    : post.post_text;

  // Push to Buffer
  const bufferToken = process.env.BUFFER_ACCESS_TOKEN;
  if (!bufferToken) return Response.json({ error: "Buffer not configured" }, { status: 503 });

  const form = new URLSearchParams();
  form.append("profile_ids[]", buffer_profile_id);
  form.append("text", fullText);
  form.append("scheduled_at", new Date(scheduled_for).toISOString());

  const bufferRes = await fetch("https://api.bufferapp.com/1/updates/create.json", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${bufferToken}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });

  if (!bufferRes.ok) {
    const detail = await bufferRes.text();
    console.error("[social/approve] Buffer error:", detail);
    return Response.json({ error: "Buffer publish failed", detail }, { status: 502 });
  }

  const bufferData = await bufferRes.json() as { updates?: Array<{ id?: string }> };
  const buffer_update_id = bufferData.updates?.[0]?.id ?? null;

  const { data, error } = await supabase
    .from("social_posts")
    .update({
      status: "scheduled",
      scheduled_for,
      buffer_profile_id,
      buffer_update_id,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ post: data });
}
