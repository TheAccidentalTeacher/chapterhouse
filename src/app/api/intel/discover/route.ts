/**
 * POST /api/intel/discover
 *
 * Phase 27E: Deep Research Mode for Intel.
 * Takes a topic query → Tavily search to discover sources → fetch → process
 * through full Intel pipeline (Sonnet analysis + Haiku verification + Council synthesis).
 *
 * Perplexity Deep Research pattern: discover-read-synthesize, not just fetch-and-summarize.
 */

import { z } from "zod";
import { handleRouteError } from "@/lib/route-helpers";
import { getAuthenticatedUserId } from "@/lib/auth-context";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";
import { processIntelUrls } from "@/app/api/intel/route";
import type { ProposedSeed } from "@/app/api/intel/route";

const discoverSchema = z.object({
  topic: z.string().min(3).max(500),
  max_sources: z.number().min(3).max(15).optional().default(8),
  search_depth: z.enum(["basic", "advanced"]).optional().default("advanced"),
});

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUserId().catch(() => null);
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const body = await request.json();
    const parsed = discoverSchema.parse(body);

    const tavilyKey = process.env.TAVILY_API_KEY;
    if (!tavilyKey) {
      return Response.json({ error: "TAVILY_API_KEY not configured" }, { status: 503 });
    }

    const supabase = getSupabaseServiceRoleClient();
    if (!supabase) return Response.json({ error: "DB unavailable" }, { status: 500 });

    // Step 1: Use Tavily to discover sources for this topic
    const searchRes = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: tavilyKey,
        query: parsed.topic,
        max_results: parsed.max_sources,
        include_raw_content: false,
        search_depth: parsed.search_depth,
      }),
      signal: AbortSignal.timeout(20_000),
    });

    if (!searchRes.ok) {
      const err = await searchRes.text();
      return Response.json({ error: `Source discovery failed: ${err}` }, { status: 502 });
    }

    const searchData = (await searchRes.json()) as {
      results: Array<{ url: string; title: string; content: string }>;
      answer?: string;
    };

    const discoveredUrls = (searchData.results ?? [])
      .map((r) => r.url)
      .filter((u) => u && u.startsWith("http"));

    if (discoveredUrls.length === 0) {
      return Response.json({ error: "No sources discovered for this topic" }, { status: 404 });
    }

    // Build Tavily summary as extra context (the search engine's own synthesis)
    const tavilySummary = searchData.answer
      ? `Tavily search synthesis for "${parsed.topic}":\n${searchData.answer}\n\nDiscovered ${discoveredUrls.length} sources.`
      : `Discovered ${discoveredUrls.length} sources for "${parsed.topic}".`;

    // Step 2: Create Intel session with discovered URLs
    const { data: session, error: insertError } = await supabase
      .from("intel_sessions")
      .insert({
        user_id: userId,
        urls: discoveredUrls,
        source_type: "manual",
        session_label: `Deep Research — ${parsed.topic.slice(0, 80)}`,
        status: "pending",
      })
      .select()
      .single();

    if (insertError) return Response.json({ error: insertError.message }, { status: 500 });

    // Step 3: Process through full Intel pipeline
    try {
      const output = await processIntelUrls(session.id, discoveredUrls, tavilySummary);

      // Extract seeds to dreams table
      let seedsExtracted = 0;
      if (output.proposed_seeds?.length > 0) {
        const seedRows = output.proposed_seeds.map((seed: ProposedSeed) => ({
          user_id: userId,
          text: seed.text,
          notes: `Rationale: ${seed.rationale}\nSource: ${seed.source_headline}`,
          status: "seed",
          category: seed.category ?? "general",
          priority_score: 55,
          source_type: "intel",
          source_label: `Deep Research — ${parsed.topic.slice(0, 60)}`,
          sort_order: 0,
        }));
        const { data: insertedSeeds } = await supabase.from("dreams").insert(seedRows).select("id");
        seedsExtracted = insertedSeeds?.length ?? 0;
      }

      const finalOutput = {
        ...output,
        proposed_seeds: output.proposed_seeds.map((s: ProposedSeed) => ({ ...s, added: true })),
      };

      await supabase
        .from("intel_sessions")
        .update({ status: "complete", processed_output: finalOutput, seeds_extracted: seedsExtracted })
        .eq("id", session.id);

      return Response.json({
        session: { ...session, status: "complete", processed_output: finalOutput, seeds_extracted: seedsExtracted },
        discovered_urls: discoveredUrls,
        sources_count: discoveredUrls.length,
      }, { status: 201 });
    } catch (err) {
      await supabase
        .from("intel_sessions")
        .update({ status: "failed", error: String(err) })
        .eq("id", session.id);
      return Response.json({ error: String(err), session_id: session.id }, { status: 500 });
    }
  } catch (error) {
    return handleRouteError(error);
  }
}
