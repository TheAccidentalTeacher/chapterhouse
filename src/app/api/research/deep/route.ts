import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";
import {
  orchestrateSearch,
  type SearchSource,
  type SearchResult,
} from "@/lib/search-orchestrator";

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}
function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

const VALID_SOURCES: SearchSource[] = [
  "tavily",
  "serpapi",
  "reddit",
  "newsapi",
  "internet-archive",
];
const VALID_DEPTHS = ["quick", "standard", "deep"] as const;
type AnalysisDepth = (typeof VALID_DEPTHS)[number];

// Route segment config — belt-and-suspenders with vercel.json
export const maxDuration = 300;

/**
 * POST /api/research/deep
 *
 * Multi-source parallel research. Searches across all configured sources,
 * deduplicates results, synthesizes with AI, and auto-saves to research_items.
 */
export async function POST(request: Request) {
  const t0 = Date.now();
  const log = (phase: string, ...args: unknown[]) =>
    console.log(`[deep-research][${phase}][${Date.now() - t0}ms]`, ...args);

  try {
    log("init", "POST received");
    const body = await request.json();
    const query = typeof body.query === "string" ? body.query.trim() : "";
    if (query.length < 5 || query.length > 500) {
      log("init", "REJECTED — query length:", query.length);
      return Response.json(
        { error: "query must be 5-500 characters" },
        { status: 400 }
      );
    }

    const sources: SearchSource[] = Array.isArray(body.sources)
      ? body.sources.filter((s: string) => VALID_SOURCES.includes(s as SearchSource))
      : [...VALID_SOURCES];

    const maxResultsPerSource = Math.min(
      Math.max(Number(body.maxResultsPerSource) || 5, 1),
      10
    );

    const analysisDepth: AnalysisDepth = VALID_DEPTHS.includes(body.analysisDepth)
      ? body.analysisDepth
      : "standard";

    log("init", `query="${query.slice(0, 80)}" sources=[${sources}] depth=${analysisDepth} maxPerSource=${maxResultsPerSource}`);

    // ── Step 1: Parallel multi-source search ──
    log("search", "START");
    let results: SearchResult[];
    let sourcesSearched: string[];
    let searchDuration: number;
    try {
      const searchPromise = orchestrateSearch(query, sources, maxResultsPerSource);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Search timeout after 60s")), 60_000)
      );
      const searchResult = await Promise.race([searchPromise, timeoutPromise]);
      results = searchResult.results;
      sourcesSearched = searchResult.sourcesSearched;
      searchDuration = searchResult.searchDuration;
      log("search", `DONE — ${results.length} results from [${sourcesSearched}] in ${searchDuration}ms`);
    } catch (searchError) {
      log("search", "FAILED:", String(searchError));
      return Response.json({
        query,
        sourcesSearched: [],
        totalResults: 0,
        synthesis: `Search failed: ${String(searchError)}. Try again with fewer sources or a shorter query.`,
        sources: [],
        metadata: { searchDuration: 0, tokensUsed: 0, model: "none" },
        _debug: { totalMs: Date.now() - t0, phase: "search", error: String(searchError) },
      });
    }

    if (results.length === 0) {
      log("search", "ZERO results — returning early");
      return Response.json({
        query,
        sourcesSearched,
        totalResults: 0,
        synthesis: "No results found across any source.",
        sources: [],
        metadata: { searchDuration, tokensUsed: 0, model: "none" },
        _debug: { totalMs: Date.now() - t0, phase: "search-empty" },
      });
    }

    // ── Steps 2+3: AI synthesis + Supabase save IN PARALLEL ──
    const inputChars = results.slice(0, 20).reduce((n, r) => n + (r.content?.length || 0), 0);
    log("synth+save", `START PARALLEL — depth=${analysisDepth}, ${results.length} results (~${inputChars} chars)`);

    // Synthesis (with 90s timeout)
    const synthPromiseWrapped = (async () => {
      try {
        const synthPromise = synthesizeResults(query, results, analysisDepth);
        const synthTimeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("Synthesis timeout after 90s")), 90_000)
        );
        const synthResult = await Promise.race([synthPromise, synthTimeout]);
        log("synth", `DONE — model=${synthResult.model}, tokens=${synthResult.tokensUsed}, synthLen=${synthResult.synthesis.length}`);
        return synthResult;
      } catch (synthError) {
        log("synth", "FAILED:", String(synthError));
        const rawSummary = results.slice(0, 10).map((r, i) =>
          `**[${i+1}] ${r.title}** (${r.source})\n${r.url}\n${r.content?.slice(0, 300) || ""}`
        ).join("\n\n---\n\n");
        return {
          synthesis: `AI synthesis timed out, but here are the raw results:\n\n${rawSummary}`,
          tokensUsed: 0,
          model: "timeout-fallback",
        };
      }
    })();

    // Supabase save (fire alongside synthesis)
    const savePromise = (async () => {
      const supabase = getSupabaseServiceRoleClient();
      if (!supabase) return 0;
      try {
        const saveResults = await Promise.allSettled(
          results.slice(0, 15).map(async (r) => {
            const { data: existing } = await supabase
              .from("research_items")
              .select("id")
              .eq("url", r.url)
              .maybeSingle();
            if (existing) return false;
            const { error } = await supabase.from("research_items").insert({
              url: r.url,
              title: r.title,
              summary: r.content?.slice(0, 500) || r.title,
              verdict: `Found via deep research: "${query}" [${r.source}]`,
              tags: ["deep-research", r.source],
              status: "review",
            });
            return !error;
          })
        );
        const count = saveResults.filter(r => r.status === "fulfilled" && r.value).length;
        log("save", `DONE — saved ${count} new items`);
        return count;
      } catch {
        return 0;
      }
    })();

    // Wait for both
    const [synthResult, savedCount] = await Promise.all([synthPromiseWrapped, savePromise]);
    const { synthesis, tokensUsed, model } = synthResult;
    log("synth+save", "BOTH DONE");

    const totalMs = Date.now() - t0;
    log("done", `TOTAL ${totalMs}ms — search=${searchDuration}ms, results=${results.length}, saved=${savedCount}`);

    return Response.json({
      query,
      sourcesSearched,
      totalResults: results.length,
      savedCount,
      synthesis,
      sources: results.map((r) => ({
        url: r.url,
        title: r.title,
        source: r.source,
        excerpt: r.content?.slice(0, 300) || "",
        relevanceScore: r.relevanceScore,
        metadata: r.metadata,
      })),
      metadata: {
        searchDuration,
        tokensUsed,
        model,
      },
      _debug: { totalMs, searchMs: searchDuration, savedCount, model },
    });
  } catch (error) {
    const totalMs = Date.now() - t0;
    console.error(`[deep-research][CRASH][${totalMs}ms]`, error);
    return Response.json(
      { error: String(error), _debug: { totalMs, phase: "uncaught" } },
      { status: 500 }
    );
  }
}

