/**
 * GET /api/watch-urls — List active watch URLs
 * POST /api/watch-urls — Create new watch URL (with SSRF validation)
 *
 * Phase 23B: Watch URLs for content change detection
 */

import { z } from "zod";
import { handleRouteError } from "@/lib/route-helpers";
import { getAuthenticatedUserId } from "@/lib/auth-context";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

const BLOCKED_PATTERNS = [
  /^https?:\/\/127\./,
  /^https?:\/\/10\./,
  /^https?:\/\/172\.(1[6-9]|2[0-9]|3[01])\./,
  /^https?:\/\/169\.254\./,
  /^https?:\/\/192\.168\./,
  /^https?:\/\/localhost/i,
  /^https?:\/\/0\.0\.0\.0/,
  /^https?:\/\/\[::1\]/,
];

function isUrlSafe(url: string): boolean {
  if (!url.startsWith("http://") && !url.startsWith("https://")) return false;
  return !BLOCKED_PATTERNS.some((p) => p.test(url));
}

const watchUrlSchema = z.object({
  url: z.string().url().max(2048),
  label: z.string().min(1).max(200),
  check_interval: z.enum(["daily", "weekly", "monthly"]),
});

export async function GET() {
  try {
    const userId = await getAuthenticatedUserId().catch(() => null);
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const supabase = getSupabaseServiceRoleClient();
    if (!supabase) return Response.json({ error: "DB unavailable" }, { status: 500 });

    const { data, error } = await supabase
      .from("watch_urls")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ urls: data ?? [] });
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
    const parsed = watchUrlSchema.parse(body);

    // SSRF prevention
    if (!isUrlSafe(parsed.url)) {
      return Response.json(
        { error: "URL blocked: internal/localhost URLs are not allowed" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("watch_urls")
      .insert({
        user_id: userId,
        url: parsed.url,
        label: parsed.label,
        check_interval: parsed.check_interval,
      })
      .select()
      .single();

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json(data, { status: 201 });
  } catch (error) {
    return handleRouteError(error);
  }
}
