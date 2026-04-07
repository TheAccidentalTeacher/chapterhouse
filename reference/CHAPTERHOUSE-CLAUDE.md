# CLAUDE.md — Chapterhouse Upgrade Brief
### For the Copilot/Claude Code instance working in the Chapterhouse repo
*Copy this file to the Chapterhouse repo root as `CLAUDE.md`. Claude Code reads it automatically.*

---

## Who This Is For

You are the AI agent working inside `TheAccidentalTeacher/chapterhouse`.

Scott Somers is a middle school teacher in Glennallen, Alaska building a homeschool SaaS empire. This app — Chapterhouse — is his **primary operations tool**. Think of it as mission control: every AI job, every automation pipeline, every overnight batch task runs through or is visible from here. It is private (Scott + Anna only). Not a product. His cockpit.

**Teaching contract ends May 24, 2026. Revenue required before August 2026. Everything built here serves that deadline.**

This document is your complete technical brief. Read all of it before touching any code.

---

## What Chapterhouse Already Is (Current State — Updated March 17, 2026, Session 14)

**Stack:** Next.js 16.1.6 (App Router), React 19, TypeScript, Tailwind 4, Supabase (auth + DB + realtime), Anthropic SDK, OpenAI SDK, Zod

**All routes — grouped by sidebar section:**

### Command Center
- `/` (Home) — Chat-first interface with Solo/Council mode toggle. Solo mode uses a single model (GPT-5.4, Claude Sonnet 4.6, Haiku 4.5, GPT-5-mini). Council mode streams multi-member Council of the Unserious responses via SSE (Gandalf, Data, Polgara, Earl, Beavis & Butthead). Rebuttal round after initial responses. Persistent threads, auto-save, `/remember` command, auto-learn extracts facts to `founder_notes`.
- `/daily-brief` — Automated daily brief from 3 sources: 9 RSS feeds + 11 GitHub repos + **daily.dev** (For You, Popular, Anthropic/Security/Next.js tag feeds, up to 30 posts). Full business context injected: founder_notes, research_items, open opportunities, knowledge_summaries, days-remaining countdown. Claude Haiku 4.5 post-generation pass scores every item ncho/somersschool/biblesaas (0–3). Items scoring ≥2 on 2+ tracks get collision_note. "⚡ Collisions" section pinned at top of brief page. Vercel cron: 3:00 UTC (7 AM Alaska). Meta response includes collisionCount + contextInjected stats.

### Intelligence
- `/research` — URL ingest, paste text, quick note, screenshot (GPT Vision), agentic auto-research (Tavily → GPT-5.4 → dedup → auto-ingest), Deep Research (multi-source parallel: Tavily + SerpAPI + Reddit + NewsAPI + Internet Archive). AI extraction, tagging, OG metadata (site_name, author, published_at, og_image), knowledge summaries. SSRF-protected URL fetching. Full CRUD.
- `/product-intelligence` — Scored opportunity cards (A+/A/B). Triple-scored: Store (NCHO) / Curriculum (SomerSchool) / Content (marketing). Status tracking. Routes to Review Queue.
- `/youtube` — YouTube Intelligence. Paste URL or search YouTube (Data API v3) → 3-tier transcript: captions (npm, fast) → innertube API → Gemini 2.5 Flash (Railway worker, ~77s, production path). Hallucination guard: validates video via YouTube Data API before Gemini processes. 8 curriculum tools: quiz, lesson plan, vocabulary, discussion questions, DOK projects, graphic organizers, guided notes, full analysis (Claude Sonnet 4.6 grade-appropriate). Batch mode for multi-video processing. Supabase Realtime job watching.

### Production
- `/content-studio` — AI content generation (3 modes): newsletter/campaign, curriculum guide, product description. Claude Sonnet 4.6. Copy to clipboard.
- `/creative-studio` — Multi-provider AI image generation: GPT Image 1, Stability AI (SDXL), Flux (Replicate), Leonardo.ai (Phoenix — best for Gimli character consistency). Stock photo search: Pexels + Pixabay + Unsplash simultaneously. 4× upscale via Real-ESRGAN. One-click save to Cloudinary CDN. Freesound sound effects browser (CC license + duration filters, in-browser preview). Suno AI music workflow. HeyGen avatar video generation (polls status every 10s). Generation history preserved in session.
- `/voice-studio` — ElevenLabs TTS (premium voices, scoped key per project) + Azure Speech TTS (free tier, 10+ neural voices). In-browser recording → Azure Speech STT transcription. Speed control 0.5×–2.0×. Download as MP3.
- `/review-queue` — Combined research + opportunity review queue. Approve/reject/flag. Create Task directly.
- `/tasks` — Task board with full status machine: open → in-progress → blocked → done → canceled. Source linking (from brief, opportunity, or manual). Full CRUD.
- `/documents` — Workspace markdown files rendered and searchable.

