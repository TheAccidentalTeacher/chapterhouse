# Chapterhouse Cowork Upgrade Spec
## Implementation Spec + Handoff Document — Phases 20–27

> **Document type:** Build Bible (implementation spec + handoff hybrid)
> **Format:** Universal 5-question architecture per phase, Build Bible annotations throughout
> **Source:** 92-question brainstorm → decision log → this spec
> **Status:** All decisions locked. Green light to build. Phase 20A is the starting point.
> **Last migration in production:** Check `supabase/migrations/` before creating any migration file. Expected: 043.
> **⚠️ GOTCHA:** Migration numbering — ALWAYS verify the actual last migration number in `supabase/migrations/` before creating a new one. The numbers in this spec assume 043 is last; if newer migrations exist, renumber accordingly.

---

## Pre-Flight Reads (REQUIRED)

Before touching any code in this spec, read:
1. `CLAUDE.md` — full technical brief, all routes, all tables, all env vars
2. `.github/copilot-instructions.md` — identity brain, locked decisions, Council personas
3. `.github/instructions/scott-dev-process.instructions.md` — Dream Floor process
4. `supabase/migrations/` — scan ALL migration files, confirm the last number
5. This spec — front to back before starting any phase

---

## Scott's Building Schedule

| Window | Hours | Notes |
|---|---|---|
| Weekdays | 4 PM – 11 PM (6–7 hrs) | After teaching, before sleep |
| Weekends | 10 AM – 2 AM (14–16 hrs) | Deep build sessions |

**Key deadlines:**
- **May 24, 2026** — Teaching contract ends
- **May 25, 2026** — Professional constraint lifts (full-time build)
- **June 2026** — First paying customers target
- **August 2026** — Revenue must cover $7–9K/month minimum, $15K target

---

## Stack & Architecture (ALL LOCKED — Do NOT Re-Litigate)

