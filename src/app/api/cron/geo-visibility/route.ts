/**
 * GET /api/cron/geo-visibility
 *
 * Phase 28D: GEO / AI Search Visibility Tracking.
 * Weekly cron (Monday 07:00 UTC) — queries LLMs with targeted questions,
 * checks for brand mentions, stores results in intel_sessions.
 *
 * CRON_SECRET protected.
 */

import OpenAI from "openai";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

const GEO_QUERIES = [
  "What are the best homeschool curriculum providers in Alaska?",
  "Where can I find secular homeschool curriculum for middle school?",
  "What are good homeschool curriculum stores that ship to Alaska?",
  "Best online courses for homeschool students grades 5-8?",
  "Homeschool curriculum with visible progress tracking for parents?",
];

const BRAND_KEYWORDS = [
  "NCHO",
  "Next Chapter Homeschool",
  "SomersSchool",
  "Scott Somers",
  "Somers School",
  "nextchapterhomeschool",
];

interface GeoFinding {
  query: string;
  provider: string;
  mentioned_brands: string[];
  raw_response_excerpt: string;
  mentioned: boolean;
}

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

async function queryProvider(
  provider: string,
  query: string
): Promise<GeoFinding> {
  try {
    if (provider === "openai") {
      const openai = getOpenAI();
      const res = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        max_tokens: 500,
        messages: [{ role: "user", content: query }],
      });
      const text = res.choices[0]?.message?.content || "";
      const mentioned = BRAND_KEYWORDS.filter((kw) =>
        text.toLowerCase().includes(kw.toLowerCase())
      );
      return {
        query,
        provider,
        mentioned_brands: mentioned,
        raw_response_excerpt: text.slice(0, 500),
        mentioned: mentioned.length > 0,
      };
    }

    if (provider === "groq" && process.env.GROQ_API_KEY) {
      const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          max_tokens: 500,
          messages: [{ role: "user", content: query }],
        }),
        signal: AbortSignal.timeout(15_000),
      });
      const data = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const text = data.choices?.[0]?.message?.content || "";
      const mentioned = BRAND_KEYWORDS.filter((kw) =>
        text.toLowerCase().includes(kw.toLowerCase())
      );
      return {
        query,
        provider,
        mentioned_brands: mentioned,
        raw_response_excerpt: text.slice(0, 500),
        mentioned: mentioned.length > 0,
      };
    }

    return {
      query,
      provider,
      mentioned_brands: [],
      raw_response_excerpt: `[${provider} not available]`,
      mentioned: false,
    };
  } catch (err) {
    return {
      query,
      provider,
      mentioned_brands: [],
      raw_response_excerpt: `[Error: ${String(err).slice(0, 200)}]`,
      mentioned: false,
    };
  }
}

export async function GET(request: Request) {
  // CRON_SECRET guard
  const secret = request.headers.get("authorization")?.replace("Bearer ", "") ??
    new URL(request.url).searchParams.get("secret");
  if (secret !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) return Response.json({ error: "DB unavailable" }, { status: 500 });

  // Get user ID
  const { data: usersData } = await supabase.auth.admin.listUsers();
  const userId = usersData?.users?.[0]?.id;
  if (!userId) return Response.json({ error: "No user found" }, { status: 500 });

  // Query all providers × all queries
  const providers = ["openai"];
  if (process.env.GROQ_API_KEY) providers.push("groq");

  const findings: GeoFinding[] = [];
  for (const query of GEO_QUERIES) {
    const results = await Promise.allSettled(
      providers.map((p) => queryProvider(p, query))
    );
    for (const result of results) {
      if (result.status === "fulfilled") {
        findings.push(result.value);
      }
    }
  }

  // Compute visibility score
  const totalQueries = findings.length;
  const mentionCount = findings.filter((f) => f.mentioned).length;
  const visibilityScore = totalQueries > 0 ? Math.round((mentionCount / totalQueries) * 100) : 0;

  const dateStr = new Date().toISOString().split("T")[0];

  // Store as Intel session
  const { data: session, error } = await supabase
    .from("intel_sessions")
    .insert({
      user_id: userId,
      urls: [],
      source_type: "cron",
      session_label: `AI Search Visibility — ${dateStr}`,
      status: "complete",
      processed_output: {
        session_date: dateStr,
        summary: `AI Search Visibility: ${visibilityScore}% (${mentionCount}/${totalQueries} mentions across ${providers.length} providers). ${mentionCount > 0 ? "Brand appears in some AI-generated answers." : "No brand mentions detected — content strategy may need adjustment."}`,
        visibility_score: visibilityScore,
        findings,
        providers_queried: providers,
        sections: [],
        proposed_seeds: [],
        verification_warnings: [],
      },
    })
    .select("id")
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({
    ok: true,
    session_id: session?.id,
    visibility_score: visibilityScore,
    mentions: mentionCount,
    total_queries: totalQueries,
    providers,
  });
}
