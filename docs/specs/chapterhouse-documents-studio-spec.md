# Chapterhouse — Documents Studio Build Spec
## Adding the Task-Template Layer (CoWork 🔴 List → Chapterhouse Native)

*Written: March 28, 2026.*
*Purpose: Add a Documents Studio to Chapterhouse that handles every high-ROI writing and strategy task that Claude CoWork's template list covers — but with full Scott context baked in and the Council available on demand.*

---

## What This Is

Claude CoWork's "Ideas" tab has ~150 templates. 26 of them are directly applicable to Scott's work. None of them work well without Scott's context loaded. Chapterhouse already IS that context — the `context_files` table, `buildLiveContext()`, dream system, intel sweep, and email pipeline are all live.

This spec adds a **Documents Studio** tab to Chapterhouse that turns those 26 templates into one-click task launchers with Scott's full context pre-loaded, Council personas available, and outputs saved to Supabase for reuse.

---

## Pre-Flight (Chapterhouse Code Bot — Read Before Touching Anything)

1. Read `intel/2026-03-18/chapterhouse-implementation-spec.md` — the primary architecture spec; nothing here overrides it
2. Read the current `context_files` table schema and `buildLiveContext()` in `src/lib/context-builder.ts`
3. Read `src/app/api/chat/route.ts` — Documents Studio will reuse the same SSE streaming pattern
4. Read `src/app/api/intel/route.ts` — the intel sweep pipeline is one of the task types here
5. Check last migration number in `supabase/migrations/` — new tables start after that

---

## What Already Exists (Don't Rebuild)

| Capability | Current Chapterhouse Feature |
|---|---|
| Intel sweep / research synthesis | Phase 3 Intel — `/intel` page, `intel_sessions` table, daily cron |
| Email triage / inbox summary | Phase 8 Email — `emails` table, AI digest at midnight UTC |
| Social post drafting | Production pipeline — Council passes → Buffer → Review Queue |
| Dreamer / backlog / seeds | Phase 2 Dreamer — `/dreamer` Kanban, `dreams` table |
| Competitive intelligence storage | `dreams` table (Active seeds) + `intel_sessions` |
| Morning brief / daily context | Daily brief cron (`briefs` table, `context_files` inject) |
| Brand voice | `brand_voices` table (migration 023) — `BrandVoicesPanel` in Settings |

**Do not duplicate any of these. Documents Studio links out to them or calls their APIs.**

---

## What's Missing (The Build List)

These are the 🔴 template-equivalent gaps that don't exist anywhere in Chapterhouse today:

| Gap | Template Equivalent |
|---|---|
| PRD / feature spec generator | "Write a product requirements doc" |
| Architecture decision doc | "Draft an architecture design doc" |
| Blog post writer (NCHO/SomersSchool) | "Write a blog post" |
| Landing page copy | "Create a landing page" |
| Notes → spec converter | "Polish rough notes into a document" |
| Session close assistant | "Write a status update" — CLAUDE.md updater |
| Campaign brief generator | "Write a campaign brief" |
| Competitive positioning doc | "Develop competitive positioning" |
| Launch checklist generator | "Plan a product launch" / "Create a launch checklist" |
| Market sizing report | "Size a market opportunity" |
| Customer feedback synthesizer | "Analyze customer feedback" |
| Study guide generator | "Create a study guide" — general (not curriculum factory) |
| Report writer | "Write a report" — board/grant/session summary |
| Dream Floor trigger | "Brainstorm ideas for a project" — structured Council brainstorm |

---

## Architecture

### New DB Table: `documents`

```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  doc_type TEXT NOT NULL, -- 'prd', 'arch-doc', 'blog-post', 'landing-copy', 'spec', 
                          --  'session-close', 'campaign-brief', 'positioning', 
                          --  'launch-checklist', 'market-sizing', 'feedback-synthesis',
                          --  'study-guide', 'report', 'brainstorm'
  content TEXT NOT NULL,  -- the generated document, markdown
  input_params JSONB,     -- the user's form inputs that generated this
  council_used BOOLEAN DEFAULT false,
  word_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see own docs" ON documents USING (auth.uid() = user_id);
```

### New API Routes

