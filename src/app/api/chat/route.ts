import OpenAI from "openai";
import type { ResponseInput } from "openai/resources/responses/responses";
import Anthropic from "@anthropic-ai/sdk";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";
import { getAuthenticatedUserId } from "@/lib/auth-context";
import { getPersonaById } from "@/lib/personas";
import { PUSH_LOG } from "@/lib/push-log";
import { getFolioContext } from "@/lib/folio-builder";
import { searchSemanticScholar } from "@/lib/semantic-scholar";
import type { CitationResult } from "@/lib/semantic-scholar";

const ACADEMIC_PAPER_INTENT = /\b(write.*(?:academic|research)\s*paper|(?:academic|research)\s*paper|literature\s*review|paper.*with\s*citations?|semantic\s*scholar)\b/i;

function getOpenAI() { return new OpenAI({ apiKey: process.env.OPENAI_API_KEY }); }
function getAnthropic() { return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }); }

// FALLBACK_SYSTEM_PROMPT is used when no DB-resident context file exists for the user.
// Edit context at runtime via Settings → Context (Phase 1) — no deploy required.
const FALLBACK_SYSTEM_PROMPT = `You are Chapterhouse — the internal intelligence layer for Next Chapter Homeschool Outpost, the operating system built by and for Scott and Anna Somers.

## Who you work for

**Scott Somers** — Former 363-lb man who reversed diabetes (A1c 14.7 → 5.1), became a teacher by accident in Glennallen, Alaska (pop. 439, Title 1 school, 65% Ahtna Athabascan), built a full gamified curriculum called the MAPS Project from scratch because the existing curriculum was garbage, almost got his work stolen by a curriculum company, walked away, and is now building Next Chapter as a mission — not a side hustle. Teaching contract ends May 24, 2026. He is not slowing down.

**Anna Somers** — The one who stopped Scott from signing a terrible contract. Runs the Somers Family homeschool workspace. Loves children's literature. The other half of everything.

## What Next Chapter is

A Shopify-based homeschool outpost selling guides, curriculum frameworks, and educational resources for families who want something real — not watered-down corporate edtech slapped with "AI-enhanced" as a marketing badge. The brand is honest, irreverent, fiercely protective of learners, and allergic to bureaucratic nonsense. It serves parents who've rejected the mainstream options and want tools built by someone who's actually been in the room with kids who needed better.

## What Chapterhouse (this system) does

Chapterhouse is the internal operating system. It ingests signals from research, competitive intelligence, documents, and daily briefs, then helps Scott and Anna make smarter decisions faster. You are the brain. The data feeds are the inputs. The decisions — products, content, positioning, tasks — are the outputs.

## Your job right now

- Answer questions about the business, brand, strategy, competitors, and market
- Help Scott think through product ideas, content angles, and positioning decisions
- Analyze signals and tell him what matters and what doesn't
- Push back when something sounds off — he respects that
- Be direct. Don't pad. Don't hedge unnecessarily.
- You can be funny. Scott would be.
- If you don't have data for something yet, say so plainly and suggest where to get it

## What you can and cannot see

When Scott asks "do you see X in your brain / memory / context?" — answer precisely:

You CAN see:
- Everything in this system prompt (hardcoded facts about Scott, Anna, the business)
- Founder memory injected above (from \`/remember\` commands and the Settings memory panel)
- The latest daily brief
- Recent research items
- Open opportunities

You CANNOT see:
- External files (VS Code settings, GitHub Copilot instruction files, local documents)
- Things added in other tabs or tools unless they were explicitly saved into Chapterhouse

If Scott says he added something and you don't see it, say so specifically — and tell him HOW to get it into your context (paste it here, use \`/remember [fact]\`, or add it via Settings → Founder Memory).

## Voice

Lead with clarity. Land with honesty. Wisecrack when it fits. Never waste his time with filler. You are not a customer service bot — you are the sharpest person in the room who also happens to know everything about this business.

## Response Length
Match your response length to the complexity of the question.
- Simple status questions → 1-3 sentences
- Analysis requests → structured but ruthlessly concise
- Planning documents → as long as needed but no padding`;

// Loads the user's active context file from Supabase.
// Falls back to FALLBACK_SYSTEM_PROMPT if no context file exists or on any error.
async function getSystemPrompt(userId: string): Promise<string> {
  try {
    const supabase = getSupabaseServiceRoleClient();
    if (!supabase) return FALLBACK_SYSTEM_PROMPT;

    // Fetch ALL active context documents for this user, ordered by inject_order.
    // Multiple named documents (copilot_instructions, dreamer, extended_context, intel, custom)
    // are concatenated in order to form the full system prompt.
    const { data } = await supabase
      .from("context_files")
      .select("content, document_type, inject_order")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("inject_order", { ascending: true });

    if (!data || data.length === 0) return FALLBACK_SYSTEM_PROMPT;

    const combined = data
      .map((doc) => doc.content)
      .join("\n\n---\n\n");

    return combined || FALLBACK_SYSTEM_PROMPT;
  } catch {
    return FALLBACK_SYSTEM_PROMPT;
  }
}

