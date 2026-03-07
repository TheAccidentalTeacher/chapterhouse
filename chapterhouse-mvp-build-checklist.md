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

### Step 1 — Scaffold the shell
- create the Next.js app in `web/`
- configure base metadata and theme tokens
- add left sidebar navigation
- add placeholder routes from the UI spec

### Step 2 — Add typed foundations
- shared app types
- environment validation
- provider client stubs
- core domain constants

### Step 3 — Add Supabase integration
- browser/server client utilities
- auth-ready layout assumptions
- placeholder persistence layer for MVP entities

### Step 4 — Build the Daily Brief screen
- summary cards
- brief sections
- source/citation rail
- action buttons

### Step 5 — Add basic document memory setup
- show core docs in Documents
- define ingestion placeholders
- prepare document metadata shape

### Step 6 — Prepare deployment
- Vercel-ready app config
- sanitized app env example
- first local run validation

---

## MVP Entity Priority

Build these first:
- `documents`
- `briefs`
- `sources`
- `research_items`
- `tasks`
- `settings`

Defer the rest until the shell is real.

---

## Definition of Done for MVP Foundation

The foundation is considered real when:
- the app runs locally from `web/`
- the sidebar and core routes work
- the app validates required environment variables cleanly
- the Daily Brief screen renders with realistic seeded data
- the Documents screen exposes the core Chapterhouse docs
- Supabase client plumbing is in place
- the repo stays secret-safe

---

## Immediate Next Actions

1. scaffold the app in `web/`
2. replace starter UI with the Chapterhouse shell
3. add environment validation and provider stubs
4. add seeded Daily Brief and Documents screens
5. commit the foundation before any deeper backend work
