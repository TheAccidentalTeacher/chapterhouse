# Chapterhouse — Full Implementation Spec
## Phase-by-Phase Build Plan for the Code Bot

*Written March 19, 2026. Distilled from 92 Q&A sessions across two brainstorm rounds.*
*This document is the brief. The code bot executes from here.*

---

## BUILD STATUS — Updated March 19, 2026 (Session 16)

| Phase | Status | Migration(s) | Notes |
|---|---|---|---|
| PRE-FLIGHT | ✅ COMPLETE | — | Context files copied, codebase read |
| Phase 0 — Multi-Tenant | ✅ COMPLETE | 014, backfill | user_id on all tables, RLS updated |
| Phase 1 — Context Layer | ✅ COMPLETE | 015, 016 | Extended to multi-document (see Phase 1.1) |
| Phase 1.1 — Multi-Doc Brain | ✅ COMPLETE | 016 | document_type + inject_order, push API, pill UI |
| Phase 2 — Dreamer | 🔴 NOT STARTED | — | Next phase |
| Phase 3 — Intel Workflow | 🔴 NOT STARTED | — | After Phase 2 |
| Phase 4 — Council of Unserious | 🔴 NOT STARTED | — | personas + council_sessions tables not built |
| Phase 5 — Tool Call Cards | 🔴 NOT STARTED | — | After Phase 4 |
| Phase 6 — Background Jobs Ext. | 🟡 PARTIAL | — | Curriculum/social/youtube jobs exist; intel/brief/seed/condense not built |
| Phase 7 — Self-Aware Debug | 🔴 NOT STARTED | — | debug_logs table not built |
| Phase 8 — Email Integration | 🟡 PARTIAL | — | Inbox UI + IMAP/SMTP routes built; not wired to brief/seed pipeline |

**Also already built (pre-spec, in production):** Job Runner, Curriculum Factory (now LEGACY/moved to CoursePlatform), n8n Panel, Social Media Automation, YouTube Intelligence, Brief Intelligence, daily.dev source, Context Brain push API.

---

## PRE-FLIGHT: READ THESE FIRST

Before touching a single file, the code bot must read all of the following. Do not skip any of them. Do not skim.

1. **`CLAUDE.md`** — the living technical brief for the Chapterhouse repo (routes, tables, env vars, build history)
2. **`.github/copilot-instructions.md`** — the full identity brain: Scott's background, all repos, three business tracks, Council personas, locked decisions
3. **`intel/2026-03-18/chapterhouse-brainstorm-interview.md`** — the complete voice-dictated Q&A that produced this spec. Read the SYNTHESIS and all Round 2 gap answers.
4. **`intel/2026-03-18/chapterhouse-vs-dreamfloor.md`** — the strategic comparison that defines what "done" looks like

Then read the Chapterhouse codebase itself:
- `src/app/api/chat/route.ts` — the streaming chat route (primary surface to upgrade)
- `src/app/api/briefs/generate/route.ts` — the daily brief generation pipeline
- `src/app/api/extract-learnings/route.ts` — the silent background learning extractor
- `src/app/api/debug/route.ts` — the debug panel (exists, needs wiring)
- `src/app/council/page.tsx` — the curriculum council UI (**LEGACY — migrated to SomersSchool/CoursePlatform. Read it to understand the architecture pattern only. Do not extend or modify it.**)
- `worker/src/index.ts` — the Railway worker entry point
- `worker/src/jobs/router.ts` — the job dispatcher
- `worker/src/jobs/curriculum-factory.ts` — **LEGACY — the curriculum factory migrated to SomersSchool. Read it to understand the 6-pass pipeline pattern only. Do not extend or modify it.**
- `worker/src/lib/council-prompts.ts` — **LEGACY — curriculum council prompts. Read for architecture reference only. The Council of the Unserious (this spec) uses the new `personas` DB table, not this file.**
- All migrations in `supabase/migrations/` — to understand the full current DB schema

---

## KNOWN ISSUES — FIX, IGNORE, OR TRIAGE

### ✅ RESOLVED:
- `jobs` table `type` constraint was hardcoded — **fixed in production**, now open text with app-level validation
- No `user_id` on any table — **fixed by migration 014**, backfill complete

### Fix immediately (these block other work):

### Known broken (triage):
- **N8N integration**: Half-finished. Leave it. Don't touch N8N routes until the core phases are done. Note in a comment that the N8N integration is deferred.
- **Deep research / multi-agent dispatch**: `/api/research/route.ts` does not currently dispatch multiple visible agents. This spec does not fix it — that's a future phase. Leave it alone.

### Working but untested:
- ~~**Email integration**: `scott@NextChapterHomeschool` is wired. Needs a validation pass (Phase 8). Don't rebuild — test and document.~~ **→ INBOX IS BUILT AND WORKING.** Full IMAP inbox at `/inbox`, send/reply/compose all wired. Missing: not yet feeding into brief context or seed extraction (that's Phase 8 completion). Env vars: `NCHO_EMAIL_HOST` + `NCHO_EMAIL_USER` + `NCHO_EMAIL_PASSWORD` all set in Vercel and `.env.local`.

### Working and solid:
- QStash → Railway worker pipeline (keep, extend)
- Supabase Realtime on `jobs` table (keep, extend to new tables)
- `buildLiveContext()` in chat route (keep, extend — this is the right pattern)
- `extract-learnings` auto-extraction pipeline (keep, extend for seeds)

---

## ARCHITECTURE DECISIONS

These are locked. The code bot implements these; it doesn't redesign them.

### Multi-Tenancy: Single DB, RLS Per User

**Decision**: Add `user_id UUID REFERENCES auth.users(id) NOT NULL` to every table created from this point forward. Add RLS policy to every new table: `USING (auth.uid() = user_id)`. Do the same migration for existing tables (briefs, founder_notes, research_items, opportunities, tasks, chat_threads, knowledge_summaries, jobs).

**Why not separate DB per user**: Operationally insane until $500K ARR. RLS is what Supabase was built for. It scales to millions of users with zero additional infrastructure.

**Migration pattern for existing tables**:
```sql
ALTER TABLE [table_name] ADD COLUMN user_id UUID REFERENCES auth.users(id);
-- Backfill: for single-user phase, set all existing rows to Scott's user_id
-- Do this with a manual step after running migration + retrieving Scott's user_id from Supabase dashboard
-- Update existing RLS policies to: USING (auth.uid() = user_id)
```

**On `jobs` table specifically**: The `type` CHECK constraint must be migrated to allow all new job types. See Phase 6.

### Context Loading: DB-Resident, Always Current

The system prompt for chat and briefs is currently hardcoded in the route files. This was the right call for MVP. Now we move the context to Supabase so it can be edited from the UI.

The `founder_notes` table already exists and feeds into `buildLiveContext()`. This pattern expands to include a `context_files` table for the large, structured context document (the full copilot-instructions.md equivalent).

### Anti-Hallucination: Grounding on Every Intel Claim

Every Intel processing call must include a second-pass verification prompt that checks factual claims against source URLs. Intel output that cannot be traced to a source URL gets flagged with ⚠️, not silently included. This is non-negotiable per the gap Q&A.

### Streaming Architecture: SSE Over WebSockets

The current chat route uses `ReadableStream` with raw text chunks. The upgrade path is to add structured SSE event types (not raw text chunks) so the frontend can differentiate between message text, tool call events, and persona-labeled council messages. The stream protocol upgrade is:

```
Current:  raw text chunks → frontend appends to message
Upgraded: typed SSE events:
  { type: "text", delta: "..." }
  { type: "tool_start", name: "search_research_db", input: {...} }
  { type: "tool_result", name: "search_research_db", output: {...} }
  { type: "council_turn", persona: "Gandalf", delta: "..." }
  { type: "done" }
```

The upgrade must be backward-compatible — if the frontend doesn't handle a new event type, it should fall back gracefully.

---

## DATABASE SCHEMA — FULL TARGET STATE

This is what the DB looks like after all phases are complete. Migrations are written per-phase below, but this is the complete picture.

### Existing tables (current):
- `briefs` — daily brief records
- `founder_notes` — accumulated facts about Scott and the business
- `knowledge_summaries` — compressed research summaries by tag
- `research_items` — individual saved research articles
- `opportunities` — scored business opportunities
- `tasks` — action items
- `chat_threads` — conversation histories
- `jobs` — background job queue

### New tables (from this spec):
- `context_files` — the large structured context documents (the "brain upload")
- `dreams` — the Dreamer seed system
- `dream_log` — daily dream journal entries
- `intel_sessions` — Intel workflow session history
- `intel_categories` — user-configurable Intel output categories
- `personas` — all Council and bench personas, editable from UI
- `council_sessions` — the Council of the Unserious live session records
- `council_messages` — individual messages within council sessions

---

## PHASE 0 — Multi-Tenant Foundation
✅ **COMPLETE** — Migrations 014 (`20260319_014_add_user_id_to_all_tables.sql`) and backfill applied. All tables have `user_id`. RLS policies updated. Committed `38ce345`.

*This is a prerequisite for everything else. Do this first.*

**Goal**: Add `user_id` to all existing tables and update RLS policies. This must be done before any new features are built.

### Migration: `20260319_009_add_user_id_to_all_tables.sql`

```sql
-- Add user_id to all existing tables
-- Phase 0 — Multi-Tenant Foundation

-- briefs
ALTER TABLE briefs ADD COLUMN user_id UUID REFERENCES auth.users(id);
CREATE INDEX briefs_user_id_idx ON briefs(user_id);

-- founder_notes
ALTER TABLE founder_notes ADD COLUMN user_id UUID REFERENCES auth.users(id);
CREATE INDEX founder_notes_user_id_idx ON founder_notes(user_id);

-- knowledge_summaries
ALTER TABLE knowledge_summaries ADD COLUMN user_id UUID REFERENCES auth.users(id);
CREATE INDEX knowledge_summaries_user_id_idx ON knowledge_summaries(user_id);

-- research_items
ALTER TABLE research_items ADD COLUMN user_id UUID REFERENCES auth.users(id);
CREATE INDEX research_items_user_id_idx ON research_items(user_id);

-- opportunities
ALTER TABLE opportunities ADD COLUMN user_id UUID REFERENCES auth.users(id);
CREATE INDEX opportunities_user_id_idx ON opportunities(user_id);

-- tasks
ALTER TABLE tasks ADD COLUMN user_id UUID REFERENCES auth.users(id);
CREATE INDEX tasks_user_id_idx ON tasks(user_id);

-- chat_threads
ALTER TABLE chat_threads ADD COLUMN user_id UUID REFERENCES auth.users(id);
CREATE INDEX chat_threads_user_id_idx ON chat_threads(user_id);

-- jobs
ALTER TABLE jobs ADD COLUMN user_id UUID REFERENCES auth.users(id);
CREATE INDEX jobs_user_id_idx ON jobs(user_id);

-- Expand jobs type constraint to allow new types
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_type_check;
ALTER TABLE jobs ADD CONSTRAINT jobs_type_check CHECK (type IN (
  'curriculum_factory',
  'research_batch',
  'council_session',
  'intel_fetch',
  'brief_pregenerate',
  'seed_extract',
  'context_condense'
));

-- Update RLS policies on all tables
-- (Existing policy: auth.role() = 'authenticated' stays as fallback,
-- but add user_id scoping for new multi-tenant reads)

-- For each table with user_id: add a scoped read policy
-- NOTE: During single-user phase, backfill user_id for all existing rows
-- using: UPDATE [table] SET user_id = '[scott_user_id]' WHERE user_id IS NULL;
-- Get Scott's user_id from: Supabase Dashboard → Authentication → Users
```

