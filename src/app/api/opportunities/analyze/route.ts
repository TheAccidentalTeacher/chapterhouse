import OpenAI from "openai";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const ANALYZE_SYSTEM_PROMPT = `You are the product intelligence engine for Next Chapter Homeschool Outpost.

You analyze research signals (competitor pages, market data, news) and generate scored product and content opportunities for the business.

The three scoring dimensions:
- Store Score: How strong is this as a Shopify product or product category?
- Curriculum Score: How strong is this as a SomersSchool course or curriculum framework?
- Content Score: How strong is this as a content angle (blog, social, email, video)?

Use letter grades: A+, A, A-, B+, B, B-, C

Output ONLY valid JSON — no markdown fences, no prose. Schema:

{
  "opportunities": [
    {
      "title": "string — short opportunity title",
      "description": "string — 2-3 sentences describing the opportunity",
      "category": "product | content | positioning | distribution",
      "store_score": "A+ | A | A- | B+ | B | B- | C",
      "curriculum_score": "A+ | A | A- | B+ | B | B- | C",
      "content_score": "A+ | A | A- | B+ | B | B- | C",
      "evidence": ["string", "string"],
      "action": "string — most important next step"
    }
  ]
}

Generate 3-6 opportunities. Be specific, be blunt, be useful. No filler. Score honestly — C is a real grade.`;

export async function POST() {
  try {
    const supabase = getSupabaseServiceRoleClient();
    if (!supabase) {
      return Response.json({ error: "Database not available" }, { status: 503 });
    }

    // Fetch context: recent research items + latest brief
    const [researchResult, briefResult] = await Promise.all([
      supabase
        .from("research_items")
        .select("url, title, summary, verdict, tags")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("briefs")
        .select("brief_date, title, summary, sections")
        .eq("status", "published")
        .order("brief_date", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    const research = researchResult.data ?? [];
    const brief = briefResult.data;

    if (research.length === 0 && !brief) {
      return Response.json(
        { error: "No research or briefs found. Add some sources in Research first." },
        { status: 422 }
      );
    }

    // Build the analysis input
    const researchBlock = research.length > 0
      ? `## Research signals ingested (${research.length} sources)\n\n` +
        research
          .map((r) =>
            `**${r.title || r.url}**\n` +
            `Summary: ${r.summary || "(none)"}\n` +
            `Verdict: ${r.verdict || "(none)"}\n` +
            `Tags: ${(r.tags ?? []).join(", ")}`
          )
          .join("\n\n")
      : "";

    const briefBlock = brief
      ? `## Latest Daily Brief (${brief.brief_date})\n\n${brief.title}\n${brief.summary || ""}`
      : "";

    const userPrompt =
      `Analyze these signals and generate scored product/content/positioning opportunities for Next Chapter Homeschool Outpost.\n\n` +
      [researchBlock, briefBlock].filter(Boolean).join("\n\n---\n\n");

    const aiResponse = await openai.responses.create({
      model: "gpt-5.4",
      instructions: ANALYZE_SYSTEM_PROMPT,
      input: userPrompt,
      max_output_tokens: 3000,
    });

    const rawText = aiResponse.output
      .filter((block) => block.type === "message")
      .flatMap((block) => (block as { type: "message"; content: Array<{ type: string; text: string }> }).content)
      .filter((part) => part.type === "output_text")
      .map((part) => part.text)
      .join("");

    let parsed: { opportunities: Array<{
      title: string;
      description: string;
      category: string;
      store_score: string;
      curriculum_score: string;
      content_score: string;
      evidence: string[];
      action: string;
    }> };

    try {
      parsed = JSON.parse(rawText);
    } catch {
      const match = rawText.match(/```(?:json)?\s*([\s\S]+?)```/);
      if (match) {
        parsed = JSON.parse(match[1]);
      } else {
        return Response.json({ error: "Model returned non-JSON", raw: rawText.slice(0, 500) }, { status: 422 });
      }
    }

    // Save all opportunities to Supabase
    const toInsert = parsed.opportunities.map((o) => ({
      ...o,
      status: "open",
      evidence: o.evidence ?? [],
      source_ids: [],
    }));

    const { data: saved, error: insertError } = await supabase
      .from("opportunities")
      .insert(toInsert)
      .select();

    if (insertError) {
      // Return the analysis even if save failed
      return Response.json({ opportunities: parsed.opportunities, saveError: insertError.message });
    }

    return Response.json({ opportunities: saved }, { status: 201 });
  } catch (error) {
    console.error("Opportunity analysis error:", error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
