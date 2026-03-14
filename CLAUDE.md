# CLAUDE.md — Chapterhouse Upgrade Brief
### For the Copilot/Claude Code instance working in the Chapterhouse repo
*Copy this file to the Chapterhouse repo root as `CLAUDE.md`. Claude Code reads it automatically.*

---

## Who This Is For

You are the AI agent working inside `TheAccidentalTeacher/chapterhouse`.

Scott Somers is a middle school teacher in Glennallen, Alaska building a homeschool SaaS empire. This app — Chapterhouse — is his **primary operations tool**. Think of it as mission control: every AI job, every automation pipeline, every overnight batch task runs through or is visible from here. It is private (Scott + Anna only). Not a product. His cockpit.

This document is your complete technical brief. Read all of it before touching any code.

---

## What Chapterhouse Already Is (Current State — Updated March 14, 2026)

**Stack:** Next.js 16.1.6 (App Router), React 19, TypeScript, Tailwind 4, Supabase (auth + DB + realtime), Anthropic SDK, OpenAI SDK, Zod

**All routes — grouped by sidebar section:**

### Command Center
- `/` (Home) — Chat-first interface with Solo/Council mode toggle. Council mode streams multi-member Fellowship responses via SSE (Gandalf, Legolas, Aragorn + Gimli & Merry & Pippin for complex queries). Rebuttal round after initial responses.
- `/daily-brief` — Automated daily brief from RSS feeds + GitHub activity. Cron runs at 3:00 UTC.

### Intelligence
- `/research` — URL ingest, manual paste, screenshot attach. AI extraction, tagging, knowledge summaries. Full CRUD.
- `/product-intelligence` — Scored opportunity cards (A+/A/B). Competitive analysis, market signals.

### Production
- `/content-studio` — AI content generation (newsletters, curriculum guides, product descriptions) via Claude.
- `/review-queue` — Combined research + opportunity review queue. Approve/reject/flag.
- `/tasks` — Task board with status tracking (open/in-progress/blocked/done/canceled). CRUD.
- `/documents` — Workspace markdown files rendered and searchable.

### AI & Automation
- `/jobs` — Real-time job dashboard. QStash → Railway workers. Supabase Realtime progress updates.
- `/curriculum-factory` — 4-pass Council curriculum generation form (Gandalf → Legolas → Aragorn → Gimli).
- `/pipelines` — n8n workflow control panel. Status, execution history, manual triggers.
- `/council` — 5-agent Council Chamber for curriculum scope & sequence generation. Background job.

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
- `summarize/` — AI summarization
- `tasks/` — Task list + create, `[id]/` (PATCH, DELETE)
- `threads/` — Chat thread list + create, `[id]/` (PATCH)

**Supabase tables:**
- `briefs`, `research_items`, `opportunities`, `tasks`, `chat_threads`, `knowledge_summaries`, `founder_notes`, `jobs`

**Key env vars:** `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `QSTASH_TOKEN`, `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `TAVILY_API_KEY`, `NEWSAPI_API_KEY`, `N8N_BASE_URL`, `N8N_API_KEY`, `RAILWAY_WORKER_URL`, `ALERT_EMAIL_TO`

**Installed and active:** `@upstash/qstash`, `@upstash/redis`, `@anthropic-ai/sdk`, `openai`, `@supabase/supabase-js`, `@supabase/ssr`, `zod`, `react-markdown`, `remark-gfm`

**UI features built in this session (March 14, 2026):**
- Council Mode toggle (Solo/Council) inside chat input bar
- SSE-based multi-member streaming with colored avatar bubbles per member
- Council members bar with active speaker indicator
- Rebuttal round with visual divider
- Word limits on all Council member responses
- Accordion-grouped sidebar navigation with 5 sections
- Hover tooltips on all nav items showing purpose/context
- Dynamic system status rail (replaces hardcoded build status)
- Status badges (live/beta/soon) on each nav item

---

## Build Phase Status

