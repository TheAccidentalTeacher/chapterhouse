/**
 * POST /api/brand-voices/analyze
 *
 * Paste 1-5 writing samples → AI extracts voice/tone/style → returns a cohesive
 * voice description suitable for use as an AI writing prompt.
 * Uses Claude Haiku 4.5 for fast analysis (~$0.002/analysis).
 *
 * Body:
 *   samples: string[]  — 1-5 writing samples (50-5000 chars each)
 *   brand_name?: string — optional brand label
 */

import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { handleRouteError } from "@/lib/route-helpers";
import { getAuthenticatedUserId } from "@/lib/auth-context";

const analyzeSchema = z.object({
  samples: z.array(z.string().min(50).max(5000)).min(1).max(5),
  brand_name: z.string().optional(),
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
    const parsed = analyzeSchema.parse(body);

    const samplesText = parsed.samples
      .map((s, i) => `--- SAMPLE ${i + 1} ---\n${s}`)
      .join("\n\n");

    const anthropic = getAnthropic();
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: `You are a voice analysis expert. Analyze writing samples and extract a brand voice description that can be used as an AI writing prompt. Be specific about tone, vocabulary patterns, sentence structure, emotional register, what the writer avoids, and what makes this voice distinctive.`,
      messages: [
        {
          role: "user",
          content: `Analyze these ${parsed.samples.length} writing samples${parsed.brand_name ? ` for the brand "${parsed.brand_name}"` : ""} and extract the brand voice.

${samplesText}

Return a single cohesive voice description (2-4 paragraphs) that could be used as an AI writing prompt to replicate this voice. Focus on:
1. Tone and emotional register
2. Vocabulary patterns (words they favor, words they avoid)
3. Sentence structure and rhythm
4. Distinctive quirks or patterns
5. What this writer never does`,
        },
      ],
    });

    const voiceText =
      response.content[0].type === "text" ? response.content[0].text : "";

    return Response.json({
      voice_text: voiceText,
      brand_name: parsed.brand_name || "Analyzed Voice",
      sample_count: parsed.samples.length,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
