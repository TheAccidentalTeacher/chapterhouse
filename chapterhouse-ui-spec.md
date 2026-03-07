# UI Spec — Chapterhouse

> *If the workflows are the engine rooms, the UI is the bridge. It is where the work either feels obvious and alive, or turns into six tabs, three regrets, and a side quest.*

---

## Purpose

This document defines the first detailed UI specification for Chapterhouse.

It covers:
- visual posture
- navigation
- screen layouts
- modules
- actions
- filters
- empty states
- interface behavior

The goal is not pixel-perfect fidelity yet. The goal is a buildable and coherent product shell.

---

## UI Principles

### 1. Chat first, but not chat only
The app should feel GPT-native at the center, but unlike a generic chatbot it must constantly expose memory, sources, opportunities, and action paths.

### 2. Signal over clutter
Even with a lot of intelligence flowing through the system, the default interface should surface what matters first.

### 3. Expand on demand
The interface should feel tight at first glance, then open into depth when the user drills down.

### 4. Everything should lead somewhere
Every card, alert, and record should have a next action: inspect, compare, approve, convert, schedule, or archive.

### 5. The system should feel premium, not sterile
This is Chapterhouse, not enterprise software cosplay.

---

## Visual Posture

### Theme support
- dark theme
- light theme

### Default posture
The UI should feel:
- modern
- premium
- calm
- intelligent
- slightly editorial rather than hyper-corporate

The dark mode can take cues from GPT-style focus. The light mode should feel cleaner and more document-centered.

---

## Information Density

The interface should use **adaptive density**.

### Low / medium density screens
- Home
- chat
- content drafting
- daily brief reading mode

### Higher density screens
- Product Intelligence
- Research comparison
- Review Queue
- task and entity detail views

---

## Primary Navigation

### Navigation model
- persistent **left sidebar**

### Sidebar sections
- Home
- Daily Brief
- Research
- Product Intelligence
- Content Studio
- Review Queue
- Tasks
- Documents
- Settings

### Sidebar utility area
- saved personas
- recent chats
- pinned docs
- quick create actions

### Footer area
- current user
- theme toggle
- workspace status / last sync indicator

---

## Cross-App Global UI Elements

### 1. Global command bar
Accessible from anywhere for:
- search across books, sources, authors, opportunities, docs, and tasks
- jump to screens
- run quick actions
- switch personas

### 2. Right-side context rail
Context-aware side panel used for:
- citations
- linked entities
- source cards
- active memory/docs
- notes
- review actions

### 3. Global quick actions
Accessible from home and command bar:
- New chat
- Run Daily Brief now
- Research this
- Create product concept
- Draft campaign
- Add watch item

---

## Screen 1 — Home

### Purpose
Primary entry point. Should feel like the place the day begins.

### Layout
- center: large main chat area and prompt box
- left: main navigation
- right: dynamic context rail

### Core modules around the chat
- Quick Actions
- Recent Work
- Active Alerts
- Saved Personas
- Pinned Docs
- Today's Tasks

### Main chat behavior
- central prompt box
- optional workspace selector
- optional persona selector
- attach URL / source / doc action
- persistent or ephemeral chat toggle

### Home quick action cards
- Daily Brief
- Research This
- Product Idea
- Campaign Draft
- Review Queue
- Watch Market

### Empty state
Should feel useful, not blank.

Default prompts might include:
- “What changed today that matters for Next Chapter?”
- “Compare this article against our brand principles.”
- “What product opportunities are rising this week?”
- “Draft an email campaign around this trend.”

---

## Screen 2 — Daily Brief

### Purpose
Read the morning intelligence output and act on it.

### Layout
- top: date selector + regenerate controls
- main column: brief sections
- right rail: linked sources, opportunities, alerts, and tasks

### Main sections
1. Urgent Changes
2. Shopify / Ecommerce
3. Newsletters / Email
4. AI / Tools
5. SEO / Content
6. Education / Homeschool
7. Books / Publishing
8. Opportunities
9. Risks
10. Today's Actions

### Section card behavior
Each item should show:
- title
- 1-sentence summary
- why it matters
- score or severity tag
- source count
- action buttons

### Primary actions per item
- open source
- compare sources
- create memo
- send to review queue
- convert to task
- snooze

### Filters
- domain
- severity
- source class
- only opportunities
- only risks

### Empty state
If nothing major happened, say so cleanly.
Do not invent drama to justify the screen.

---

## Screen 3 — Research

### Purpose
The analyst workspace.

### Primary modes
1. Paste and analyze
2. Multi-source compare
3. Report builder

### Layout
- top: mode switcher
- left/main: source input or comparison workspace
- right: citations, extracted claims, linked docs

### Mode A — Paste and analyze
Input:
- URL
- pasted text
- uploaded doc

Output:
- source summary
- fact / pattern / opinion / hype breakdown
- verdict
- confidence score
- relevant links to brand docs

### Mode B — Multi-source compare
Input:
- several selected or pasted sources

Output:
- agreement points
- conflict points
- strongest evidence
- missing information
- recommended interpretation

### Mode C — Report builder
Input:
- topic
- source set
- audience

Output:
- saved report with citations

### Core actions
- save report
- send to review queue
- link to opportunity
- convert to task
- add to staging doc

