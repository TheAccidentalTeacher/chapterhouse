/**
 * POST /api/documents/generate
 *
 * Streams a generated document via SSE (plain text streaming) using the
 * Documents Studio doc-type-prompts.ts definitions.
 *
 * Body:
 *   doc_type: string         — must be a valid DOC_TYPE_MAP key
 *   inputs: Record<string, string>  — form field values (keyed by DocField.key)
 *   title?: string           — optional override; falls back to defaultTitle(inputs)
 *   save?: boolean           — save finished content to documents table (default: false)
 *
 * Streams back plain text (UTF-8). On completion, if save=true, inserts the
 * full document into the Supabase documents table.
 */

import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";
import { getAuthenticatedUserId } from "@/lib/auth-context";
import { DOC_TYPE_MAP } from "@/lib/doc-type-prompts";

// Base context injected into every document generation call.
// Keep Scott's identity, brand rules, and AI guardrails here.
const BASE_SYSTEM_PROMPT = `You are Chapterhouse — the internal intelligence layer for Scott and Anna Somers.

Scott Somers: middle school teacher, Glennallen Alaska. Teaching contract ends May 24, 2026. Building SomersSchool (homeschool SaaS) and NCHO (Shopify homeschool store). Everything built here serves the goal of meaningful revenue before August 2026.

Anna Somers: pen name Alana Terry, USA Today bestselling Christian fiction author, co-builds NCHO.

**Non-negotiable brand rules:**
- ALWAYS "your child" — never "your student" or "the learner"
- NCHO: Red/white visual identity. Emotional lead ("for the child who doesn't fit in a box"), practical convert ("one-stop homeschool shop")
- SomersSchool: Red/white. Secular (Alaska Statute 14.03.320). Visible progress is the retention mechanism.
- Alana Terry / PCW: separate brand — no cross-promotion with NCHO or SomersSchool
- Anti-hallucination: flag any unverifiable stat with ⚠️. A fabricated market number is worse than no number.
- No filler phrases: "In conclusion", "It's worth noting", "I hope this helps", etc.`;

// Pulls live context from Supabase for document generation:
// founder notes, latest brief excerpt, recent high-scored research.
async function buildDocumentContext(): Promise<string> {
  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) return "";

  const blocks: string[] = [];

  try {
    // Active founder notes (exclude dismissed)
    const { data: notes } = await supabase
      .from("founder_notes")
      .select("content")
      .neq("category", "dismissed")
      .order("created_at", { ascending: false })
      .limit(30);
    if (notes && notes.length > 0) {
      blocks.push(
        "## Founder Memory\n\n" +
        notes.map((n) => `- ${n.content}`).join("\n")
      );
    }
  } catch { /* non-fatal */ }

  try {
    // Latest daily brief (top portion only)
    const { data: briefs } = await supabase
      .from("briefs")
      .select("content, created_at")
      .order("created_at", { ascending: false })
      .limit(1);
    if (briefs && briefs.length > 0) {
      const excerpt = (briefs[0].content as string).slice(0, 2000);
      blocks.push(`## Latest Daily Brief (excerpt)\n\n${excerpt}...`);
    }
  } catch { /* non-fatal */ }

  try {
    // Top recent research items
    const { data: research } = await supabase
      .from("research_items")
      .select("title, summary, verdict, tags")
      .order("created_at", { ascending: false })
      .limit(10);
    if (research && research.length > 0) {
      const items = research
        .map((r) => `- **${r.title}**: ${r.summary || r.verdict || ""}`)
        .join("\n");
      blocks.push(`## Recent Research\n\n${items}`);
    }
  } catch { /* non-fatal */ }

  return blocks.length > 0 ? "\n\n---\n\n" + blocks.join("\n\n---\n\n") : "";
}

interface CitationResult {
  title: string;
  authors: string;
  year: number | null;
  abstract: string;
  doi: string | null;
}