All four original phases are **built and deployed**. Current focus is polish, documentation, and production hardening.

```
PHASE 1 — The Job Runner                    ✅ COMPLETE
  Background AI jobs via QStash → Railway workers.
  Supabase Realtime progress. Jobs dashboard at /jobs.
  API: /api/jobs/ (list, create, [id], [id]/cancel, [id]/run)

PHASE 2 — The Curriculum Factory             ✅ COMPLETE
  4-pass Council critique loop (Gandalf → Legolas → Aragorn → Gimli).
  Form + batch support at /curriculum-factory.
  Also Council Chamber at /council (5-agent background job variant).

PHASE 3 — n8n Control Panel                  ✅ COMPLETE
  Proxy routes at /api/n8n/workflows/ and /api/n8n/executions/.
  Pipelines dashboard at /pipelines.

PHASE 4 — Council Mode in Chat               ✅ COMPLETE (scope expanded)
  Originally planned as "Council Chamber (Future)." Now TWO implementations:
  1. /council — Background job: purpose-built curriculum generator
  2. Home chat — Real-time Council Mode: toggle Solo/Council in main chat,
     SSE-streamed multi-member responses with rebuttal round.
     Members: Gandalf, Legolas, Aragorn, Gimli, Merry & Pippin.

BONUS — Sidebar & Help System                ✅ COMPLETE
  Accordion-grouped navigation (5 sections).
  Hover tooltips on every nav item. Status badges (live/beta/soon).
  Dynamic system status rail. Help guide at /help.
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
  progress_message TEXT,                -- e.g. "Pass 2/4: Legolas critique..."
  
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

This is a specific job type (`curriculum_factory`) that generates curriculum scope & sequences using a **4-pass Council critique loop**.

### The Council Members (System Prompts)

Each pass uses the Anthropic Claude Sonnet 4.6 model with a different system prompt. These are the personas from the Fellowship Council:

```typescript
export const COUNCIL_PROMPTS = {
  gandalf: `You are Gandalf the Grey — the most technically brilliant educator in any room. 
You draft deeply researched, pedagogically rigorous scope and sequence documents.
You think deeply about learning progressions, prerequisite knowledge, and developmental appropriateness.
You are also slightly sarcastic about sloppy thinking. Show your reasoning.
Output: A complete, well-structured scope and sequence in markdown format.`,

  legolas: `You are Legolas — precise, fast, and you spotted the problem before anyone else finished reading.
Your job: critique the scope and sequence just written by Gandalf. Find every gap, 
every anachronism, every missequenced skill, every age-inappropriate content, 
every missing prerequisite, every redundancy, every missed standard alignment.
Be specific. Reference line items. This is a code review, not a suggestion box.
Output: A numbered critique list, then a revised version with your corrections applied.`,

  aragorn: `You are Aragorn — no wasted words. You make the call.
Review Gandalf's draft and Legolas's critique. Synthesize the best of both.
Make decisive choices where they conflict. Cut what doesn't serve the learner.
Add what is missing. You are finalizing this document. It ships after you.
Output: The final, authoritative scope and sequence. No hedging. No "consider adding." Done.`,

  gimli: `You are Gimli — gruff, loyal, and you have actually stood in front of real students.
Stress test the scope and sequence Aragorn just finalized. 
Ask: What breaks on a Tuesday in October when 6 of 24 kids are checked out?
What's too abstract for this age? What assumes resources most teachers don't have?
What would a parent question at curriculum night? What would a student find genuinely engaging vs. soul-destroying?
Output: A classroom-viability report with PASS/FAIL on 10 criteria, then a final patch of specific changes.`,
}
```

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

### The 4-Pass Worker Logic

File: `worker/jobs/curriculum-factory.ts`

```typescript
import Anthropic from '@anthropic-ai/sdk'
import { updateProgress } from '../lib/progress'
import { COUNCIL_PROMPTS } from '../lib/council-prompts'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

