/**
 * PUT /api/watch-urls/[id] — Update a watch URL
 * DELETE /api/watch-urls/[id] — Delete a watch URL
 *
 * Phase 23B: Watch URLs
 */

import { z } from "zod";
import { handleRouteError } from "@/lib/route-helpers";
import { getAuthenticatedUserId } from "@/lib/auth-context";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

const updateSchema = z.object({
  url: z.string().url().max(2048).optional(),
  label: z.string().min(1).max(200).optional(),
  check_interval: z.enum(["daily", "weekly", "monthly"]).optional(),
  is_active: z.boolean().optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const userId = await getAuthenticatedUserId().catch(() => null);
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const { id } = await params;
    const supabase = getSupabaseServiceRoleClient();
    if (!supabase) return Response.json({ error: "DB unavailable" }, { status: 500 });

    const body = await request.json();
    const parsed = updateSchema.parse(body);

    const { data, error } = await supabase
      .from("watch_urls")
      .update({ ...parsed, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json(data);
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const userId = await getAuthenticatedUserId().catch(() => null);
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const { id } = await params;
    const supabase = getSupabaseServiceRoleClient();
    if (!supabase) return Response.json({ error: "DB unavailable" }, { status: 500 });

    const { error } = await supabase
      .from("watch_urls")
      .delete()
      .eq("id", id)
      .eq("user_id", userId);

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
