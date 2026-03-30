/**
 * GET    /api/documents/[id]  — fetch a single saved document
 * PATCH  /api/documents/[id]  — update title or content
 * DELETE /api/documents/[id]  — delete a saved document
 */

import { z } from "zod";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";
import { getAuthenticatedUserId } from "@/lib/auth-context";

type Params = { params: Promise<{ id: string }> };

// ── GET ───────────────────────────────────────────────────────────────────────

export async function GET(_request: Request, { params }: Params) {
  const userId = await getAuthenticatedUserId().catch(() => null);
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) return Response.json({ error: "Service unavailable" }, { status: 503 });

  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json(data);
}

// ── PATCH ─────────────────────────────────────────────────────────────────────

const patchSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
}).refine((d) => d.title !== undefined || d.content !== undefined, {
  message: "Provide at least one of: title, content",
});

export async function PATCH(request: Request, { params }: Params) {
  const userId = await getAuthenticatedUserId().catch(() => null);
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) return Response.json({ error: "Service unavailable" }, { status: 503 });

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (parsed.data.title !== undefined) updates.title = parsed.data.title;
  if (parsed.data.content !== undefined) {
    updates.content = parsed.data.content;
    updates.word_count = parsed.data.content.trim().split(/\s+/).length;
  }

  const { data, error } = await supabase
    .from("documents")
    .update(updates)
    .eq("id", id)
    .eq("user_id", userId)
    .select()
    .single();

  if (error || !data) {
    return Response.json({ error: error?.message ?? "Not found" }, { status: error ? 500 : 404 });
  }

  return Response.json(data);
}

// ── DELETE ────────────────────────────────────────────────────────────────────

export async function DELETE(_request: Request, { params }: Params) {
  const userId = await getAuthenticatedUserId().catch(() => null);
  if (!userId) return new Response("Unauthorized", { status: 401 });

  const { id } = await params;
  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) return Response.json({ error: "Service unavailable" }, { status: 503 });

  const { error } = await supabase
    .from("documents")
    .delete()
    .eq("id", id)
    .eq("user_id", userId);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}
