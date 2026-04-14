/**
 * POST /api/documents/outline
 *
 * Generates a structural outline for a document type before full generation.
 * Uses Claude Haiku 4.5 for fast, cheap outline generation (~$0.001/outline).
 *
 * Body:
 *   doc_type: string        — valid DOC_TYPE_MAP key
 *   title: string           — working title
 *   fields: Record<string, string>  — form field values (optional context)
 *   brand_voice_id?: string — optional brand voice UUID
 */

import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { handleRouteError } from "@/lib/route-helpers";
import { getAuthenticatedUserId } from "@/lib/auth-context";
import { DOC_TYPE_MAP } from "@/lib/doc-type-prompts";

const outlineSchema = z.object({
  doc_type: z.string().min(1),
  title: z.string().min(1).max(500),
  fields: z.record(z.string(), z.string()).optional(),
  brand_voice_id: z.string().uuid().optional(),
});

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
}

export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUserId().catch(() => null);
    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const parsed = outlineSchema.parse(body);

    const docDef = DOC_TYPE_MAP[parsed.doc_type];
    if (!docDef) {
      return Response.json(
        { error: `Unknown doc_type: ${parsed.doc_type}` },
        { status: 400 }
      );
    }

    const fieldsContext = parsed.fields
      ? Object.entries(parsed.fields)
          .filter(([, v]) => v?.trim())
          .map(([k, v]) => `- ${k}: ${v}`)
          .join("\n")
      : "No additional context provided.";

    const anthropic = getAnthropic();
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: `You generate structural outlines for documents. Return ONLY valid JSON — no markdown fences, no explanation.`,
      messages: [
        {
          role: "user",
          content: `Generate a structural outline for a "${docDef.label}" document.

Title: ${parsed.title}

Context from form fields:
${fieldsContext}

Document description: ${docDef.description}

Return JSON in this exact format:
{
  "sections": [
    {"id": "sec_1", "title": "Section Title", "guidance": "One sentence describing what belongs here.", "sort_order": 1},
    {"id": "sec_2", "title": "Section Title", "guidance": "One sentence describing what belongs here.", "sort_order": 2}
  ]
}

Generate 4-8 sections appropriate for this document type. Each section should be a meaningful structural unit. Use sequential id format: sec_1, sec_2, etc.`,
        },
      ],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";

    // Parse the JSON response — try raw first, then extract from markdown fences
    let outline;
    try {
      outline = JSON.parse(text);
    } catch {
      const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (match) {
        outline = JSON.parse(match[1].trim());
      } else {
        throw new Error("Failed to parse outline JSON from AI response");
      }
    }

    return Response.json({
      outline: {
        sections: outline.sections,
        generated_at: new Date().toISOString(),
        model: "claude-haiku-4-5",
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