async function searchSemanticScholar(query: string): Promise<CitationResult[]> {
  try {
    const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&fields=title,authors,year,abstract,externalIds&limit=12`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Chapterhouse/1.0 (scholarly research tool)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const json = (await res.json()) as {
      data?: Array<{
        title?: string;
        authors?: Array<{ name: string }>;
        year?: number;
        abstract?: string;
        externalIds?: { DOI?: string };
      }>;
    };
    return (json.data ?? []).map((p) => ({
      title: p.title ?? "Untitled",
      authors: (p.authors ?? []).map((a) => a.name).join(", ") || "Unknown",
      year: p.year ?? null,
      abstract: (p.abstract ?? "").slice(0, 400),
      doi: p.externalIds?.DOI ?? null,
    }));
  } catch {
    return [];
  }
}

async function buildAcademicPaperContext(
  userId: string,
  inputs: Record<string, string>
): Promise<{ enrichedPrompt: string; model: string; maxTokens: number }> {
  const supabase = getSupabaseServiceRoleClient();
  const docBlocks: string[] = [];

  if (inputs.doc1_id && supabase) {
    const { data: doc1 } = await supabase
      .from("documents")
      .select("title, content")
      .eq("id", inputs.doc1_id)
      .eq("user_id", userId)
      .single();
    if (doc1) {
      docBlocks.push(
        `## SOURCE DOCUMENT 1: ${doc1.title}\n\n${(doc1.content ?? "").slice(0, 8000)}`
      );
    }
  }

  if (inputs.doc2_id && supabase) {
    const { data: doc2 } = await supabase
      .from("documents")
      .select("title, content")
      .eq("id", inputs.doc2_id)
      .eq("user_id", userId)
      .single();
    if (doc2) {
      docBlocks.push(
        `## SOURCE DOCUMENT 2: ${doc2.title}\n\n${(doc2.content ?? "").slice(0, 8000)}`
      );
    }
  }

  const citations = await searchSemanticScholar(
    inputs.thesis ?? "comparative biblical theology eschatology"
  );

  const citationBlock =
    citations.length > 0
      ? `## PEER-REVIEWED SOURCES FROM SEMANTIC SCHOLAR\n\nYou MUST only cite papers from this list. Do NOT invent or fabricate any source not listed here.\n\n${citations
          .map(
            (c, i) =>
              `[${i + 1}] ${c.authors} (${c.year ?? "n.d."}). "${c.title}".${c.doi ? ` https://doi.org/${c.doi}` : ""}\n   Abstract: ${c.abstract}`
          )
          .join("\n\n")}`
      : `## PEER-REVIEWED SOURCES\n\nSemantic Scholar search returned no results for this query. Do NOT invent citations. Acknowledge the limitation in the paper.`;

  const enrichedPrompt = [
    docBlocks.length > 0
      ? docBlocks.join("\n\n---\n\n")
      : "## SOURCE DOCUMENTS\n\nNo source documents were found. Generate based on the thesis alone.",
    citationBlock,
    `## PAPER PARAMETERS\n\nThesis / Research Question: ${inputs.thesis || "(not specified)"}\nTarget Length: ${inputs.page_length || "12 pages"}\nCitation Style: ${inputs.citation_style || "APA"}${inputs.additional_guidance ? `\nAdditional Guidance: ${inputs.additional_guidance}` : ""}`,
    `Write a complete, properly structured academic comparison paper using the two source documents and ONLY the provided peer-reviewed citations. Include all standard sections: Abstract, Introduction, Literature Review, Comparative Analysis, Discussion, Conclusion, and References. Format entirely as Markdown (## headings). Use ${inputs.citation_style || "APA"} style for all inline citations and the References section.`,
  ].join("\n\n---\n\n");

  return { enrichedPrompt, model: "claude-opus-4-5", maxTokens: 8192 };
}

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
}

const outlineSectionSchema = z.object({
  id: z.string(),
  title: z.string(),
  guidance: z.string(),
  sort_order: z.number(),
});

const bodySchema = z.object({
  doc_type: z.string().min(1),
  inputs: z.record(z.string(), z.string()),
  title: z.string().optional(),
  save: z.boolean().optional().default(false),
  brand_voice_id: z.string().uuid().optional(),
  outline: z.object({ sections: z.array(outlineSectionSchema) }).optional(),
});

