import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

export async function GET(request: Request) {
  // Auth check — only allow with CRON_SECRET bearer token
  const authHeader = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;
  if (!expected || authHeader !== `Bearer ${expected}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, unknown> = {
    env: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  };

  // OpenAI
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);
  results.openai = {
    configured: hasOpenAI,
    keyPrefix: hasOpenAI ? process.env.OPENAI_API_KEY!.slice(0, 8) + "..." : null,
  };

  // Anthropic
  const hasAnthropic = Boolean(process.env.ANTHROPIC_API_KEY);
  results.anthropic = {
    configured: hasAnthropic,
    keyPrefix: hasAnthropic ? process.env.ANTHROPIC_API_KEY!.slice(0, 10) + "..." : null,
  };

  // Supabase env
  const hasSupabaseUrl = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const hasSupabaseKey = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const hasServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

  results.supabase = {
    urlConfigured: hasSupabaseUrl,
    keyConfigured: hasSupabaseKey,
    serviceRoleConfigured: hasServiceRole,
    url: hasSupabaseUrl ? process.env.NEXT_PUBLIC_SUPABASE_URL : null,
    connected: false,
    briefCount: null,
    error: null,
  };

  // Supabase live check
  if (hasSupabaseUrl && hasServiceRole) {
    try {
      const client = getSupabaseServiceRoleClient();
      if (client) {
        const { data, error, count } = await client
          .from("briefs")
          .select("id, status, brief_date", { count: "exact" })
          .order("brief_date", { ascending: false })
          .limit(3);

        if (error) {
          (results.supabase as Record<string, unknown>).error = error.message;
        } else {
          (results.supabase as Record<string, unknown>).connected = true;
          (results.supabase as Record<string, unknown>).briefCount = count;
          (results.supabase as Record<string, unknown>).recentBriefs = data;
        }
      }
    } catch (e) {
      (results.supabase as Record<string, unknown>).error = String(e);
    }
  }

  // Live OpenAI check (cheap — just validate the key with a models list call)
  if (hasOpenAI) {
    try {
      const res = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        signal: AbortSignal.timeout(5000),
      });
      (results.openai as Record<string, unknown>).apiReachable = res.ok;
      (results.openai as Record<string, unknown>).httpStatus = res.status;
    } catch (e) {
      (results.openai as Record<string, unknown>).apiReachable = false;
      (results.openai as Record<string, unknown>).error = String(e);
    }
  }

  return Response.json(results, {
    headers: { "Cache-Control": "no-store" },
  });
}
