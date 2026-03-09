# Chapterhouse MVP Build Checklist

> *This is the bridge between the planning docs and the actual code. It settles the first implementation decisions, defines the MVP slice, and keeps the build from turning into a very sincere pile of architecture thoughts.*

---

## Purpose

This document locks the first practical build decisions for Chapterhouse and defines the MVP vertical slice.

The goal is simple:
- stop debating the foundation
- scaffold the app
- build one real loop end to end

---

## Phase 0 Decisions

### App location
- **Repository strategy:** keep docs at the repo root
- **Application location:** `web/`
- **Reason:** preserve the documentation system while giving the app a clean deployment target

### Package manager
- **Decision:** `npm`
- **Reason:** `pnpm` is preferred in theory, but `npm` is already installed and ready locally
- **Rule:** do not block the build on package-manager purity

### Frontend foundation
- **Framework:** Next.js
- **Language:** TypeScript
- **Routing:** App Router
- **Styling:** Tailwind CSS
- **Reason:** fast path to a polished app shell with good deployment ergonomics on Vercel

### Component strategy
- **Decision:** custom Tailwind layout primitives first
- **Reason:** fastest way to match the Chapterhouse UI spec without overcommitting to a component library too early
- **Future option:** add a starter component system later if repeated UI patterns justify it

### Auth strategy
- **Decision:** Supabase Auth
- **Day-one mode:** internal use, single workspace, email-based sign-in
- **Reason:** simplest real authentication path with future room for proper roles

### Data layer
- **Primary database:** Supabase Postgres
- **Vector store:** Qdrant
- **Cache / fast state:** Upstash
- **Background jobs:** Trigger.dev

### Environment strategy
- local development secrets stay in ignored local env files
- hosted secrets live in provider dashboards
- repo only keeps sanitized examples

### Migration strategy
- use checked-in SQL migrations under `web/supabase/migrations`
- keep schema changes explicit and reviewable

### Validation and quality gates
- `npm run lint`
- `npx tsc --noEmit`
- route-level smoke test in the browser
- environment validation before app boot

### Active model providers for day one
- **Primary:** OpenAI
- **Secondary:** Anthropic
- **Reason:** enough flexibility without creating routing chaos on day one

---

## MVP Scope

### The first usable slice
Build the **Daily Brief vertical slice** first.

That includes:
1. sign-in gate
2. app shell and navigation
3. documents page with core docs visible
4. research/source record model stub
5. daily brief page
6. one server-side brief-generation path
7. citations / source references in the UI

### Not in MVP
- full competitor automation
- content studio generation workflows
- multi-workspace complexity
- complex approval routing
- deep task automation
- graph database behavior

---

## Build Sequence

### Step 1 — Scaffold the shell ✅ DONE (March 6–7)
- [x] Create the Next.js app at repo root (moved from `web/`)
- [x] Left sidebar navigation with all 9 routes
- [x] Vercel deployment live at `chapterhouse.vercel.app`

### Step 2 — Add typed foundations ✅ DONE
- [x] Shared app types
- [x] Environment validation
- [x] OpenAI (Responses API) + Anthropic SDK wired
- [x] Supabase server-side client (`getSupabaseServiceRoleClient`)

### Step 3 — Core screens ✅ DONE (March 7–9)
- [x] Chat interface — streaming, model switcher, markdown rendering, conversation persistence
- [x] Daily Brief — read + write + AI generate from Supabase
- [x] Research — URL fetch, paste text, quick note, screenshot/GPT Vision, manual fallback, delete, re-analyze
- [x] Documents — reads all `.md` files from repo root
- [x] Product Intelligence — opportunity scoring engine (A+ through C across Store/Curriculum/Content)

### Step 4 — Memory pipeline ✅ DONE (March 9)
- [x] `founder_notes` Supabase table live
- [x] `/api/extract-learnings` — extracts facts from every conversation in parallel
- [x] Brain indicator (learning… / N learned pill)
- [x] Founder memory injected into every chat system prompt
- [x] `/api/founder-notes` GET / POST / DELETE confirmed working in production

### Step 5 — Context intelligence ✅ DONE (March 9)
- [x] System prompt self-awareness — AI knows exactly what it can/cannot see
- [x] Stage 2 relevance injection — research ranked by keyword overlap with user message (top 10 of 100)
- [x] Research analysis prompt rewritten with full Scott context (vibe-coder, SomerSchool, Chapterhouse, Anna)
- [x] `vibe-coding` tag renders in accent color as HIGH-relevance signal

---

## Current Build Gaps (Prioritized)

### P0 — Security
- [ ] **Auth gate** — Supabase magic link, locked to Scott + Anna email addresses. App is currently open.

### P1 — Missing screens (nav items exist, screens empty)
- [ ] **Review Queue** — approve/reject/snooze/convert-to-task interface for opportunities and research
- [ ] **Tasks** — task list, state progression (open/in-progress/blocked/done/canceled), source linking
- [ ] **Content Studio** — draft, queue, and shape outbound content; channel-aware drafting

