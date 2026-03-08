import OpenAI from "openai";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// GET /api/research — list all research items
export async function GET() {
  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) {
    return Response.json({ error: "Database not available" }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("research_items")
    .select("id, url, title, summary, verdict, tags, status, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ items: data ?? [] });
}

// POST /api/research — ingest a URL
export async function POST(request: Request) {
  try {
    const { url } = await request.json();

    if (!url || typeof url !== "string") {
      return Response.json({ error: "url is required" }, { status: 400 });
    }

    // Normalize URL
    const targetUrl = url.startsWith("http") ? url : `https://${url}`;

    // Fetch the page
    let rawHtml: string;
    try {
      const res = await fetch(targetUrl, {
        headers: { "User-Agent": "Chapterhouse/1.0 (research ingestion)" },
        signal: AbortSignal.timeout(15_000),
      });
      rawHtml = await res.text();
    } catch (e) {
      return Response.json({ error: `Could not fetch URL: ${String(e)}` }, { status: 422 });
    }

    // Strip HTML tags, collapse whitespace, take first 4000 chars of readable text
    const text = rawHtml
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 4000);

    if (text.length < 50) {
      return Response.json({ error: "Page returned too little readable text" }, { status: 422 });
    }

    // Ask the AI to analyze this content through the Next Chapter lens
    const analysisPrompt = `You are analyzing a web page for relevance to Next Chapter Homeschool Outpost.

The page URL: ${targetUrl}

Page content (truncated):
${text}

Respond with ONLY valid JSON matching this schema:
{
  "title": "string — the page title or best description of what this is",
  "summary": "string — 2-3 sentences summarizing what this page is about",
  "verdict": "string — 1 sentence: is this relevant to Next Chapter? Why or why not?",
  "tags": ["string", "string"] — 2-5 relevant category tags from: competitor, market, curriculum, content, product, audience, platform, pricing, distribution, social, news, tools
}

Be direct. No filler.`;

    const aiResponse = await openai.responses.create({
      model: "gpt-5.4",
      instructions: "You output only valid JSON. No markdown fences.",
      input: analysisPrompt,
      max_output_tokens: 512,
    });

    const rawText = aiResponse.output
      .filter((block) => block.type === "message")
      .flatMap((block) => (block as { type: "message"; content: Array<{ type: string; text: string }> }).content)
      .filter((part) => part.type === "output_text")
      .map((part) => part.text)
      .join("");

    let analysis: { title: string; summary: string; verdict: string; tags: string[] };
    try {
      analysis = JSON.parse(rawText);
    } catch {
      const match = rawText.match(/```(?:json)?\s*([\s\S]+?)```/);
      if (match) {
        analysis = JSON.parse(match[1]);
      } else {
        analysis = {
          title: targetUrl,
          summary: text.slice(0, 200),
          verdict: "Could not analyze — AI returned non-JSON output.",
          tags: [],
        };
      }
    }

    // Save to Supabase
    const supabase = getSupabaseServiceRoleClient();
    if (!supabase) {
      return Response.json({ error: "Database not available" }, { status: 503 });
    }

    const { data, error } = await supabase
      .from("research_items")
      .insert({
        url: targetUrl,
        title: analysis.title,
        raw_text: text,
        summary: analysis.summary,
        verdict: analysis.verdict,
        tags: analysis.tags ?? [],
        status: "review",
      })
      .select("id, url, title, summary, verdict, tags, status, created_at")
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ item: data }, { status: 201 });
  } catch (error) {
    console.error("Research ingestion error:", error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