```
/api/documents/generate       POST  — generate a document (SSE streaming)
/api/documents/list           GET   — list all saved documents by type
/api/documents/[id]           GET   — fetch one document
/api/documents/[id]           PATCH — update title/content (manual edits)
/api/documents/[id]           DELETE
```

### `/api/documents/generate` — Core Route

Same SSE pattern as `/api/chat/route.ts`. 

**Request body:**
```typescript
{
  doc_type: string          // one of the types above
  inputs: Record<string, string>  // the form fields (varies by doc_type)
  use_council: boolean      // if true, run full 5-pass Council sequence
  save: boolean             // if true, persist to documents table
}
```

**What it does:**
1. Calls `buildLiveContext()` — full Scott context always loads
2. Loads `doc_type_prompts[doc_type]` — the system prompt for that document type
3. Merges user inputs into the prompt
4. If `use_council = true`: runs Gandalf → Data → Polgara → Earl → Silk passes (same pattern as curriculum factory)
5. If `use_council = false`: single Sonnet 4.6 pass with the full context
6. Streams via SSE
7. If `save = true`: persists final output to `documents` table

---

## The 15 Document Types — Prompts & Forms

### 1. `prd` — Product Requirements Doc

**Form fields:** `feature_name`, `problem_statement`, `target_user` (dropdown: parent/student/Anna/Scott), `out_of_scope`

**System prompt injection:**
```
You are writing a Product Requirements Document for Scott Somers' <<feature_name>> feature.
Context: Scott is a middle school teacher building SomersSchool (homeschool SaaS) and NCHO (Shopify homeschool store).
Target user: <<target_user>>
Problem: <<problem_statement>>
Out of scope: <<out_of_scope>>

Write a PRD with: one-paragraph vision, user stories (3-5), acceptance criteria per story, 
success metrics, what is NOT being built. Be specific. This PRD goes to a code bot that 
implements from it — every ambiguity is a future bug.
```

**Council:** Optional (Gandalf drafts, Data audits for gaps, Polgara finalizes for the actual user, Earl cuts to what ships Tuesday)

---

### 2. `arch-doc` — Architecture Decision Doc

**Form fields:** `decision_question`, `option_a`, `option_b`, `constraints`

**System prompt injection:**
```
You are writing an Architecture Decision Record (ADR) for Scott Somers.
Decision: <<decision_question>>
Options considered: <<option_a>> vs <<option_b>>
Constraints: <<constraints>>

Write in Scott's locked decision format:
**Decision**: [what was decided]
**Why**: [the actual reason — not "best practice"]
**Not**: [the alternative that was rejected and why]
Then add: implementation notes, rollback plan, and any open questions flagged as ⚠️ SCOTT DECIDES.
```

**Council:** Usually yes — Data is the right lead here, not Gandalf

---

### 3. `blog-post` — Blog Post (NCHO / SomersSchool)

**Form fields:** `topic`, `target_brand` (dropdown: NCHO/SomersSchool/Alana Terry), `angle` (educational/news response/story), `target_audience`, `cta`

**System prompt injection:**
```
Write a blog post for <<target_brand>>.
Topic: <<topic>>
Angle: <<angle>>
Target reader: <<target_audience>>
CTA: <<cta>>

Brand voice rules from context. Always say "your child" not "your student."
NCHO: emotional first ("for the child who doesn't fit in a box"), practical convert.
SomersSchool: convicted about homeschooling, curious about this platform specifically.
SEO: include the topic keywords naturally. 800-1200 words. Real teacher voice, not AI voice.
```