### Filters / search
- source type
- evidence grade
- topic
- date
- trusted only

### Empty state
Offer three clear starting actions:
- analyze one source
- compare multiple sources
- build report

---

## Screen 4 — Product Intelligence

### Purpose
This is where the market turns into product thinking.

### Default posture
**Opportunity feed first**.

### Layout
- top: score filters, date range, entity toggles
- center: ranked opportunity feed
- left subnav: opportunities / competitors / books / authors / publishers
- right rail: linked signals and related records

### Default feed item structure
Each opportunity card should show:
- title
- opportunity type
- short case summary
- store score
- curriculum score
- content score
- evidence grade
- trigger badges
- linked competitors/books/authors

### Primary actions
- approve
- reject
- snooze
- open memo
- create product concept
- create curriculum angle
- create content angle
- convert to task

### Feed filters
- score thresholds
- opportunity type
- competitor
- author
- book
- seasonal
- confidence level
- low-confidence watchlist toggle

### Tab / drill-down views

#### Competitors view
Show:
- tracked competitors
- recent activity
- latest promos
- price change count
- featured title count
- recent authors pushed

#### Books view
Show:
- title
- author
- publisher
- status
- 3 scores
- recent competitor sightings
- bundle / guide potential summary

#### Authors view
Show:
- author
- catalog breadth
- literary notes
- homeschool relevance
- promotion frequency

#### Publishers view
Show:
- publisher
- type
- literary signal notes
- faith posture fit
- recent notable movement

### Empty state
If there are no current opportunities, show:
- recent tracked movement
- low-confidence watchlist
- “run scan now” action

---

## Screen 5 — Content Studio

### Purpose
Turn opportunities and ideas into approved content.

### Layout
- top: channel selector + content type selector
- left: idea/input panel
- center: draft workspace
- right: source/context panel + approval state

### Supported content types in v1
- email
- product page copy
- social post sets
- blog outline / draft
- campaign pack

### Inputs
- free prompt
- selected opportunity
- selected product/book
- selected research report
- selected brief item

### Output modules
- main draft
- alternate hooks
- CTA options
- channel adaptations
- notes on why this fits the brand

### Calendar behavior
Approved content should move into a **reviewed calendar**, not straight to auto-posting.

### Filters
- channel
- campaign
- stage
- awaiting review
- approved

### Primary actions
- save draft
- approve for calendar
- request rewrite
- split by channel
- add source notes
- convert to task

### Empty state
Offer entry points like:
- “Create a week of Pinterest content from today’s opportunities”
- “Draft a product launch email”
- “Turn this book opportunity into three social angles”

---

## Screen 6 — Review Queue

### Purpose
The approval gate between signal and commitment.

### Layout
- top: queue stats and filters
- center: queue list
- right: selected item detail and actions

### Queue item types
- opportunity
- memo
- report
- document update
- brief escalation
- content draft

### Queue card fields
- title
- type
- summary
- priority
- linked objects
- source/evidence tags
- created time

### Core actions
- approve
- reject
- snooze
- override score
- add note
- convert to task

### Filters
- type
- priority
- workspace
- assigned reviewer
- due soon
- only source-backed

### Empty state
Should feel satisfying, not dead:
- “Queue clear”
- show recently approved actions
- suggest next useful workspace

---

## Screen 7 — Tasks

### Purpose
Keep execution inside Chapterhouse.

### Layout
- top: task filters + create task
- center: grouped task list or board
- right: linked source/opportunity/doc context

### Views
- list view
- board by state
- due-soon view

### Fields shown in list
- title
- state
- priority
- due date
- owner
- linked object badge(s)

### Core actions
- change state
- open linked object
- add note
- mark blocked
- mark done

### Empty state
- suggest actions from review queue or brief

---

## Screen 8 — Documents

### Purpose
Browse the living document system.

### Views
- by tier
- by workspace
- by recency
- by approval status

### Core actions
- open
- compare versions
- propose update
- pin to context

---

## Screen 9 — Settings

### Purpose
Expose the knobs that should stay changeable.

### Settings groups
- score thresholds
- source weights
- competitor tiers
- alert sensitivity
- channel approval rules
- brief composition
- persona management
- memory behavior

---

## Entity Detail Drawers / Pages

The following objects should open into a detail view or drawer:
- source
- book
- author
- publisher
- competitor
- opportunity
- task
- report

### Standard detail layout
- top summary
- key metrics / scores
- linked records
- notes / history
- action buttons

---

## Global Search Behavior

Global search should return mixed result types:
- docs
- sources
- books
- authors
- competitors
- opportunities
- tasks

Results should show:
- object type
- title/name
- short summary
- why matched

---

## Empty State Philosophy

An empty state should always do one of three things:
- reassure
- direct
- invite action

It should never just be blank white space with a sad sentence.

---

## Mobile / Narrow Layout Assumption

V1 should primarily optimize for desktop.  
Tablet should be usable.  
Phone can be secondary for now.

---

## UI Build Priorities

### First build order
1. Home
2. Daily Brief
3. Research
4. Product Intelligence
5. Review Queue
6. Tasks
7. Content Studio
8. Documents
9. Settings

This order mirrors actual value delivery.

---

*Last updated: March 6, 2026 — The UI should make the intelligence feel inevitable.*