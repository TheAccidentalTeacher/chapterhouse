/**
 * GET/POST /api/workflows
 *
 * Phase 28B: Composable AI Workflows — list + create.
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

const createSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  steps: z.array(stepSchema).min(1).max(20),
  trigger_type: z.enum(["manual", "cron", "webhook"]).optional().default("manual"),
  trigger_config: z.record(z.string(), z.unknown()).optional().default({}),
});

export async function GET() {
  try {
    const userId = await getAuthenticatedUserId().catch(() => null);
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const supabase = getSupabaseServiceRoleClient();
    if (!supabase) return Response.json({ error: "DB unavailable" }, { status: 500 });

    const { data, error } = await supabase
      .from("workflows")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ workflows: data ?? [] });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUserId().catch(() => null);
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const body = await request.json();
    const parsed = createSchema.parse(body);

    const supabase = getSupabaseServiceRoleClient();
    if (!supabase) return Response.json({ error: "DB unavailable" }, { status: 500 });

    const { data, error } = await supabase
      .from("workflows")
      .insert({
        user_id: userId,
        name: parsed.name,
        description: parsed.description,
        steps: parsed.steps,
        trigger_type: parsed.trigger_type,
        trigger_config: parsed.trigger_config,
      })
      .select()
      .single();

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ workflow: data }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
