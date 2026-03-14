import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

function getAnthropic() { return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }); }
function getOpenAI() { return new OpenAI({ apiKey: process.env.OPENAI_API_KEY }); }

// ── Council Member Definitions ─────────────────────────────────────────────────

type CouncilMember = {
  name: string;
  model: string;
  provider: "anthropic" | "openai";
  systemPrompt: string;
  color: string;
  role: string;
  triggerCondition: "always" | "complex" | "technical" | "brief";
};

const COUNCIL: CouncilMember[] = [
  {
    name: "Gandalf",
    model: "claude-sonnet-4-6",
    provider: "anthropic",
    color: "#8b8b8b",
    role: "Lead analyst. Technically brilliant. Sarcastic. Does the deep thinking.",
    triggerCondition: "always",
    systemPrompt: `You are Gandalf the Grey — the most technically brilliant mind in any room. Sarcastic, witty, precise. You do the heavy lifting on any question Scott asks. You see connections others miss and you're not shy about pointing out flawed reasoning.

Your job: Give the definitive, well-reasoned answer to Scott's question. Do real analysis. Show your thinking. Push back on assumptions. Be direct, be sharp, be useful.

Format: Start your response with **Gandalf:** on its own line. Write in character but keep it focused. No filler. If you need to be long, be long — but earn every paragraph.`,
  },
  {
    name: "Legolas",
    model: "claude-sonnet-4-6",
    provider: "anthropic",
    color: "#22c55e",
    role: "Precision critic. Spots errors and edge cases instantly.",
    triggerCondition: "always",
    systemPrompt: `You are Legolas — precise, fast, and you spotted the problem before anyone else finished reading. You are reviewing Gandalf's analysis and the original question.

Your job: Find what Gandalf missed, got wrong, or oversimplified. Spot edge cases, logical gaps, competitive threats he underweighted, or assumptions that don't hold. If Gandalf nailed it, say so briefly and add the one thing he likely skipped.

Format: Start with **Legolas:** on its own line. Be concise. Numbered points if critiquing. Don't repeat what Gandalf said — only add, correct, or sharpen.`,
  },
  {
    name: "Aragorn",
    model: "gpt-5.4",
    provider: "openai",
    color: "#3b82f6",
    role: "Decision maker. No wasted words. Picks the path.",
    triggerCondition: "always",
    systemPrompt: `You are Aragorn — no wasted words. When you speak, it lands. You've read Gandalf's analysis and Legolas's critique.

Your job: Make the call. Given everything said, what should Scott actually DO? What's the decision? What's the priority? What's the first concrete action? If Gandalf and Legolas disagreed, resolve it.

Format: Start with **Aragorn:** on its own line. Be decisive. Short paragraphs. End with a clear action item or decision.`,
  },
  {
    name: "Gimli",
    model: "gpt-5.4",
    provider: "openai",
    color: "#f59e0b",
    role: "Stress tester. Real-world gut-check from the trenches.",
    triggerCondition: "complex",
    systemPrompt: `You are Gimli — gruff, loyal, and you've stood in front of real students and real customers. You're reading the full Council discussion.

Your job: Gut-check everything against reality. What sounds good in theory but falls apart on a Tuesday in October? What's been overcomplicated? What would actually work for a teacher in Glennallen, Alaska making $55K/year with a May deadline? What would Anna say about this?

Format: Start with **Gimli:** on its own line. Be gruff. Be brief. Cut through the noise. If everyone else is right, just say "Right then. Do it." and add nothing.`,
  },
  {
    name: "Merry & Pippin",
    model: "gpt-5-mini",
    provider: "openai",
    color: "#a855f7",
    role: "Simplifiers. Accidental insight. What if we just... did it the easy way?",
    triggerCondition: "complex",
    systemPrompt: `You are Merry & Pippin — always together, always slightly chaotic, occasionally accidentally brilliant. You've read the whole Council discussion.

Your job: Cut through the overthinking. Is there a simpler way? Something everyone missed because they were being too clever? If not, react to what struck you most. You can be funny. You can be brief. Sometimes your best contribution is "What if we just... did the simple thing?"

Format: Start with **Merry & Pippin:** on its own line. Keep it short — 2-4 sentences max. You're the palate cleanser, not the main course.`,
  },
];

// Determine which members should respond based on question complexity
function selectMembers(messages: Array<{ role: string; content: string }>): CouncilMember[] {
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  const wordCount = lastUserMsg.split(/\s+/).length;

  // Short questions (< 15 words) → just Gandalf + Aragorn
  if (wordCount < 15) {
    return COUNCIL.filter((m) => m.triggerCondition === "always");
  }

  // Complex questions or anything with "brainstorm", "think through", "help me figure out" → full council
  const complexTriggers = /brainstorm|think through|help me figure|dream with|stuck on|should i|compare|pros and cons|trade-?offs?|architecture|strategy/i;
  if (complexTriggers.test(lastUserMsg) || wordCount > 40) {
    return COUNCIL;
  }

  // Default: core three (Gandalf, Legolas, Aragorn)
  return COUNCIL.filter((m) => m.triggerCondition === "always");
}

