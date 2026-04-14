# Data Model Spec — Chapterhouse

> *If the product spec says what this system should do, this document says what the system needs to remember in order to do it without becoming a goldfish with API keys.*

---

## Purpose

This is the first serious pass at the data model for Chapterhouse.

It is designed to be:
- detailed enough to build from
- structured enough to support the Chapterhouse vision
- flexible enough to evolve

The goal is not database maximalism for its own sake. The goal is to make sure the system can actually track the things it claims to care about.

---

## Design Principles

### 1. Real objects, not blob memory
Books, authors, opportunities, competitors, sources, tasks, briefs, and decisions should be first-class entities.

### 2. Structured plus narrative
Important records should have both:
- structured fields for logic, sorting, scoring, filtering
- narrative summaries for human readability

### 3. Changeable defaults
Thresholds, weights, tiers, and workflow settings should be stored as configuration, not buried in code.

### 4. Useful audit trail
We do not need paranoid full event logging on day one, but we do need enough history to answer:  
*what changed, when, and why?*

### 5. Deep links over isolated records
Tasks, opportunities, books, authors, sources, and drafts should be linkable to one another.

---

## Core Entity Set

The first-pass schema should include these top-level entities:

1. `users`
2. `workspaces`
3. `personas`
4. `documents`
5. `sources`
6. `competitors`
7. `books`
8. `authors`
9. `publishers`
10. `topics`
11. `campaigns`
12. `opportunities`
13. `briefs`
14. `research_reports`
15. `tasks`
16. `review_items`
17. `overrides`
18. `watchlists`
19. `alerts`
20. `decisions`
21. `tags`
22. `activity_log`
23. `settings`

---

## 1. Users

Represents human operators.

### Required fields
- `id`
- `name`
- `email`
- `role` — founder, editor, operator, admin
- `status` — active, invited, disabled
- `default_persona_id`
- `created_at`
- `updated_at`

### Notes
Start with Scott and Anna, but design cleanly for future internal team members.

---

## 2. Workspaces

Top-level context buckets for different kinds of work.

### Required fields
- `id`
- `name` — Brand HQ, Research Desk, Marketing Studio, Product Lab, Daily Briefing, Ops Console
- `slug`
- `description`
- `is_default`
- `created_at`
- `updated_at`

---

## 3. Personas

Specialist system modes used in chat and workflows.

### Required fields
- `id`
- `name`
- `slug`
- `description`
- `system_prompt`
- `voice_style`
- `workspace_id` (nullable)
- `is_active`
- `is_editable`
- `created_at`
- `updated_at`

### Seed personas
- Brand Whisperer
- Research Analyst
- Marketing Strategist
- Product Architect
- Managing Editor
- Ops Chief

---

## 4. Documents

Internal documents in the brand system.

### Required fields
- `id`
- `title`
- `slug`
- `path`
- `doc_type` — sacred_core, operational_core, staging, brief, memo, report, draft
- `status` — active, archived, superseded
- `workspace_id`
- `summary`
- `source_of_truth` — local_file, generated, imported
- `auto_writable` — boolean
- `created_by_user_id`
- `updated_by_user_id`
- `created_at`
- `updated_at`

### Optional fields
- `approved_at`
- `approved_by_user_id`
- `version_label`
- `parent_document_id`

---

## 5. Sources

Represents ingested outside information.

### Required fields
- `id`
- `title`
- `source_name`
- `source_type` — official_doc, article, email, rss, transcript, page, report, review, list
- `url`
- `published_at`
- `ingested_at`
- `state` — ingested, summarized, scored, linked, archived
- `evidence_grade` — A, B, C, D, F
- `confidence_score` — 0-100
- `summary`
- `why_it_matters`
- `raw_text_location`
- `workspace_id`

### Key logic fields
- `is_trusted_source`
- `is_paid_signal`
- `has_conflict_flag`
- `duplicate_group_key`
- `topic_tags`

