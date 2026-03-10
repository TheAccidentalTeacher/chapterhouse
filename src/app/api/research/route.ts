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

// DELETE /api/research?id=xxx — remove a research item
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return Response.json({ error: "id required" }, { status: 400 });
  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) return Response.json({ error: "Database not available" }, { status: 503 });
  const { error } = await supabase.from("research_items").delete().eq("id", id);
  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}

// PATCH /api/research?id=xxx — update status (approve → saved, reject → rejected)
export async function PATCH(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return Response.json({ error: "id required" }, { status: 400 });

  const body = await request.json();
  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) return Response.json({ error: "Database not available" }, { status: 503 });

  const { data, error } = await supabase
    .from("research_items")
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ item: data });
}

// POST /api/research — ingest a URL, or save manually
// Helper: run AI analysis on any text block
async function analyzeText(text: string, sourceLabel: string) {
  const prompt = `You are analyzing content for relevance to Scott Somers and the Next Chapter Homeschool Outpost operation.

CRITICAL CONTEXT — you must understand all of this before judging relevance:

1. NEXT CHAPTER HOMESCHOOL OUTPOST — Scott and Anna Somers' Shopify homeschool store. Sells curated books, curriculum, games, digital products. Powered by Ingram Spark dropship. Target customer: homeschool moms. Launching 2026.

2. SCOTT IS A VIBE-CODER. He builds everything — the store tools, the Chapterhouse internal system, curriculum production pipelines, AI-assisted content — using AI coding assistants (Claude, GPT, Cursor, etc.) with zero traditional coding background. New AI coding tools, agent capabilities, LLM updates, and generative AI advances are HIGHLY RELEVANT because they directly expand what Scott can build and how fast he can build it. This is not a tangential interest — it is his core production infrastructure.

3. SOMERSCHOOL / CURRICULUM PRODUCTION — Scott produces K-12 courses using AI pipelines (Claude → Gemini → Grok → ElevenLabs). Advances in AI content generation, audio synthesis, image generation, or document production are directly relevant.

4. ANNA IS AN AUTHOR AND PODCASTER — Content creation tools, AI writing assistants, podcast workflow tools, and audience-building platforms are relevant to her side of the operation.

5. CHAPTERHOUSE — The internal AI operating system Scott built and is actively developing. Updates to AI APIs (OpenAI, Anthropic), new model capabilities, agent frameworks, and developer tooling affect this system directly.

RELEVANCE TIERS:
- HIGH: Homeschool market intelligence (competitors, pricing, trends, audience behavior), new AI coding/agent capabilities, new AI model releases, tools Scott could use to build or produce faster
- MEDIUM: Broader AI/tech trends, content marketing strategies, e-commerce tactics, education trends
- LOW: General business news with no direct application

Source: ${sourceLabel}

Content:
${text.slice(0, 4000)}

Respond with ONLY valid JSON:
{
  "title": "string — a clear descriptive title for this piece",
  "summary": "string — 2-3 sentences summarizing what this is about",
  "verdict": "string — 1-2 sentences on relevance to Scott/Next Chapter. Be specific about WHICH part of the operation this affects (store, vibe-coding, curriculum production, Chapterhouse, Anna's content). If it's an AI tool update, say explicitly what Scott might be able to do with it.",
  "tags": ["string"] — 2-5 tags from: competitor, market, curriculum, content, product, audience, platform, pricing, distribution, social, news, tools, ai, strategy, vibe-coding
}

Be direct. No filler. Do not undersell AI tool relevance.`;

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
                text: `You are analyzing a screenshot for relevance to Scott Somers and the Next Chapter Homeschool Outpost operation.\n\nCRITICAL CONTEXT: Next Chapter is a homeschool store (Shopify, books/curriculum/digital products) AND an AI-powered production operation. Scott is a vibe-coder who builds everything using AI coding assistants — new agent capabilities, IDE tools, and LLM updates are HIGH relevance. SomerSchool produces AI-generated K-12 curriculum. Chapterhouse is an internal AI operating system Scott is actively building. Anna is a USA Today bestselling author and podcaster.\n\nSource: ${label}\n\nDescribe what you see in this image, then analyze it through this full lens.\n\nRespond with ONLY valid JSON:\n{\n  "title": "string — clear descriptive title for what this shows",\n  "summary": "string — 2-3 sentences: what is in the image and what's notable",\n  "verdict": "string — 1-2 sentences on relevance. Specify WHICH part of the operation this affects (store, vibe-coding, curriculum, Chapterhouse, Anna's content). If it's an AI tool, say what Scott could do with it.",\n  "tags": ["string"] — 2-5 tags from: competitor, market, curriculum, content, product, audience, platform, pricing, distribution, social, news, tools, ai, strategy, vibe-coding\n}`,
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

    // --- Brief item path (headline + whyItMatters from daily brief, no URL/AI needed) ---
    if (body.briefItem) {
      if (!title?.trim()) {
        return Response.json({ error: "title is required" }, { status: 400 });
      }
      const supabase = getSupabaseServiceRoleClient();
      if (!supabase) return Response.json({ error: "Database not available" }, { status: 503 });
      const { data, error } = await supabase
        .from("research_items")
        .insert({
          url: `brief://${Date.now()}`,
          title: title.trim(),
          summary: summary || null,
          verdict: null,
          tags: ["brief"],
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

    // SSRF protection — block fetches to internal/private IP ranges
    try {
      const parsed = new URL(targetUrl);
      const hostname = parsed.hostname;
      if (
        hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname === "0.0.0.0" ||
        /^10\./.test(hostname) ||
        /^192\.168\./.test(hostname) ||
        /^172\.(1[6-9]|2\d|3[01])\./.test(hostname) ||
        /^169\.254\./.test(hostname) ||  // link-local / AWS metadata
        /^::1$/.test(hostname) ||         // IPv6 loopback
        /^fc00:/i.test(hostname) ||        // IPv6 unique local
        !["http:", "https:"].includes(parsed.protocol)
      ) {
        return Response.json({ error: "URL not allowed" }, { status: 400 });
      }
    } catch {
      return Response.json({ error: "Invalid URL" }, { status: 400 });
    }

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