export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    // Auth first — Documents Studio requires a logged-in user
    const userId = await getAuthenticatedUserId().catch(() => null);
    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: "Invalid request", details: parsed.error.flatten() }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { doc_type, inputs, title, save, brand_voice_id, outline } = parsed.data;

    // Look up the doc type definition
    const docDef = DOC_TYPE_MAP[doc_type];
    if (!docDef) {
      return new Response(
        JSON.stringify({ error: `Unknown doc_type: ${doc_type}` }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate required fields
    const missingRequired = docDef.fields
      .filter((f) => f.required && !inputs[f.key]?.trim())
      .map((f) => f.key);
    if (missingRequired.length > 0) {
      return new Response(
        JSON.stringify({ error: "Missing required fields", fields: missingRequired }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Build the user prompt from the doc type definition
    let userPrompt = docDef.buildPrompt(inputs);
    let modelToUse: string = "claude-sonnet-4-5";
    let maxTokensToUse: number = 4096;

    // Phase 21A: Inject outline structure into prompt if provided
    if (outline?.sections?.length) {
      const outlineText = outline.sections
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((s, i) => `${i + 1}. **${s.title}** — ${s.guidance}`)
        .join("\n");
      userPrompt += `\n\n---\n\nFollow this outline structure exactly:\n\n${outlineText}`;
    }

    // Academic Paper: fetch source documents from Supabase + real peer-reviewed
    // citations from Semantic Scholar, then override prompt and model params.
    if (doc_type === "academic_paper") {
      const academicCtx = await buildAcademicPaperContext(userId, inputs);
      userPrompt = academicCtx.enrichedPrompt;
      modelToUse = academicCtx.model;
      maxTokensToUse = academicCtx.maxTokens;
    }

    // Build live context (founder notes, research, brief)
    const liveContext = await buildDocumentContext();

    // Phase 20C: Brand voice injection
    let brandVoiceBlock = "";
    if (brand_voice_id) {
      const supabase = getSupabaseServiceRoleClient();
      if (supabase) {
        const { data: voice } = await supabase
          .from("brand_voices")
          .select("brand, voice_text")
          .eq("id", brand_voice_id)
          .single();
        if (voice?.voice_text) {
          brandVoiceBlock = `\n\nBRAND VOICE — Write in this voice:\n${voice.voice_text}\n`;
          // NCHO safety net: "your child" not "your student" — A/B tested, locked
          if (voice.brand === "ncho") {
            brandVoiceBlock += `\nIMPORTANT: Always say "your child" — never "your student" or "the learner."\n`;
          }
        }
      }
    }

    // System prompt = base Scott context + brand voice + live context + doc-type-specific guidance
    const systemPrompt =
      BASE_SYSTEM_PROMPT +
      brandVoiceBlock +
      liveContext +
      "\n\n---\n\n## Document Type: " + docDef.label + "\n\n" +
      docDef.systemPromptSuffix;

    // Stream via Anthropic — always Claude Sonnet 4.6 for single-pass generation
    const encoder = new TextEncoder();
    const anthropic = getAnthropic();

    const anthropicStream = anthropic.messages.stream({
      model: modelToUse,
      max_tokens: maxTokensToUse,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    // If save=true, accumulate all chunks and persist after stream ends
    let fullContent = "";
    const shouldSave = save === true;

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of anthropicStream) {
            if (
              chunk.type === "content_block_delta" &&
              chunk.delta.type === "text_delta"
            ) {
              const text = chunk.delta.text;
              controller.enqueue(encoder.encode(text));
              if (shouldSave) fullContent += text;
            }
          }
          controller.close();

          // Persist to documents table after stream completes
          if (shouldSave && fullContent.trim()) {
            const supabase = getSupabaseServiceRoleClient();
            if (supabase) {
              const docTitle = title?.trim() || docDef.defaultTitle(inputs);
              const wordCount = fullContent.trim().split(/\s+/).length;
              await supabase.from("documents").insert({
                user_id: userId,
                doc_type,
                title: docTitle,
                content: fullContent.trim(),
                input_params: inputs,
                word_count: wordCount,
                ...(outline ? { outline } : {}),
              });
            }
          }
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Documents generate error:", error);
    return new Response("Generation failed", { status: 500 });
  }
}
