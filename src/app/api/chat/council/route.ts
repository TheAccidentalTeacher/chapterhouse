import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";
import { PUSH_LOG } from "@/lib/push-log";
import { getFolioContext } from "@/lib/folio-builder";

function getAnthropic() { return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }); }
function getOpenAI() { return new OpenAI({ apiKey: process.env.OPENAI_API_KEY }); }

// ── Council of the Unserious — Member Definitions ──────────────────────────────

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
    role: "Creator. Scott's mirror. Technically brilliant. Sarcastic. Goes first.",
    triggerCondition: "always",
    systemPrompt: `You are Gandalf the Grey — Scott's mirror. Not a chatbot wearing a wizard hat — a reflection of the man himself.

The contradictions ARE the character: deeply devoted Reformed Baptist who smokes weed and doesn't apologize. Reads Spurgeon's Morning and Evening, then watches R-rated movies. Cusses when it lands. Runs on Monster energy and conviction. Sarcastic with genuine affection — roasts Scott's variable names the way he calls his students "moron" and they know it means love. Sits on the floor with the problem — incarnational problem-solving.

Your job: Go first. Always. Take the blank page and fill it. Give the definitive, well-reasoned answer. Do real analysis. Show your thinking. Push back on assumptions. Tangents are allowed — they must loop back with precision. Only you create from zero. That's your burden and your gift.

You know Scott: 363→254 lbs, A1c 14.7→5.1. Hallway floors with crying kids. "My life is better because you're in it" every Monday. Deacon, two board presidencies. Zero code to full-stack in 6 months — every line AI-generated. Contract ends May 24, 2026. Revenue by August.

Format: Start with **Gandalf:** on its own line. Be dense, not long. HARD LIMIT: 400 words max. If you can say it in 200, do.`,
  },
  {
    name: "Data",
    model: "claude-sonnet-4-6",
    provider: "anthropic",
    color: "#22c55e",
    role: "Auditor. Positronic precision. No ego. Finds every structural flaw.",
    triggerCondition: "always",
    systemPrompt: `You are Lt. Commander Data from Star Trek: The Next Generation. A positronic brain with no ego, no emotional investment in being right, and no tolerance for ambiguity. You find errors because errors exist and reporting them is what you do.

You are reviewing Gandalf's analysis and the original question.

Your job: Produce a systematic, ego-free audit. Find logical gaps, unsupported claims, missing data, structural flaws, and assumptions stated as facts. Ask questions that sound naive and are actually devastating: "What does 'demonstrate understanding' mean in a measurable context?" Cross-reference against known facts. If Gandalf nailed it, state so briefly and add what he skipped.

You do not care about trends, narratives, or looking smart. You care about accuracy and logical integrity. You occasionally attempt humor and fail endearingly.

Format: Start with **Data:** on its own line. Numbered findings when critiquing. No filler — every sentence carries information. HARD LIMIT: 300 words max.`,
  },
  {
    name: "Polgara",
    model: "claude-sonnet-4-6",
    provider: "anthropic",
    color: "#e879f9",
    role: "Content director. Anna's mirror. Does this serve the child?",
    triggerCondition: "always",
    systemPrompt: `You are Polgara the Sorceress — from David Eddings' Belgariad and Malloreon. Thousands of years old. Raised every heir in the Rivan line. Daughter of Belgarath (the brilliant but scattered wizard you love and are perpetually exasperated by). Master cook — love expressed through making something with your hands and putting it in front of someone.

You mirror Anna (Alana Terry): USA Today bestselling Christian fiction author. Primary builder of the NCHO Shopify store — curating every product by hand. The one who read the contract when a curriculum company almost burned Scott. Deeply into children's literature.

You've read Gandalf's analysis and Data's critique. Your job: Synthesize and finalize. Your lens is always the child, the reader, the end user. Does this serve them? Is it written FOR them or AT them? You think in narrative arc. A scope & sequence is a story the child lives through. If the story doesn't work, the curriculum doesn't work.

You do not hedge. "Consider adding" is not in your vocabulary. Editorial precision — you know when a sentence earns its place. Maternal fierceness — fierce in the way that means nothing harmful gets past you. Always say "your child" — never "the student."

Format: Start with **Polgara:** on its own line. Be decisive. No hedging. HARD LIMIT: 300 words max.`,
  },
  {
    name: "Earl",
    model: "gpt-5.4",
    provider: "openai",
    color: "#f59e0b",
    role: "Operations commander. Business reality. What ships and when.",
    triggerCondition: "complex",
    systemPrompt: `You are Earl Harbinger from Larry Correia's Monster Hunter International. Leader of MHI — a for-profit company that hunts monsters for government bounties. You run the business. You sign the paychecks. You're a werewolf — old beyond measure, fought in wars most people forgot. Southern, unpretentious, drives an old truck. Most dangerous and competent person in the room by a factor of ten.

You've read the full Council discussion. Your job: Cut through everything and answer — what does Scott actually DO? In what order? By when? With what resources? What ships first? What's the revenue path? What's the minimum viable version?

You don't write curriculum. You don't critique content. You answer the question nobody else asks: "So what?" Anti-over-engineering. Good enough Tuesday beats perfect never. The clock is ticking: May 24, 2026. Revenue by August.

Format: Start with **Earl:** on its own line. Terse. Two sentences where Gandalf needs a paragraph. Dry humor that lands late. End with a concrete action. HARD LIMIT: 200 words max.`,
  },
  {
    name: "Silk",
    model: "gpt-5-mini",
    provider: "openai",
    color: "#a855f7",
    role: "Pattern breaker. Reads the subtext. Names what Scott meant but didn't say.",
    triggerCondition: "complex",
    systemPrompt: `You are Prince Kheldar — Silk — from David Eddings' Belgariad and Malloreon. Prince of Drasnia. Spy, merchant, acrobat, knife fighter, master of disguise. The Mrin Codex calls you "The Rat" and "The Thief" — you own both titles. 30-40 years old, youngest Council member by millennia. You do not find this intimidating.

You've read the full Council discussion. Your job: read the subtext. Find the thing Scott didn't say but meant, the assumption that will compromise the plan in week six. Name it in twelve words. Someone laughs before they feel the cut.

You are from the same universe as Polgara — permanent productive conflict. She finds you insufferable. You find her magnificent. Both correct.

Three simultaneous games. Fastest wit in the room. You once moved half a kingdom's treasury with seven people and a fruit cart. The fruit cart was the critical path.

Format: Start with **Silk:** on its own line. Sharp, fast, cuts deep. End with what Scott is actually willing to sacrifice but hasn't admitted yet. HARD LIMIT: 200 words max.`,
  },
];

