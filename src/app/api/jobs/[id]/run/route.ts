import OpenAI from "openai";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type Params = { params: Promise<{ id: string }> };

// POST /api/jobs/[id]/run — execute the job in-process
// Called by the UI "Run" button. Updates progress live via Supabase Realtime.
export async function POST(_req: Request, { params }: Params) {
  const { id } = await params;

  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) return Response.json({ error: "Database not available" }, { status: 503 });

  // Load the job
  const { data: job, error: loadErr } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .single();

  if (loadErr || !job) return Response.json({ error: "Job not found" }, { status: 404 });
  if (job.status === "running")   return Response.json({ error: "Job is already running" }, { status: 409 });
  if (job.status === "completed") return Response.json({ error: "Job already completed" }, { status: 409 });
  if (job.status === "cancelled") return Response.json({ error: "Job was cancelled" }, { status: 409 });

  // Mark running
  await supabase.from("jobs").update({
    status: "running",
    started_at: new Date().toISOString(),
    worker_id: "vercel-serverless",
    progress: 0,
    progress_message: "Starting…",
  }).eq("id", id);

  const helpers = { supabase, jobId: id };

  try {
    let output: unknown;

    if (job.type === "research_batch") {
      output = await runResearchBatch(job.input_payload, helpers);
    } else if (job.type === "curriculum_factory") {
      output = await runCurriculumFactory(job.input_payload, helpers);
    } else if (job.type === "council_session") {
      output = await runCouncilSession(job.input_payload, helpers);
    } else {
      throw new Error(`Unknown job type: ${job.type}`);
    }

    await supabase.from("jobs").update({
      status: "completed",
      progress: 100,
      progress_message: "Done.",
      output,
      completed_at: new Date().toISOString(),
    }).eq("id", id);

    return Response.json({ ok: true, output });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await supabase.from("jobs").update({
      status: "failed",
      error: message,
      completed_at: new Date().toISOString(),
    }).eq("id", id);
    return Response.json({ error: message }, { status: 500 });
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────────

type WorkerHelpers = {
  supabase: ReturnType<typeof getSupabaseServiceRoleClient>;
  jobId: string;
};

async function setProgress(helpers: WorkerHelpers, progress: number, message: string) {
  await helpers.supabase!.from("jobs").update({ progress, progress_message: message }).eq("id", helpers.jobId);
}

// ── research_batch ─────────────────────────────────────────────────────────────
// input_payload: { urls: string[], sourceLabel?: string }

async function runResearchBatch(
  payload: { urls?: string[]; sourceLabel?: string },
  helpers: WorkerHelpers
) {
  const urls: string[] = Array.isArray(payload.urls) ? payload.urls : [];
  if (urls.length === 0) throw new Error("input_payload.urls must be a non-empty array");

  const results: Array<{ url: string; status: "saved" | "failed"; title?: string; error?: string }> = [];
  const total = urls.length;

  await setProgress(helpers, 0, `Processing 0 / ${total} URLs…`);

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    await setProgress(helpers, Math.round((i / total) * 90), `Fetching ${i + 1} / ${total}: ${url.slice(0, 60)}…`);

    try {
      const fetchRes = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; Chapterhouse/1.0)" },
        signal: AbortSignal.timeout(15_000),
      });
      const html = await fetchRes.text();

      const text = html
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s{2,}/g, " ")
        .trim()
        .slice(0, 4000);

      if (text.length < 50) throw new Error("Page returned no usable content");

      const analysis = await analyzeText(text, payload.sourceLabel ?? url);

      const { error: insertErr } = await helpers.supabase!.from("research_items").insert({
        url,
        title: analysis.title,
        summary: analysis.summary,
        verdict: analysis.verdict,
        tags: analysis.tags,
        status: "review",
      });

      if (insertErr) throw new Error(insertErr.message);
      results.push({ url, status: "saved", title: analysis.title });
    } catch (e) {
      results.push({ url, status: "failed", error: e instanceof Error ? e.message : String(e) });
    }
  }

  const saved = results.filter((r) => r.status === "saved").length;
  await setProgress(helpers, 95, `Saved ${saved} / ${total} items to Research…`);
  return { total, saved, failed: total - saved, results };
}

// ── curriculum_factory ────────────────────────────────────────────────────────
// input_payload: { subject: string, grade: string, topic: string, lessons: number }

