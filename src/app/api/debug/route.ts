import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

export async function GET(request: Request) {
  // Auth check — allow CRON_SECRET bearer token OR cookie-based Supabase session
  const authHeader = request.headers.get("authorization");
  const expected = process.env.CRON_SECRET;
  const hasCronAuth = expected && authHeader === `Bearer ${expected}`;

  // Also allow if user has a valid Supabase session cookie (Chapterhouse is private)
  const hasCookie = request.headers.get("cookie")?.includes("sb-");

  if (!hasCronAuth && !hasCookie) {
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

  // QStash — job queue
  const hasQStash = Boolean(process.env.QSTASH_TOKEN);
  results.qstash = {
    configured: hasQStash,
    signingKeysConfigured: Boolean(process.env.QSTASH_CURRENT_SIGNING_KEY),
  };
  if (hasQStash) {
    try {
      const res = await fetch("https://qstash.upstash.io/v2/queues", {
        headers: { Authorization: `Bearer ${process.env.QSTASH_TOKEN}` },
        signal: AbortSignal.timeout(5000),
      });
      (results.qstash as Record<string, unknown>).apiReachable = res.ok;
      (results.qstash as Record<string, unknown>).httpStatus = res.status;
    } catch (e) {
      (results.qstash as Record<string, unknown>).apiReachable = false;
      (results.qstash as Record<string, unknown>).error = String(e);
    }
  }

  // Railway worker — background job processor
  const hasRailway = Boolean(process.env.RAILWAY_WORKER_URL);
  results.railway = {
    configured: hasRailway,
    url: hasRailway ? process.env.RAILWAY_WORKER_URL : null,
  };
  if (hasRailway) {
    try {
      const res = await fetch(`${process.env.RAILWAY_WORKER_URL}/health`, {
        signal: AbortSignal.timeout(5000),
      });
      (results.railway as Record<string, unknown>).reachable = res.ok;
      (results.railway as Record<string, unknown>).httpStatus = res.status;
    } catch (e) {
      (results.railway as Record<string, unknown>).reachable = false;
      (results.railway as Record<string, unknown>).error = String(e);
    }
  }

  // Additional services — env var presence only (no live calls to keep this fast)
  results.services = {
    youtube: Boolean(process.env.YOUTUBE_API_KEY),
    gemini: Boolean(process.env.GEMINI_API_KEY),
    elevenlabs: Boolean(process.env.ELEVENLABS_GENERAL_KEY),
    azureSpeech: Boolean(process.env.AZURE_SPEECH_KEY),
    azureTranslator: Boolean(process.env.AZURE_TRANSLATOR_KEY),
    buffer: Boolean(process.env.BUFFER_ACCESS_TOKEN),
    shopifyWebhook: Boolean(process.env.SHOPIFY_WEBHOOK_SECRET),
    heygen: Boolean(process.env.HEYGEN_API_KEY),
    stabilityAi: Boolean(process.env.STABILITY_AI_KEY),
    replicate: Boolean(process.env.REPLICATE_TOKEN),
    cloudinary: Boolean(process.env.CLOUDINARY_URL),
    tavily: Boolean(process.env.TAVILY_API_KEY),
    dailydev: Boolean(process.env.DAILYDEV_TOKEN),
    nChoEmail: Boolean(process.env.NCHO_EMAIL_HOST) && Boolean(process.env.NCHO_EMAIL_USER),
    n8n: Boolean(process.env.N8N_BASE_URL),
    resend: Boolean(process.env.RESEND_API_KEY),
    upstashRedis: Boolean(process.env.UPSTASH_REDIS_REST_URL),
    cronSecret: Boolean(process.env.CRON_SECRET),
  };

  return Response.json(results, {
    headers: { "Cache-Control": "no-store" },
  });
}
