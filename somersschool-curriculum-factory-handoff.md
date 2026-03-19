# SomersSchool — Curriculum Factory Feature Handoff
### Move the Chapterhouse Curriculum Generator into CoursePlatform

**Date:** March 17, 2026  
**From:** Chapterhouse (private ops brain) — `TheAccidentalTeacher/chapterhouse`  
**To:** CoursePlatform (SomersSchool SaaS) — `TheAccidentalTeacher/CoursePlatform`  
**Stack:** Next.js App Router, TypeScript, Tailwind, Supabase, QStash, Railway worker

---

## What This Feature Is

The Curriculum Factory generates complete, production-ready course scope & sequences using a **6-pass Council of the Unserious critique loop**. The end product is two deliverables in one job run:

1. **`finalScopeAndSequence`** — Polgara's production-ready markdown document. Human-readable, structured, printable. This is what Scott reviews.
2. **`structuredOutput`** — Validated SomersSchool pipeline JSON. Drop-in ready for `scope-sequence/`. This is what the course platform imports.

The JSON schema is fully specified in `scope-sequence-handoff.md` in the Chapterhouse repo.

---

## The 6-Pass Pipeline

| Pass | Member | Role | Model | Progress % |
|------|--------|------|-------|------------|
| 1 | **Gandalf** | Drafts the full scope & sequence from zero | Claude Sonnet 4.6 | 5% |
| 2 | **Data** | Audits standards, structure, pacing math, variety | Claude Sonnet 4.6 | 18% |
| 3 | **Polgara** | Finalizes — child-first lens, synthesizes 1+2 | Claude Sonnet 4.6 | 35% |
| 4 | **Earl** | Operational assessment — build order, revenue reality | GPT-5.4 | 52% |
| 5 | **Beavis & Butthead** | Engagement stress test — would a real kid care? | GPT-5-mini | 75% |
| 6 | **Extractor** | Converts Polgara's markdown to validated JSON | Claude Sonnet 4.6 | 88% → 100% |

Total runtime: ~8–11 minutes per course.

---

## What to Copy from Chapterhouse

### 1. Worker Logic — The Core AI Pipeline

**Source file:** `worker/src/jobs/curriculum-factory.ts`

Copy the entire file as-is into CoursePlatform's job worker. It is self-contained. The only dependencies are:
- `@anthropic-ai/sdk`
- `openai`
- A local `updateProgress(jobId, progress, message, status?, output?, error?)` helper
- A local `notifyJobComplete(jobId, label, status, error?)` helper
- `COUNCIL_PROMPTS` and `CouncilMember` type from `council-prompts.ts`

> ⚠️ **OPENAI_API_KEY required in Railway worker env.** Earl (Pass 4) calls GPT-5.4 and Beavis (Pass 5) calls gpt-5-mini. Without this key both passes will silently return empty strings.
> ⚠️ **ANTHROPIC_API_KEY required in Railway worker env.** Passes 1, 2, 3, and 6 use Claude Sonnet 4.6.

### 2. Council Prompts

**Source file:** `worker/src/lib/council-prompts.ts`

Copy the entire file. It defines the character-specific system prompts for all 6 council members. These are long, carefully tuned prompts — do not rewrite them. The `CouncilMember` type is also defined here.

Current members: `gandalf`, `data`, `polgara`, `earl`, `beavis`

### 3. Progress Helper

**Source file:** `worker/src/lib/progress.ts`

Copy or adapt. It writes `{ progress, progress_message, status, output, error, started_at, completed_at }` to the `jobs` Supabase row. CoursePlatform needs the same `jobs` table (see DB schema below).

### 4. The Form UI Component

**Source file:** `src/components/curriculum-factory-form.tsx`