### Narrative fields
- `fact_notes`
- `pattern_notes`
- `opinion_notes`
- `hype_notes`

---

## 6. Competitors

Tracked businesses, platforms, or comparable ecosystems.

### Required fields
- `id`
- `name`
- `slug`
- `competitor_type` — catalog, homeschool_brand, creator_brand, publisher_signal, promo_platform, retail_signal
- `tier` — 1, 2, 3
- `website_url`
- `status` — active, paused, archived
- `summary`

### Tracking fields
- `watch_homepage`
- `watch_catalog`
- `watch_email`
- `watch_authors`
- `watch_prices`
- `watch_promotions`

### Intelligence fields
- `last_seen_at`
- `last_price_event_at`
- `last_campaign_event_at`
- `notes`

---

## 7. Books

Core record for tracked titles.

### Required fields
- `id`
- `title`
- `subtitle`
- `isbn_10`
- `isbn_13`
- `author_primary_id`
- `publisher_id`
- `format` — hardcover, paperback, ebook, audiobook, unknown
- `audience_age_band`
- `grade_band`
- `subjects`
- `faith_fit` — faith_based, faith_neutral, both, unclear
- `status` — watch, source, sell, guide, featured, seasonal, bundle_candidate, high_priority, ignore

### Scoring fields
- `store_score`
- `curriculum_score`
- `content_score`
- `score_updated_at`

### Quality / fit fields
- `literary_quality_notes`
- `homeschool_fit_notes`
- `curriculum_potential_notes`
- `allotment_fit_notes`
- `editorial_priority` — boolean
- `curriculum_priority` — boolean

### Opportunity fields
- `bundle_ideas`
- `content_angles`
- `guide_potential_summary`
- `seasonal_relevance`

### Signal fields
- `times_seen_in_competitor_push`
- `times_seen_in_promo_signal`
- `last_seen_signal_at`

---

## 8. Authors

Tracked author records.

### Required fields
- `id`
- `name`
- `slug`
- `publisher_primary_id` (nullable)
- `summary`

### Key evaluation fields
- `literary_reputation_notes`
- `brand_fit_notes`
- `homeschool_relevance_notes`
- `curriculum_depth_notes`
- `audience_familiarity_notes`

### Signal fields
- `promotion_frequency_score`
- `catalog_breadth_score`
- `series_potential_score`
- `last_seen_signal_at`

### Override fields
- `editorial_priority`
- `curriculum_priority`

---

## 9. Publishers

Publisher and imprint records.

### Required fields
- `id`
- `name`
- `slug`
- `publisher_type` — trade, christian, homeschool, educational, promo_platform, media
- `website_url`
- `summary`
- `status`

### Intelligence fields
- `notes`
- `watch_priority`
- `faith_posture_fit`
- `literary_signal_notes`

---

## 10. Topics

Thematic tags that matter enough to structure around.

### Required fields
- `id`
- `name`
- `slug`
- `topic_type` — subject, market, channel, platform, seasonal, audience
- `summary`
- `watch_priority`

Examples:
- homeschool
- shopify
- email marketing
- children's books
- curriculum
- back to school

---

## 11. Campaigns

Observed or internal campaign records.

### Required fields
- `id`
- `name`
- `campaign_type` — observed_competitor, internal_draft, internal_approved
- `status`
- `summary`
- `start_date`
- `end_date`

### Link fields
- `competitor_id` (nullable)
- `book_id` (nullable)
- `author_id` (nullable)
- `publisher_id` (nullable)

---

## 12. Opportunities

One of the most important objects in the system.

### Required fields
- `id`
- `title`
- `summary`
- `opportunity_type` — book, author, bundle, campaign, category, curriculum, content, promo
- `state` — detected, staged, approved, converted, rejected, snoozed, archived
- `detected_at`
- `workspace_id`

### Scoring fields
- `store_score`
- `curriculum_score`
- `content_score`
- `confidence_score`
- `evidence_grade`

### Why-it-matters fields
- `store_case`
- `curriculum_case`
- `content_case`
- `risk_notes`

