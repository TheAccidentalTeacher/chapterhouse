/**
 * POST /api/social/boost
 *
 * AI rewrite of underperforming posts using top-performing posts as examples.
 * Preserves original in edit_history. Anti-hallucination: no fabricated claims.
 *
 * Phase 25B: Boost This Post
 */

import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { handleRouteError } from "@/lib/route-helpers";
import { getAuthenticatedUserId } from "@/lib/auth-context";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

const boostSchema = z.object({
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
    const parsed = boostSchema.parse(body);

    const supabase = getSupabaseServiceRoleClient();
    if (!supabase) return Response.json({ error: "DB unavailable" }, { status: 500 });

    // Fetch target post
    const { data: post, error: fetchErr } = await supabase
      .from("social_posts")
      .select("*")
      .eq("id", parsed.post_id)
      .single();

    if (fetchErr || !post) {
      return Response.json({ error: "Post not found" }, { status: 404 });
    }

    // Fetch top 10 published posts by engagement, same brand + platform
    const { data: topPosts } = await supabase
      .from("social_posts")
      .select("post_text, hashtags, engagement_data, predicted_score")
      .eq("brand", post.brand)
      .eq("platform", post.platform)
      .eq("status", "published")
      .not("engagement_data", "is", null)
      .order("predicted_score", { ascending: false })
      .limit(10);

    const topPostsContext = (topPosts ?? [])
      .map((p, i) => `[${i + 1}] ${p.post_text} (score: ${p.predicted_score ?? "N/A"})`)
      .join("\n\n");

    const anthropic = getAnthropic();
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250514",
      max_tokens: 1024,
      system: "You rewrite social media posts to improve engagement. Return ONLY valid JSON.",
      messages: [
        {
          role: "user",
          content: `Here are top-performing ${post.brand} ${post.platform} posts:\n\n${topPostsContext || "No top posts available yet."}\n\nRewrite this underperforming post to match the patterns that work:\n\n${post.post_text}\n\nKeep the same topic and brand voice. Improve style and engagement patterns. Do NOT add new factual claims, statistics, or testimonials that weren't in the original.\n\nReturn JSON: {"boosted_text": "<rewritten post>", "changes": ["<change 1>", "<change 2>"]}`,
        },
      ],
    });

    const text = response.content[0].type === "text" ? response.content[0].text : "";
    let result;
    try {
      result = JSON.parse(text);
    } catch {
      const match = text.match(/\{[\s\S]*\}/);
      result = match ? JSON.parse(match[0]) : null;
    }

    if (!result?.boosted_text) {
      return Response.json({ error: "Boost generation failed" }, { status: 500 });
    }

    // Save original to edit_history and update post_text
    const existingHistory = Array.isArray(post.edit_history) ? post.edit_history : [];
    await supabase
      .from("social_posts")
      .update({
        post_text: result.boosted_text,
        edit_history: [
          ...existingHistory,
          {
            saved_at: new Date().toISOString(),
            post_text: post.post_text,
            hashtags: post.hashtags,
            source: "boost",
          },
        ],
      })
      .eq("id", parsed.post_id);

    return Response.json({
      boosted_text: result.boosted_text,
      changes: result.changes ?? [],
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