| Layer | Technology | Notes |
|---|---|---|
| Frontend | Next.js 16.1.x App Router | Turbopack dev, standard prod build |
| Language | TypeScript (strict) | `"types": ["node"]` in tsconfig |
| Styling | Tailwind CSS 4 | Gold/amber palette (#D4A80E dark, #8B5E00 light) |
| Auth | Supabase email/password | NOT Clerk — Chapterhouse is private. Exception to Clerk-as-default (§12.1): predates that decision, private tool. |
| Database | Supabase (PostgreSQL + RLS + Realtime) | Service role key for server, anon key for browser Realtime |
| Hosting | Vercel Pro | Crons via vercel.json, maxDuration per route |
| AI — primary | Anthropic (Sonnet 4.6 / Haiku 4.5 / Opus 4.6) | |
| AI — secondary | OpenAI GPT-5.4 (Responses API) + gpt-5-mini | Earl on GPT-5.4, Silk on gpt-5-mini |
| AI — fast/internal | Groq Llama 3.3 70B | ⛔ NEVER with student data |
| Job queue | QStash → Railway workers | Signature verification non-negotiable |
| Media CDN | Cloudinary (dpn8gl54c) | Text overlay via URL transforms, NEVER baked in |
| TTS | ElevenLabs (Creator plan, scoped keys) | 100K credits/cycle, $219.96/yr |
| Social scheduling | Buffer GraphQL API | REST API is dead — locked decision |
| Observability | Langfuse | Keys in `api-guide-master.md` |
| Streaming | SSE over WebSockets — always | Typed events |
| Context storage | Supabase `context_files` table | Never in code files — locked decision |
| Migrations | Additive only | Never DROP TABLE/COLUMN without explicit Scott instruction |

---

## Locked Decisions — Tool Ownership

These tools are REPLACED by Chapterhouse features. Do not suggest or build integrations for them.

| Killed Tool | Replaced By | Phase |
|---|---|---|
| Monica.IM AI Writer | Doc Studio (14→20 doc types) | 20–26 |
| Monica.IM Compose | Doc Studio + Chat | Existing |
| Cowork Campaign Plan | Doc Studio `campaign_plan` | 26A |
| Cowork Email Sequence | Doc Studio `email_sequence` | 26B |
| Cowork SEO Audit | Doc Studio `seo_audit` | 26C |
| Cowork Competitive Brief | Doc Studio `competitive_brief` | 26D |
| Sintra social ($49/mo) | Social automation pipeline | Existing (Phase 5) |
| ToonBee ($77/mo) | Leonardo Character Reference API | Existing |
| Helicone | Langfuse | 20B |
| Stripe | All payments via NCHO Shopify. No Stripe in any repo. | — |

## Locked Decisions — ElevenLabs Scope

| Decision | Value |
|---|---|
| Plan | Creator ($219.96/yr, billed annually) |
| Credits per cycle | 100,000 |
| Voice strategy | Use stock voices now, evolve later |
| API key scoping | One key per project (Chapterhouse key ≠ SomersSchool key) |
| Default voice | Configurable via `ELEVENLABS_DEFAULT_VOICE_ID` env var |
| Cost guard | 5,000 character limit per single TTS call |

## Locked Decisions — Brand Voice Expansion

| Decision | Value |
|---|---|
| Source of truth | Supabase `brand_voices` table (NOT code files) |
| Format | Raw textarea (Option A) — no structured sub-fields |
| Existing brands | NCHO, SomersSchool, Alana Terry, Scott Personal |
| Doc Studio integration | Brand voice dropdown injected into generation prompt |

## Locked Decisions — General

| Decision | Value |
|---|---|
| Chapterhouse is private | Scott + Anna only. No public routes, no public API. |
| "Your child" not "your student" | All copy, everywhere — A/B tested, locked |
| SomersSchool is 100% secular | Alaska Statute 14.03.320 |
| COPPA | Parent → child profile → child login. Children under 13 cannot self-register. |
| Brand wall | 8 lanes never cross-promoted without explicit instruction |
| Image generation | API-only. Leonardo → FLUX.1-Kontext → gpt-image-1 waterfall |
| Buffer | GraphQL only. Old REST API is dead. |
| SSE over WebSockets | Always. Typed events. |
| Batch Size Law | When a task fails, cut batch in half before changing prompt |
| Anti-hallucination | Every factual claim traceable to source URL. Unfounded claims flagged ⚠️. |
| No secrets in code | Env vars only. `.env.local` is the floor. |
| SSRF prevention | All server-side URL fetching validates against allowed domains or blocks internal addresses |
| Session close | Update CLAUDE.md build history after every working session |

---

## Tradeoff Hierarchy (When Decisions Conflict)

1. **Student safety** — absolute, non-negotiable
2. **Revenue path** — does this move toward August 2026?
3. **Automation** — works while Scott sleeps
4. **Simplicity** — fewer moving parts
5. **Scalability** — can grow later
6. **Polish** — nice-to-have

---

## 7-Gate Decision Filter

Every feature in this spec passed all 7 gates:

1. Does this move revenue toward August 2026?
2. Can I build this with what I already have?
3. Does this work while I sleep?
4. Can this ship this week (or this phase)?
5. Does this respect the brand wall?
6. Is this API-first?
7. Does this protect the kids? ← **Gate 7 is absolute. If it fails, nothing else matters.**

### Tool Evaluation Filter (§12.5)

Every external tool or service must also pass 5 additional gates:

1. Has API? (No API = no automation = manual overhead forever)
2. Free or earns its keep? (Must be free tier or ROI-positive within 30 days)
3. Replaces something paid? (Prefer tools that eliminate an existing cost)
4. Can run overnight? (Must work unattended — Scott sleeps)
5. Safe dependency? (No supply chain red flags, no single-maintainer npm packages for critical paths)

---

## Phase Overview

| Phase | Name | Scope | Gates |
|---|---|---|---|
| 20A | Document Export Pipeline | 1 route, 1 migration, UI dropdown | — |
| 20B | Langfuse Cost Visibility | 1 route, 1 lib, 3 env vars | — |
| 20C | Brand Voice in Doc Studio | Modify 1 route, 1 UI dropdown | — |
| 21A | Outline-First Generation | 1 route, 1 migration, outline UI | 20A |
| 21B | Agentic Document Editing | 1 route, optimistic locking | 21A |
| 21C | Voice Sample Analysis | 1 route, 1 modal | — |
| 22A | @Council Floating Button | 1 route, 1 component | — |
| 22B | Unified Cross-Source Search | 1 route, 1 component | — |
| 23A | Knowledge Base UI | 5 routes, 1 page | — |
| 23B | Watch URLs | 1 migration, 4 routes, cron mod | — |
| 23C | Intel → Task Bridge | Button + POST to existing route | — |
| 24A | ElevenLabs Wiring | 1 route, 1 lib, 1 component, 2 env vars | — |
| 24B | Audio on Content Types | Add `<ListenButton>` to 3 pages | 24A |
| 25A | Performance Prediction | 1 migration, 2 routes, cron entry | — |
| 25B | Boost This Post | 1 route, 1 button | 25A |
| 25C | Grounded Mode Toggle | Modify 1 route, 1 UI toggle | — |
| 26A–F | Cowork Feature Bridge | 6 doc types, 1 migration | 21A |
| 27A–E | Advanced / Post-Launch | Deferred until post-August 2026 | Many |
| 28A | AI Columns / Row-Level Enrichment | Enrich existing tables with AI metadata | — |
| 28B | Composable AI Workflows | Chain capabilities into repeatable sequences | Post-launch |
| 28C | Multi-Surface Output | One generation → DOCX + email + social set | 20A |
| 28D | GEO / AI Search Visibility | Track NCHO/SomersSchool in AI answers | — |
| 28E | Audiences as Structured Data | Persona-aware generation, migration 106 | 20C, 26 |

---

## Shared TypeScript Interfaces

**File:** `src/types/cowork.ts`

Create this file FIRST before any phase. All phases import from here.

```typescript
// src/types/cowork.ts

/** Phase 20A — Document export tracking */
export interface ExportRecord {
  format: 'docx' | 'md' | 'pdf';
  exported_at: string;  // ISO 8601
  exported_by: string;  // user_id
}

/** Phase 21A — Document outline structure */
export interface OutlineSection {
  id: string;           // nanoid or uuid
  title: string;
  guidance: string;     // AI-generated section brief
  sort_order: number;
}

export interface DocumentOutline {
  sections: OutlineSection[];
  generated_at: string;
  model: string;        // which model generated it
}

/** Phase 23B — Watch URL tracking */
export interface WatchUrl {
  id: string;
  url: string;
  label: string;
  check_interval: 'daily' | 'weekly' | 'monthly';
  last_checked_at: string | null;
  last_content_hash: string | null;
  is_active: boolean;
  created_at: string;
}

/** Phase 22B — Unified search result */
export interface SearchResult {
  id: string;
  type: 'task' | 'research' | 'opportunity' | 'thread' | 'brief' | 'document';
  title: string;
  snippet: string;
  updated_at: string;
  url: string;          // internal route to navigate to
}

/** Phase 25A — Social engagement data */
export interface EngagementData {
  reach?: number;
  clicks?: number;
  likes?: number;
  comments?: number;
  shares?: number;
  fetched_at: string;
}

/** Phase 20B — Cost tracking entry */
export interface CostEntry {
  trace_id: string;
  name: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  timestamp: string;
}
```

**SMOKE TEST:** File compiles with zero errors. Import from any route via `import type { ExportRecord } from '@/types/cowork'`.

---

## Error Handling Contract

Every new API route in this spec uses this pattern. No exceptions.

**File:** `src/lib/route-helpers.ts`

```typescript
// src/lib/route-helpers.ts
import { ZodError } from 'zod';

export function handleRouteError(error: unknown): Response {
  if (error instanceof ZodError) {
    return Response.json(
      { error: 'Validation failed', details: error.flatten().fieldErrors },
      { status: 400 }
    );
  }
  if (error instanceof Error) {
    console.error(`[API Error] ${error.message}`, error.stack);
    return Response.json(
      { error: error.message },
      { status: 500 }
    );
  }
  console.error('[API Error] Unknown error', error);
  return Response.json({ error: 'Internal server error' }, { status: 500 });
}
```

**Usage in every route:**

```typescript
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = someSchema.parse(body);
    // ... route logic ...
    return Response.json({ ok: true, data });
  } catch (error) {
    return handleRouteError(error);
  }
}
```

**Do NOT Rebuild:** The existing routes (chat, council, social, etc.) already have their own error handling. Do not retrofit this into existing routes — apply it to NEW routes only.

---

## Phase 20A — Document Export Pipeline

> Q-20A.1: What gets built?
> A: Export any document from Doc Studio as DOCX, Markdown, or PDF. Track export history. Wire chat-initiated export (the PINNED item from CLAUDE.md).

> Q-20A.2: What DB changes (exact SQL)?
> A: Migration below — adds `export_history` and `content_html` to `documents`.

> Q-20A.3: What existing code preserved vs replaced?
> A: Doc Studio `/doc-studio` page and all 15 existing doc types PRESERVED. Export is additive.

> Q-20A.4: Verification step?
> A: SMOKE TEST block below.

> Q-20A.5: What does this gate for next phase?
> A: Phase 21A (Outline-First) and 21B (Agentic Editing) both depend on the `documents` table having `content_html`.

### Migration 101

**File:** `supabase/migrations/20260413_101_add_document_export_fields.sql`

**⚠️ GOTCHA:** Verify `supabase/migrations/` to confirm 043 is actually the last migration. If it's higher, renumber this and all subsequent migrations.

```sql
-- Phase 20A: Document Export Pipeline
-- Adds export history tracking and HTML content storage
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS export_history JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS content_html TEXT;

COMMENT ON COLUMN documents.export_history IS 'Array of {format, exported_at, exported_by}';
COMMENT ON COLUMN documents.content_html IS 'HTML version of content for DOCX conversion';
```

**BEFORE:** `documents` table has `content TEXT` (markdown only).
**AFTER:** `documents` table has `content TEXT`, `content_html TEXT`, `export_history JSONB`.

### Route: `/api/documents/export`

**File:** `src/app/api/documents/export/route.ts`
**Method:** POST

```typescript
// Zod schema
const exportSchema = z.object({
  document_id: z.string().uuid(),
  format: z.enum(['docx', 'md', 'pdf']),
});
```

**Logic:**
1. Validate input with `exportSchema.parse(body)`
2. Fetch document from Supabase by ID (verify `auth.uid()` ownership)
3. Branch on format:
   - `md` → return `content` as-is with `Content-Type: text/markdown` and `Content-Disposition: attachment`
   - `docx` → convert `content_html` (or `content` via `marked`) through `html-to-docx` (already installed), return binary with `Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document`
   - `pdf` → return JSON with `{ printUrl: '/doc-studio?id=X&print=true' }` — client calls `window.print()` (no server-side PDF generation needed)
4. Append to `export_history` JSONB array: `{format, exported_at: new Date().toISOString(), exported_by: userId}`
5. Return response

**⚠️ GOTCHA:** `html-to-docx` is already installed (`package.json`). Do NOT install it again. Import: `import HTMLtoDOCX from 'html-to-docx'`.

### Chat-Initiated Export (The PINNED Item)

**File:** `src/app/api/chat/route.ts` (modify existing)

**BEFORE:** Chat route generates response and returns it.
**AFTER:** After AI response, check if the response contains a generated document pattern (e.g., user said "generate a session close" or "export this as markdown"). If detected:
1. POST to `/api/documents/generate/` with the appropriate doc type
2. Wait for document ID
3. Append download link to chat response: `\n\n📄 [Download document](/api/documents/export?document_id=X&format=md)`

**Detection regex:** `/\b(generate|create|write|draft|export)\b.*\b(session close|spec|prd|report|blog|document)\b/i`

**Do NOT Rebuild:** The existing chat route is complex. Add this as a post-processing step AFTER the response is complete, not inline with streaming.

### UI Changes

**File:** `src/app/doc-studio/page.tsx`

Add export dropdown to each document card/view:
- Button: "⬇ Export" with dropdown: DOCX, Markdown, PDF
- DOCX → `fetch('/api/documents/export', { method: 'POST', body: { document_id, format: 'docx' } })` → trigger browser download
- Markdown → same fetch, trigger download
- PDF → `window.print()` with print-optimized CSS

### Deployment Checklist — Phase 20A

- [ ] Migration 101 applied to Supabase
- [ ] No new env vars needed
- [ ] `html-to-docx` already installed — verify in `node_modules`

### SMOKE TEST — Phase 20A

- [ ] Generate a blog post in Doc Studio → click "⬇ Export" → DOCX downloads → opens in Word/Google Docs without corruption
- [ ] Export same doc as Markdown → valid `.md` file
- [ ] Export as PDF → print dialog opens with clean formatting
- [ ] Check `documents` table → `export_history` has one entry per export
- [ ] In chat, type "generate a session close document" → response includes download link → link works

---

## Phase 20B — Langfuse Cost Visibility

> Q-20B.1: What gets built?
> A: Wrapper function that traces every AI call through Langfuse. Cost dashboard showing spend per model, per route, per day.

> Q-20B.2: What DB changes?
> A: None. Langfuse is external SaaS.

> Q-20B.3: What existing code preserved vs replaced?
> A: All AI-calling routes PRESERVED. Each gets a `traceAI()` wrapper added around the SDK call — no logic changes.

> Q-20B.4: Verification step?
> A: SMOKE TEST block below.

> Q-20B.5: What does this gate?
> A: Nothing directly, but cost visibility is required before charging customers (locked decision).

### Library: `src/lib/langfuse.ts`

```typescript
import { Langfuse } from 'langfuse';

let langfuseInstance: Langfuse | null = null;

function getLangfuse(): Langfuse | null {
  if (!process.env.LANGFUSE_PUBLIC_KEY || !process.env.LANGFUSE_SECRET_KEY) return null;
  if (!langfuseInstance) {
    langfuseInstance = new Langfuse({
      publicKey: process.env.LANGFUSE_PUBLIC_KEY,
      secretKey: process.env.LANGFUSE_SECRET_KEY,
      baseUrl: process.env.LANGFUSE_HOST || 'https://cloud.langfuse.com',
    });
  }
  return langfuseInstance;
}

/**
 * Wraps an AI call with Langfuse tracing. Non-fatal — if Langfuse is
 * not configured or errors, the AI call still completes.
 */
export async function traceAI<T>(
  name: string,
  metadata: { model: string; route: string },
  fn: () => Promise<T>
): Promise<T> {
  const lf = getLangfuse();
  if (!lf) return fn();

  const trace = lf.trace({ name, metadata });
  const generation = trace.generation({
    name,
    model: metadata.model,
    metadata: { route: metadata.route },
  });

  try {
    const result = await fn();
    generation.end({ output: 'completed' });
    return result;
  } catch (error) {
    generation.end({ output: 'error', metadata: { error: String(error) } });
    throw error;
  } finally {
    await lf.flushAsync().catch(() => {}); // non-fatal
  }
}
```

### Route: `/api/costs/route.ts`

**File:** `src/app/api/costs/route.ts`
**Method:** GET `?period=today|week|month`

```typescript
const costQuerySchema = z.object({
  period: z.enum(['today', 'week', 'month']).default('today'),
});
```

**Logic:**
1. Parse query params
2. Call Langfuse SDK to fetch traces for the period
3. Aggregate by model, by route
4. Return `{ total_cost_usd, by_model: Record<string, number>, by_route: Record<string, number>, traces: CostEntry[] }`

### Routes to Modify (add `traceAI()` wrapper)

These 6 routes make AI calls and should be wrapped. **Add the wrapper around the SDK call only — do not change any other logic.**

| Route | AI Call | Model |
|---|---|---|
| `src/app/api/chat/route.ts` | Anthropic / OpenAI | Varies |
| `src/app/api/chat/council/route.ts` | Anthropic + OpenAI | 5 models |
| `src/app/api/documents/generate/route.ts` | Claude Sonnet 4.6 | sonnet |
| `src/app/api/social/generate/route.ts` | Claude Sonnet 4.6 | sonnet |
| `src/app/api/email/categorize/route.ts` | Claude Haiku 4.5 | haiku |
| `src/app/api/briefs/generate/route.ts` | Claude Sonnet + Haiku | both |

**Token budget note:** Chat and Council routes can produce 2K–8K output tokens per call. Monitor via Langfuse dashboard for anomalies.

### UI: Cost Tab in Debug Panel

**File:** `src/components/debug-panel.tsx`

Add 5th tab: "💰 Costs"
- Fetches `/api/costs?period=today`
- Shows: total spend today, breakdown by model (pie/bar), breakdown by route
- Period selector: Today | This Week | This Month

### Deployment Checklist — Phase 20B

- [ ] `LANGFUSE_PUBLIC_KEY` set in Vercel env vars
- [ ] `LANGFUSE_SECRET_KEY` set in Vercel env vars
- [ ] `LANGFUSE_HOST` set in Vercel env vars (or defaults to `https://cloud.langfuse.com`)
- [ ] `npm install langfuse` (check if already in package.json first)

### SMOKE TEST — Phase 20B

- [ ] Send a chat message → check Langfuse dashboard → trace appears with model, tokens, cost
- [ ] Open Debug Panel → Costs tab → shows today's spend > $0.00
- [ ] Generate a Doc Studio document → appears as a separate trace in Langfuse
- [ ] Kill `LANGFUSE_PUBLIC_KEY` env var → all AI calls still work (non-fatal fallback)

---

## Phase 20C — Brand Voice in Doc Studio

> Q-20C.1: What gets built?
> A: Doc Studio's generate form gets a brand voice selector. Selected voice is injected into the generation system prompt.

> Q-20C.2: What DB changes?
> A: None. Uses existing `brand_voices` table.

> Q-20C.3: Preserved vs replaced?
> A: Doc Studio generation route MODIFIED (brand voice added to system prompt). All other logic PRESERVED.

> Q-20C.4: Verification?
> A: SMOKE TEST below.

> Q-20C.5: Gates?
> A: Nothing. Standalone improvement.

### Route Modification

**File:** `src/app/api/documents/generate/route.ts`

**BEFORE:** System prompt assembled from `buildLiveContext()` + doc type prompt.
**AFTER:** If `brand_voice_id` is provided in request body, fetch that brand voice from Supabase `brand_voices` table and prepend to system prompt: `"BRAND VOICE: Write in this voice:\n${brand_voice.voice_text}\n\n"`.

Add to the existing Zod schema:
```typescript
brand_voice_id: z.string().uuid().optional(),
```

### UI Changes

**File:** `src/app/doc-studio/page.tsx`

Add dropdown above the "Generate" button:
- Label: "Brand Voice (optional)"
- Options: fetched from `/api/brand-voices` on mount
- Default: "None (default voice)"
- Selected value passed as `brand_voice_id` in generate request

> ⚠️ GOTCHA: All NCHO brand voice prompts MUST use "your child" — never "your student." This is A/B tested and locked. Enforce at prompt injection level as a safety net regardless of brand voice text content. If the selected brand voice is NCHO, append to system prompt: "IMPORTANT: Always say 'your child' — never 'your student' or 'the learner.'"

### SMOKE TEST — Phase 20C

- [ ] Open Doc Studio → brand voice dropdown shows all 4 voices (NCHO, SomersSchool, Alana Terry, Scott Personal)
- [ ] Generate a blog post with "NCHO" voice → output says "your child" instead of "your student", uses warm teacher tone
- [ ] Generate same blog post with "Alana Terry" voice → output is personal, story-forward, faith-comfortable
- [ ] Generate with "None" selected → output uses default Doc Studio style (same as before this phase)

---

## Phase 21A — Outline-First Generation

> Q-21A.1: What gets built?
> A: Before generating a full document, optionally generate a structural outline first. User can reorder/edit sections, then generate the full document from the outline.

> Q-21A.2: What DB changes?
> A: Migration adds `outline`, `version`, and `edit_history` columns to `documents`.

> Q-21A.3: Preserved vs replaced?
> A: Existing "generate directly" flow PRESERVED. Outline is an OPTIONAL pre-step.

> Q-21A.4: Verification?
> A: SMOKE TEST below.

> Q-21A.5: Gates?
> A: Phase 26A–F (Cowork doc types) benefit from outline-first but don't require it.

### Migration 102

**File:** `supabase/migrations/20260413_102_add_document_outline_and_versioning.sql`

```sql
-- Phase 21A: Outline-first generation + version tracking
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS outline JSONB,
  ADD COLUMN IF NOT EXISTS version INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS edit_history JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN documents.outline IS 'DocumentOutline: {sections: OutlineSection[], generated_at, model}';
COMMENT ON COLUMN documents.version IS 'Incremented on each agentic edit (Phase 21B)';
COMMENT ON COLUMN documents.edit_history IS 'Array of {version, instruction, changed_at, model}';
```

### Route: `/api/documents/outline`

**File:** `src/app/api/documents/outline/route.ts`
**Method:** POST

```typescript
const outlineSchema = z.object({
  doc_type: z.string(),
  title: z.string().min(1).max(500),
  fields: z.record(z.unknown()).optional(),
  brand_voice_id: z.string().uuid().optional(),
});
```

**Logic:**
1. Validate with `outlineSchema.parse(body)`
2. Look up doc type definition from `DOC_TYPES` in `src/lib/doc-type-prompts.ts`
3. Call Claude Haiku 4.5 with prompt: "Generate a structural outline for this [doc_type]. Return JSON: `{sections: [{title, guidance}]}`. Each section should have a clear title and a 1-sentence description of what belongs there."
4. Parse response as `DocumentOutline`
5. Return `{ outline }` — do NOT save to DB yet (user needs to approve/reorder first)

**Token budget:** Haiku outline generation ≈ 200–500 output tokens. Cost: ~$0.001/outline.

### Route Modification: `/api/documents/generate`

**File:** `src/app/api/documents/generate/route.ts`

**BEFORE:** Generates document from doc type + fields.
**AFTER:** If `outline` is provided in request body, inject it into the generation prompt: "Follow this outline structure exactly:\n\n[outline sections as numbered list]"

Add to existing Zod schema:
```typescript
outline: z.object({
  sections: z.array(z.object({
    id: z.string(),
    title: z.string(),
    guidance: z.string(),
    sort_order: z.number(),
  })),
}).optional(),
```

After generation, save `outline` to the `documents` row.

### UI Changes

**File:** `src/app/doc-studio/page.tsx`

Add checkbox: "📋 Generate outline first" (default: unchecked).

When checked:
1. "Generate" button first calls `/api/documents/outline`
2. Display outline as draggable card list (use existing drag patterns or simple up/down arrows — do NOT add `dnd-kit` unless already installed)
3. Each card shows section title + guidance text, both editable inline
4. "Generate Full Document" button appears below the outline → calls existing generate route with `outline` in body
5. "Skip Outline" link reverts to direct generation

**⚠️ GOTCHA:** Check if `dnd-kit` or `@dnd-kit/core` is in `package.json`. If not, use simple "Move Up" / "Move Down" buttons instead. Do NOT add a dependency for this.

### SMOKE TEST — Phase 21A

- [ ] Check "Generate outline first" → click Generate → outline appears with 4–8 sections
- [ ] Reorder sections (drag or arrows) → order is preserved
- [ ] Edit a section title inline → change persists
- [ ] Click "Generate Full Document" → full document follows the outline structure
- [ ] Uncheck "Generate outline first" → direct generation works exactly as before (regression test)

---

## Phase 21B — Agentic Document Editing

> Q-21B.1: What gets built?
> A: Natural language editing of existing documents. "Make the introduction more concise" → AI rewrites just that section. Version tracking with undo.

> Q-21B.2: What DB changes?
> A: Uses `version` and `edit_history` columns from Migration 102 (Phase 21A).

> Q-21B.3: Preserved vs replaced?
> A: Original document content PRESERVED in `edit_history`. Each edit creates a new version.

> Q-21B.4: Verification?
> A: SMOKE TEST below.

> Q-21B.5: Gates?
> A: Nothing. Standalone.

### Route: `/api/documents/edit`

**File:** `src/app/api/documents/edit/route.ts`
**Method:** POST

```typescript
const editSchema = z.object({
  document_id: z.string().uuid(),
  instruction: z.string().min(1).max(2000),
  expected_version: z.number().int().positive(),
});
```

**Logic:**
1. Validate with `editSchema.parse(body)`
2. Fetch document, check ownership via `auth.uid()`
3. **Optimistic locking:** Compare `expected_version` with current `version`. If mismatch → return `409 Conflict` with `{ error: 'Document has been modified. Refresh and try again.', current_version: doc.version }`
4. Call Claude Sonnet 4.6: "Here is a document:\n\n${doc.content}\n\nEdit instruction: ${instruction}\n\nReturn the COMPLETE edited document. Do not summarize or truncate."
5. Append to `edit_history`: `{ version: doc.version, instruction, changed_at: new Date().toISOString(), previous_content: doc.content, model: 'claude-sonnet-4-6' }`
6. Update document: `content = new_content`, `version = version + 1`
7. Return `{ content, version }`

**⚠️ GOTCHA:** The optimistic locking via `expected_version` prevents two browser tabs from clobbering each other's edits. The UI must send the current version number with every edit request.

### UI Changes

**File:** `src/app/doc-studio/page.tsx`

When viewing a generated document:
- Show edit bar below document: text input "✏️ Edit this document..." + "Apply" button
- Version indicator in document header: "v3 · 2 edits"
- "↩ Revert" button → shows edit history sidebar → click any version to restore
- Edit history sidebar: list of `{instruction, changed_at}` entries, newest first

### SMOKE TEST — Phase 21B

- [ ] Generate a document → type "Make the introduction shorter" → document updates → version shows "v2 · 1 edit"
- [ ] Apply another edit → version shows "v3 · 2 edits"
- [ ] Click "↩ Revert" → see edit history → click v1 → document restores to original
- [ ] Open same document in two tabs → edit in tab A → edit in tab B → tab B gets 409 conflict with "refresh and try again"
- [ ] Check `documents` table → `edit_history` JSONB has complete trail

---

## Phase 21C — Voice Sample Analysis

> Q-21C.1: What gets built?
> A: Paste 3–5 samples of a brand's writing → AI extracts the voice/tone/style → creates or updates a brand voice entry.

> Q-21C.2: What DB changes?
> A: None. Uses existing `brand_voices` table.

> Q-21C.3: Preserved vs replaced?
> A: Brand voices PRESERVED. This adds an analysis tool, not a replacement.

> Q-21C.4: Verification?
> A: SMOKE TEST below.

> Q-21C.5: Gates?
> A: Nothing. Standalone.

### Route: `/api/brand-voices/analyze`

**File:** `src/app/api/brand-voices/analyze/route.ts`
**Method:** POST

```typescript
const analyzeSchema = z.object({
  samples: z.array(z.string().min(50).max(5000)).min(1).max(5),
  brand_name: z.string().optional(),
});
```

**Logic:**
1. Validate with `analyzeSchema.parse(body)`
2. Call Claude Haiku 4.5: "Analyze these writing samples and extract the brand voice. Describe: tone, vocabulary patterns, sentence structure, emotional register, what the writer avoids, and what makes this voice distinctive. Return a single cohesive voice description suitable for use as an AI writing prompt."
3. Return `{ voice_text, brand_name }`

**Token budget:** Haiku analysis of 5 samples ≈ 500–1000 output tokens. Cost: ~$0.002/analysis.

### UI Changes

**File:** `src/app/settings/page.tsx` (BrandVoicesPanel component area)

Add "🔍 Analyze Voice" button next to each brand voice:
- Opens modal with textarea: "Paste 3–5 writing samples (one per paste, separated by ---)"
- "Analyze" button → calls `/api/brand-voices/analyze`
- Shows extracted voice text
- "Apply to [brand]" button → PATCHes the brand voice with the new text
- "Create New Voice" option if analyzing a new brand

### SMOKE TEST — Phase 21C

- [ ] Paste 3 Anna blog posts in the analyzer → extracted voice mentions "personal", "faith", "story" patterns
- [ ] Click "Apply to Alana Terry" → brand voice updated in Supabase
- [ ] Generate a blog post with the updated Alana Terry voice → output matches the analyzed style

---

## Phase 22A — @Council Floating Button

> Q-22A.1: What gets built?
> A: Floating button (bottom-right) available on every page. Click to get quick input from any Council member on whatever you're looking at.

> Q-22A.2: What DB changes?
> A: None.

> Q-22A.3: Preserved vs replaced?
> A: Full Council at `/council` PRESERVED. This is a quick-consult shortcut, not a replacement.

> Q-22A.4: Verification?
> A: SMOKE TEST below.

> Q-22A.5: Gates?
> A: Nothing. Standalone.

### Route: `/api/council/quick`

**File:** `src/app/api/council/quick/route.ts`
**Method:** POST

```typescript
const quickCouncilSchema = z.object({
  member: z.enum(['gandalf', 'data', 'polgara', 'earl', 'silk', 'all']),
  question: z.string().min(1).max(2000),
  page_context: z.string().optional(),  // current page URL or content snippet
});
```

**Logic:**
1. Validate with `quickCouncilSchema.parse(body)`
2. Build system prompt using the selected member's persona from the Council prompt constants
3. If `page_context` provided, append: "Context from the page the user is currently viewing:\n${page_context}"
4. Call appropriate model (Gandalf/Data/Polgara → Claude Sonnet 4.6, Earl → GPT-5.4, Silk → gpt-5-mini)
5. If `member === 'all'`, run all 5 in parallel and return combined

> ⚠️ GOTCHA: Quick-consult `'all'` mode fires all 5 members **independently in parallel** — each member gives a standalone take on the question. This is NOT a full Council session (which is sequential: Gandalf→Data→Polgara→Earl→Silk, each building on the prior). The parallel approach is intentional here: quick-consult is a 2-second sidebar answer, not a 6-pass curriculum factory run.
>
> **Token budget:** Single-member quick-consult ≈ ~$0.004–0.01 per click. `'all'` mode (3× Sonnet 4.6 + GPT-5.4 + gpt-5-mini in parallel) ≈ **~$0.02–0.06 per click** depending on question length. Monitor frequency in Langfuse — `all` mode at high click-rate is where this route gets expensive.
>
> **Parallel failure resilience:** Use `Promise.allSettled()` — not `Promise.all()` — when running `'all'` mode. If one model call fails or times out (e.g., GPT-5.4 under load), `Promise.all()` throws and the user gets nothing. `Promise.allSettled()` returns the 4 successful responses and marks the failed one as `{ status: 'rejected', reason: ... }` — filter for `status === 'fulfilled'` and return whatever resolved. Never let one flaky model zero out the entire response.

6. Return `{ member, response }`

### Component: `CouncilPopover.tsx`

**File:** `src/components/council-popover.tsx`

Fixed position bottom-right (`fixed bottom-6 right-6 z-50`). Contains:
- Trigger button: Council icon (⚔️ or custom)
- Popover panel (320px wide): 6 member buttons with emoji indicators:
  - 🧙 Gandalf | 🤖 Data | 🦉 Polgara | 🐺 Earl | 🐀 Silk | ✨ All
- Text input below: "Ask the Council..."
- Keyboard shortcut: `Ctrl+Shift+C`
- Response area below input showing formatted response

**File:** `src/app/layout.tsx` — Add `<CouncilPopover />` inside the authenticated layout wrapper.

### SMOKE TEST — Phase 22A

- [ ] Navigate to Doc Studio → Council button visible bottom-right
- [ ] Click 🧙 → type "Is this outline structure solid?" → Gandalf responds in character
- [ ] Navigate to /intel → click 🐺 Earl → "What should I build next?" → Earl gives operational priorities
- [ ] Press Ctrl+Shift+C → popover opens (keyboard shortcut works)
- [ ] Click ✨ All → all 5 members respond

---

## Phase 22B — Unified Cross-Source Search

> Q-22B.1: What gets built?
> A: Global search bar that searches across 6 tables simultaneously: tasks, research, opportunities, threads, briefs, documents.

> Q-22B.2: What DB changes?
> A: None. Uses existing ILIKE queries.

> Q-22B.3: Preserved vs replaced?
> A: Existing header search in `chapterhouse-shell.tsx` REPLACED with the new unified search. If no existing search exists, this is net-new.

> Q-22B.4: Verification?
> A: SMOKE TEST below.

> Q-22B.5: Gates?
> A: Nothing. Standalone.

**Search ranking note:** Initial implementation uses ILIKE across 6 parallel queries. For future improvement: add `pg_trgm` extension for trigram similarity scoring. This is a database-level upgrade that doesn't require code changes — document as a TODO, don't build now.

### Route: `/api/search/route.ts`

**File:** `src/app/api/search/route.ts`
**Method:** GET `?q=<query>&limit=30`

```typescript
const searchSchema = z.object({
  q: z.string().min(3).max(200),
  limit: z.coerce.number().min(1).max(50).default(30),
});
```

**Logic:**
1. Validate query params
2. Run 6 parallel Supabase queries (max 5 results each):
   - `tasks` → search `title` ILIKE
   - `research_items` → search `title, source_url` ILIKE
   - `opportunities` → search `title, description` ILIKE
   - `chat_threads` → search `title` ILIKE
   - `briefs` → search `title` ILIKE (if applicable) or content
   - `documents` → search `title, content` ILIKE
3. Normalize results to `SearchResult[]` with `type`, `title`, `snippet` (first 200 chars), `updated_at`, `url` (internal route)
4. Sort merged results by `updated_at` DESC
5. Return `{ results: SearchResult[], total }`

### Component: `UnifiedSearch.tsx`

**File:** `src/components/unified-search.tsx`

- Expandable search input in the header bar
- Debounce: 300ms after typing stops
- Minimum 3 characters to trigger search
- Results dropdown: grouped by type with color-coded badges (same colors as existing search if present)
- Click result → navigate to the relevant page
- Escape key → close dropdown
- Loading spinner while searching

**File:** `src/components/chapterhouse-shell.tsx` — Replace or add `<UnifiedSearch />` in the header area.

### SMOKE TEST — Phase 22B

- [ ] Type "gimli" in search → results from research, documents, tasks (if any mention Gimli)
- [ ] Results show type badges (📋 Task, 📄 Document, 🔬 Research, etc.)
- [ ] Click a result → navigates to correct page
- [ ] Type 2 characters → no search fires (minimum 3)
- [ ] Type and wait → search fires after 300ms debounce

---

## Phase 23A — Knowledge Base UI

> Q-23A.1: What gets built?
> A: Full CRUD UI for `context_files` — the documents that form the AI's system prompt. Killer feature: preview exactly what the AI sees.

> Q-23A.2: What DB changes?
> A: None. Uses existing `context_files` table.

> Q-23A.3: Preserved vs replaced?
> A: Existing `context_files` table and `getSystemPrompt()` PRESERVED. This adds a management UI.

> Q-23A.4: Verification?
> A: SMOKE TEST below.

> Q-23A.5: Gates?
> A: Nothing. Standalone.

### Routes: `/api/knowledge/`

**File:** `src/app/api/knowledge/route.ts`
**Methods:** GET (list all), POST (create new)

**File:** `src/app/api/knowledge/[id]/route.ts`
**Methods:** PUT (update), DELETE

**File:** `src/app/api/knowledge/preview/route.ts`
**Method:** GET — Calls `getSystemPrompt()` and returns the full assembled system prompt. This is the killer feature: Scott can see EXACTLY what the AI sees.

All routes: standard Supabase CRUD with `auth.uid()` verification. Zod validation on create/update.

### Page: `/knowledge`

**File:** `src/app/knowledge/page.tsx`

- Left panel: list of context_files sorted by `inject_order`
- Right panel: editor for selected file (title, content textarea, inject_order number, is_active toggle)
- "👁 Preview System Prompt" button → opens full-width modal showing the assembled system prompt exactly as the AI receives it
- "Add New" button → creates empty context_file

**File:** `src/lib/navigation.ts` — Add `/knowledge` to the System navigation group.

### SMOKE TEST — Phase 23A

- [ ] Navigate to /knowledge → see all context_files listed by inject_order
- [ ] Edit a file's content → save → verify in Supabase
- [ ] Click "👁 Preview System Prompt" → see complete assembled system prompt
- [ ] Toggle a file inactive → preview no longer includes it
- [ ] Send a chat message → AI behavior reflects the active context files

---

## Phase 23B — Watch URLs

> Q-23B.1: What gets built?
> A: Track specific URLs for content changes. When content changes (detected by MD5 hash), notify via the Intel system.

> Q-23B.2: What DB changes?
> A: New `watch_urls` table.

> Q-23B.3: Preserved vs replaced?
> A: Intel cron at `/api/cron/intel-fetch/` MODIFIED to also check watch URLs. Existing Intel logic PRESERVED.

> Q-23B.4: Verification?
> A: SMOKE TEST below.

> Q-23B.5: Gates?
> A: Nothing. Standalone.

### Migration 103

**File:** `supabase/migrations/20260413_103_create_watch_urls.sql`

```sql
-- Phase 23B: Watch URL tracking
CREATE TABLE watch_urls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  url TEXT NOT NULL,
  label TEXT NOT NULL,
  check_interval TEXT NOT NULL DEFAULT 'daily'
    CHECK (check_interval IN ('daily', 'weekly', 'monthly')),
  last_checked_at TIMESTAMPTZ,
  last_content_hash TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE watch_urls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own watch URLs"
  ON watch_urls FOR ALL
  USING (auth.uid() = user_id);

CREATE INDEX watch_urls_active_idx ON watch_urls (is_active) WHERE is_active = true;
```

**⚠️ GOTCHA — SSRF Prevention:** The Intel cron that checks watch URLs MUST validate each URL before fetching:
- Block internal IPs: `127.x.x.x`, `10.x.x.x`, `172.16-31.x.x`, `169.254.x.x`, `192.168.x.x`
- Block `localhost`, `0.0.0.0`
- Only allow `http://` and `https://` schemes
- Implement URL validation BEFORE the `fetch()` call

### Routes: `/api/watch-urls/`

**File:** `src/app/api/watch-urls/route.ts` — GET (list active), POST (create)
**File:** `src/app/api/watch-urls/[id]/route.ts` — PUT (update), DELETE

Create Zod schema:
```typescript
const watchUrlSchema = z.object({
  url: z.string().url().max(2048),
  label: z.string().min(1).max(200),
  check_interval: z.enum(['daily', 'weekly', 'monthly']),
});
```

### Cron Modification

**File:** `src/app/api/cron/intel-fetch/route.ts`

**BEFORE:** Fetches 5 watch sources.
**AFTER:** After existing source fetch, also query `watch_urls` where `is_active = true` and `check_interval` matches (daily = every run, weekly = if last_checked > 7 days, monthly = > 30 days). For each:
1. **Validate URL against SSRF blocklist** (see GOTCHA above)
2. Fetch URL content
3. Compute MD5 hash of response body
4. Compare with `last_content_hash`
5. If different → create Intel session with `source_type: 'watch_url'`, label: `"Watch: ${label}"`, url
6. Update `last_checked_at` and `last_content_hash`

### UI: Watch URLs Panel

**File:** `src/app/intel/page.tsx`

Add "📡 Watch URLs" panel (collapsible) above or below the session list:
- List of watch URLs with status indicators: 🟢 active, 🔴 last check failed, ⚪ never checked
- "Add URL" form (url, label, interval dropdown)
- Edit/delete per URL
- Last checked timestamp

### SMOKE TEST — Phase 23B

- [ ] Add a watch URL (e.g., a competitor's blog) → appears in list as ⚪
- [ ] Trigger intel cron manually → URL checked → status becomes 🟢 → `last_content_hash` populated
- [ ] Trigger cron again (content unchanged) → no new Intel session created
- [ ] Manually change `last_content_hash` to something wrong → trigger cron → new Intel session created with "Watch: [label]"
- [ ] Try to add `http://127.0.0.1/admin` → SSRF validation rejects it

---

## Phase 23C — Intel → Task Bridge

> Q-23C.1: What gets built?
> A: One-click "Create Task" button on intel findings. Uses existing tasks API.

> Q-23C.2: What DB changes?
> A: None. Uses existing `tasks` table.

> Q-23C.3: Preserved vs replaced?
> A: Intel report viewer MODIFIED (button added). Tasks API PRESERVED (existing POST route used).

> Q-23C.4: Verification?
> A: SMOKE TEST below.

> Q-23C.5: Gates?
> A: Nothing. Standalone.

### UI Changes

**File:** `src/app/intel/page.tsx`

In the Intel report viewer, next to each finding/item:
- Add "→ Task" button (small, inline)
- On click: POST to `/api/tasks` with `{ title: finding.headline, description: finding.detail, source_type: 'intel', source_id: intel_session_id }`
- Success toast: "Task created" with link to `/tasks`
- Button changes to "✓ Task created" (disabled) after successful creation

### SMOKE TEST — Phase 23C

- [ ] Open an Intel report with findings → "→ Task" button visible on each finding
- [ ] Click "→ Task" on a finding → toast "Task created" appears → button changes to "✓ Task created"
- [ ] Navigate to /tasks → new task exists with title matching the finding headline

---

## Phase 24A — ElevenLabs TTS Wiring

> Q-24A.1: What gets built?
> A: TTS API route, reusable library, and `<ListenButton>` component. Audio cached to avoid re-generation.

> Q-24A.2: What DB changes?
> A: None. Audio URLs stored inline on existing tables (e.g., `folio_entries.audio_url` if needed, but initially cached client-side via the Cloudinary URL returned from the API).

> Q-24A.3: Preserved vs replaced?
> A: Existing voice studio at `/voice-studio` PRESERVED. This adds a lightweight TTS path separate from the full studio.

> Q-24A.4: Verification?
> A: SMOKE TEST below.

> Q-24A.5: Gates?
> A: Phase 24B depends on this.

### Library: `src/lib/tts.ts`

```typescript
// src/lib/tts.ts

const ELEVENLABS_BASE = 'https://api.elevenlabs.io/v1';
const MAX_CHARS = 5000; // Cost guard — locked decision

export async function textToSpeech(
  text: string,
  voiceId?: string
): Promise<Buffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error('ELEVENLABS_API_KEY not configured');

  if (text.length > MAX_CHARS) {
    throw new Error(`Text exceeds ${MAX_CHARS} character limit (got ${text.length}). Split into smaller chunks.`);
  }

  const voice = voiceId || process.env.ELEVENLABS_DEFAULT_VOICE_ID || 'JBFqnCBsd6RMkjVDRZzb'; // George default

  const response = await fetch(`${ELEVENLABS_BASE}/text-to-speech/${voice}`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text,
      model_id: 'eleven_multilingual_v2',
      voice_settings: { stability: 0.5, similarity_boost: 0.75 },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ElevenLabs API error: ${response.status} ${error}`);
  }

  return Buffer.from(await response.arrayBuffer());
}
```

### Route: `/api/audio/generate`

**File:** `src/app/api/audio/generate/route.ts`
**Method:** POST

```typescript
const audioSchema = z.object({
  text: z.string().min(1).max(5000),
  voice_id: z.string().optional(),
  upload_to_cloudinary: z.boolean().default(true),
});
```

**Logic:**
1. Validate with `audioSchema.parse(body)`
2. Call `textToSpeech(text, voice_id)`
3. If `upload_to_cloudinary`:
   - Upload audio buffer to Cloudinary as `audio/mpeg`
   - Return `{ audio_url: cloudinary_url }`
4. Else: return audio buffer directly with `Content-Type: audio/mpeg`

> ⚠️ GOTCHA — Cloudinary `resource_type` for audio: Cloudinary's `uploader.upload()` defaults to `resource_type: 'image'`, which rejects audio files. For audio uploads, **always pass `{ resource_type: 'video' }` explicitly** — Cloudinary uses `'video'` as the resource type for all non-image binary media (audio included). Without this, the upload will fail or throw. Example: `cloudinary.uploader.upload(dataURI, { resource_type: 'video', folder: 'audio' })`.

### Component: `ListenButton.tsx`

**File:** `src/components/listen-button.tsx`

Props: `{ text: string; audioUrl?: string; className?: string }`

**Logic:**
1. If `audioUrl` exists → use it directly (cached)
2. If no `audioUrl` → on click, call `/api/audio/generate` with `text`
3. Show spinner during generation
4. Once audio is ready, show standard HTML5 audio controls (play/pause/scrubber)
5. Cache the generated `audio_url` in component state to avoid re-generation

### Deployment Checklist — Phase 24A

- [ ] `ELEVENLABS_API_KEY` set in Vercel env vars
- [ ] `ELEVENLABS_DEFAULT_VOICE_ID` set in Vercel env vars

### SMOKE TEST — Phase 24A

- [ ] Call `/api/audio/generate` with 100 chars of text → returns Cloudinary URL → audio plays
- [ ] Call with 6000 chars → returns 400 error "exceeds 5000 character limit"
- [ ] Remove `ELEVENLABS_API_KEY` env var → returns 500 "not configured"
- [ ] `<ListenButton>` shows spinner during generation → plays audio after

---

## Phase 24B — Audio on Key Content Types

> Q-24B.1: What gets built?
> A: `<ListenButton>` added to Folio entries, Intel reports, and Doc Studio documents.

> Q-24B.2: What DB changes?
> A: None.

> Q-24B.3: Preserved vs replaced?
> A: Pages MODIFIED (button added). All other logic PRESERVED.

> Q-24B.4: Verification?
> A: SMOKE TEST below.

> Q-24B.5: Gates?
> A: Nothing. Standalone after 24A.

### UI Changes

| Page | File | What to add |
|---|---|---|
| Folio | `src/app/folio/page.tsx` | `<ListenButton text={entry.narrative} />` on each entry |
| Intel | `src/app/intel/page.tsx` | `<ListenButton text={session.summary} />` on report header |
| Doc Studio | `src/app/doc-studio/page.tsx` | `<ListenButton text={document.content} />` on document view |

**⚠️ GOTCHA:** Folio narratives and documents can exceed 5000 chars. The `<ListenButton>` should truncate to 5000 chars with a note: "Audio covers first ~5000 characters." Long-term solution: chunk and concatenate. For now, truncate.

### SMOKE TEST — Phase 24B

- [ ] Open a Folio entry → 🔊 Listen button visible → plays audio summary
- [ ] Open an Intel report → 🔊 Listen button visible → plays summary
- [ ] Open a Doc Studio document → 🔊 Listen button visible → plays content
- [ ] Long document (>5000 chars) → audio plays first 5000 chars, no error

---

## Phase 25A — Performance Prediction Scoring

> Q-25A.1: What gets built?
> A: AI-predicted engagement score (0–100) on every social post. Analytics backfill from Buffer. Score badges in Review Queue.

> Q-25A.2: What DB changes?
> A: Migration adds `engagement_data` and `predicted_score` to `social_posts`.

> Q-25A.3: Preserved vs replaced?
> A: Social generation and Review Queue PRESERVED. Prediction and analytics are additive.

> This phase completes the **Analytics** stage of the Integrated Production Loop: TRIGGER → Content → Creative → Review → Tasks → **Analytics**.

> Q-25A.4: Verification?
> A: SMOKE TEST below.

> Q-25A.5: Gates?
> A: Phase 25B (Boost) uses the engagement data for rewrite context.

### Migration 104

**File:** `supabase/migrations/20260413_104_add_social_engagement_prediction.sql`

```sql
-- Phase 25A: Social performance prediction + engagement data
ALTER TABLE social_posts
  ADD COLUMN IF NOT EXISTS engagement_data JSONB,
  ADD COLUMN IF NOT EXISTS predicted_score FLOAT;