### Trigger fields
- `trigger_repeated_push`
- `trigger_cross_platform_signal`
- `trigger_discount_movement`
- `trigger_catalog_gap`
- `trigger_bundle_pattern`
- `trigger_seasonal_timing`

### Relation fields
- `book_id` (nullable)
- `author_id` (nullable)
- `publisher_id` (nullable)
- `competitor_id` (nullable)
- `campaign_id` (nullable)

### Workflow fields
- `assigned_to_user_id` (nullable)
- `review_due_at`
- `converted_task_id` (nullable)

---

## 13. Briefs

Daily and weekly intelligence outputs.

### Required fields
- `id`
- `brief_type` — daily, weekly, alert_digest, monthly_review
- `title`
- `date_key`
- `workspace_id`
- `status` — draft, ready, reviewed, archived

### Structured section fields
- `urgent_changes_json`
- `domain_sections_json`
- `opportunities_json`
- `risks_json`
- `today_actions_json`

### Narrative fields
- `summary`
- `body_markdown`

### Metadata fields
- `source_count`
- `opportunity_count`
- `generated_at`
- `reviewed_at`
- `reviewed_by_user_id`

---

## 14. Research Reports

Saved analytical outputs.

### Required fields
- `id`
- `title`
- `report_type` — fact_vs_fluff, compare, synthesis, memo, source_pack
- `workspace_id`
- `status`
- `summary`
- `body_markdown`
- `verdict`
- `confidence_score`
- `created_at`

### Link fields
- `primary_topic_id` (nullable)
- `related_opportunity_id` (nullable)

---

## 15. Tasks

Internal action layer.

### Required fields
- `id`
- `title`
- `description`
- `state` — open, in_progress, blocked, done, canceled
- `priority` — low, medium, high, urgent
- `workspace_id`
- `created_by_user_id`
- `assigned_to_user_id`
- `due_at` (nullable)

### Deep-link fields
- `opportunity_id` (nullable)
- `book_id` (nullable)
- `author_id` (nullable)
- `source_id` (nullable)
- `research_report_id` (nullable)
- `document_id` (nullable)

### Notes fields
- `success_definition`
- `blocking_reason`
- `completion_notes`

---

## 16. Review Items

The queue object for founder approval flow.

### Required fields
- `id`
- `review_type` — opportunity, memo, brief, draft, doc_update, report
- `state` — pending, approved, rejected, snoozed, converted
- `priority`
- `title`
- `summary`
- `workspace_id`
- `created_at`

### Link fields
- `opportunity_id` (nullable)
- `document_id` (nullable)
- `brief_id` (nullable)
- `research_report_id` (nullable)

### Reviewer fields
- `reviewed_by_user_id` (nullable)
- `reviewed_at` (nullable)
- `review_note`

---

## 17. Overrides

Manual ranking or workflow overrides.

### Required fields
- `id`
- `override_type` — force_up_rank, force_down_rank, pin_to_watch, ignore, snooze, channel_note
- `reason`
- `created_by_user_id`
- `created_at`

### Link fields
- `book_id` (nullable)
- `author_id` (nullable)
- `opportunity_id` (nullable)
- `competitor_id` (nullable)
- `topic_id` (nullable)

### Semantic fields
- `priority_mode` — founder_priority, editorial_priority, curriculum_priority, neutral
- `expires_at` (nullable)

---

## 18. Watchlists

Named watch groups.

### Required fields
- `id`
- `name`
- `watch_type` — competitor, title, author, publisher, topic, mixed
- `status`
- `summary`
- `created_by_user_id`

### Common examples
- tier 1 competitors
- low-confidence watchlist
- seasonal books
- curriculum watchlist
- literary watchlist

---

## 19. Alerts

Short-form surfaced items.

### Required fields
- `id`
- `title`
- `alert_type` — platform_change, price_drop, competitor_move, product_opportunity, brand_risk, source_conflict
- `severity` — info, medium, high, urgent
- `summary`
- `status` — new, seen, queued, dismissed, archived
- `created_at`

