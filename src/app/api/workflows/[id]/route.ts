/**
 * GET/PATCH/DELETE /api/workflows/[id]
 *
 * Phase 28B: Single workflow CRUD.
 */

import { z } from "zod";
import { handleRouteError } from "@/lib/route-helpers";
import { getAuthenticatedUserId } from "@/lib/auth-context";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

const VALID_STEP_TYPES = [
  "council_query",
  "intel_fetch",
  "social_generate",
  "doc_generate",
  "enrich",
  "schedule_buffer",
] as const;

const stepSchema = z.object({
  id: z.string().min(1),
  step_type: z.enum(VALID_STEP_TYPES),
  params: z.record(z.string(), z.unknown()),
  output_key: z.string().min(1),
});

const patchSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().optional(),
  steps: z.array(stepSchema).min(1).max(20).optional(),
  trigger_type: z.enum(["manual", "cron", "webhook"]).optional(),
  trigger_config: z.record(z.string(), z.unknown()).optional(),
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
      .from("workflows")
      .select("*")
      .eq("id", id)
      .eq("user_id", userId)
      .single();

    if (error || !data) return Response.json({ error: "Workflow not found" }, { status: 404 });
    return Response.json({ workflow: data });
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
      .from("workflows")
      .update({ ...parsed, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId)
      .select()
      .single();

    if (error || !data) return Response.json({ error: "Workflow not found" }, { status: 404 });
    return Response.json({ workflow: data });
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

    // Soft delete
    const { error } = await supabase
      .from("workflows")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("user_id", userId);

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ ok: true });
  } catch (error) {
    return handleRouteError(error);
  }
}