### AI & Automation
- `/jobs` — Real-time job dashboard. QStash → Railway workers. Supabase Realtime progress. Visual 6-step PassStepper on curriculum jobs. Accumulating session log. Job detail drawer with output viewer.
- `/curriculum-factory` — 6-pass Council of the Unserious (Gandalf → Data → Polgara → Earl → Beavis & Butthead → Extract JSON). National standards auto-aligned (CCSS-ELA/CCSS-Math/NGSS/C3 auto-detected from subject). Produces BOTH `finalScopeAndSequence` (Polgara's markdown) AND `structuredOutput` (validated SomersSchool pipeline JSON — drop into `scope-sequence/`). HTML/PDF/DOCX export. Batch mode (parent + child jobs).
- `/pipelines` — n8n workflow control panel. Status, execution history, manual triggers. Proxies to Railway-hosted n8n.
- `/council` — 6-pass Council Chamber as background job. Same pipeline as curriculum-factory. Output: Final Scope & Sequence → Pipeline Handoff JSON (emerald card, copy/download/preview) → Earl (open by default) → B&B → Working Papers accordion (Gandalf draft + Data critique, closed) → Download full session transcript (includes JSON fenced block).
- `/social` — Social media automation (replaces Sintra, $49/mo). 3-tab UI: **Review Queue** (Supabase Realtime live updates, inline text edit, datetime picker, Buffer channel selector, approve/reject, full edit history tracking in JSONB), **Generate** (Claude Sonnet 4.6, 3 brands × 3 platforms, topic seed, brand voice enforced per brand), **Accounts** (Buffer GraphQL sync via GetOrganizations + GetChannels, manual brand→channel mapping). Weekly cron: Monday 05:00 UTC. Shopify webhook: new product → NCHO launch posts auto-generated (HMAC-verified).

### System
- `/settings` — Environment status, provider configuration, founder memory panel (add/edit/delete notes).
- `/help` — Help guide rendered from `chapterhouse-help-guide.md`.
- `/login` — Supabase email/password auth.

**Additional API routes not surfaced in nav:**
- `voice/synthesize/` — ElevenLabs + Azure Speech TTS
- `voice/transcribe/` — Azure Speech STT
- `translate/` — Azure Translator
- `images/` — Multi-provider image generation + stock search
- `sounds/` — Freesound API proxy
- `video/generate/` + `video/status/` — HeyGen avatar video
- `chat/` — Single-model chat + Council SSE
- `extract-learnings/` — Auto-extract facts from conversations to `founder_notes`
- `search/` — Global cross-table search (tasks, research, opportunities, threads, briefs)
- `debug/` + `debug/context/` — Debug context and logging
- `/product-intelligence` — Scored opportunity cards (A+/A/B). Competitive analysis, market signals.
- `/youtube` — YouTube Intelligence. Paste URL or search YouTube → extract transcript (captions → innertube → Gemini via Railway worker) → generate curriculum materials (quizzes, lesson plans, vocabulary, discussion questions, DOK projects, graphic organizers, guided notes). Batch mode for multi-video processing.

### Production
- `/content-studio` — AI content generation (newsletters, curriculum guides, product descriptions) via Claude.
- `/review-queue` — Combined research + opportunity review queue. Approve/reject/flag.
- `/tasks` — Task board with status tracking (open/in-progress/blocked/done/canceled). CRUD.
- `/documents` — Workspace markdown files rendered and searchable.

### AI & Automation
- `/jobs` — Real-time job dashboard. QStash → Railway workers. Supabase Realtime progress updates.
- `/curriculum-factory` — 6-pass Council of the Unserious curriculum generation form (Gandalf → Data → Polgara → Earl → Beavis & Butthead → Extract JSON). National standards auto-aligned (CCSS-ELA, CCSS-Math, NGSS, C3). Produces BOTH `finalScopeAndSequence` (markdown) AND `structuredOutput` (SomersSchool pipeline JSON).
- `/pipelines` — n8n workflow control panel. Status, execution history, manual triggers.
- `/council` — 6-pass Council of the Unserious Chamber for curriculum scope & sequence generation. Background job.
- `/social` — Social media automation. 3-tab UI: Review Queue (approve/edit/reject AI-generated posts with live Realtime updates), Generate (Claude-powered multi-brand × multi-platform batch generation), Accounts (Buffer channel sync + brand mapping).

### System
- `/settings` — Environment status, provider configuration, founder memory panel.
- `/help` — Help guide rendered from `chapterhouse-help-guide.md`.
- `/login` — Supabase email/password auth.

**API routes under `/api/`:**
- `auth/signout` — Sign out
- `briefs/` — Brief CRUD + `generate/` for AI generation
- `chat/` — Single-model chat endpoint (OpenAI + Anthropic)
- `chat/council/` — Multi-member Council SSE endpoint with rebuttal round
- `content-studio/` — AI content generation (3 modes)
- `cron/daily-brief/` — Vercel cron endpoint
- `debug/` — Debug context
- `extract-learnings/` — Auto-learn facts from chat
- `founder-notes/` — Founder memory CRUD
- `jobs/` — Job list (GET), `create/` (POST), `[id]/` (GET), `[id]/run/` (POST), `[id]/cancel/` (POST)
- `n8n/workflows/`, `n8n/executions/` — n8n proxy routes
- `opportunities/` — Opportunity list + `analyze/` + `[id]/` (PATCH)
- `research/` — Full CRUD (GET, POST, PATCH, DELETE)
- `research/auto/` — Agentic research via Tavily (web search → GPT-5.4 analysis → dedup → auto-ingest)
- `search/` — Global cross-table search (tasks, research, opportunities, threads, briefs via `ilike`)
- `social/accounts/` — Social account CRUD (GET active, POST upsert)
- `social/accounts/sync/` — Buffer GraphQL channel sync (GetOrganizations → GetChannels)
- `social/analytics/` — Pull post engagement stats from Buffer GraphQL API → `social_posts.buffer_stats`
- `social/generate/` — Claude Sonnet 4.6 multi-brand × multi-platform post generation with brand voice system prompt
- `social/posts/` — Social post list with status/brand filters
- `social/posts/[id]/` — PATCH (edit with history tracking) + DELETE (soft reject)
- `social/posts/[id]/approve/` — Approve + schedule via Buffer GraphQL `createPost` mutation
- `cron/social-weekly/` — Monday 05:00 UTC batch generation cron via QStash → Railway worker
- `webhooks/shopify-product/` — HMAC-verified Shopify webhook → auto-generate NCHO product launch posts
- `summarize/` — AI summarization
- `tasks/` — Task list + create, `[id]/` (PATCH, DELETE)
- `threads/` — Chat thread list + create, `[id]/` (PATCH)
- `youtube/transcript/` — YouTube transcript extraction (POST): captions → innertube fast path on Vercel, then Railway worker handoff for Gemini 2.5 Flash. Returns `{pending: true, jobId}` for async jobs.
- `youtube/search/` — YouTube Data API v3 search proxy (GET)
- `youtube/batch/` — Batch transcript processing for multiple videos (POST)
- `youtube/analyze/` — AI curriculum material generation from transcripts (POST): quizzes, lesson plans, vocabulary, discussion questions, DOK projects, graphic organizers, guided notes via Claude Sonnet 4.6

**Supabase tables:**
- `briefs`, `research_items`, `opportunities`, `tasks`, `chat_threads`, `knowledge_summaries`, `founder_notes`, `jobs`, `social_accounts`, `social_posts`

**Key env vars:** `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `QSTASH_TOKEN`, `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `TAVILY_API_KEY`, `NEWSAPI_API_KEY`, `N8N_BASE_URL`, `N8N_API_KEY`, `RAILWAY_WORKER_URL`, `GITHUB_TOKEN`, `CRON_SECRET`, `NEXT_PUBLIC_APP_URL`, `ALLOWED_EMAILS`, `BUFFER_ACCESS_TOKEN`, `SHOPIFY_WEBHOOK_SECRET`, `YOUTUBE_API_KEY`, `GEMINI_API_KEY`, `AZURE_SPEECH_KEY`, `AZURE_SPEECH_REGION`

**Installed and active:** `@upstash/qstash`, `@upstash/redis`, `@anthropic-ai/sdk`, `openai`, `@supabase/supabase-js`, `@supabase/ssr`, `zod`, `react-markdown`, `remark-gfm`, `resend`, `rss-parser`, `date-fns`, `html-to-docx`, `marked`, `lucide-react`, `youtube-transcript` (v1.3.0 — captions extraction, blocked from cloud IPs)

**Worker-only packages (Railway):** `@google/generative-ai` (Gemini 2.5 Flash), `microsoft-cognitiveservices-speech-sdk` (Azure Speech STT, Tier 3 fallback)

**UI features built across Sessions 6-7 (March 14, 2026):**
- Council Mode toggle (Solo/Council) inside chat input bar
- SSE-based multi-member streaming with colored avatar bubbles per member
- Council members bar with active speaker indicator
- Rebuttal round with visual divider
- Word limits on all Council member responses
- Accordion-grouped sidebar navigation with 5 sections
- Hover tooltips on all nav items showing purpose/context
- Dynamic system status rail (replaces hardcoded build status)
- Status badges (live/beta/soon) on each nav item
- Global cross-table search bar in shell header (searches 5 tables, color-coded type badges)
- Inline URL detection in chat — fetches page content (article/main extraction, 12K chars, SSRF protection) with visual "Fetching URL…" spinner
- Auto-learning: Claude silently extracts facts from last 6 messages after every user message → `founder_notes`
- Live context injection: `buildLiveContext()` injects founder memory, daily brief, research, opportunities into every chat
- Agentic research tab: topic → Tavily search → GPT-5.4 analysis → dedup → auto-ingest
- Research metadata extraction: OG tags (site_name, author, published_at, og_image) on URL ingest
- Daily brief email delivery: Resend sends formatted HTML brief to scott@nextchapterhomeschool.com on cron
- Thread persistence: debounced 1.5s auto-save to Supabase `chat_threads`

---

## Build Phase Status

All four original phases are **built and deployed**. Current focus is polish, documentation, and production hardening.

```
PHASE 1 — The Job Runner                    ✅ COMPLETE
  Background AI jobs via QStash → Railway workers.
  Supabase Realtime progress. Jobs dashboard at /jobs.
  API: /api/jobs/ (list, create, [id], [id]/cancel, [id]/run)

PHASE 2 — The Curriculum Factory             ✅ COMPLETE
  6-pass Council of the Unserious critique loop (Gandalf → Data → Polgara → Earl → Beavis & Butthead → Extract JSON).
  Produces BOTH finalScopeAndSequence (markdown) AND structuredOutput (validated SomersSchool pipeline JSON).
  National standards auto-alignment: CCSS-ELA, CCSS-Math, NGSS, C3 Framework.
  Form + batch support at /curriculum-factory.
  Also Council Chamber at /council (6-pass background job variant; 6-step visual stepper + accumulating session log).

PHASE 3 — n8n Control Panel                  ✅ COMPLETE
  Proxy routes at /api/n8n/workflows/ and /api/n8n/executions/.
  Pipelines dashboard at /pipelines.

PHASE 4 — Council Mode in Chat               ✅ COMPLETE (scope expanded)
  Originally planned as "Council Chamber (Future)." Now TWO implementations:
  1. /council — Background job: purpose-built curriculum generator
  2. Home chat — Real-time Council Mode: toggle Solo/Council in main chat,
     SSE-streamed multi-member responses with rebuttal round.
     Members: Gandalf, Data, Polgara, Earl, Beavis & Butthead.

BONUS — Sidebar & Help System                ✅ COMPLETE
  Accordion-grouped navigation (5 sections).
  Hover tooltips on every nav item. Status badges (live/beta/soon).
  Dynamic system status rail. Help guide at /help.

PHASE 5 — Social Media Automation            ✅ COMPLETE
  Replaces Sintra ($49/mo, 250-credit cap, broken images, single-brand).
  Claude Sonnet 4.6 generates posts for 3 brands × 3 platforms.
  Human review gate: approve/edit/reject before anything publishes.
  Buffer GraphQL API for scheduling (createPost mutation).
  Buffer GraphQL API for analytics (post stats → buffer_stats JSONB).
  Shopify webhook auto-triggers NCHO product launch posts.
  Weekly Monday 05:00 UTC cron generates a fresh batch via QStash → Railway.
  Supabase Realtime updates review queue live as posts generate.
  Edit history tracking on every manual edit (JSONB array of prior versions).
  UI: 3-tab layout at /social (Review Queue, Generate, Accounts).
  API: 8 routes under /api/social/ + 1 cron + 1 webhook.
  DB: 2 new tables (social_accounts, social_posts).
  Worker: social-batch.ts job type in Railway worker.

PHASE 6 — YouTube Intelligence              ✅ COMPLETE
  Paste any YouTube URL → extract transcript → generate curriculum materials.
  3-tier transcript extraction: captions (youtube-transcript npm) → innertube API → Gemini 2.5 Flash (Railway worker).
  Vercel fast path: captions + innertube (~2.5s). If both fail, creates async job → QStash → Railway → Gemini.
  Gemini watches the actual video (multimodal, 289K tokens for 20-min video, ~77s processing).
  Hallucination guard: metadata validation via YouTube Data API before Gemini processes.
  8 curriculum tools: quizzes, lesson plans, vocabulary, discussion questions, DOK projects,
    graphic organizers, guided notes — all grade-appropriate via Claude Sonnet 4.6.
  YouTube search built in (Data API v3). Batch mode for multi-video processing.
  Supabase Realtime job watching — UI polls job status and displays transcript when ready.
  UI: 4 components (youtube-input, youtube-transcript-viewer, youtube-curriculum-tools, youtube-batch-sidebar).
  API: 4 routes under /api/youtube/ (transcript, search, batch, analyze).
  Worker: youtube-transcript.ts job type with 4-tier fallback + hallucination guard.

PHASE 7 — Brief Intelligence Upgrade         ✅ COMPLETE
  The brief AI previously got 3 bullet points about Scott. Chat AI gets founder notes,
  research items, opportunities, and knowledge summaries. Phase 7 closes that gap.

  What changed:
    1. SYSTEM_PROMPT expanded to full depth: all three tracks with details, pricing, copy
       rules, COPPA, deadlines, competitors, brand voice, tech stack. 90KB of context
       distilled into a focused prompt. Brief AI now knows NCHO is launching THIS WEEK.
    2. Context injection: /api/briefs/generate now fetches founder_notes (30), research_items
       (20), open opportunities (8), knowledge_summaries — all in parallel alongside RSS/GitHub.
       Builds founderMemoryBlock, researchBlock, opportunitiesBlock, knowledgeSummaryBlock
       and injects all into the user prompt before Claude generates.
    3. Days-remaining countdown injected into every brief:
       "Teaching contract ends: May 24, 2026 (N days remaining)"
    4. Track impact scoring pass: after brief JSON is generated, a second Claude Haiku 4.5
       call scores every item ncho/somersschool/biblesaas (0-3). Items scoring ≥2 on 2+
       tracks get a collision_note (1 sentence cross-track implication). ~$0.002/brief.
    5. Enriched sections saved to Supabase with track_impacts + collision_note per item.
    6. BriefItemCard updated: TrackBadge component shows colored ●/●●/●●● dots per track.
       Collision items show amber "⚡ Collision —" callout inline.
    7. Daily brief page: "⚡ Collisions" section pinned at top when any collision items exist.
       Shows cross-track signals with amber styling so they're impossible to miss.
    8. Brief generate response includes meta.collisionCount + meta.contextInjected stats.

  Files changed:
    - src/app/api/briefs/generate/route.ts — system prompt, context injection, scoring pass
    - src/lib/daily-brief.ts — PersistedBriefItem type + normalizeSections passthrough
    - src/components/brief-item-card.tsx — TrackBadge + collision note display
    - src/app/daily-brief/page.tsx — Collisions section + collisionItems computation

  Cost: ~$0.05/brief (Sonnet, brief gen) + ~$0.002/brief (Haiku, collision scoring)

PHASE 7.1 — daily.dev Source Integration    ✅ COMPLETE
  Added daily.dev as a third source in the brief pipeline alongside RSS and GitHub.
  Token: DAILYDEV_TOKEN already set in Vercel env.

  What changed:
    1. src/lib/sources/dailydev.ts — new source file (matches rss.ts/github.ts pattern).
       Fetches 5 feeds in parallel: /feeds/foryou, /feeds/popular, /feeds/tag/anthropic,
       /feeds/tag/security, /feeds/tag/nextjs.
       Deduplicates by post ID across all feeds. Sorts by upvotes. Caps at 30 posts.
       formatDailyDevForPrompt() includes title, source name, tags, upvote/comment counts,
       and the pre-existing summary field (pre-digested developer signal).
       Non-fatal when DAILYDEV_TOKEN absent — returns empty result silently.
    2. /api/briefs/generate — daily.dev added to parallel fetch alongside RSS + GitHub.
       New "## LIVE DATA — DAILY.DEV" section injected into userPrompt.
       totalScanned and meta response both include dailyDevResult.scannedCount.

  API base: https://api.daily.dev/public/v1
  Auth: Bearer token. Rate limit: 60 req/min (user), 300 req/min (IP).
  Working endpoints: /feeds/foryou, /feeds/popular, /feeds/discussed, /feeds/tag/{tag}
  Broken (500): /search/posts, /recommend/semantic — their backend issue, not ours.

TURBOPACK BUILD FIX — council-chamber-viewer.tsx  ✅ COMPLETE (3 attempts)
  Root cause: Turbopack re-derives TypeScript property types from the *source* type
  at point of access, ignoring cast annotations and explicit const type declarations.
  job.output typed as Record<string, unknown> leaked `unknown` into every JSX expression
  regardless of any cast applied to the whole object.

  Final fix (commit 90c2f10):
    1. parseOutput(raw: unknown): CouncilOutput | null — module-level function.
       A function call is an opaque type boundary Turbopack cannot trace through.
       Uses `as any` internally only (contained, does not leak).
       Turbopack must accept the declared return type CouncilOutput | null.
    2. All JSX guards changed from `{output.X && (` to `{!!output.X && (`
       so expressions always evaluate to boolean — never string|undefined — and
       `false | JSX.Element` is always a valid ReactNode.
    3. Job.output type changed from Record<string,unknown>|null to `unknown`
       so downstream casts in job-detail-drawer.tsx remain valid.

  Files changed:
    - src/components/council-chamber-viewer.tsx — parseOutput + !! guards
    - src/hooks/use-jobs-realtime.ts — Job.output: unknown (from Record<string,unknown>|null)
```

---

## Architecture Reference — Phase 1: Job Runner (BUILT ✅)

### Conceptual Architecture

```
Chapterhouse UI (Vercel)
    |
    | POST /api/jobs/create
    |
    ↓
/api/jobs/create (Next.js route)
    |
    | Publishes to QStash queue
    | Writes job record to Supabase (status: 'queued')
    |
    ↓
QStash (Upstash)
    |
    | Delivers HTTP POST to Railway worker
    | Retries on failure (up to 3x)
    |
    ↓
Railway Worker (separate service — see spec below)
    |
    | Pulls job payload
    | Runs the AI work (calls Anthropic API)
    | Writes progress updates to Supabase every N steps
    | Writes final output to Supabase
    |
    ↓
Supabase Realtime
    |
    | Broadcasts row changes on `jobs` table
    |
    ↓
Chapterhouse UI — /jobs page
    Subscribed to Supabase Realtime channel
    Progress bar updates live
    Output appears when done
    Resend sends email when complete
```

### Supabase Schema — New Tables

Run this migration as `supabase/migrations/20260313_008_create_jobs.sql`:

```sql
-- Jobs table: tracks all background AI jobs
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Identity
  type TEXT NOT NULL,           -- 'curriculum_factory' | 'research_batch' | 'council_session'
  label TEXT NOT NULL,          -- Human-readable name, e.g. "Grade 7 Ancient Civilizations"
  
  -- Status lifecycle: queued → running → completed | failed | cancelled
  status TEXT NOT NULL DEFAULT 'queued',
  progress INT NOT NULL DEFAULT 0,      -- 0-100
  progress_message TEXT,                -- e.g. "Pass 3/6: Polgara finalizing..."
  
  -- Payload and output
  input_payload JSONB NOT NULL,         -- Full job parameters
  output JSONB,                         -- Final result (or null if not done)
  error TEXT,                           -- Error message if failed
  
  -- Metadata
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  worker_id TEXT,                       -- Which Railway instance processed this
  
  -- Optional parent (for batch jobs)
  parent_job_id UUID REFERENCES jobs(id) ON DELETE CASCADE
);

-- Index for status queries
CREATE INDEX jobs_status_idx ON jobs(status);
CREATE INDEX jobs_type_idx ON jobs(type);
CREATE INDEX jobs_parent_idx ON jobs(parent_job_id);

-- Enable Realtime on this table (Scott watches live progress)
ALTER PUBLICATION supabase_realtime ADD TABLE jobs;

-- RLS: only authenticated users can see jobs (Scott + Anna only)
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated users only" ON jobs
  FOR ALL USING (auth.role() = 'authenticated');
```

### Environment Variables to Add

Add to `.env.local` (and to Vercel + Railway env):

```bash
# Upstash QStash — job queue
QSTASH_TOKEN=your_qstash_token
QSTASH_CURRENT_SIGNING_KEY=your_signing_key
QSTASH_NEXT_SIGNING_KEY=your_next_signing_key

# Upstash Redis — rate limiting, job deduplication
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token

# Railway worker URL — where QStash delivers jobs
RAILWAY_WORKER_URL=https://your-worker.railway.app

# Resend — completion notifications
RESEND_API_KEY=your_resend_key
ALERT_EMAIL_TO=scott@nextchapterhomeschool.com
```

### Install Required Packages

```bash
npm install @upstash/qstash @upstash/redis
```

### New API Routes to Build

#### `POST /api/jobs/create`

File: `src/app/api/jobs/create/route.ts`

Responsibilities:
1. Validate incoming job payload with Zod
2. Insert job record into Supabase (status: 'queued')
3. Publish job to QStash pointing at Railway worker URL
4. Return `{ jobId, status: 'queued' }`

```typescript
import { Client } from '@upstash/qstash'
import { createClient } from '@/lib/supabase-server'
import { z } from 'zod'

const jobSchema = z.object({
  type: z.enum(['curriculum_factory', 'research_batch', 'council_session']),
  label: z.string().min(1).max(200),
  payload: z.record(z.unknown()),
})

export async function POST(req: Request) {
  const body = await req.json()
  const parsed = jobSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: parsed.error }, { status: 400 })

  const supabase = await createClient()
  const { data: job, error } = await supabase
    .from('jobs')
    .insert({
      type: parsed.data.type,
      label: parsed.data.label,
      input_payload: parsed.data.payload,
      status: 'queued',
    })
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })

  const qstash = new Client({ token: process.env.QSTASH_TOKEN! })
  await qstash.publishJSON({
    url: `${process.env.RAILWAY_WORKER_URL}/process-job`,
    body: { jobId: job.id, type: job.type, payload: job.input_payload },
    retries: 3,
  })

  return Response.json({ jobId: job.id, status: 'queued' })
}
```

#### `GET /api/jobs/route.ts` — list all jobs

#### `GET /api/jobs/[id]/route.ts` — get single job with full output

#### `POST /api/jobs/[id]/cancel/route.ts` — mark job cancelled

### New UI Route: `/jobs`

File: `src/app/jobs/page.tsx`

This is the **Jobs Dashboard**. Key requirements:

1. **Job list** — shows all jobs sorted by `created_at DESC`. Each row shows: label, type badge, status badge (color-coded), progress bar (0-100), timestamps.

2. **Real-time updates** — subscribe to Supabase Realtime on the `jobs` table. When any row updates, the UI updates instantly without a page refresh.

3. **Job detail drawer** — click any job → side drawer opens showing:
   - Full progress history
   - `progress_message` (current step)
   - Output rendered as Markdown when complete
   - Error details if failed
   - "Download output" button (copies markdown to clipboard or triggers file download)

4. **New job button** — opens a modal to create a new job. For now only `curriculum_factory` type.

**Realtime subscription pattern:**

```typescript
'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'

export function useJobsRealtime() {
  const [jobs, setJobs] = useState<Job[]>([])
  const supabase = createClient()

  useEffect(() => {
    // Initial fetch
    supabase.from('jobs').select('*').order('created_at', { ascending: false })
      .then(({ data }) => setJobs(data ?? []))

    // Realtime subscription
    const channel = supabase
      .channel('jobs-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'jobs' },
        (payload) => {
          setJobs(prev => {
            if (payload.eventType === 'INSERT') return [payload.new as Job, ...prev]
            if (payload.eventType === 'UPDATE') 
              return prev.map(j => j.id === payload.new.id ? payload.new as Job : j)
            return prev
          })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [])

  return jobs
}
```

### Railway Worker Service

This is a **separate Node.js service** deployed on Railway. It is NOT part of this Next.js app. Create it as a separate repo or a `worker/` directory at the Chapterhouse repo root.

File structure:
```
worker/
  index.ts          — Express server, listens for QStash POSTs
  jobs/
    curriculum-factory.ts   — The actual curriculum generation logic
    research-batch.ts       — Future
  lib/
    supabase.ts             — Supabase client (service role key)
    progress.ts             — Helper: update job progress in Supabase
  package.json
```

**`worker/index.ts`** — Express server:

```typescript
import express from 'express'
import { verifySignatureAppRouter } from '@upstash/qstash/nextjs'
import { processJob } from './jobs/router'

const app = express()
app.use(express.json())

// QStash signature verification — REQUIRED for security
app.post('/process-job', async (req, res) => {
  // Verify QStash signature
  const signature = req.headers['upstash-signature'] as string
  // Use @upstash/qstash receiver to verify
  
  const { jobId, type, payload } = req.body
  res.status(200).json({ received: true }) // Acknowledge immediately
  
  // Process async (don't await — QStash already got its 200)
  processJob(jobId, type, payload).catch(console.error)
})

app.listen(process.env.PORT ?? 3001)
```

**`worker/lib/progress.ts`** — Progress updater:

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role — bypasses RLS
)

export async function updateProgress(
  jobId: string, 
  progress: number, 
  message: string,
  status: 'running' | 'completed' | 'failed' = 'running',
  output?: unknown,
  error?: string
) {
  await supabase.from('jobs').update({
    progress,
    progress_message: message,
    status,
    output: output ?? undefined,
    error: error ?? undefined,
    started_at: progress === 1 ? new Date().toISOString() : undefined,
    completed_at: status === 'completed' ? new Date().toISOString() : undefined,
    updated_at: new Date().toISOString(),
  }).eq('id', jobId)
}
```

---

## Architecture Reference — Phase 2: Curriculum Factory (BUILT ✅)

This is a specific job type (`curriculum_factory`) that generates curriculum scope & sequences using a **6-pass Council of the Unserious critique loop**. It produces BOTH `finalScopeAndSequence` (Polgara's markdown) AND `structuredOutput` (validated SomersSchool pipeline JSON ready to drop into `scope-sequence/`).

### National Standards Auto-Alignment

Standards are auto-detected from the subject field — no manual input needed:

| Subject | National Framework |
|---|---|
| ELA, English, Reading, Writing, Language Arts | CCSS-ELA |
| Math, Algebra, Geometry | CCSS-Math |
| Science, Biology, Chemistry, Physics, Earth Science | NGSS |
| Social Studies, History, Geography, Civics, Economics | C3 Framework |

The framework name is injected into the context string and Data's audit pass checks coverage against it. Future: state-by-state overlay via dropdown.

### The Council Members (System Prompts)

Each pass uses a different AI model with a character-specific system prompt. These are the Council of the Unserious:

| Pass | Member | Role | Model |
|---|---|---|---|
| 1 | Gandalf the Grey | Creator / Architect (Scott's mirror) | Claude Sonnet 4.6 |
| 2 | Lt. Commander Data | Auditor / Analyst (standards + structure) | Claude Sonnet 4.6 |
| 3 | Polgara the Sorceress | Content Director / Editor (Anna's mirror) | Claude Sonnet 4.6 |
| 4 | Earl Harbinger | Operations Commander (business reality) | GPT-5.4 |
| 5 | Beavis & Butthead | Engagement Stress Test (the kid in the chair) | GPT-5-mini |
| 6 | Extract (structured) | SomersSchool Pipeline JSON — convert Polgara's markdown to validated handoff JSON | Claude Sonnet 4.6 |

Prompts defined in `worker/src/lib/council-prompts.ts` (TS) and `council-worker/agents/*.py` (Python CrewAI).

Output keys:
- `finalScopeAndSequence` — Polgara's production-ready markdown document
- `structuredOutput` — SomersSchool pipeline JSON (id, grade, grade_band, units[], lessons[], meta). Post-extraction fixup guarantees canonical `subject` label, `schema_version: "1.0"`, real `generated_at`/`generated_by`, explicit `is_review_lesson` on every lesson, correct pacing math, sequential lesson numbers, computed `total_units`/`total_lessons`. Null if extraction fails.
- `operationalAssessment` — Earl's build/ship/revenue analysis
- `engagementReport` — Beavis & Butthead's COOL/SUCKS verdict
- `draftsRetained.gandalfInitialDraft` — Gandalf's original draft
- `draftsRetained.dataCritique` — Data's numbered audit findings

### Job Input Payload Schema

```typescript
const curriculumJobSchema = z.object({
  subject: z.string(),        // e.g. "US History"
  gradeLevel: z.number(),     // 5-12
  duration: z.string(),       // e.g. "full year", "semester", "9 weeks"
  standards: z.string().optional(), // e.g. "Alaska Grade Level Expectations"
  additionalContext: z.string().optional(),
})

// For batch jobs (70 at once):
const curriculumBatchSchema = z.object({
  subjects: z.array(z.string()),  // 10 subjects
  gradeLevels: z.array(z.number()), // grades 5-12
  duration: z.string(),
})
// Batch creates one PARENT job + N child jobs (one per subject/grade combo)
```

### The 6-Pass Worker Logic

File: `worker/src/jobs/curriculum-factory.ts`

The worker auto-detects the national standards framework from the subject field, injects it into the context, then runs 6 sequential passes:

1. **Gandalf drafts** (5%) — creates complete scope & sequence aligned to the detected national framework; structural requirements injected (pacing, style/energy enums, is_review_lesson)
2. **Data audits** (18%) — checks against the specific framework (e.g., "Audit against CCSS-ELA for Grade 7"), finds missing standards, pacing errors, monotone energy/style patterns
3. **Polgara finalizes** (35%) — synthesizes Gandalf + Data, produces production-ready markdown, child-first lens, preserves structural elements
4. **Earl assesses** (52%) — operational viability: build order, revenue timeline, minimum viable version, go/no-go
5. **Beavis & Butthead stress-test** (75%) — COOL/SUCKS/MEH per unit, energy-flow check, engagement reality
6. **Extract JSON** (88%) — `extractStructuredOutput()` converts Polgara's markdown to validated SomersSchool pipeline JSON. Post-extraction fixup (all values authoritative — AI output overridden): `subject` set to canonical label (`"Language Arts"`, `"Science"`, etc.), `schema_version` set to `"1.0"`, `generated_at` set to real JS timestamp, `generated_by` set to `"chapterhouse-curriculum-factory"`, `is_review_lesson` explicitly `true`/`false` on every lesson (never omitted), pacing math corrected (`N+1` enforced), lessons renumbered sequentially, `total_units`/`total_lessons` recomputed programmatically.

Progress breakpoints: 5% → 18% → 35% → 52% → 75% → 88% → 100%.
Resend email notification on completion.

Final output shape:
```typescript
{
  subject, gradeLevel, duration, standards,
  finalScopeAndSequence: string,             // Polgara's markdown — human-readable
  structuredOutput: Record<string, unknown> | null,  // SomersSchool pipeline JSON — drop into scope-sequence/
  operationalAssessment: string,             // Earl's report
  engagementReport: string,                  // Beavis & Butthead's verdict
  draftsRetained: {
    gandalfInitialDraft: string,
    dataCritique: string,
  },
  generatedAt: string,
}
```

### Batch Job Handling (70 curricula at once)

When `type === 'curriculum_factory'` and the payload has `subjects` array + `gradeLevels` array:

1. Create one parent job (`label: "Batch: 10 subjects × grades 5-12"`)
2. For each subject × grade combo, publish a separate QStash message
3. Each child job is inserted into `jobs` table with `parent_job_id` set
4. Parent job progress = count(completed children) / count(all children) × 100
5. When all children complete, send Resend email with download link

**Rate limiting:** QStash supports `delay` parameter. Stagger child jobs by 2 seconds each to avoid Anthropic rate limits: `delay: index * 2` (seconds).

### Curriculum Factory UI

Route: `/curriculum-factory`

Components needed:
1. **`CurriculumFactoryForm`** — selects subjects (multi-select checkboxes), grade range (5-12 slider), duration, optional standards. "Single generation" or "Full batch" toggle.
2. **`BatchProgressOverview`** — when a batch is running, shows N/70 complete with a progress ring. Click → expands to show individual child job status.
3. **`CurriculumOutputViewer`** (`council-chamber-viewer.tsx` / `job-detail-drawer.tsx`) — output order: Final Scope & Sequence → **Pipeline Handoff JSON** (emerald card, copy/download .json/preview toggle, "drop into scope-sequence/") → Earl's assessment (open by default) → B&B report → Working Papers accordion (Gandalf draft + Data critique) → Download Full Session Transcript (includes JSON fenced block). Export toolbar: HTML/PDF/DOCX download.

---

## Architecture Reference — Phase 3: n8n Control Panel (BUILT ✅)

### What n8n Is

n8n is a separate service running on Railway. It has its own REST API (`/api/v1/`). Chapterhouse embeds a control panel that talks to this API.

### n8n Endpoints to Use

```
GET  /api/v1/workflows              — List all workflows
POST /api/v1/workflows/:id/activate — Activate a workflow
POST /api/v1/workflows/:id/deactivate
GET  /api/v1/executions             — Recent execution history
POST /api/v1/workflows/:id/run     — Trigger a workflow manually
```

Authentication: `X-N8N-API-KEY` header.

Add to `.env.local`:
```bash
N8N_BASE_URL=https://your-n8n.railway.app
N8N_API_KEY=your-n8n-api-key
```

### New API Routes

`/api/n8n/workflows/route.ts` — proxies to n8n, returns workflow list  
`/api/n8n/workflows/[id]/trigger/route.ts` — triggers a specific workflow  
`/api/n8n/executions/route.ts` — returns recent run history  

These are thin proxies. They add auth (check Supabase session) and strip the n8n API key from the client.

### n8n UI Route: `/pipelines`

Simple table view:
- Each row: workflow name, active/inactive toggle, last run timestamp, last run status (success/failed/running), "Run now" button
- Click "Run now" → POST to `/api/n8n/workflows/[id]/trigger` → shows a toast "Workflow triggered"
- Auto-refreshes every 30 seconds

---

## Architecture Reference — Phase 5: Social Media Automation (BUILT ✅)

### What It Replaces

**Sintra** ($49/mo) — 250-credit cap, single-brand mode, broken image repetition, no review gate, no brand voice control. Chapterhouse replaces all of that with Claude-powered generation across three brands, human review before any post publishes, and Buffer GraphQL API for scheduling.

### In Plain English

Here's what this system actually does:

1. **Generate:** Claude Sonnet 4.6 writes social media posts for your brands. You pick which brands (NCHO, SomersSchool, Alana Terry), which platforms (Facebook, Instagram, LinkedIn), and how many. Claude follows specific brand voice rules for each — NCHO sounds like a warm teacher, SomersSchool is confident and secular, Alana Terry is personal and faith-forward.

2. **Review:** Every AI-generated post lands in a review queue. Nothing auto-publishes. Scott or Anna reads each post, edits the text right inside the card if they want, picks a date/time, picks which Buffer channel to send it to, and approves. Or rejects with one click. Every edit is tracked — you can see what the AI originally wrote vs. what you changed.

3. **Schedule:** When you approve, the post gets pushed to Buffer's scheduling queue via their GraphQL API. Buffer handles the actual publishing to Facebook/Instagram/LinkedIn at the scheduled time.

4. **Analytics:** After posts are published, Chapterhouse pulls engagement stats back from Buffer (reach, clicks, likes, comments, shares) and stores them per-post. Over time, this builds a data set for the autoresearch loop — "which brand/platform/topic seed gets the most engagement? Do more of that."

5. **Auto-triggers:** Two triggers generate posts without Scott lifting a finger:
   - **Weekly cron** (Monday 5:00 AM UTC) — creates a batch of 18 posts (3 brands × 3 platforms × 2 each)
   - **Shopify webhook** — when Anna adds a new product to the NCHO store, Shopify fires a webhook, and Chapterhouse auto-generates launch posts for Facebook + Instagram

### Conceptual Architecture

```
                        ┌─────────────────────────────┐
                        │       TRIGGER LAYER          │
                        │                              │
                        │  Weekly Cron (Mon 05:00 UTC) │
                        │  Shopify Product Webhook     │
                        │  Manual "Generate" button    │
                        └────────────┬────────────────┘
                                     │
                    ┌────────────────▼────────────────┐
                    │        JOB SYSTEM (QStash)       │
                    │                                  │
                    │  POST /api/cron/social-weekly     │
                    │  POST /api/webhooks/shopify-prod  │
                    │  → Insert job (type: social_batch)│
                    │  → QStash → Railway worker        │
                    └────────────┬────────────────────┘
                                 │
                    ┌────────────▼────────────────────┐
                    │     RAILWAY WORKER               │
                    │     social-batch.ts               │
                    │                                  │
                    │  Calls /api/social/generate      │
                    │  (with job_id for tracking)       │
                    │  Updates progress in Supabase     │
                    └────────────┬────────────────────┘
                                 │
                    ┌────────────▼────────────────────┐
                    │     GENERATION ENGINE             │
                    │     /api/social/generate          │
                    │                                  │
                    │  Claude Sonnet 4.6                │
                    │  Brand voice system prompt        │
                    │  → Inserts rows to social_posts   │
                    │    (status: pending_review)        │
                    └────────────┬────────────────────┘
                                 │
                    ┌────────────▼────────────────────┐
                    │     SUPABASE REALTIME             │
                    │                                  │
                    │  social_posts table has Realtime  │
                    │  → Review Queue UI updates live   │
                    └────────────┬────────────────────┘
                                 │
                    ┌────────────▼────────────────────┐
                    │     HUMAN REVIEW GATE             │
                    │     /social → Review Queue tab    │
                    │                                  │
                    │  Edit post text (inline)          │
                    │  Pick schedule date/time          │
                    │  Pick Buffer channel              │
                    │  → Approve or Reject              │
                    └────────────┬────────────────────┘
                                 │ (on approve)
                    ┌────────────▼────────────────────┐
                    │     BUFFER GRAPHQL API            │
                    │     POST https://api.buffer.com   │
                    │                                  │
                    │  createPost mutation               │
                    │  { text, channelId, dueAt,         │
                    │    schedulingType: automatic,       │
                    │    mode: customScheduled }          │
                    │  → Returns post ID                 │
                    │  → Stored as buffer_update_id      │
                    └────────────┬────────────────────┘
                                 │ (post publishes)
                    ┌────────────▼────────────────────┐
                    │     ANALYTICS PULL-BACK           │
                    │     /api/social/analytics         │
                    │                                  │
                    │  Queries Buffer for published      │
                    │  post stats (reach, clicks, etc)   │
                    │  → Stores in buffer_stats JSONB    │
                    └──────────────────────────────────┘
```

### Database Schema

#### `social_accounts` (Migration 010)
Maps Buffer channels to brand+platform combinations. Populated via the Accounts tab after syncing from Buffer.

| Column | Type | Purpose |
|---|---|---|
| `id` | UUID PK | Row identifier |
| `brand` | TEXT CHECK | `ncho`, `somersschool`, `alana_terry`, `scott_personal` |
| `platform` | TEXT CHECK | `facebook`, `instagram`, `linkedin`, `threads`, `tiktok`, `youtube`, `pinterest` |
| `buffer_profile_id` | TEXT NOT NULL | Channel ID from Buffer GraphQL API |
| `display_name` | TEXT NOT NULL | Human-readable name, e.g. "NCHO Facebook Page" |
| `is_active` | BOOLEAN | Whether to show in dropdowns |
| **UNIQUE** | `(brand, platform)` | One Buffer channel per brand+platform combo |

#### `social_posts` (Migration 011)
Every AI-generated post, with full lifecycle tracking from generation through publication and analytics.

| Column | Type | Purpose |
|---|---|---|
| `id` | UUID PK | Row identifier |
| `job_id` | UUID FK → jobs | Which batch generation job created this |
| `brand` | TEXT CHECK | Same 4 values as social_accounts |
| `platform` | TEXT CHECK | Same 7 values as social_accounts |
| `post_text` | TEXT NOT NULL | The actual post content (editable by reviewer) |
| `image_brief` | TEXT | Description of what the image should show |
| `hashtags` | TEXT[] | Array of hashtags (shown separately in UI) |
| `generation_prompt` | TEXT | Full prompt sent to Claude (for autoresearch loop analysis) |
| `edit_history` | JSONB[] | Array of `{saved_at, post_text, hashtags}` — every manual edit |
| `status` | TEXT CHECK | `pending_review` → `approved` \| `rejected` → `scheduled` → `published` \| `failed` |
| `scheduled_for` | TIMESTAMPTZ | When to publish (set on approval) |
| `buffer_profile_id` | TEXT | Which Buffer channel (set on approval) |
| `buffer_update_id` | TEXT | Post ID returned by Buffer after scheduling |
| `published_at` | TIMESTAMPTZ | When Buffer confirmed publication |
| `buffer_stats` | JSONB | `{reach, clicks, likes, comments, shares}` pulled from Buffer |

Realtime enabled. RLS: authenticated users only. 4 indexes: status, brand, job_id, scheduled_for.

### API Routes — Complete Reference

| Route | Method | What It Does |
|---|---|---|
| `/api/social/accounts` | GET | List active accounts (sorted brand → platform) |
| `/api/social/accounts` | POST | Upsert account (Zod-validated, conflict on brand+platform) |
| `/api/social/accounts/sync` | POST | Two-step Buffer GraphQL: GetOrganizations → GetChannels. Returns simplified channel list. |
| `/api/social/posts` | GET | List posts with optional `?status=` and `?brand=` filters |
| `/api/social/posts/[id]` | PATCH | Edit post text, hashtags, image_brief, scheduled_for. Pushes previous version to `edit_history`. |
| `/api/social/posts/[id]` | DELETE | Soft reject — sets status to `rejected` (no row delete) |
| `/api/social/posts/[id]/approve` | POST | Approve + schedule. Builds full text with hashtags → `createPost` mutation to Buffer GraphQL → stores `buffer_update_id` → status = `scheduled`. |
| `/api/social/generate` | POST | Claude Sonnet 4.6 generation. Takes `{brands[], platforms[], count_per_combo, topic_seed?, job_id?}`. Brand voice system prompt enforces voice per brand. Returns inserted rows. |
| `/api/social/analytics` | POST | Iterates published posts, queries Buffer GraphQL for stats, updates `buffer_stats` JSONB. |
| `/api/cron/social-weekly` | GET | Monday 05:00 UTC Vercel cron. Creates `social_batch` job → QStash → Railway. Generates 2 posts per brand×platform combo (18 total). |
| `/api/webhooks/shopify-product` | POST | HMAC-verified Shopify webhook. On new product → creates `social_batch` job for NCHO, Facebook+Instagram, 3 posts each. |

### Worker

`worker/src/jobs/social-batch.ts` — Receives job from QStash, calls `/api/social/generate` on Chapterhouse with the job payload, updates progress (10% → 100%). Simple delegator — all AI work happens in the Vercel route.

### UI Components

| Component | File | Purpose |
|---|---|---|
| `SocialReviewQueue` | `src/components/social-review-queue.tsx` | Posts grouped by brand w/ color badges. Inline text editing. Datetime picker + Buffer channel selector per post. Approve/Reject buttons. Supabase Realtime subscription for live updates. |
| `SocialGeneratePanel` | `src/components/social-generate-panel.tsx` | Brand toggles (NCHO, SomersSchool, Alana Terry). Platform toggles (Facebook, Instagram, Pinterest). Count slider. Topic seed input. Fires to `/api/social/generate`. |
| `SocialAccountsPanel` | `src/components/social-accounts-panel.tsx` | "Sync from Buffer" button. Shows synced channels. Manual "Add Account" form for brand+platform→channel mapping. Active accounts table. |

### Buffer Integration — Technical Details

**API:** Buffer GraphQL API at `https://api.buffer.com`
**Auth:** Bearer token via `BUFFER_ACCESS_TOKEN` env var
**Account:** `accidentalakteacher` (Essentials plan, 6 channel slots — NCHO FB/IG/Pinterest + SomersSchool FB/IG/Pinterest)
**Buffer Organization ID:** `695b16d7995b518a94ef5f6a`

Three GraphQL operations used:

1. **GetOrganizations** — `query { account { organizations { id name ownerEmail } } }` — gets org ID for channel queries
2. **GetChannels** — `query($organizationId: OrganizationId!) { channels(input: { organizationId }) { id name displayName service avatar isQueuePaused } }` — lists all connected channels
3. **CreatePost** — `mutation($input: CreatePostInput!) { createPost(input: $input) { ... on PostActionSuccess { post { id text } } ... on MutationError { message } } }` — schedules a post. Input: `{text, channelId, schedulingType: "automatic", mode: "customScheduled", dueAt: ISO8601}`. Platform metadata required: Facebook needs `metadata.facebook.type: "post"`, Instagram needs `metadata.instagram.type: "image"` + `shouldShareToFeed: true`.
4. **DeletePost** — `mutation { deletePost(input: { id: "<postId>" }) { ... on DeletePostSuccess { id } ... on MutationError { message } } }` — permanently deletes a post. Input field is `id` (NOT `postId`). `DeletePostSuccess` returns `id` only. ✅ Confirmed working.

The old Buffer REST API (`api.bufferapp.com/1/`) is **dead and deprecated**. All routes use the GraphQL endpoint exclusively.

### Brand Voice Rules (Enforced in System Prompt)

| Brand | Voice | Rules |
|---|---|---|
| NCHO | Warm, teacher-curated, convicted | "Your child" not "your student." Lead with child, convert with practical. No: explore, journey, leverage, synergy. |
| SomersSchool | Confident, secular, progress-visible | Zero faith language. Lead with visible progress. Alaska Statute 14.03.320. |
| Alana Terry | Personal, vulnerable, story-forward | Written as Anna (woman's voice). Faith assumed, never preachy. Community, not audience. |

---

## Architecture Reference — Phase 6: YouTube Intelligence (BUILT ✅)

### What It Does

Paste any YouTube URL → extract a verbatim transcript → generate 8 types of curriculum materials from it. YouTube search built in so you never have to leave Chapterhouse.

### Transcript Extraction Pipeline

**Vercel Fast Path** (runs first, ~2.5s total):
1. **Captions** — `youtube-transcript` npm library fetches YouTube's own captions. Works locally but **YouTube blocks cloud IPs** (Vercel, Railway). Falls through instantly in production.
2. **Innertube** — Direct call to YouTube's internal `get_transcript` API. Same cloud IP blocking applies. Falls through in production.
3. If both fail → creates a Supabase `jobs` row (type: `youtube_transcript`) + publishes to QStash → returns `{pending: true, jobId}` immediately.

**Railway Worker** (async, ~77s for a 20-min video):
1. **yt-dlp subtitles** — Attempts to download subtitle files. YouTube bot-checks block this from Railway too.
2. **Gemini 2.5 Flash** — Watches the actual video via multimodal input (289K tokens for 20-min video). Outputs verbatim transcript with timestamps. **This is the tier that actually works in production.** Timeout: 180s.
3. **Audio download + Azure Speech / OpenAI Whisper** — Fallback if Gemini fails. Downloads WAV via yt-dlp + ffmpeg → transcribes. Currently blocked by yt-dlp bot-check.
4. **Gemini educational analysis** — Last resort: generates educational summary (not verbatim) with structural breakdown. Flagged as `gemini-analysis` source so UI shows warning.

**Hallucination Guard:** Before Gemini processes any video, the worker validates the video ID via YouTube Data API v3. If `metadata` is null (video doesn't exist or is private), the worker fails immediately with a clear error instead of letting Gemini hallucinate a fake transcript.

### Production Reality

| Tier | Where | Works? | Why/Why Not |
|------|-------|--------|-------------|
| Captions (npm) | Vercel | ❌ | YouTube blocks cloud IPs |
| Innertube API | Vercel | ❌ | Same IP blocking |
| yt-dlp subtitles | Railway | ❌ | YouTube bot-check |
| **Gemini 2.5 Flash** | **Railway** | **✅** | **Watches video natively, ~77s, 21K+ chars** |
| Audio + Azure/Whisper | Railway | ❌ | yt-dlp can't download audio |
| Gemini analysis | Railway | ✅ | Fallback — summary not verbatim |

**In practice, 100% of production transcripts come through Gemini 2.5 Flash on Railway.**

### Curriculum Generation Tools

Route: `POST /api/youtube/analyze` — Claude Sonnet 4.6 generates grade-appropriate materials:

| Tool | What It Produces |
|------|-----------------|
| Quiz | Multiple choice + short answer questions |
| Lesson Plan | Full lesson plan with objectives, activities, assessment |
| Vocabulary | Key terms with definitions and context |
| Discussion Questions | Open-ended questions for group or family discussion |
| DOK Projects | Depth of Knowledge projects at multiple levels |
| Graphic Organizers | Visual organization templates for the content |
| Guided Notes | Fill-in-the-blank style study guides |

### UI Components

| Component | File | Purpose |
|-----------|------|---------|
| `YoutubeInput` | `src/components/youtube-input.tsx` | URL paste + YouTube search + Realtime job watching |
| `YoutubeTranscriptViewer` | `src/components/youtube-transcript-viewer.tsx` | Transcript display with source badges (gemini=green, gemini-analysis=warning) |
| `YoutubeCurriculumTools` | `src/components/youtube-curriculum-tools.tsx` | 8 curriculum generation tools |
| `YoutubeBatchSidebar` | `src/components/youtube-batch-sidebar.tsx` | Batch mode for multi-video processing |

### Key Env Vars (YouTube-specific)

```bash
YOUTUBE_API_KEY=...    # YouTube Data API v3 — search + metadata validation
GEMINI_API_KEY=...     # Gemini 2.5 Flash — multimodal transcript extraction
AZURE_SPEECH_KEY=...   # Azure Speech STT (Tier 3 fallback, not currently used)
AZURE_SPEECH_REGION=... # Azure region (westus)
```

---

## Navigation (BUILT ✅)

Navigation uses a grouped accordion system defined in `src/lib/navigation.ts`:

```typescript
// 5 groups: Command Center, Intelligence, Production, AI & Automation, System
// Each item has: label, href, description, icon, tooltip, status ("live" | "partial" | "planned")
// Sidebar renders with collapsible groups, hover tooltips, status badges
export const navigationGroups: NavigationGroup[] = [...]
// Backward-compatible flat export:
export const navigationItems: NavigationItem[] = navigationGroups.flatMap((g) => g.items);
```

Sidebar component in `src/components/chapterhouse-shell.tsx` renders accordion groups with:
- ChevronDown toggle per group
- Auto-open group containing active route
- Hover tooltip cards (264px wide, positioned to the right)
- Status badges: "beta" (amber) for partial, "soon" (blue) for planned
- Dynamic right rail showing all items with colored status dots

---

## Build History (ALL COMPLETE ✅)

All build steps completed across March 13-16 sessions. Deployed on Vercel.

**Phases 1-4 + Bonus (Sessions 6-7, March 13-14):**

1. Database — `20260313_008_create_jobs.sql` migration applied, Realtime enabled
2. Dependencies — `@upstash/qstash`, `@upstash/redis` installed
3. Job API routes — `/api/jobs/` (list, create, [id], [id]/cancel, [id]/run)
4. Jobs dashboard — `/jobs` with Supabase Realtime subscription
5. Railway worker — `worker/` directory, Express + QStash signature verification
6. Curriculum factory worker — 6-pass Council of the Unserious logic with national standards auto-alignment
7. Curriculum factory UI — `/curriculum-factory` form + output viewer
8. Batch job system — parent/child tracking, Resend email on completion
9. n8n control panel — `/pipelines` + proxy routes
10. Navigation + polish — accordion sidebar, tooltips, status badges, dynamic right rail

**Phase 5: Social Media Automation (Session 8, March 15):**

11. Database — 3 migrations (`010_social_accounts`, `011_social_posts`, `012_social_batch_job_type`) applied
12. Social API routes — 8 routes: accounts (GET/POST), accounts/sync, posts (GET), posts/[id] (PATCH/DELETE), posts/[id]/approve, generate, analytics
13. Social UI — 3-tab layout at `/social`: SocialReviewQueue, SocialGeneratePanel, SocialAccountsPanel
14. Weekly cron — `/api/cron/social-weekly` (Monday 05:00 UTC), Vercel cron configured
15. Shopify webhook — `/api/webhooks/shopify-product` with HMAC signature verification
16. Railway worker — `social-batch.ts` job type added to worker dispatcher
17. Buffer GraphQL migration — all 3 Buffer-calling routes rewritten from dead REST API to GraphQL. Commits: `66c20fa` (initial build, 1,370 lines) + `93c2ffd` (GraphQL migration, 252 lines)

**Phase 6: YouTube Intelligence (Sessions 9-11, March 15-16):**

18. YouTube transcript API — `/api/youtube/transcript` with 2-tier Vercel fast path (captions + innertube) and Railway worker handoff
19. YouTube search API — `/api/youtube/search` proxying YouTube Data API v3
20. YouTube batch API — `/api/youtube/batch` for multi-video transcript processing
21. YouTube analyze API — `/api/youtube/analyze` generating 8 curriculum material types via Claude Sonnet 4.6
22. YouTube UI — 4 components: `youtube-input.tsx`, `youtube-transcript-viewer.tsx`, `youtube-curriculum-tools.tsx`, `youtube-batch-sidebar.tsx`
23. Railway worker — `youtube-transcript.ts` job type with 4-tier fallback: yt-dlp → Gemini 2.5 Flash → audio+STT → Gemini analysis
24. Gemini 2.5 Flash integration — Multimodal video processing on Railway (watches actual video, ~77s for 20-min video, 21K+ chars)
25. Hallucination guard — YouTube Data API metadata validation before Gemini processes; fails immediately on invalid video IDs
26. Architecture refinement — Gemini removed from Vercel fast path (timeout issues, 77-90s consistently exceeds limits), Railway-only for Gemini processing
27. Production validated — End-to-end test: Vercel returns `pending: true` in ~80ms → Railway processes via Gemini → 21,903 chars, 59 segments of real transcript content
28. Key commits: `afe185e` (Gemini fast path), `b7b6227` (timeout tuning), `21ed339` (Gemini to Railway only), `7117667` (hallucination guard)

**Session 12: Curriculum Factory → SomersSchool Pipeline (March 16, 2026):**

29. `structuredOutput` wired to UI — `CouncilOutput` interface in `council-chamber-viewer.tsx` updated with `structuredOutput?: unknown`. Worker already had Pass 6 (`extractStructuredOutput()`) and all validation/fixup logic wired in; UI was the only gap. `job-detail-drawer.tsx` already had the JSON panel (confirmed existing, no changes).
30. `council-chamber-viewer.tsx` — full UX overhaul: replaced bare `%` progress bar with 6-step visual `PassStepper` (animated dots, connector line, active pass pulses, completed passes show ✓). Accumulating session log (each `progress_message` appended via `useEffect`, not overwritten). Correct output order: Scope & Sequence → Pipeline Handoff JSON → Earl (open) → B&B → Working Papers (Gandalf draft + Data critique, closed) → Download. Removed duplicate Earl card. JSON block included in full session transcript `.md`.
31. `council/page.tsx` "How It Works" — added Pass 6 (Extract, emerald) to the 6-step pipeline description, updated total runtime to ~11 min.
32. Probe test framework (`chapterhouse-evolution-handoff.md`) — 11 diagnostic questions across 4 tiers (Business Context, Synthesis, Output Quality, Self-Awareness) to validate context injection depth.

**Session 14: Contract-Clean JSON + Audit Fixes (March 17, 2026):**

33. `CANONICAL_SUBJECT_LABELS` map + `getCanonicalSubjectLabel()` — maps subject code → spec-canonical display name (`ela → "Language Arts"`, `sci → "Science"`, `mth → "Mathematics"`, `hst → "Social Studies"`). Hard-overrides `structuredJson.subject` post-extraction regardless of AI output.
34. `ExtractionMeta` interface adds `canonicalSubject` field. Extraction prompt uses `${meta.canonicalSubject}` for `"subject"` and `"title"` — both fields canonical on first AI output.
35. Non-final lesson template in extraction prompt shows `"is_review_lesson": false` explicitly. STRUCTURAL RULES mandate explicit `false` on all non-final lessons. Fixup forEach iterates every lesson unconditionally: `lesson.is_review_lesson = i === unit.lessons.length - 1`.
36. `generated_at` in extraction prompt evaluates at call time (`${new Date().toISOString()}`). Post-extraction fixup hard-sets `meta.generated_at = new Date().toISOString()`.
37. Audit fix: `schema_version = "1.0"` and `generated_by = "chapterhouse-curriculum-factory"` added to post-extraction fixup — guaranteed on every output, not just when AI follows the template.
38. Earl (Pass 4) → GPT-5.4 via new `callWithOpenAI()` function. Beavis (Pass 5) → `gpt-5-mini`. Passes 1–3 and 6 remain Claude Sonnet 4.6. `openai` dep added to `worker/package.json`. `OPENAI_API_KEY` required in Railway worker env.
39. `scope-sequence/ela-g1.json` — sample validated Grade 1 Language Arts handoff: 4 units, 22 lessons, variable unit sizes (4+1 / 5+1 / 3+1 / 6+1), CCSS-ELA standards, explicit `is_review_lesson` on every lesson.
40. `CCSS-M` → `CCSS-Math` throughout all documentation (canonical per `scope-sequence-handoff.md` line 223).
41. Railway TS build fix: `unit.lessons.length` → `lessonCount` (a `const` assigned before the `forEach` closure). TypeScript loses `Array.isArray` optional-narrowing when re-evaluating object properties inside callback closures (TS18048). An immutable `const` is always accepted without re-checking. Applied to `is_review_lesson` fixup `forEach` in `worker/src/jobs/curriculum-factory.ts`.
42. Commits: `b35246e` (initial handoff + ela-g1 sample), `119279a` (audit fixes + OpenAI routing + Railway TS build fix).

**QStash signature verification is non-negotiable.** Every POST to `/process-job` on the Railway worker must verify the `upstash-signature` header before processing. Without this, anyone who knows the worker URL can inject arbitrary jobs.

```typescript
import { Receiver } from '@upstash/qstash'

const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
})

// In the route handler, before processing:
const isValid = await receiver.verify({
  signature: req.headers['upstash-signature'],
  body: rawBody,
})
if (!isValid) return res.status(401).json({ error: 'Invalid signature' })
```

**Supabase RLS:** The `jobs` table uses `auth.role() = 'authenticated'` — Chapterhouse is private to Scott and Anna, this is sufficient.

**n8n proxy:** The `N8N_API_KEY` never leaves the server. Client-side code only calls `/api/n8n/...` routes, never n8n directly.

**Input validation:** All job payloads are validated with Zod before being inserted or queued. Reject anything that doesn't match the schema with a 400.

---

## What NOT to Build

- **Public-facing anything** — Chapterhouse is private. No public routes, no public API.
- **Clerk auth** — Chapterhouse uses Supabase auth (`auth/callback` already exists). Don't swap it.
- **The NCHO Shopify integration** — That's a different shop for a different day.

---

## Useful Context About Scott

- **The Council** is the Council of the Unserious: Gandalf (creator/architect — Scott's mirror), Lt. Commander Data (auditor/analyst — systematic, ego-free), Polgara the Sorceress (content director/editor — Anna's mirror), Earl Harbinger (operations commander — business reality), Beavis & Butthead (engagement stress test — the kid in the chair).
- **SomersSchool** is the curriculum SaaS at `TheAccidentalTeacher/CoursePlatform`. The curriculum scope & sequences generated here feed directly into that product.
- **"Secular only"** — all curriculum content generated by this factory must be secular. Alaska Statute 14.03.320 applies to allotment-funded curriculum.
- **Scott vibe codes** — describe what you're building before writing code, propose the simplest approach, ask before adding abstractions.
- **Revenue target: before August 2026.** Everything built here serves that deadline.

---

## Testing the End-to-End Flow (Smoke Test)

1. Manually insert a row into `jobs` table in Supabase with `status: 'queued'`
2. Open `/jobs` in development — confirm the row appears
3. Update the row `status` to `'running'` and `progress` to `42` in Supabase Studio
4. Confirm the UI updates in real time without page refresh
5. Update to `status: 'completed'` with a mock `output` JSON
6. Confirm the output appears in the job detail drawer

Do this before the Railway worker exists. Validate the UI layer independently.

---

## Evolution Roadmap — What Chapterhouse Becomes Next

These are the planned next phases from `chapterhouse-evolution-handoff.md`. Each is additive — nothing built gets replaced.

**Phase A — Dynamic Fetch Engine**
Add the ability for Chapterhouse's AI to read any URL on demand (not just RSS). Tool: `fetchPage(url)` → returns cleaned text. Use `@extractus/article-extractor` or Puppeteer. SSRF protection required — allowlist or URL sanitization before server-side fetch. Enables: brief can read full articles instead of RSS summaries. Enables Phase G.
Effort: 1–2 days.

**Phase B — Scott's Context Layer** *(Highest Priority)*
A `chapterhouse-context.md` file (or Supabase-stored equivalent) loaded as system context into every brief generation call. Already partially done via Phase 7 (SYSTEM_PROMPT expansion). Phase B completes it: adds competitor list, locked decisions log, Alaska allotment context, student data protection rules, Gimli character reference. Success measure: brief says "parents pushing back on screens → NCHO should lean low-screen This week; SomersSchool should use 'intentional learning' not 'digital curriculum.'"
Effort: 1 day to write context file + 2–4 hours to wire.

**Phase C — Collision Mapping** *(Already partially shipped in Phase 7)*
Phase 7 built track-impact scoring and collision detection. Phase C completes it: auto-generate SEED propositions from high-collision items. When collision score ≥2 on 2+ tracks → auto-queue a seed idea to the dreamer queue for Scott's review.
Effort: 1 day.

**Phase D — Artifact Creation Pipeline**
Chapterhouse produces structured markdown files — not just summaries. Handoff docs, architecture specs, policy drafts, prompt templates. Artifact schema in Supabase (type, title, content, source_brief_id). Brief can auto-propose artifacts for high-priority items.
Effort: 2–3 days.

**Phase E — Council Voices in Brief**
Wire Council Chamber into brief generation workflow. After standard brief, run a Council pass on the top 3 priority items: Gandalf synthesizes → Data audits → Polgara checks child-impact → Earl asks "so what, by when" → B&B stress tests. Council Chamber is already live — needs wiring, not rebuilding.
Effort: 2–3 days.

**Phase F — Dream Integration**
High-collision findings auto-generate SEED propositions queued for Scott's review. Depends on Phase C.
Effort: 1 day.

**Phase G — Feed Self-Healing**
Source health monitoring. When a feed goes stale (default: 30 days since last new item), trigger a research job to find 3 active replacement sources. Route to approval queue. Depends on Phase A (fetch engine to verify candidates are active).
Effort: 2–3 days.

**Autoresearch Loop Instrument** (build now, optimize later)
`brief_action_rate` — percentage of "What actually matters" items that result in a task or artifact within 24 hours. Simple counter in Supabase: `brief_id, item_id, actioned_at`. Build the instrument now. Run the optimization loop after real data exists.

---

## Supabase Tables — Complete Registry

| Table | Migration | Purpose |
|---|---|---|
| `briefs` | 001 | Daily brief records |
| `research_items` | 003 | Research library + verdicts |
| `opportunities` | 004 | Product intelligence cards |
| `tasks` | 005 | Task board |
| `chat_threads` | 006 | Persistent chat threads |
| `knowledge_summaries` | 007 | Condensed topic summaries |
| `jobs` | 008 | Background AI job queue |
| `social_accounts` | 010 | Buffer channel mappings per brand |
| `social_posts` | 011 | AI-generated social posts + lifecycle |

---

*Document version: March 18, 2026 (Session 15)*
*Session 15 additions: Documentation review + index update. `[new commit]` placeholder replaced with real hash `119279a`. Build History item 41 updated with Railway TS build fix explanation (TS18048, `unit.lessons.length` → `lessonCount` const); item 42 added (commit hashes). Missing files added to workspace index in both copilot-instructions.md files: `CLAUDE.md`, `scope-sequence-handoff.md`, `somersschool-curriculum-factory-handoff.md`, `chapterhouse-evolution-handoff.md`, `jobs-test-prompts.md`, `social-media-automation-brain.md`. Document version updated to March 18, 2026 (Session 15).*
*Session 14 additions: Contract-clean Pipeline Handoff JSON + code audit. `CANONICAL_SUBJECT_LABELS` (`ela→"Language Arts"` etc.), `schema_version` + `generated_by` guaranteed in post-extraction fixup. Earl (Pass 4) → GPT-5.4, Beavis (Pass 5) → `gpt-5-mini` via new `callWithOpenAI()` — `openai` dep added to worker. `scope-sequence/ela-g1.json` sample. `CCSS-M` → `CCSS-Math` throughout docs (spec-canonical). Railway TS build fix: forEach callback narrowing (TS18048). Commits: `b35246e` + `119279a`.*
*Session 13 additions: Phase 7 Brief Intelligence Upgrade (full context injection + collision scoring + track impact badges). Phase 7.1 daily.dev source integration (3-feed parallel fetch, dedup, 30-post cap). Turbopack build fix for council-chamber-viewer.tsx (3 attempts → final fix: parseOutput() module-level function as opaque type boundary + !! JSX guards + Job.output typed as unknown). Evolution roadmap added from chapterhouse-evolution-handoff.md. Supabase tables registry added.*
*Session 12 additions: Curriculum factory upgraded to full SomersSchool pipeline handoff. `structuredOutput` wired to council-chamber-viewer UI — Pipeline Handoff JSON panel (emerald card, copy/download/preview). 6-pass visual PassStepper replaces bare progress bar. Accumulating session log. Output order corrected (Scope → JSON → Earl open → B&B → Working Papers → Download). Duplicate Earl card removed. Working Papers accordion (Gandalf draft + Data critique). "How It Works" panel updated with Pass 6. Phase 2 architecture reference fully updated to reflect 6-pass reality.*
*All six phases built and deployed. Session 11 additions: Phase 6 YouTube Intelligence — paste any YouTube URL → extract transcript via Gemini 2.5 Flash on Railway (~77s, 21K+ chars) → generate 8 types of curriculum materials via Claude Sonnet 4.6. 3-tier Vercel fast path (captions → innertube → Railway handoff). Hallucination guard validates video via YouTube Data API before Gemini processes. youtube-transcript npm blocked from cloud IPs — Gemini handles 100% of production transcripts. 4 API routes, 4 UI components, 1 Railway worker job type. Sessions 9-10: initial build + Gemini integration + timeout debugging. Session 8: Phase 5 Social Media Automation. Sessions 6-7: Council of the Unserious + national standards + chat features.*
