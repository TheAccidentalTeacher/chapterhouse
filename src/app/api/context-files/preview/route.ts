/**
 * GET /api/context-files/preview
 *
 * Returns the assembled context documents exactly as they'd be injected into the AI system prompt.
 * Shows all active context_files in inject_order.
 *
 * Phase 23A: Knowledge Base UI — "See what the AI sees"
 */

import { handleRouteError } from "@/lib/route-helpers";
import { getAuthenticatedUserId } from "@/lib/auth-context";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

export async function GET() {
  try {
    const userId = await getAuthenticatedUserId().catch(() => null);
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const supabase = getSupabaseServiceRoleClient();
    if (!supabase) return Response.json({ error: "DB unavailable" }, { status: 500 });

    const { data: files } = await supabase
      .from("context_files")
      .select("title, content, document_type, inject_order, is_active")
      .eq("is_active", true)
      .order("inject_order", { ascending: true });

    const assembled = (files ?? [])
      .map((f) => `--- ${f.title} (${f.document_type}, order: ${f.inject_order}) ---\n\n${f.content}`)
      .join("\n\n===\n\n");

    return Response.json({
      prompt: assembled,
      length: assembled.length,
      tokens_estimate: Math.ceil(assembled.length / 4),
      file_count: files?.length ?? 0,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