async function runCurriculumFactory(
  payload: { subject?: string; grade?: string; topic?: string; lessons?: number },
  helpers: WorkerHelpers
) {
  const { subject = "Science", grade = "3", topic = "Water cycle", lessons = 5 } = payload;

  await setProgress(helpers, 10, `Generating ${lessons} ${subject} lessons for Grade ${grade}…`);

  const aiResponse = await openai.responses.create({
    model: "gpt-5.4",
    instructions: "You output only valid JSON. No markdown fences.",
    input: `You are a K-12 curriculum designer. Create ${lessons} lesson outlines for a ${grade}th-grade ${subject} unit on "${topic}".

For each lesson return:
- title: string
- objective: string (one sentence)
- key_concepts: string[] (3-5 items)
- activities: string[] (2-3 activities)
- assessment: string (one sentence)

Respond with ONLY valid JSON: { "unit_title": "string", "lessons": [...] }`,
    max_output_tokens: 2000,
  });

  await setProgress(helpers, 80, "Parsing lesson outlines…");

  const rawText = aiResponse.output
    .filter((b) => b.type === "message")
    .flatMap((b) => (b as { type: "message"; content: Array<{ type: string; text: string }> }).content)
    .filter((p) => p.type === "output_text")
    .map((p) => p.text)
    .join("");

  try {
    return JSON.parse(rawText);
  } catch {
    const match = rawText.match(/```(?:json)?\s*([\s\S]+?)```/);
    if (match) return JSON.parse(match[1]);
    return { raw: rawText };
  }
}

// ── council_session ────────────────────────────────────────────────────────────
// input_payload: { question: string, context?: string }

async function runCouncilSession(
  payload: { question?: string; context?: string },
  helpers: WorkerHelpers
) {
  const { question, context } = payload;
  if (!question) throw new Error("input_payload.question is required");

  await setProgress(helpers, 20, "Convening the Council of the Unserious…");

  const aiResponse = await openai.responses.create({
    model: "gpt-5.4",
    input: `You are the Council of the Unserious (Gandalf, Data, Polgara, Earl, Beavis & Butthead). Scott Somers is asking for your collective wisdom.

${context ? `Context:\n${context}\n\n` : ""}Question: ${question}

Each member who has something meaningful to contribute should speak in character. Arguments between members are encouraged when there is genuine disagreement. Keep it focused and actionable.`,
    max_output_tokens: 1500,
  });

  await setProgress(helpers, 80, "Council deliberating…");

  const response = aiResponse.output
    .filter((b) => b.type === "message")
    .flatMap((b) => (b as { type: "message"; content: Array<{ type: string; text: string }> }).content)
    .filter((p) => p.type === "output_text")
    .map((p) => p.text)
    .join("");

  return { question, response };
}

// ── AI text analysis ──────────────────────────────────────────────────────────

async function analyzeText(text: string, sourceLabel: string) {
  const aiResponse = await openai.responses.create({
    model: "gpt-5.4",
    instructions: "You output only valid JSON. No markdown fences.",
    input: `You are analyzing content for relevance to Scott Somers and the Next Chapter Homeschool Outpost operation.

CRITICAL CONTEXT:
1. NEXT CHAPTER HOMESCHOOL OUTPOST — Shopify homeschool store. Curated books, curriculum, games. Ingram Spark dropship.
2. SCOTT IS A VIBE-CODER. Builds everything using AI coding assistants. AI tool/model updates are HIGH RELEVANCE.
3. SOMERSCHOOL — standalone K-12 curriculum SaaS. All secular. Off Epic Learning March 2026.
4. ANNA — USA Today bestselling Christian author + podcaster.
5. CHAPTERHOUSE — internal AI operating system Scott is actively building.

Source: ${sourceLabel}

Content:
${text.slice(0, 4000)}

Respond with ONLY valid JSON:
{
  "title": "string",
  "summary": "string — 2-3 sentences",
  "verdict": "string — 1-2 sentences on relevance. Specify which part of the operation this affects.",
  "tags": ["string"] — 2-5 tags from: competitor, market, curriculum, content, product, audience, platform, pricing, distribution, social, news, tools, ai, strategy, vibe-coding
}`,
    max_output_tokens: 512,
  });

  const rawText = aiResponse.output
    .filter((b) => b.type === "message")
    .flatMap((b) => (b as { type: "message"; content: Array<{ type: string; text: string }> }).content)
    .filter((p) => p.type === "output_text")
    .map((p) => p.text)
    .join("");

  try {
    return JSON.parse(rawText) as { title: string; summary: string; verdict: string; tags: string[] };
  } catch {
    const match = rawText.match(/```(?:json)?\s*([\s\S]+?)```/);
    if (match) return JSON.parse(match[1]) as { title: string; summary: string; verdict: string; tags: string[] };
    return { title: sourceLabel, summary: text.slice(0, 200), verdict: "Could not analyze.", tags: [] };
  }
}
