import OpenAI from "openai";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

/**
 * POST /api/research/auto
 *
 * Agentic research: takes a topic, searches the web via Tavily,
 * fetches the top results, runs AI analysis on each, and ingests
 * them into research_items automatically.
 *
 * Body: { topic: string, maxResults?: number }
 * Returns: { results: Array<{ url, title, summary, verdict, tags }>, count: number }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { topic, maxResults = 5 } = body;

    if (!topic || typeof topic !== "string" || topic.trim().length < 3) {
      return Response.json({ error: "topic is required (min 3 chars)" }, { status: 400 });
    }

    const tavilyKey = process.env.TAVILY_API_KEY;
    if (!tavilyKey) {
      return Response.json({ error: "TAVILY_API_KEY not configured" }, { status: 503 });
    }

    const supabase = getSupabaseServiceRoleClient();
    if (!supabase) {
      return Response.json({ error: "Database not available" }, { status: 503 });
    }

    // Step 1: Search via Tavily
    const searchRes = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: tavilyKey,
        query: topic.trim(),
        max_results: Math.min(Math.max(maxResults, 1), 10),
        include_raw_content: false,
        search_depth: "advanced",
      }),
      signal: AbortSignal.timeout(20_000),
    });

    if (!searchRes.ok) {
      const err = await searchRes.text();
      return Response.json({ error: `Tavily search failed: ${err}` }, { status: 502 });
    }

    const searchData = (await searchRes.json()) as {
      results: Array<{ url: string; title: string; content: string }>;
    };

    if (!searchData.results || searchData.results.length === 0) {
      return Response.json({ results: [], count: 0, message: "No results found" });
    }

    // Step 2: Analyze each result with AI and save to DB
    const ingested: Array<{ url: string; title: string; summary: string; verdict: string; tags: string[] }> = [];

    for (const result of searchData.results) {
      try {
        const analysis = await analyzeForResearch(result.content || result.title, result.url);

        // Check for duplicate URL
        const { data: existing } = await supabase
          .from("research_items")
          .select("id")
          .eq("url", result.url)
          .maybeSingle();

        if (existing) continue; // Skip duplicates

        const { error } = await supabase.from("research_items").insert({
          url: result.url,
          title: analysis.title,
          summary: analysis.summary,
          verdict: analysis.verdict,
          tags: analysis.tags ?? [],
          status: "review",
        });

        if (!error) {
          ingested.push({
            url: result.url,
            title: analysis.title,
            summary: analysis.summary,
            verdict: analysis.verdict,
            tags: analysis.tags,
          });
        }
      } catch (e) {
        console.warn(`[auto-research] Failed to process ${result.url}:`, e);
      }
    }

    return Response.json({ results: ingested, count: ingested.length, topic: topic.trim() });
  } catch (error) {
    console.error("[auto-research] Error:", error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

async function analyzeForResearch(
  text: string,
  sourceUrl: string
): Promise<{ title: string; summary: string; verdict: string; tags: string[] }> {
  const prompt = `You are analyzing web content for relevance to Scott Somers and the Next Chapter Homeschool Outpost operation.

KEY CONTEXT:
- Next Chapter Homeschool Outpost: Shopify homeschool store (books, curriculum, digital products). Launching 2026.
- Scott is a vibe-coder building everything with AI. AI coding tools, LLM updates, agent capabilities = HIGH relevance.
- SomersSchool: standalone K-12 curriculum SaaS. AI content generation pipeline.
- Chapterhouse: internal AI operating system Scott built.
- Anna: USA Today bestselling author and podcaster.

Source: ${sourceUrl}

Content:
${text.slice(0, 3000)}

Respond with ONLY valid JSON:
{
  "title": "string — clear descriptive title",
  "summary": "string — 2-3 sentences",
  "verdict": "string — 1-2 sentences on relevance to Scott/Next Chapter. Be specific.",
  "tags": ["string"] — 2-5 tags from: competitor, market, curriculum, content, product, audience, platform, pricing, distribution, social, news, tools, ai, strategy, vibe-coding
}`;

  const aiResponse = await getOpenAI().responses.create({
    model: "gpt-5.4",
    instructions: "You output only valid JSON. No markdown fences.",
    input: prompt,
    max_output_tokens: 512,
  });

  const rawText = aiResponse.output
    .filter((block) => block.type === "message")
    .flatMap(
      (block) =>
        (block as { type: "message"; content: Array<{ type: string; text: string }> }).content
    )
    .filter((part) => part.type === "output_text")
    .map((part) => part.text)
    .join("");

  try {
    return JSON.parse(rawText);
  } catch {
    const match = rawText.match(/```(?:json)?\s*([\s\S]+?)```/);
    if (match) return JSON.parse(match[1]);
    return { title: sourceUrl, summary: text.slice(0, 200), verdict: "Could not analyze.", tags: [] };
  }
}