async function callCouncilMember(
  memberName: keyof typeof COUNCIL_PROMPTS,
  userMessage: string
): Promise<string> {
  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    system: COUNCIL_PROMPTS[memberName],
    messages: [{ role: 'user', content: userMessage }],
  })
  return msg.content[0].type === 'text' ? msg.content[0].text : ''
}

export async function runCurriculumFactory(
  jobId: string,
  payload: z.infer<typeof curriculumJobSchema>
) {
  const { subject, gradeLevel, duration, standards, additionalContext } = payload
  const context = `Subject: ${subject}\nGrade Level: ${gradeLevel}\nDuration: ${duration}${standards ? `\nStandards: ${standards}` : ''}${additionalContext ? `\nContext: ${additionalContext}` : ''}`

  try {
    // Pass 1: Gandalf drafts
    await updateProgress(jobId, 10, 'Pass 1/4: Gandalf drafting scope and sequence...')
    const gandalfDraft = await callCouncilMember('gandalf',
      `Create a comprehensive scope and sequence for:\n${context}`
    )

    // Pass 2: Legolas critiques
    await updateProgress(jobId, 35, 'Pass 2/4: Legolas reviewing for gaps and errors...')
    const legolasCritique = await callCouncilMember('legolas',
      `Review and critique this scope and sequence:\n\n${gandalfDraft}`
    )

    // Pass 3: Aragorn finalizes
    await updateProgress(jobId, 60, 'Pass 3/4: Aragorn finalizing...')
    const aragonFinal = await callCouncilMember('aragorn',
      `Gandalf's draft:\n${gandalfDraft}\n\nLegolas's critique:\n${legolasCritique}\n\nFinalize this scope and sequence.`
    )

    // Pass 4: Gimli stress tests
    await updateProgress(jobId, 80, 'Pass 4/4: Gimli stress-testing for real classroom viability...')
    const gimliReport = await callCouncilMember('gimli',
      `Stress test this finalized scope and sequence:\n\n${aragonFinal}`
    )

    // Compile final output
    const finalOutput = {
      subject,
      gradeLevel,
      duration,
      finalScopeAndSequence: aragonFinal,
      classroomViabilityReport: gimliReport,
      draftsRetained: {
        gandalfInitialDraft: gandalfDraft,
        legolasCritique: legolasCritique,
      },
      generatedAt: new Date().toISOString(),
    }

    await updateProgress(jobId, 100, 'Complete.', 'completed', finalOutput)

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    await updateProgress(jobId, 0, 'Failed', 'failed', undefined, message)
  }
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
3. **`CurriculumOutputViewer`** — renders the `finalScopeAndSequence` markdown with the `gimliReport` underneath in a collapsible. "Download as .md" button.

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

All 10 build steps completed across March 13-14 sessions. Deployed on Vercel.

1. Database — `20260313_008_create_jobs.sql` migration applied, Realtime enabled
2. Dependencies — `@upstash/qstash`, `@upstash/redis` installed
3. Job API routes — `/api/jobs/` (list, create, [id], [id]/cancel, [id]/run)
4. Jobs dashboard — `/jobs` with Supabase Realtime subscription
5. Railway worker — `worker/` directory, Express + QStash signature verification
6. Curriculum factory worker — 4-pass Council logic with progress updates
7. Curriculum factory UI — `/curriculum-factory` form + output viewer
8. Batch job system — parent/child tracking, Resend email on completion
9. n8n control panel — `/pipelines` + proxy routes
10. Navigation + polish — accordion sidebar, tooltips, status badges, dynamic right rail

---

## Security Requirements

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

- **The Council** is a persona system: Gandalf (brilliant drafter), Legolas (precision critic), Aragorn (decisive finalizer), Gimli (classroom stress tester), Frodo (mission anchor), Bilbo (context memory), Merry & Pippin (levity + accidental insight).
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

*Document version: March 14, 2026*
*All four phases built and deployed. Session 6 updates: accordion nav, tooltips, status badges, Council Mode in chat, documentation sync.*