COMMENT ON COLUMN social_posts.engagement_data IS '{reach, clicks, likes, comments, shares, fetched_at}';
COMMENT ON COLUMN social_posts.predicted_score IS 'AI-predicted engagement score 0-100';
```

### Route: `/api/social/predict`

**File:** `src/app/api/social/predict/route.ts`
**Method:** POST

```typescript
const predictSchema = z.object({
  post_id: z.string().uuid(),
});
```

**Logic:**
1. Fetch the post from `social_posts`
2. Call Claude Haiku 4.5: "Score this social media post for predicted engagement (0-100). Consider: platform (${post.platform}), brand (${post.brand}), content quality, hook strength, CTA presence, hashtag relevance. Return JSON: {score: number, reasoning: string, suggestions: string[]}"
3. Update `predicted_score` on the post
4. Return `{ score, reasoning, suggestions }`

**Token budget:** Haiku scoring ≈ 200–400 output tokens. Cost: ~$0.001/prediction.

### Route Modification: `/api/social/generate`

**File:** `src/app/api/social/generate/route.ts`

**AFTER** generating posts, auto-predict each new post:
```typescript
// After inserting posts, fire-and-forget prediction on each
for (const post of insertedPosts) {
  fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/social/predict`, {
    method: 'POST',
    body: JSON.stringify({ post_id: post.id }),
  }).catch(() => {}); // non-fatal
}
```

### Route: `/api/social/analytics`

**File:** `src/app/api/social/analytics/route.ts`
**Method:** POST (cron-compatible)

**Logic:**
1. Fetch all `social_posts` where `status = 'published'` AND `buffer_update_id IS NOT NULL` AND (`engagement_data IS NULL` OR `engagement_data->>'fetched_at' < now() - interval '24 hours'`)
2. For each post, query Buffer GraphQL for post stats
3. Update `engagement_data` JSONB: `{reach, clicks, likes, comments, shares, fetched_at: now()}`

> ⚠️ GOTCHA: Wrap each post's Buffer GraphQL call in individual `try/catch`. A deleted post, 404, or transient 429 should log a warning and skip that post — not abort the entire batch. `BUFFER_ACCESS_TOKEN` is a static PAT (does not expire on a schedule), but transient API failures are real. Pattern: `for (const post of posts) { try { ...fetch stats... } catch (err) { console.warn(\`analytics skip ${post.id}: ${err}\`); continue; } }`

### Cron Entry

**File:** `vercel.json`

Add to crons array:
```json
{ "path": "/api/social/analytics", "schedule": "0 6 * * *" }
```

### UI: Score Badges in Review Queue

**File:** `src/components/social-review-queue.tsx`

On each post card, show predicted score badge:
- 🟢 > 70 (green badge)
- 🟡 40–70 (amber badge)
- 🔴 < 40 (red badge)
- No badge if `predicted_score` is null

### SMOKE TEST — Phase 25A

- [ ] Generate a social post → `predicted_score` auto-populated within seconds
- [ ] Review Queue shows score badge (green/amber/red)
- [ ] Manually trigger `/api/social/analytics` → `engagement_data` populated for published posts
- [ ] Cron fires at 06:00 UTC → analytics updated automatically

---

## Phase 25B — "Boost This Post"

> Q-25B.1: What gets built?
> A: AI rewrite of underperforming posts using top-performing posts as examples.

> Q-25B.2: What DB changes?
> A: None. Uses existing `edit_history` JSONB on `social_posts`.

> Q-25B.3: Preserved vs replaced?
> A: Original post text PRESERVED in `edit_history`. Boost creates a new version.

> Q-25B.4: Verification?
> A: SMOKE TEST below.

> Q-25B.5: Gates?
> A: Nothing. Standalone after 25A.

### Route: `/api/social/boost`

**File:** `src/app/api/social/boost/route.ts`
**Method:** POST

```typescript
const boostSchema = z.object({
  post_id: z.string().uuid(),
});
```

**Logic:**
1. Fetch the target post
2. Fetch top 10 published posts by engagement (highest `engagement_data->>'likes'` + `engagement_data->>'shares'`), same brand and platform
3. Call Claude Sonnet 4.6: "Here are 10 high-performing ${brand} ${platform} posts:\n\n${topPosts}\n\nRewrite this underperforming post to match the patterns that work:\n\n${targetPost.post_text}\n\nKeep the same topic and brand voice. Return: {boosted_text: string, changes: string[]}"
4. Save original to `edit_history`
5. Update `post_text` with boosted version
6. Return `{ boosted_text, changes }`

> ⚠️ GOTCHA: The AI rewrite must NOT fabricate metrics, testimonials, or product claims not present in the original post or source data. Per anti-hallucination standard (§Locked Decisions): all factual claims must be traceable to a source. Claims that can't be traced get flagged with ⚠️, not silently included. The boost prompt should instruct: "Improve style and engagement patterns. Do NOT add new factual claims, statistics, or testimonials that weren't in the original."

### UI Changes

**File:** `src/components/social-review-queue.tsx`

Add "⚡ Boost" button on each post card (next to approve/reject):
- On click → calls `/api/social/boost`
- Shows changes list after boost completes
- "↩ Undo" button → restores from `edit_history`

### SMOKE TEST — Phase 25B

- [ ] Click "⚡ Boost" on a post → text rewrites → changes list shown
- [ ] Click "↩ Undo" → original text restored
- [ ] Check `social_posts` table → `edit_history` has the pre-boost version

---

## Phase 25C — Grounded Mode Toggle

> Q-25C.1: What gets built?
> A: Toggle in chat that restricts AI to only reference information already in context. Reduces hallucination at the cost of flexibility.

> Q-25C.2: What DB changes?
> A: None.

> Q-25C.3: Preserved vs replaced?
> A: Chat route MODIFIED (system prompt prepend when grounded=true). All other logic PRESERVED.

> Q-25C.4: Verification?
> A: SMOKE TEST below.

> Q-25C.5: Gates?
> A: Nothing. Standalone.

### Route Modification

**File:** `src/app/api/chat/route.ts`

Add to request body schema:
```typescript
grounded: z.boolean().default(false),
```

When `grounded === true`, prepend to system prompt:
```
GROUNDED MODE ACTIVE: Only reference information that exists in the context provided below. 
If you don't have enough context to answer, say "I don't have that information in my current context." 
Do NOT generate facts, statistics, URLs, or claims from your training data.
This is a prompt-level instruction and does not guarantee factual accuracy.
```

> ⚠️ GOTCHA — Token cost: Grounded Mode prepends the restriction text AND relies on `buildLiveContext()` injecting all context files into every turn. If context files are large (50KB+), every Grounded Mode message carries that full payload as input tokens. Expect **2–5× normal token cost per message** when using Grounded Mode with a full context load. Consider showing a context-size indicator in the UI (e.g., "Context: ~42KB loaded") when Grounded Mode is active so Scott and Anna know when they're in expensive territory.

### UI Changes

**File:** Chat interface component (wherever the chat input lives — check `src/components/chat-interface.tsx` or the home page)

Add toggle in chat header:
- "🔒 Grounded Mode" toggle (default: off)
- Tooltip: "When on, AI only references information in its loaded context. This is a prompt-level limitation — not a guarantee."
- When on, send `grounded: true` in chat request body

### SMOKE TEST — Phase 25C

- [ ] Toggle Grounded Mode on → ask "What is my NCHO store URL?" → AI answers from context
- [ ] Toggle Grounded Mode on → ask "What is the population of Tokyo?" → AI says "I don't have that information in my current context"
- [ ] Toggle Grounded Mode off → ask "What is the population of Tokyo?" → AI answers normally
- [ ] Tooltip shows honest limitation text

---

## Phase 26 — Cowork Feature Bridge

> **Why this exists:** Scott is paying for Cowork ($X/mo) for document types that Chapterhouse's Doc Studio can generate better — because Doc Studio has `buildLiveContext()` which injects real business data. Cowork generates from generic prompts. Doc Studio generates from Scott's actual brands, pricing, competitors, and intel.

> Q-26.1: What gets built?
> A: 6 new document types in Doc Studio, replacing Cowork's core feature set.

> Q-26.2: What DB changes?
> A: Migration updates the `doc_type` CHECK constraint on `documents` table. Constraint auto-name: `documents_doc_type_check` (set by PostgreSQL from the unnamed inline CHECK in migration 030).

> Q-26.3: Preserved vs replaced?
> A: All 14 existing doc types PRESERVED (exact hyphenated slugs from migration 030). `academic_paper` — in `DOC_TYPE_MAP` since ~Phase 15 but never in the DB CHECK — is added here, closing the pre-existing live gap. 6 new Cowork types ADDED.

> Q-26.4: Verification?
> A: SMOKE TEST block below.

> Q-26.5: Gates?
> A: Requires Phase 21A (outline-first works with these types but is optional).

### Migration 105

**File:** `supabase/migrations/20260413_105_add_cowork_doc_types.sql`

**⚠️ GOTCHA — DROP CONSTRAINT Justification:** This migration drops the existing CHECK constraint and recreates it with additional values. This is NOT a destructive operation — it only adds accepted values, never removes them. No data is lost. This is the standard PostgreSQL pattern for extending CHECK constraints. Constraint name: `documents_doc_type_check` (auto-assigned by PostgreSQL from the unnamed inline check in migration 030 — column is `doc_type`, NOT `document_type`).

```sql
-- Phase 26: Add 6 Cowork Feature Bridge doc types
-- This is ADDITIVE — all existing doc types remain valid
-- Also adds 'academic_paper' which was in DOC_TYPE_MAP but missing from DB CHECK (pre-existing gap)

ALTER TABLE documents
  DROP CONSTRAINT IF EXISTS documents_doc_type_check;

ALTER TABLE documents
  ADD CONSTRAINT documents_doc_type_check CHECK (
    doc_type IN (
      -- Existing 14 types (PRESERVED — exact slugs from migration 030)
      'prd', 'arch-doc', 'blog-post', 'landing-copy',
      'spec', 'session-close', 'campaign-brief',
      'positioning', 'launch-checklist', 'market-sizing',
      'feedback-synthesis', 'study-guide',
      'report', 'brainstorm',
      -- academic_paper: in DOC_TYPE_MAP since ~Phase 15 but missing from DB CHECK
      -- Including here closes the pre-existing live schema gap
      'academic_paper',
      -- New Phase 26 types
      'campaign_plan',
      'email_sequence',
      'seo_audit',
      'competitive_brief',
      'status_report',
      'feature_spec'
    )
  );
```

### Doc Type Definitions

**File:** `src/lib/doc-type-prompts.ts` — Add to the `DOC_TYPES` array (line ~599):

#### 26A. Campaign Plan Generator (`campaign_plan`)

**Category:** `marketing`
**Fields:**
- `product_or_launch` (text, required): "What product or launch is this campaign for?"
- `target_audience` (text, required): "Who is this campaign targeting?"
- `budget` (text, optional): "Budget range (if applicable)"
- `timeline` (text, required): "Campaign timeline (e.g., 2 weeks, 1 month)"

**Why this beats Cowork:** `buildLiveContext()` injects NCHO product catalog, SomersSchool pricing, real customer avatar data. Cowork generates from a blank page.

#### 26B. Email Sequence Generator (`email_sequence`)

**Category:** `marketing`
**Fields:**
- `sequence_type` (select: welcome | nurture | launch | re-engagement | custom): "Type of email sequence"
- `num_emails` (number, default 5): "Number of emails in the sequence"
- `product_or_topic` (text, required): "What product or topic does this sequence cover?"
- `cta_goal` (text, required): "What action should the reader take?"

#### 26C. SEO Audit Generator (`seo_audit`)

**Category:** `marketing`
**Fields:**
- `url_or_brand` (text, required): "URL or brand to audit"
- `target_keywords` (text, required): "Target keywords (comma-separated)"
- `competitors` (text, optional): "Competitor URLs to compare against"

#### 26D. Competitive Brief Generator (`competitive_brief`)

**Category:** `strategy`
**Fields:**
- `market_or_product` (text, required): "Market or product area to analyze"
- `known_competitors` (text, optional): "Competitors you already know about"
- `focus_areas` (text, optional): "Specific areas to focus on (pricing, features, positioning)"

**Why this beats Cowork:** Intel data is already analyzed and available in context. Cowork would need you to paste competitor info manually.

#### 26E. Status Report Generator (`status_report`)

**Category:** `ops`
**Fields:**
- `period` (select: today | this_week | this_month): "Report period"
- `audience` (select: self | partner | investor): "Who is this report for?"

**Special logic in `/api/documents/generate/route.ts`:** When `doc_type === 'status_report'`, fetch:
- Last 7 Folio entries
- Active Dreams (status = 'active')
- Tasks completed this period
- Social posts published this period

Inject all as additional context before generation.

#### 26F. Feature Spec / PRD Generator (`feature_spec`)

**Category:** `strategy`
**Fields:**
- `feature_name` (text, required): "Feature or product name"
- `problem_statement` (text, required): "What problem does this solve?"
- `target_user` (text, optional): "Who is this for?"

**Prompt includes:** Locked-decision format with `**Decision:** / **Why:** / **Not:**`, SQL migration patterns, verification steps — matching the Build Bible format.

> ⚠️ GOTCHA: Marketing doc types (campaign_plan, email_sequence, ad_copy) must reflect the **convicted-not-curious** principle: NCHO copy speaks to parents who've already decided to homeschool, not those still considering it. SomersSchool copy speaks to parents convicted about homeschooling but curious about this specific platform. Inject this distinction into the system prompt for all marketing doc types.

### SMOKE TEST — Phase 26

- [ ] Each new doc type appears in Doc Studio's type selector dropdown
- [ ] Generate a Campaign Plan for "NCHO Spring Launch" → output includes actual NCHO products, pricing, and audience from live context
- [ ] Generate a Status Report for "this week" → output references real Folio entries and active Dreams
- [ ] Generate a Feature Spec → output uses locked-decision format with SQL migrations
- [ ] Generate an Email Sequence → output has correct number of emails matching `num_emails` field
- [ ] Export each new doc type as DOCX → valid download

---

## Phase 27 — Advanced / Post-Launch

> **These features are documented for completeness but should NOT be built before August 2026 unless they directly enable revenue.**

### 27A. AI Columns / Row-Level Enrichment

**Route:** `/api/enrich/[table]/route.ts` — accepts table name + column definition + row filter. Processes in batches of 10 (Batch Size Law). Uses Haiku for speed.
**Use cases:** Dreams → auto-priority score. Social posts → auto alt-text. Intel sessions → auto business-track relevance tag.

### 27B. Composable AI Commands / Workflows

**Migration:** New `commands` table.
**Route:** `/api/commands/` CRUD + runner.
**What:** Saveable, parameterized, chainable AI pipelines. "Generate Social Bundle" = read course metadata → generate 5 posts per brand → apply brand voice → predict scores → queue for review.

### 27C. MCP Server Exposure

**Route:** `/.well-known/mcp` or dedicated MCP endpoint.
**What:** Expose Council, Intel, Dreams, Folio as MCP tools for Claude Code. Wait for stateless spec (Q2/Q3 2026 per locked decision).

### 27D. Meta-Agent / EVE Pattern

**Prerequisite:** 27B (Composable Commands).
**What:** Agent that creates specialized sub-agents from Council knowledge.

### 27E. Deep Research Mode

**What:** Enhance `processIntelUrls()` to accept topic queries → autonomously discover sources → fetch → synthesize with citations. Not just fetch-and-summarize — discover-read-synthesize. Perplexity Deep Research pattern.

---

## Summary Tables

### Migration Summary

| Migration # | Phase | Table | Change |
|---|---|---|---|
| 101 | 20A | `documents` | Add `export_history JSONB`, `content_html TEXT` |
| 102 | 21A/21B | `documents` | Add `outline JSONB`, `version INT DEFAULT 1`, `edit_history JSONB DEFAULT '[]'` |
| 103 | 23B | `watch_urls` | **CREATE** — full table with RLS |
| 104 | 25A | `social_posts` | Add `engagement_data JSONB`, `predicted_score FLOAT` |
| 105 | 26 | `documents` | Update `doc_type` CHECK constraint with 6 new types |

**All migrations:** own file with timestamp prefix, backward-compatible, include RLS where applicable. Numbering starts at 101 (intentional jump — 045–100 are empty buffer; existing 001–044 have legacy numbering irregularities).

### New Environment Variables

| Variable | Phase | Notes |
|---|---|---|
| `LANGFUSE_PUBLIC_KEY` | 20B | Keys in `api-guide-master.md` |
| `LANGFUSE_SECRET_KEY` | 20B | Keys in `api-guide-master.md` |
| `LANGFUSE_HOST` | 20B | `https://cloud.langfuse.com` |
| `ELEVENLABS_API_KEY` | 24A | From ElevenLabs dashboard (Creator plan) |
| `ELEVENLABS_DEFAULT_VOICE_ID` | 24A | Current default voice — swappable as voices evolve |

### New API Routes

| Route | Method | Phase | Purpose |
|---|---|---|---|
| `/api/documents/export` | POST | 20A | Export document as DOCX/MD/PDF |
| `/api/costs` | GET | 20B | Cost dashboard data from Langfuse |
| `/api/documents/outline` | POST | 21A | Generate structural outline |
| `/api/documents/edit` | POST | 21B | Agentic NL editing with optimistic lock |
| `/api/brand-voices/analyze` | POST | 21C | Extract brand voice from samples |
| `/api/council/quick` | POST | 22A | Single-member quick consultation |
| `/api/search` | GET | 22B | Unified cross-source search |
| `/api/knowledge` | GET/POST | 23A | CRUD for context_files |
| `/api/knowledge/[id]` | PUT/DELETE | 23A | Single context_file operations |
| `/api/knowledge/preview` | GET | 23A | Preview assembled system prompt |
| `/api/watch-urls` | GET/POST | 23B | CRUD for watch URLs |
| `/api/watch-urls/[id]` | PUT/DELETE | 23B | Single watch URL operations |
| `/api/audio/generate` | POST | 24A | Generate TTS via ElevenLabs |
| `/api/social/predict` | POST | 25A | Predict post engagement score |
| `/api/social/analytics` | POST | 25A | Backfill engagement data from Buffer |
| `/api/social/boost` | POST | 25B | Rewrite post for higher engagement |

**Total: 16 new routes across Phases 20–26. Zero existing routes broken.**

### New UI Components

| Component | Phase | Location |
|---|---|---|
| Export dropdown on documents | 20A | Doc Studio document view |
| Cost dashboard tab | 20B | Debug panel |
| Brand voice selector dropdown | 20C | Doc Studio generate form |
| Outline editor (draggable/reorderable cards) | 21A | Doc Studio generate flow |
| Document edit input bar + version indicator | 21B | Doc Studio document view |
| Edit history sidebar | 21B | Doc Studio document view |
| "Analyze Voice" modal | 21C | BrandVoicesPanel settings |
| `<CouncilPopover>` floating button | 22A | Root layout (every page) |
| `<UnifiedSearch>` bar | 22B | Header |
| `/knowledge` page | 23A | New nav item (System group) |
| Watch URLs panel | 23B | /intel page |
| "→ Task" button on Intel findings | 23C | Intel report viewer |
| `<ListenButton>` | 24A | Folio, Intel, Doc Studio |
| Predicted score badge | 25A | Review Queue cards |
| "⚡ Boost" button | 25B | Review Queue cards |
| "🔒 Grounded Mode" toggle | 25C | Chat header |
| 6 new doc type forms | 26 | Doc Studio type selector |

### What Existing Code Is Preserved

This spec adds to Chapterhouse — it does not remove or replace anything.

| Existing System | Status |
|---|---|
| Council 5-pass pipeline (`/council`) | **PRESERVED** — Phase 22A adds @Council quick mode alongside |
| Doc Studio 15 doc types | **PRESERVED** — Phase 26 adds 6 more types |
| Social generation + Review Queue | **PRESERVED** — Phase 25 adds prediction and boost |
| Intel pipeline + cron | **PRESERVED** — Phase 23B adds watch URLs to existing cron |
| Folio daily narrative | **PRESERVED** — Phase 24B adds audio option |
| Dreams/Dreamer | **PRESERVED** — no modifications |
| Chat + solo/Council chat | **PRESERVED** — Phase 25C adds grounded toggle |
| Brand voices table + panel | **PRESERVED** — Phases 20C and 21C add features |
| All existing migrations (001–044) | **PRESERVED** — new spec migrations start at 101 (intentional gap) |
| All existing API routes | **PRESERVED** — some modified, none removed |
| `buildLiveContext()` | **PRESERVED** — used by Phase 26 doc types |
| `getSystemPrompt()` | **PRESERVED** — Phase 23A adds a viewer for it |

---

## Critical Path

```
Phase 20 (3 routes, 1 migration) ←← START HERE
  ├── 20A Export ←← THE VERY FIRST THING (PINNED item resolved)
  ├── 20B Langfuse (1 lib, 1 route, 6 route mods)
  └── 20C Brand Voice in Doc Studio (1 route mod, 1 UI dropdown)

Phase 21 + 22 (parallel tracks)
  ├── 21A Outline-First (1 migration, 1 route, 1 route mod)
  ├── 21B Agentic Editing (1 route, optimistic locking)
  ├── 21C Voice Analysis (1 route, 1 modal)
  ├── 22A Council Popover (1 route, 1 component)
  └── 22B Unified Search (1 route, 1 component)

Phase 23 + 25 (parallel tracks)
  ├── 23A Knowledge Base UI (5 routes, 1 page)
  ├── 23B Watch URLs (1 migration, 4 routes, cron mod)
  ├── 23C Intel → Task (1 button, POST to existing route)
  ├── 25A Performance Prediction (1 migration, 2 routes, cron)
  ├── 25B Boost Button (1 route, 1 button)
  └── 25C Grounded Mode (1 route mod, 1 toggle)

Phase 24 (gates on nothing — build anytime)
  ├── 24A ElevenLabs Wiring (1 route, 1 lib, 1 component)
  └── 24B Audio on Content Types (3 page mods)

Phase 26 (gates on 21A for best experience)
  └── 26A-F: Six new doc types (1 migration, file mod)

Phase 27 (post-launch, open-ended)
  └── AI Columns, Composable Workflows, MCP, Meta-Agent, Deep Research
```

---

## Session Discipline Protocol

After completing any phase in this spec:

1. **Update `CLAUDE.md`** — add the phase to Build History with commit hash
2. **Update routes/tables/env vars** sections if anything changed
3. **Run the SMOKE TEST** for that phase — every checkbox must pass
4. **Verify no regressions** — existing features still work (chat, council, doc studio, social)
5. **If session ends mid-phase** — document exactly where you stopped in `CLAUDE.md` build history

---

**This spec is the green light to build. Phase 20A is the starting point. A code bot can open Chapterhouse, read this file, and begin executing.**

---

## Research Validation — Competitive Intelligence Confirmation

*8 competitive research files (35 tools analyzed, March–April 2026) validated the following architectural decisions already locked in this spec:*

| Spec Decision | Competitive Evidence |
|---|---|
| **Phase 20A — Document Export** | Tome.app collapsed 2024 after removing export. Users revolted. Export is table stakes, not a feature. |
| **Phase 21A — Outline-First Generation** | Beautiful.ai + Descript both gate generation behind structure-first step. 2-pass (structure → content) is the industry pattern. |
| **Phase 22A — @Council Floating Button** | Canva AI, ClickUp AI, Notion AI: every major tool now surfaces AI via a persistent trigger on every page. Friction to AI = abandonment. |
| **Phase 23A — Knowledge Base UI** | Sider, Jasper, Copy.ai all include knowledge base as foundation feature. No knowledge base = perceived as "basic." |
| **Phase 24A — ElevenLabs TTS** | Pictory, InVideo, OpusClip all bundle TTS natively. Text-only AI content tools are losing ground to audio-first users. |
| **Phase 25A — Performance Prediction** | Anyword's 10× CTR data (validated, 2024 case study pool). OpusClip Virality Score. Prediction before publishing is now expected in tools charging >$30/mo. |
| **Phase 25C — Grounded Mode** | Perplexity's Focus mode, You.com Research mode — both show user demand for "don't hallucinate, stay inside what you know." Power users want this toggle. |

---

## Phase 28A — AI Columns / Row-Level Enrichment

**Source:** Coda AI Column + ClickUp AI Fields (Research Tier A3)
**Effort:** 4–6 hours
**Migration:** None (uses existing JSONB columns: `enrichment_data`)
**Gate:** Ship Phases 23A and 25A first — they generate the rows that 28A enriches

### What This Is

Every major workspace tool now supports "AI columns" — fields on a row that AI fills automatically. Coda Formulas, ClickUp's AI Fields, Notion AI Properties all do this. The pattern: pick a table → pick a field → pick a prompt template → AI enriches each row async in batches.

In Chapterhouse this applies to three tables:

| Table | Fields To Add | Model | Prompt Focus |
|---|---|---|---|
| `dreams` | `priority_score` (0–100 INT) + `effort_tag` (low/medium/high/unknown) | Haiku 4.5 | Score by urgency × impact; classify effort |
| `intel_sessions` | `business_track` (operations/marketing/product/finance/other) | Haiku 4.5 | Classify session findings into primary track |
| `social_posts` | `tone_tag` (educational/promotional/personal/community) + `alt_text` (TEXT) | Haiku 4.5 | Tag tone; generate accessibility alt text — **DEFERRED until Phase 25A ships** |

All fields stored in existing (or added) `enrichment_data JSONB` column. Merge-safe: `enrichment_data = enrichment_data || jsonb_build_object(...)` — never overwrites unrelated keys.

### Route

**`POST /api/enrich/[table]`**

```typescript
// Request body
{ ids: z.array(z.string().uuid()).max(10) }  // Batch Size Law: max 10

// Response
{
  enriched: number,
  failed: number,
  results: Array<{ id: string, status: 'ok' | 'failed', error?: string }>
}
```

Auth: service role or authenticated user only. Validate `table` parameter against allowlist `['dreams', 'intel_sessions', 'social_posts']` — reject anything else with 400.

### Batch Dispatch

The `enrichment_data` column must exist on `dreams` and `intel_sessions` tables. If it does not, add it:

```sql
ALTER TABLE dreams ADD COLUMN IF NOT EXISTS enrichment_data JSONB DEFAULT '{}';
ALTER TABLE intel_sessions ADD COLUMN IF NOT EXISTS enrichment_data JSONB DEFAULT '{}';
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS enrichment_data JSONB DEFAULT '{}';
```

Run as a standalone `ALTER` in Supabase SQL Editor (not a numbered migration — these are additive nullable columns).

### UI Hook

After Phase 28A is built: add an "Enrich" button to the Dreamer board (Earl's AI Review section) that calls `POST /api/enrich/dreams` with all unscored dream IDs (up to 10). Show priority score as a small badge on each dream card.

### Smoke Test

1. POST `/api/enrich/dreams` with 5 valid dream IDs → `enrichment_data.priority_score` populated on each row ✅
2. POST `/api/enrich/intel_sessions` with 3 valid session IDs → `enrichment_data.business_track` populated ✅
3. POST `/api/enrich/dreams` with 11 IDs → 400 error, message "Maximum 10 IDs per batch" ✅
4. POST `/api/enrich/social_posts` before Phase 25A ships → 400 error, message "social_posts enrichment gated on Phase 25A performance_predictions" ✅
5. POST with invalid table name → 400 error ✅

---

## Phase 28B — Composable AI Workflows

> ⛔ **POST-LAUNCH / AMBITIOUS — 20+ hours.** Gate: Phases 23B, 25A, and 26 must ship first. Phase 27D (Meta-Agent / EVE) depends on this phase.

**Source:** HARPA AI Commands, Jasper Pipelines, Taskade Workspace DNA (Research Tier S7)
**Effort:** 20+ hours
**Migration:** One new table (`workflows`)

### What This Is

The most powerful single upgrade in the net-new phases. Tools like Taskade and HARPA AI let users chain AI actions into saved, reusable pipelines. The Chapterhouse equivalent: a `workflows` table where each row is a sequence of steps, each step is a typed AI operation, and the output of one step can be referenced as input to the next.

This is what enables: "Every Monday, run the social weekly, score the posts, boost the top 3, and generate a doc_studio status_report — automatically."

### Migration

**File:** `supabase/migrations/20260418_107_create_workflows.sql`

```sql
CREATE TABLE workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  steps JSONB NOT NULL DEFAULT '[]',
  trigger_type TEXT CHECK (trigger_type IN ('manual', 'cron', 'webhook')) DEFAULT 'manual',
  trigger_config JSONB DEFAULT '{}',
  run_count INT DEFAULT 0,
  last_run_at TIMESTAMPTZ,
  last_run_status TEXT CHECK (last_run_status IN ('success', 'failed', 'partial')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "workflows_owner" ON workflows FOR ALL USING (auth.uid() = user_id);
```

### Step Schema

Each element in the `steps` JSONB array:

```typescript
interface WorkflowStep {
  id: string;           // Short slug, unique within workflow
  step_type: 
    | 'council_query'     // Query the Council with a prompt
    | 'intel_fetch'       // Run an Intel session on URLs
    | 'social_generate'   // Generate social posts for brand+platform
    | 'doc_generate'      // Generate a Doc Studio document
    | 'enrich'            // Run enrichment on a table batch
    | 'schedule_buffer';  // Schedule top N approved posts to Buffer
  params: Record<string, unknown>;  // Step-type-specific params
  output_key: string;   // Key name for output; referenced in later steps as {{output_key}}
}
```

### Routes

- `GET /api/workflows` — list user's workflows
- `POST /api/workflows` — create new workflow (Zod-validate steps array)
- `GET /api/workflows/[id]` — get single workflow with full steps
- `PATCH /api/workflows/[id]` — update name/description/steps/trigger
- `DELETE /api/workflows/[id]` — soft delete (set `is_active = false`)
- `POST /api/workflows/run` — execute workflow: iterate steps, pass `{{output_key}}` values between steps via a context map, halt on first step failure, return run log

### GOTCHA

Step output interpolation must be sanitized. A step's `params` may reference `{{output_key}}` from a prior step. Replace template variables before sending to AI. Do NOT eval or execute template content.

### Smoke Test

1. Create 2-step workflow: step 1 = `doc_generate` (status_report), step 2 = `social_generate` (NCHO/Facebook, using `{{status_report_text}}`) → both steps execute in sequence, step 2 references step 1 output ✅
2. Step 1 fails (invalid doc type) → workflow halts at step 1, step 2 does NOT run, `run_count` NOT incremented, last_run_status = 'failed' ✅
3. Manual trigger → POST `/api/workflows/run` → run log returned ✅
4. `{{output_key}}` containing `<script>` → sanitized before AI prompt injection ✅

---

## Phase 28C — Multi-Surface Output

**Source:** Gamma (50M users, `developers.gamma.app`, 2024 TechCrunch) (Research Tier A7)
**Effort:** 6–8 hours
**Migration:** None
**Gate:** Phase 20A (export) must ship first

### What This Is

Gamma's core insight: content people create has multiple final destinations — a deck, an email, a social post — and users hate reformatting. The SomersSchool analogy: one campaign plan should produce a DOCX for Anna, a stakeholder email for Scott, and a social post set for the queue.

This extends the existing `/api/documents/generate` route (already SSE streaming) to accept an optional `output_surfaces` parameter.

### Route Modification

**File:** `src/app/api/documents/generate/route.ts`

Add to Zod schema:

```typescript
output_surfaces: z.array(
  z.enum(['docx', 'email_summary', 'social_set'])
).optional().default([])
```

**Surface implementations:**

| Surface | Implementation | Model |
|---|---|---|
| `docx` | Existing html-to-docx export (from Phase 20A) | — |
| `email_summary` | Claude Haiku → 3-paragraph stakeholder email (subject line + body) | Haiku 4.5 |
| `social_set` | Call social generation logic for brand=NCHO, platform=facebook, count=2 | Sonnet 4.6 |

**Response shape addition:**

```typescript
{
  // existing fields...
  surfaces?: {
    docx_url?: string,
    email_summary?: { subject: string, body: string },
    social_set_post_ids?: string[]
  }
}
```

### GOTCHA

Do NOT create a dependency on Gamma's API or any third-party presentation service. This is purely internal multi-format generation. Gamma is the inspiration, not the dependency.

### UI Hook

After generating a document in Doc Studio, show checkboxes for additional output surfaces: "Also generate: ☐ DOCX ☐ Stakeholder Email ☐ Social Post Set."

### Smoke Test

1. Generate `campaign_plan` with `output_surfaces: ['docx', 'email_summary']` → DOCX download link present + 3-paragraph email in response ✅
2. Generate `status_report` with `output_surfaces: ['social_set']` → 2 social_posts rows created in Supabase (status: pending_review) ✅
3. Generate without `output_surfaces` → response identical to pre-28C behavior ✅
4. `social_set` surface only runs if `BUFFER_ACCESS_TOKEN` is set → otherwise skip with warning ✅

---

## Phase 28D — GEO / AI Search Visibility Tracking

**Source:** Writesonic GEO (Generative Engine Optimization) feature (Research Tier B1)
**Effort:** 4–6 hours
**Migration:** None (uses existing `intel_sessions` table)
**Gate:** Phase 23A (Knowledge Base UI) recommended but not hard gate

### What This Is

Writesonic identified that brands need to track their visibility in AI-generated answers, not just Google rankings. When someone asks ChatGPT or Perplexity "what are the best homeschool curriculum providers in Alaska?" — does NCHO appear? Does SomersSchool appear?

This phase adds a weekly cron that queries 2–3 LLMs with targeted questions, checks for brand mentions, and stores results in `intel_sessions` as AI Search Visibility reports.

### Route

**`GET /api/cron/geo-visibility`** — CRON_SECRET protected, weekly Monday 07:00 UTC

**Logic:**

```typescript
const queries = [
  "What are the best homeschool curriculum providers in Alaska?",
  "Where can I find secular homeschool curriculum for middle school?",
  "What are good homeschool curriculum stores that ship to Alaska?",
  "Best online courses for homeschool students grades 5-8?",
  "Homeschool curriculum with visible progress tracking for parents?"
];

// For each query, call 2 providers: OpenAI GPT-5.4 + Groq Llama 3.3 70B
// (Do NOT use You.com — $5/1K queries)
// Check each response for: 'NCHO', 'Next Chapter Homeschool', 'SomersSchool', 'Scott Somers'
// Store in intel_sessions with source_type='cron', session_label='AI Search Visibility — [date]'
```

**Stored findings schema** (in `findings JSONB` on intel_sessions):

```typescript
{
  query: string,
  provider: 'openai' | 'groq',
  mentioned_brands: string[],  // which of our brands appear
  raw_response_excerpt: string,  // first 500 chars
  mentioned: boolean
}[]
```

**Aggregate:** Compute weekly visibility score = (mentions / total queries) × 100. Append to session summary.

### Dashboard

Intel page: When `session_label` starts with 'AI Search Visibility', render a special card with:
- Week-over-week visibility score trend (12 weeks max)
- Per-query breakdown showing which brands appeared
- "View Details" expands to full findings

### GOTCHA

LLM responses are probabilistic — the same question may return different results each week. This is intentional — the trend over 12 weeks is the signal, not any single result. Do NOT treat a single week's 0% mention as a crisis.

### Smoke Test

1. Manual trigger → POST or GET with CRON_SECRET → at least 10 queries execute across 2 providers → results stored in `intel_sessions` ✅
2. NCHO mentioned in at least 1 response (may require prompt tuning in early weeks) → `mentioned: true` in findings ✅
3. Intel page shows "AI Search Visibility" card with visibility score ✅
4. 12-week trend chart renders when 2+ weekly sessions exist ✅
5. Each cron run uses CRON_SECRET guard → 401 without valid secret ✅

---

## Phase 28E — Audiences as Structured Data

**Source:** Jasper IQ Audiences + Anyword Audience Scoring (Research Tier B2)
**Effort:** 6–8 hours
**Migration:** 106 (`target_audiences` table)
**Gate:** Phase 20C (Brand Voice in Doc Studio) must ship first; Phase 26 recommended

### What This Is

Jasper IQ and Anyword both treat the target audience as a first-class data object, not a prompt fragment. When you save an audience (demographics, pain points, motivations, preferred tone), every piece of content you generate is automatically calibrated to that audience.

In Chapterhouse: created audiences persist as rows in `target_audiences`. When generating a doc, the user picks an audience → its profile is injected into the generation prompt alongside the brand voice.

This closes the gap between "good content" and "content that actually converts the person you're writing for."

### Migration 106

**File:** `supabase/migrations/20260415_106_add_target_audiences.sql`

```sql
CREATE TABLE target_audiences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  demographics JSONB DEFAULT '{}',
  pain_points JSONB DEFAULT '[]',
  motivations JSONB DEFAULT '[]',
  preferred_tone TEXT,
  doc_type_affinity JSONB DEFAULT '{}',
  brand_voice_id UUID REFERENCES brand_voices(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE target_audiences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "target_audiences_owner" ON target_audiences
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX target_audiences_user_idx ON target_audiences(user_id);
```

### Seed Audience (insert on migration)

```sql
-- Insert seed after table creation; replace user_id with the primary user's UUID
-- The seed is for reference/inspiration — Scott should clone and customize it
INSERT INTO target_audiences (user_id, name, description, demographics, pain_points, motivations, preferred_tone)
VALUES (
  (SELECT id FROM auth.users LIMIT 1),
  'Conviction-Stage Homeschool Parent',
  'Parent who has already decided to homeschool. Not exploring — committed. Looking for the right curriculum, not permission.',
  '{"children_ages": "5-18", "decision_stage": "committed", "location_type": "rural_or_suburban", "tech_comfort": "moderate"}',
  '["state compliance complexity", "curriculum overwhelm from too many options", "isolation from other homeschool families", "record-keeping burden", "questions about rigor vs. traditional school"]',
  '["faith or values alignment", "child learns at own pace", "family time and presence", "better academic outcomes", "escape from toxic school environments"]',
  'warm, direct, practical — no jargon, no hedging'
);
```

### Routes

- `GET /api/audiences` — list user's audiences
- `POST /api/audiences` — create new audience (Zod-validated: name required, all other fields optional)
- `GET /api/audiences/[id]` — get single audience
- `PATCH /api/audiences/[id]` — update any field
- `DELETE /api/audiences/[id]` — hard delete (confirm prompt in UI)

### Route Modification

**File:** `src/app/api/documents/generate/route.ts`

Add to Zod schema:

```typescript
audience_id: z.string().uuid().optional()
```

When `audience_id` provided:
1. Fetch audience row from `target_audiences` (verify `user_id` matches)
2. Build audience context string:
   ```
   TARGET AUDIENCE: [name]
   Description: [description]
   Demographics: [demographics JSON]
   Pain Points: [pain_points array]
   Motivations: [motivations array]
   Preferred Tone: [preferred_tone]
   ```
3. Inject AFTER brand voice context, BEFORE document type instructions

### UI

**New page:** `/audiences` — list view with "+New Audience" button, edit/delete per row. Link from Settings nav (System group) alongside Brand Voices.

**Doc Studio integration:** Audience dropdown in the generate form alongside the existing Brand Voice dropdown. Shows audience name + brief description. Optional — can generate without selecting an audience.

**Label:** "Writing for:" (not "Target Audience" — too clinical for Scott's UI aesthetic)

### GOTCHA

The seed audience SQL uses `(SELECT id FROM auth.users LIMIT 1)` which in production is Scott's user ID. In a fresh dev environment, this may fail if no users exist yet. Wrap in a DO block with existence check:

```sql
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM auth.users) THEN
    INSERT INTO target_audiences (user_id, name, ...)
    VALUES ((SELECT id FROM auth.users LIMIT 1), ...);
  END IF;
END $$;
```

### Smoke Test

1. Create "Conviction-Stage Homeschool Parent" seed audience → saved, appears in list ✅
2. Generate `campaign_plan` with `audience_id` → Tony review: response references pain points and uses preferred tone ✅
3. Generate without `audience_id` → response behavior identical to pre-28E ✅
4. Generate with both `brand_voice_id` + `audience_id` → both context blocks injected in correct order (brand voice FIRST, then audience) ✅
5. `/audiences` page loads, shows seed row, Edit/Delete work ✅
6. DELETE with UI confirm prompt → row removed, no orphan references in social_posts ✅

---

*End of Chapterhouse Cowork Upgrade Spec — Phases 20A through 28E*
*Research incorporated from 8 competitive intelligence files, waves 1–6, 35 tools analyzed.*