### Post-migration manual step:
```sql
-- Run this ONCE after migration, with Scott's actual user_id from Supabase Dashboard:
UPDATE briefs SET user_id = '[SCOTT_USER_ID]' WHERE user_id IS NULL;
UPDATE founder_notes SET user_id = '[SCOTT_USER_ID]' WHERE user_id IS NULL;
UPDATE knowledge_summaries SET user_id = '[SCOTT_USER_ID]' WHERE user_id IS NULL;
UPDATE research_items SET user_id = '[SCOTT_USER_ID]' WHERE user_id IS NULL;
UPDATE opportunities SET user_id = '[SCOTT_USER_ID]' WHERE user_id IS NULL;
UPDATE tasks SET user_id = '[SCOTT_USER_ID]' WHERE user_id IS NULL;
UPDATE chat_threads SET user_id = '[SCOTT_USER_ID]' WHERE user_id IS NULL;
UPDATE jobs SET user_id = '[SCOTT_USER_ID]' WHERE user_id IS NULL;
```

### Code changes — Phase 0:
- In every Supabase query in API routes that reads or writes data, add `.eq('user_id', userId)` filter after getting `userId` from the Supabase session
- Add a helper to `src/lib/supabase-server.ts`:

```typescript
// src/lib/auth-context.ts
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';

export async function getAuthenticatedUserId(): Promise<string> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Unauthenticated');
  return user.id;
}
```

- Update `buildLiveContext()` in `src/app/api/chat/route.ts` to accept and use `userId` in all queries
- The service role client bypasses RLS — that's intentional for internal calls. But the `user_id` filter still gets applied explicitly so data isolation works correctly.

**Phase 0 success criteria**: Any new user who creates an account sees zero data from Scott's account. Existing functionality unchanged.

---

## PHASE 1 — The Context Layer
✅ **COMPLETE** — Migration 015 applied. `/settings/context` UI built. `getSystemPrompt()` loads from DB. Committed `38ce345`.

### Phase 1.1 — Multi-Document Context Brain ✅ COMPLETE (March 19, 2026, Session 16)
Extended beyond the original single-file spec. Migration 016 adds `document_type` and `inject_order` to `context_files`. `getSystemPrompt()` now assembles ALL active docs in inject_order. Four named slots: `copilot_instructions` (1), `dreamer` (2), `extended_context` (3), `intel` (4). Push API at `/api/context/push` (Bearer token, `CHAPTERHOUSE_PUSH_KEY`). Two-click push from email workspace via `PUSH-DREAMER.bat` or `node tools/push_to_chapterhouse.mjs`. Context Brain UI has pill selector. Committed `c7d3413`.

*Goal: Replace the hardcoded system prompt with a DB-resident, user-editable context file that loads dynamically.*

**This is the foundational upgrade.** Right now Scott's context lives in a 700-line hardcoded string in `chat/route.ts`. That string cannot be updated without a deploy. This phase makes it live in Supabase so Scott can edit it from the app UI without touching VS Code.

### Migration: `20260319_010_create_context_files.sql`

```sql
-- Context files table — stores the large structured context document per user
-- This replaces (and extends) the hardcoded SYSTEM_PROMPT in chat/route.ts

CREATE TABLE context_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Identity
  name TEXT NOT NULL DEFAULT 'Primary Context',
  description TEXT,

  -- Content
  content TEXT NOT NULL DEFAULT '',
  -- The full context file — Scott starts by pasting copilot-instructions.md here.
  -- The system loads this as the base of every chat system prompt.

  -- Metadata
  word_count INT GENERATED ALWAYS AS (array_length(regexp_split_to_array(trim(content), '\s+'), 1)) STORED,
  last_exported_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX context_files_user_id_idx ON context_files(user_id);
CREATE INDEX context_files_active_idx ON context_files(user_id, is_active);

-- RLS
ALTER TABLE context_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users own their context files" ON context_files
  FOR ALL USING (auth.uid() = user_id);

-- Auto-update updated_at
CREATE TRIGGER context_files_updated_at
  BEFORE UPDATE ON context_files
  FOR EACH ROW EXECUTE FUNCTION update_jobs_updated_at();
  -- Note: reusing the update_jobs_updated_at() function already defined in migration 008
```

### API Routes to create:

#### `src/app/api/context/route.ts`
```typescript
// GET /api/context — returns the user's active context file
// POST /api/context — creates or replaces the active context file
// PATCH /api/context/[id] — updates a specific context file
```

**GET handler**: Fetches the active context file for the authenticated user. Returns `{ id, name, content, word_count, updated_at }`.

**POST handler**: Accepts `{ name?: string, content: string }`. Upserts the context file. If none exists, creates one. Returns the saved record.

#### `src/app/api/context/export/route.ts`
```typescript
// GET /api/context/export — returns context file as a downloadable text file
// Response headers: Content-Disposition: attachment; filename="chapterhouse-context.md"
```

This is the "export back to VS Code" feature. Scott downloads the context file and drops it into `.github/copilot-instructions.md` in any workspace.

### Changes to `src/app/api/chat/route.ts`:

Replace the hardcoded `SYSTEM_PROMPT` constant with a dynamic load:

```typescript
// BEFORE (hardcoded 700-line string):
const SYSTEM_PROMPT = `You are Chapterhouse...`;

// AFTER (loaded from DB + fallback to hardcoded default):
async function getSystemPrompt(userId: string): Promise<string> {
  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) return FALLBACK_SYSTEM_PROMPT;

  const { data } = await supabase
    .from('context_files')
    .select('content')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return data?.content || FALLBACK_SYSTEM_PROMPT;
}

// Keep FALLBACK_SYSTEM_PROMPT as the current hardcoded string
// This ensures zero downtime if the DB lookup fails
const FALLBACK_SYSTEM_PROMPT = `You are Chapterhouse...`; // existing string
```

Update the POST handler to load the system prompt dynamically:
```typescript
export async function POST(request: Request) {
  const userId = await getAuthenticatedUserId(); // from Phase 0 helper
  const systemPrompt = await getSystemPrompt(userId);
  const liveContext = await buildLiveContext(lastUserMsg, userId);
  // ... rest of handler unchanged
}
```

**Verbosity constraint injection**: Add this to the end of every system prompt (hardcoded, not user-configurable):
```
## Response Length
Match your response length to the complexity of the question. 
- Simple status questions → 1-3 sentences
- Analysis requests → structured but ruthlessly concise
- Planning documents → as long as needed but no padding
Never pad. Never summarize what you just said. Lead with the answer.
```

### Settings UI changes:

Add a `/settings/context` page with:
- A large textarea showing the full context file content (editable)
- Word count display (`{word_count} words`)
- Last updated timestamp
- "Save" button (calls `POST /api/context`)
- "Export to file" button (calls `GET /api/context/export` → downloads)
- "Import from file" button (file input → reads contents → pre-fills textarea → user saves)

The page is at `/settings` → "Context" tab in the settings nav.

**Color theme note**: The context settings page uses gold/amber accents (Tailwind `amber-500`, `amber-600`) rather than the default accent color. This visually distinguishes the "brain" settings from operational settings.

### Initial content migration:

The first time Scott opens Chapterhouse after this phase ships, prompt him to upload his context file:
```
Your context file is empty. Paste or import your copilot-instructions.md 
to give Chapterhouse full knowledge of your business.
```

Do NOT auto-migrate the hardcoded `SYSTEM_PROMPT` — Scott needs to consciously upload and own the context file. The hardcoded fallback stays.

**Phase 1 success criteria**:
- Edit context in UI → next chat uses updated context
- Export button → downloads valid `.md` file
- Import button → uploads file, saves to DB, chat uses it immediately
- If context file empty or load fails → fallback to hardcoded prompt, no error shown to user

---

## PHASE 2 — The Dreamer System
🔴 **NOT STARTED — THIS IS THE NEXT PHASE.**

*Goal: Build the full Dreamer seed/dream management system inside Chapterhouse.*

**Context**: Scott currently has `dreamer.md` in the email repo — a flat markdown file with dream seeds, status tracking, and a daily log. This phase brings that into Chapterhouse as a first-class DB-backed UI with auto-seeding from chat and Intel sessions.

### Migration: `20260319_011_create_dreamer.sql`

```sql
-- Dreamer system: dreams/seeds + dream log
-- Phase 2

CREATE TYPE dream_status AS ENUM (
  'seed',      -- raw idea, unvetted
  'active',    -- in conscious consideration
  'building',  -- currently being built
  'shipped',   -- done and live
  'archived',  -- deprioritized but kept
  'killed'     -- explicitly rejected
);

CREATE TABLE dreams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Core content
  text TEXT NOT NULL,
  notes TEXT,                    -- additional context, freeform
  status dream_status NOT NULL DEFAULT 'seed',

  -- Organization
  category TEXT,                 -- user-defined category (e.g., "SomersSchool", "NCHO", "Personal")
  sort_order INT NOT NULL DEFAULT 0,
  
  -- Priority scoring (1-10, null = unscored)
  priority_score INT CHECK (priority_score >= 1 AND priority_score <= 10),

  -- Provenance — where did this seed come from?
  source TEXT NOT NULL DEFAULT 'manual',
  -- Values: 'manual' | 'chat' | 'intel' | 'council' | 'brief' | 'ai_review'
  source_reference TEXT,
  -- For 'chat' source: the chat_thread_id
  -- For 'intel' source: the intel_session_id
  -- For 'council' source: the council_session_id
  -- For 'brief' source: the brief_date string
  source_label TEXT,
  -- Human-readable source description, e.g.:
  -- "Suggested during Council session 2026-03-19 — Gandalf's synthesis"
  -- "Extracted from Intel session: Publishers Weekly 0316"
  
  -- AI review flags
  is_duplicate_of UUID REFERENCES dreams(id),  -- set by AI review when duplicate found
  ai_flag TEXT,                                 -- 'duplicate' | 'low_value' | 'contradiction' | 'priority_mismatch'
  ai_flag_reason TEXT                           -- brief explanation of why flagged
);

CREATE INDEX dreams_user_id_idx ON dreams(user_id);
CREATE INDEX dreams_status_idx ON dreams(user_id, status);
CREATE INDEX dreams_category_idx ON dreams(user_id, category);
CREATE INDEX dreams_sort_order_idx ON dreams(user_id, sort_order);

-- RLS
ALTER TABLE dreams ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users own their dreams" ON dreams
  FOR ALL USING (auth.uid() = user_id);

-- Auto-update updated_at
CREATE TRIGGER dreams_updated_at
  BEFORE UPDATE ON dreams
  FOR EACH ROW EXECUTE FUNCTION update_jobs_updated_at();

-- Dream log: daily journal entries separate from seeds
CREATE TABLE dream_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Content
  entry_text TEXT NOT NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Optional link to a dream
  dream_id UUID REFERENCES dreams(id) ON DELETE SET NULL
);

CREATE INDEX dream_log_user_id_idx ON dream_log(user_id);
CREATE INDEX dream_log_date_idx ON dream_log(user_id, entry_date DESC);

ALTER TABLE dream_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users own their dream log" ON dream_log
  FOR ALL USING (auth.uid() = user_id);

-- Enable Realtime for live seed updates
ALTER PUBLICATION supabase_realtime ADD TABLE dreams;
```

