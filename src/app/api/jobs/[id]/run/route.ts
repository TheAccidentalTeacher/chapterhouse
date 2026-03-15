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
// input_payload: { subject: string, gradeLevel: number, duration: string }

const SUBJECT_CODES: Record<string, string> = {
  science: "sci", biology: "sci", chemistry: "sci", physics: "sci",
  math: "mth", mathematics: "mth", algebra: "mth", geometry: "mth",
  "language arts": "ela", ela: "ela", english: "ela", reading: "ela",
  history: "hst", "social studies": "hst", geography: "hst", civics: "hst",
  bible: "bib", art: "art", music: "mus", pe: "pe",
};

const FW_SHORT: Record<string, string> = {
  science: "NGSS", biology: "NGSS", chemistry: "NGSS", physics: "NGSS",
  math: "CCSS-Math", mathematics: "CCSS-Math", algebra: "CCSS-Math",
  "language arts": "CCSS-ELA", ela: "CCSS-ELA", english: "CCSS-ELA",
  history: "C3", "social studies": "C3", geography: "C3", civics: "C3",
  bible: "internal", art: "internal", music: "internal", pe: "internal",
};

function lookupCode(map: Record<string, string>, subject: string): string {
  const lower = subject.toLowerCase().trim();
  if (map[lower]) return map[lower];
  for (const [key, val] of Object.entries(map)) {
    if (lower.includes(key)) return val;
  }
  return lower.slice(0, 3);
}

function gradeBand(g: number): string {
  if (g <= 2) return "early_elementary";
  if (g <= 5) return "upper_elementary";
  if (g <= 8) return "middle";
  return "high";
}

async function runCurriculumFactory(
  payload: { subject?: string; gradeLevel?: number; grade?: string; duration?: string },
  helpers: WorkerHelpers
) {
  const subject = payload.subject ?? "Science";
  const gradeLevel = payload.gradeLevel ?? (Number(payload.grade) || 3);
  const duration = payload.duration ?? "full year";
  const subjectCode = lookupCode(SUBJECT_CODES, subject);
  const framework = lookupCode(FW_SHORT, subject);
  const band = gradeBand(gradeLevel);
  const courseId = `${subjectCode}-g${gradeLevel}`;

  await setProgress(helpers, 10, `Generating ${subject} scope & sequence for Grade ${gradeLevel}…`);

  const aiResponse = await openai.responses.create({
    model: "gpt-5.4",
    instructions: "You output only valid JSON. No markdown fences, no commentary.",
    input: `You are a K-12 curriculum designer. Create a complete scope & sequence for Grade ${gradeLevel} ${subject} (${duration}).

DESIGN PRINCIPLE: NO COOKIE CUTTERS. Every unit can have a different number of lessons. Every lesson gets a different style and energy level. Structure serves learning — learning does not serve structure.

Output this EXACT JSON structure:
{
  "id": "${courseId}",
  "schema_version": "1.0",
  "subject": "${subject}",
  "subject_code": "${subjectCode}",
  "grade": ${gradeLevel},
  "grade_band": "${band}",
  "title": "Grade ${gradeLevel} ${subject}",
  "subtitle": "<descriptive subtitle>",
  "faith_integration": false,
  "theology_profile": "none",
  "standards_framework": "${framework}",
  "units": [
    {
      "unit_number": 1,
      "title": "<unit title>",
      "description": "<1-3 sentence description>",
      "pacing": "<N+1 pattern, e.g. 5+1, 4+1, 3+1, 6+1>",
      "lessons": [
        {
          "lesson_number": 1,
          "title": "<lesson title>",
          "big_idea": "<one sentence>",
          "standards": ["<real ${framework} standard codes for grade ${gradeLevel}>"],
          "key_concepts": ["<2-5 short phrases>"],
          "style": "<exploration|deep_dive|hands_on|story_driven|challenge|creative|review_game|field_journal|debate|lab>",
          "energy": "<high|medium|low>"
        },
        {
          "lesson_number": "<last in unit>",
          "title": "Unit N Review: ...",
          "big_idea": "<cumulative review>",
          "standards": ["<all major standards from unit>"],
          "key_concepts": ["<takeaways from teaching lessons>"],
          "is_review_lesson": true,
          "style": "review_game",
          "energy": "high"
        }
      ]
    }
  ],
  "meta": {
    "generated_at": "${new Date().toISOString()}",
    "generated_by": "chapterhouse-inline-runner",
    "total_units": "<number>",
    "total_lessons": "<actual sum of all lessons across all units>"
  }
}

STRUCTURAL RULES:
- Create 4 units. Each unit has 3-8 lessons (pick the right count for the content).
- Different units SHOULD have different lesson counts. Mix it up: e.g. one unit 5+1, another 4+1, another 6+1.
- Pacing = "N+1" where N = teaching lessons, 1 = review. E.g. "5+1" = 6 total lessons.
- The LAST lesson in every unit is ALWAYS a review with "is_review_lesson": true.
- total_lessons = actual sum (not a formula).

LESSON VARIETY RULES:
- Every lesson MUST have "style" and "energy" fields.
- Style options: exploration, deep_dive, hands_on, story_driven, challenge, creative, review_game, field_journal, debate, lab.
- Energy options: high, medium, low.
- Vary styles and energy within each unit — never repeat the same style or energy consecutively.
- Review lessons: style = "review_game", energy = "high".

CONTENT RULES:
- Use REAL ${framework} standard codes appropriate for grade ${gradeLevel}.
- All content must be secular (Alaska Statute 14.03.320).
- Output ONLY the JSON object.`,
    max_output_tokens: 6000,
  });

  await setProgress(helpers, 80, "Parsing structured output…");

  const rawText = aiResponse.output
    .filter((b) => b.type === "message")
    .flatMap((b) => (b as { type: "message"; content: Array<{ type: string; text: string }> }).content)
    .filter((p) => p.type === "output_text")
    .map((p) => p.text)
    .join("");

  let structured: Record<string, unknown>;
  try {
    structured = JSON.parse(rawText);
  } catch {
    const match = rawText.match(/```(?:json)?\s*([\s\S]+?)```/);
    if (match) {
      structured = JSON.parse(match[1]);
    } else {
      structured = { raw: rawText };
    }
  }

  return {
    subject,
    gradeLevel,
    duration,
    finalScopeAndSequence: `# ${subject} — Grade ${gradeLevel}\n\nGenerated via inline runner. See structured output for pipeline-ready JSON.`,
    structuredOutput: structured,
    operationalAssessment: null,
    engagementReport: null,
    draftsRetained: null,
    generatedAt: new Date().toISOString(),
  };
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