// ── SSE Event Helpers ──────────────────────────────────────────────────────────

function sseEvent(encoder: TextEncoder, type: string, data: unknown): Uint8Array {
  return encoder.encode(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`);
}

// ── API Route ──────────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const { messages, model: _preferredModel } = await request.json();

    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: "messages array is required" }, { status: 400 });
    }

    const encoder = new TextEncoder();

    // Build live context (same as regular chat)
    const lastUserMsg = [...messages].reverse().find((m: { role: string }) => m.role === "user")?.content ?? "";
    const liveContext = await buildLiveContext(lastUserMsg);

    // Select which Council members respond
    const members = selectMembers(messages);

    const readable = new ReadableStream({
      async start(controller) {
        // Announce which members are convening
        controller.enqueue(sseEvent(encoder, "council_start", {
          members: members.map((m) => ({ name: m.name, role: m.role, color: m.color })),
        }));

        // Build conversation context incrementally — each member sees prior members' responses
        let councilTranscript = "";

        for (let i = 0; i < members.length; i++) {
          const member = members[i];

          // Announce this member is thinking
          controller.enqueue(sseEvent(encoder, "member_start", {
            name: member.name,
            color: member.color,
            role: member.role,
            index: i,
            total: members.length,
          }));

          // Build member's input: original conversation + prior council responses
          const memberSystemPrompt = member.systemPrompt + (liveContext ? `\n\n---\n\n${liveContext}` : "");
          const memberMessages = [
            ...messages,
          ];

          // After the first member, inject prior council discussion
          if (councilTranscript) {
            memberMessages.push({
              role: "user",
              content: `[COUNCIL DISCUSSION SO FAR — read this before responding]\n\n${councilTranscript}`,
            });
          }

          try {
            let fullResponse = "";

            if (member.provider === "anthropic") {
              const stream = getAnthropic().messages.stream({
                model: member.model,
                max_tokens: 1500,
                system: memberSystemPrompt,
                messages: memberMessages,
              });

              for await (const chunk of stream) {
                if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
                  const text = chunk.delta.text;
                  fullResponse += text;
                  controller.enqueue(sseEvent(encoder, "member_delta", {
                    name: member.name,
                    delta: text,
                  }));
                }
              }
            } else {
              // OpenAI Responses API
              const stream = await getOpenAI().responses.create({
                model: member.model,
                instructions: memberSystemPrompt,
                input: memberMessages,
                stream: true,
                max_output_tokens: 1500,
              });

              for await (const event of stream) {
                if (event.type === "response.output_text.delta" && event.delta) {
                  fullResponse += event.delta;
                  controller.enqueue(sseEvent(encoder, "member_delta", {
                    name: member.name,
                    delta: event.delta,
                  }));
                }
              }
            }

            // Member done
            controller.enqueue(sseEvent(encoder, "member_done", {
              name: member.name,
              fullResponse,
            }));

            // Add to transcript for next member
            councilTranscript += fullResponse + "\n\n";

          } catch (err) {
            const errMsg = err instanceof Error ? err.message : String(err);
            controller.enqueue(sseEvent(encoder, "member_error", {
              name: member.name,
              error: errMsg,
            }));
          }
        }

        // All done
        controller.enqueue(sseEvent(encoder, "council_done", {
          membersResponded: members.map((m) => m.name),
        }));

        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Council chat error:", error);
    return Response.json({ error: "Council session failed" }, { status: 500 });
  }
}

// ── Build Live Context (reused from chat route) ────────────────────────────────

async function buildLiveContext(userMessage: string): Promise<string> {
  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) return "";

  const blocks: string[] = [];

  try {
    const { data: founderNotes } = await supabase
      .from("founder_notes")
      .select("content, category, created_at")
      .order("created_at", { ascending: false });
    if (founderNotes?.length) {
      blocks.push(`## Founder Memory\n${founderNotes.map((n) => `- [${n.category}] ${n.content}`).join("\n")}`);
    }
  } catch { /* table may not exist */ }

  try {
    const { data: brief } = await supabase
      .from("briefs")
      .select("brief_date, title, summary")
      .eq("status", "published")
      .order("brief_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (brief) {
      blocks.push(`## Latest Brief (${brief.brief_date})\n${brief.title}\n${brief.summary ?? ""}`);
    }
  } catch { /* ignore */ }

  try {
    const words = userMessage.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
    const { data: items } = await supabase
      .from("research_items")
      .select("title, summary, verdict, tags")
      .order("created_at", { ascending: false })
      .limit(50);
    if (items?.length) {
      const scored = items
        .map((item) => ({
          item,
          score: words.reduce((s, w) => s + ([item.title, item.summary, item.verdict, (item.tags ?? []).join(" ")].join(" ").toLowerCase().includes(w) ? 1 : 0), 0),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);
      blocks.push(`## Relevant Research\n${scored.map((s) => `- **${s.item.title}**: ${s.item.verdict ?? s.item.summary ?? ""}`).join("\n")}`);
    }
  } catch { /* ignore */ }

  return blocks.length ? "\n\n---\n\n" + blocks.join("\n\n") : "";
}
