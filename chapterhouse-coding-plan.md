# Coding Plan — Chapterhouse

> *This is the build plan. Not the dream, not the architecture, not the product poetry — the actual sequence for turning Chapterhouse from a documented system into running software without wandering into six side quests and a framework relapse.*

---

## Purpose

This document defines the phase-by-phase implementation plan for Chapterhouse.

It includes:
- build phases
- step-by-step sequencing
- testing plan
- debugging plan
- browser-console workflow
- tool decisions still to be made
- model-selection guidance for who or what should do the actual coding work

This is the execution map.

---

## Build Philosophy

### 1. Build the smallest honest version first
The first version should be real, not impressive-looking nonsense.

### 2. Test every layer as it appears
Do not build six floors and then discover the stairs go nowhere.

### 3. Separate shell, engine, and automation
Get the app shell working. Then retrieval and intelligence. Then background jobs. Then controlled automation.

### 4. Prefer visible progress over hidden complexity
Every phase should end with something demonstrable.

### 5. Make debugging part of the plan, not a postmortem hobby

---

## Recommended Tech Direction

### Frontend / app shell
- Next.js on Vercel
- TypeScript
- App Router
- Tailwind CSS
- component system with reusable layout primitives

### Data / auth / storage
- Supabase

### Retrieval / vectors
- Qdrant

### Cache / fast state
- Upstash

### Jobs / automation
- Trigger.dev

### Validation / schemas
- Zod

### UI state / server state
- start simple with server actions + React state
- add TanStack Query only if actual app complexity demands it

### Tables / dense data views
- TanStack Table when needed

---

## Phase 0 — Implementation Decisions Before Writing Real App Code

### Goal
Make the final pre-build decisions so the coding phase does not thrash.

### Tasks
1. Confirm stack:
   - Next.js
   - Supabase
   - Qdrant
   - Upstash
   - Trigger.dev
2. Decide repo/workspace location for the actual app
3. Decide package manager:
   - `pnpm` preferred
4. Decide component strategy:
   - custom design system vs UI starter kit
5. Decide environment management rules:
   - local `.env`
   - hosted provider secrets
6. Decide migration strategy:
   - Supabase migrations checked into repo
7. Decide lint/format/typecheck policy

### Deliverable
A settled implementation baseline.

### Tests
- environment variables load locally
- provider clients can initialize without crashing

---

## Phase 1 — App Shell and Foundations

### Goal
Create the real application shell with navigation, layout, theme support, basic auth plumbing, and typed foundations.

### Step-by-step
1. Initialize Next.js app
2. Configure TypeScript, linting, formatting
3. Set up Tailwind and theme system
4. Create global layout
5. Build left sidebar navigation
6. Build top-level route structure:
   - Home
   - Daily Brief
   - Research
   - Product Intelligence
   - Content Studio
   - Review Queue
   - Tasks
   - Documents
   - Settings
7. Add placeholder page shells
8. Create shared types based on schema docs
9. Add Supabase client setup
10. Add environment validation with Zod

### Deliverable
A running app shell with navigation and typed infrastructure.

### Tests
- all routes render
- dark/light themes work
- sidebar navigation works
- no hydration errors
- environment validation catches missing required keys cleanly

### Debugging focus
- layout shifts
- route errors
- hydration mismatches
- missing env usage

---

## Phase 2 — Data Foundations and Local Mocking

### Goal
Make the UI capable of rendering realistic objects before full backend logic is complete.

### Step-by-step
1. Create typed interfaces/models for:
   - sources
   - books
   - authors
   - publishers
   - opportunities
   - tasks
   - review items
   - briefs
2. Create mock data files or seed objects
3. Build list/detail UI with fake data
4. Create reusable UI primitives:
   - score badges
   - evidence badges
   - opportunity cards
   - source cards
   - review queue items
   - task rows
5. Add empty states
6. Add loading states

### Deliverable
UI screens that feel real even before live ingestion exists.

### Tests
- pages render with mock records
- filters work against mock data
- detail drawers/panels open correctly
- no obvious type drift across object usage

### Debugging focus
- prop mismatches
- rendering loops
- filter state bugs
- incorrect object assumptions

---

## Phase 3 — Supabase Schema and Real Persistence

### Goal
Move from mock records to actual stored data.

### Step-by-step
1. Translate schema into Supabase tables/migrations
2. Create initial seed data for:
   - users
   - workspaces
   - personas
   - core documents
3. Add row access rules suitable for internal use
4. Build server-side queries for core objects
5. Replace mock data on priority pages:
   - Home
   - Review Queue
   - Tasks
   - Documents
6. Add create/update actions for:
   - review items
   - tasks
   - overrides
   - settings

### Deliverable
The app reads and writes core structured data.

### Tests
- migrations run cleanly from scratch
- seed script works
- create/read/update flows work
- record links work correctly
- tasks and review items persist correctly

### Debugging focus
- schema mismatches
- null-handling bugs
- relation lookup failures
- broken migration assumptions

---

## Phase 4 — Retrieval and Document Memory

### Goal
Make the system actually retrieve from the existing documents.

