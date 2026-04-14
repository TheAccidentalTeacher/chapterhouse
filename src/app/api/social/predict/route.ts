/**
 * POST /api/social/predict
 *
 * AI-predicted engagement score (0-100) on a social post.
 * Uses Claude Haiku 4.5 for fast, cheap scoring (~$0.001/prediction).
 *
 * Phase 25A: Performance Prediction Scoring
 */

import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { handleRouteError } from "@/lib/route-helpers";
import { getAuthenticatedUserId } from "@/lib/auth-context";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

const predictSchema = z.object({
  post_id: z.string().uuid(),
});

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
}

export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUserId().catch(() => null);
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const body = await request.json();
    const parsed = predictSchema.parse(body);

    const supabase = getSupabaseServiceRoleClient();
    if (!supabase) return Response.json({ error: "DB unavailable" }, { status: 500 });

    const { data: post, error: fetchErr } = await supabase
      .from("social_posts")
      .select("id, post_text, platform, brand, hashtags")
      .eq("id", parsed.post_id)
      .single();

    if (fetchErr || !post) {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    const anthropic = getAnthropic();
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 512,
      system: "You score social media posts for predicted engagement. Return ONLY valid JSON.",
      messages: [
        {
          role: "user",
          content: `Score this social media post for predicted engagement (0-100).

Platform: ${post.platform}
Brand: ${post.brand}
Text: ${post.post_text}
Hashtags: ${(post.hashtags ?? []).join(", ")}

Consider: platform fit, hook strength, CTA presence, hashtag relevance, emotional appeal, shareability.

Return JSON: {"score": <number 0-100>, "reasoning": "<1 sentence>", "suggestions": ["<improvement 1>", "<improvement 2>"]}`,
        },
      ],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    let result;
    try {
      result = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      result = match ? JSON.parse(match[0]) : { score: 50, reasoning: "Parse failed", suggestions: [] };
    }

    // Update predicted_score on the post
    await supabase
      .from("social_posts")
      .update({ predicted_score: result.score })
      .eq("id", parsed.post_id);

    return Response.json({
      score: result.score,
      reasoning: result.reasoning,
      suggestions: result.suggestions ?? [],
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
