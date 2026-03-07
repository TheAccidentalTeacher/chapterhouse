# Technical Architecture Spec — Chapterhouse

> *This is where the product stops being a beautiful concept and becomes a machine with pipes, storage, workers, and actual places for things to live. Glamorous? No. Necessary? Absolutely.*

---

## Purpose

This document defines the recommended technical architecture for Chapterhouse.

It explains:
- where the app should be hosted
- what each infrastructure service is responsible for
- how requests should flow
- how daily ingestion should work
- what gets stored where
- what to build first

The goal is not infrastructure for infrastructure's sake. The goal is a clean system that supports a premium internal product without turning Scott into unpaid DevOps.

---

## Recommended Hosting Stack

### Core recommendation
- **Vercel** — frontend and app shell
- **Supabase** — Postgres, auth, structured storage, and basic file storage
- **Qdrant Cloud** — vector search and semantic retrieval
- **Upstash** — Redis cache, dedupe memory, lightweight queue state, rate limiting
- **Trigger.dev** — background jobs, scheduled workflows, retries, long-running tasks

### Keep in reserve, not day one
- **Neo4j** — graph database, only if relationship-heavy intelligence becomes painful enough to justify another moving part

---

## Service-by-Service Responsibilities

## 1. Vercel

### What it should host
- Next.js app
- UI routes and layouts
- user-facing API routes
- server actions for lightweight operations
- authenticated app views

### What it should not own alone
- heavy scraping
- long-running ingestion
- large scheduled jobs
- retry-heavy workflows

### Why it fits
The app wants a polished, GPT-like, fast interface. Vercel is excellent for the face of the system.

---

## 2. Supabase

### What it should store
- users
- workspaces
- personas metadata
- documents metadata
- sources metadata
- competitors
- books
- authors
- publishers
- opportunities
- briefs
- reports
- review items
- tasks
- overrides
- decisions
- settings
- activity log

### Additional roles
- authentication
- authorization later via row-level security
- file storage for exported reports, saved artifacts, or snapshots

### Why it fits
The system has a lot of relational data. Supabase gives a strong Postgres backbone with low friction.

---

## 3. Qdrant

### What it should store
- embeddings for core brand docs
- embeddings for ingested sources
- embeddings for summaries and reports
- embeddings for product/opportunity notes when useful

### What it powers
- semantic search
- context retrieval before generation
- related-document discovery
- memory recall when wording differs

### Why it fits
This system must remember meaning, not just keywords.

---

## 4. Upstash

### What it should handle
- caching fetched pages and API results
- article dedupe keys
- short-lived workflow state
- rate limiting
- alert cooldown state
- lightweight queue or semaphore behavior where needed

### Why it fits
Fast temporary state should not live in the main relational store.

---

## 5. Trigger.dev

### What it should handle
- scheduled daily brief generation
- competitor scans
- source ingestion jobs
- embedding pipeline jobs
- retry behavior for flaky APIs
- multi-step workflows that outlive a web request

### Why it fits
This app needs a background worker brain, not just frontend polish.

---

## 6. Neo4j — Later Maybe

### What it would be good for
- advanced relationship traversal
- graph analysis across competitors, titles, authors, and promotions
- connected-intelligence queries that become awkward in relational form

### Why not day one
- extra complexity
- extra hosting
- extra modeling work
- not necessary until the relationship graph becomes a bottleneck

### Rule
Do not add Neo4j until the existing architecture clearly hurts without it.

---

## High-Level System Diagram (Conceptual)

$$
\text{User} \rightarrow \text{Vercel App} \rightarrow \text{Supabase / Qdrant / Upstash}
$$

$$
\text{Trigger.dev} \rightarrow \text{Fetch / Parse / Score / Store} \rightarrow \text{Supabase + Qdrant}
$$

In plain language:
- the user talks to the app through Vercel
- the app reads structured data from Supabase
- the app retrieves semantic memory from Qdrant
- the app uses Upstash for fast temporary state
- Trigger.dev keeps the intelligence engine running in the background

---

## Request Flow — Interactive Chat

### Goal
Answer a user question in the app with the right context.

### Flow
1. user opens app on Vercel
2. user asks a question in a workspace
3. app identifies workspace, persona, and requested job
4. app fetches relevant structured context from Supabase
5. app fetches semantic context from Qdrant
6. app optionally pulls cached recent context from Upstash
7. model call is made with assembled context
8. result is returned to UI with citations and linked records
9. if persistent, the interaction is saved to history

### Example
"What changed this week in Shopify that could affect the store?"

The app should:
- retrieve recent Shopify-related sources
- retrieve prior strategy docs about Shopify
- retrieve recent brief items
- return an answer with citations and action suggestions

---

## Request Flow — Research Analysis

### Goal
Turn a source or source set into a reliable research output.

### Flow
1. user pastes a URL or selects sources
2. app checks Upstash for cached fetch/parsing results
3. if missing, fetch and parse content
4. store source metadata in Supabase
5. store embeddings in Qdrant if worth retaining
6. run analysis using selected persona/mode
7. produce verdict, summary, confidence, citations
8. save research report in Supabase
9. optionally route to review queue

---

## Scheduled Flow — Daily Brief Generation

### Goal
Generate the morning intelligence brief automatically.