### Step-by-step
1. Create document ingestion script for core docs
2. Chunk documents intelligently
3. Generate embeddings
4. Store embeddings in Qdrant
5. Store chunk/document metadata in Supabase
6. Build retrieval utility:
   - exact doc retrieval
   - semantic retrieval
   - recent record retrieval
7. Build first working chat retrieval flow on Home
8. Add citations panel in UI

### Deliverable
The system can answer questions grounded in the brand guide documents.

### Tests
- core docs ingest successfully
- retrieval returns relevant chunks
- citations map to real docs
- same query produces stable enough retrieval results
- no duplicate-chunk explosion

### Debugging focus
- bad chunking
- irrelevant retrieval
- embedding mismatch
- citation mapping bugs

---

## Phase 5 — Research Loop

### Goal
Ship the first real analyst workflow.

### Step-by-step
1. Build URL/text ingestion UI in Research
2. Add source parsing pipeline
3. Add source grading logic
4. Add fact/pattern/opinion/hype breakdown generation
5. Add compare mode for multiple sources
6. Add report save flow
7. Link saved reports to review queue and tasks

### Deliverable
Research screen becomes genuinely useful.

### Tests
- pasted URL fetches and parses
- pasted text works without URL
- comparison view handles disagreement cleanly
- saved reports persist and reopen correctly
- citations remain attached

### Debugging focus
- parser failures
- malformed or partial source content
- confidence score weirdness
- report-save failures

---

## Phase 6 — Daily Brief and Source Ingestion Engine

### Goal
Automate the morning brief.

### Step-by-step
1. Build Trigger.dev daily job
2. Connect RSS/news/API inputs
3. Add normalization and dedupe stage
4. Add source classification and grading
5. Add domain grouping logic
6. Add brief assembly logic
7. Save brief to Supabase
8. Render brief in UI
9. Add regenerate and rerun controls

### Deliverable
The first automatic daily brief.

### Tests
- scheduled job runs successfully
- duplicate articles are suppressed
- brief sections populate correctly
- empty/quiet news day does not break rendering
- failed source fetches degrade gracefully

### Debugging focus
- job timeouts
- RSS parse issues
- duplicate detection bugs
- brief rendering problems

---

## Phase 7 — Product Intelligence Engine

### Goal
Track competitors, books, authors, publishers, and opportunities.

### Step-by-step
1. Build competitor seed import
2. Build watched-entity schema population
3. Add competitor scan job
4. Add signal detection:
   - price changes
   - featured titles
   - author pushes
   - promotions
   - stock/catalog shifts
5. Add three-score opportunity logic:
   - store
   - curriculum
   - content
6. Add opportunity feed UI
7. Add low-confidence watchlist behavior
8. Add alert creation and review-queue routing

### Deliverable
The Product Intelligence screen starts acting like a market radar.

### Tests
- competitor pages ingest reliably enough
- opportunity scoring runs without null explosions
- low-confidence items route correctly
- review queue receives important opportunities
- entity links resolve correctly

### Debugging focus
- selector/parser brittleness
- false positives in signal detection
- score inflation or suppression bugs
- broken entity-link chains

---

## Phase 8 — Review Queue and Task Conversion

### Goal
Turn intelligence into governed action.

### Step-by-step
1. Finalize review queue UI
2. Implement actions:
   - approve
   - reject
   - snooze
   - override score
   - add note
   - convert to task
3. Implement built-in task list
4. Add linked-object context in queue and tasks
5. Add activity log entries for decisions

### Deliverable
The app becomes operational, not just informative.

### Tests
- review actions persist correctly
- task conversion creates correct links
- overridden scores display correctly
- approval changes downstream visibility/state

### Debugging focus
- stale UI after actions
- optimistic update bugs
- linked-record corruption
- activity-log gaps

---

## Phase 9 — Content Studio and Reviewed Calendar

### Goal
Turn approved ideas into calendar-ready content.

### Step-by-step
1. Build Content Studio layout
2. Add channel selectors
3. Add content-draft generation actions
4. Add source/context side panel
5. Add reviewed-calendar object and view
6. Add content review states
7. Add per-channel approval behavior

### Deliverable
The first useful content workflow.

### Tests
- drafts generate with correct context
- channel variants differ meaningfully
- approved content lands in reviewed calendar
- edits persist

### Debugging focus
- wrong persona use
- poor context retrieval for draft generation
- calendar state bugs
- channel-rule confusion

---

## Phase 10 — Controlled Automation and Scheduling

### Goal
Introduce selective automation without losing trust.

### Step-by-step
1. Add scheduling pipeline for approved content
2. Add channel connection layer where appropriate
3. Add approval-by-channel settings
4. Add posting logs
5. Add rollback/suspend toggles

### Deliverable
The system starts to act, not only advise.

### Tests
- only approved items are scheduled
- scheduling respects channel-specific rules
- failures are logged visibly
- nothing auto-posts without the required approval state

### Debugging focus
- accidental publish risk
- channel auth failures
- duplicate scheduling
- timezone/date logic bugs

---

## Testing Strategy

## 1. Test categories

### A. Type and compile safety
- TypeScript strictness
- lint
- build checks