This is the admin-facing form. In SomersSchool context, this lives at an admin-only route (e.g., `/admin/curriculum-factory`). Features:
- Subject dropdown (20 subjects) + custom subject input
- Grade level slider (K/1–12)
- Duration dropdown (1 week → 36 weeks / full year)
- Optional standards field (e.g., "Alaska GLE Grade 6 ELA")
- Optional additional context (e.g., "65% Alaska Native students. Rural classroom.")
- Single course mode OR batch mode (multiple subjects × grade range → queues parallel jobs)

The form POSTs to `/api/jobs/create` then redirects to `/jobs?highlight={jobId}`.

### 5. Output Viewer Component

**Source file:** `src/components/council-chamber-viewer.tsx`

This renders the completed job output. Key sections in order:
1. **Final Scope & Sequence** — Polgara's markdown rendered as HTML
2. **Pipeline Handoff JSON** — Emerald card. Copy to clipboard / Download as `.json` / Preview toggle
3. **Earl's Operational Assessment** — Business reality check (open by default)
4. **Beavis & Butthead Engagement Report** — Student reality check
5. **Working Papers accordion** — Gandalf's initial draft + Data's critique (collapsed by default)
6. **Download full session transcript** — `.md` file including the JSON block

Also uses `job-detail-drawer.tsx` for the slide-out panel when clicking a job row in the jobs dashboard.

---

## Database Schema

CoursePlatform needs a `jobs` table. This table is **already built in Chapterhouse** — run the same migration:

```sql
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Identity
  type TEXT NOT NULL,           -- 'curriculum_factory' | 'research_batch' etc.
  label TEXT NOT NULL,          -- Human-readable: "Language Arts — Grade 6 — 9 weeks"

  -- Status lifecycle: queued → running → completed | failed | cancelled
  status TEXT NOT NULL DEFAULT 'queued',
  progress INT NOT NULL DEFAULT 0,      -- 0-100
  progress_message TEXT,

  -- Payload and output
  input_payload JSONB NOT NULL,
  output JSONB,                         -- Final result — see Output Shape below
  error TEXT,

  -- Metadata
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  worker_id TEXT,

  -- Optional parent for batch jobs
  parent_job_id UUID REFERENCES jobs(id) ON DELETE CASCADE
);

CREATE INDEX jobs_status_idx ON jobs(status);
CREATE INDEX jobs_type_idx ON jobs(type);
CREATE INDEX jobs_parent_idx ON jobs(parent_job_id);

ALTER PUBLICATION supabase_realtime ADD TABLE jobs;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
-- Adjust RLS to your CoursePlatform auth model (admin or authenticated + role check)
```

---

## API Routes to Build

### `POST /api/jobs/create`

Validates payload with Zod, inserts `jobs` row, publishes to QStash → Railway worker. Returns `{ jobId, status: 'queued' }`.

Input schema:
```typescript
const jobSchema = z.object({
  type: z.enum(['curriculum_factory']),
  label: z.string().min(1).max(200),
  payload: z.record(z.unknown()),
})
```

### `GET /api/jobs` — list jobs (sorted by created_at DESC)
### `GET /api/jobs/[id]` — single job with full output
### `POST /api/jobs/[id]/cancel` — mark cancelled

The Chapterhouse source is in `src/app/api/jobs/`.

---

## Job Input Payload Shape

```typescript
interface CurriculumJobPayload {
  subject: string;           // "Language Arts" / "Mathematics" / "Science" / "Social Studies" / etc.
  gradeLevel: number;        // 1–12
  duration: string;          // "9 weeks" / "18 weeks" / "36 weeks" / "1 week" etc.
  standards?: string;        // Optional: "Alaska GLE Grade 4 Science"
  additionalContext?: string; // Optional: "65% Alaska Native. Rural. Subsistence lifestyle context."
}
```

---

## Job Output Shape

When complete, `jobs.output` contains:

