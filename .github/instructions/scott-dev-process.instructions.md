---
description: "Scott Somers' personal development methodology — the Dream Floor process. Applies to all code in all repos. Read this before writing a single line."
applyTo: "**"
---

# Scott Somers — Development Methodology
*The Dream Floor Process. Distilled from 92 Q&A sessions, March 18, 2026.*

This is how Scott builds. This is not a suggestion list. This is the process.

---

## The Cardinal Rule: Think Before You Build

No code gets written until the thinking is done. Every significant feature passes through the following sequence. Skipping steps produces code that has to be ripped out.

### Step 1: Pre-Flight Reading

Before touching any file in a repo, read all context that exists for it:
- The `CLAUDE.md` in the repo root (if present)
- The `.github/copilot-instructions.md` in this workspace
- Any project-specific research files, decision logs, or handoff documents in the workspace
- The existing DB schema (all migrations, not just the latest)
- The API route(s) that the feature will touch

**Do not assume you know the codebase. Read it.**

> **What CLAUDE.md is:** The technical brief for a specific repo. Contains what's been built, what tables exist, what env vars are required, what not to touch, and the session build history. Read by Claude Code CLI when you run `claude` in a terminal. **Not** the same as `copilot-instructions.md` (which is the identity brain for Copilot chat). They serve different tools and are updated independently. Both need to be updated after every working session or the next AI starts cold.

### Step 2: Known Issues Inventory

Before adding new features, triage what exists:
- **Fix immediately** — anything that blocks the feature you're about to build
- **Triage** — broken things that need a note/comment but don't block
- **Leave alone** — unrelated broken things; note with a `// TODO:` comment only

Do not touch broken things that aren't in scope. Note them. Move on.

### Step 3: Lock Architecture Before Coding

Architecture decisions get made once and documented. The coder implements — it does not redesign. If a decision is wrong, stop and surface it before writing code, not after.

Format for a locked decision:
```
**Decision**: [what was decided]
**Why**: [the actual reason — not "best practice"]
**Not**: [the alternative that was rejected and why]
```

### Step 4: Write the Implementation Spec First

For any non-trivial feature, the spec comes before the code:
- Phase-by-phase breakdown
- Every phase has: what gets built, what DB changes are required, what the verification step is
- Exact SQL migration patterns for schema changes
- Explicit note on what existing code is preserved vs. replaced

The spec is the brief. The coder executes from the brief.

**For multi-day builds, the spec is a living document.** Mark anything AI cannot resolve without human input as `⚠️ SCOTT DECIDES: [question]`. Do not guess. Do not assume. Surface the decision and stop. When Scott answers, replace with `✅ DECISION LOCKED: [what was decided]`. A spec with all decisions locked is the green light to code. A spec with open `⚠️ SCOTT DECIDES` callouts is not ready — do not build past them.

---

### Step 5: Session Close

**After every working session that produces committed code, run this closer before ending the chat.**

If you skip this, the next AI — whether a new Copilot chat or Claude Code in the terminal — starts cold and rediscovers what's already documented.

1. Update the repo's `CLAUDE.md` — add to Build History, update any changed routes/tables/env vars/decisions
2. Add a one-line summary to the master `copilot-instructions.md` → `Last Updated` section
3. If this workspace uses a workspace injection system, re-run the copy command so other workspaces get the fresh context

The Pre-Flight Reading in Step 1 only pays off if Step 5 ran after the previous session.

---

## The Brainstorm-to-Build-Bible Pattern

For any non-trivial feature, new product, or new repo — the Step 4 spec doesn't appear from nowhere. It comes out of a structured iterative dialogue. This is the pattern that produces it.

### Phase 1: Trigger

Any of these phrases starts a structured brainstorm:
- *"Brainstorm with me on X"*
- *"Think through X with me"*
- *"Dream with me on X"*
- *"I'm stuck on X"*
- *"Help me think through X before we build it"*

The Council activates. The problem type determines which thinking sequence runs first.

| Problem Type | Opening Sequence |
|---|---|
| Architecture / technical decision | First Principles → Structured Thinking → Real-World Test |
| Business / product direction | Contrarian → Expert Panel → Real-World Test |
| Curriculum / content design | Simplify It → Improve the Idea → Expert Panel |
| New feature before building | Contrarian → Real-World Test → First Principles |
| Stuck on a bug | Structured Thinking → First Principles |
| New project / repo idea | Expert Panel → Contrarian → Real-World Test |

### Phase 2: One Question at a Time — Non-Negotiable

The AI asks **one** clarifying question. Scott answers. The AI asks the next.

**Never dump a list of questions.** This is locked behavior.

