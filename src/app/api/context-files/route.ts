/**
 * GET /api/context-files — List all context files sorted by inject_order
 * POST /api/context-files — Create new context file
 *
 * Phase 23A: Knowledge Base UI for managing context_files (the AI system prompt documents)
 */

import { z } from "zod";
import { handleRouteError } from "@/lib/route-helpers";
import { getAuthenticatedUserId } from "@/lib/auth-context";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

const createSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  document_type: z.string().min(1).max(50),
  inject_order: z.number().int().min(0).max(100).optional(),
  is_active: z.boolean().optional().default(true),
});

export async function GET() {
  try {
    const userId = await getAuthenticatedUserId().catch(() => null);
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const supabase = getSupabaseServiceRoleClient();
    if (!supabase) return Response.json({ error: "DB unavailable" }, { status: 500 });

    const { data, error } = await supabase
      .from("context_files")
      .select("*")
      .order("inject_order", { ascending: true });

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ files: data ?? [] });
  } catch (error) {
    return handleRouteError(error);
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUserId().catch(() => null);
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const supabase = getSupabaseServiceRoleClient();
    if (!supabase) return Response.json({ error: "DB unavailable" }, { status: 500 });

    const body = await request.json();
    const parsed = createSchema.parse(body);

    const { data, error } = await supabase
      .from("context_files")
      .insert({
        user_id: userId,
        title: parsed.title,
        content: parsed.content,
        document_type: parsed.document_type,
        inject_order: parsed.inject_order ?? 50,
        is_active: parsed.is_active,
      })
      .select()
      .single();

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json(data, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
