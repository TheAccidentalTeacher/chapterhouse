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

/**
 * POST /api/research/deep
 *
 * Multi-source parallel research. Searches across all configured sources,
 * deduplicates results, synthesizes with AI, and auto-saves to research_items.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const query = typeof body.query === "string" ? body.query.trim() : "";
    if (query.length < 5 || query.length > 500) {
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

    // Step 1: Parallel multi-source search
    const { results, sourcesSearched, searchDuration } = await orchestrateSearch(
      query,
      sources,
      maxResultsPerSource
    );

    if (results.length === 0) {
      return Response.json({
        query,
        sourcesSearched,
        totalResults: 0,
        synthesis: "No results found across any source.",
        sources: [],
        metadata: { searchDuration, tokensUsed: 0, model: "none" },
      });
    }

    // Step 2: AI synthesis
    const { synthesis, tokensUsed, model } = await synthesizeResults(
      query,
      results,
      analysisDepth
    );

    // Step 3: Auto-save to research_items
    const supabase = getSupabaseServiceRoleClient();
    let savedCount = 0;
    if (supabase) {
      for (const r of results.slice(0, 15)) {
        try {
          const { data: existing } = await supabase
            .from("research_items")
            .select("id")
            .eq("url", r.url)
            .maybeSingle();
          if (existing) continue;

          const { error } = await supabase.from("research_items").insert({
            url: r.url,
            title: r.title,
            summary: r.content?.slice(0, 500) || r.title,
            verdict: `Found via deep research: "${query}" [${r.source}]`,
            tags: ["deep-research", r.source],
            status: "review",
          });
          if (!error) savedCount++;
        } catch {
          // Skip individual save errors
        }
      }
    }

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
    });
  } catch (error) {
    console.error("[deep-research] Error:", error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

async function synthesizeResults(
  query: string,
  results: SearchResult[],
  depth: AnalysisDepth
): Promise<{ synthesis: string; tokensUsed: number; model: string }> {
  const sourceSummaries = results
    .slice(0, 20)
    .map(
      (r, i) =>
        `[${i + 1}] (${r.source}) ${r.title}\nURL: ${r.url}\n${r.content?.slice(0, 1500) || "No content"}`
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
