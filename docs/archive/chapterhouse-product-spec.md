# Product Spec — Chapterhouse

> *This is the current best read on what the internal AI system should actually be. Not a vague aspiration. Not a hype deck. The working spec.*
>
> *This should stay editable. The point is not to freeze the future. The point is to stop pretending the future builds itself.*

---

## Core Purpose

Build Chapterhouse, a private web app for Scott and Anna, so it functions as:

- a brand brain
- a research analyst
- a marketing strategist
- a product builder
- a daily intelligence desk
- a general chat workspace

This is not a public chatbot.  
This is an internal operating system for Next Chapter Homeschool Outpost and the brands around it.

### Companion implementation specs
This product spec is now supported by:
- [chapterhouse-data-model-spec.md](chapterhouse-data-model-spec.md)
- [chapterhouse-workflow-spec.md](chapterhouse-workflow-spec.md)
- [chapterhouse-ui-spec.md](chapterhouse-ui-spec.md)
- [chapterhouse-technical-architecture-spec.md](chapterhouse-technical-architecture-spec.md)
- [chapterhouse-intelligence-engine-spec.md](chapterhouse-intelligence-engine-spec.md)

That means this document defines **what Chapterhouse is**, while the companion docs define how it will be structured, behave, look, think, and run.

---

## Product Philosophy

The app should feel closer to a **GPT-style home experience** than a cluttered dashboard, but with deeper business memory and stronger source discipline.

### Home experience
- central chat input first
- supporting dashboard cards and quick actions around it
- left navigation for workspaces and personas
- right-side source / citations / active context panel

This should feel like Chapterhouse, not a form builder.

---

## Primary Users

### Phase 1
- Scott
- Anna

### Future
- possible small internal team

The system should be designed with multi-user structure in mind, but not bloated for outside users yet.

---

## Authority Model

### Phase 1
- advisory
- draft-and-prepare
- staging-doc writes only

### Phase 2
- semi-autonomous on approved jobs
- scheduling and routine operations after trust is earned

### Phase 3
- broader autonomy by channel, workflow, and source trust

The system should **not** auto-publish, auto-send, or rewrite core brand docs at the beginning.

---

## Core Workspaces

### 1. Brand HQ
Used for:
- voice
- positioning
- founder truth
- strategic consistency

### 2. Research Desk
Used for:
- fact-vs-fluff analysis
- source comparison
- synthesis of outside material

### 3. Marketing Studio
Used for:
- campaign planning
- email
- blog/SEO
- social media planning

### 4. Product Lab
Used for:
- book tracking
- bundle ideas
- product opportunities
- curriculum guide concepts

### 5. Daily Briefing
Used for:
- daily intelligence
- alerts
- watchlists
- risks and opportunities

### 6. Ops Console
Used for:
- queues
- jobs
- review flow
- staging documents
- decision logs

---

## Persona System

The app should use **multiple specialist personas**, not one flat assistant.

### Initial specialist set
- Brand Whisperer
- Research Analyst
- Marketing Strategist
- Product Architect
- Managing Editor
- Ops Chief

The voice layer should be **editable and swappable** over time. The Brand Whisperer remains important, but should not be hardcoded as the only intelligence voice forever.

---

## Permanent Core Memory

These truths must always stay loaded:

- Scott biography and founder story
- Anna identity, including the Anna / Alana distinction
- Scott's desire to build personalized curriculum
- faith posture: homeschool store carrying faith-based resources, not a faith-store-first identity
- kid-first curation and literary quality
- AI operating principles

### Permanent source docs
- [biography.md](../strategy/biography.md)
- [persona.md](../strategy/persona.md)
- [brand-personality-handoff.md](../strategy/brand-personality-handoff.md)
- [shopify-strategy.md](../strategy/shopify-strategy.md)
- [operating-system.md](../strategy/operating-system.md)
- [ai-operating-principles.md](../strategy/ai-operating-principles.md)
- [external-intelligence-log.md](../strategy/external-intelligence-log.md)

---

## Document Governance Model

### Tier 1 — Sacred Core
- biography
- persona
- voice / principles docs

These should not auto-update in phase 1.

### Tier 2 — Operational Core
- README
- operating system
- strategy docs
- intelligence log

These may eventually receive controlled updates.

### Tier 3 — Working / Staging
- briefs
- memos
- candidate patches
- opportunity cards
- research summaries

This tier gets auto-write first.

### Required review gates before permanence
- source citation
- evidence grade
- conflict check
- human approval
- confidence score
- duplicate check

---

## Source Hierarchy

### Highest-priority source classes
- official sites and platform docs
- official emails and owned promotions
- editorial recognition and institutional lists
- organic signal from real communities and users