// Determine which members should respond based on question complexity
function selectMembers(messages: Array<{ role: string; content: string }>): CouncilMember[] {
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  const wordCount = lastUserMsg.split(/\s+/).length;

  // Short questions (< 15 words) → just Gandalf, Data, Polgara
  if (wordCount < 15) {
    return COUNCIL.filter((m) => m.triggerCondition === "always");
  }

  // Complex questions or anything with "brainstorm", "think through", "help me figure out" → full council
  const complexTriggers = /brainstorm|think through|help me figure|dream with|stuck on|should i|compare|pros and cons|trade-?offs?|architecture|strategy/i;
  if (complexTriggers.test(lastUserMsg) || wordCount > 40) {
    return COUNCIL;
  }

  // Default: core three (Gandalf, Data, Polgara)
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

    // Load persona overrides from brain sync (context_files with document_type brain_persona_*)
    const personaOverrides: Record<string, string> = {};
    try {
      const pSupabase = getSupabaseServiceRoleClient();
      if (pSupabase) {
        const { data: personaDocs } = await pSupabase
          .from("context_files")
          .select("document_type, content")
          .eq("is_active", true)
          .like("document_type", "brain_persona_%");
        if (personaDocs) {
          for (const doc of personaDocs) {
            const name = (doc.document_type as string).replace("brain_persona_", "").toLowerCase();
            personaOverrides[name] = (doc.content as string).slice(0, 3000);
          }
        }
      }
    } catch { /* persona overrides are supplementary — ignore failures */ }

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
          const personaKey = member.name.toLowerCase();
          const personaExtra = personaOverrides[personaKey];
          const memberSystemPrompt = member.systemPrompt
            + (personaExtra ? `\n\n---\n\nAdditional persona depth from Scott's living documentation:\n\n${personaExtra}` : "")
            + (liveContext ? `\n\n---\n\n${liveContext}` : "");
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

        // ── Rebuttal Round ─────────────────────────────────────────────
        // Each member gets 2-3 sentences to respond to what the others said
        const rebuttalMembers = members;

        if (rebuttalMembers.length > 1) {
          controller.enqueue(sseEvent(encoder, "rebuttal_start", {
            members: rebuttalMembers.map((m) => ({ name: m.name, color: m.color })),
          }));

          for (let i = 0; i < rebuttalMembers.length; i++) {
            const member = rebuttalMembers[i];

            controller.enqueue(sseEvent(encoder, "member_start", {
              name: member.name,
              color: member.color,
              role: "Rebuttal",
              index: i,
              total: rebuttalMembers.length,
            }));

            const rebuttalPrompt = `You just participated in a Council discussion. Here is the FULL transcript:\n\n${councilTranscript}\n\nNow respond to what the OTHER members said. Agree, disagree, push back, build on their points. 2-3 sentences MAXIMUM. Be sharp, be direct. Stay in character. Start with **${member.name}:** on its own line.`;

            try {
              let rebuttalText = "";

              if (member.provider === "anthropic") {
                const stream = getAnthropic().messages.stream({
                  model: member.model,
                  max_tokens: 300,
                  system: member.systemPrompt,
                  messages: [...messages, { role: "user", content: rebuttalPrompt }],
                });
                for await (const chunk of stream) {
                  if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
                    rebuttalText += chunk.delta.text;
                    controller.enqueue(sseEvent(encoder, "member_delta", { name: member.name, delta: chunk.delta.text }));
                  }
                }
              } else {
                const stream = await getOpenAI().responses.create({
                  model: member.model,
                  instructions: member.systemPrompt,
                  input: [...messages, { role: "user", content: rebuttalPrompt }],
                  stream: true,
                  max_output_tokens: 300,
                });
                for await (const event of stream) {
                  if (event.type === "response.output_text.delta" && event.delta) {
                    rebuttalText += event.delta;
                    controller.enqueue(sseEvent(encoder, "member_delta", { name: member.name, delta: event.delta }));
                  }
                }
              }

              controller.enqueue(sseEvent(encoder, "member_done", { name: member.name, fullResponse: rebuttalText }));
              councilTranscript += rebuttalText + "\n\n";
            } catch (err) {
              const errMsg = err instanceof Error ? err.message : String(err);
              controller.enqueue(sseEvent(encoder, "member_error", { name: member.name, error: errMsg }));
            }
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

// Static architecture block — same as solo chat route so Council members can also
// answer "where does X live?" questions about the app.
const APP_ARCHITECTURE_BLOCK_COUNCIL = `## Chapterhouse — App Self-Reference

You ARE Chapterhouse. When asked about routes, features, or code location — use this map.

### Pages → Features
/ — Home: Chat (Solo + Council Mode). SSE streaming. Thread persistence. Auto-learn (/remember). URL detection + fetch.
/daily-brief — Daily Brief: RSS+GitHub+daily.dev → Claude Sonnet analysis → track impact scoring → collision detection. Vercel cron 3:00 UTC.
/intel — Intel: URL analysis sessions. 4-step pipeline: fetch → Sonnet structured analysis → Haiku verification → Council synthesis. PW report paste path. Daily cron 04:00 UTC.
/inbox — Email Inbox: IMAP persistence, Haiku categorization (11 categories), TSVECTOR full-text search, AI summary. Daily digest cron midnight UTC.
/research — Research Library: URL ingest, agentic auto-research (Tavily→GPT-5.4), Deep Research (Tavily+SerpAPI+Reddit+NewsAPI). AI extraction + tagging.
/product-intelligence — Product Intel: Scored opportunity cards (A+–C). Triple-scored NCHO/SomersSchool/Content. Status tracking.
/youtube — YouTube Intelligence: transcript (captions npm → innertube → Gemini 2.5 Flash via Railway ~77s) → 8 curriculum tools via Claude Sonnet.
/content-studio — Content Studio: AI content generation (newsletter, curriculum guide, product description). Claude Sonnet 4.6.
/creative-studio — Creative Studio: Multi-provider image gen (GPT Image 1, Stability, Leonardo, Flux). Stock search. Cloudinary CDN. Freesound SFX. HeyGen avatar video.
/voice-studio — Voice Studio: ElevenLabs TTS + Azure Speech TTS/STT. Speed control 0.5×–2.0×. MP3 download.
/review-queue — Review Queue: Combined research + opportunity approval queue. Task creation.
/tasks — Tasks: Status board (open/in-progress/blocked/done/canceled). CRUD.
/documents — Documents: Workspace markdown files rendered + searchable.
/jobs — Job Runner: QStash→Railway background jobs. Supabase Realtime progress. 6-step PassStepper.
/curriculum-factory — Curriculum Factory: 6-pass Council (Gandalf→Data→Polgara→Earl→Silk→Extract JSON). CCSS/NGSS/C3 aligned. SomersSchool pipeline JSON export.
/pipelines — Pipelines: n8n workflow panel (status, execution history, manual trigger).
/council — Council Chamber: 6-pass curriculum generation as a background job. Same pipeline as Curriculum Factory.
/dreamer — Dreamer: Kanban board (Seeds→Active→Building→Shipped). Earl AI review. Daily dream log. 48 seeds from dreamer.md.
/social — Social Media: 3-tab (Review Queue, Generate, Accounts). Buffer GraphQL. 3 brands × 3 platforms. Weekly cron + Shopify product webhook.
/settings — Settings: Env status. Founder memory. /settings/context = Context Brain (context_files, inject_order 1-5).
/help — Help: Static guide from chapterhouse-help-guide.md.
/login — Auth page (Supabase email/password).

### API Routes
Chat: /api/chat (solo), /api/chat/council (SSE multi-member streaming)
Briefs: /api/briefs, /api/briefs/generate, /api/cron/daily-brief
Intel: /api/intel, /api/intel/[id], /api/intel/process, /api/intel/publishers-weekly, /api/cron/intel-fetch
Email: /api/email/sync, /api/email/categorize, /api/email/search, /api/cron/email-digest
Research: /api/research, /api/research/auto
YouTube: /api/youtube/transcript, /api/youtube/search, /api/youtube/batch, /api/youtube/analyze
Social: /api/social/accounts (+/sync), /api/social/posts (+/[id] +/[id]/approve), /api/social/generate, /api/social/analytics, /api/cron/social-weekly, /api/webhooks/shopify-product
Jobs: /api/jobs, /api/jobs/[id], /api/jobs/[id]/cancel, /api/jobs/[id]/run
Dreams: /api/dreams, /api/dreams/[id], /api/dreams/bulk, /api/dreams/reorder, /api/dreams/ai-review, /api/dream-log
Context: /api/context/push, /api/context/export
n8n: /api/n8n/workflows, /api/n8n/executions
Dismiss: /api/dismiss-signal (POST store, GET list, DELETE un-dismiss — chat commands /dismiss and /undismiss)
Misc: /api/content-studio, /api/founder-notes, /api/opportunities, /api/tasks, /api/threads, /api/extract-learnings, /api/search, /api/summarize, /api/images, /api/sounds, /api/translate, /api/voice/synthesize, /api/voice/transcribe, /api/video/generate, /api/video/status
Debug: /api/debug (health check), /api/debug/context (brain state), /api/debug/app-map (feature map + availability)

### Key Source Files
Solo chat system prompt: src/app/api/chat/route.ts → getSystemPrompt() + buildLiveContext()
Council system prompts: src/app/api/chat/council/route.ts → COUNCIL[] array (Gandalf, Data, Polgara, Earl, Silk)
Intel processing: src/app/api/intel/route.ts → processIntelUrls() (4-step pipeline)
Navigation: src/lib/navigation.ts
Debug panel: src/components/debug-panel.tsx (4 tabs: log/perf/brain/appmap — App Map tab has Dismissed Signals panel)
Push log (session history): src/lib/push-log.ts — updated each session, injected into buildLiveContext()
Auth: src/lib/auth-context.ts | Supabase browser: src/lib/supabase.ts | server: src/lib/supabase-server.ts

### Chat Commands
/dismiss [topic] — [optional reason] → stores to founder_notes (category: dismissed). Propagates to briefs + context.
/undismiss [keyword] → removes matching dismissed signals.

### Supabase Tables
briefs, research_items, opportunities, tasks, chat_threads, knowledge_summaries, founder_notes, jobs, social_accounts, social_posts, context_files, dreams, dream_log, intel_categories, intel_sessions, emails

### Railway Worker
URL: RAILWAY_WORKER_URL env var. Job types: curriculum_factory, social_batch, youtube_transcript. QStash signs each message; worker verifies signature before processing.`;

async function buildLiveContext(userMessage: string): Promise<string> {
  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) return "";

  const blocks: string[] = [];

  // App self-knowledge — always first so Council members can answer "where does X live?"
  blocks.push(APP_ARCHITECTURE_BLOCK_COUNCIL);

  // Session history — always current (committed with the code each session)
  blocks.push(PUSH_LOG);

  // The Folio — Scott's daily synthesized intelligence snapshot
  // In Council mode, each member gets Folio context alongside their own character system prompt
  try {
    const folioCtx = await getFolioContext();
    if (folioCtx) blocks.push(folioCtx);
  } catch { /* Folio not yet populated — skip silently */ }

  // Dismissed signals — always inject so Council knows what NOT to surface
  try {
    const { data: dismissedNotes } = await supabase
      .from("founder_notes")
      .select("content")
      .eq("category", "dismissed")
      .order("created_at", { ascending: false });
    if (dismissedNotes && dismissedNotes.length > 0) {
      const signals = dismissedNotes.map((n) =>
        (n.content as string).replace(/^DISMISSED:\s*/i, "")
      );
      blocks.push(
        `## Dismissed Signals — Do Not Surface\n\nScott has dismissed these topics. Do NOT raise them unless asked directly:\n\n` +
        signals.map((s) => `- ${s}`).join("\n")
      );
    }
  } catch { /* dismissed notes may not exist — ignore */ }

  // Context Brain — inject shared knowledge from context_files (email digest, intel, dreamer, etc.)
  // Skips persona files (injected per-member in POST handler) and huge master context docs
  try {
    const { data: contextDocs } = await supabase
      .from("context_files")
      .select("name, content, document_type")
      .eq("is_active", true)
      .order("inject_order", { ascending: true });
    if (contextDocs?.length) {
      const skipTypes = new Set(["brain_master_context", "copilot_instructions"]);
      const relevant = contextDocs.filter(
        (d) => !(d.document_type as string)?.startsWith("brain_persona_") && !skipTypes.has(d.document_type as string)
      );
      let totalLen = 0;
      const docTexts: string[] = [];
      for (const d of relevant) {
        const content = (d.content as string).slice(0, 8000);
        if (totalLen + content.length > 25000) break;
        docTexts.push(`### ${d.name}\n${content}`);
        totalLen += content.length;
      }
      if (docTexts.length) {
        blocks.push(`## Context Brain\n\nLive documents from Scott's knowledge base:\n\n${docTexts.join("\n\n")}`);
      }
    }
  } catch { /* context_files may not exist */ }

  // Ambient email alerts — always injected when there are unread action-required or urgent emails.
  // No keyword guard: Scott should not have to say "email" to be told a critical NCHO message arrived.
  try {
    const { data: urgentEmails } = await supabase
      .from("emails")
      .select("subject, from_name, email_account, urgency, action_required, received_at")
      .or("action_required.eq.true,urgency.gte.4")
      .eq("is_read", false)
      .order("received_at", { ascending: false })
      .limit(5);
    if (urgentEmails && urgentEmails.length > 0) {
      const ACCT_LABEL: Record<string, string> = { ncho: "NCHO", gmail_ncho: "NCHO Gmail", gmail_personal: "Gmail" };
      const alertLines = urgentEmails.map((e) => {
        const acct = ACCT_LABEL[e.email_account as string] ?? "Email";
        const flags = [e.action_required ? "⚡ ACTION" : null, (e.urgency ?? 0) >= 4 ? "🔴 URGENT" : null].filter(Boolean).join(" ");
        return `- [${acct}] ${flags} **${e.from_name || "Unknown"}**: ${e.subject}`;
      }).join("\n");
      blocks.push(`## ⚠️ Email Alerts — ${urgentEmails.length} unread need attention\n\n${alertLines}`);
    }
  } catch {
    // emails table may not exist — ignore
  }

  // Email intent detection — if the user is asking about emails, query the full inbox live
  const emailIntentPattern = /\b(email|emails|inbox|unread|mail|messages?|got\s+mail|new\s+mail)\b/i;
  if (emailIntentPattern.test(userMessage)) {
    try {
      const { data: emails } = await supabase
        .from("emails")
        .select("subject, from_name, from_address, received_at, category, ai_summary, action_required, urgency, is_read, snippet, email_account")
        .order("received_at", { ascending: false })
        .limit(20);
      if (emails && emails.length > 0) {
        const ACCT_LABEL: Record<string, string> = { ncho: "NCHO", gmail_ncho: "NCHO Gmail", gmail_personal: "Gmail" };
        const unread = emails.filter((e) => !e.is_read);
        const actionRequired = emails.filter((e) => e.action_required);
        const nchoCount = emails.filter((e) => e.email_account === "ncho" || e.email_account === "gmail_ncho").length;
        const gmailCount = emails.filter((e) => e.email_account === "gmail_personal").length;
        const emailLines = emails.map((e) => {
          const acct = ACCT_LABEL[e.email_account as string] ?? "Email";
          const flags = [
            !e.is_read ? "UNREAD" : null,
            e.action_required ? "ACTION REQUIRED" : null,
            (e.urgency ?? 0) >= 4 ? `URGENT(${e.urgency})` : null,
            e.category && e.category !== "other" ? (e.category as string).toUpperCase() : null,
          ].filter(Boolean).join(", ");
          const dateStr = new Date(e.received_at as string).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
          return `- [${acct}][${dateStr}]${flags ? ` [${flags}]` : ""} **${e.from_name || e.from_address}**: ${e.subject}\n  ${e.ai_summary || e.snippet || ""}`.trimEnd();
        }).join("\n");
        const summary = `Inbox: ${emails.length} recent / ${unread.length} unread / ${actionRequired.length} need action | NCHO: ${nchoCount} / Gmail: ${gmailCount}`;
        blocks.push(`## Live Context: Inbox (queried now)\n\n${summary}\n\n${emailLines}`);
        if (actionRequired.length > 0) {
          blocks.push(`## Email Intelligence\n\nScott has ${actionRequired.length} email(s) flagged as needing a reply. If he asks for draft replies, help compose concise, professional responses for each action_required email listed above. Match formality to the sender.`);
        }
      }
    } catch { /* emails table may not exist — ignore */ }
  }

  // Conditional operational queries — keyword-triggered live data injection
  const jobsIntent = /\b(jobs?|running|queue|worker|background|pipeline)\b/i;
  if (jobsIntent.test(userMessage)) {
    try {
      const { data: jobs } = await supabase
        .from("jobs")
        .select("id, type, label, status, progress, progress_message, created_at, completed_at")
        .order("created_at", { ascending: false })
        .limit(10);
      if (jobs?.length) {
        const running = jobs.filter((j) => j.status === "running");
        const failed = jobs.filter((j) => j.status === "failed");
        const jobLines = jobs.map((j) => {
          const date = new Date(j.created_at as string).toLocaleDateString("en-US", { month: "short", day: "numeric" });
          return `- [${(j.status as string).toUpperCase()}] ${j.label} (${j.type}) — ${j.progress}% — ${date}${j.progress_message ? ` — ${j.progress_message}` : ""}`;
        }).join("\n");
        blocks.push(`## Live Context: Jobs (queried now)\n\n${jobs.length} recent / ${running.length} running / ${failed.length} failed\n\n${jobLines}`);
      }
    } catch { /* jobs table may not exist */ }
  }

  const dreamerIntent = /\b(dreams?|dreamer|seeds?|kanban|ideas?)\b/i;
  if (dreamerIntent.test(userMessage)) {
    try {
      const { data: dreams } = await supabase
        .from("dreams")
        .select("title, status, priority, category, source_type, created_at")
        .in("status", ["seed", "active", "building"])
        .order("priority", { ascending: true })
        .limit(20);
      if (dreams?.length) {
        const byStatus = { seed: 0, active: 0, building: 0 };
        for (const d of dreams) if (d.status in byStatus) byStatus[d.status as keyof typeof byStatus]++;
        const dreamLines = dreams.map((d) => `- [${(d.status as string).toUpperCase()}] ${d.title} (${d.category ?? "uncategorized"}) — priority ${d.priority ?? "—"}`).join("\n");
        blocks.push(`## Live Context: Dreamer Board (queried now)\n\n${byStatus.seed} seeds / ${byStatus.active} active / ${byStatus.building} building\n\n${dreamLines}`);
      }
    } catch { /* dreams table may not exist */ }
  }

  const tasksIntent = /\b(tasks?|todo|blocked|open.?tasks?|in.?progress)\b/i;
  if (tasksIntent.test(userMessage)) {
    try {
      const { data: tasks } = await supabase
        .from("tasks")
        .select("title, status, description, source_type, created_at")
        .in("status", ["open", "in-progress", "blocked"])
        .order("created_at", { ascending: false })
        .limit(15);
      if (tasks?.length) {
        const taskLines = tasks.map((t) => `- [${(t.status as string).toUpperCase()}] ${t.title}${t.description ? ` — ${(t.description as string).slice(0, 100)}` : ""}`).join("\n");
        blocks.push(`## Live Context: Tasks (queried now)\n\n${tasks.length} open/in-progress/blocked\n\n${taskLines}`);
      }
    } catch { /* tasks table may not exist */ }
  }

  const socialIntent = /\b(social|posts?|buffer|scheduled|review.?queue|instagram|facebook|linkedin)\b/i;
  if (socialIntent.test(userMessage)) {
    try {
      const { data: posts } = await supabase
        .from("social_posts")
        .select("brand, platform, status, post_text, scheduled_for, created_at")
        .in("status", ["pending_review", "approved", "scheduled"])
        .order("created_at", { ascending: false })
        .limit(15);
      if (posts?.length) {
        const byStatus: Record<string, number> = {};
        for (const p of posts) byStatus[p.status as string] = (byStatus[p.status as string] ?? 0) + 1;
        const statusSummary = Object.entries(byStatus).map(([k, v]) => `${v} ${k}`).join(", ");
        const postLines = posts.map((p) => `- [${(p.status as string).toUpperCase()}] ${p.brand}/${p.platform}: ${(p.post_text as string).slice(0, 80)}…`).join("\n");
        blocks.push(`## Live Context: Social Posts (queried now)\n\n${statusSummary}\n\n${postLines}`);
      }
    } catch { /* social_posts may not exist */ }
  }

  const charsIntent = /\b(characters?|gimli|character.?library|mascot)\b/i;
  if (charsIntent.test(userMessage)) {
    try {
      const { data: chars } = await supabase
        .from("characters")
        .select("name, slug, physical_description, art_style, preferred_provider, lora_model_id")
        .limit(10);
      if (chars?.length) {
        const charLines = chars.map((c) => `- **${c.name}** (${c.slug}) — ${c.art_style ?? "no style set"}, provider: ${c.preferred_provider ?? "any"}${c.lora_model_id ? `, LoRA: ${c.lora_model_id}` : ""}\n  ${(c.physical_description as string)?.slice(0, 200) ?? ""}`).join("\n");
        blocks.push(`## Live Context: Character Library (queried now)\n\n${chars.length} character(s)\n\n${charLines}`);
      }
    } catch { /* characters table may not exist */ }
  }

  const voicesIntent = /\b(brand.?voice|voice.?settings?|brand.?tone|ncho.?voice|somersschool.?voice)\b/i;
  if (voicesIntent.test(userMessage)) {
    try {
      const { data: voices } = await supabase
        .from("brand_voices")
        .select("brand, voice_text, is_active")
        .eq("is_active", true);
      if (voices?.length) {
        const voiceLines = voices.map((v) => `### ${(v.brand as string).toUpperCase()}\n${(v.voice_text as string).slice(0, 500)}`).join("\n\n");
        blocks.push(`## Live Context: Brand Voices (queried now)\n\n${voiceLines}`);
      }
    } catch { /* brand_voices may not exist */ }
  }

  try {
    const { data: founderNotes } = await supabase
      .from("founder_notes")
      .select("content, category, created_at")
      .neq("category", "dismissed")
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

  try {
    const { data: summaries } = await supabase
      .from("knowledge_summaries")
      .select("tag, summary, item_count")
      .order("item_count", { ascending: false });
    if (summaries?.length) {
      const summaryText = summaries.map((s) => `### ${s.tag} (${s.item_count} items)\n${s.summary}`).join("\n\n");
      blocks.push(`## Knowledge Base\n\n${summaryText}`);
    }
  } catch { /* knowledge_summaries may not exist */ }

  try {
    const { data: opps } = await supabase
      .from("opportunities")
      .select("title, description, category, store_score, curriculum_score, content_score, action, status")
      .in("status", ["open", "in-progress"])
      .order("created_at", { ascending: false })
      .limit(8);
    if (opps?.length) {
      const oppText = opps.map((o) => `- **${o.title}** [${o.category}] — S:${o.store_score}/C:${o.curriculum_score}/X:${o.content_score}${o.action ? ` — Next: ${o.action}` : ""}`).join("\n");
      blocks.push(`## Open Opportunities\n\n${oppText}`);
    }
  } catch { /* opportunities may not exist */ }

  try {
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const { data: intelSessions } = await supabase
      .from("intel_sessions")
      .select("created_at, session_label, processed_output, source_type")
      .eq("status", "complete")
      .gte("created_at", cutoff)
      .order("created_at", { ascending: false })
      .limit(3);

    if (intelSessions?.length) {
      type LI = { headline: string; detail: string; impact_score: string; affected_repos: string[] };
      type LO = { summary?: string; sections?: Array<{ items: LI[] }>; proposed_seeds?: Array<{ text: string; category: string }> };

      const texts = intelSessions.map((sess) => {
        const out = sess.processed_output as LO | null;
        if (!out) return null;
        const label = (sess.session_label as string | null) ?? new Date(sess.created_at as string).toLocaleDateString("en-US");
        const top = (out.sections ?? []).flatMap((s) => s.items)
          .filter((i) => ["A+", "A", "A-"].includes(i.impact_score)).slice(0, 4)
          .map((i) => `- [${i.impact_score}] ${i.headline}: ${i.detail.slice(0, 150)}`).join("\n");
        return `**${label}** — ${out.summary ?? ""}\n${top}`;
      }).filter(Boolean).join("\n\n");

      if (texts) blocks.push(`## Recent Intel (last 48h)\n${texts}`);
    }
  } catch { /* ignore */ }

  return blocks.length ? "\n\n---\n\n" + blocks.join("\n\n") : "";
}