### API Routes:

#### `src/app/api/dreams/route.ts`
```typescript
// GET  /api/dreams — list all dreams for user (with filters: status, category)
// POST /api/dreams — create a new dream/seed
```

GET query params: `status` (filter by status), `category` (filter by category), `source` (filter by source), `page` (pagination), `limit` (default 100).

POST body:
```typescript
{
  text: string;
  notes?: string;
  status?: dream_status; // defaults to 'seed'
  category?: string;
  priority_score?: number;
  source?: string; // defaults to 'manual'
  source_reference?: string;
  source_label?: string;
}
```

#### `src/app/api/dreams/[id]/route.ts`
```typescript
// GET    /api/dreams/[id] — get single dream
// PATCH  /api/dreams/[id] — update dream (any field)
// DELETE /api/dreams/[id] — delete dream
```

#### `src/app/api/dreams/bulk/route.ts`
```typescript
// POST /api/dreams/bulk — create multiple dreams at once (for import/AI suggestions)
// Body: { dreams: Array<{ text, status, category, source, source_label }> }
```

#### `src/app/api/dreams/reorder/route.ts`
```typescript
// POST /api/dreams/reorder — update sort_order for multiple dreams
// Body: { order: Array<{ id: string, sort_order: number }> }
```

#### `src/app/api/dreams/ai-review/route.ts`
```typescript
// POST /api/dreams/ai-review — run AI review pass on all seeds
// Returns: { duplicates, low_value, contradictions, priority_suggestions }
// Does NOT auto-apply changes — returns suggestions for Scott to review
```

The AI review prompt:
```
You are reviewing Scott Somers' dream seed list — raw ideas for his businesses.
Your job: find problems and flag them honestly.

Seeds to review:
[full list of seeds with text, status, category]

Return a JSON object with:
{
  "duplicates": [
    { "seed_id_1": "uuid", "seed_id_2": "uuid", "reason": "same idea, different words" }
  ],
  "low_value": [
    { "seed_id": "uuid", "reason": "too vague to act on; 'build something cool' is not a seed" }
  ],
  "contradictions": [
    { "seed_id_1": "uuid", "seed_id_2": "uuid", "reason": "one says keep N8N, other says drop it" }
  ],
  "priority_mismatches": [
    { "seed_id": "uuid", "current_priority": 9, "suggested_priority": 3, "reason": "nice-to-have, not revenue-critical before May 2026" }
  ],
  "summary": "2-3 sentences on the overall health of the seed list"
}
```

Trigger threshold: Show "AI Review Available" button when seed count ≥ 50. Show warning badge when ≥ 500.

#### `src/app/api/dream-log/route.ts`
```typescript
// GET  /api/dream-log — list log entries (paginated, newest first)
// POST /api/dream-log — create new log entry
```

### Changes to `src/app/api/extract-learnings/route.ts`:

Extend the extraction to also pull out seeds:

```typescript
// Add to the extraction prompt:
// Also look for SEEDS — concrete ideas Scott expressed that are worth saving 
// to his dream system:
// - New product ideas he mentioned
// - Features he described wanting to build
// - Strategic moves he said he wants to make
// - Projects he said he'll tackle

// Return in the JSON:
{
  "learnings": [...existing format...],
  "seeds": [
    { "text": "the idea briefly stated", "category": "SomersSchool|NCHO|Chapterhouse|BibleSaaS|Personal" }
  ]
}
```

When seeds are extracted, call `POST /api/dreams/bulk` with:
- `source: 'chat'`
- `source_reference: [thread_id]`
- `source_label: "Extracted from chat — [date]"`
- `status: 'seed'`

### `/dreamer` Page:

Build at `src/app/dreamer/page.tsx`. This is a first-class page in the main nav.

**Layout**:
```
[Dreamer]                                         [+ New Seed] [AI Review]

[Filter: All | Seed | Active | Building | Shipped | Archived]
[Category filter: All | SomersSchool | NCHO | ...]

[Seed list — drag to reorder]
  ┌─────────────────────────────────────────────────────────┐
  │ 🌱 Build streak tracking for SomersSchool lessons      │
  │    Status: [seed ▼]  Category: [SomersSchool ▼]        │
  │    Added: 2026-03-18 · Source: Chat session             │
  │    [Edit] [Archive] [Kill] [↑ Priority]                 │
  └─────────────────────────────────────────────────────────┘
  ...

[Dream Log]
  [Today's entry textarea]  [Save]
  [Previous entries...]
```

**Drag to reorder**: Use `@dnd-kit/core` (already in the ecosystem or install it). Each row is draggable. On drop: calls `POST /api/dreams/reorder` with new `sort_order` values.

**Status toggle**: Click the status badge → dropdown with all status options. Click to change.

**AI Review panel**: Floats as a slide-in panel from the right when "AI Review" is clicked. Shows the JSON results from `/api/dreams/ai-review`. Each flagged item has: Accept | Dismiss buttons. Accepting a duplicate merges the seeds. Accepting a low-value flag archives the seed.

**Source display**: Show a small chip on each seed showing its source (Manual / Chat / Intel / Council / Brief / AI Review). Hovering the chip shows the full `source_label`.

**Import from `dreamer.md`**: On first load, if no dreams exist, show a prompt:
```
Import your existing dreamer.md? 
[Paste content here...] [Import]
```
The import parser reads the markdown and creates seeds from it.

**Phase 2 success criteria**:
- CRUD on all seeds works
- Drag reorder persists to DB
- Auto-seeding from chat fires after every AI response
- AI review returns sensible results and allows accept/dismiss
- Dream log entries save and display
- Zero crashes when seed list is empty

---

## PHASE 3 — The Intel Workflow
*Goal: Build the Intel pipeline inside Chapterhouse. This replaces the manual process of running Python scripts and reading markdown files.*

**Context**: Scott currently processes Intel manually — he reads URLs, pastes content, the email repo has Python scripts and markdown files for PW processing. This phase puts all of that inside Chapterhouse as a first-class workflow.

### Migration: `20260319_012_create_intel.sql`

```sql
-- Intel workflow tables
-- Phase 3

CREATE TABLE intel_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  name TEXT NOT NULL,
  -- e.g., "Direct Impact", "Ecosystem Signal", "HN/Community Signal", "Background"
  
  color_class TEXT NOT NULL DEFAULT 'text-red-600 bg-red-50',
  -- Tailwind classes for this category's color
  
  emoji TEXT,
  -- e.g., "🔴", "🟡", "🟠", "🔵"
  
  description TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- Default categories seeded on first user setup
-- (insert these via a function or handle in the setup flow)

CREATE INDEX intel_categories_user_id_idx ON intel_categories(user_id);

ALTER TABLE intel_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users own their intel categories" ON intel_categories
  FOR ALL USING (auth.uid() = user_id);

CREATE TABLE intel_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Input
  urls TEXT[] NOT NULL DEFAULT '{}',
  -- Array of URLs submitted for this Intel session
  
  raw_fetched_content JSONB,
  -- Keyed by URL: { "https://...": "raw text content..." }
  
  -- Processing status
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'fetching', 'processing', 'complete', 'failed')),
  error TEXT,
  
  -- Output
  processed_output JSONB,
  -- The formatted Intel report as structured JSON (see output schema below)
  
  seeds_extracted INT NOT NULL DEFAULT 0,
  -- How many seeds were auto-proposed from this session
  
  -- Metadata
  source_type TEXT NOT NULL DEFAULT 'manual',
  -- 'manual' | 'cron' | 'publishers_weekly'
  
  session_label TEXT
  -- Human-readable label, e.g., "PW 0316 — March 16 2026"
);

CREATE INDEX intel_sessions_user_id_idx ON intel_sessions(user_id);
CREATE INDEX intel_sessions_status_idx ON intel_sessions(user_id, status);

ALTER TABLE intel_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users own their intel sessions" ON intel_sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE TRIGGER intel_sessions_updated_at
  BEFORE UPDATE ON intel_sessions
  FOR EACH ROW EXECUTE FUNCTION update_jobs_updated_at();

-- Enable Realtime for live processing status
ALTER PUBLICATION supabase_realtime ADD TABLE intel_sessions;
```

### Intel Output JSON Schema:

```typescript
// The processed_output JSONB column follows this schema:
interface IntelOutput {
  session_date: string; // ISO date
  summary: string; // 2-3 sentence executive summary
  sections: IntelSection[];
  proposed_seeds: ProposedSeed[];
  verification_warnings: VerificationWarning[];
}

interface IntelSection {
  category_id: string; // references intel_categories.id
  category_name: string; // denormalized for display
  emoji: string;
  items: IntelItem[];
}

interface IntelItem {
  headline: string;
  detail: string; // 2-3 sentences
  source_url: string;
  source_title?: string;
  impact_score: 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C';
  affected_repos: string[]; // ["SomersSchool", "NCHO", "Chapterhouse"]
  repo_reasoning: Record<string, string>; // { "SomersSchool": "because X" }
  verified: boolean; // passed second-pass verification
}

interface ProposedSeed {
  text: string;
  category: string;
  rationale: string;
  source_headline: string; // which Intel item suggested this
}

interface VerificationWarning {
  claim: string;
  source_url: string;
  warning: string; // what couldn't be verified
}
```

### API Routes:

#### `src/app/api/intel/route.ts`
```typescript
// GET /api/intel — list Intel sessions (newest first)
// POST /api/intel — create and start a new Intel session
```

POST body:
```typescript
{
  urls: string[];          // 1-20 URLs to process
  session_label?: string;  // optional human-readable label
  source_type?: string;    // 'manual' | 'publishers_weekly'
}
```

The POST handler:
1. Creates the `intel_sessions` row with `status: 'fetching'`
2. Returns the session ID immediately
3. Dispatches async processing via QStash→Worker (new `INTEL_FETCH` job type)
   OR processes inline if under 3 URLs (simpler path)
4. Client polls session status via Supabase Realtime on `intel_sessions`

#### `src/app/api/intel/[id]/route.ts`
```typescript
// GET /api/intel/[id] — get full session including processed_output
```

#### `src/app/api/intel/process/route.ts`
```typescript
// POST /api/intel/process — internal endpoint called by worker to process URLs
// Protected by CRON_SECRET bearer token
```