### Flow
1. Trigger.dev launches scheduled job
2. job fetches from RSS feeds, APIs, competitor pages, and approved source lists
3. extracted content is normalized and deduplicated
4. source records are stored/updated in Supabase
5. important content is embedded into Qdrant
6. signals are scored and linked to known entities
7. opportunities and risks are ranked
8. brief object is assembled and stored
9. alert records are created where necessary
10. ready brief appears in app the next morning

### Why background jobs matter
This flow is too multi-step and failure-prone to cram into a user request.

---

## Scheduled Flow — Competitor/Product Intelligence

### Goal
Track daily movement in competitors, titles, and promotions.

### Flow
1. Trigger.dev runs competitor scan job
2. fetch homepage / collection / promo surfaces
3. ingest or parse email data where available
4. compare against prior stored snapshots
5. detect price changes, featured items, author pushes, bundle offers, and category moves
6. update competitor, book, author, and opportunity records
7. create alert cards or low-confidence watchlist items as needed
8. send material items to review queue

---

## Ingestion Pipeline

Every ingested source should move through these stages:

1. **fetch**
2. **parse**
3. **normalize**
4. **deduplicate**
5. **classify**
6. **score**
7. **store**
8. **embed** (if useful)
9. **link** to entities
10. **surface** if meaningful

### Stage responsibilities
- fetch/parse = Trigger.dev + external services
- dedupe/cache = Upstash
- structure = Supabase
- embeddings = Qdrant
- surfacing = app + review queue + briefs

---

## Storage Strategy

## What belongs in Supabase
- canonical entity records
- workflow state
- review queue
- tasks
- settings
- reports
- briefs
- source metadata
- scores
- decisions

## What belongs in Qdrant
- semantic chunks of docs
- semantic chunks of sources
- semantic chunks of saved reports and summaries

## What belongs in Upstash
- cache entries
- dedupe hashes
- temporary job markers
- rate limit counters
- temporary alert state

## What belongs in file storage
- large raw exports
- archived snapshots
- generated PDFs or reports
- uploaded files

---

## Authentication and Access

### Phase 1
- Supabase Auth
- simple role model: founder/admin/editor/operator

### Phase 2
- finer permissions by workspace, action, or document tier

### Important rule
Even if only Scott and Anna use it first, build access cleanly enough that future internal users do not require a rewrite.

---

## Environment Variables and Secrets

### Basic principle
- user-facing app reads from environment at runtime
- job runner reads its own environment securely
- secrets should not be hardcoded into source

### Current config files
- [.env](.env)
- [.env.example](.env.example)

### Recommendation
Keep production secrets inside hosting-provider secret stores, not only local files.

---

## Model Routing Strategy

The architecture should support multiple model lanes.

### Suggested routing
- fast chat / quick transforms = fast model
- deep reasoning = stronger reasoning model
- writing / synthesis = creative model
- retrieval prep / embeddings = embedding model

### Why this matters
One model should not do every job badly just because it is available.

---

## Failure Handling

### The system should tolerate
- source fetch failures
- rate limits
- duplicate content
- partial pipeline failures
- delayed brief generation

### Recovery principles
- retry where sensible
- log failures clearly
- degrade gracefully in UI
- never pretend a failed job succeeded

### Good example
If a competitor scan partially fails, the brief should note reduced coverage rather than quietly invent completeness.

---

## Observability

Recommended supporting layer:
- `Sentry` for errors
- optional `PostHog` for product usage analytics

### What to track
- failed jobs
- failed fetches
- UI errors
- slow endpoints
- queue backlog
- task conversion rates
- alert volume

This is not vanity. It is how you know whether the machine is actually working.

---

## Deployment Boundaries

### Vercel deploys
- Next.js UI
- lightweight app routes

### Trigger.dev deploys
- job definitions
- background workflow handlers

### Supabase
- managed infrastructure
- migrations
- auth
- storage

### Qdrant / Upstash
- managed hosted services

This separation prevents every part of the system from being coupled to one deployment mechanism.

---

## Cheapest Sane Version

If cost discipline matters early, the sane version is:
- Vercel
- Supabase
- Qdrant Cloud
- Upstash
- Trigger.dev

with conservative ingestion frequency and daily rather than high-frequency scans.

### Cost-control rules
- cache aggressively
- embed only what is useful
- summarize selectively
- run competitor scans once daily first
- avoid heavy always-on workers until needed

---

## Technical Build Sequence

### Phase 1 — Foundation
- Next.js app on Vercel
- Supabase schema and auth
- document ingestion from local core docs
- Qdrant integration for semantic retrieval

### Phase 2 — Intelligence engine
- source ingestion pipeline
- daily brief workflow via Trigger.dev
- Upstash caching and dedupe
- research save flow

### Phase 3 — Product intelligence
- competitor tracking
- book / author / publisher records
- opportunity engine
- review queue integration

### Phase 4 — Content operations
- content studio
- reviewed calendar
- channel-specific approval logic

### Phase 5 — Controlled automation
- scheduling
- channel integrations
- deeper workflow autonomy

---

## Why This Architecture Is the Right Fit

Because the app is not just:
- a website
- a chatbot
- a dashboard

It is all three, plus:
- a memory system
- a research system
- a background intelligence engine
- an execution assistant

Those jobs require different kinds of infrastructure.

The stack is split because the jobs are split.

---

## Final Recommendation

Start with:
- Vercel
- Supabase
- Qdrant
- Upstash
- Trigger.dev

Do not start with Neo4j.

Add Neo4j only if the relationship graph becomes central enough to deserve its own brain.

---

*Last updated: March 6, 2026 — Good architecture should reduce future drama, not merely postpone it.*