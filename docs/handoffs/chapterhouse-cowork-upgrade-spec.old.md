# Chapterhouse Cowork Upgrade — Build Bible
> **Phase numbering:** Continues from Chapterhouse Phase 14. This spec begins at **Phase 20** (gap intentional — Phases 15-19 reserved for in-flight work).
> **Generated:** April 12, 2026
> **Source research:** 8 waves of competitive intelligence (`intel/ai-tools-to-match/01-08`), Claude Cowork Agent Bible (`Brain/claude-cowork-agent-bible.md`), Chapterhouse CLAUDE.md (migration 032 current)
> **Decisions locked:** Monica gaps = YES include. Phase numbering = start at 20. Migration precision = full SQL. ElevenLabs = Creator plan, evolving voices. Descript = do not own. Brand voice expansion = YES for Doc Studio.

---

## What This Document Is

This is the build bible for upgrading Chapterhouse from its current 14-phase state into a tool that matches or exceeds every competitive capability identified across 35 AI tools and leverages the 16 Cowork-class features Claude already exposes. Every phase has:
- What gets built
- Full SQL migrations
- API routes with behavior spec
- UI components
- Verification steps (how you know it's done)
- What existing code is preserved vs. replaced

**A code bot can open this spec and execute Phase 20 without asking a single clarifying question.**

---

## Locked Decisions — All Resolved

### ✅ DECISION LOCKED: Tool Ownership

| Tool | Status | Impact |
|---|---|---|
| **Descript** | ❌ Do not own | Agentic editing (Phase 21B) is Chapterhouse-native — no Underlord, no external dependency. |
| **Minvo Pro** | Unconfirmed | Blocks nothing — only relevant if video clipping is added later. |
| **Flixier Pro** | Unconfirmed | Same — no phase depends on it. |
| **Repurpose.io** | Unconfirmed | Same. |

### ✅ DECISION LOCKED: ElevenLabs Scope

- **Plan:** Creator ($219.96/yr, 100K credits/cycle, usage-based billing ON, 250K max credit threshold)
- **Voices:** Will evolve over time — architecture MUST support easy voice swapping. Store `voice_id` in a config table or env var, never hardcoded. Default voice configurable via `ELEVENLABS_DEFAULT_VOICE_ID` env var. Additional voices addable without code changes.
- **Content types:** All Doc Studio documents, Folio entries, Intel reports. Start broad — restrict later if credits run low.
- **API tier:** Creator plan API access (100K credits/cycle base + usage overflow). No separate API subscription needed.

### ✅ DECISION LOCKED: Brand Voice Expansion

Current voices in `brand_voices` table: NCHO, SomersSchool, Alana Terry.
- **YES — add Doc Studio voices.** Seed additional brand voices: Chapterhouse Internal (operational/terse), Formal/Academic, Casual/Scott. These are insertable via existing BrandVoicesPanel — no migration needed, just seed data.

---

## Phase Overview

| Phase | Name | Dependencies |
|---|---|---|
| **20** | Wire What's Installed | None |
| **21** | Doc Studio Power-Up | Phase 20 (export) |
| **22** | Council Everywhere + Search | None (parallel w/ 21) |
| **23** | Intelligence Upgrades | Phase 20 (Langfuse) |
| **24** | Audio & Voice Layer | Phase 20 (Langfuse) |
| **25** | Social & Content Production | Phase 20 (brand voice, Langfuse) |
| **26** | Cowork Feature Bridge | Phase 21 (Doc Studio) |
| **27** | Advanced / Post-Launch | Phases 20-26 |

---

## Phase 20 — Wire What's Installed
*Dependencies: None | Unblocks: Phases 21, 23, 25*

These are installed dependencies sitting unwired. Highest ROI work in the entire spec.

### 20A. Document Export Pipeline (S2 — Steal-Sheet Priority #1)

**What:** Every Doc Studio document downloadable as DOCX, PDF, and Markdown. Also: Chat-Initiated Document Export (the PINNED item from copilot-instructions.md).

**Why first:** Tome died from no export. `html-to-docx` is already in `package.json`. Every surviving competitor in the content creation space has multi-format export. Documents without export have zero value outside Chapterhouse. This is the PINNED item.

**Migration 033:**
```sql
-- 20250412_033_document_export_metadata.sql
-- Phase 20A: Add export tracking to documents table

-- Track which formats have been exported and when
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS export_history JSONB DEFAULT '[]'::jsonb;

-- Add a content_html column for rendered HTML (source for DOCX/PDF conversion)
-- Documents currently store plain text content. Export needs HTML.
ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS content_html TEXT;

COMMENT ON COLUMN documents.export_history IS 'Array of {format, exported_at, file_url} objects tracking export history';
COMMENT ON COLUMN documents.content_html IS 'HTML-rendered version of document content, used as source for DOCX/PDF export';
```

**API Routes:**

| Route | Method | Behavior |
|---|---|---|
| `/api/documents/export/route.ts` | POST | **CREATE.** Accept `{document_id: string, format: 'docx' \| 'md' \| 'pdf'}`. Fetch document from `documents` table. For DOCX: convert `content_html` (or `content` rendered as HTML) via `html-to-docx` → return buffer with `Content-Disposition: attachment; filename="[title].[ext]"`. For MD: return `content` field directly as `text/markdown`. For PDF: use client-side `window.print()` with print stylesheet (avoid Puppeteer dep). Append to `export_history` JSONB. Requires `auth.uid() = user_id` check. |
| `/api/documents/[id]/route.ts` | GET | **MODIFY.** Add `export_url` field to response: `"/api/documents/export"`. |

**UI Changes:**
- Doc Studio document view: Add dropdown button "⬇ Export" → DOCX / Markdown / PDF options
- Each option calls `/api/documents/export` with the format, browser downloads the file

**Chat-Initiated Export (PINNED item):**
- In `src/app/api/chat/route.ts` and `src/app/api/council/route.ts`: detect when a document has been generated in the session. Return `{doc_id, download_url}` in the response so chat can render a "📥 Download" link inline.

**Verification:**
- [ ] Generate a document in Doc Studio → click Export DOCX → file downloads and opens in Word
- [ ] Export same document as Markdown → valid .md file
- [ ] In Council chat, generate a document → download link appears in chat response
- [ ] `export_history` JSONB updated on the documents row after each export

---

### 20B. Langfuse Cost Visibility (A8)

**What:** Wire Langfuse into every AI-calling route. Surface cost per operation on a dashboard.

**Why:** Scott has never seen what Chapterhouse costs per day. Keys are in hand (Pending Action #13). Every competitor with credits or tokens shows usage.

**No migration required.** Langfuse is an external service — no Supabase schema changes.

**New Environment Variables:**
```
LANGFUSE_PUBLIC_KEY=<from api-guide-master.md>
LANGFUSE_SECRET_KEY=<from api-guide-master.md>
LANGFUSE_HOST=https://cloud.langfuse.com
```

**API Routes:**

| Route | Method | Behavior |
|---|---|---|
| `/api/costs/route.ts` | GET | **CREATE.** Query Langfuse API for usage data. Accept `?period=today\|week\|month`. Return `{total_cost, total_tokens, by_feature: [{feature, cost, tokens, calls}], by_model: [{model, cost, tokens}]}`. Auth required. |

**Files to modify:**

| File | Change |
|---|---|
| `src/lib/langfuse.ts` | **CREATE.** Langfuse client singleton. `import Langfuse from 'langfuse'`. Init with env vars. Export `langfuse` instance and helper `traceAI(name, fn)` wrapper. |
| `src/app/api/council/route.ts` | **MODIFY.** Wrap each Council pass (Gandalf, Data, Polgara, Earl, Silk) in a Langfuse trace with `generation` observation. Pass model name, input tokens, output tokens. Tag with `feature: 'council'`. |
| `src/app/api/chat/route.ts` | **MODIFY.** Same pattern. Tag with `feature: 'chat'`. |
| `src/app/api/social/generate/route.ts` | **MODIFY.** Same. Tag `feature: 'social'`. |
| `src/app/api/documents/generate/route.ts` | **MODIFY.** Same. Tag `feature: 'doc-studio'`. |
| `src/app/api/intel/route.ts` | **MODIFY.** Same. Tag `feature: 'intel'`. |
| `src/app/api/folio/trigger/route.ts` | **MODIFY.** Same. Tag `feature: 'folio'`. |

**UI Changes:**
- New tab in Debug Panel (or standalone `/costs` page): "💰 Costs"
- Shows: today's total, this week, this month
- Breakdown by feature (Council, Chat, Social, Doc Studio, Intel, Folio)
- Breakdown by model (Sonnet, Opus, Haiku, GPT-5.4, gpt-5-mini)

**Verification:**
- [ ] Run a Council session → check Langfuse dashboard → trace appears with 5 generations (one per Council member)
- [ ] Open `/costs` → data renders with correct totals
- [ ] Cost data matches Anthropic/OpenAI billing (within 10%)

---

### 20C. Brand Voice in Doc Studio (A13)

**What:** Brand voice selector dropdown on Doc Studio generate form. `getBrandVoiceSystem()` already exists in the codebase — it's just not wired into document generation.

**No migration required.** `brand_voices` table exists (migration 023).

**Files to modify:**

| File | Change |
|---|---|
| `src/app/api/documents/generate/route.ts` | **MODIFY.** Accept optional `brand_voice_id: string` in request body. If present, call `getBrandVoiceSystem(brand_voice_id)` → inject returned system prompt block into the document generation system prompt before the document type instructions. |
| Doc Studio generate form component | **MODIFY.** Add `<select>` dropdown labeled "Brand Voice (optional)" above the prompt textarea. Fetch options from `/api/brand-voices/` on mount. Default: "None" (no brand voice injection). Options: NCHO, SomersSchool, Alana Terry, plus any Scott adds via ⚠️ SCOTT DECIDES above. |

**Verification:**
- [ ] Open Doc Studio → select "NCHO" brand voice → generate a blog post → output uses NCHO tone
- [ ] Generate same prompt with "SomersSchool" → noticeably different tone
- [ ] Generate with "None" selected → no brand voice influence (current behavior)

---

## Phase 21 — Doc Studio Power-Up
*Dependencies: Phase 20A (export must work first) | Unblocks: Phase 26*

### 21A. Outline-First Generation (S4)

**What:** Two-step Doc Studio flow: prompt → structural outline → Scott reviews/edits outline → full document generated from approved outline.

**Migration 034:**
```sql
-- 20250412_034_document_outline_and_versioning.sql
-- Phase 21: Add outline support and edit versioning to documents

ALTER TABLE documents
  ADD COLUMN IF NOT EXISTS outline JSONB,
  ADD COLUMN IF NOT EXISTS version INT NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS edit_history JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN documents.outline IS 'Structural outline approved before full generation. Array of {section, key_points, data_to_include} objects.';
COMMENT ON COLUMN documents.version IS 'Incremented on each agentic edit. Version 1 = original generation.';
COMMENT ON COLUMN documents.edit_history IS 'Array of {instruction, timestamp, version_before, version_after} tracking all NL edits.';
```

**API Routes:**

| Route | Method | Behavior |
|---|---|---|
| `/api/documents/outline/route.ts` | POST | **CREATE.** Accept `{prompt: string, doc_type: string, brand_voice_id?: string}`. Call Claude Haiku with: "Generate a structural outline for a [doc_type] document about: [prompt]. Return JSON: `{sections: [{title, key_points: string[], data_to_include: string[]}]}`. Do not write prose — only structure." Return the outline JSON. |
| `/api/documents/generate/route.ts` | POST | **MODIFY.** Accept optional `outline: object` param. If present, include it in the system prompt: "Generate this document following this exact structural outline. Each section must cover the key points listed. Do not add or remove sections." Store the outline on the resulting document record. |

**UI Changes:**
- Doc Studio generate form: new checkbox "📋 Generate outline first" (default: checked for doc types > 500 words)
- When checked: submit → outline appears as editable card list (each section = a card with title + bullet points)
- Cards are drag-to-reorder (use existing `dnd-kit` dependency)
- Each card has edit (pencil icon) and delete (X) buttons
- "Generate Full Document" button below the outline → calls generate with the approved outline
- When unchecked: current behavior (straight to full generation)

**Verification:**
- [ ] Enter prompt with outline mode → outline appears with 4-8 sections
- [ ] Drag section 3 above section 1 → order persists
- [ ] Delete a section → removed from outline
- [ ] Click "Generate Full Document" → output follows the reordered/edited outline exactly
- [ ] `outline` column populated on the `documents` row

---

### 21B. Agentic Document Editing (S1 — Highest Single Steal)

**What:** Natural language refinement of existing documents. "Make the Earl section shorter." "Add Silk's take on the revenue model." "Rewrite the opening paragraph for Anna."

**Migration:** Uses the `version` and `edit_history` columns from Migration 034 above.

**API Routes:**

| Route | Method | Behavior |
|---|---|---|
| `/api/documents/edit/route.ts` | POST | **CREATE.** Accept `{document_id: string, instruction: string}`. Fetch current document content. System prompt: "You are editing an existing document. The user's instruction is: [instruction]. Apply ONLY the requested change. Preserve everything else EXACTLY as written. Return the COMPLETE updated document with the edit applied." Stream the response. On completion: increment `version`, append `{instruction, timestamp, version_before, version_after}` to `edit_history`. Update `content` (and `content_html` if applicable). |

**UI Changes:**
- Below each rendered document in Doc Studio: "✏️ Edit" input bar (chat-style)
- Type instruction → press Enter → document content streams the updated version
- "↩ Revert" button appears after each edit → restores previous version from edit_history
- Version indicator: "v3 · 2 edits" shown in document header
- Click version indicator → show edit history sidebar (list of instructions with timestamps)

**Verification:**
- [ ] Generate a 5-section document → type "Remove section 3 entirely" → section 3 gone, rest preserved
- [ ] Type "Make the opening paragraph more aggressive" → opening changes, rest preserved
- [ ] Click Revert → previous version restored
- [ ] `edit_history` JSONB shows all edits with timestamps
- [ ] Version number increments correctly

---

### 21C. Voice Sample Analysis for Brand Voice (A12)

**What:** "Analyze Voice" button on BrandVoicesPanel → paste sample text → Claude extracts tone, vocabulary, patterns → auto-fills brand voice record.

**No migration required.** Uses existing `brand_voices` table.

**API Routes:**

| Route | Method | Behavior |
|---|---|---|
| `/api/brand-voices/analyze/route.ts` | POST | **CREATE.** Accept `{samples: string[]}` (array of example text blocks — social posts, paragraphs, emails). Call Claude Haiku: "Analyze these writing samples. Extract: overall tone (3-5 adjectives), vocabulary level (grade level), average sentence length, recurring patterns/phrases, forbidden words/phrases (things the writer avoids), signature phrases, punctuation habits. Return as structured JSON." Return the analysis. |

**UI Changes:**
- BrandVoicesPanel (Settings page): new "🔍 Analyze Voice" button next to "Add Brand Voice"
- Opens modal: large textarea labeled "Paste 5-10 sample posts, emails, or paragraphs (one per line or separated by ---)"
- "Analyze" button → calls route → results display as structured preview
- "Apply to New Brand Voice" button → creates a new `brand_voices` record pre-filled with the extracted profile text

**Verification:**
- [ ] Paste 10 NCHO Instagram posts → analysis returns: warm, faith-adjacent, second-person, maternal, avg 12-word sentences
- [ ] Click "Apply to New Brand Voice" → new record created with extracted profile
- [ ] Generate a document using this new brand voice → output matches the analyzed tone

---

## Phase 22 — Council Everywhere + Search
*Dependencies: None (parallel with Phase 21) | Unblocks: Phase 25*

### 22A. @Council Floating Button (S3)

**What:** Floating action button accessible from every Chapterhouse page. Click → popover with Council member selector + text input. Sends current page context + question to a lightweight Council endpoint.

**No migration required.** Uses existing Council infrastructure.

**API Routes:**

| Route | Method | Behavior |
|---|---|---|
| `/api/council/quick/route.ts` | POST | **CREATE.** Accept `{member: 'gandalf'\|'data'\|'polgara'\|'earl'\|'silk'\|'any', question: string, pageContext: string}`. If member = 'any', select based on question content (architecture → Gandalf, analysis → Data, content → Polgara, execution → Earl, subtext → Silk). Build a lightweight system prompt: Council member identity + pageContext + live context (abbreviated — skip Folio/Intel for speed). Stream single-member response. Tag with Langfuse `feature: 'council-quick'`. |

**UI Components:**

| Component | Behavior |
|---|---|
| `src/components/CouncilPopover.tsx` | **CREATE.** Fixed-position floating button (bottom-right, z-50). Click → popover: (1) Member selector — 6 radio buttons with icons: 🧙 Gandalf, 🤖 Data, 🦉 Polgara, 🐺 Earl, 🐀 Silk, ✨ Any. (2) Textarea for question. (3) Response area (streaming). (4) "Open Full Council" link → navigates to /council. Component accepts no props — assembles `pageContext` from `window.location.pathname` + visible page title + any data attributes on the current page container. |

**Files to modify:**

| File | Change |
|---|---|
| `src/app/layout.tsx` (or root layout) | **MODIFY.** Add `<CouncilPopover />` as last child before closing `</body>`. Only render when user is authenticated. |

**Keyboard shortcut:** `Ctrl+Shift+C` toggles the popover.

**Verification:**
- [ ] Navigate to /dreamer → press Ctrl+Shift+C → popover appears
- [ ] Select "Earl" → type "What should I ship first?" → Earl responds in character with operational priority
- [ ] Navigate to /doc-studio → ask Gandalf a question → pageContext includes "doc-studio"
- [ ] Click "Open Full Council" → navigates to /council page
- [ ] Popover does NOT appear on login page (unauthenticated)

---

### 22B. Unified Cross-Source Search (A2)

**What:** One search bar in the header → searches emails, intel, dreams, documents, folio, context_files simultaneously.

**No migration required.** All tables already exist with searchable text columns.

**API Routes:**

| Route | Method | Behavior |
|---|---|---|
| `/api/search/route.ts` | GET | **CREATE.** Accept `?q=<query>&sources=emails,intel,dreams,docs,folio,context` (sources optional, default all). For each enabled source, run a parallel Supabase query: `emails` → `ILIKE` on `subject`, `ai_summary`; `intel_sessions` → `ILIKE` on `title`, `summary`; `dreams` → `ILIKE` on `title`, `description`; `documents` → `ILIKE` on `title`, `content`; `folio_entries` → `ILIKE` on `narrative`, `top_action`; `context_files` → `ILIKE` on `title`, `content`. Each source returns max 5 results. Merge all results into `{source, id, title, snippet, updated_at}[]` sorted by `updated_at` DESC. Total cap: 30 results. All queries filtered by `auth.uid() = user_id`. |

**UI Components:**

| Component | Behavior |
|---|---|
| `src/components/UnifiedSearch.tsx` | **CREATE.** Search icon in header bar. Click → expands into full-width search input with results dropdown. Results grouped by source with icons: 📧 emails, 🔍 intel, 💭 dreams, 📄 docs, 📰 folio, 🧠 context. Each result: title + snippet + timestamp. Click → navigate to source page. Escape or click-away closes. Debounce: 300ms. Min query length: 3 chars. |

**Files to modify:**

| File | Change |
|---|---|
| Header component (wherever the main nav/header renders) | **MODIFY.** Add search icon (🔍) that renders `<UnifiedSearch />`. |

**Verification:**
- [ ] Type "SomersSchool" → results appear from intel, dreams, context_files, documents
- [ ] Click an intel result → navigates to /intel with that session selected
- [ ] Search with no matches → "No results found" message
- [ ] Results from all 6 sources appear when query matches content in each

---

## Phase 23 — Intelligence Upgrades
*Dependencies: Phase 20B (Langfuse for cost tracking in new routes)*

### 23A. Knowledge Base UI (A1)

**What:** `/knowledge` page showing all `context_files` records. CRUD. Preview of the assembled system prompt per context type. Scott sees everything the Council knows.

**No migration required.** `context_files` table exists with RLS.

**API Routes:**

| Route | Method | Behavior |
|---|---|---|
| `/api/knowledge/route.ts` | GET | **CREATE.** Return all `context_files` for `auth.uid()`, grouped by `context_type`, ordered by `inject_order`. |
| `/api/knowledge/route.ts` | POST | **CREATE.** Accept `{title, content, context_type, inject_order}`. Insert into `context_files`. |
| `/api/knowledge/[id]/route.ts` | PUT | **CREATE.** Update a single `context_files` record. |
| `/api/knowledge/[id]/route.ts` | DELETE | **CREATE.** Delete a single `context_files` record. |
| `/api/knowledge/preview/route.ts` | GET | **CREATE.** Accept `?type=chat\|council\|social\|doc-studio`. Call the same `buildLiveContext()` (or equivalent) that the actual AI route uses for that type. Return the full assembled system prompt as plain text. This is the killer feature — Scott sees EXACTLY what the AI sees. |

**UI: `/knowledge` page:**
- Left sidebar: grouped by `context_type` (Chat, Council, Social, Doc Studio, Other)
- Main area: list of context files for selected type, ordered by `inject_order`
- Each card: title, content preview (first 200 chars), inject_order number, last updated
- Edit button → inline edit (title + content textarea + inject_order number)
- Delete button → confirm dialog
- "Add Context File" button → form (title, content, context_type dropdown, inject_order)
- "👁 Preview System Prompt" button per context type → modal showing the full assembled prompt (read-only, monospace, scrollable)

**Verification:**
- [ ] Navigate to /knowledge → all context_files records visible, grouped correctly
- [ ] Add a new context file → appears in list → Council chat references its content
- [ ] Edit an existing file → save → run Council → updated content reflected in output
- [ ] Click "Preview System Prompt" for Council → see the full assembled prompt including all context blocks
- [ ] Delete a context file → confirm → removed → no longer injected into AI calls

---

### 23B. Watch URLs for Intel (A10)

**What:** Persistent "watch URLs" — monitored web pages that auto-fetch on Intel cron, flagging content changes.

**Migration 035:**
```sql
-- 20250412_035_watch_urls.sql
-- Phase 23B: Persistent URL monitoring for Intel system

CREATE TABLE IF NOT EXISTS watch_urls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  url TEXT NOT NULL,
  label TEXT NOT NULL,
  check_interval TEXT NOT NULL DEFAULT 'daily' CHECK (check_interval IN ('daily', 'weekly')),
  last_fetched TIMESTAMPTZ,
  last_content_hash TEXT,
  last_change_detected TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE watch_urls ENABLE ROW LEVEL SECURITY;

CREATE POLICY watch_urls_user_policy ON watch_urls
  FOR ALL USING (auth.uid() = user_id);

-- Index for cron queries
CREATE INDEX idx_watch_urls_active ON watch_urls (is_active, check_interval) WHERE is_active = true;

COMMENT ON TABLE watch_urls IS 'Persistent URL monitoring — auto-fetched by Intel cron, changes flagged in reports.';
```

**API Routes:**

| Route | Method | Behavior |
|---|---|---|
| `/api/watch-urls/route.ts` | GET | **CREATE.** Return all `watch_urls` for `auth.uid()`, ordered by `last_change_detected DESC NULLS LAST`. |
| `/api/watch-urls/route.ts` | POST | **CREATE.** Accept `{url, label, check_interval}`. Insert. |
| `/api/watch-urls/[id]/route.ts` | PUT | **CREATE.** Update label, check_interval, is_active. |
| `/api/watch-urls/[id]/route.ts` | DELETE | **CREATE.** Delete a watch URL. |

**Files to modify:**

| File | Change |
|---|---|
| Intel cron (wherever `processIntelUrls()` runs on schedule) | **MODIFY.** Before processing user-submitted URLs: query `watch_urls WHERE is_active = true AND (check_interval = 'daily' OR (check_interval = 'weekly' AND EXTRACT(DOW FROM now()) = 1))`. For each: fetch URL content, compute MD5 hash, compare to `last_content_hash`. If changed: include in Intel report with `🔄 CHANGED` flag, update `last_content_hash` and `last_change_detected`. If unchanged: update `last_fetched` only. |
| `/intel` page | **MODIFY.** Add "📡 Watch URLs" section: list of monitored URLs with status (🟢 no change / 🔴 changed / ⚪ never checked). "Add Watch URL" button → simple form (URL + label + interval). |

**Verification:**
- [ ] Add a watch URL → appears in list with ⚪ status
- [ ] Trigger Intel cron → URL fetched → status changes to 🟢 (no previous hash to compare)
- [ ] Wait for content to change (or manually test with a URL you control) → status shows 🔴
- [ ] Intel report includes the changed URL with context about what changed

---

### 23C. Intel → Task Bridge (B6)

**What:** One-click "Create Task" button on Intel findings → pre-populated task.

**No migration required.** Uses existing `tasks` table.

**Files to modify:**

| File | Change |
|---|---|
| Intel report viewer component (wherever findings/recommendations render) | **MODIFY.** Add "→ Task" button next to each finding. On click: POST to `/api/tasks` (or whatever the existing task creation endpoint is) with `{title: finding.title, description: finding.summary + '\n\nSource: Intel Session ' + session.id, metadata: {source: 'intel', intel_session_id: session.id}}`. Show success toast with link to the created task. |

**Verification:**
- [ ] View an Intel report → click "→ Task" on a finding → task created with Intel context
- [ ] Navigate to tasks → find the created task → description references the Intel session

---

## Phase 24 — Audio & Voice Layer
*Dependencies: Phase 20 (Langfuse) | All decisions LOCKED*

**ElevenLabs Creator plan confirmed.** $219.96/yr, 100K credits/cycle, usage-based overflow ON (250K max threshold). Voices will evolve — architecture supports swapping via env var + config, never hardcoded voice IDs.

### 24A. ElevenLabs Wiring (S6)

**What:** Wire the installed-but-unwired ElevenLabs dependency. Create a shared TTS utility. Make any text content optionally listenable.

**New Environment Variable:**
```
ELEVENLABS_API_KEY=<from api-guide-master.md / ElevenLabs dashboard>
```

**API Routes:**

| Route | Method | Behavior |
|---|---|---|
| `/api/audio/generate/route.ts` | POST | **CREATE.** Accept `{text: string, source_type: string, source_id: string, voice_id?: string}`. Call ElevenLabs TTS API via `src/lib/tts.ts`. Upload resulting audio buffer to Cloudinary (`/audio/chapterhouse/[source_type]/[source_id]`). Return `{audio_url: string, duration_seconds: number}`. Store audio_url on the source record if applicable. |

**Files to create:**

| File | Purpose |
|---|---|
| `src/lib/tts.ts` | ElevenLabs client singleton. `textToSpeech(text: string, voiceId?: string): Promise<Buffer>`. Uses `ELEVENLABS_API_KEY`. Default voice configurable via env var `ELEVENLABS_DEFAULT_VOICE_ID`. Error handling for rate limits and quota. |
| `src/components/ListenButton.tsx` | Reusable component. Props: `{sourceType: string, sourceId: string, text: string}`. On click: check `audio_url` on the source record (if cached) → play it. If not cached → POST to `/api/audio/generate` → show "Generating audio..." spinner (10-30 sec) → play when ready. Standard audio player controls (play/pause/seek). |

### 24B. Audio on Key Content Types

**What:** Add `<ListenButton>` to Folio entries, Intel reports, daily briefs, and Doc Studio documents.

**Files to modify:**

| File | Change |
|---|---|
| Folio page component | **MODIFY.** Add `<ListenButton sourceType="folio" sourceId={entry.id} text={entry.narrative} />` on each folio entry. |
| Intel report viewer component | **MODIFY.** Add `<ListenButton sourceType="intel" sourceId={session.id} text={session.summary} />` on each report. |
| Doc Studio document view component | **MODIFY.** Add `<ListenButton sourceType="document" sourceId={doc.id} text={doc.content} />` on each document. |

**Verification:**
- [ ] Open a Folio entry → click 🔊 Listen → audio generates → plays Scott's Folio briefing aloud
- [ ] Open same Folio entry again → audio plays immediately (cached)
- [ ] Open an Intel report → click Listen → report summary plays
- [ ] Open a Doc Studio document → click Listen → full document reads aloud

---

## Phase 25 — Social & Content Production
*Dependencies: Phase 20B (Langfuse), Phase 20C (brand voice)*

### 25A. Performance Prediction Scoring (S5)

**What:** Score generated social posts before publishing. Display predicted engagement in Review Queue.

**Migration 036:**
```sql
-- 20250412_036_social_engagement_data.sql
-- Phase 25A: Add engagement tracking and prediction to social_posts

ALTER TABLE social_posts
  ADD COLUMN IF NOT EXISTS engagement_data JSONB,
  ADD COLUMN IF NOT EXISTS predicted_score FLOAT;

COMMENT ON COLUMN social_posts.engagement_data IS 'Backfilled from Buffer analytics: {likes, shares, comments, impressions, clicks}';
COMMENT ON COLUMN social_posts.predicted_score IS 'AI-predicted engagement score 0-100, generated before publishing';
```

**API Routes:**

| Route | Method | Behavior |
|---|---|---|
| `/api/social/predict/route.ts` | POST | **CREATE.** Accept `{content: string, brand: string, platform: string}`. Call Claude Haiku: "Score this social media post for predicted engagement on [platform] for brand [brand]. Consider: hook strength (does it grab attention in first line?), CTA presence, hashtag count, post length, emotional valence, question usage. Return JSON: `{score: 0-100, reasoning: string, suggestions: string[]}`. Score 70+ = strong, 40-70 = average, <40 = weak." Return the prediction. |
| `/api/social/analytics/route.ts` | POST | **CREATE.** Cron-compatible endpoint (protect with `CRON_SECRET`). Query Buffer GraphQL API for published post engagement data. Match by `buffer_post_id` on `social_posts`. Update `engagement_data` JSONB. Schedule: daily at 06:00 UTC (midnight Alaska). |

**Files to modify:**

| File | Change |
|---|---|
| `src/app/api/social/generate/route.ts` | **MODIFY.** After generating a social post, auto-call the predict route internally. Include `predicted_score` in the generation response. |
| Review Queue UI component | **MODIFY.** Add predicted score badge on each pending post card: 🟢 green circle (>70), 🟡 yellow (40-70), 🔴 red (<40). Tooltip shows reasoning. |

**Verification:**
- [ ] Generate a social post → predicted score appears (e.g., "Score: 78 🟢")
- [ ] Review Queue shows score badges on all pending posts
- [ ] After a post is published and engagement data is available → analytics cron backfills `engagement_data`
- [ ] Over time, prediction accuracy improves as real data accumulates

---

### 25B. "Boost This Post" Button (B8)

**What:** One-click rewrite of a pending social post based on top-performer patterns.

**Dependencies:** Phase 25A analytics backfill should have some data. If no engagement data exists yet, boost uses general best practices.

**API Routes:**

| Route | Method | Behavior |
|---|---|---|
| `/api/social/boost/route.ts` | POST | **CREATE.** Accept `{post_id: string}`. Fetch the post content + brand + platform. Query `social_posts` for top 10 posts by engagement (sorted by `engagement_data->'impressions'` DESC, or `predicted_score` DESC if no engagement data yet). Call Claude Sonnet: "Rewrite this post to maximize engagement on [platform]. Use these top-performing posts as examples of what works for this brand: [top 10]. Preserve the core message but optimize the hook, CTA, length, and structure." Return `{boosted_content: string, changes_made: string[]}`. |

**UI Changes:**
- Review Queue: add "⚡ Boost" button on each pending post card
- Click → boosted version replaces draft content
- "↩ Undo" button to restore original
- Changes list shown below boosted content (e.g., "Added question hook", "Shortened to 140 chars", "Added CTA")

**Verification:**
- [ ] Click ⚡ Boost on a pending post → content changes → changes list visible
- [ ] Click Undo → original content restored
- [ ] Boosted post has higher predicted score than original (in most cases)

---

### 25C. Grounded Mode Toggle (B4)

**What:** Chat toggle that restricts the model to answering ONLY from injected context — zero hallucination from general training knowledge.

**No migration required.**

**Files to modify:**

| File | Change |
|---|---|
| `src/app/api/chat/route.ts` | **MODIFY.** Accept `grounded: boolean` in request body. If true, prepend to system prompt: "IMPORTANT: You must answer ONLY from the context provided below. If the answer is not contained in the provided context, respond with: 'I don't have that information in my current business context. This would require general knowledge, which is disabled in Grounded Mode.' Do not use your general training knowledge under any circumstances." |
| Chat UI component | **MODIFY.** Add toggle switch in chat header area: "🔒 Grounded Mode" (off by default). Tooltip: "When on, responses use only your business context — no general AI knowledge." Toggle state sent with each message. |

**Verification:**
- [ ] Grounded mode OFF → ask "What is the capital of France?" → "Paris"
- [ ] Grounded mode ON → ask "What is the capital of France?" → "I don't have that information in my current business context..."
- [ ] Grounded mode ON → ask "What is SomersSchool?" → answers from context_files
- [ ] Toggle persists during the session but resets to OFF on page reload

---

## Phase 26 — Cowork Feature Bridge
*Dependencies: Phase 21 (Doc Studio enhanced)*

This phase bridges the gap between Chapterhouse and the 16 Cowork Bible features that Claude Cowork exposes natively. The goal is NOT to replicate Cowork — it's to build Chapterhouse-native versions of the features that matter most for Scott's workflow, leveraging the Council and live context that Cowork doesn't have.

### 26A. Campaign Plan Generator (Cowork: `marketing:campaign-plan`)

**What:** Doc Studio document type that generates a full campaign plan with Council-enriched output. Currently Doc Studio has 15 doc types — this adds `campaign_plan` as the 16th.

**Files to modify:**

| File | Change |
|---|---|
| Doc Studio `DOC_TYPES` definition | **MODIFY.** Add `campaign_plan` type: `{name: 'Campaign Plan', category: 'marketing', description: 'Full campaign brief with objectives, audience, channel strategy, content calendar, and success metrics', fields: [{name: 'product_or_launch', type: 'text', required: true}, {name: 'target_audience', type: 'text', required: true}, {name: 'budget', type: 'text'}, {name: 'timeline', type: 'text', required: true}]}` |
| `documents` table CHECK constraint | **MODIFY.** Add `'campaign_plan'` to the `doc_type` CHECK constraint. |

**Why this beats Cowork's version:** Cowork's `marketing:campaign-plan` generates a generic campaign plan. Chapterhouse's version injects `buildLiveContext()` — the AI knows Scott's actual brands, products, pricing, audience, and platform accounts. It generates a campaign for NCHO or SomersSchool specifically, not abstractly.

### 26B. Email Sequence Generator (Cowork: `marketing:email-sequence`)

**What:** Doc Studio type generating multi-email drip sequences with full copy, timing, and branching logic.

**Files to modify:**

| File | Change |
|---|---|
| Doc Studio `DOC_TYPES` definition | **MODIFY.** Add `email_sequence` type: `{name: 'Email Sequence', category: 'marketing', description: 'Multi-email drip sequence with full copy, timing, branching logic, and A/B suggestions', fields: [{name: 'sequence_type', type: 'select', options: ['welcome', 'nurture', 'launch', 're-engagement', 'custom'], required: true}, {name: 'product_or_brand', type: 'text', required: true}, {name: 'num_emails', type: 'number', default: 5}, {name: 'goal', type: 'text', required: true}]}` |
| `documents` table CHECK constraint | **MODIFY.** Add `'email_sequence'` to the `doc_type` CHECK. |

### 26C. SEO Audit Generator (Cowork: `marketing:seo-audit`)

**What:** Doc Studio type that generates an SEO audit with keyword research, competitor comparison, and prioritized action plan.

**Files to modify:**

| File | Change |
|---|---|
| Doc Studio `DOC_TYPES` definition | **MODIFY.** Add `seo_audit` type: `{name: 'SEO Audit', category: 'marketing', description: 'Keyword research, on-page analysis, content gaps, competitor comparison, and prioritized action plan', fields: [{name: 'url_or_brand', type: 'text', required: true}, {name: 'target_keywords', type: 'text'}, {name: 'competitors', type: 'text'}]}` |
| `documents` table CHECK constraint | **MODIFY.** Add `'seo_audit'`. |

### 26D. Competitive Brief Generator (Cowork: `marketing:competitive-brief` + `product-management:competitive-brief`)

**What:** Doc Studio type generating competitive analysis. Merges the marketing and PM versions from Cowork.

**Files to modify:**

| File | Change |
|---|---|
| Doc Studio `DOC_TYPES` definition | **MODIFY.** Add `competitive_brief` type: `{name: 'Competitive Brief', category: 'strategy', description: 'Competitive analysis with feature comparison, positioning, and battlecard', fields: [{name: 'competitors', type: 'text', required: true}, {name: 'product', type: 'text', required: true}, {name: 'focus_areas', type: 'text'}]}` |
| `documents` table CHECK constraint | **MODIFY.** Add `'competitive_brief'`. |

**Why this beats Cowork:** Chapterhouse's `buildLiveContext()` includes live Intel session data — the AI has already read and analyzed competitors. Cowork's competitive-brief starts from scratch every time.

### 26E. Status Report Generator (Cowork: `operations:status-report`)

**What:** Doc Studio type generating a status report with KPIs, risks, and action items — pre-populated from Folio + Dreams + Tasks.

**Files to modify:**

| File | Change |
|---|---|
| Doc Studio `DOC_TYPES` definition | **MODIFY.** Add `status_report` type: `{name: 'Status Report', category: 'ops', description: 'Weekly status report with KPIs, risks, and action items. Pre-populated from Folio and Dreams.', fields: [{name: 'period', type: 'select', options: ['this_week', 'last_week', 'this_month', 'custom'], required: true}, {name: 'audience', type: 'select', options: ['internal', 'partner', 'investor'], default: 'internal'}]}` |
| `documents` table CHECK constraint | **MODIFY.** Add `'status_report'`. |
| `src/app/api/documents/generate/route.ts` | **MODIFY.** When `doc_type = 'status_report'`: fetch recent Folio entries + active Dreams + open Tasks and inject as additional context before generation. This gives the status report real data, not just prompting. |

### 26F. Write Spec / PRD Generator (Cowork: `product-management:write-spec`)

**What:** Doc Studio type generating feature specs and PRDs from problem statements — with locked-decision format from `scott-dev-process.instructions.md`.

**Files to modify:**

| File | Change |
|---|---|
| Doc Studio `DOC_TYPES` definition | **MODIFY.** Add `feature_spec` type: `{name: 'Feature Spec / PRD', category: 'strategy', description: 'Feature specification with goals, non-goals, phases, SQL migrations, and verification steps. Uses locked-decision format.', fields: [{name: 'feature_name', type: 'text', required: true}, {name: 'problem_statement', type: 'text', required: true}, {name: 'repo', type: 'text'}, {name: 'phase_count', type: 'number', default: 3}]}` |
| `documents` table CHECK constraint | **MODIFY.** Add `'feature_spec'`. |

**Note:** The `documents` CHECK constraint migration for all Phase 26 doc types:

**Migration 037:**
```sql
-- 20250412_037_new_doc_types.sql
-- Phase 26: Add Cowork-bridge document types to CHECK constraint

-- Drop and recreate the doc_type CHECK constraint to include new types
-- First, find the existing constraint name:
-- SELECT conname FROM pg_constraint WHERE conrelid = 'documents'::regclass AND contype = 'c';

ALTER TABLE documents
  DROP CONSTRAINT IF EXISTS documents_doc_type_check;

ALTER TABLE documents
  ADD CONSTRAINT documents_doc_type_check CHECK (
    doc_type IN (
      -- Existing types (Phase 13 / migration 030)
      'prd', 'adr', 'spec',
      'blog_post', 'landing_copy', 'campaign_brief', 'positioning_doc', 'launch_checklist', 'market_sizing',
      'session_close', 'feedback_synthesis',
      'study_guide',
      'report', 'brainstorm_output',
      'academic_paper',
      -- New types (Phase 26)
      'campaign_plan',
      'email_sequence',
      'seo_audit',
      'competitive_brief',
      'status_report',
      'feature_spec'
    )
  );
```

**Verification for all Phase 26 items:**
- [ ] Each new doc type appears in Doc Studio's type selector
- [ ] Generate a Campaign Plan for "NCHO Spring Launch" → output includes specific NCHO products, pricing, and audience from live context
- [ ] Generate a Status Report for "this week" → output references actual Folio entries and active Dreams
- [ ] Generate a Feature Spec → output uses locked-decision format with SQL migrations
- [ ] Export each new doc type as DOCX → valid download

---

## Phase 27 — Advanced / Post-Launch
*These features are documented for completeness but should NOT be built before August 2026 unless they directly enable revenue.*

### 27A. AI Columns / Row-Level Enrichment (A3)
**Route:** `/api/enrich/[table]/route.ts` — accepts table name + column definition + optional row filter. Processes in batches of 10 (Batch Size Law). Uses Haiku for speed.
**Use cases:** Dreams → auto-priority score. Social posts → auto alt-text. Intel sessions → auto business-track relevance tag.

### 27B. Composable AI Commands / Workflows (S7)
**Migration:** New `commands` table.
**Route:** `/api/commands/` CRUD + runner.
**What:** Saveable, parameterized, chainable AI pipelines. "Generate Social Bundle" = read course metadata → generate 5 posts per brand → apply brand voice → predict scores → queue for review.

### 27C. MCP Server Exposure (A5)
**Route:** `/.well-known/mcp` or dedicated MCP endpoint.
**What:** Expose Council, Intel, Dreams, Folio as MCP tools for Claude Code. Wait for stateless spec (Q2/Q3 2026 per locked decision).

### 27D. Meta-Agent / EVE Pattern (F1)
**Prerequisite:** 27B (Composable Commands).
**What:** Agent that creates specialized sub-agents from Council knowledge.

### 27E. Deep Research Mode (A9)
**What:** Enhance `processIntelUrls()` to accept topic queries → autonomously discover sources → fetch → synthesize with citations. Not just fetch-and-summarize — discover-read-synthesize. Perplexity Deep Research pattern.

---

## Migration Summary

| Migration # | Phase | Table | Change |
|---|---|---|---|
| 033 | 20A | `documents` | Add `export_history JSONB`, `content_html TEXT` |
| 034 | 21A/21B | `documents` | Add `outline JSONB`, `version INT DEFAULT 1`, `edit_history JSONB DEFAULT '[]'` |
| 035 | 23B | `watch_urls` | **CREATE** — full table with RLS |
| 036 | 25A | `social_posts` | Add `engagement_data JSONB`, `predicted_score FLOAT` |
| 037 | 26 | `documents` | Update `doc_type` CHECK constraint with 6 new types |

**All migrations:** own file with timestamp prefix, backward-compatible, include RLS where applicable. Current last migration: 032. These start at 033.

---

## New Environment Variables Summary

| Variable | Phase | Notes |
|---|---|---|
| `LANGFUSE_PUBLIC_KEY` | 20B | Keys in `api-guide-master.md` |
| `LANGFUSE_SECRET_KEY` | 20B | Keys in `api-guide-master.md` |
| `LANGFUSE_HOST` | 20B | `https://cloud.langfuse.com` |
| `ELEVENLABS_API_KEY` | 24A | From ElevenLabs dashboard (Creator plan) |
| `ELEVENLABS_DEFAULT_VOICE_ID` | 24A | Current default voice — swappable as voices evolve |

---

## New API Routes Summary

| Route | Method | Phase | Purpose |
|---|---|---|---|
| `/api/documents/export` | POST | 20A | Export document as DOCX/MD/PDF |
| `/api/costs` | GET | 20B | Cost dashboard data from Langfuse |
| `/api/documents/outline` | POST | 21A | Generate structural outline |
| `/api/documents/edit` | POST | 21B | Agentic NL editing of existing doc |
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

**Total: 16 new routes across Phases 20-26. Zero existing routes broken.**

---

## New UI Components Summary

| Component | Phase | Location |
|---|---|---|
| Export dropdown on documents | 20A | Doc Studio document view |
| Brand voice selector dropdown | 20C | Doc Studio generate form |
| Cost dashboard tab/page | 20B | Debug panel or /costs |
| Outline editor (draggable cards) | 21A | Doc Studio generate flow |
| Document edit input bar | 21B | Doc Studio document view |
| Version indicator + history sidebar | 21B | Doc Studio document header |
| "Analyze Voice" modal | 21C | BrandVoicesPanel settings |
| `<CouncilPopover>` floating button | 22A | Root layout (every page) |
| `<UnifiedSearch>` bar | 22B | Header |
| `/knowledge` page | 23A | New nav item |
| Watch URLs panel | 23B | /intel page |
| "→ Task" button on Intel findings | 23C | Intel report viewer |
| `<ListenButton>` | 24A | Folio, Intel, Doc Studio |
| Predicted score badge | 25A | Review Queue cards |
| "⚡ Boost" button | 25B | Review Queue cards |
| "🔒 Grounded Mode" toggle | 25C | Chat header |
| 6 new doc type forms | 26 | Doc Studio type selector |

---

## What Existing Code Is Preserved

This spec adds to Chapterhouse — it does not remove or replace anything.

| Existing System | Status |
|---|---|
| Council 5-pass pipeline (/council) | **PRESERVED** — Phase 22A adds @Council quick mode alongside, not replacing |
| Doc Studio 15 doc types | **PRESERVED** — Phase 26 adds 6 more types |
| Social generation + Review Queue | **PRESERVED** — Phase 25 adds prediction and boost |
| Intel pipeline + cron | **PRESERVED** — Phase 23B adds watch URLs to existing cron |
| Folio daily narrative | **PRESERVED** — Phase 24B adds audio option |
| Dreams/Dreamer | **PRESERVED** — no modifications |
| Chat + solo chat | **PRESERVED** — Phase 25C adds grounded toggle |
| Brand voices table + panel | **PRESERVED** — Phase 21C adds analyze, Phase 20C adds doc studio selector |
| All 32 migrations (001-032) | **PRESERVED** — new migrations start at 033 |
| All existing API routes | **PRESERVED** — some modified (never removed) |

---

## Critical Path

```
Phase 20 (4-6 hrs) ←← START HERE — wire what's installed
  ├── 20A Export ←← THE VERY FIRST THING
  ├── 20B Langfuse
  └── 20C Brand Voice in Doc Studio

Phase 21 + 22 (parallel, 16-22 hrs combined)
  ├── 21A Outline-First
  ├── 21B Agentic Editing
  ├── 21C Voice Analysis
  ├── 22A Council Popover
  └── 22B Unified Search

Phase 23 + 25 (parallel, 12-16 hrs combined)
  ├── 23A Knowledge Base UI
  ├── 23B Watch URLs
  ├── 23C Intel → Task
  ├── 25A Performance Prediction
  ├── 25B Boost Button
  └── 25C Grounded Mode

Phase 24 (4-6 hrs — ALL DECISIONS LOCKED)
  ├── 24A ElevenLabs Wiring (Creator plan, evolving voices)
  └── 24B Audio on Content Types (Folio, Intel, Doc Studio)

Phase 26 (8-10 hrs — after Phase 21)
  └── 26A-F: Six new doc types

Phase 27 (post-launch, open-ended)
  └── AI Columns, Composable Workflows, MCP, Meta-Agent, Deep Research
```

---

**This spec is the green light to build. Phase 20A is the starting point. A code bot can open Chapterhouse, read this file, and begin executing.**

---

*"Seven phases. Five migrations. Sixteen routes. Zero existing code broken. I've planned extractions with worse odds and better whiskey." — Earl*