> Rationale: A list of 10 questions kills momentum and forces Scott to think through all of them at once before the conversation has started. One question at a time lets Scott think out loud. His answers to early questions frequently eliminate later ones — or surface better questions that weren't on the original list.

Sessions can run for hours this way. That's fine. Use `/compact` in Claude Code when context fills. The depth of the conversation is the ROI.

### Phase 3: Decisions Accumulate as the Conversation Goes

As Scott answers, architecture decisions get locked in the standard format:

```
**Decision**: [what was decided]
**Why**: [the actual reason]
**Not**: [the rejected alternative and why]
```

The brainstorm is not just requirements gathering. It's the process of surfacing and locking decisions. By the end, you have a decision log, not just a feature description.

### Phase 4: ⚠️ SCOTT DECIDES Gates Surface Naturally

Anything the AI cannot resolve without Scott's input gets flagged immediately:

```
⚠️ SCOTT DECIDES: [the specific question that is blocking progress]
```

Do not proceed past an open `⚠️ SCOTT DECIDES`. Stop there. Surface it. Wait for the answer. When Scott answers, replace it:

```
✅ DECISION LOCKED: [what was decided]
```

A brainstorm session is not ready to produce a spec until all `⚠️ SCOTT DECIDES` callouts are resolved.

### Phase 5: The Spec Takes Shape

After enough Q&A, the spec writes itself. The AI proposes it in phases:

- What gets built in this phase
- What DB changes are required (exact SQL migration syntax)
- What existing code is preserved vs. replaced
- What the verification step looks like — how you know this phase is done

The spec is the brief. It exists so that a code bot (Claude Code CLI, a new Copilot chat, a future Scott) can execute from it without asking architecture questions.

### Phase 6: All Decisions Locked = Green Light to Build

A spec with every `⚠️ SCOTT DECIDES` resolved and every significant architectural choice documented is the **build bible** for that application. This is the green light to build.

A spec with open `⚠️` callouts is not ready. Do not build past them.

### What This Looks Like at Scale

> The Chapterhouse build bible came out of 92 Q&A sessions over a single session. That produced an 8-phase implementation spec (~2,000 lines) with every architectural decision locked. A code bot can open that spec and execute Phase 0 without asking a single clarifying question.

For smaller features, the pattern scales down. A 3-question conversation can produce a locked spec for a simple route or schema change. The number of questions isn't the point — **nothing gets built until the decisions are locked.**

---

## The Question Architecture — 75 to 100 Questions

A full brainstorm produces 75–100 questions across 8 universal sections. This is not a rigid script — it's a skeleton. The questions in each section are starting points. Scott's answers will generate better follow-ups than the skeleton anticipated.

**The section arc is non-negotiable.** Behavioral reality comes before vision. Frustration comes before features. Destination comes before ship order. Skipping the arc produces wishlists, not build bibles.

---

### Section 1 — The Daily Reality (7–9 Questions)

**Purpose:** Ground truth before anything else. What Scott actually does today, not what he thinks he does.

Sample questions:
- Walk me through a typical work session with [tool/product]. Start from when you sit down.
- What tool is literally open on your screen when you do [X]?
- What are the last 3 things you actually did with this?
- How many times per week do you genuinely use [X]?
- What does a good session with this look like? A bad one?
- When you're in flow, what are you not thinking about that this handles for you?
- What does [competitor/current tool] do that you always do first?

> Pattern: Behavioral questions only. "What do you do?" not "What would you want?" This section surfaces the user who actually exists, not the aspirational one.

---

### Section 2 — The Frustration Inventory (9–11 Questions)

**Purpose:** Pain before vision. No feature lists until the broken things are on the table.

Sample questions:
- What's the single most frustrating thing about how you work today?
- What feature sounds impressive but you never actually use?
- What does [current tool] do that you always have to undo or correct afterward?
- What do you find yourself copy-pasting between tools that should just be automatic?
- If [current tool/approach] disappeared tomorrow, what would you genuinely not miss?
- What's something you've tried twice, failed, and just stopped doing?
- What do you do manually right now that feels embarrassing given the tools you have?
- What's the thing that makes you close the tab and walk away?
- What's broken that you've just accepted as the cost of doing business?

> Pattern: Let the frustration section run long. A good frustration inventory is more valuable than a good feature list. Pain is the real product brief.

---

### Section 3 — The Core Vision (10–12 Questions)

**Purpose:** The primary feature, capability, or personality that makes this product *Scott's*. This section varies most by product type — for AI tools it's personality and Council; for data tools it's the insight layer; for content tools it's the output quality.

