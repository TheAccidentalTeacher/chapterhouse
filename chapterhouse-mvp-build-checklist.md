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

### Step 6 — Daily Brief v1: Real Ingestion + Cron ✅ DONE (March 10)
- [x] `rss-parser` installed
- [x] `src/lib/sources/rss.ts` — 9 RSS feeds (Anthropic, OpenAI, GitHub Changelog, Vercel, Hacker News Top 10, HSLDA, Shopify, Christianity Today, Education Week)
- [x] `src/lib/sources/github.ts` — GitHub API across 11 monitored repos: Dependabot security alerts, failed CI runs (48h window), open issues. Sorted by severity.
- [x] `src/app/api/briefs/generate/route.ts` — rewritten. GPT replaced with Claude Sonnet 4.6. Real data fed as context. Output uses 🔴🟡🟢📊⚫ section format. `source_count` reflects actual items scanned.
- [x] `src/app/api/cron/daily-brief/route.ts` — cron endpoint, Bearer token auth via `CRON_SECRET`
- [x] `vercel.json` — cron schedule `0 15 * * *` = 7:00am AKST daily
- [x] `GITHUB_TOKEN`, `CRON_SECRET`, `NEXT_PUBLIC_APP_URL` set in local `.env` and `.env.local`
- [x] All 3 env vars added to Vercel dashboard ✅
- [x] **Tested in production** — Generate works. RSS: 3 feeds OK / 6 failed (feed-side). GitHub: 11 repos OK. 20 items → Claude → saved.

### Step 7 — Brief UI + Action Buttons ✅ DONE (March 10)
- [x] `src/components/new-brief-panel.tsx` — Generate always visible, manual write collapsible. Ingestion debug strip after generation.
- [x] `src/components/brief-item-card.tsx` — client component. **Convert to task** creates row in `tasks` table. **Send to review** creates row in `research_items` table.
- [x] `src/app/api/research/route.ts` — added `briefItem` fast path (skips AI analysis, inserts directly)
- [x] Right sidebar: ingestion pipeline listing (9 feeds, 11 repos) + last brief stats panel
- [x] `src/lib/daily-brief.ts` — `sourceCount` exposed from Supabase `source_count`

---

## Current Build Gaps (Prioritized)

### P0 — Security
- [ ] **Set `ALLOWED_EMAILS` in Vercel** — `scott@somers.com,anna@somers.com`. Middleware enforces this but the env var is NOT set in production. Without it, any Supabase user can access the full system.
- [ ] **Secure or remove `/api/debug`** — currently returns API key prefixes with no auth check. Either add auth or delete the route.

### P1 — Daily Brief Reliability
- [ ] **Fix 6 failing RSS feeds** — Anthropic, OpenAI, HSLDA, Shopify, Christianity Today, Education Week feeds fail server-side. Swap for working URLs, add User-Agent rotation, or add Jina/Firecrawl fallback.
- [ ] **Verify Vercel Cron fires** — Check tomorrow (March 11) that the 7am AKST brief auto-generates.

### P2 — Intelligence scaling
- [ ] **Stage 3: Summarization pass** — `knowledge_summaries` table; `/api/summarize`; group by tag → condensed summaries; inject when research count > threshold
- [ ] **Stage 4: pgvector** — `CREATE EXTENSION vector`; `text-embedding-3-small` on save; semantic similarity replaces keyword scoring in `buildLiveContext()`
- [ ] **Persist RSS items to `sources` table** — Brief sources become searchable, linkable context

### P3 — Research hardening
- [ ] **SSRF protection** — block 127.x, 192.168.x, 10.x, 169.254.x before outbound URL fetch
- [ ] **Metadata extraction** — pull `<title>`, meta description, og:site_name, article:published_time from HTML

