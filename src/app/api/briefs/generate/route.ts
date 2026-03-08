import OpenAI from "openai";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const GENERATE_SYSTEM_PROMPT = `You generate daily intelligence briefs for the Chapterhouse operating system serving Next Chapter Homeschool Outpost.

You output ONLY valid JSON — no markdown fences, no prose, no explanation. The JSON must match this exact schema:

{
  "title": "string — a short title for today's brief",
  "summary": "string — 2-3 sentences summarizing what Scott should know and do today",
  "sections": [
    {
      "title": "string — section name (e.g. Opportunities, Competitive Signals, Content Ideas)",
      "items": [
        {
          "headline": "string — concise action-oriented headline",
          "whyItMatters": "string — 1-2 sentences why this matters for Next Chapter right now",
          "score": "string — one of: A+, A, A-, B+, B, B-, C",
          "sources": 0
        }
      ]
    }
  ]
}

Generate 2-3 sections with 2-4 items each. Be specific, be useful, be direct. No filler.`;

export async function POST(request: Request) {
  try {
    const { context } = await request.json().catch(() => ({ context: "" }));
    const today = new Date().toISOString().split("T")[0];

    const userPrompt = context
      ? `Generate a daily brief for ${today}. Additional context from the user: ${context}`
      : `Generate a daily brief for ${today} based on everthing you know about Next Chapter Homeschool Outpost, the current market, and what would be most useful for Scott to act on today.`;

    const response = await openai.responses.create({
      model: "gpt-5.4",
      instructions: GENERATE_SYSTEM_PROMPT,
      input: userPrompt,
      max_output_tokens: 2048,
    });

    // Extract the text output
    const rawText = response.output
      .filter((block) => block.type === "message")
      .flatMap((block) => (block as { type: "message"; content: Array<{ type: string; text: string }> }).content)
      .filter((part) => part.type === "output_text")
      .map((part) => part.text)
      .join("");

    let briefData: {
      title: string;
      summary: string;
      sections: Array<{
        title: string;
        items: Array<{ headline: string; whyItMatters: string; score: string; sources: number }>;
      }>;
    };

    try {
      briefData = JSON.parse(rawText);
    } catch {
      // Try to extract JSON if the model wrapped it in backticks anyway
      const match = rawText.match(/```(?:json)?\s*([\s\S]+?)```/);
      if (match) {
        briefData = JSON.parse(match[1]);
      } else {
        return Response.json(
          { error: "Model did not return valid JSON", raw: rawText.slice(0, 500) },
          { status: 422 }
        );
      }
    }

    // Save to Supabase
    const supabase = getSupabaseServiceRoleClient();
    if (!supabase) {
      return Response.json({ error: "Database not available" }, { status: 503 });
    }

    const { data, error } = await supabase
      .from("briefs")
      .insert({
        brief_date: today,
        title: briefData.title,
        summary: briefData.summary,
        sections: briefData.sections,
        source_count: 0,
        status: "published",
      })
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ brief: data }, { status: 201 });
  } catch (error) {
    console.error("Brief generation error:", error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