Sample questions:
- If you had to describe what this becomes in one sentence, what is it?
- What's the thing that would make this feel like it was built for you specifically and nobody else?
- [Binary forcing]: Option A: [concrete option]. Option B: [concrete option]. Which?
- What's the 'wow' moment — the thing someone sees that makes them say 'I want that'?
- What are the three things this does that nothing else does?
- What personality does this have? If it could talk, what does it sound like?
- What's the thing you'd build first if you had 48 hours and nothing else mattered?
- What does [feature] look like when it's working exactly right? Describe a specific moment.
- What would you cut from the vision if you had to cut 40%?
- Is there a [existing tool] that does 20% of what you want? What does it get right?

> Pattern: Binary forcing questions ("Option A or Option B?") are the most valuable questions in this section. They force the real preference to surface instead of "both sound good."

---

### Section 4 — The Experience Layer (8–9 Questions)

**Purpose:** What "alive" feels like. UX, streaming, responsiveness, the interaction moments that make this feel like a tool Scott reaches for instead of a tool he tolerates.

Sample questions:
- You're using the finished version. Walk me through the first 10 minutes in real time.
- What's the most important interaction that should happen in under a second?
- What's one specific moment in using this where you'd say "yes, that's exactly what I wanted"?
- What would you demo to Anna first to show her why this matters?
- Phone or desktop? What's the real home for this in practice?
- When something goes wrong — AI error, slow response, wrong output — what's the right behavior?
- What's the difference between this feeling like a tool and feeling like a collaborator?
- What should it do without being asked?

> Pattern: The "first 10 minutes in real time" question is always worth asking because it forces Scott to narrate the actual UX path rather than describe features abstractly.

---

### Section 5 — Context and Memory (9–11 Questions)

**Purpose:** What the system needs to know about Scott permanently. The context that, if it were in the system, would change everything. This is the section that separates tools that feel generic from tools that feel like they know him.

Sample questions:
- What are the 5 most important facts this system must never forget about you or your business?
- What's something fundamental about you that this doesn't know right now that it absolutely should?
- What context lives in your head right now that, if it were in the system, would change what it does?
- What's the difference between a locked decision (never revisit) and an active assumption (right for now, could change)? Give me one of each.
- When the system's memory contradicts something you're saying — should it push back or update silently?
- What's something that happened in the last 30 days that this system should have learned from?
- What should it remember from every session, and what should it forget?
- Is there a deadline or constraint that should change how the system prioritizes its outputs?
- What would it feel like if this mentioned [specific thing] unprompted? Motivating or annoying?

> Pattern: The "locked vs. active assumption" question is the most powerful in this section. It forces Scott to reveal what's negotiable — which is the real architecture input, not the wishlist.

---

### Section 6 — People, Users, and Commercial (6–8 Questions)

**Purpose:** Who else is in the room. Whether this is a personal tool or a product. What the commercial path is — even if it's "none." These questions surface the real scope before you build a single-user tool that needs to be multi-tenant, or a multi-tenant system nobody asked for.

Sample questions:
- Is anyone else using this right now, or is it just you?
- Does Anna need to touch it? What specifically would she do with it?
- What would Anna need for this to be worth opening every day?
- Would you ever sell this? What would the commercial version look like?
- Who's the first paying customer outside of you — describe them specifically?
- What data does this generate that might be worth something on its own?
- What breaks if you add a second user?

> Pattern: "Would you sell this?" is the question most likely to reveal a hidden product direction Scott hasn't said out loud yet.

---

### Section 7 — The Primary Destination (9–11 Questions)

**Purpose:** North star, done criteria, the demo moment. This is what "finished" looks like — which determines what Phase 1 has to be and what can wait.

Sample questions:
- What does "done" look like? When do you stop building and start actually using it?
- Describe the demo you'd show someone to make them say "I want that" — walk through it step by step.
- A year from now, if this is working exactly as hoped, what's different about your day?
- What features are on the "someday but not in scope" list?
- What are you not building — the things that would creep into scope if you don't explicitly cut them?
- What's the first 10 minutes with the finished version? Walk me through it in real time.
- What's the version of this that ships Tuesday vs. the version that ships in 6 months?
- What would make this feel more like a place you live vs. a tool you visit?
- What does this replace completely?

> Pattern: "Describe the demo" is the single most useful question in the session. The answer becomes the Phase 1 target and the spec's success criteria.

---

### Section 8 — Priorities and Ship Order (7–9 Questions)

**Purpose:** The spec is almost written. This section turns the vision into an ordered list. What ships first, what breaks in service of speed, what is off-limits.