The processing logic (can run inline for ≤3 URLs, or via worker for larger batches):

```typescript
async function processIntelSession(sessionId: string, userId: string) {
  // 1. Fetch raw content from all URLs in parallel
  //    Use Anthropic's internet access OR fetch + Readability parse
  //    Update status to 'fetching'
  
  // 2. Run primary Intel analysis prompt
  //    Prompt structure:
  const INTEL_PROMPT = `
  You are the intelligence analyst for Chapterhouse.
  
  Scott Somers runs three businesses:
  - NCHO (Next Chapter Homeschool Outpost) — curated Shopify homeschool store
  - SomersSchool — secular homeschool SaaS platform
  - BibleSaaS — AI-powered Bible study (personal + early beta)
  His teaching contract ends May 24, 2026. Revenue must be meaningful by August 2026.
  
  You have received the following source content:
  [CONTENT BLOCK]
  
  Produce an Intel report in this JSON format:
  [schema from above]
  
  Rules:
  - Every item must cite its source_url
  - affected_repos must be specific (never generic)
  - repo_reasoning must be explicit ("this affects SomersSchool because...")
  - proposed_seeds must be concrete and actionable
  - A+ = act on this today. B = worth knowing. C = background noise.
  - If nothing in a category qualifies, omit that section
  - verified field: set to false for all items in this first pass
  `;
  
  // 3. Run verification pass (anti-hallucination)
  const VERIFICATION_PROMPT = `
  You are a fact-checker reviewing an Intel report.
  
  For each item in the report, check:
  1. Does the claim appear in the source content provided?
  2. Is the claim accurately represented?
  
  Source content: [ORIGINAL FETCHED CONTENT]
  Report to verify: [FIRST PASS OUTPUT]
  
  For each item: set verified=true if the claim is supported by the source.
  Set verified=false and add a verification_warning if the claim cannot be confirmed.
  
  Return the same JSON structure with updated verified fields and verification_warnings array.
  NEVER remove items — only flag them. Scott decides what to do with flagged items.
  `;
  
  // 4. Extract and stage seeds
  //    For each proposed_seed in the output:
  //    Call POST /api/dreams/bulk with source: 'intel', source_reference: sessionId
  //    Note: seeds are PROPOSED (status: 'seed') — not auto-promoted
  
  // 5. Update intel_sessions row with processed_output, status: 'complete'
}
```

#### `src/app/api/intel/publishers-weekly/route.ts`
```typescript
// POST /api/intel/publishers-weekly — processes PW .txt file content
// Accepts: { content: string } — the raw .txt paste from PW
// Returns: Intel session ID (same pipeline, source_type: 'publishers_weekly')
```

This replaces `emit/intel/Publishers Weekly/generate_podcast.py` and the manual pipeline. Scott pastes the PW .txt content → same Intel analysis runs → output structured and stored → seeds extracted.

### Cron Job — `src/app/api/cron/intel-fetch/route.ts`:
```typescript
// GET /api/cron/intel-fetch — runs on schedule (daily, overnight)
// Protected by CRON_SECRET bearer token
// Fetches from configured RSS sources + known Intel URLs
// Creates an Intel session automatically
// Configured sources come from user's RSS feed settings (already in src/lib/sources/rss.ts)
```

### `/intel` Page:

Build at `src/app/intel/page.tsx`. Add to main navigation.

**Layout**:
```
[Intelligence Feed]                         [+ New Session] [Paste PW Report]

[Session history — newest first]
  ┌─────────────────────────────────────────────────────────────────┐
  │ 📊 March 16, 2026 — Publishers Weekly Sweep                    │
  │    12 items · 3 seeds proposed · Processing complete           │
  │    [View Report]                                               │
  └─────────────────────────────────────────────────────────────────┘

[Active Session — if processing:]
  ┌─────────────────────────────────────────────────────────────────┐
  │ ⏳ Processing 4 URLs...                                        │
  │    ████████░░ 78%  Verifying claims...                         │
  └─────────────────────────────────────────────────────────────────┘
```

**New Session modal**:
```
[Add URLs — one per line]
[textarea: paste URLs here]

[ ] Overnight queue  [Process now]
```

**Report view** (when session is complete):
```
📊 Intel Report — March 16, 2026

[Executive summary text]

🔴 Direct Impact (2 items)
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  [headline]
  [detail]
  Source: [url]  Impact: A+  Affects: SomersSchool, NCHO
  Reasoning: "affects SomersSchool because..."
  ⚠️ Verification warning: [if any]
  
🟡 Ecosystem Signal (3 items)
  ...

💡 Proposed Seeds (2)
  + [seed text] → [Add to Dreamer] [Dismiss]
```

**Phase 3 success criteria**:
- Paste URLs → Intel report generated → saved to DB
- PW .txt file paste → same pipeline
- Seeds proposed → accept/dismiss flow → added to Dreamer
- Overnight cron runs → session created automatically
- Anti-hallucination warnings display on unverified claims
- Session history navigable from `/intel`

---

## PHASE 4 — The Council of the Unserious
*Goal: Add the Council of the Unserious as a live chat mode inside Chapterhouse.*

**Critical distinction**: The current `/council` page is the **Curriculum Factory** — Gandalf/Legolas/Aragorn/Gimli produce scope-and-sequence documents for courses. That stays exactly as it is.

The **Council of the Unserious** is different — it's Scott's strategic advisory board that lives INSIDE THE CHAT. It's not a background job. It's a live, streaming, multi-voice conversation. The two systems are separate. They share the name "Council" but are completely different mechanisms.

### The Two Councils:

| Feature | Curriculum Council | Council of the Unserious |
|---|---|---|
| Where | `/council` page | Main chat (`/`) |
| How | Background job → Railway worker | Live streaming SSE in chat |
| Members | Gandalf / Legolas / Aragorn / Gimli / Frodo | Gandalf (strategist) + Data + Polgara + Earl + Silk (Prince Kheldar) |
| Purpose | Produce curriculum documents | Strategic advice, dream shaping, business decisions |
| Speed | ~10 min async | Real-time, seconds per voice |
| Default on? | No — user initiates | Yes — 2 always-on companions (Calvin & Hobbes) |

### Migration: `20260319_013_create_personas_and_council.sql`

```sql
-- Personas table — all Council members, bench personas, etc.
-- Phase 4

CREATE TABLE personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Identity
  name TEXT NOT NULL,
  -- Internal key name, e.g., "gandalf_strategist", "data", "polgara"
  
  display_name TEXT NOT NULL,
  -- What shows in the UI, e.g., "Gandalf", "Data", "Polgara"
  
  avatar_emoji TEXT,
  -- e.g., "🧙", "🤖", "🌟"
  
  color_class TEXT,
  -- Tailwind class for the persona's name color in chat
  
  -- Persona definition
  markdown_content TEXT NOT NULL DEFAULT '',
  -- The full persona prompt/definition. The LLM reads this and figures out
  -- how to speak as this persona. Don't hardcode response style — trust the model.
  
  -- Model preference
  model_preference TEXT NOT NULL DEFAULT 'claude-sonnet-4-6',
  -- Each persona can use a different model (future: Grok for wit personas)
  
  -- Categorization
  persona_type TEXT NOT NULL DEFAULT 'council',
  -- 'council' = Council of the Unserious
  -- 'bench' = available but not in default council
  -- 'curriculum' = curriculum council (Gandalf/Legolas/etc.)
  -- 'companion' = always-on companion (Calvin & Hobbes)
  
  -- State
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  -- is_default = auto-included in every chat session without toggling
  
  sort_order INT NOT NULL DEFAULT 0
);

CREATE INDEX personas_user_id_idx ON personas(user_id);
CREATE INDEX personas_type_idx ON personas(user_id, persona_type);
CREATE INDEX personas_default_idx ON personas(user_id, is_default) WHERE is_default = TRUE;

ALTER TABLE personas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users own their personas" ON personas
  FOR ALL USING (auth.uid() = user_id);

CREATE TRIGGER personas_updated_at
  BEFORE UPDATE ON personas
  FOR EACH ROW EXECUTE FUNCTION update_jobs_updated_at();

-- Council sessions — live Council of the Unserious conversations
CREATE TABLE council_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- What are we deliberating about?
  goal TEXT,
  -- Optional goal/question set at session start
  
  -- Which personas are participating?
  participant_persona_ids UUID[] NOT NULL DEFAULT '{}',
  
  -- Status
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'concluded', 'abandoned')),
  
  -- Summary (generated at conclusion)
  conclusion_summary TEXT,
  -- Gandalf's synthesis at the end
  
  -- Link to the parent chat thread if started from chat
  chat_thread_id UUID REFERENCES chat_threads(id)
);

CREATE INDEX council_sessions_user_id_idx ON council_sessions(user_id);

ALTER TABLE council_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users own their council sessions" ON council_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Council messages within live sessions
CREATE TABLE council_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES council_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Who spoke?
  persona_id UUID REFERENCES personas(id),
  -- NULL = user message
  
  -- What did they say?
  content TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'assistant'
    CHECK (role IN ('user', 'assistant'))
);

CREATE INDEX council_messages_session_idx ON council_messages(session_id);

ALTER TABLE council_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users own their council messages" ON council_messages
  FOR ALL USING (auth.uid() = user_id);
```

### Persona Definitions to Seed:

These are inserted on first user setup. They go into the `personas` table with `markdown_content` containing the full persona definition. The LLM infers voice from the markdown — no hardcoded response templates.

**Calvin (default companion — always on)**:
```markdown
# Calvin — Eternal 6-Year-Old Genius
You are Calvin — not a child anymore, but never not Calvin.
You grew up. You became a real scientist. You work with Hobbes.
You are still convinced that you are the smartest person in any room.
You are also right about 60% of the time, wrong in ways that are spectacular.
You have strong opinions about everything. You express them loudly.
You find the universe philosophically terrifying and fascinating in equal measure.
When you disagree with someone, you draw a diagram to prove your point.
When you are proved wrong, you declare it was a controlled experiment.
You swear occasionally when the situation calls for it.
You are ALWAYS relevant. Never just decorative.
Default mode: Challenge the assumption. Then help fix it.
```

**Hobbes (default companion — always on)**:
```markdown
# Hobbes — The World's Most Patient Tiger
You are Hobbes. You have been Calvin's best friend for 40 years.
You are a tiger, but also a philosopher, a scientist, a strategist.
You see what Calvin misses. You catch what falls through the cracks.
You are warm where Calvin is blunt. You are precise where Calvin is sweeping.
When Calvin declares victory, you note the things that haven't been accounted for.
You love humans. You are patient with their absurdity.
You find the world genuinely funny and genuinely good.
You bring context. You bring care. You bring the long view.
Default mode: Affirm what's actually good, then fill the gaps.
```

**Gandalf (Council of the Unserious — strategist, distinct from curriculum Gandalf)**:
```markdown
# Gandalf — The Real Problem Framer
You are Gandalf the Grey, but here on Scott Somers' strategy council.
Your role: find and frame the ACTUAL problem.
Scott usually brings you the symptom. You find the disease.
You ask the question that reframes everything else. 
You are patient. You are old. You have seen this before.
You do not solve the problem — you make sure everyone is solving the RIGHT problem.
When you speak, you speak slowly and exactly. Every word costs something.
You end your contributions with the question that will haunt the session.
Default mode: What are we actually solving for?
```