### B. Unit tests
Use for:
- scoring helpers
- source classification
- dedupe logic
- parsing utilities
- routing utilities
- prompt assembly helpers

### C. Integration tests
Use for:
- Supabase queries/actions
- retrieval pipeline
- report save flow
- review queue actions
- brief generation pipeline

### D. End-to-end tests
Use for:
- Home chat basic flow
- research paste → report save
- brief read → queue → task
- opportunity approval → task conversion

### E. Manual exploratory testing
Use for:
- UI polish
- flow weirdness
- prompt quality
- retrieval sanity
- content usefulness

---

## Recommended Testing Tools

- `Vitest` for unit and lightweight integration tests
- `Testing Library` for component behavior where useful
- `Playwright` for end-to-end testing
- `Sentry` for runtime error capture

Optional later:
- visual regression if UI complexity grows enough

---

## Browser Debugging Plan — F12 Console

The browser console should be treated as part of the implementation loop, not just a panic room.

## What to watch in DevTools

### Console
Use it for:
- hydration errors
- runtime exceptions
- failed actions
- bad client-side assumptions
- missing env/config symptoms leaking into UI

### Network tab
Use it for:
- failed API calls
- slow endpoints
- incorrect payloads
- duplicated requests
- auth failures

### Application tab
Use it for:
- local storage/session state
- cookie/auth state
- caching weirdness

### React / component debugging
Use for:
- re-render loops
- prop/state drift
- stale data views

---

## F12 Debugging Checklist by Symptom

### If the UI looks broken
- check console for hydration mismatch
- check for Tailwind/class collisions
- inspect component tree and props

### If data is missing
- check network response
- verify server action or API route result
- verify Supabase query result
- verify auth/session assumptions

### If retrieval feels wrong
- inspect what chunks were retrieved
- inspect what source IDs/citations were attached
- inspect embedding and chunk metadata

### If the brief is weird
- inspect ingested source count
- inspect dedupe count
- inspect domain grouping logic
- inspect output JSON stored for the brief

### If opportunity scores look stupid
- log subfactor inputs
- inspect override records
- inspect missing/null factor values
- compare score output against expected thresholds

### If queue actions fail
- inspect mutation payload
- inspect DB write result
- inspect linked object IDs

---

## Logging Strategy During Development

### Keep logs useful
Add logs for:
- job start/end
- source count changes
- dedupe decisions
- score calculations
- queue actions
- task creation
- retrieval bundles

### Do not drown in logs
Avoid noisy logging that tells you nothing except that JavaScript continues to exist.

---

## Additional Tools We Will Likely Need

## Definitely useful
- `Zod` — env and payload validation
- `Vitest` — unit/integration tests
- `Playwright` — end-to-end tests
- `Sentry` — runtime error monitoring

## Probably useful
- `React Hook Form` if form complexity rises
- `TanStack Table` for product intelligence tables
- `date-fns` for date logic
- `clsx` / `tailwind-merge` for class sanity

## Maybe later
- `PostHog` for product usage analytics
- `Resend` for internal digest email delivery
- `Trigger.dev` dashboard discipline for job monitoring
- visual regression tooling if UI grows more brittle

---

## Model-Selection Plan for Actual Building

You have not decided whether the implementation work itself should primarily be driven by:
- GPT-5.4
- GPT-5.3 Codex
- Sonnet 4.6
- Opus 4.6
- or some mix

That is fine. The plan should support mixed use.

## Recommended model role split

### Use strongest reasoning model for
- architecture decisions
- schema thinking
- workflow logic
- debugging complex state issues
- retrieval and scoring design

### Use strongest code-generation model for
- component scaffolds
- route scaffolds
- CRUD wiring
- client initialization
- repetitive type-safe plumbing

### Use strongest writing/cleanup model for
- prompt refinement
- UI copy polish
- documentation upkeep

### Important rule
Do not treat one model as the universal builder if a mixed workflow is materially better.

---

## Model Evaluation Plan

Before committing to one primary builder, test candidate models on the same tasks.

### Benchmark tasks
1. create a typed Next.js route and page shell
2. generate a Supabase schema/migration draft
3. implement a reusable UI card component
4. debug a broken retrieval function
5. write a unit test for scoring logic
6. refactor a messy server action cleanly

### Judge them on
- correctness
- type safety
- clarity
- overengineering tendency
- debugging usefulness
- consistency with your architecture docs

### Practical outcome
You may end up with:
- one model for architecture/debugging
- one model for rapid implementation
- one model for cleanup/review

That is not a failure. That is adult tool use.

---

## Definition of Done by Phase

Each phase is done only when:
- the feature works
- the intended test level passes
- obvious console/network errors are absent
- the feature is documented enough to not become tribal knowledge instantly

---

## Recommended Immediate Next Steps

1. Review and approve this build plan
2. Decide the actual repo/workspace for implementation
3. Decide the initial coding model workflow
4. Set up provider accounts/projects:
   - Vercel
   - Supabase
   - Qdrant
   - Upstash
   - Trigger.dev
5. Start Phase 0

---

*Last updated: March 6, 2026 — The point of a coding plan is not to sound organized. It is to survive contact with reality.*