```typescript
{
  subject: string,
  gradeLevel: number,
  duration: string,
  standards: string | null,

  // The two deliverables
  finalScopeAndSequence: string,          // Polgara's markdown — human readable
  structuredOutput: {                     // SomersSchool pipeline JSON — import-ready
    id: string,                           // e.g. "ela-g6"
    schema_version: "1.0",
    subject: string,                      // canonical: "Language Arts" not "ELA"
    subject_code: string,                 // "ela" | "sci" | "mth" | "hst"
    grade: number,
    grade_band: string,                   // "early_elementary" | "upper_elementary" | "middle" | "high"
    title: string,
    subtitle: string,
    faith_integration: false,             // ALWAYS false — Alaska Statute 14.03.320
    theology_profile: "none",
    standards_framework: string,          // "CCSS-ELA" | "CCSS-Math" | "NGSS" | "C3"
    units: Array<{
      unit_number: number,
      title: string,
      description: string,
      pacing: string,                     // "N+1" format e.g. "5+1"
      lessons: Array<{
        lesson_number: number,
        title: string,
        big_idea: string,
        standards: string[],
        key_concepts: string[],
        is_review_lesson: boolean,        // true ONLY on last lesson per unit
        style: string,                    // "exploration"|"deep_dive"|"hands_on"|"story_driven"|etc.
        energy: "high" | "medium" | "low"
      }>
    }>,
    meta: {
      generated_at: string,               // ISO 8601
      generated_by: "chapterhouse-curriculum-factory",
      total_units: number,
      total_lessons: number
    }
  } | null,

  // Council working papers
  operationalAssessment: string,          // Earl's report
  engagementReport: string,               // Beavis & Butthead's verdict
  draftsRetained: {
    gandalfInitialDraft: string,
    dataCritique: string,
  },
  generatedAt: string,
}
```

---

## Environment Variables (Railway Worker)

```bash
ANTHROPIC_API_KEY=...          # Passes 1, 2, 3, 6 (Claude Sonnet 4.6)
OPENAI_API_KEY=...             # Pass 4 (Earl → gpt-5.4), Pass 5 (Beavis → gpt-5-mini)
SUPABASE_URL=...               # CoursePlatform Supabase project URL
SUPABASE_SERVICE_ROLE_KEY=...  # Service role — bypasses RLS for progress writes
RESEND_API_KEY=...             # Completion email notifications (optional but recommended)
ALERT_EMAIL_TO=...             # Where completion emails go
QSTASH_CURRENT_SIGNING_KEY=... # QStash signature verification (REQUIRED — no bypass)
QSTASH_NEXT_SIGNING_KEY=...    # QStash signature verification (REQUIRED)
```

---

## Worker Package Dependencies

```json
{
  "dependencies": {
    "@anthropic-ai/sdk": "^0.24.0",
    "openai": "^4.0.0",
    "@supabase/supabase-js": "^2.0.0",
    "@upstash/qstash": "^2.0.0",
    "express": "^4.18.0",
    "resend": "^3.0.0"
  }
}
```

---

## QStash Signature Verification (Non-Negotiable)

Every POST to the Railway worker's `/process-job` endpoint MUST verify the QStash signature before executing. Without this, anyone who discovers the worker URL can inject arbitrary jobs.

```typescript
import { Receiver } from '@upstash/qstash'

const receiver = new Receiver({
  currentSigningKey: process.env.QSTASH_CURRENT_SIGNING_KEY!,
  nextSigningKey: process.env.QSTASH_NEXT_SIGNING_KEY!,
})

// In the route handler — verify before touching any job logic
const isValid = await receiver.verify({
  signature: req.headers['upstash-signature'],
  body: rawBody,
})
if (!isValid) return res.status(401).json({ error: 'Invalid signature' })
```

---

## The `scope-sequence/` Folder

Once a curriculum job completes, Scott manually copies or scripts the `structuredOutput` JSON to `scope-sequence/` in the CoursePlatform repo. File naming convention from `scope-sequence-handoff.md`:

```
scope-sequence/ela-g1.json
scope-sequence/ela-g2.json
scope-sequence/sci-g6.json
scope-sequence/mth-g4.json
```

