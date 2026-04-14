/**
 * PUT /api/context-files/[id] — Update a context file
 * DELETE /api/context-files/[id] — Delete a context file
 *
 * Phase 23A: Knowledge Base UI
 */

import { z } from "zod";
import { handleRouteError } from "@/lib/route-helpers";
import { getAuthenticatedUserId } from "@/lib/auth-context";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

const updateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().optional(),
  document_type: z.string().min(1).max(50).optional(),
  inject_order: z.number().int().min(0).max(100).optional(),
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
      .from("context_files")
      .update({ ...parsed, updated_at: new Date().toISOString() })
      .eq("id", id)
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
      .from("context_files")
      .delete()
      .eq("id", id);

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
