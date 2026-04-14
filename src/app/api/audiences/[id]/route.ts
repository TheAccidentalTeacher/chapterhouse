/**
 * GET/PATCH/DELETE /api/audiences/[id]
 *
 * Phase 28E: Single target audience operations.
 */

import { z } from "zod";
import { handleRouteError } from "@/lib/route-helpers";
import { getAuthenticatedUserId } from "@/lib/auth-context";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

const patchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  demographics: z.record(z.string(), z.unknown()).optional(),
  pain_points: z.array(z.string()).optional(),
  motivations: z.array(z.string()).optional(),
  preferred_tone: z.string().optional(),
  brand_voice_id: z.string().uuid().nullable().optional(),
});

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId().catch(() => null);
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const { id } = await params;
    const supabase = getSupabaseServiceRoleClient();
    if (!supabase) return Response.json({ error: "DB unavailable" }, { status: 500 });

    const { data, error } = await supabase
      .from("target_audiences")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error || !data) return Response.json({ error: "Audience not found" }, { status: 404 });
    return Response.json({ audience: data });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId().catch(() => null);
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const { id } = await params;
    const body = await request.json();
    const parsed = patchSchema.parse(body);

    const supabase = getSupabaseServiceRoleClient();
    if (!supabase) return Response.json({ error: "DB unavailable" }, { status: 500 });

    const { data, error } = await supabase
      .from("target_audiences")
      .update({ ...parsed, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error || !data) return Response.json({ error: "Audience not found" }, { status: 404 });
    return Response.json({ audience: data });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId().catch(() => null);
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const { id } = await params;
    const supabase = getSupabaseServiceRoleClient();
    if (!supabase) return Response.json({ error: "DB unavailable" }, { status: 500 });

    const { error } = await supabase
      .from("target_audiences")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
