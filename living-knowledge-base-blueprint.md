# Living Knowledge Base Blueprint — Chapterhouse

> *You do not need a chatbot that merely feels impressive. You need a private intelligence system that remembers your business, absorbs new information, sorts truth from marketing perfume, and helps you make better decisions faster than the people still copy-pasting into random tabs.*
>
> *That's the actual assignment.*

---

## The Goal

Build Chapterhouse for Scott and Anna so it does three things at once:

1. **Acts like a high-quality internal AI workspace** for writing, strategy, product ideation, and decision support
2. **Uses the brand guide documents as core memory** and retrieves them intelligently
3. **Ingests fresh outside information daily** from reputable sources to create a living knowledge base

This should not be a generic chatbot.

It should be **Chapterhouse** — the operating brain behind Next Chapter.

---

## What "Rival Commercial GPT" Actually Means

To rival a polished commercial AI product, your system needs more than a model API.

It needs five layers:

### 1. Multi-model routing
Different models for different jobs:
- fast drafting
- deeper reasoning
- long-context synthesis
- embeddings / retrieval

### 2. Retrieval over your real documents
Your existing documents are not background flavor. They are core operating memory.

### 3. Fresh web and news ingestion
The system should know what changed this week in AI, Shopify, email, creator business, education, and ecommerce.

### 4. Structured memory
Not just raw files — tagged, deduplicated, summarized, and organized into usable knowledge.

### 5. Opinionated workflows
Prompts and tools designed for your actual business: brand decisions, product ideas, campaign planning, research analysis, and storefront growth.

---

## The Three Memory Layers

### Layer 1 — Core Memory
This is the permanent spine.

Sources:
- [persona.md](persona.md)
- [biography.md](biography.md)
- [brand-personality-handoff.md](brand-personality-handoff.md)
- [shopify-strategy.md](shopify-strategy.md)
- [operating-system.md](operating-system.md)
- [ai-operating-principles.md](ai-operating-principles.md)
- [external-intelligence-log.md](external-intelligence-log.md)

Use:
- brand voice
- founder context
- strategic boundaries
- product logic
- decision support

### Layer 2 — Working Memory
This is active project material.

Sources:
- notes
- launch plans
- campaign drafts
- meeting summaries
- SKU planning
- product concepts
- experiments

Use:
- current execution
- in-progress work
- weekly decision support

### Layer 3 — Fresh Intelligence
This is daily or scheduled ingestion.

Sources:
- RSS feeds
- news APIs
- platform blogs
- official changelogs
- curated operator content

Use:
- trend awareness
- platform changes
- tactic discovery
- market monitoring

---

## What the Daily Ingestion System Should Do

Every day, the system should:

### 1. Fetch
Pull new content from approved sources:
- Reuters / AP / NPR for general sanity
- Shopify blog and ecosystem sources for commerce
- HubSpot / Ahrefs / Buffer / Kit / Beehiiv / Substack for marketing and newsletter patterns
- OpenAI / Anthropic / Google AI blogs for model and tool changes
- education sources like EdSurge and The Hechinger Report for relevant sector movement

### 2. Normalize
Extract:
- title
- source
- publication date
- URL
- topic
- full text or excerpt

### 3. Deduplicate
If twelve outlets repeat the same Shopify feature release, keep one main source and note the pattern.

### 4. Score
Classify each item:
- fact
- pattern
- opinion
- hype

### 5. Summarize
Create a useful internal summary:
- what happened
- why it matters
- whether it matters to Next Chapter

### 6. Tag
Tag by topics like:
- shopify
- homeschool
- creator economy
- email marketing
- AI tools
- children's books
- digital products
- SEO

### 7. Store
Save both raw and processed versions in the knowledge base.

### 8. Digest
Create:
- a **daily brief**
- a **weekly strategy digest**
- optional alerts when something materially affects the business

---

## The Best First Version

Do not build ten thousand features first.

Build Version 1 around these jobs:

### A. Ask questions across your documents
Examples:
- "What does our brand posture say about faith-based labeling?"
- "What have we already decided about digital curriculum guides?"
- "Summarize our current priorities across all docs."

### B. Compare outside advice against your system
Examples:
- "Read this HubSpot article and separate fact from fluff."
- "Does this Substack growth advice fit our brand or not?"

### C. Produce operational outputs
Examples:
- campaign outlines
- email drafts
- launch plans
- product pages
- research syntheses
- strategic memos