async function synthesizeResults(
  query: string,
  results: SearchResult[],
  depth: AnalysisDepth
): Promise<{ synthesis: string; tokensUsed: number; model: string }> {
  const maxResults = depth === "deep" ? 20 : depth === "standard" ? 12 : 8;
  const maxContentLen = depth === "deep" ? 1500 : depth === "standard" ? 1000 : 500;
  const sourceSummaries = results
    .slice(0, maxResults)
    .map(
      (r, i) =>
        `[${i + 1}] (${r.source}) ${r.title}\nURL: ${r.url}\n${r.content?.slice(0, maxContentLen) || "No content"}`
    )
    .join("\n\n---\n\n");

  const depthInstructions: Record<AnalysisDepth, string> = {
    quick: `Summarize each source in 1-2 sentences. Keep the total response under 500 words. Focus on key facts only.`,
    standard: `Synthesize all sources into a cohesive research report. Include:
- Executive summary (2-3 sentences)
- Key findings (bullet points)
- Source quality assessment
- Recommended next steps
Keep the total response under 1500 words.`,
    deep: `Produce a comprehensive multi-section research report:
## Executive Summary
2-3 paragraph overview of findings.

## Key Findings
Detailed bullet points organized by theme.

## Source Analysis
For each major source, assess credibility and relevance.

## Contradictions & Gaps
Where do sources disagree? What questions remain unanswered?

## Recommendations
Specific, actionable next steps for Scott's business context:
- Next Chapter Homeschool Outpost (Shopify store)
- SomersSchool (secular curriculum SaaS)
- BibleSaaS (personal Bible study tool)

Cite sources by number [1], [2], etc. Be thorough.`,
  };

  const systemPrompt = `You are a research analyst for Scott Somers. He runs a homeschool education business (Next Chapter Homeschool Outpost) and is building SomersSchool, a secular curriculum SaaS. He's a middle school teacher in Alaska whose contract ends May 2026.

Analyze the following search results for the query: "${query}"

${depthInstructions[depth]}`;

  try {
    if (depth === "quick") {
      // GPT-5-mini for speed
      console.log("[deep-research][synth-inner] Calling GPT-4o-mini...");
      const openai = getOpenAI();
      const response = await openai.responses.create({
        model: "gpt-4o-mini",
        instructions: systemPrompt,
        input: sourceSummaries,
      });
      return {
        synthesis: response.output_text || "No synthesis generated.",
        tokensUsed: response.usage?.total_tokens || 0,
        model: "gpt-4o-mini",
      };
    } else {
      // Claude Sonnet for standard/deep
      console.log(`[deep-research][synth-inner] Calling claude-sonnet-4-6, max_tokens=${depth === "deep" ? 4096 : 2048}, input ~${sourceSummaries.length} chars...`);
      const anthropic = getAnthropic();
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: depth === "deep" ? 4096 : 2048,
        system: systemPrompt,
        messages: [{ role: "user", content: sourceSummaries }],
      });
      const text =
        response.content[0]?.type === "text"
          ? response.content[0].text
          : "No synthesis generated.";
      return {
        synthesis: text,
        tokensUsed:
          (response.usage?.input_tokens || 0) +
          (response.usage?.output_tokens || 0),
        model: "claude-sonnet-4-6",
      };
    }
  } catch (error) {
    console.error("[deep-research] Synthesis error:", error);
    return {
      synthesis: `Synthesis failed: ${String(error)}\n\nRaw results:\n${sourceSummaries.slice(0, 3000)}`,
      tokensUsed: 0,
      model: "error",
    };
  }
}