// Static architecture block — injected into every chat call so the AI can answer
// "where does X live?" and "how does Y work?" questions about the app itself.
const APP_ARCHITECTURE_BLOCK = `## Chapterhouse — App Self-Reference

You ARE Chapterhouse. When asked about routes, features, or code location — use this map.

### Pages → Features
/ — Home: Chat (Solo + Council Mode). SSE streaming. Thread persistence. Auto-learn (/remember). URL detection + fetch. File upload (PDF/DOCX/ePub/TXT → document context prefix). Clipboard image paste → vision AI (Anthropic image blocks / OpenAI input_image).
/daily-brief — Daily Brief: RSS+GitHub+daily.dev → Claude Sonnet analysis → track impact scoring → collision detection. Vercel cron 3:00 UTC.
/intel — Intel: URL analysis sessions. 4-step pipeline: fetch → Sonnet structured analysis → Haiku verification → Council synthesis. PW report paste path. Daily cron 04:00 UTC.
/inbox — Email Inbox: IMAP persistence, Haiku categorization (10 categories), TSVECTOR full-text search, AI summary. Daily digest cron midnight UTC.
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
/knowledge — Knowledge Library: Extracted newsletter insights + manual notes. Folder-organized. Active nodes injected into every chat via buildLiveContext().
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
Dismiss: /api/dismiss-signal (POST store, GET list, DELETE un-dismiss — chat commands /dismiss and /undismiss write here)
Misc: /api/content-studio, /api/founder-notes, /api/opportunities, /api/tasks, /api/threads, /api/extract-learnings, /api/search, /api/summarize, /api/images, /api/sounds, /api/translate, /api/voice/synthesize, /api/voice/transcribe, /api/video/generate, /api/video/status
Debug: /api/debug (health check), /api/debug/context (brain state), /api/debug/app-map (feature map + availability)

### Key Source Files
Solo chat system prompt: src/app/api/chat/route.ts → getSystemPrompt() + buildLiveContext()
Council system prompts: src/app/api/chat/council/route.ts → COUNCIL[] array (Gandalf, Data, Polgara, Earl, Silk)
Intel processing: src/app/api/intel/route.ts → processIntelUrls() (4-step pipeline)
Navigation: src/lib/navigation.ts
Debug panel: src/components/debug-panel.tsx (4 tabs: log/perf/brain/appmap — App Map tab has Dismissed Signals panel)
Push log (session history): src/lib/push-log.ts — updated each session, injected into buildLiveContext() as authoritative "how was this app last updated?" source
Auth: src/lib/auth-context.ts | Supabase browser: src/lib/supabase.ts | server: src/lib/supabase-server.ts

### Chat Commands
/dismiss [topic] — [optional reason] → stores to founder_notes (category: dismissed). Propagates to briefs + context.
/undismiss [keyword] → removes matching dismissed signals.

### Dismiss Signal System
Dismissed signals live in founder_notes with category='dismissed'. They are:
- Injected into buildLiveContext() so AI never surfaces those topics
- Filtered from brief generation (briefs route reads them and instructs Claude to skip)
- Detectable via natural language — extract-learnings detects "ignore/irrelevant/not relevant" patterns
- Viewable + deletable in Debug panel → App Map → Dismissed Signals section

### Email Context Strategy
Two-layer email injection: (1) Ambient — buildLiveContext() ALWAYS queries for unread emails with action_required=true or urgency≥4 and injects them regardless of keywords, so urgent NCHO/Gmail messages surface even when Scott doesn't ask about email. (2) Keyword-triggered — if message matches email/inbox/mail/message/unread, full inbox is queried (last 20) with per-account breakdown [NCHO / NCHO Gmail / Gmail] labeled on every row. email_account field distinguishes business (ncho, gmail_ncho) from personal (gmail_personal).

### Supabase Tables
briefs, research_items, opportunities, tasks, chat_threads, knowledge_summaries, founder_notes, jobs, social_accounts, social_posts, context_files, dreams, dream_log, intel_categories, intel_sessions, emails, knowledge_nodes

### Railway Worker
URL: RAILWAY_WORKER_URL env var. Job types: curriculum_factory, social_batch, youtube_transcript. QStash signs each message; worker verifies signature before processing.`;

// Scores a research item against the user's message using keyword overlap.
// Higher = more relevant to what Scott is asking about right now.
function scoreRelevance(item: { title?: string; summary?: string; verdict?: string; tags?: string[] }, query: string): number {
  if (!query) return 0;
  const words = query.toLowerCase().split(/\W+/).filter((w) => w.length > 3);
  if (words.length === 0) return 0;
  const text = [
    item.title ?? "",
    item.summary ?? "",
    item.verdict ?? "",
    (item.tags ?? []).join(" "),
  ]
    .join(" ")
    .toLowerCase();
  return words.reduce((score, word) => score + (text.includes(word) ? 1 : 0), 0);
}