**Council:** Single Polgara pass usually sufficient. Use full Council for high-stakes posts (Pending Action #31 — "Robot Teacher Question" blog).

---

### 4. `landing-copy` — Landing Page Copy

**Form fields:** `product` (dropdown: SomersSchool/NCHO/specific course), `audience_pain`, `primary_cta`

**System prompt injection:**
```
Write landing page copy for <<product>>.
Primary audience pain: <<audience_pain>>
CTA: <<primary_cta>>

Structure: Hero (headline + subhead + CTA), Problem (3 bullets), Solution (what this is), 
Social proof placeholder, Features (3), How it works (3 steps), FAQ (3), Final CTA.
Use red/white visual identity language — bold, clean, direct.
"Your child." Never "the student."
```

---

### 5. `spec` — Notes → Spec Converter

**Form fields:** `raw_notes` (large textarea), `output_format` (dropdown: feature-spec/session-summary/decision-log/implementation-plan)

**System prompt injection:**
```
Convert these rough notes into a clean <<output_format>>.
Notes: <<raw_notes>>

Preserve all decisions exactly as stated. Lock any clearly-decided items in the standard format:
**Decision**: / **Why**: / **Not**:
Flag anything that requires Scott's input as: ⚠️ SCOTT DECIDES: [question]
Do not invent decisions. If it's ambiguous, flag it.
```

---

### 6. `session-close` — Session Close / CLAUDE.md Updater

**Form fields:** `repo_name`, `what_was_built` (textarea), `new_tables` (comma-separated), `new_routes` (comma-separated), `new_env_vars` (comma-separated), `last_migration`

**System prompt injection:**
```
Write a session close summary for the <<repo_name>> repo.
What was built: <<what_was_built>>
New tables: <<new_tables>>
New routes: <<new_routes>>
New env vars: <<new_env_vars>>
Last migration: <<last_migration>>

Output TWO sections:
1. CLAUDE.md Build History entry — one dense paragraph, same format as existing entries.
2. copilot-instructions.md Last Updated entry — one dense paragraph starting with the date.

Do not add commentary. Just the two blocks, ready to paste.
```

**This is Step 5 of the dev process as a one-click tool.** No more cold starts.

---

### 7. `campaign-brief` — Facebook/Social Campaign Brief

**Form fields:** `campaign_goal`, `target_brand`, `audience_segment` (reference ../../reference/customer-avatar.md), `offer`, `budget_range`, `test_variants` (number)

**System prompt injection:**
```
Write a Facebook ad campaign brief for <<target_brand>>.
Goal: <<campaign_goal>>
Audience: <<audience_segment>>
Offer: <<offer>>
Budget range: <<budget_range>>
Number of test variants: <<test_variants>>

Include: campaign objective, audience targeting spec, <<test_variants>> ad copy variants 
(headline + primary text + CTA), creative direction, success metrics, 
what to kill vs. scale based on data. 
Use brand voice from context. "Your child." Convicted, not curious.
```

---

### 8. `positioning` — Competitive Positioning Doc

**Form fields:** `competitor` (dropdown: ChatGPT Study Mode/i-Ready/Beast Academy/Plato/Grace Corner/other), `audience_context`, `claim_to_defend`

**System prompt injection:**
```
Write a competitive positioning document for SomersSchool against <<competitor>>.
Audience context: <<audience_context>>
Claim: <<claim_to_defend>>

Structure: The competitor's real strength (don't dismiss it), their structural weakness, 
Scott's moat (what they literally cannot replicate), 
the one-sentence positioning statement, 
3 ad copy lines that execute the positioning, 
what NOT to say (avoid these traps).

Use the competitor intelligence from context. Do not make up market stats.
```

---

### 9. `launch-checklist` — Launch Checklist

**Form fields:** `product_or_feature`, `launch_date_target`, `known_dependencies`

**System prompt injection:**
```
Build a launch checklist for <<product_or_feature>>, targeting <<launch_date_target>>.
Known dependencies: <<known_dependencies>>

Categories: Tech (deploy, env vars, webhooks, monitoring), 
Content (copy, SEO, landing page), 
Legal/Compliance (policies, COPPA if student-facing), 
Marketing (email list, social, Facebook ad), 
Support (FAQ, contact email, error messages),
Post-launch (first 48 hours monitoring checklist).

Each item: checkbox format, owner (Scott or Anna), estimated time. 
Flag anything that blocks launch as 🔴.
```

---

### 10. `market-sizing` — Market Sizing Report

**Form fields:** `market_segment` (e.g. "Alaska homeschool allotment-eligible families"), `use_case` (grant application/pitch deck/personal planning)

**System prompt injection:**
```
Write a market sizing report for: <<market_segment>>.
Use case: <<use_case>>

Use data from context and intel sweep history. Every statistic must have a source.
⚠️ flag any number that cannot be verified from known sources.
Structure: TAM (total addressable), SAM (serviceable), SOM (realistically capturable in 12 months),
Key drivers, Key risks, Bottom-line number to use in <<use_case>>.
```

---

### 11. `feedback-synthesis` — Customer Feedback Synthesis

**Form fields:** `feedback_source` (textarea — paste raw feedback), `product_context` (dropdown: SomersSchool/NCHO/both)

**System prompt injection:**
```
Synthesize this customer/community feedback for <<product_context>>.
Feedback: <<feedback_source>>

Output: Top 3 pain points (with frequency signal), Top 3 desires/requests, 
1 thing they're NOT asking for but clearly need (infer from what they say around it), 
Specific product/copy changes implied, 
One line Polgara would say about what this feedback really means for the child.
```

---

### 12. `study-guide` — Study Guide (General)

**Form fields:** `topic`, `grade_level`, `source_material` (textarea or URL), `output_format` (self-quiz/summary/concept-map-outline/vocabulary)

**System prompt injection:**
```
Create a <<output_format>>-format study guide for <<topic>> at grade <<grade_level>>.
Source material: <<source_material>>

Secular. Accurate. Respects the student's time — no padding, no filler.
Every fact traceable to the source material. ⚠️ flag anything inferred beyond the source.
```

---

### 13. `report` — Report Writer

**Form fields:** `report_type` (board/grant/session-summary/annual-review), `audience`, `key_points` (textarea), `tone` (formal/conversational)

**System prompt injection:**
```
Write a <<report_type>> report for <<audience>>.
Key points to include: <<key_points>>
Tone: <<tone>>

Structure appropriate to <<report_type>>. No fluff. 
Specific numbers where available. 
Frame around outcomes, not activities.
```

---

### 14. `brainstorm` — Dream Floor Trigger

**Form fields:** `topic`, `problem_type` (dropdown: architecture/business-direction/curriculum/new-feature/stuck-on-bug/new-project/marketing), `what_scott_knows_already` (textarea)

**System prompt injection:**
*This is the full Council brainstorm trigger — runs the complete 5-pass sequence.*

```
BRAINSTORM TRIGGER — <<problem_type>> mode.
Topic: <<topic>>
What Scott already knows: <<what_scott_knows_already>>

Gandalf opens with the appropriate sequence for <<problem_type>>.
One question at a time — never a list. Wait for Scott's answers in follow-up messages.
Log decisions in standard format as they emerge.
Flag ⚠️ SCOTT DECIDES when a decision cannot be made without human input.
```

**Note:** This is the only doc_type that is inherently conversational — it should open in the chat panel pre-loaded with this prompt, not generate a static document. The output (after the conversation) goes through the `spec` doc_type to produce a locked spec.

---

### 15. `academic_paper` — Academic Comparison Paper

**Form fields:** `topic` (what is being compared — e.g. "Two approaches to teaching fractions"), `papers` (2–4 paper titles or DOIs — Semantic Scholar API fetches real citations), `angle` (what lens to compare through — e.g. "pedagogical effectiveness for K-5"), `audience` (dropdown: homeschool parent/curriculum designer/Scott/general)

**System prompt injection:**
```
You are writing an Academic Comparison Paper for <<audience>>.
Topic: <<topic>>
Angle: <<angle>>
Papers to compare: <<papers>>

Fetch real citations from Semantic Scholar where possible.
Summarize each paper's core argument, then compare across: methodology, findings, applicability to <<audience>>.
Flag ⚠️ any claim that could not be verified against the source.
Tone: accessible academic — informed but not impenetrable.
Conclude with a clear recommendation or synthesis relevant to <<angle>>.
```

**Citation note:** This doc type calls the Semantic Scholar API to resolve paper titles → real citations (author, year, journal, DOI). Any paper not found gets a ⚠️ flag instead of a hallucinated citation.

**Council:** Optional (Data audits citation accuracy; Polgara translates for the target audience)

---

## UI — Documents Studio Tab

### Location
New tab in the main Chapterhouse nav. Icon: 📄. Route: `/documents`

### Layout
```
/documents
  ├── [left sidebar — 240px]
  │     ├── New Document (button)
  │     ├── Search
  │     ├── By Type (grouped list)
  │     │     ├── Strategy (arch-doc, prd, positioning, market-sizing)
  │     │     ├── Writing (blog-post, landing-copy, campaign-brief, report)
  │     │     ├── Planning (spec, session-close, launch-checklist)
  │     │     ├── Research (feedback-synthesis, study-guide)
  │     │     └── Brainstorm (brainstorm)
  │     └── Recent Documents (last 10)
  │
  └── [main panel]
        ├── When no doc selected: Document Type Cards (14 cards, same 🔴/🟡 tiers)
        ├── When type selected: Form → Generate button
        └── When generating: SSE streaming output, editable after completion
```

### Document Type Cards
Each card shows: icon, name, description (one sentence), "Use Council" toggle, "Generate" button.

### Output Panel
- Streaming output renders in real-time (markdown → rendered HTML)
- After completion: Edit, Copy to clipboard, Save to Supabase, Export as .md
- "Use this in Chat" button — loads the doc into the chat panel as context

---

## Build Phases

### Phase A — Foundation (Do First)
1. Migration: `documents` table with RLS
2. API routes: `generate` (single-pass, no Council), `list`, `[id]` CRUD
3. Document type prompts object (`src/lib/doc-type-prompts.ts`) — all 14 types
4. Minimal UI: type selector → form → generate → display output
5. Verify: session-close type works end-to-end

**Done when:** Scott can generate a session-close doc and copy it to paste into CLAUDE.md.

### Phase B — Council Integration
1. Add `use_council` flag to generate route
2. Wire 5-pass Council sequence (same pattern as curriculum factory, not LEGACY code — write fresh)
3. Council toggle in UI per doc type
4. Done when: blog post runs full Council pass and Polgara's version is noticeably better

### Phase C — Save, Search, Retrieve
1. Save to Supabase (already in route — just activate)
2. Doc library UI with search + filter by type
3. "Load into chat" button — appends doc content to `buildLiveContext()` for the session
4. Done when: Scott can pull up last week's campaign brief and load it into a chat

### Phase D — Brainstorm Mode
1. `brainstorm` doc type opens in chat panel, not static form
2. Pre-loads the full brainstorm prompt + Scott's topic into the Council chat
3. "Convert to Spec" button at end of conversation → auto-routes to `spec` doc type
4. Done when: typing a topic → Council asks one question at a time → spec produced at end

---

## Environment Variables

No new env vars required. All AI calls use `ANTHROPIC_API_KEY` already in Railway.

---

## Integration Points with Existing Chapterhouse Features

| Existing Feature | Integration |
|---|---|
| `buildLiveContext()` | Always called in generate route — full Scott context in every doc |
| `brand_voices` table | Landing copy + blog post pull from `brand_voices` via `getBrandVoice(brand)` |
| `intel_sessions` | Market sizing + competitive positioning pull recent intel as additional context |
| `dreams` table | Brainstorm output can create new seeds via existing `/api/dreams` route |
| `/api/chat` | Documents Studio "Use in Chat" button appends doc to chat context |
| Review Queue | Blog posts + landing copy can be pushed to Review Queue for approval before publishing |

---

## What This Replaces

After Phase A-C ship:

- No more opening a generic Claude chat to write a blog post — Chapterhouse does it with brand voice, competitor context, and Council available
- No more manually writing session-close CLAUDE.md entries — session-close doc type does it in 30 seconds
- No more copy-pasting campaign brief prompts into chat — campaign brief type has all the inputs locked
- CoWork's 🔴 template list becomes irrelevant for Scott's use case — Chapterhouse does all 26 natively and better

**NOT replacing:**
- CoWork's Gmail connector / Calendar connector — those still have value for email triage UI
- CoWork's `mcp-builder` skill — custom MCP server creation is a different use case
- Direct Claude chat for rapid exploratory Q&A

---

## Verification — How You Know It's Done

**Phase A done:** Open Chapterhouse, click Documents, choose "Session Close," fill in repo name + recent build, click Generate, get a paste-ready CLAUDE.md entry in under 30 seconds.

**Phase B done:** Open a blog post generation for "The Robot Teacher Question" (Pending Action #31), run full Council, Polgara's output is noticeably sharper than single-pass.

**Phase C done:** Documents library shows all previously generated docs, searchable. Can load any doc into the Chapterhouse chat as context.

**Phase D done:** Type "Dream with me about SomersSchool's waitlist strategy" → Gandalf asks one question → conversation runs to completion → "Convert to Spec" produces a locked spec in the Documents library.

---

*Filed: March 28, 2026. Paste this into Chapterhouse workspace and tell Claude Code to execute from Phase A.*
