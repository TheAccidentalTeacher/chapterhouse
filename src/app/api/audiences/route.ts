/**
 * GET/POST /api/audiences
 *
 * Phase 28E: Target Audiences CRUD — list + create.
 */

import { z } from "zod";
import { handleRouteError } from "@/lib/route-helpers";
import { getAuthenticatedUserId } from "@/lib/auth-context";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

const createSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  demographics: z.record(z.string(), z.unknown()).optional().default({}),
  pain_points: z.array(z.string()).optional().default([]),
  motivations: z.array(z.string()).optional().default([]),
  preferred_tone: z.string().optional(),
  brand_voice_id: z.string().uuid().optional(),
});

export async function GET() {
  try {
    const userId = await getAuthenticatedUserId().catch(() => null);
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const supabase = getSupabaseServiceRoleClient();
    if (!supabase) return Response.json({ error: "DB unavailable" }, { status: 500 });

    const { data, error } = await supabase
      .from("target_audiences")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ audiences: data ?? [] });
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
      .from("target_audiences")
      .insert({ user_id: userId, ...parsed })
      .select()
      .single();

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ audience: data }, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
