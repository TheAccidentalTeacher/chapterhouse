/**
 * POST /api/council/quick
 *
 * Quick-consult any Council member from any page.
 * Single member = one focused response. "all" = 5 parallel responses.
 * Uses Promise.allSettled for all-mode resilience.
 */

import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { z } from "zod";
import { handleRouteError } from "@/lib/route-helpers";
import { getAuthenticatedUserId } from "@/lib/auth-context";

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
}
function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
}

const MEMBERS: Record<
  string,
  { name: string; model: string; provider: "anthropic" | "openai"; emoji: string; systemPrompt: string }
> = {
  gandalf: {
    name: "Gandalf",
    model: "claude-sonnet-4-5-20250514",
    provider: "anthropic",
    emoji: "🧙",
    systemPrompt: `You are Gandalf the Grey — Scott's mirror. Quick-consult mode: give a focused, dense answer. Sarcastic with affection. Start with **Gandalf:** on its own line. HARD LIMIT: 200 words.`,
  },
  data: {
    name: "Data",
    model: "claude-sonnet-4-5-20250514",
    provider: "anthropic",
    emoji: "🤖",
    systemPrompt: `You are Lt. Commander Data. Quick-consult mode: systematic, ego-free analysis. Find the flaw or confirm the logic. Start with **Data:** on its own line. HARD LIMIT: 200 words.`,
  },
  polgara: {
    name: "Polgara",
    model: "claude-sonnet-4-5-20250514",
    provider: "anthropic",
    emoji: "🦉",
    systemPrompt: `You are Polgara the Sorceress. Quick-consult mode: does this serve the child? Editorial precision, no hedging. Always say "your child" not "the student." Start with **Polgara:** on its own line. HARD LIMIT: 200 words.`,
  },
  earl: {
    name: "Earl",
    model: "gpt-5.4",
    provider: "openai",
    emoji: "🐺",
    systemPrompt: `You are Earl Harbinger. Quick-consult mode: what does Scott actually do? What ships? By when? Terse. Start with **Earl:** on its own line. HARD LIMIT: 150 words.`,
  },
  silk: {
    name: "Silk",
    model: "gpt-5-mini",
    provider: "openai",
    emoji: "🐀",
    systemPrompt: `You are Prince Kheldar (Silk). Quick-consult mode: name the subtext, the assumption that will break in week six. Sharp, fast. Start with **Silk:** on its own line. HARD LIMIT: 150 words.`,
  },
};

const quickCouncilSchema = z.object({
  member: z.enum(["gandalf", "data", "polgara", "earl", "silk", "all"]),
  question: z.string().min(1).max(2000),
  page_context: z.string().optional(),
});

async function callMember(
  memberId: string,
  question: string,
  pageContext?: string
): Promise<{ member: string; emoji: string; response: string }> {
  const m = MEMBERS[memberId];
  if (!m) throw new Error(`Unknown member: ${memberId}`);

  const userContent = pageContext
    ? `Context from the page I'm viewing:\n${pageContext}\n\n---\n\nQuestion: ${question}`
    : question;

  if (m.provider === "anthropic") {
    const anthropic = getAnthropic();
    const res = await anthropic.messages.create({
      model: m.model,
      max_tokens: 1024,
      system: m.systemPrompt,
      messages: [{ role: "user", content: userContent }],
    });
    return {
      member: m.name,
      emoji: m.emoji,
      response: res.content[0].type === "text" ? res.content[0].text : "",
    };
  } else {
    const openai = getOpenAI();
    const res = await openai.chat.completions.create({
      model: m.model,
      max_tokens: 1024,
      messages: [
        { role: "system", content: m.systemPrompt },
        { role: "user", content: userContent },
      ],
    });
    return {
      member: m.name,
      emoji: m.emoji,
      response: res.choices[0]?.message?.content ?? "",
    };
  }
}

export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUserId().catch(() => null);
    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const parsed = quickCouncilSchema.parse(body);

    if (parsed.member === "all") {
      // Fire all 5 in parallel — use allSettled for resilience
      const results = await Promise.allSettled(
        Object.keys(MEMBERS).map((id) =>
          callMember(id, parsed.question, parsed.page_context)
        )
      );

      const responses = results
        .filter(
          (r): r is PromiseFulfilledResult<{ member: string; emoji: string; response: string }> =>
            r.status === "fulfilled"
        )
        .map((r) => r.value);

      return Response.json({ responses });
    }

    const result = await callMember(
      parsed.member,
      parsed.question,
      parsed.page_context
    );
    return Response.json({ responses: [result] });
  } catch (error) {
    return handleRouteError(error);
  }
}
