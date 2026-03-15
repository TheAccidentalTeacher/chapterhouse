import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";
import { z } from "zod";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) return Response.json({ error: "DB unavailable" }, { status: 503 });

  const patchSchema = z.object({
    post_text: z.string().optional(),
    hashtags: z.array(z.string()).optional(),
    image_brief: z.string().nullable().optional(),
    scheduled_for: z.string().nullable().optional(),
  });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });

  // Fetch current post to build edit_history
  const { data: existing, error: fetchErr } = await supabase
    .from("social_posts")
    .select("post_text, hashtags, edit_history")
    .eq("id", id)
    .single();

  if (fetchErr || !existing) return Response.json({ error: "Post not found" }, { status: 404 });

  const editHistoryEntry = {
    saved_at: new Date().toISOString(),
    post_text: existing.post_text,
    hashtags: existing.hashtags,
  };

  const editHistory: unknown[] = Array.isArray(existing.edit_history)
    ? [...existing.edit_history, editHistoryEntry]
    : [editHistoryEntry];

  const { data, error } = await supabase
    .from("social_posts")
    .update({ ...parsed.data, edit_history: editHistory })
    .eq("id", id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ post: data });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) return Response.json({ error: "DB unavailable" }, { status: 503 });

  const { error } = await supabase
    .from("social_posts")
    .update({ status: "rejected" })
    .eq("id", id);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ success: true });
}