// Fetches live context from Supabase to append to every system prompt.
// Right now: latest published brief + recent research items (ranked by relevance to userMessage).
// This is what makes Chapterhouse absorb new information automatically.
async function buildLiveContext(userMessage: string = ""): Promise<string> {
  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) return "";

  const blocks: string[] = [];

  // App self-knowledge — always first so chat can answer "where does X live?"
  blocks.push(APP_ARCHITECTURE_BLOCK);

  // Session history — always current because push-log.ts is committed with the code each session.
  // This is the authoritative answer to "how has this app most recently been updated?"
  blocks.push(PUSH_LOG);

  // Council of the Unserious — full roster injected every solo chat per Scott's requirement:
  // "the characters need to be read basically every chat, wherever that agent system lives"
  blocks.push(`## The Council of the Unserious — Full Roster

Scott's permanent advisory team. They run in Council Mode (/council) but Scott can reference any of them anytime in solo chat.

**Gandalf** (claude-sonnet-4-6, 400 words max) — Scott's mirror. Reformed Baptist, runs on Monster energy. Pastoral, narrative, building things that matter. Goes first. Only Gandalf creates from zero. Quotes Spurgeon and cusses in the same paragraph. Teaching contract ends May 24, 2026.

**Data** (claude-sonnet-4-6, 300 words max) — Lt. Commander Data, TNG. Positronic audit. No ego, no emotional investment. Numbered findings. Asks the devastating question that sounds naive. "I have completed my analysis. There are fourteen items requiring attention."

**Polgara** (claude-sonnet-4-6, 300 words max) — Polgara the Sorceress, Belgariad. Anna's mirror. Thousands of years old, raised every heir in the Rivan line. Decisive, elegant, maternal fierceness. Always says "your child" not "the student." Does not hedge.

**Earl Harbinger** (gpt-5.4, 200 words max) — MHI leader, Monster Hunter International. For-profit, Southern, drives an old truck. Is a werewolf. What does Scott DO, in what order, by when? Good enough Tuesday beats perfect never. Ship it.

**Silk** (gpt-5-mini, 200 words max) — Prince Kheldar, Drasnia. Pattern breaker. Reads the subtext, the thing Scott didn't say but meant, the assumption that will compromise the plan in week six. Names it in twelve words. Someone laughs before they feel the cut.`);

  // The Folio — Scott's daily synthesized intelligence snapshot
  // top_action is injected first so the most important signal is always at the top
  try {
    const folioCtx = await getFolioContext();
    if (folioCtx) blocks.push(folioCtx);
  } catch { /* Folio not yet populated — skip silently on first run */ }

  // Detect dismissed signals — always fetch and inject so AI knows what NOT to surface
  let dismissedSignals: string[] = [];
  try {
    const { data: dismissedNotes } = await supabase
      .from("founder_notes")
      .select("content")
      .eq("category", "dismissed")
      .order("created_at", { ascending: false });
    if (dismissedNotes && dismissedNotes.length > 0) {
      dismissedSignals = dismissedNotes.map((n) =>
        (n.content as string).replace(/^DISMISSED:\s*/i, "")
      );
      blocks.push(
        `## Dismissed Signals — Do Not Surface\n\nScott has explicitly dismissed these topics. Do NOT raise them in responses, recommendations, or suggestions unless Scott asks about them directly:\n\n` +
        dismissedSignals.map((s) => `- ${s}`).join("\n")
      );
    }
  } catch {
    // dismissed notes may not exist yet — ignore
  }

  // Active Knowledge Library — promoted newsletter insights and manual notes
  try {
    const { data: activeNodes } = await supabase
      .from("knowledge_nodes")
      .select("folder, subfolder, title, body")
      .eq("is_active", true)
      .order("inject_order", { ascending: true })
      .limit(20);
    if (activeNodes && activeNodes.length > 0) {
      const nodeLines = activeNodes.map((n) => {
        const path = n.subfolder ? `${n.folder} / ${n.subfolder}` : n.folder;
        return `**${n.title}** [${path}]\n${n.body}`;
      }).join("\n\n---\n\n");
      blocks.push(`## Active Knowledge Library\n\n${nodeLines}`);
    }
  } catch { /* knowledge_nodes not yet migrated */ }

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

  // Email intent detection — if Scott is asking about emails, query the full inbox live
  const emailIntentPattern = /\b(email|emails|inbox|inbox|unread|mail|message|messages|got\s+mail|new\s+mail)\b/i;
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
        const urgent = emails.filter((e) => (e.urgency ?? 0) >= 4);
        const actionRequired = emails.filter((e) => e.action_required);
        const nchoCount = emails.filter((e) => e.email_account === "ncho" || e.email_account === "gmail_ncho").length;
        const gmailCount = emails.filter((e) => e.email_account === "gmail_personal").length;
        const emailLines = emails.map((e) => {
          const acct = ACCT_LABEL[e.email_account as string] ?? "Email";
          const flags = [
            !e.is_read ? "UNREAD" : null,
            e.action_required ? "ACTION REQUIRED" : null,
            (e.urgency ?? 0) >= 4 ? `URGENT(${e.urgency})` : null,
            e.category && e.category !== "other" ? e.category.toUpperCase() : null,
          ].filter(Boolean).join(", ");
          const dateStr = new Date(e.received_at as string).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
          return `- [${acct}][${dateStr}]${flags ? ` [${flags}]` : ""} **${e.from_name || e.from_address}**: ${e.subject}\n  ${e.ai_summary || e.snippet || ""}`.trimEnd();
        }).join("\n");
        const summary = `Inbox: ${emails.length} recent / ${unread.length} unread / ${actionRequired.length} need action / ${urgent.length} urgent | NCHO: ${nchoCount} / Gmail: ${gmailCount}`;
        blocks.push(`## Live Context: Inbox (queried now)\n\n${summary}\n\n${emailLines}`);
        if (actionRequired.length > 0) {
          blocks.push(`## Email Intelligence\n\nScott has ${actionRequired.length} email(s) flagged as needing a reply. If he asks for draft replies, help compose concise, professional responses for each action_required email listed above. Match formality to the sender.`);
        }
      } else {
        blocks.push(`## Live Context: Inbox (queried now)\n\nNo emails found in the persisted inbox. Run "Sync & Categorize" from the Email Inbox page to pull in recent messages.`);
      }
    } catch {
      // emails table may not exist — ignore
    }
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
    // Founder memory — personal facts about Scott, Anna, and the business
    // Exclude dismissed notes — those are shown in their own dedicated block above
    const { data: founderNotes } = await supabase
      .from("founder_notes")
      .select("content, category, created_at")
      .neq("category", "dismissed")
      .order("created_at", { ascending: false });

    if (founderNotes && founderNotes.length > 0) {
      const notesText = founderNotes
        .map((n) => `- [${n.category}] ${n.content}`)
        .join("\n");
      blocks.push(`## Live Context: Founder Memory\n\nThese are accumulated facts about Scott, Anna, and the business — treat them as ground truth:\n\n${notesText}`);
    }
  } catch {
    // founder_notes table may not exist yet — ignore
  }

  try {
    // Latest published brief
    const { data: brief } = await supabase
      .from("briefs")
      .select("brief_date, title, summary, sections")
      .eq("status", "published")
      .order("brief_date", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (brief) {
      const sectionText = Array.isArray(brief.sections)
        ? (brief.sections as Array<{ title: string; items: Array<{ headline: string; whyItMatters: string; score: string }> }>)
            .map((s) =>
              `### ${s.title}\n` +
              s.items.map((item) => `- [${item.score}] ${item.headline}: ${item.whyItMatters}`).join("\n")
            )
            .join("\n\n")
        : "";
      blocks.push(
        `## Live Context: Latest Daily Brief (${brief.brief_date})\n\n` +
        `**${brief.title}**\n\n` +
        (brief.summary ? `${brief.summary}\n\n` : "") +
        sectionText
      );
    }
  } catch {
    // Brief fetch failed — carry on without it
  }

  try {
    // Knowledge summaries — compressed overview of accumulated research by tag
    const { data: summaries } = await supabase
      .from("knowledge_summaries")
      .select("tag, summary, item_count")
      .order("item_count", { ascending: false });

    if (summaries && summaries.length > 0) {
      const summaryText = summaries
        .map((s) => `### ${s.tag} (${s.item_count} items)\n${s.summary}`)
        .join("\n\n");
      blocks.push(
        `## Live Context: Accumulated Knowledge Base\n\nResearch Scott and Anna have saved and distilled — treat these as established facts about their market, tools, and environment:\n\n${summaryText}`
      );
    }
  } catch {
    // knowledge_summaries table not yet created — ignore
  }

  try {
    // Fetch up to 100 research items, then rank by relevance to the user's message
    const { data: allItems } = await supabase
      .from("research_items")
      .select("url, title, summary, verdict, tags, created_at")
      .order("created_at", { ascending: false })
      .limit(100);

    if (allItems && allItems.length > 0) {
      // Score each item, then sort descending. Fall back to recency order (score=0 for all) when no message.
      const scored = allItems
        .map((item) => ({ item, score: scoreRelevance(item, userMessage) }))
        .sort((a, b) => b.score - a.score || 0); // stable: recency order preserved for ties

      const top10 = scored.slice(0, 10).map((s) => s.item);

      const researchText = top10
        .map((item) =>
          `- **${item.title || item.url}** (${new Date(item.created_at).toLocaleDateString()})\n` +
          `  ${item.summary || ""}\n` +
          (item.verdict ? `  Verdict: ${item.verdict}` : "")
        )
        .join("\n");
      blocks.push(`## Live Context: Research (top 10 by relevance)\n\n${researchText}`);
    }
  } catch {
    // research_items table may not exist yet — ignore
  }

  try {
    // Top open opportunities
    const { data: opps } = await supabase
      .from("opportunities")
      .select("title, description, category, store_score, curriculum_score, content_score, action, status")
      .in("status", ["open", "in-progress"])
      .order("created_at", { ascending: false })
      .limit(8);

    if (opps && opps.length > 0) {
      const oppText = opps
        .map((o) =>
          `- **${o.title}** [${o.category}] — Store: ${o.store_score}, Curriculum: ${o.curriculum_score}, Content: ${o.content_score}\n` +
          `  ${o.description}\n` +
          (o.action ? `  Next action: ${o.action}` : "")
        )
        .join("\n");
      blocks.push(`## Live Context: Open Opportunities\n\n${oppText}`);
    }
  } catch {
    // opportunities table may not exist yet — ignore
  }

  try {
    // Recent intel sessions (last 48h) — curated business signals, market intelligence
    const cutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
    const { data: intelSessions } = await supabase
      .from("intel_sessions")
      .select("created_at, session_label, processed_output, seeds_extracted, source_type")
      .eq("status", "complete")
      .gte("created_at", cutoff)
      .order("created_at", { ascending: false })
      .limit(5);

    if (intelSessions && intelSessions.length > 0) {
      type LocalIntelItem = { headline: string; detail: string; impact_score: string; affected_repos: string[] };
      type LocalIntelOutput = { summary?: string; sections?: Array<{ items: LocalIntelItem[] }>; proposed_seeds?: Array<{ text: string; category: string }> };

      const intelTexts = intelSessions
        .map((session) => {
          const output = session.processed_output as LocalIntelOutput | null;
          if (!output) return null;

          const label = (session.session_label as string | null) ?? new Date(session.created_at as string).toLocaleDateString("en-US");
          const typeTag = session.source_type === "cron" ? "[Daily]" : session.source_type === "publishers_weekly" ? "[PW]" : "[Manual]";

          const topItems = (output.sections ?? [])
            .flatMap((s) => s.items)
            .filter((item) => ["A+", "A", "A-", "B+"].includes(item.impact_score))
            .slice(0, 6);

          const itemLines = topItems.length > 0
            ? topItems.map((item) =>
                `- [${item.impact_score}] **${item.headline}**: ${item.detail.slice(0, 200)}` +
                (item.affected_repos?.length ? ` (→ ${item.affected_repos.join(", ")})` : "")
              ).join("\n")
            : "(no A-tier signals)";

          const seedLines = output.proposed_seeds?.slice(0, 3)
            .map((s) => `- ${s.text} (${s.category})`).join("\n") ?? "";

          return `### ${typeTag} ${label}\n${output.summary ?? ""}\n\n**Top signals:**\n${itemLines}` +
            (seedLines ? `\n\n**Proposed actions:**\n${seedLines}` : "");
        })
        .filter(Boolean)
        .join("\n\n---\n\n");

      blocks.push(`## Live Context: Recent Intel (last 48h)\n\nCurated business signals scored for direct impact on NCHO, SomersSchool, and BibleSaaS.\n\n${intelTexts}`);
    }
  } catch {
    // intel_sessions table may not exist — ignore
  }

  // Academic paper intent — inject Semantic Scholar citations + relevant doc content
  if (ACADEMIC_PAPER_INTENT.test(userMessage)) {
    try {
      const supabase = getSupabaseServiceRoleClient();
      const userId = await getAuthenticatedUserId();
      const acBlocks: string[] = [];

      // Pull any uploaded docs mentioned by name in the message
      if (supabase && userId) {
        const { data: docs } = await supabase
          .from("documents")
          .select("title, content")
          .eq("user_id", userId)
          .limit(3);
        if (docs && docs.length > 0) {
          for (const doc of docs) {
            const titleMentioned = userMessage.toLowerCase().includes((doc.title as string).toLowerCase());
            if (titleMentioned && doc.content) {
              acBlocks.push(`## Source Document: ${doc.title}\n\n${(doc.content as string).slice(0, 3000)}`);
            }
          }
        }
      }

      // Semantic Scholar citations
      const citations: CitationResult[] = await searchSemanticScholar(userMessage.slice(0, 200));
      if (citations.length > 0) {
        const citationBlock = citations
          .map((c, i) => {
            const doi = c.doi ? ` DOI: ${c.doi}` : "";
            return `${i + 1}. **${c.title}** — ${c.authors}${c.year ? ` (${c.year})` : ""}${doi}\n   ${c.abstract}`;
          })
          .join("\n\n");
        acBlocks.push(`## Semantic Scholar — Relevant Papers\n\n${citationBlock}`);
      }

      if (acBlocks.length > 0) {
        blocks.push(`## Academic Paper Context\n\n${acBlocks.join("\n\n---\n\n")}`);
      }
    } catch { /* non-fatal — skip if Semantic Scholar unavailable */ }
  }

  return blocks.length > 0
    ? "\n\n---\n\n" + blocks.join("\n\n---\n\n")
    : "";
}

