# Email Workspace Handoff — Context & Persona Update Request

> **From:** Chapterhouse workspace (verified audit, July 2025)
> **To:** Email workspace Copilot session
> **Purpose:** Ensure all context files that Chapterhouse pulls from are current with the latest Council persona evolution, dream seeds, and extended context.

---

## What Scott Wants

Scott needs the following files in the email workspace reviewed and refreshed with the most current content — especially Council persona evolution. These files feed into Chapterhouse through two sync pipelines, and stale content here means stale context in every Chapterhouse chat and Council session.

---

## Files That Need Review & Update

### 1. `.claude/agents/gandalf.md`
### 2. `.claude/agents/data.md`
### 3. `.claude/agents/polgara.md`
### 4. `.claude/agents/earl-harbinger.md`
### 5. `.claude/agents/silk.md`

**Why these matter:** These 5 persona files get pushed to the `scott-brain` GitHub repo via `SYNC-BRAIN.bat`, then pulled by Chapterhouse's `/api/brain/sync` route into `context_files` as `brain_persona_gandalf`, `brain_persona_data`, `brain_persona_polgara`, `brain_persona_earl`, `brain_persona_silk`. The Council chat route loads these at runtime and **appends them** (up to 3KB each) to each member's hardcoded system prompt with a `"Additional persona depth from Scott's living documentation"` prefix.

**What to check:**
- Do these files reflect the latest character voice evolution from recent sessions?
- Is Silk's persona fully developed (replaced B&B in March 2026)?
- Are the relationship dynamics current (Gandalf↔Polgara father-daughter, Silk↔Polgara productive conflict, Data's observation cataloging, Earl's operational shorthand with Silk)?
- Are the situational behaviors documented (what each member does when things go well, go wrong, when Scott pushes back, when something moves them)?
- Do the files reference the full 5-layer persona structure from `council-personas.instructions.md` (Core Identity → Situational Behavior → Living Relationships → What They Actually Care About → Extended Dialogue)?

**The canonical deep reference** is `.github/instructions/council-personas.instructions.md` in any workspace that has it. The `.claude/agents/*.md` files should be the condensed-but-faithful versions that travel through the sync pipeline.

### 6. `dreamer.md`

**Why it matters:** Pushed to Chapterhouse via `PUSH-ALL.bat` → `push_to_chapterhouse.mjs` → `/api/context/push` (stored as `dreamer` in `context_files`, inject_order 2). Also pushed to `scott-brain` repo via `SYNC-BRAIN.bat` → fetched by `/api/brain/sync` (stored as `brain_dreamer`, inject_order 2).

**What to check:**
- Are all 60+ SEEDs current with correct status (seed/active/building/shipped)?
- Are collision maps up to date?
- Have any new seeds been identified in recent sessions that aren't recorded here?
- Are the repo statuses in the registry current (especially hot repos: chapterhouse, CoursePlatform, NextChapterHomeschool, nchocopilot)?

### 7. `reference/COPILOT-EXTENDED-CONTEXT.md`

**Why it matters:** Pushed to Chapterhouse via `PUSH-ALL.bat` → stored as `extended_context` in `context_files` (inject_order 3). This is the deep business context that feeds every chat and Council session.

**What to check:**
- Are all three business tracks current (NCHO status, SomersSchool pricing/architecture, BibleSaaS Phase 27)?
- Are pending actions up to date (currently 39 items)?
- Are tool evaluations current?
- Has any intel from recent sweeps not been reflected here?

---

## How The Sync Pipelines Work (Architecture Summary)

Chapterhouse has **two separate sync mechanisms** — both need to run after updates:

### Pipeline 1: Direct Push (`PUSH-ALL.bat`)
```
email workspace → PUSH-ALL.bat
  → node tools/push_to_chapterhouse.mjs --doc all
    → POST https://chapterhouse.vercel.app/api/context/push
      → Pushes: dreamer, extended_context, latest intel
      → Stored in: context_files table (deactivate-old, insert-new)
      → Injected into: every chat and Council system prompt via getSystemPrompt()
```

### Pipeline 2: Brain Sync (`SYNC-BRAIN.bat`)
```
email workspace → SYNC-BRAIN.bat
  → git add/commit/push to TheAccidentalTeacher/scott-brain
  → curl POST https://chapterhouse.vercel.app/api/brain/sync
    → Fetches from GitHub API:
      - .github/copilot-instructions.md → brain_master_context (inject_order 1)
      - dreamer.md → brain_dreamer (inject_order 2)
      - .claude/agents/gandalf.md → brain_persona_gandalf (inject_order 10)
      - .claude/agents/data.md → brain_persona_data (inject_order 11)
      - .claude/agents/polgara.md → brain_persona_polgara (inject_order 12)
      - .claude/agents/earl-harbinger.md → brain_persona_earl (inject_order 13)
      - .claude/agents/silk.md → brain_persona_silk (inject_order 14)
      - Latest intel sweep from intel/ folder
    → Council route loads brain_persona_* at runtime
    → Appends to each member's hardcoded system prompt (3KB cap per persona)
```

### How Persona Overrides Work in Chapterhouse

The Council chat route (`/api/chat/council/route.ts`) does this:
1. Loads all `brain_persona_*` entries from `context_files` where `is_active = true`
2. Strips the `brain_persona_` prefix to get the member name
3. Truncates each to 3KB
4. When building each member's system prompt, appends:
   ```
   ---
   Additional persona depth from Scott's living documentation:
   [contents of brain_persona_[member] from context_files]
   ```
5. This means the `.claude/agents/*.md` files are the **living persona augmentation layer** — they don't replace the hardcoded prompts, they enrich them.

---

## After Updating — What Scott Needs To Run

1. **Update all 7 files listed above** in the email workspace
2. **Run `SYNC-BRAIN.bat`** from Desktop — pushes to GitHub, triggers brain sync (handles persona files + master context + dreamer)
3. **Run `PUSH-ALL.bat`** from Desktop — pushes dreamer + extended context + intel directly to Chapterhouse API
4. Both pipelines need to run because they push different file sets through different mechanisms

---

## Verification Already Done (Chapterhouse Side)

The Chapterhouse workspace has been fully audited. Confirmed:

- ✅ `/api/brain/sync/route.ts` correctly fetches all 5 persona files from `scott-brain` repo
- ✅ `/api/context/push/route.ts` correctly receives dreamer + extended context
- ✅ Council route loads `brain_persona_*` overrides and appends to system prompts (3KB cap)
- ✅ All 5 Council members present in Council route: Gandalf, Data, Polgara, Earl, Silk
- ✅ Models correct: Gandalf/Data/Polgara = claude-sonnet-4-6, Earl = gpt-5.4, Silk = gpt-5-mini
- ✅ Silk is live in chat endpoints (replaced B&B)
- ✅ B&B retained ONLY in worker curriculum factory as LEGACY (intentional for kid-engagement testing)
- ✅ No code changes needed on Chapterhouse side

**The only action required is on the email workspace side: make sure the source files are current, then run both batch files.**

---

*Generated by Chapterhouse workspace audit, July 2025.*