### Link fields
- `opportunity_id` (nullable)
- `source_id` (nullable)
- `competitor_id` (nullable)
- `book_id` (nullable)

---

## 20. Decisions

Keeps important decisions explicit.

### Required fields
- `id`
- `title`
- `summary`
- `decision_type` — strategy, product, channel, source_policy, scoring, workflow
- `status` — active, superseded, archived
- `decided_at`
- `decided_by_user_id`

### Link fields
- `document_id` (nullable)
- `opportunity_id` (nullable)

---

## 21. Tags

Freeform but normalized labels.

### Required fields
- `id`
- `name`
- `slug`
- `tag_type`

---

## 22. Activity Log

Useful audit trail, not surveillance theater.

### Required fields
- `id`
- `event_type`
- `entity_type`
- `entity_id`
- `actor_type` — user, system
- `actor_id` (nullable)
- `summary`
- `created_at`

### Good examples
- score changed
- state changed
- override added
- review approved
- brief generated
- source marked duplicate

---

## 23. Settings

System knobs.

### Required fields
- `id`
- `scope_type` — global, user, workspace
- `scope_id`
- `setting_key`
- `setting_value_json`
- `updated_at`

### Settings that belong here
- score thresholds
- source weights
- competitor tiers
- alert sensitivity
- channel approval rules
- brief composition
- watchlist defaults

---

## Key Relations

### Core graph
- a `source` can create an `alert`
- an `alert` can point to an `opportunity`
- an `opportunity` can point to a `book`, `author`, `publisher`, `competitor`, or `campaign`
- a `task` can be created from an `opportunity`
- a `review_item` can gate an `opportunity`, `brief`, `report`, or `document`
- an `override` can change the ranking or visibility of multiple object types

### Book graph
- a `book` belongs to an `author`
- a `book` belongs to a `publisher`
- a `book` can be mentioned in many `sources`
- a `book` can appear in many `campaigns`
- a `book` can produce many `opportunities`

### Author graph
- an `author` can have many `books`
- an `author` can be linked to many `sources`
- an `author` can produce many `opportunities`

---

## History Strategy

The system should maintain a **useful audit trail**, not a maximal one.

### Minimum history worth keeping
- score changes
- state changes
- review actions
- override actions
- key note additions
- task conversions
- brief generation events

### Things that do not need full forensic capture in v1
- every token of every chat
- every UI click
- every intermediate system thought

---

## Brief Storage Model

Daily briefs should be stored as **structured + doc** objects.

That means:
- structured JSON sections for filtering and rendering
- human-readable markdown body for reading and exporting

This gives you both machine usefulness and human clarity.

---

## Research Storage Model

Research outputs should save:
- the verdict
- source set
- summary
- confidence
- citations
- any linked opportunity or recommendation

The summary is often more important than the raw chat transcript.

---

## Task Linking Model

Tasks should support **deep links** in v1.

A task should be able to point back to:
- the source that caused it
- the opportunity that justified it
- the book or author it affects
- the document or report it came from

This prevents orphaned work.

---

## What Not to Overbuild Yet

Even with a long-term-oriented schema, do not overbuild:
- public multi-tenant billing
- public customer accounts
- external client permissions
- advanced workflow engines before the core review loop works
- perfect taxonomy before the app touches real data

Build for the real founder workflow first.

---

## Recommended Build Order from the Schema

### Phase 1 — Foundation
- users
- workspaces
- personas
- documents
- sources
- briefs

### Phase 2 — Intelligence objects
- competitors
- books
- authors
- publishers
- opportunities
- alerts

### Phase 3 — Review and action
- review_items
- tasks
- overrides
- decisions

### Phase 4 — Refinement
- campaigns
- watchlists
- activity_log
- settings UI

---

*Last updated: March 6, 2026 — This is the first serious schema pass. It is meant to support building, not worship.*