Sample questions:
- If you could only build one thing this week — what is it?
- What's the minimum version of this that would be genuinely useful today?
- What existing code or behavior is sacred — never break it?
- What are you willing to break to ship faster?
- What's the thing you're most afraid of getting wrong in Phase 1?
- What would you cut on day one if you had to cut 40%?
- What's the right order — what has to exist before the next thing can be built?
- If Phase 1 shipped and nothing else ever got built — would Phase 1 alone be worth the effort?

> Pattern: "If Phase 1 shipped and nothing else ever got built — would it be worth it?" is the filter. If the answer is no, Phase 1 is scoped wrong.

---

### Pinned Questions — The Session Generates Its Own

During any section, if Scott's answer spawns a new direction that's too important to lose but would derail the current section — pin it:

```
📌 PINNED: [Question that surfaced mid-session — return after Section 8]
```

Return to all pinned questions at the end. These are typically the most revealing questions in the entire session because they emerged organically from the conversation rather than the template.

**Pinned questions typically add 8–18 more to the count.** This is what pushes the total from the base ~70 into the 80–100 range — and they're the questions that matter most.

---

### ⚡ Key Extractions — After Every Section, Not Just the End

After EVERY section — while Scott's exact words are still fresh — write a Key Extractions block:

```
### ⚡ Key Extractions from Section [N]
- [Locked decision or critical insight from this section]
- [Another one]
- [The thing Scott said that changed the direction]
```

This is the real-time decision log for the session. It feeds the final Synthesis. Do not wait until the end to synthesize — extract as you go.

---

### The Synthesis Block — The Session Becomes the Spec

After all 8 sections and all pinned questions are answered, write the SYNTHESIS:

```
## SYNTHESIS

### One-Paragraph Vision
[What this is. Written as if handing it to a new developer who has no context.
 One paragraph. Specific enough that there's no ambiguity about what gets built.]

### The Non-Negotiables
1. [Thing that must be true. No compromises.]
2. [Another one. Maximum 6–8 items.]

### Priority Stack
Phase 1: [What ships first — the minimum demo-able version]
Phase 2: [What comes second — what Phase 1 unlocks]
Phase 3: [What this grows into — the destination]
```

The Synthesis is the hand-off document. A code bot should be able to open it and execute Phase 1 without asking a single clarifying question.

---

### Format Variants by Product Type

The 8-section template is universal. The variant is which Section 3 (Core Vision) questions dominate:

| Product Type | Section 3 Emphasis | Typical Total |
|---|---|---|
| AI tool / personal brain | Personality, Council, voice, what "alive" means | 85–95 |
| Course / curriculum product | Content structure, output quality, learner experience | 80–90 |
| Data / ops tool | The insight layer, what triggers what, alert logic | 75–85 |
| Commerce / store tool | Feature-by-feature Q&A (10 Qs per feature area) | 60–80 |
| New repo from scratch | All 8 sections, heavier Section 7 north star | 90–100 |

---

## Non-Negotiable Security Gates

These are checked before any feature ships. No exceptions.

### Student Data Protection
> **Applies if this repo handles student or minor data.**

- ALL student content routes through `src/lib/ai/student-safe-completion.ts` — no direct SDK calls
- No Groq, no consumer AI products with student content — Anthropic API, OpenAI API, Azure AI only
- Anonymize before every AI call — no names, no `child_id`, no PII in prompts
- Children under 13 cannot self-register — parent creates account → child profile → child login

### Multi-Tenancy
> **Applies if this repo uses Supabase with per-user data isolation.**

- `user_id UUID REFERENCES auth.users(id) NOT NULL` on every new table, every time, no exceptions
- RLS policy on every new table: `USING (auth.uid() = user_id)`
- The migration pattern for existing tables:
```sql
ALTER TABLE [table_name] ADD COLUMN user_id UUID REFERENCES auth.users(id);
-- Backfill: set all existing rows to the primary user's user_id
-- Update existing RLS policies to: USING (auth.uid() = user_id)
```

### SSRF Prevention
- All server-side URL fetching must validate against an allowed domain list OR implement SSRF protection
- Never allow arbitrary requests to internal network addresses (169.254.x.x, 10.x.x.x, 172.16-31.x.x, 127.x.x.x)
- URL validation before any `fetch()` call in an API route

### Prompt Injection Defense
- Scan user inputs for data exfiltration patterns and privilege escalation attempts before passing to any AI
- Check both the user's original prompt AND generated tool arguments
- Log governance violations — never silently drop them

### No Secrets in Code
- Environment variables only — never hardcoded keys, tokens, or credentials
- `.env.local` is the floor. Production secrets go in Railway/Vercel env vars, never in code.

---

## Legacy Code Rules