### P2 — Intelligence scaling
- [ ] **Stage 3: Summarization pass** — `knowledge_summaries` table; `/api/summarize`; group by tag → condensed summaries; inject when research count > threshold
- [ ] **Stage 4: pgvector** — `CREATE EXTENSION vector`; `text-embedding-3-small` on save; semantic similarity replaces keyword scoring in `buildLiveContext()`

### P3 — Research hardening
- [ ] **SSRF protection** — block 127.x, 192.168.x, 10.x, 169.254.x before outbound URL fetch
- [ ] **Metadata extraction** — pull `<title>`, meta description, og:site_name, article:published_time from HTML

### P4 — Agentic capability
- [ ] **Option A: Inline chat URL detection** — detect URL in chat message → `/api/fetch-url` (no-save) → inject into that turn's context
- [ ] **Scheduled brief generation** — Trigger.dev cron job for automatic morning brief
- [ ] **Option B: Agentic research** — search API (Brave/Serper, needs key) + multi-URL fetch + synthesis loop

### P5 — Settings screen
- [ ] **Full Settings** — beyond founder memory panel: model routing config, source watchlist management, workspace settings

---

## Shopify Track (Anna-managed)

The Shopify storefront build is **Anna's domain**. Scott owns Chapterhouse. The two tracks run in parallel but have separate owners. Scott will hand off Shopify automation tools once an API key is available and the store is live enough to warrant it.

**Confirmed decisions:**
- Theme: **Kidu** (OS 2.0, book/education oriented) ✅
- Fulfillment: Ingram Spark dropship ✅
- Product: Curriculum guides are legal companion works, ~95% margin ✅

**AI items Scott will build (when Shopify API key is available):**
- [ ] **AI Product Description Generator** — batch-generate brand-voice descriptions for all products; run before launch
- [ ] **AI Curriculum Guide Generator** — 10–20 guides before launch; Scott's highest-margin product; builds from book title + grade + angle input
- [ ] **Bulk Importer + Metafield Manager** — CSV → Shopify via Admin GraphQL; sets grade_level, faith_flag, allotment_eligible, etc.
- [ ] **Digital Product Delivery Automation** — webhook listener for `orders/paid`; triggers branded email with download link

**Anna's items (she manages directly, Chapterhouse supports with intelligence):**
- Kidu theme configuration and storefront design
- Catalog curation and product selection
- Faith/secular filter setup
- Alaska Allotment filter and badge
- Grade Level Quick-Nav
- Curriculum Guide Upsell block
- Ingram Spark account and catalog sync
- Trisha Goyer product integration

**When Shopify API key arrives:**
Pipe the store's catalog metadata into Chapterhouse Research so AI can interpret product performance, keyword gaps, and competitor pricing in context.

---

## Supabase Tables (Live)
| Table | Status | Notes |
|-------|--------|-------|
| `briefs` | ✅ Live | Daily Brief read/write/generate |
| `research_items` | ✅ Live | URL/paste/note/image ingestion |
| `opportunities` | ✅ Live | Product Intelligence scoring |
| `founder_notes` | ✅ Live | Auto-learn + /remember memory |

## Deferred Infrastructure
| Service | Status | When |
|---------|--------|------|
| Qdrant | Deferred | Stage 4 (pgvector first, Qdrant if scale demands) |
| Upstash | Deferred | When caching/rate-limiting needed |
| Trigger.dev | Deferred | Scheduled brief generation (P4) |

---

## Immediate Next Actions — Chapterhouse Build Order

This is the working sequence. Do these in order. Don't skip ahead.

| # | Item | What it unlocks |
|---|------|-----------------|
| 1 | **Review Queue screen** | Turns research + opportunities into actual decisions; wire real DB, approve/reject/snooze/convert-to-task |
| 2 | **Tasks screen** | Converts approved queue items into execution; state machine + source linking |
| 3 | **Auth gate** | Supabase magic link locked to Scott + Anna emails; required before Anna uses the system or before Shopify work links to it |
| 4 | **Content Studio screen** | Anna's drafting workflow; channel-aware content with brand-voice grounding from core docs |
| 5 | **Stage 3: Summarization pass** | Condenses large research library into summaries by tag; prevents context ceiling; build when research > ~50 items |
| 6 | **SSRF fix + metadata extraction** | Security hardening for research URL fetch; pull page title, meta description, og:site_name, published date |
| 7 | **Stage 4: pgvector embeddings** | Semantic similarity replaces keyword scoring; `text-embedding-3-small` on save; upgrade `buildLiveContext()` to vector search |
| 8 | **Option A: Inline chat URL detection** | Detect URL in chat message → `/api/fetch-url` (no-save) → inject into that turn's context; the "inspect a webpage from chat" capability |
| 9 | **Scheduled brief generation** | Trigger.dev cron job for automatic morning brief; needs Trigger.dev account setup |
| 10 | **Option B: Agentic research** | "Research X" intent → search API (Brave or Serper, ~$5/mo) → multi-URL fetch → synthesis loop → Research saved automatically |