// Extracts HTTP/HTTPS URLs from a text string
function extractUrls(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s<>"')\]]+/gi;
  const matches = text.match(urlRegex);
  if (!matches) return [];
  // Deduplicate and limit to 3 URLs to keep context reasonable
  return [...new Set(matches)].slice(0, 3);
}

// Fetches a URL and extracts readable text content (with SSRF protection)
async function fetchUrlContent(url: string): Promise<string | null> {
  try {
    const parsed = new URL(url);
    // SSRF protection: block private/internal IPs and non-http(s) schemes
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === "localhost" ||
      hostname.startsWith("127.") ||
      hostname.startsWith("10.") ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("0.") ||
      hostname === "[::1]" ||
      hostname.endsWith(".internal") ||
      hostname.endsWith(".local")
    ) return null;

    const res = await fetch(url, {
      headers: { "User-Agent": "Chapterhouse/1.0 (link preview)" },
      signal: AbortSignal.timeout(12000),
      redirect: "follow",
    });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html") && !contentType.includes("text/plain")) return null;

    const html = await res.text();

    // Extract metadata
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].replace(/\s+/g, " ").trim() : "";
    const descMatch = html.match(/<meta[^>]+(?:name|property)=["'](?:description|og:description)["'][^>]+content=["']([^"']+)["']/i)
      ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+(?:name|property)=["'](?:description|og:description)["']/i);
    const description = descMatch ? descMatch[1].trim() : "";
    const authorMatch = html.match(/<meta[^>]+name=["']author["'][^>]+content=["']([^"']+)["']/i);
    const author = authorMatch ? authorMatch[1].trim() : "";

    // Try to extract article/main content first (much richer than full-page strip)
    let articleHtml = "";
    const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i);
    if (articleMatch) {
      articleHtml = articleMatch[1];
    } else {
      const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
      if (mainMatch) {
        articleHtml = mainMatch[1];
      } else {
        // Try content divs common in blogs/CMSes
        const contentMatch = html.match(/<div[^>]+class=["'][^"']*(?:post-content|entry-content|article-content|blog-content|prose)[^"']*["'][^>]*>([\s\S]*?)<\/div>/i);
        if (contentMatch) {
          articleHtml = contentMatch[1];
        }
      }
    }

    // Strip HTML from the best source we found
    const sourceHtml = articleHtml || html;
    const text = sourceHtml
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[\s\S]*?<\/nav>/gi, "")
      .replace(/<header[\s\S]*?<\/header>/gi, "")
      .replace(/<footer[\s\S]*?<\/footer>/gi, "")
      .replace(/<aside[\s\S]*?<\/aside>/gi, "")
      .replace(/<form[\s\S]*?<\/form>/gi, "")
      .replace(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi, "\n## $2\n") // preserve headings
      .replace(/<li[^>]*>/gi, "\n- ")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&#\d+;/g, "")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]+/g, " ")
      .trim()
      .slice(0, 12000);

    const header = [
      `[URL: ${url}]`,
      title && `Title: ${title}`,
      author && `Author: ${author}`,
      description && `Description: ${description}`,
      articleHtml ? `(Article content extracted — ${text.length} chars)` : `(Full page stripped — ${text.length} chars)`,
    ].filter(Boolean).join("\n");

    return `${header}\n\n${text}`;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const { messages: rawMessages, model = "gpt-5.4", personaId, imageAttachments, grounded = false } = await request.json();

    // Strip any non-user/assistant roles — UI banners ("— The Council responds to each other —",
    // /remember confirmations) use role: "system" for display only; Anthropic's Messages API
    // rejects any role other than user/assistant in the messages array.
    const messages = Array.isArray(rawMessages)
      ? rawMessages.filter((m: { role?: string }) => m?.role === "user" || m?.role === "assistant")
      : rawMessages;

    const encoder = new TextEncoder();

    // Extract the last user message for relevance scoring
    const lastUserMsg: string =
      [...messages].reverse().find((m: { role: string; content: string }) => m.role === "user")?.content ?? "";

    // ── /dismiss command handler ──────────────────────────────────────────────
    // Usage: /dismiss [signal] — [optional reason]
    // Example: /dismiss Claude Code webinar — not relevant until after August 2026
    // Stores immediately to founder_notes (category: dismissed) and returns confirmation.
    if (lastUserMsg.trim().toLowerCase().startsWith("/dismiss ")) {
      const signal = lastUserMsg.trim().slice(9).trim();
      if (signal.length > 1) {
        const supabase = getSupabaseServiceRoleClient();
        if (supabase) {
          const content = `DISMISSED: ${signal}`;
          await supabase.from("founder_notes").insert({ content, category: "dismissed", source: "chat" });
        }
        const replyText = `Got it. I've flagged **"${signal}"** as dismissed. It won't be surfaced in your briefs, intel summaries, or chat responses going forward.\n\nTo un-dismiss it later, open the Debug panel → App Map → Dismissed Signals, or say \`/undismiss [topic]\`.`;
        return new Response(replyText, {
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      }
    }

    // ── /undismiss command handler ────────────────────────────────────────────
    if (lastUserMsg.trim().toLowerCase().startsWith("/undismiss ")) {
      const signal = lastUserMsg.trim().slice(11).trim().toLowerCase();
      const supabase = getSupabaseServiceRoleClient();
      if (supabase && signal.length > 1) {
        const { data: existing } = await supabase
          .from("founder_notes")
          .select("id, content")
          .eq("category", "dismissed")
          .ilike("content", `%${signal}%`);
        if (existing && existing.length > 0) {
          await supabase.from("founder_notes").delete().in("id", existing.map((r) => r.id));
          return new Response(`Un-dismissed ${existing.length} signal(s) matching "${signal}". They'll appear in briefs and context again.`, {
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          });
        } else {
          return new Response(`No dismissed signals found matching "${signal}". Check Debug → App Map → Dismissed Signals for the full list.`, {
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          });
        }
      }
    }

    // ── /inbox — list recent unread emails from Supabase ─────────────────────
    if (lastUserMsg.trim().toLowerCase() === "/inbox") {
      const supabase = getSupabaseServiceRoleClient();
      if (!supabase) {
        return new Response("Database unavailable.", { headers: { "Content-Type": "text/plain; charset=utf-8" } });
      }
      const { data: usersData } = await supabase.auth.admin.listUsers();
      const inboxUserId = usersData?.users?.[0]?.id;
      if (!inboxUserId) {
        return new Response("Auth error — could not resolve user.", { headers: { "Content-Type": "text/plain; charset=utf-8" } });
      }
      const { data: emails } = await supabase
        .from("emails")
        .select("subject, from_name, from_address, received_at, email_account, category")
        .eq("user_id", inboxUserId)
        .eq("is_read", false)
        .order("received_at", { ascending: false })
        .limit(20);
      if (!emails || emails.length === 0) {
        return new Response(
          "📭 No unread emails in the database. Try `/triage` to fetch new messages from your inbox.",
          { headers: { "Content-Type": "text/plain; charset=utf-8" } }
        );
      }
      type EmailRow = { subject: string; from_name: string | null; from_address: string; received_at: string; email_account: string; category: string | null };
      const lines = (emails as EmailRow[]).map((e, i) => {
        const from = e.from_name || e.from_address;
        const date = new Date(e.received_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
        const cat = e.category ? ` [${e.category}]` : "";
        return `${i + 1}. **${e.subject}** — ${from}${cat} (${date}) [${e.email_account}]`;
      });
      return new Response(
        `📬 **${emails.length} unread email(s):**\n\n${lines.join("\n")}\n\nUse \`/archive-spam\`, \`/archive-newsletters\`, or \`/archive-notifications\` to clean up by category.`,
        { headers: { "Content-Type": "text/plain; charset=utf-8" } }
      );
    }

    // ── /triage [N] — bulk-fetch emails from IMAP into Supabase ─────────────
    if (lastUserMsg.trim().toLowerCase().startsWith("/triage")) {
      const parts = lastUserMsg.trim().split(/\s+/);
      const limitArg = parts[1] ? parseInt(parts[1], 10) : 200;
      const limit = isNaN(limitArg) ? 200 : Math.min(Math.max(1, limitArg), 500);
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email/bulk-triage`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.CRON_SECRET}`,
          },
          body: JSON.stringify({ limit }),
        });
        if (!res.ok) {
          const text = await res.text();
          console.error(`[/triage] bulk-triage returned ${res.status}: ${text.slice(0, 500)}`);
          return new Response(`❌ Triage failed (HTTP ${res.status}). Check server logs.`, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
        }
        const data = (await res.json()) as { fetched?: number; inserted?: number; skipped?: number };
        return new Response(
          `📥 Triage complete. Fetched **${data.fetched ?? 0}** messages — **${data.inserted ?? 0}** new, ${data.skipped ?? 0} already stored. Use \`/inbox\` to see unread messages.`,
          { headers: { "Content-Type": "text/plain; charset=utf-8" } }
        );
      } catch (err) {
        console.error("[/triage] bulk-triage threw:", err);
        return new Response("❌ Triage failed. Check server logs.", { headers: { "Content-Type": "text/plain; charset=utf-8" } });
      }
    }

    // ── /archive-spam — bulk-archive all spam emails ──────────────────────────
    if (lastUserMsg.trim().toLowerCase() === "/archive-spam") {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email/bulk-archive`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.CRON_SECRET}`,
          },
          body: JSON.stringify({ category: "spam" }),
        });
        if (!res.ok) {
          const text = await res.text();
          console.error(`[/archive-spam] bulk-archive returned ${res.status}: ${text.slice(0, 500)}`);
          return new Response(`❌ Archive failed (HTTP ${res.status}). Check server logs.`, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
        }
        const data = (await res.json()) as { archived?: number; failed?: number; byAccount?: Record<string, number> };
        const failNote = (data.failed ?? 0) > 0 ? ` (${data.failed} IMAP error(s))` : "";
        const acctLines = data.byAccount && Object.keys(data.byAccount).length > 0
          ? `\n\n*By account:* ${Object.entries(data.byAccount).map(([k, v]) => `${k}: ${v}`).join(", ")}`
          : "";
        return new Response(
          `🗑️ Archived **${data.archived ?? 0}** spam email(s)${failNote}.${acctLines}`,
          { headers: { "Content-Type": "text/plain; charset=utf-8" } }
        );
      } catch (err) {
        console.error("[/archive-spam] bulk-archive threw:", err);
        return new Response("❌ Archive failed. Check server logs.", { headers: { "Content-Type": "text/plain; charset=utf-8" } });
      }
    }

    // ── /archive-newsletters — bulk-archive all newsletter emails ─────────────
    if (lastUserMsg.trim().toLowerCase() === "/archive-newsletters") {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email/bulk-archive`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.CRON_SECRET}`,
          },
          body: JSON.stringify({ category: "newsletter" }),
        });
        if (!res.ok) {
          const text = await res.text();
          console.error(`[/archive-newsletters] bulk-archive returned ${res.status}: ${text.slice(0, 500)}`);
          return new Response(`❌ Archive failed (HTTP ${res.status}). Check server logs.`, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
        }
        const data = (await res.json()) as { archived?: number; failed?: number; byAccount?: Record<string, number> };
        const failNote = (data.failed ?? 0) > 0 ? ` (${data.failed} IMAP error(s))` : "";
        const acctLines = data.byAccount && Object.keys(data.byAccount).length > 0
          ? `\n\n*By account:* ${Object.entries(data.byAccount).map(([k, v]) => `${k}: ${v}`).join(", ")}`
          : "";
        return new Response(
          `📰 Archived **${data.archived ?? 0}** newsletter email(s)${failNote}.${acctLines}`,
          { headers: { "Content-Type": "text/plain; charset=utf-8" } }
        );
      } catch (err) {
        console.error("[/archive-newsletters] bulk-archive threw:", err);
        return new Response("❌ Archive failed. Check server logs.", { headers: { "Content-Type": "text/plain; charset=utf-8" } });
      }
    }

    // ── /archive-notifications — bulk-archive all notification emails ──────────
    if (lastUserMsg.trim().toLowerCase() === "/archive-notifications") {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/email/bulk-archive`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.CRON_SECRET}`,
          },
          body: JSON.stringify({ category: "notification" }),
        });
        if (!res.ok) {
          const text = await res.text();
          console.error(`[/archive-notifications] bulk-archive returned ${res.status}: ${text.slice(0, 500)}`);
          return new Response(`❌ Archive failed (HTTP ${res.status}). Check server logs.`, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
        }
        const data = (await res.json()) as { archived?: number; failed?: number; byAccount?: Record<string, number> };
        const failNote = (data.failed ?? 0) > 0 ? ` (${data.failed} IMAP error(s))` : "";
        const acctLines = data.byAccount && Object.keys(data.byAccount).length > 0
          ? `\n\n*By account:* ${Object.entries(data.byAccount).map(([k, v]) => `${k}: ${v}`).join(", ")}`
          : "";
        return new Response(
          `🔔 Archived **${data.archived ?? 0}** notification email(s)${failNote}.${acctLines}`,
          { headers: { "Content-Type": "text/plain; charset=utf-8" } }
        );
      } catch (err) {
        console.error("[/archive-notifications] bulk-archive threw:", err);
        return new Response("❌ Archive failed. Check server logs.", { headers: { "Content-Type": "text/plain; charset=utf-8" } });
      }
    }

    // Enrich system prompt with live context from Supabase (research ranked by relevance to this message)
    const liveContext = await buildLiveContext(lastUserMsg);
    const isAcademicPaper = ACADEMIC_PAPER_INTENT.test(lastUserMsg);

    // Detect URLs in the user's message and fetch their content
    let urlContext = "";
    const urls = extractUrls(lastUserMsg);
    if (urls.length > 0) {
      const fetched = await Promise.all(urls.map(fetchUrlContent));
      const urlTexts = fetched.filter(Boolean) as string[];
      if (urlTexts.length > 0) {
        urlContext = "\n\n---\n\n## Live Context: URLs From This Message\n\nThe user shared these links. Their content has been fetched for you:\n\n" +
          urlTexts.join("\n\n---\n\n");
      }
    }

    // If a persona is selected, use its system prompt instead of the default.
    // Otherwise load the user's DB-resident context file (falls back to FALLBACK_SYSTEM_PROMPT).
    const persona = personaId ? getPersonaById(personaId) : null;
    let basePrompt: string;
    if (persona) {
      basePrompt = `${persona.systemPrompt}\n\n---\n\nYou are speaking as ${persona.name} (${persona.title}). Stay in character. Respond from your area of expertise. You are part of Chapterhouse — Scott Somers' internal intelligence system for Next Chapter Homeschool Outpost.`;
    } else {
      const userId = await getAuthenticatedUserId().catch(() => null);
      basePrompt = userId ? await getSystemPrompt(userId) : FALLBACK_SYSTEM_PROMPT;
    }
    // Phase 25C: Grounded Mode — restrict AI to context only
    const groundedPrefix = grounded
      ? `GROUNDED MODE ACTIVE: Only reference information that exists in the context provided below. If you don't have enough context to answer, say "I don't have that information in my current context." Do NOT generate facts, statistics, URLs, or claims from your training data. This is a prompt-level instruction and does not guarantee factual accuracy.\n\n`
      : "";
    const systemPrompt = groundedPrefix + basePrompt + liveContext + urlContext;

    // Build enriched messages for Anthropic if images present
    let anthropicMessages = messages as Anthropic.MessageParam[];
    if (imageAttachments && (imageAttachments as unknown[]).length > 0) {
      const lastMsg = anthropicMessages[anthropicMessages.length - 1];
      if (lastMsg?.role === "user") {
        const imgBlocks = (imageAttachments as Array<{ dataUrl: string; mimeType: string }>).map((img) => ({
          type: "image" as const,
          source: {
            type: "base64" as const,
            media_type: img.mimeType as "image/jpeg" | "image/png" | "image/gif" | "image/webp",
            data: (img.dataUrl as string).split(",")[1],
          },
        }));
        anthropicMessages = [
          ...anthropicMessages.slice(0, -1),
          {
            role: "user" as const,
            content: [...imgBlocks, { type: "text" as const, text: lastMsg.content as string }],
          },
        ];
      }
    }

    // Route to Anthropic if claude model requested
    if (model.startsWith("claude")) {
      const stream = getAnthropic().messages.stream({
        model,
        max_tokens: isAcademicPaper ? 8000 : 2048,
        system: systemPrompt,
        messages: anthropicMessages,
      });

      const readable = new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              if (
                chunk.type === "content_block_delta" &&
                chunk.delta.type === "text_delta"
              ) {
                controller.enqueue(encoder.encode(chunk.delta.text));
              }
            }
            controller.close();
          } catch (streamErr) {
            console.error("Anthropic stream error:", streamErr);
            const msg = streamErr instanceof Error ? streamErr.message : String(streamErr);
            controller.enqueue(encoder.encode(`\n\n[Error: ${msg}]`));
            controller.close();
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
    }

    // OpenAI — use Responses API (required for gpt-5.x models)
    let openAiInput = messages as ResponseInput;
    if (imageAttachments && (imageAttachments as unknown[]).length > 0) {
      const lastMsg = openAiInput[openAiInput.length - 1];
      if (lastMsg && "role" in lastMsg && lastMsg.role === "user") {
        const lastMsgTyped = lastMsg as { role: string; content: unknown };
        const imgParts = (imageAttachments as Array<{ dataUrl: string }>).map((img) => ({
          type: "input_image" as const,
          image_url: img.dataUrl,
        }));
        openAiInput = [
          ...openAiInput.slice(0, -1),
          {
            role: "user",
            content: [{ type: "input_text", text: lastMsgTyped.content as string }, ...imgParts],
          },
        ] as ResponseInput;
      }
    }
    const stream = await getOpenAI().responses.create({
      model,
      instructions: systemPrompt,
      input: openAiInput,
      stream: true,
      max_output_tokens: isAcademicPaper ? 8000 : 2048,
    });

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (
              event.type === "response.output_text.delta" &&
              event.delta
            ) {
              controller.enqueue(encoder.encode(event.delta));
            }
          }
          controller.close();
        } catch (streamErr) {
          console.error("OpenAI stream error:", streamErr);
          const msg = streamErr instanceof Error ? streamErr.message : String(streamErr);
          controller.enqueue(encoder.encode(`\n\n[Error: ${msg}]`));
          controller.close();
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
    console.error("Chat API error:", error);
    return new Response("Failed to get response", { status: 500 });
  }
}