When you encounter legacy code:
1. **Do not delete it** — mark with a comment: `// LEGACY: [what it does] — [why it's deprecated] — architecture reference only`
2. **Do not build new features on it** — use it to understand the pattern, build the new thing fresh
3. **Document what was migrated and where** — e.g. "The Curriculum Factory has been migrated to SomersSchool/CoursePlatform"

If code is marked LEGACY in a CLAUDE.md or comment, read it for architecture patterns only. Do not extend it.

---

## Database Migration Discipline

Every schema change:
- Gets its own migration file with a timestamp prefix
- Includes the backfill step for existing rows (never leave null where NOT NULL is the eventual state)
- Includes the RLS policy update if the table has multi-tenant requirements
- Is backward-compatible — the app must still run on the old schema until the migration is applied

Never run destructive migrations (DROP COLUMN, DROP TABLE) without an explicit instruction from Scott. Propose them. Don't execute them.

---

## Streaming & API Architecture

- SSE over WebSockets for all streaming. Always.
- Typed SSE events, not raw text chunks:
  ```
  { type: "text", delta: "..." }
  { type: "tool_start", name: "...", input: {...} }
  { type: "tool_result", name: "...", output: {...} }
  { type: "council_turn", persona: "Gandalf", delta: "..." }
  { type: "done" }
  ```
- Every streaming upgrade must be backward-compatible — unrecognized event types fall back gracefully
- Context/system prompts belong in the DB (`context_files` table pattern), not hardcoded in route files
- API Keys scope: ElevenLabs keys are scoped per project — never reuse a key across products

---

## The Batch Size Law

When an agent task fails, the first question is: **"Is this batch too large?"**

Cut the batch in half before changing the prompt. If it still fails with a smaller batch, then change the prompt.

This applies to:
- AI generation loops (curriculum, briefs, research)
- DB migration runs
- Worker job dispatches
- Any multi-file refactor

---

## Backward Compatibility

The app ships to real users (Scott, Anna, students). Breaking changes need a migration path:
- Never remove a DB column — mark as deprecated, migrate data, then remove in a second pass
- Never change an API response shape without versioning or a fallback
- Never rename a Supabase table without a migration that handles the rename atomically

---

## Context Architecture

- System prompts and AI context documents belong in the DB, not in route files
- The pattern is `context_files` table → `buildLiveContext()` → system prompt
- Editing AI behavior happens through the UI or DB, not through deploys
- Context depth is the highest-ROI improvement to any AI feature — the brief AI knowing Scott's actual business is more valuable than any new feature

---

## Anti-Hallucination Standard

For any AI output that makes factual claims (Intel briefs, research summaries, opportunity analysis):
- Every factual claim must be traceable to a source URL
- Claims that can't be traced get flagged with ⚠️, not silently included
- This is non-negotiable — a hallucinated competitor metric is worse than no metric

---

## Know Your Workspace Purpose

Every workspace has a job. Know which one you're in before you start.

- **Strategy / Dream Floor workspaces** — for thinking: brainstorming, planning, documentation, decision logging, context preservation, Council sessions. Do not implement features here.
- **Build workspaces** — for executing: scaffolding, migrations, API routes, shipping features. Open the right repo in VS Code and build there.

When work needs to happen in a repo, open that repo in VS Code and build there. Keep the thinking and the building in their own lanes.

---

## Council of the Unserious — When to Invoke

For architecture decisions, product direction, or curriculum design — run the full Council:

1. **Gandalf** — creates from zero, frames the approach
2. **Data** — audits, finds gaps, asks the devastating question
3. **Polgara** — finalizes, makes it serve the actual child/user
4. **Earl** — cuts it to what ships Tuesday
5. **Silk** — breaks the pattern, names the uncomfortable truth, finds the critical path nobody named

For routine coding tasks (bug fix, adding a column, wiring a webhook) — skip the Council. Ship it.

---

## Repo-Specific Context

This instruction file applies globally. Each repo also has its own `CLAUDE.md` with repo-specific rules. When there's a conflict, the repo's `CLAUDE.md` wins for that repo.

**When you open a new repo:** Read its `CLAUDE.md` first. That file contains the rules that override anything in this document. If no `CLAUDE.md` exists yet, run `/init` in Claude Code to scaffold one.

---

*Last updated: March 23, 2026. Generalized for use across all workspaces: removed email-workspace-specific paths from Step 1 and Step 5; wrapped Student Data Protection and Multi-Tenancy as conditional gates; replaced Dream Floor Rule with general workspace purpose principle; removed live repo list (that belongs in CLAUDE.md). Source of truth: `email/reference/WORKSPACES/scott-dev-process.instructions.md`.*
