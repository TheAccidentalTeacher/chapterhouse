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

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
}

const bodySchema = z.object({
  doc_type: z.string().min(1),
  inputs: z.record(z.string(), z.string()),
  title: z.string().optional(),
  save: z.boolean().optional().default(false),
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

    const { doc_type, inputs, title, save } = parsed.data;

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
    const userPrompt = docDef.buildPrompt(inputs);

    // Build live context (founder notes, research, brief)
    const liveContext = await buildDocumentContext();

    // System prompt = base Scott context + live context + doc-type-specific guidance
    const systemPrompt =
      BASE_SYSTEM_PROMPT +
      liveContext +
      "\n\n---\n\n## Document Type: " + docDef.label + "\n\n" +
      docDef.systemPromptSuffix;

    // Stream via Anthropic — always Claude Sonnet 4.6 for single-pass generation
    const encoder = new TextEncoder();
    const anthropic = getAnthropic();

    const anthropicStream = anthropic.messages.stream({
      model: "claude-sonnet-4-5",
      max_tokens: 4096,
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
