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

// POST /api/research — ingest a URL, or save manually
// Helper: run AI analysis on any text block
async function analyzeText(text: string, sourceLabel: string) {
  const prompt = `You are analyzing content for relevance to Next Chapter Homeschool Outpost — a homeschool curriculum store and content brand run by Scott and Anna Somers.

Source: ${sourceLabel}

Content:
${text.slice(0, 4000)}

Respond with ONLY valid JSON:
{
  "title": "string — a clear descriptive title for this piece",
  "summary": "string — 2-3 sentences summarizing what this is about",
  "verdict": "string — 1 sentence on whether and how this is relevant to Next Chapter",
  "tags": ["string"] — 2-5 tags from: competitor, market, curriculum, content, product, audience, platform, pricing, distribution, social, news, tools, ai, strategy
}

Be direct. No filler.`;

  const aiResponse = await openai.responses.create({
    model: "gpt-5.4",
    instructions: "You output only valid JSON. No markdown fences.",
    input: prompt,
    max_output_tokens: 512,
  });

  const rawText = aiResponse.output
    .filter((block) => block.type === "message")
    .flatMap((block) => (block as { type: "message"; content: Array<{ type: string; text: string }> }).content)
    .filter((part) => part.type === "output_text")
    .map((part) => part.text)
    .join("");

  try {
    return JSON.parse(rawText) as { title: string; summary: string; verdict: string; tags: string[] };
  } catch {
    const match = rawText.match(/```(?:json)?\s*([\s\S]+?)```/);
    if (match) return JSON.parse(match[1]) as { title: string; summary: string; verdict: string; tags: string[] };
    return { title: sourceLabel, summary: text.slice(0, 200), verdict: "Could not analyze.", tags: [] };
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url, manual, title, summary, verdict, tags, pasteText, sourceLabel, imageBase64, imageType } = body;

    // --- Image / screenshot path (Instagram screenshots, competitor posts, etc.) ---
    if (imageBase64 && typeof imageBase64 === "string") {
      if (imageBase64.length < 100) {
        return Response.json({ error: "Invalid image data" }, { status: 400 });
      }
      const mediaType = (imageType as string) || "image/jpeg";
      const label = sourceLabel?.trim() || "Screenshot";

      const aiResponse = await openai.responses.create({
        model: "gpt-5.4",
        instructions: "You output only valid JSON. No markdown fences.",
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_image",
                image_url: `data:${mediaType};base64,${imageBase64}`,
              },
              {
                type: "input_text",
                text: `You are analyzing a screenshot for relevance to Next Chapter Homeschool Outpost — a homeschool curriculum store and content brand run by Scott and Anna Somers.\n\nSource: ${label}\n\nDescribe what you see in this image, then analyze it through the Next Chapter lens.\n\nRespond with ONLY valid JSON:\n{\n  "title": "string — clear descriptive title for what this shows",\n  "summary": "string — 2-3 sentences: what is in the image and what's notable",\n  "verdict": "string — 1 sentence on whether/how this is relevant to Next Chapter Homeschool Outpost",\n  "tags": ["string"] — 2-5 tags from: competitor, market, curriculum, content, product, audience, platform, pricing, distribution, social, news, tools, ai, strategy\n}`,
              },
            ],
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ] as any,
        max_output_tokens: 512,
      });

      const rawText = aiResponse.output
        .filter((block) => block.type === "message")
        .flatMap((block) =>
          (block as { type: "message"; content: Array<{ type: string; text: string }> }).content
        )
        .filter((part) => part.type === "output_text")
        .map((part) => part.text)
        .join("");

      let analysis: { title: string; summary: string; verdict: string; tags: string[] };
      try {
        analysis = JSON.parse(rawText);
      } catch {
        const match = rawText.match(/```(?:json)?\s*([\s\S]+?)```/);
        analysis = match
          ? JSON.parse(match[1])
          : { title: label, summary: rawText.slice(0, 200), verdict: "Could not analyze.", tags: ["social"] };
      }

      const supabase = getSupabaseServiceRoleClient();
      if (!supabase) return Response.json({ error: "Database not available" }, { status: 503 });
      const { data, error } = await supabase
        .from("research_items")
        .insert({
          url: `image://${Date.now()}`,
          title: analysis.title,
          summary: analysis.summary,
          verdict: analysis.verdict,
          tags: analysis.tags ?? ["social"],
          status: "review",
        })
        .select("id, url, title, summary, verdict, tags, status, created_at")
        .single();
      if (error) return Response.json({ error: error.message }, { status: 500 });
      return Response.json({ item: data }, { status: 201 });
    }

    // --- Paste-text path (no URL needed — email, Instagram caption, article excerpt, notes) ---
    if (pasteText && typeof pasteText === "string") {
      if (pasteText.trim().length < 10) {
        return Response.json({ error: "Paste some text first" }, { status: 400 });
      }
      const label = sourceLabel?.trim() || "Pasted content";
      const analysis = await analyzeText(pasteText, label);
      const supabase = getSupabaseServiceRoleClient();
      if (!supabase) return Response.json({ error: "Database not available" }, { status: 503 });
      const { data, error } = await supabase
        .from("research_items")
        .insert({
          url: `paste://${Date.now()}`,
          title: title?.trim() || analysis.title,
          summary: analysis.summary,
          verdict: analysis.verdict,
          tags: analysis.tags ?? [],
          status: "review",
        })
        .select("id, url, title, summary, verdict, tags, status, created_at")
        .single();
      if (error) return Response.json({ error: error.message }, { status: 500 });
      return Response.json({ item: data }, { status: 201 });
    }

    if (!url || typeof url !== "string") {
      return Response.json({ error: "url or pasteText is required" }, { status: 400 });
    }

    // Normalize URL
    const targetUrl = url.startsWith("http") ? url : `https://${url}`;

    // --- Manual save path (site blocked fetch, user wrote their own notes) ---
    if (manual) {
      const supabase = getSupabaseServiceRoleClient();
      if (!supabase) {
        return Response.json({ error: "Database not available" }, { status: 503 });
      }
      const { data, error } = await supabase
        .from("research_items")
        .insert({
          url: targetUrl,
          title: title || targetUrl,
          summary: summary || null,
          verdict: verdict || null,
          tags: tags ?? [],
          status: "review",
        })
        .select("id, url, title, summary, verdict, tags, status, created_at")
        .single();
      if (error) return Response.json({ error: error.message }, { status: 500 });
      return Response.json({ item: data }, { status: 201 });
    }

    // --- Auto-fetch path ---
    // Fetch the page
    let rawHtml: string;
    try {
      const res = await fetch(targetUrl, {
        headers: { "User-Agent": "Chapterhouse/1.0 (research ingestion)" },
        signal: AbortSignal.timeout(15_000),
      });
      rawHtml = await res.text();
    } catch (e) {
      return Response.json({ error: `Could not fetch URL: ${String(e)}`, fetchFailed: true }, { status: 422 });
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

    const analysis = await analyzeText(text, targetUrl);

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