### D. Generate recurring briefs
Examples:
- daily news brief
- weekly marketing brief
- weekly Shopify/watchlist brief
- monthly opportunities memo

---

## Recommended Architecture

The blueprint started broad. The current first-pass stack is now more specific.

### Chosen default stack
- Vercel
- Supabase
- Qdrant
- Upstash
- Trigger.dev

### Why this matters
The app has now moved from a private-workspace idea into an actual documented Chapterhouse architecture. For implementation details, see:
- [technical-architecture-spec.md](technical-architecture-spec.md)
- [data-model-spec.md](data-model-spec.md)
- [workflow-spec.md](workflow-spec.md)
- [ui-spec.md](ui-spec.md)
- [intelligence-engine-spec.md](intelligence-engine-spec.md)

### Frontend
- Next.js
- clean chat interface
- saved workspaces
- source citations panel
- daily digest dashboard

### Backend
- Next.js API routes or FastAPI service
- job scheduler for ingestion
- model router for provider selection
- retrieval pipeline

### Storage
- Postgres / Supabase for structured data
- Qdrant or Pinecone for vector search
- S3-compatible storage for raw document archives

### AI stack
- OpenAI for strong general reasoning and embeddings
- Anthropic for long-form synthesis and writing
- Google as optional alternate model lane
- Tavily / Firecrawl / Perplexity for web retrieval depending on cost and results

---

## Current Chapterhouse Scope

Chapterhouse is now explicitly defined as:
- a brand brain
- a research analyst
- a marketing strategist
- a product builder
- a daily intelligence desk
- a general chat workspace

And not merely a generic chatbot with uploaded files.

---

## The Core Workflows to Build

### 1. Brand Brain
Retrieves from core docs only.

Purpose:
- brand decisions
- copy alignment
- founder truth checking

### 2. Research Analyst
Retrieves from core docs + fresh intelligence.

Purpose:
- fact vs fluff analysis
- source comparison
- competitor or platform synthesis

### 3. Marketing Strategist
Uses core docs + audience + fresh intelligence.

Purpose:
- campaign planning
- channel strategy
- content repurposing
- offer positioning

### 4. Product Builder
Uses product docs + strategy docs + store constraints.

Purpose:
- product concepts
- bundle ideas
- curriculum guide planning
- SKU prioritization

### 5. Daily Brief Generator
Summarizes what changed and why it matters.

---

## Source Quality Rules

Fresh information is only useful if the source quality is high.

### Tier 1 — Preferred
- official platform docs
- official product blogs / changelogs
- Reuters
- AP
- NPR
- high-quality industry publications
- named operators with detailed examples

### Tier 2 — Useful but verify
- SaaS marketing blogs
- newsletters from experienced operators
- podcast transcripts
- creator essays

### Tier 3 — Handle with tongs
- viral threads
- guru posts
- anonymous hot takes
- generic "10 hacks" content

---

## The Daily Output Format

### Daily Brief
- Top 5 items worth knowing
- One-paragraph summary of each
- Why it matters to Next Chapter
- Action bucket: watch / consider / act now

### Weekly Strategy Digest
- major platform changes
- repeated patterns across sources
- opportunities for content, product, audience, or store optimization
- threats or shifts to watch

### Monthly Knowledge Review
- what themes kept recurring
- what we adopted
- what we ignored
- what needs to enter the permanent operating docs

---

## What Makes This Better Than a Generic Chatbot

Because it will:
- know your story
- know your voice
- know your existing decisions
- know your current priorities
- know what changed outside your walls
- show sources
- separate evidence from sales copy

That is the difference between a chatbot and an actual operating system.

---

## The First Build Sequence

### Phase 1 — Foundation
- set up model keys
- set up document ingestion
- create vector index for current docs
- create chat UI with citations

### Phase 2 — Daily Intelligence
- connect RSS / news APIs
- build fetch-normalize-deduplicate-summarize pipeline
- generate daily brief

### Phase 3 — Opinionated Workflows
- Brand Brain
- Research Analyst
- Marketing Strategist
- Product Builder

### Phase 4 — Automation
- email digests
- alerts
- saved research collections
- internal dashboards

---

## Non-Negotiable Rule

**The system must cite its sources and distinguish between facts, inferences, recommendations, and speculation.**

Otherwise you are just building a very fast hallucination machine with a nice haircut.

---

*Last updated: March 6, 2026 — Build the brain, not just the chat box.*