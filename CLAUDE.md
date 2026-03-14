# CLAUDE.md — Chapterhouse Upgrade Brief
### For the Copilot/Claude Code instance working in the Chapterhouse repo
*Copy this file to the Chapterhouse repo root as `CLAUDE.md`. Claude Code reads it automatically.*

---

## Who This Is For

You are the AI agent working inside `TheAccidentalTeacher/chapterhouse`.

Scott Somers is a middle school teacher in Glennallen, Alaska building a homeschool SaaS empire. This app — Chapterhouse — is his **primary operations tool**. Think of it as mission control: every AI job, every automation pipeline, every overnight batch task runs through or is visible from here. It is private (Scott + Anna only). Not a product. His cockpit.

This document is your complete technical brief. Read all of it before touching any code.

---

## What Chapterhouse Already Is (Current State)

**Stack:** Next.js 16.1.6 (App Router), React 19, TypeScript, Tailwind 4, Supabase (auth + DB + realtime), Anthropic SDK, OpenAI SDK, Zod

**Existing routes:**
- `/daily-brief` — automated news brief pulled from RSS + GitHub
- `/research` — web research ingestion
- `/content-studio` — AI content generation
- `/tasks` — task management
- `/documents` — document store
- `/product-intelligence` — opportunity analysis
- `/review-queue` — content review pipeline
- `/settings`, `/help`

**Existing API routes under `/api/`:**
- `briefs/` — brief generation + listing
- `chat/` — chat interface
- `content-studio/` — content generation
- `cron/daily-brief/` — scheduled brief generation
- `research/` — research queries
- `tasks/[id]` — task CRUD
- `threads/[id]` — chat thread management
- `opportunities/analyze` — opportunity scoring
- `extract-learnings/`, `summarize/`, `founder-notes/`

**Existing Supabase tables:**
- `briefs`
- `research_items`
- `opportunities`
- `tasks`
- `chat_threads`
- `knowledge_summaries`

**Key env vars already expected:** `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, `QSTASH_TOKEN`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `TAVILY_API_KEY`, `NEWSAPI_API_KEY`

**NOT installed yet:** `@upstash/qstash`, `@upstash/redis` — install before building the job system.

---

## What Chapterhouse Is Becoming

Three new major capabilities, built in phases:

```
PHASE 1 — The Job Runner
  Background AI jobs that run while Scott sleeps.
  Trigger from Chapterhouse UI, work happens on Railway, 
  results appear live via Supabase Realtime.

PHASE 2 — The Curriculum Factory  
  Specific job type: generate curriculum scope & sequences
  using a 4-pass Council critique loop (Gandalf → Legolas → Aragorn → Gimli).
  Built on Phase 1 infrastructure.

PHASE 3 — n8n Control Panel
  See, trigger, and monitor n8n pipeline workflows
  running on Railway. One tab in Chapterhouse.

PHASE 4 — Council Chamber (Future)
  Real multi-agent CrewAI workflows.
  Watch the Council argue in real time.
  Not Phase 1 — architect for it but don't build yet.
```

---

## PHASE 1 — The Job Runner

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

## PHASE 2 — The Curriculum Factory

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

## PHASE 3 — n8n Control Panel

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

## Navigation Updates

Add the new routes to `src/lib/navigation.ts`:

```typescript
// Add to existing navigation array:
{ href: '/jobs', label: 'Job Runner', icon: 'Cpu' },
{ href: '/curriculum-factory', label: 'Curriculum Factory', icon: 'BookOpen' },
{ href: '/pipelines', label: 'Pipelines', icon: 'GitBranch' },
```

And update `src/components/chapterhouse-shell.tsx` to include these in the sidebar.

---

## Build Order

Build strictly in this order. Each phase depends on the previous.

### Step 1: Database (15 min)
- Write and run migration `20260313_008_create_jobs.sql`
- Verify Realtime is enabled on `jobs` table in Supabase dashboard

### Step 2: Install dependencies (2 min)
```bash
npm install @upstash/qstash @upstash/redis
```

### Step 3: Job API routes (45 min)
- `src/app/api/jobs/create/route.ts`
- `src/app/api/jobs/route.ts`
- `src/app/api/jobs/[id]/route.ts`
- `src/app/api/jobs/[id]/cancel/route.ts`

### Step 4: Jobs dashboard UI (60 min)
- `src/app/jobs/page.tsx`
- `src/components/jobs-dashboard.tsx` (list + realtime)
- `src/components/job-detail-drawer.tsx`
- Test with manually inserted Supabase rows before Railway worker exists

### Step 5: Railway worker — setup (30 min)
- Create `worker/` directory at repo root
- `worker/package.json` with express, @anthropic-ai/sdk, @supabase/supabase-js, @upstash/qstash
- `worker/index.ts` — Express server with QStash signature verification
- `worker/lib/supabase.ts`, `worker/lib/progress.ts`
- Deploy to Railway as separate service

### Step 6: Curriculum factory worker (90 min)
- `worker/lib/council-prompts.ts`
- `worker/jobs/curriculum-factory.ts`
- Wire into `worker/jobs/router.ts`
- Test with a single job end-to-end

### Step 7: Curriculum factory UI (60 min)
- `src/app/curriculum-factory/page.tsx`
- `src/components/curriculum-factory-form.tsx`
- `src/components/curriculum-output-viewer.tsx`

### Step 8: Batch job system (60 min)
- Batch payload handling in worker
- Parent/child job tracking
- Resend completion email

### Step 9: n8n control panel (45 min)
- API proxy routes
- `src/app/pipelines/page.tsx`

### Step 10: Navigation + polish (20 min)
- Add all routes to sidebar
- Loading states
- Error states
- Mobile layout check

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

## What NOT to Build Yet

- **CrewAI / multi-agent Council Chamber** — Phase 4. Architect for it but don't build. The jobs table `type` field already includes `council_session` as a valid enum value.
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

*Document version: March 13, 2026*
*Created in the email workspace. Copy to Chapterhouse repo root as `CLAUDE.md`.*