### Lower-priority source classes
- generic social buzz
- paid ads

The app should not treat paid ads as primary truth.

---

## Domains to Watch in the First 60 Days

- Shopify / ecommerce
- email / newsletter systems
- AI tools and workflow platforms
- SEO / content
- homeschool market
- children's books / publishing

---

## Morning Brief Structure

Default shape should be:

### 1. Urgent changes
What materially changed since the last brief.

### 2. Sections by domain
- Shopify / ecommerce
- newsletters / email
- AI / tools
- SEO / content
- education / homeschool
- books / publishing

### 3. Opportunities
The most actionable things worth acting on.

### 4. Risks
Policy shifts, source conflicts, brand concerns, or platform danger.

### 5. Today's actions
Practical next moves, not vague observations.

Keep it skimmable first, expandable second.

---

## Alert Philosophy

Alerts should fire for:
- platform changes
- major market stories
- content opportunities
- brand risks
- significant competitor moves
- important book / author / category signals

Default posture:
- broad watchlist
- ranked outputs
- short alert cards first
- escalation through repetition and cross-signal confirmation

---

## Publishing Channels

Initial target channels:
- Instagram
- Facebook
- Pinterest
- X
- LinkedIn
- YouTube

### Approval model
The system should start with **approval before publish**, but support channel-specific evolution.

Default gut-based rule set:
- Pinterest = easier to batch approve
- X = easier to batch approve
- Facebook = batch-friendly
- Instagram = more manual
- LinkedIn = more manual
- YouTube = manual longest

This should remain editable in settings.

### Long-term goal
Earned autonomy:
- approve by channel
- approve then calendar
- eventually allow trusted autopilot on selected lanes

---

## Intelligence Graph

The app should eventually track first-class entities for:

- competitors
- books / titles
- authors
- publishers
- topics
- campaigns
- promotions
- watch events

It should understand relationships between them.

Examples:
- a competitor pushes a title
- a title belongs to an author
- an author belongs to a publisher ecosystem
- a title gets a promo signal from BookBub
- a category gets seasonal emphasis
- a book could support a curriculum guide or bundle

---

## Competitor and Source Watch Model

### Tracking levels
The app should track:
- stores
- books / titles
- authors
- publishers
- categories
- promotions

### Daily signals to detect
- price changes
- featured books
- author pushes
- bundle offers
- email promos
- stock / catalog changes

### Seed daily-watch set (Tier 1 by default for now)
- Sonlight
- BookShark
- Rainbow Resource
- Christianbook
- The Good and the Beautiful
- BookBub

### Seed expansion set (Tier 2 by default for now)
- Scholastic
- PRH Children
- HarperCollins
- Candlewick
- School Library Journal
- Publishers Weekly

This tiering should remain editable in the app.

---

## Catalog Philosophy

The system should treat **everything ingestible** as potential opportunity space, not only the currently planned catalog.

That means the app needs strong ranking, not just broad collection.

---

## Opportunity Engine

### Opportunity flags should trigger on:
- repeated competitor push
- cross-platform signal
- discount movement
- gap in our catalog
- bundle pattern
- seasonal timing

### Weak but promising signals
If evidence is weak but the pattern is interesting:
- place it in a **low-confidence watchlist**
- escalate it if repeated later

### Suppress or down-rank if:
- bad fit for audience
- weak source evidence
- hype with no proof

---

## Scoring Model

The system should use **three formal scores**, not one vague number:

### 1. Store Score
How strong is this for the storefront?

Likely factors:
- price drop or promotion signal
- competitor activity
- bundle potential
- audience fit
- allotment fit
- conversion potential

### 2. Curriculum Score
How strong is this for personalized curriculum and learning products?

Likely factors:
- teaching depth
- discussion potential
- interdisciplinary use
- guide potential
- differentiation potential
- grade usefulness
- Scott override weight

### 3. Content Score
How strong is this for marketing, email, blog, social, and story angles?

Likely factors:
- seasonal relevance
- hook strength
- parent pain-point relevance
- trend energy
- author/topic recognizability
- newsletter usefulness

### Score thresholds
- **85+** = immediate attention
- **70–84** = strong watch
- **50–69** = maybe
- **below 50** = low priority

---

## Ranking Inputs

### High-value positive signals
- price drop
- repeated mentions
- multiple competitors pushing the same thing
- BookBub-type signal
- homeschool fit
- age/grade fit
- strong literary quality
- Anna editorial fit
- Scott curriculum fit
- high-margin add-on potential
- seasonal relevance
- Alaska / allotment reality

### BookBub-type signal includes
- email promo mention
- bestseller movement
- repeated store featuring
- publisher spotlight
- social buzz
- review velocity
- award lists
- reading list inclusion