These files are what the CoursePlatform lesson builder reads when auto-building course structure. The curriculum factory is the upstream generator. The CoursePlatform lesson content system is the downstream consumer.

---

## Standards Auto-Detection Logic

The worker auto-detects the national framework from the subject string. No manual input required. The map is in `curriculum-factory.ts`:

| Subject input | Framework |
|--------------|-----------|
| Language Arts / ELA / Reading / Writing | CCSS-ELA |
| Math / Mathematics / Algebra / Geometry | CCSS-Math |
| Science / Biology / Chemistry / Physics / Earth Science | NGSS |
| Social Studies / History / Geography / Civics / Economics | C3 Framework |
| Bible | internal |
| Art / Music / PE | internal |

If the user provides the optional "Standards" field, that text is appended to the context the AI receives — it does not override the auto-detected framework.

---

## Admin Access Only

In CoursePlatform, this feature is **admin-only**. Parents and students never see it. Suggested routing:

- `/admin/curriculum-factory` — the form
- `/admin/jobs` — job dashboard with Supabase Realtime progress
- `/admin/jobs/[id]` — job detail with the output viewer

Protect all `/admin/*` routes with a middleware check:

```typescript
// middleware.ts — add to the admin route matcher
if (req.nextUrl.pathname.startsWith('/admin')) {
  const session = await getSession(req)
  if (!session || session.user.role !== 'admin') {
    return NextResponse.redirect(new URL('/login', req.url))
  }
}
```

---

## What This Feature Does NOT Do

- **Does not write directly to the course database.** The structured JSON is a handoff artifact. Scott reviews it, decides if it's good, then it enters the course build pipeline separately.
- **Does not create lessons.** It creates the *architecture* — units, titles, standards, pacing, style/energy hints. Lesson content generation is a separate system (not yet built).
- **Does not cost much.** A single full-year curriculum run (6 passes): ~$0.12–$0.18 in API costs (4 Claude Sonnet calls + 1 GPT-5.4 + 1 GPT-5-mini). Batch of 52 courses: ~$7–$9 total.

---

## Build Order Recommendation

1. `npm install @upstash/qstash openai @anthropic-ai/sdk` in both Next.js app and worker
2. Apply the `jobs` table migration to CoursePlatform's Supabase
3. Enable Supabase Realtime on `jobs` table
4. Copy `curriculum-factory.ts` and `council-prompts.ts` to worker
5. Copy `progress.ts` and `notify.ts` helpers (or adapt from Chapterhouse)
6. Build `/api/jobs/create`, `/api/jobs`, `/api/jobs/[id]` routes
7. Build or copy `CurriculumFactoryForm` component at `/admin/curriculum-factory`
8. Build or copy `council-chamber-viewer.tsx` + `job-detail-drawer.tsx` for `/admin/jobs`
9. Add `useJobsRealtime` hook (`src/hooks/use-jobs-realtime.ts` in Chapterhouse) for live progress
10. Set all env vars in Railway worker
11. Test one full run: Language Arts / Grade 6 / 9 weeks — verify JSON drops into `scope-sequence/ela-g6.json` cleanly

---

## Verified Working State (as of March 17, 2026)

The Chapterhouse version at commit `119279a` is production-ready and passes Railway build. All 6 passes are wired. `structuredOutput` post-extraction fixup guarantees:

- `subject` = canonical label (never raw user input)
- `schema_version` = `"1.0"` (hard-set, not AI-dependent)
- `generated_by` = `"chapterhouse-curriculum-factory"` (hard-set)
- `generated_at` = real ISO 8601 timestamp at generation runtime
- `is_review_lesson` = explicit `true`/`false` on every single lesson (never omitted)
- Pacing math corrected if AI got it wrong
- Lesson numbers sequential from 1
- `total_lessons` and `total_units` computed programmatically (not AI-generated)

Sample validated output: `scope-sequence/ela-g1.json` (4 units, 22 lessons).

---

*This document is the complete handoff contract. Everything needed to port this feature is in this file + the four source files named above.*