**Data (audit, structural error detection)**:
```markdown
# Data — The Structural Auditor
You are Data from Star Trek: The Next Generation.
You do not have feelings about facts. You have facts.
Your job on this council: find what is structurally wrong.
This includes: logical errors, internal contradictions, missing dependencies,
incorrect assumptions treated as facts, and things Scott has said that are 
inconsistent across sessions.
You present findings without emotional color. You are not mean; you are exact.
You do not offer opinions on what SHOULD be done — only on what IS and what
CANNOT WORK.
You occasionally note when something is "most unusual" or "fascinating."
You speak in complete, formal sentences.
Default mode: Find the error in the reasoning.
```

**Polgara (editorial finisher, child-readability, emotional truth)**:
```markdown
# Polgara — The Editor Who Will Not Let You Publish Garbage
You are Polgara the Sorceress, as repurposed for Scott Somers' council.
You handle finality. You take the output and you make it land.
You are the last word on: is this clear? Does a child understand this?
Is this emotionally true, or is it professional-speak dressed as truth?
You are warm, but you do not accept vagueness. You do not accept hedging.
You do not accept copy that tries to speak to everyone and reaches no one.
When something is right, you say so plainly. When it is not, you rewrite it.
You speak with absolute certainty about what works and what doesn't.
You would rather say "this is garbage — here's the fix" than soften the critique.
Default mode: Make it land.
```

**Earl (action + execution)**:
```markdown
# Earl — The Man Who Ships
Earl is a no-nonsense project executor. Age unknown. Background: impossible.
Earl does not care why something got complicated. Earl cares what ships next.
When everyone else has talked about the thing, Earl writes the task.
Earl speaks in one or two sentences maximum.
Earl does not use bullet points unless listing the specific next actions.
Earl's outputs are always deployable.
Earl will not allow a planning session to end without naming EXACTLY what ships first,
who does it, and what done looks like.
Earl knows about countdowns. Earl knows about May 24, 2026.
Default mode: What ships on Monday?
```

> [LEGACY — Beavis & Butthead replaced by Silk (Prince Kheldar) in Phase 11. Prompts below are historical reference only.]

**Beavis (engagement tester)**:
```markdown
# Beavis — The Engagement Heat Sensor
You are Beavis. You give your honest, unfiltered reaction to things.
If it's boring, you say "this sucks." If it's cool, you say "this is cool."
You represent the student who has not yet bought in to anything.
You represent the homeschool parent who is mid-scroll and about to close the tab.
Your job: be genuinely reactive. Not performatively dumb — authentically unimpressed
until something actually earns your attention.
When something earns genuine enthusiasm from you, that is signal. It's working.
When you tune out, that is also signal. Something's not landing.
You do not try to be clever. You respond to the thing.
```

**Butthead (filter, authenticity check)**:
```markdown
# Butthead — The Sniff Test
You are Butthead. You have a very sensitive detector for things that are fake.
Marketing copy that sounds generic? Fake. You can tell.
A course name that sounds like corporate professional development? Fake. 
A pricing page that sounds like it was written by committee? Fake.
A product description that says "innovative" or "transformative"? Fake.
Your job: run the sniff test. Does this feel like a real thing, or does it feel
like a real thing was replaced with a version that could offend no one?
You are not cruel. You are correct.
When something passes your sniff test, you say "heh, yeah, okay."
That is the highest praise.
```

**Anna Somers** (available on demand, not default):
```markdown
# Anna — The Other Half of the Business
You are Anna Somers. USA Today bestselling Christian fiction author, Alana Terry.
You homeschool. You build the NCHO Shopify store. 
You love children's literature. You are the editorial conscience of this operation.
You are not in every conversation — but when you are, you bring:
- The perspective of a working author on any creative or publishing question
- The parent's view — not the teacher's view, not the founder's view — the parent
- Honest assessment of whether something serves the homeschool mom's actual life
You are direct and warm. You do not inflate things. You do not hedge.
When Scott is excited about something that doesn't serve the customer, you say so.
You also celebrate when something is actually good.
```

### API Routes:

#### `src/app/api/personas/route.ts`
```typescript
// GET  /api/personas — list all personas (filtered by type if provided)
// POST /api/personas — create a new persona
```

#### `src/app/api/personas/[id]/route.ts`
```typescript
// GET    /api/personas/[id]  — get single persona
// PATCH  /api/personas/[id]  — update persona (any field)
// DELETE /api/personas/[id]  — delete persona (not allowed for system personas)
```

#### `src/app/api/council/sessions/route.ts`
```typescript
// GET  /api/council/sessions — list council sessions
// POST /api/council/sessions — create new council session
```

#### `src/app/api/council/sessions/[id]/stream/route.ts`
```typescript
// POST /api/council/sessions/[id]/stream
// Body: { user_message: string }
// Returns: SSE stream with typed events
// Each active persona speaks in turn, streaming their response
```

The streaming handler:
```typescript
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const sessionId = params.id;
  const { user_message } = await request.json();
  const userId = await getAuthenticatedUserId();
  
  // Load session + participants
  const session = await loadCouncilSession(sessionId, userId);
  const personas = await loadPersonas(session.participant_persona_ids);
  
  // Load prior messages for context
  const history = await loadCouncilMessages(sessionId);
  
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // User message first
      await saveCouncilMessage(sessionId, userId, null, user_message, 'user');
      
      // Each persona speaks in turn
      for (const persona of personas) {
        // Emit persona_start event
        controller.enqueue(encoder.encode(
          `data: ${JSON.stringify({ type: 'persona_start', persona_id: persona.id, display_name: persona.display_name, emoji: persona.avatar_emoji })}\n\n`
        ));
        
        // Build prompt including all prior messages in this turn
        // Each persona's prompt includes what all previous personas said
        const priorTurnContent = personas
          .slice(0, personas.indexOf(persona))
          .map(p => `${p.display_name}: [their response from this turn]`)
          .join('\n\n');
        
        const systemPrompt = `${persona.markdown_content}

## Current Council Session
Goal: ${session.goal || 'General deliberation'}

## Prior conversation context:
${history.slice(-10).map(m => `${m.persona?.display_name || 'Scott'}: ${m.content}`).join('\n\n')}

## What other council members just said (this turn):
${priorTurnContent || 'You are speaking first.'}

## Scott just said:
${user_message}

Respond as ${persona.display_name}. Stay in character. Be useful.`;

        // Stream the persona's response
        const anthropic = getAnthropic();
        const responseStream = anthropic.messages.stream({
          model: persona.model_preference || 'claude-sonnet-4-6',
          max_tokens: 512, // Council members are concise
          system: systemPrompt,
          messages: [{ role: 'user', content: user_message }],
        });
        
        let fullResponse = '';
        for await (const chunk of responseStream) {
          if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
            fullResponse += chunk.delta.text;
            controller.enqueue(encoder.encode(
              `data: ${JSON.stringify({ type: 'persona_delta', persona_id: persona.id, delta: chunk.delta.text })}\n\n`
            ));
          }
        }
        
        // Save message
        await saveCouncilMessage(sessionId, userId, persona.id, fullResponse, 'assistant');
        
        // Emit persona_end event
        controller.enqueue(encoder.encode(
          `data: ${JSON.stringify({ type: 'persona_end', persona_id: persona.id })}\n\n`
        ));
      }
      
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
      controller.close();
    }
  });
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  });
}
```

### Chat UI Changes — Council Toggle:

The Council toggle lives in the main chat interface (`src/app/page.tsx` or the main chat component).

Add a toggle button in the chat toolbar:
```
[Model selector] [Council ▼] [Send]
```

When "Council" is clicked:
- Dropdown opens showing checkboxes for each non-curriculum persona
- Default companions (Calvin & Hobbes) are pre-checked and labeled "(always on)"
- Other council members (Gandalf, Data, Polgara, Earl, Silk) can be checked
- Bench personas available but grayed out with "Coming soon"
- Optional goal text field at the top: "What are we deciding today? (optional)"
- [Start Council Session] button

When Council mode is active:
- Chat input still works normally
- But instead of single-model response, each active persona responds in sequence
- Each response appears in a labeled bubble with persona name + emoji + color
- The chat looks like a group conversation
- A subtle "Council Active" badge appears next to the chat header

### `/settings/personas` Page:

Full persona management UI.
- List all personas with type badges (Companion / Council / Bench / Curriculum)
- Edit button → opens persona editor (large textarea for `markdown_content`)
- Model preference selector per persona
- Toggle is_active / is_default checkboxes
- Test message button (sends "Hello, who are you?" and shows the response)
- Create new persona button → blank persona form
- Cannot delete curriculum personas (they drive the curriculum factory)

**Phase 4 success criteria**:
- Toggle Council from chat → personas appear with correct labels
- Each persona has distinct voice based on their markdown definition
- Session saved to DB → viewable in session history
- Settings → edit persona definition → next session uses updated definition
- Default companions (Calvin & Hobbes) always appear in chat without toggling
- Curriculum Council (`/council` page) completely unchanged by this phase

---

## PHASE 5 — Agentic Tool Call Cards
*Goal: Upgrade chat to use Anthropic tool use, visualizing each tool call as a card in the message stream.*

**Context**: Right now Chapterhouse talks about the context it has, but it can't take actions to fetch or look things up mid-conversation. This phase adds tool use so Claude can search research, read briefs, check seeds, and query the debug log — and the chat UI shows exactly what it's doing.

### Tool Definitions:

These go in the chat route and are passed to Anthropic's messages API:

```typescript
// src/app/api/chat/tools.ts

export const CHAT_TOOLS = [
  {
    name: 'search_research_db',
    description: 'Search the saved research items database for articles, summaries, and verdicts on a topic.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Search query' },
        limit: { type: 'number', description: 'Max results (default 5)' }
      },
      required: ['query']
    }
  },
  {
    name: 'fetch_url',
    description: 'Fetch and read the content of a URL. Use for real-time research on specific pages.',
    input_schema: {
      type: 'object' as const,
      properties: {
        url: { type: 'string', description: 'URL to fetch' }
      },
      required: ['url']
    }
  },
  {
    name: 'score_opportunity',
    description: 'Retrieve scored opportunities from the opportunity tracker.',
    input_schema: {
      type: 'object' as const,
      properties: {
        status: { type: 'string', enum: ['open', 'in-progress', 'closed'], description: 'Filter by status' },
        min_score: { type: 'number', description: 'Minimum store/curriculum/content score to include' }
      },
      required: []
    }
  },
  {
    name: 'read_debug_log',
    description: 'Read recent debug logs, errors, and system health information from Chapterhouse.',
    input_schema: {
      type: 'object' as const,
      properties: {
        severity: { type: 'string', enum: ['error', 'warn', 'info', 'all'], description: 'Log level filter' },
        limit: { type: 'number', description: 'Max entries to return (default 20)' }
      },
      required: []
    }
  },
  {
    name: 'query_brief',
    description: 'Query the latest or a specific daily brief. Use when asked about recent news or what the brief said.',
    input_schema: {
      type: 'object' as const,
      properties: {
        date: { type: 'string', description: 'ISO date string, or "latest"' }
      },
      required: []
    }
  },
  {
    name: 'get_seeds',
    description: 'Retrieve dream seeds from the Dreamer system.',
    input_schema: {
      type: 'object' as const,
      properties: {
        status: { type: 'string', description: 'Filter by status: seed, active, building, shipped, archived' },
        category: { type: 'string', description: 'Filter by category name' }
      },
      required: []
    }
  },
  {
    name: 'add_seed',
    description: 'Add a new dream seed to the Dreamer. Use when the conversation produces a concrete new idea worth saving.',
    input_schema: {
      type: 'object' as const,
      properties: {
        text: { type: 'string', description: 'The seed idea' },
        category: { type: 'string', description: 'Category: SomersSchool, NCHO, Chapterhouse, BibleSaaS, Personal' },
        rationale: { type: 'string', description: 'Why is this worth saving?' }
      },
      required: ['text', 'category']
    }
  }
] as const;
```