### P4 — Agentic capability
- [ ] **Inline chat URL detection** — detect URL in chat message → `/api/fetch-url` (no-save) → inject into that turn's context
- [ ] **Agentic research** — search API (Brave/Serper) + multi-URL fetch + synthesis loop
- [ ] **Email delivery** — Send daily brief to `brief@buttercup.cfd` via Resend

### P5 — Settings screen expansion
- [ ] Full Settings — model routing config, source watchlist management, workspace settings

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
| `briefs` | ✅ Live | Daily Brief read/write/generate. `source_count` reflects real RSS+GitHub items. |
| `research_items` | ✅ Live | URL/paste/note/image ingestion + brief item forwarding |
| `opportunities` | ✅ Live | Product Intelligence scoring |
| `founder_notes` | ✅ Live | Auto-learn + /remember memory |
| `tasks` | ✅ Live | Full CRUD with source linking (brief/opportunity/manual) |
| `chat_threads` | ✅ Live | Persistent chat threads with messages JSONB |
| `documents` | ✅ Schema only | Not used by code (Documents page reads filesystem) |
| `sources` | ✅ Schema only | Nothing writes to it yet; RSS items go direct to Claude |
| `settings` | ✅ Schema only | No code reads/writes to it |

## Deferred Infrastructure
| Service | Status | When |
|---------|--------|------|
| Qdrant | Deferred | Stage 4 (pgvector first, Qdrant if scale demands) |
| Upstash | Deferred | When caching/rate-limiting needed |
| Trigger.dev | ✅ No longer needed for daily brief | Vercel Cron handles scheduling. Trigger.dev still an option for complex multi-step job chains. |

---

## Immediate Next Actions — Chapterhouse Build Order

This is the working sequence. Do these in order. Don't skip ahead.

| # | Item | Status | What it unlocks |
|---|------|--------|----------------|
| 1 | ~~Add env vars to Vercel + redeploy~~ | ✅ DONE | Cron active; Generate works in production |
| 2 | ~~Test daily brief in production~~ | ✅ DONE | Pipeline confirmed working (3/9 RSS, 11/11 GitHub, Claude output correct) |
| 3 | ~~Auth gate~~ | ✅ DONE | Middleware + allowlist. scott@somers.com + anna@somers.com |
| 4 | ~~Review Queue screen~~ | ✅ DONE | Dual-feed: research + opportunities. Approve/reject/convert-to-task |
| 5 | ~~Tasks screen~~ | ✅ DONE | Full CRUD, status machine, source linking |
| 6 | ~~Content Studio screen~~ | ✅ DONE | 3 modes: Newsletter, Curriculum Guide, Product Description via Claude |
| 7 | ~~Brief item action buttons~~ | ✅ DONE | Convert to task + Send to review on every brief item |
| 8 | **Set `ALLOWED_EMAILS` in Vercel** | 🔴 DO NOW | Without this, auth gate is open in production |
| 9 | **Secure `/api/debug`** | 🔴 DO NOW | Leaks API key prefixes |
| 10 | **Fix failing RSS feeds** | 🟡 NEXT | 6/9 feeds fail server-side. Swap URLs or add fallback |
| 11 | **Verify Vercel Cron** | 🟡 NEXT | Check March 11 that 7am brief auto-generates |
| 12 | **Stage 3: Summarization pass** | 🟢 LATER | When research items > ~50 |
| 13 | **SSRF fix + metadata extraction** | 🟢 LATER | Security hardening for research URL fetch |
| 14 | **Stage 4: pgvector embeddings** | 🟢 LATER | Semantic similarity search |
| 15 | **Persist RSS to `sources` table** | 🟢 LATER | Make brief sources searchable |
| 16 | **Email delivery** | 🟢 LATER | Daily brief to brief@buttercup.cfd via Resend |
| 17 | **Inline chat URL detection** | 🟢 LATER | URL in chat → auto-fetch → inject into context |
| 18 | **Agentic research** | 🟢 LATER | Search API + multi-URL synthesis loop |