---

## Literary Quality Model

The system should consider all of these as signals of literary quality:
- awards and notable lists
- strong review sentiment
- longevity / backlist staying power
- trusted publisher / imprint
- educational usefulness
- librarian and teacher recommendations
- Anna manual override

Anna's literary/editorial judgment should carry **very high weight**.

Scott's curriculum instinct should also carry **high weight**.

---

## Manual Override System

The app should support:
- force up-rank
- force down-rank
- pin to watch
- ignore / snooze
- channel note
- reason log

Use neutral but meaningful labels in the interface.

Recommended structure:
- Founder priority
- Editorial priority
- Curriculum priority
- Ignore / snooze

That keeps it flexible while still reflecting who is driving the call.

---

## Book-Level Memory

Each tracked book should eventually support fields for:
- title
- author
- publisher
- age / grade
- subjects
- faith / secular fit
- curriculum potential notes
- literary quality notes
- competitor sightings
- promotion history
- BookBub / promo history
- bundle ideas
- content angles
- status: watch / source / sell / guide / ignore

---

## Author-Level Memory

Each tracked author should eventually support fields for:
- frequency of promotion
- fit with brand values
- literary reputation
- homeschool relevance
- breadth of catalog
- bundle / series potential
- curriculum depth
- audience familiarity

---

## Product Opportunity Workflow

Default chain:

1. create a short alert card
2. create a memo
3. create a staging document for approval
4. optionally generate:
   - product concept
   - curriculum angle
   - content angle
   - bundle idea

The system should be able to separate whether something is great for:
- store
- curriculum
- content / marketing

Because those are not always the same thing.

---

## Default State Models

These defaults should be implemented early, but remain editable over time.

### Opportunity states
- detected
- staged
- approved
- converted
- rejected
- snoozed
- archived

### Task states
- open
- in progress
- blocked
- done
- canceled

### Source states
- ingested
- summarized
- scored
- linked
- archived

### Book statuses
- watch
- source
- sell
- guide
- featured
- seasonal
- bundle candidate
- high priority
- ignore

---

## Approved Opportunity Conversion Rules

When an opportunity is approved, the system should be able to convert it into one or more of the following:

- task
- product concept doc
- content angle doc
- curriculum idea doc
- bundle draft
- email idea
- social set

The conversion path should depend on whether the opportunity is strongest for:
- storefront value
- curriculum value
- content / marketing value

---

## Research Save Behavior

Default behavior:
- save research analyses automatically to research history
- preserve the summary, verdict, sources, and citations as the important object
- do not assume every raw chat exchange matters equally

This creates useful memory without turning every conversation into clutter.

---

## Chat Memory Behavior

The system should support **both**:

### Persistent chat
- stored by workspace
- useful for ongoing projects and evolving context

### Ephemeral chat
- temporary, disposable, low-stakes exploration
- does not automatically become part of permanent memory

This matters because not every good conversation deserves to become infrastructure.

---

## Home Screen Modules — Default V1

Around the main chat box, the home screen should surface:

- quick actions
- recent work
- active alerts
- saved personas
- pinned docs
- today's tasks

---

## Product Intelligence Screen — Default V1

The Product Intelligence screen should emphasize:

- ranked opportunity feed first
- competitor and title drill-down second
- author / publisher context as supporting detail

This screen exists to show what matters most, not merely what exists.

---

## Research View — Default V1 Jobs

The research interface should support all three of these:

1. paste-and-analyze
2. multi-source comparison
3. source-backed report generation

That breadth is justified because this app is intended to function as a real internal analyst, not a single-purpose summarizer.

---

## Built-In Task Layer

Approved work should land in a simple internal task system first.

The goal is not full project management theater.  
The goal is to keep useful outputs actionable inside Chapterhouse itself.

---

## Unknowns the System Must Help Surface

The tool is specifically expected to help reveal:
- what to sell
- where to market
- what to say
- what to build
- what to ignore
- what could hurt the brand

That is not a side feature. That is a central reason this exists.

---

## Product Success in the First 30 Days

The tool is worth having if it:
- saves research time
- improves strategy quality
- keeps documents coherent
- improves marketing output
- surfaces hidden opportunities
- becomes part of the daily habit

---

## Current Default Decisions That Must Stay Changeable

Not everything should be frozen in stone. These should all remain editable:
- competitor tiers
- score thresholds
- source weights
- channel approval rules
- watchlists
- alert sensitivity
- override types
- morning brief composition

The tool needs structure, but it also needs knobs.

---

*Last updated: March 6, 2026 — This is the current working spec. It should evolve as the system earns trust.*