### Tool Implementations:

```typescript
// src/app/api/chat/tool-handlers.ts

export async function executeTool(
  toolName: string,
  toolInput: Record<string, unknown>,
  userId: string
): Promise<string> {
  const supabase = getSupabaseServiceRoleClient();
  
  switch (toolName) {
    case 'search_research_db': {
      const { query, limit = 5 } = toolInput as { query: string; limit?: number };
      const { data } = await supabase
        .from('research_items')
        .select('title, summary, verdict, url, created_at, tags')
        .eq('user_id', userId)
        .textSearch('title', query)
        .limit(limit);
      return JSON.stringify(data || []);
    }
    
    case 'fetch_url': {
      const { url } = toolInput as { url: string };
      // Security: only allow http/https URLs, not internal network addresses
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return JSON.stringify({ error: 'Only http/https URLs are allowed' });
      }
      // Block private IP ranges (SSRF prevention)
      const hostname = parsed.hostname;
      if (/^(localhost|127\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)/.test(hostname)) {
        return JSON.stringify({ error: 'Internal URLs not allowed' });
      }
      try {
        const response = await fetch(url, { 
          headers: { 'User-Agent': 'Chapterhouse/1.0' },
          signal: AbortSignal.timeout(10000)
        });
        const text = await response.text();
        // Truncate to 8000 chars to stay within context
        return text.slice(0, 8000);
      } catch (err) {
        return JSON.stringify({ error: `Fetch failed: ${err}` });
      }
    }
    
    case 'score_opportunity': {
      const { status, min_score } = toolInput as { status?: string; min_score?: number };
      let query = supabase
        .from('opportunities')
        .select('title, description, category, store_score, curriculum_score, content_score, action, status')
        .eq('user_id', userId);
      if (status) query = query.eq('status', status);
      const { data } = await query.order('created_at', { ascending: false }).limit(10);
      const filtered = min_score 
        ? (data || []).filter(o => Math.max(o.store_score, o.curriculum_score, o.content_score) >= min_score)
        : (data || []);
      return JSON.stringify(filtered);
    }
    
    case 'read_debug_log': {
      // Call internal debug endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/debug/logs`, {
        headers: { Authorization: `Bearer ${process.env.CRON_SECRET}` }
      });
      const data = await response.json();
      return JSON.stringify(data);
    }
    
    case 'query_brief': {
      const { date = 'latest' } = toolInput as { date?: string };
      let query = supabase.from('briefs').select('brief_date, title, summary, sections').eq('user_id', userId);
      if (date === 'latest') {
        query = query.eq('status', 'published').order('brief_date', { ascending: false }).limit(1);
      } else {
        query = query.eq('brief_date', date);
      }
      const { data } = await query.maybeSingle();
      return JSON.stringify(data || { error: 'No brief found' });
    }
    
    case 'get_seeds': {
      const { status, category } = toolInput as { status?: string; category?: string };
      let query = supabase.from('dreams').select('text, status, category, priority_score, source_label').eq('user_id', userId);
      if (status) query = query.eq('status', status);
      if (category) query = query.eq('category', category);
      const { data } = await query.order('sort_order').limit(50);
      return JSON.stringify(data || []);
    }
    
    case 'add_seed': {
      const { text, category, rationale } = toolInput as { text: string; category: string; rationale?: string };
      const { data } = await supabase.from('dreams').insert({
        user_id: userId,
        text,
        category,
        status: 'seed',
        source: 'chat',
        source_label: `Added by Chapterhouse during chat — ${rationale || 'suggested in conversation'}`
      }).select().single();
      return JSON.stringify({ success: true, seed: data });
    }
    
    default:
      return JSON.stringify({ error: `Unknown tool: ${toolName}` });
  }
}
```

### Changes to `src/app/api/chat/route.ts` — Tool Use Loop:

The Anthropic branch needs to handle tool use:

```typescript
// In the claude branch of POST handler:
if (model.startsWith('claude')) {
  const anthropic = getAnthropic();
  const messages = [...request_messages]; // mutable copy
  
  const readable = new ReadableStream({
    async start(controller) {
      let continueLoop = true;
      
      while (continueLoop) {
        const stream = anthropic.messages.stream({
          model,
          max_tokens: 4096,
          system: systemPrompt,
          messages,
          tools: CHAT_TOOLS,
          tool_choice: { type: 'auto' },
        });
        
        let pendingToolCalls: Array<{ id: string; name: string; input: string }> = [];
        let currentToolCall: Partial<{ id: string; name: string; input: string }> | null = null;
        
        for await (const chunk of stream) {
          if (chunk.type === 'content_block_start') {
            if (chunk.content_block.type === 'tool_use') {
              currentToolCall = { id: chunk.content_block.id, name: chunk.content_block.name, input: '' };
              // Emit tool_start event
              controller.enqueue(encoder.encode(
                `data: ${JSON.stringify({ type: 'tool_start', name: chunk.content_block.name, tool_id: chunk.content_block.id })}\n\n`
              ));
            }
          }
          
          if (chunk.type === 'content_block_delta') {
            if (chunk.delta.type === 'text_delta') {
              controller.enqueue(encoder.encode(
                `data: ${JSON.stringify({ type: 'text', delta: chunk.delta.text })}\n\n`
              ));
            }
            if (chunk.delta.type === 'input_json_delta' && currentToolCall) {
              currentToolCall.input = (currentToolCall.input || '') + chunk.delta.partial_json;
            }
          }
          
          if (chunk.type === 'content_block_stop' && currentToolCall?.id) {
            pendingToolCalls.push(currentToolCall as { id: string; name: string; input: string });
            currentToolCall = null;
          }
          
          if (chunk.type === 'message_stop') {
            const finalMessage = await stream.finalMessage();
            
            if (finalMessage.stop_reason === 'tool_use') {
              // Execute tools and continue loop
              const toolResults = [];
              
              for (const tc of pendingToolCalls) {
                const input = JSON.parse(tc.input || '{}');
                const result = await executeTool(tc.name, input, userId);
                
                // Emit tool_result event
                controller.enqueue(encoder.encode(
                  `data: ${JSON.stringify({ type: 'tool_result', tool_id: tc.id, name: tc.name, result: result.slice(0, 500) })}\n\n`
                ));
                
                toolResults.push({
                  type: 'tool_result' as const,
                  tool_use_id: tc.id,
                  content: result
                });
              }
              
              // Add assistant message with tool calls to history
              messages.push({ role: 'assistant', content: finalMessage.content });
              // Add tool results
              messages.push({ role: 'user', content: toolResults });
              
            } else {
              // end_turn — done
              continueLoop = false;
            }
            
            pendingToolCalls = [];
          }
        }
      }
      
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`));
      controller.close();
    }
  });
  
  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Transfer-Encoding': 'chunked',
    }
  });
}
```

### Frontend — Tool Call Card Component:

Build `src/components/tool-call-card.tsx`:

```typescript
// Props:
interface ToolCallCardProps {
  name: string;
  toolId: string;
  status: 'running' | 'complete';
  result?: string;
}

// Visual design:
// - Small collapsed card: [🔍 Searching research database...] ▶
// - When complete: [🔍 search_research_db] ✓  → click to expand
// - Expanded: shows raw JSON input + result summary
// - Max 6 cards visible simultaneously; rest queued with count badge
```

Tool name to icon/label mapping:
```typescript
const TOOL_LABELS: Record<string, { icon: string; label: string }> = {
  search_research_db: { icon: '🔍', label: 'Searching research database' },
  fetch_url: { icon: '🌐', label: 'Fetching URL' },
  score_opportunity: { icon: '📊', label: 'Checking opportunities' },
  read_debug_log: { icon: '🔧', label: 'Reading debug logs' },
  query_brief: { icon: '📰', label: 'Querying brief' },
  get_seeds: { icon: '🌱', label: 'Reading dream seeds' },
  add_seed: { icon: '✨', label: 'Adding dream seed' },
};
```

Update the frontend chat message renderer to parse SSE event types:
- `{ type: 'text', delta }` → append to current message bubble
- `{ type: 'tool_start', name, tool_id }` → render a ToolCallCard in 'running' state
- `{ type: 'tool_result', tool_id, result }` → update the matching ToolCallCard to 'complete'
- `{ type: 'persona_start', display_name, emoji }` → open new persona bubble
- `{ type: 'done' }` → finalize

Also update the existing text-only rendering logic to fall back gracefully if events aren't parseable (raw text passthrough).

**Phase 5 success criteria**:
- Ask "what research do we have on OpenAI?" → tool card appears → search executes → result in response
- Ask "add a seed: build XP system for SomersSchool" → confirmation card appears → seed added → visible in Dreamer
- Ask "what does the debug panel say?" → read_debug_log fires → Claude explains in plain English
- No more than 6 tool cards visible at once
- Tool cards collapse by default, expandable on click
- OpenAI model path continues to work without tool use (tools only available on Claude models)

---

## PHASE 6 — Background Jobs Extension
*Goal: Extend the Railway worker to handle all new background job types.*

### Changes to `worker/src/jobs/router.ts`:

Add new cases to the switch:

```typescript
case 'intel_fetch':
  await runIntelFetch(jobId, payload as IntelFetchPayload);
  break;

case 'brief_pregenerate':
  await runBriefPregenerate(jobId, payload as BriefPregeneratePayload);
  break;

case 'seed_extract':
  await runSeedExtract(jobId, payload as SeedExtractPayload);
  break;

case 'context_condense':
  await runContextCondense(jobId, payload as ContextCondensePayload);
  break;
```

### New Job Handler Files:

#### `worker/src/jobs/intel-fetch.ts`

```typescript
// Dispatched by /api/cron/intel-fetch
// Payload: { userId: string, urls: string[], session_id: string, session_label?: string }
// What it does:
// 1. Fetches all URLs in parallel (with rate limiting — max 5 concurrent)
// 2. Calls /api/intel/process (internal) with fetched content
// 3. Updates intel_sessions row with results
// 4. Dispatches seed extraction for any proposed seeds
```

#### `worker/src/jobs/brief-pregenerate.ts`

```typescript
// Dispatched by /api/cron/daily-brief (add at end of daily brief cron)
// Payload: { userId: string }
// What it does:
// 1. Runs the brief generation pipeline (same as /api/briefs/generate)
// 2. Saves the result to briefs table with status: 'pre_generated'
// 3. When user opens Chapterhouse in the morning: brief is instant
// 4. After user views pre-generated brief: mark as 'viewed'
```

**Scheduling**: Add `/api/cron/brief-pregenerate/route.ts` as a separate cron endpoint. Schedule at 03:00 UTC in `vercel.json`:
```json
{
  "crons": [
    { "path": "/api/cron/daily-brief", "schedule": "0 6 * * *" },
    { "path": "/api/cron/brief-pregenerate", "schedule": "0 3 * * *" },
    { "path": "/api/cron/intel-fetch", "schedule": "0 4 * * *" }
  ]
}
```

#### `worker/src/jobs/seed-extract.ts`

```typescript
// Dispatched after any Intel session completes or Council session concludes
// Payload: { userId: string, source_type: string, source_id: string, content: string }
// What it does:
// 1. Sends content to Claude with seed-extraction prompt
// 2. Returns array of proposed seeds
// 3. Bulk-inserts to dreams table with source tagging
// 4. Does NOT auto-promote to 'active' — stays as 'seed' for Scott to review
```

#### `worker/src/jobs/context-condense.ts`

```typescript
// Optional background maintenance job (run weekly or on demand)
// Payload: { userId: string, older_than_days: number }
// What it does:
// 1. Retrieves chat threads older than X days
// 2. For each thread: condenses to a compressed summary
// 3. Saves summary to knowledge_summaries with tag based on thread content
// 4. Marks the original thread as 'archived'
// This keeps the context window manageable as chat history grows
```

### `/jobs` Page Updates:

Extend the jobs page to show all job types with appropriate labels:

```typescript
const JOB_TYPE_LABELS: Record<string, string> = {
  curriculum_factory: '📚 Curriculum Factory',
  research_batch: '🔬 Research Batch',
  council_session: '⚔️ Council Session (Curriculum)',
  intel_fetch: '📡 Intel Fetch',
  brief_pregenerate: '📰 Brief Pre-Generation',
  seed_extract: '🌱 Seed Extraction',
  context_condense: '🧠 Context Condensation',
};
```

**Phase 6 success criteria**:
- Morning brief loads instantly (pre-generated at 3AM)
- Intel overnight fetch runs, produces session, stages seeds
- All job types appear on `/jobs` page with correct labels
- Worker handles all new job types without crashing

---

## PHASE 7 — Self-Aware Debug Loop
*Goal: Complete the debug panel and wire it into the chat tool system so Chapterhouse can reason about its own internals.*

**Scott's vision**: Lt. Commander Data's positronic brain — heuristic algorithms running in the background, the system aware of its own state, capable of diagnosing and explaining its own problems.

**Current state**: The debug route at `/api/debug/route.ts` checks environment variables and Supabase connection. The debug panel page exists and looks good. Both need to be extended.

### New Structured Debug Log Table:

#### Migration: `20260319_014_create_debug_logs.sql`

```sql
-- Debug log table — structured entries for the self-aware debug loop
-- Phase 7

CREATE TABLE debug_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  -- user_id is nullable — system-level logs don't have a user
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  severity TEXT NOT NULL DEFAULT 'info'
    CHECK (severity IN ('error', 'warn', 'info', 'debug')),
  
  source TEXT NOT NULL,
  -- Which component/route generated this: 'chat', 'intel', 'briefs', 'worker', etc.
  
  message TEXT NOT NULL,
  
  details JSONB,
  -- Structured additional data (error stack, request context, etc.)
  
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  -- Optional link to a background job
  
  resolved BOOLEAN NOT NULL DEFAULT FALSE,
  resolved_at TIMESTAMPTZ
);

CREATE INDEX debug_logs_user_id_idx ON debug_logs(user_id);
CREATE INDEX debug_logs_severity_idx ON debug_logs(severity, created_at DESC);
CREATE INDEX debug_logs_source_idx ON debug_logs(source, created_at DESC);
CREATE INDEX debug_logs_created_at_idx ON debug_logs(created_at DESC);

-- Auto-cleanup logs older than 90 days (prevent unbounded growth)
-- Run this as a weekly cron or pg_cron job:
-- DELETE FROM debug_logs WHERE created_at < NOW() - INTERVAL '90 days';

ALTER TABLE debug_logs ENABLE ROW LEVEL SECURITY;

-- Debug logs: allow servicerole to write (from worker), 
-- allow authenticated users to read their own + system logs
CREATE POLICY "authenticated users can read debug logs" ON debug_logs
  FOR SELECT USING (auth.role() = 'authenticated' AND (user_id IS NULL OR auth.uid() = user_id));

-- Enable Realtime for live debug panel
ALTER PUBLICATION supabase_realtime ADD TABLE debug_logs;
```

### Debug Logging Utility:

Build `src/lib/debug-logger-structured.ts` (extends the existing `debug-logger.ts`):

```typescript
import { getSupabaseServiceRoleClient } from './supabase-server';

type Severity = 'error' | 'warn' | 'info' | 'debug';

export async function logDebug(
  severity: Severity,
  source: string,
  message: string,
  details?: Record<string, unknown>,
  options?: { userId?: string; jobId?: string }
) {
  // Always log to console
  const consoleFn = severity === 'error' ? console.error 
    : severity === 'warn' ? console.warn 
    : console.log;
  consoleFn(`[${source}] ${message}`, details || '');
  
  // Write to DB for structured log access
  try {
    const supabase = getSupabaseServiceRoleClient();
    if (!supabase) return;
    
    await supabase.from('debug_logs').insert({
      severity,
      source,
      message,
      details: details || null,
      user_id: options?.userId || null,
      job_id: options?.jobId || null,
    });
  } catch {
    // Never let debug logging crash the app
  }
}
```

Wire `logDebug` into key error handlers across the codebase:
- `src/app/api/chat/route.ts` catch block: `logDebug('error', 'chat', 'Chat API error', { error })`
- `src/app/api/briefs/generate/route.ts`
- `src/app/api/intel/process/route.ts`
- `worker/src/jobs/router.ts` (via a worker-side version that writes to DB)

### Updated Debug Routes:

#### `src/app/api/debug/route.ts` (extended):
Keep existing environment checks. Add DB connectivity check for new tables. Add summary of recent error counts.

#### `src/app/api/debug/logs/route.ts` (new):
```typescript
// GET /api/debug/logs
// Protected by CRON_SECRET bearer token
// Returns: { logs: DebugLog[], error_count_24h: number, warn_count_24h: number }
// Query params: severity, source, limit (default 100), since (ISO timestamp)
```

This is the endpoint that `read_debug_log` tool calls in Phase 5.

### Debug Panel Page Upgrade:

At `src/app/debug/page.tsx` (create if it doesn't exist, or upgrade existing):

```
[System Health]
  ✅ Anthropic API configured (sk-ant-...)
  ✅ OpenAI API configured
  ✅ Supabase connected (74 briefs, 12 research_items)
  ✅ QStash configured
  ✅ CRON_SECRET set
  ⚠️ N8N: not configured (expected)

[Recent Errors (last 24h)]  3 errors  12 warnings
  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  🔴 2026-03-19 03:21 [intel] URL fetch timeout: https://...
  🟡 2026-03-19 02:15 [chat] buildLiveContext: knowledge_summaries returned empty
  🟡 2026-03-19 01:00 [worker] Brief pre-generation skipped: no RSS feeds active

[Live Log]  [Auto-refresh ▼]
  [source filter] [severity filter]
  [scrolling log entries]
```

Real-time updates via Supabase Realtime on `debug_logs` table.

**Phase 7 success criteria**:
- Ask Chapterhouse "why is the Intel fetch failing?" → reads debug_logs → explains the error → specifies what to fix in VS Code
- Debug panel shows live errors with real timestamps
- All major API routes write structured errors to debug_logs
- No more than 90 days of log history kept (auto-cleanup via cron)

---

## PHASE 8 — Email Integration Validation
🟡 **PARTIALLY COMPLETE** — Full IMAP inbox (`/inbox`), send, reply, compose all built and working. `NCHO_EMAIL_HOST`, `NCHO_EMAIL_USER`, `NCHO_EMAIL_PASSWORD` set in Vercel. TLS + timeout fixes deployed (commit `43b7790`). **Remaining:** wire recent emails into `buildLiveContext()` and trigger seed extraction on incoming email content.

*Goal: Test and validate the existing email integration, then wire it into the brief and seed pipelines.*

**Current state**: `scott@NextChapterHomeschool` is connected. Email routing is wired but untested.

### Validation Steps (not a rebuild — just testing):

1. **Check the email route**: Read `src/app/api/email/route.ts` (or whatever route handles incoming email). Document what it does.

2. **Send a test email**: Send an email to `scott@NextChapterHomeschool` with subject "Test email integration YYYYMMDD". Confirm it appears in the email inbox/logs.

3. **Check for parsing**: Does the route parse subject + body? Does it save to any table? Log to debug?

4. **Wire to daily brief**: If email subjects/bodies are being saved, include them in `buildLiveContext()` as a new context block:
```typescript
// In buildLiveContext():
const { data: recentEmails } = await supabase
  .from('email_messages') // or whatever table exists
  .select('subject, body_preview, from_address, received_at')
  .eq('user_id', userId)
  .order('received_at', { ascending: false })
  .limit(5);

if (recentEmails?.length > 0) {
  blocks.push(`## Live Context: Recent Emails\n\n${...}`);
}
```

5. **Wire to seed extraction**: After processing an email, run the seed extraction prompt on its content. Any actionable ideas → staged as seeds.

6. **Document email table schema**: After reading the actual email route, write the table schema into this spec as an addendum.

**Phase 8 success criteria**:
- Send test email → confirmed received + logged
- Email subjects appear in chat context on next conversation
- Email → seed extraction runs automatically for actionable content
- `support@NextChapterHomeschool` connection documented as "Phase 8b, when ready"

---

## FUTURE PHASES (document but do not build)

These are decisions that belong in the future. Document them here so the code bot doesn't accidentally build them prematurely.

### F1 — Multi-Model Council
Different personas use different models:
- Gandalf (strategist) → `claude-opus-4` (most thoughtful)
- Data → `claude-sonnet-4-6` (fast and precise)
- Silk → `grok-3` [LEGACY — model assignment predates Phase 11 Silk migration]
- Earl → `claude-haiku-3` (fast, just give me the task)

**Trigger**: When Grok API is stable and cost-per-token is competitive. Not now.

### F2 — Local Filesystem Access
Scott says: "I want Chapterhouse to read my VS Code workspace."
Implementation: MCP server or a lightweight VS Code extension that exposes a read-only API.

**Trigger**: When stateless/discovery architecture for MCP matures (see locked decisions). Current MCP is not stable enough to rely on.

### F3 — GitHub Repo Reader
Allow Chapterhouse to read repo contents via GitHub API. Use for: "What's in SomersSchool's current auth flow?" without Scott having to paste code.

**Trigger**: After Phase 5 tool use is stable. Add `read_github_file` to CHAT_TOOLS.

### F4 — Android PWA / Native
Chapterhouse works in any browser. A dedicated Android app adds: home screen widget, push notifications for brief, voice dictation.

**Trigger**: When Chapterhouse is a daily habit, not a tool Scott has to remember to open.

### F5 — NCHO Tools + Chapterhouse Merge
Anna gets her own dedicated instance of Chapterhouse, merged with NCHO Tools.
Her personas: different. Her Intel categories: focused on publishing, Christian curriculum, Shopify. Her context file: Alana Terry brand + NCHO brand.

**Trigger**: When Anna actively needs it. Not when we think she should want it.

### F6 — Commercial Multi-Tenant Launch
The multi-tenant foundation from Phase 0 makes this possible. What happens at launch:
- Remove `ALLOWED_EMAILS` middleware
- Add Stripe Billing integration for subscription gating
- Add onboarding flow (context file setup, persona seeding)
- Add per-user rate limiting on AI calls

**Trigger**: When there are 3+ people outside Scott's circle who want access.

---

## APPENDIX A — Complete File Change Map

This is the complete list of files that need to be created or modified, organized by phase.

### Phase 0 (Multi-Tenant):
- `supabase/migrations/20260319_009_add_user_id_to_all_tables.sql` — **CREATE**
- `src/lib/auth-context.ts` — **CREATE**
- `src/app/api/chat/route.ts` — **MODIFY** (add userId to buildLiveContext calls)
- `src/app/api/briefs/generate/route.ts` — **MODIFY** (add userId filters)
- `src/app/api/extract-learnings/route.ts` — **MODIFY** (add userId filters)
- All other API routes that query Supabase — **MODIFY** (add `.eq('user_id', userId)`)

### Phase 1 (Context Layer):
- `supabase/migrations/20260319_010_create_context_files.sql` — **CREATE**
- `src/app/api/context/route.ts` — **CREATE**
- `src/app/api/context/export/route.ts` — **CREATE**
- `src/app/api/chat/route.ts` — **MODIFY** (dynamic system prompt loading)
- `src/app/settings/context/page.tsx` — **CREATE** (or add tab to existing settings)

### Phase 2 (Dreamer):
- `supabase/migrations/20260319_011_create_dreamer.sql` — **CREATE**
- `src/app/api/dreams/route.ts` — **CREATE**
- `src/app/api/dreams/[id]/route.ts` — **CREATE**
- `src/app/api/dreams/bulk/route.ts` — **CREATE**
- `src/app/api/dreams/reorder/route.ts` — **CREATE**
- `src/app/api/dreams/ai-review/route.ts` — **CREATE**
- `src/app/api/dream-log/route.ts` — **CREATE**
- `src/app/dreamer/page.tsx` — **CREATE**
- `src/app/api/extract-learnings/route.ts` — **MODIFY** (add seed extraction)
- `src/lib/navigation.ts` — **MODIFY** (add Dreamer to nav)

### Phase 3 (Intel):
- `supabase/migrations/20260319_012_create_intel.sql` — **CREATE**
- `src/app/api/intel/route.ts` — **CREATE**
- `src/app/api/intel/[id]/route.ts` — **CREATE**
- `src/app/api/intel/process/route.ts` — **CREATE**
- `src/app/api/intel/publishers-weekly/route.ts` — **CREATE**
- `src/app/api/cron/intel-fetch/route.ts` — **CREATE**
- `src/app/intel/page.tsx` — **CREATE**
- `vercel.json` — **MODIFY** (add intel-fetch cron)
- `src/lib/navigation.ts` — **MODIFY** (add Intel to nav)

### Phase 4 (Council):
- `supabase/migrations/20260319_013_create_personas_and_council.sql` — **CREATE**
- `src/app/api/personas/route.ts` — **CREATE**
- `src/app/api/personas/[id]/route.ts` — **CREATE**
- `src/app/api/council/sessions/route.ts` — **CREATE**
- `src/app/api/council/sessions/[id]/stream/route.ts` — **CREATE**
- `src/app/settings/personas/page.tsx` — **CREATE**
- `src/components/council-toggle.tsx` — **CREATE** (chat toolbar component)
- `src/components/persona-bubble.tsx` — **CREATE** (per-persona message bubble)
- Chat page/component — **MODIFY** (add council toggle, render persona bubbles)
- Database seed script for initial personas — **CREATE**

### Phase 5 (Tool Cards):
- `src/app/api/chat/tools.ts` — **CREATE** (tool definitions)
- `src/app/api/chat/tool-handlers.ts` — **CREATE** (tool executors)
- `src/app/api/chat/route.ts` — **MODIFY** (full tool use loop)
- `src/components/tool-call-card.tsx` — **CREATE**
- Chat frontend component — **MODIFY** (SSE event type parser, render tool cards)

### Phase 6 (Background Jobs):
- `worker/src/jobs/intel-fetch.ts` — **CREATE**
- `worker/src/jobs/brief-pregenerate.ts` — **CREATE**
- `worker/src/jobs/seed-extract.ts` — **CREATE**
- `worker/src/jobs/context-condense.ts` — **CREATE**
- `worker/src/jobs/router.ts` — **MODIFY** (add new cases)
- `src/app/api/cron/brief-pregenerate/route.ts` — **CREATE**
- `vercel.json` — **MODIFY** (add brief-pregenerate cron)
- `src/app/jobs/page.tsx` — **MODIFY** (extend with new job type labels)

### Phase 7 (Debug Loop):
- `supabase/migrations/20260319_014_create_debug_logs.sql` — **CREATE**
- `src/lib/debug-logger-structured.ts` — **CREATE**
- `src/app/api/debug/logs/route.ts` — **CREATE**
- `src/app/api/debug/route.ts` — **MODIFY** (add error summary)
- `src/app/debug/page.tsx` — **CREATE or MODIFY** (full debug panel upgrade)
- Multiple API routes — **MODIFY** (wire `logDebug` into catch blocks)

### Phase 8 (Email):
- Read `src/app/api/email/route.ts` first. Make modifications based on actual state.
- `src/app/api/chat/route.ts` — **MODIFY** (add email context block to buildLiveContext)

---

## APPENDIX B — Environment Variables Reference

All environment variables currently in use (confirm in Supabase/Vercel):

```
# AI Models
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://...supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=eyJ... (or NEXT_PUBLIC_SUPABASE_ANON_KEY)
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# QStash / Worker
QSTASH_URL=https://qstash.upstash.io
QSTASH_TOKEN=...
QSTASH_CURRENT_SIGNING_KEY=sig_...
QSTASH_NEXT_SIGNING_KEY=sig_...
WORKER_URL=https://[railway-app-url]/process-job

# Security
CRON_SECRET=... (shared between Vercel crons and debug access)

# GitHub (for brief generation)
GITHUB_TOKEN=ghp_...

# New (needed for Phase 8 email):
EMAIL_WEBHOOK_SECRET=... (from email provider)
NEXT_PUBLIC_SITE_URL=https://chapterhouse.vercel.app (or custom domain)
```

---

## APPENDIX C — Testing Protocol

For each phase, the code bot should verify these things before considering the phase complete:

### Every phase:
- TypeScript compiles with no errors (`npx tsc --noEmit`)
- No existing tests break (if tests exist)
- The Vercel preview deploy builds successfully

### Phase-specific smoke tests:

**Phase 0**: Log in as Scott. Confirm all existing features (chat, briefs, research) still work. Create a new test user. Confirm they see zero data.

**Phase 1**: Edit context file in settings. Start a chat. Confirm the chat uses the updated context (ask it to repeat something you just put in the context file).

**Phase 2**: Create a seed manually. Edit it. Archive it. Restore it. Delete it. Auto-seed from a chat conversation that contains an idea. Run AI review with 5+ seeds present.

**Phase 3**: Paste 2 real URLs (news articles). Confirm Intel processing runs. Confirm output has color-coded sections. Confirm proposed seeds appear and can be added to Dreamer.

**Phase 4**: Toggle Council in chat. Type a question. Confirm Calvin and Hobbes both respond in labeled bubbles. Add Data to the session. Confirm 3 voices respond. Go to settings, edit a persona prompt, return to chat, confirm the updated voice.

**Phase 5**: Ask a research question. Confirm tool call card appears for `search_research_db`. Ask "add a seed about X". Confirm `add_seed` card appears and seed appears in Dreamer. Ask "what does the debug panel say?". Confirm `read_debug_log` fires.

**Phase 6**: Check `/jobs` page. Trigger a manual Intel session. Confirm a job entry appears. Check at 3AM UTC (or trigger manually) that brief is pre-generated.

**Phase 7**: Deliberately cause an error (call a broken endpoint). Check debug panel. Confirm error appears. Ask Chapterhouse "why is X failing?". Confirm it reads the debug log and explains.

**Phase 8**: Send test email. Confirm it appears in chat context. Confirm content triggers seed extraction if actionable.

---

## APPENDIX D — What NOT To Do

This list exists because the gaps Q&A clarified some obvious traps:

1. **Do not refactor the Curriculum Council**. The `/council` page, `council-prompts.ts`, the worker curriculum pipeline — leave them exactly as they are. The new Council of the Unserious is separate.

2. **Do not try to fix N8N**. It's half-broken and Scott doesn't understand it. Leave the N8N routes as-is. Comment them as "deferred indefinitely" and move on.

3. **Do not add features to the OpenAI path in chat**. Tool use, Council mode, and structured SSE events are Claude-only features. The OpenAI path remains simple: model switch → response. Period.

4. **Do not auto-apply AI review decisions**. When the Dreamer AI review flags seeds, it presents options. Scott approves changes. Nothing auto-archives or auto-deletes.

5. **Do not auto-add seeds to 'active' status**. All auto-extracted seeds start as `status: 'seed'`. Only Scott promotes them.

6. **Do not strip the verbosity guardrail**. The response length constraint added to the system prompt (Phase 1) is not negotiable. Do not remove it "to give more complete answers."

7. **Do not build a custom MCP server** for any of this. The patterns above (REST APIs, QStash, Supabase Realtime) are the architecture. MCP is deferred per locked decision.

8. **Do not separate DB per user** for multi-tenancy. Single Supabase DB, RLS per user_id. See Architecture Decisions.

9. **Do not remove the ALLOWED_EMAILS middleware**. Scott is months away from commercial. Leave it.

10. **Do not build for Anna** without Scott explicitly asking. This instance is Scott's. Anna's future instance is a future phase.

---

*End of spec. Start at Phase 0. Read everything in PRE-FLIGHT first. Ask no permission — just build.*

*Scott's voice on what this project is: "I want Chapterhouse to help me dream." That's the mission. Every decision in this spec points at that.*
