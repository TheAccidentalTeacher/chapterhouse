# Workflow Spec — Chapterhouse

> *Chapterhouse lives or dies by its loops. If the loops are clean, the tool becomes habit. If the loops are muddy, the whole thing becomes a very expensive place to admire your own unfinished thoughts.*

---

## Purpose

This document defines the core operating workflows for Chapterhouse.

These workflows are the engine rooms of the system. They determine:
- what gets ingested
- what gets surfaced
- what gets reviewed
- what becomes action
- what becomes memory

This is the layer that turns the product spec and data model into behavior.

---

## Workflow Design Principles

### 1. Tight before comprehensive
The first version should prefer clean, repeatable loops over sprawling automation.

### 2. Human judgment at meaningful seams
The system should automate collection, scoring, summarization, and staging faster than humans can — but final strategic commitment should still cross a review point.

### 3. Escalate only what matters
The goal is not to surface everything. The goal is to surface what deserves attention.

### 4. Every loop should end somewhere useful
Brief, queue, task, staging doc, calendar, memo, or archive. No loose ends drifting through the app like ghost notifications.

---

## Core Workflow Set

The first version should support six core loops:

1. Daily Brief Loop
2. Research Loop
3. Product Opportunity Loop
4. Content Loop
5. Document Update Loop
6. Task Loop

All six matter in v1.

---

## 1. Daily Brief Loop

### Goal
Create a tight, useful morning intelligence brief that tells Scott and Anna:
- what changed
- what matters
- what is worth acting on

### Default cadence
- **once daily** in the morning

### Inputs
- trusted sources
- tracked competitors
- tracked books/authors/publishers
- platform watchlist
- unresolved high-priority alerts
- staged opportunities

### Steps
1. ingest new material from approved sources
2. normalize and deduplicate
3. score and classify sources
4. detect meaningful signals
5. group items by domain
6. rank top opportunities and top risks
7. assemble the brief
8. store the brief as structured + narrative output

### Default morning brief shape
1. urgent changes
2. domain sections
   - Shopify / ecommerce
   - newsletters / email
   - AI / tools
   - SEO / content
   - education / homeschool
   - books / publishing
3. opportunities
4. risks
5. today's actions

### Output rules
- should feel **tight**, not bloated
- top items only in default view
- expandable for detail

### Human touchpoint
- humans review and act on surfaced items
- important items can move into review queue or task system

---

## 2. Research Loop

### Goal
Turn outside information into useful judgment.

### Main jobs
The research interface should support:
1. paste-and-analyze
2. multi-source comparison
3. source-backed report generation

### Inputs
- pasted URLs or text
- saved sources
- source collections
- tracked topics
- known brand docs for comparison

### Steps
1. ingest article/page/transcript/report
2. extract and clean text
3. identify source class and evidence grade
4. separate fact, pattern, opinion, and hype
5. compare against core brand/strategy context when relevant
6. produce verdict and recommended interpretation
7. save to research history

### Outputs
- quick verdict
- side-by-side source compare
- source-backed memo/report
- linked opportunity when relevant

### Save behavior
- save research analyses automatically
- preserve summary, verdict, sources, citations, and confidence
- do not over-elevate raw chat transcript noise

### Human touchpoint
- user decides whether research becomes staging doc, report, task, or decision input

---

## 3. Product Opportunity Loop

### Goal
Transform market signals into concrete product intelligence.

### Key signals monitored
- price changes
- featured books
- author pushes
- bundle offers
- email promos
- stock/catalog changes

### Entity scope
- competitors
- books
- authors
- publishers
- categories
- promotions

### Steps
1. ingest competitor/site/email signals
2. attach signals to known entities or create new candidates
3. score store, curriculum, and content value
4. identify trigger conditions
5. create alert card
6. send into review queue
7. on approval, generate downstream actions

### Trigger conditions
- repeated competitor push
- cross-platform signal
- discount movement
- gap in our catalog
- bundle pattern
- seasonal timing

### Weak-signal behavior
- low-evidence items go to low-confidence watchlist
- repeat sightings can escalate them later

### Output chain
1. short alert card
2. memo
3. staging document
4. optional generated outputs:
   - product concept
   - curriculum angle
   - content angle
   - bundle idea

### Human touchpoint
- review queue approval determines what becomes action

---

## 4. Content Loop

### Goal
Turn approved ideas and priorities into reviewed calendar-ready content.

### Supported channels in the early system
- Instagram
- Facebook
- Pinterest
- X
- LinkedIn
- YouTube

### Default endpoint in v1
- **reviewed calendar**

This means the first acceptable finish line is not raw draft chaos and not full autopilot publishing. It is approved content ready to schedule.

### Steps
1. idea enters from brief, opportunity, task, or direct prompt
2. content strategy mode selects channel/use case
3. system drafts content asset(s)
4. user reviews and edits
5. approved items move into reviewed calendar
6. later versions may schedule and publish per channel rules

### Channel approval philosophy
Default early posture:
- Pinterest = easiest to batch
- X = easier to batch
- Facebook = batch-friendly
- Instagram = more manual
- LinkedIn = more manual
- YouTube = manual longest

These should remain configurable.

### Human touchpoint
- approval before publish remains required in early versions

---

## 5. Document Update Loop

### Goal
Let the system learn without letting it quietly rewrite the soul of the business.

### Default destination
- staging docs first

### Steps
1. insight emerges from research, brief, opportunity, or decision pattern
2. system determines whether the insight deserves documentation
3. generate candidate doc update or staging note
4. attach sources, evidence grade, confidence, and change rationale
5. send to review queue if material
6. human approves, edits, or rejects
7. if approved, merge into the correct document tier

### Governance
- sacred core does not auto-update in v1
- working/staging tier gets auto-write first
- operational docs may later accept controlled updates

### Human touchpoint
- human approval is required before meaningful permanent changes

---

## 6. Task Loop

### Goal
Convert approved intelligence into execution.

### Trigger sources
- approved opportunities
- approved research memos
- reviewed briefs
- manual founder requests
- document-update decisions

### Steps
1. review item is approved
2. system creates or proposes task
3. task links back to source/opportunity/doc/report
4. task enters built-in task list
5. humans work task through state progression
6. completion notes feed back into system memory when useful

### Task states
- open
- in progress
- blocked
- done
- canceled

### Human touchpoint
- task execution stays human-owned unless a future approved automation lane is explicitly enabled

---

## Review Queue Workflow

The review queue is the central gate between signal and commitment.

### What enters the queue
- opportunity cards
- important research reports
- candidate doc updates
- content drafts worth approving
- brief items converted into action proposals

### Actions available
- approve
- reject
- snooze
- override score
- add note
- convert to task

### Design rule
The queue should feel like triage, not punishment.

---

## Alert Workflow

### Purpose
Surface meaningful interruptions without training users to ignore the app.

### Alert-worthy categories
- platform changes
- major market stories
- content opportunities
- brand risks
- significant competitor moves
- important book / author / category signals

### Default handling
- create alert
- link to source/object
- if material, route to review queue
- otherwise include in next brief

---

## Persistence Rules Across Workflows

### Should persist automatically
- briefs
- research analyses
- approved tasks
- review outcomes
- overrides
- scored opportunities

### Should persist selectively
- chat sessions
- only when persistent mode is used or the user saves them

### Should stay ephemeral by default when appropriate
- experimental chats
- dead-end exploratory prompts
- low-value drafts

---

## Escalation Model

The system should escalate based on:
- repetition
- source quality
- cross-signal confirmation
- score thresholds
- founder override

That means one weak signal should not scream. But three corroborated signals should stop pretending to be background noise.

---

## Workflow Success Criteria

The workflows are working if they:
- reduce research time
- increase clarity
- surface hidden opportunities
- keep docs coherent
- create useful drafts
- convert thinking into action without drowning users in admin theater

---

## Workflow Build Order

### First build priority
1. Daily Brief Loop
2. Research Loop
3. Product Opportunity Loop
4. Review Queue
5. Task Loop
6. Content Loop
7. Document Update Loop

This order gives the system eyes first, then judgment, then action, then publishing.

---

*Last updated: March 6, 2026 — Chapterhouse is just a pile of tabs until the loops are right.*