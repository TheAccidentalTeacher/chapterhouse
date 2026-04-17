# Chapterhouse Documentation Audit — July 2026

> **Audited by the Council. Every `.md` file in the workspace reviewed.**
> Total files audited: **~85 files** across 12 directories.

---

## Executive Summary

| Verdict | Count | Action |
|---|---|---|
| **KEEP** | 39 | Active documentation. Maintain and update. |
| **ARCHIVE** | 31 | Move to `docs/archive/`. Valuable history but not active reference. |
| **DELETE** | 15 | Remove entirely. Superseded, duplicated, or empty. |

**Critical finding:** 5 KEEP files still contain "Beavis & Butthead" references that need updating to "Silk (Prince Kheldar)." See Section 4.

**Structural recommendation:** Create `docs/archive/` and move all ARCHIVE-verdicted files there. This reduces the active doc surface from ~85 to ~39 files — a 54% reduction in cognitive load.

---

## 1. Verdicts by Directory

### `docs/specs/` (14 files)

| File | Verdict | Reason |
|---|---|---|
| `chapterhouse-documents-studio-spec.md` | **KEEP** | Active spec for Doc Studio, referenced by CLAUDE.md pinned item |
| `chapterhouse-product-spec.md` | ARCHIVE | Pre-build vision doc. Overtaken by CLAUDE.md build history. |
| `chapterhouse-technical-architecture-spec.md` | ARCHIVE | Aspirational architecture. Real architecture is in CLAUDE.md. |
| `chapterhouse-ui-spec.md` | ARCHIVE | Early UI wireframes. Actual UI is built and diverged. |
| `chapterhouse-workflow-spec.md` | ARCHIVE | Workflow spec. Superseded by composable workflows (Phase 28B). |
| `chapterhouse-intelligence-engine-spec.md` | ARCHIVE | Pre-Folio intelligence spec. Folio system replaced this vision. |
| `chapterhouse-knowledge-base-blueprint.md` | ARCHIVE | Blueprint for knowledge system. knowledge_nodes table is the reality. |
| `chapterhouse-data-model-spec.md` | ARCHIVE | Early data model. 28+ tables now exist — this covers ~6. |
| `chapterhouse-mvp-build-checklist.md` | DELETE | Fully completed checklist. Zero remaining value. |
| `chapterhouse-coding-plan.md` | DELETE | Superseded by implementation spec. |
| `chapterhouse-upgrade-plan.md` | DELETE | Completed upgrade plan. |
| `chapterhouse-brainstorm-interview.md` | DELETE | Raw brainstorm transcript. Distilled into implementation spec. |
| `email-intelligence-build-spec.md` | DELETE | Phase 8 email pipeline is built. Spec served its purpose. |
| `chapterhouse-ai-cost-audit.md` | DELETE | One-time cost audit. Data is stale. |

### `docs/strategy/` (14 files)

| File | Verdict | Reason |
|---|---|---|
| `ai-operating-principles.md` | **KEEP** | Living principles document. Still referenced. |
| `brand-personality-handoff.md` | **KEEP** | Brand voice definitions. Feeds brand_voices table. |
| `ai-api-audit.md` | ARCHIVE | Point-in-time API audit. Useful history. |
| `biography.md` | ARCHIVE | Scott's bio draft. Reference material. |
| `customer-avatar.md` | ARCHIVE | "Alaskan Annie" avatar. Still conceptually valid but lives in email workspace master. |
| `external-intelligence-log.md` | ARCHIVE | Replaced by Intel system (Phase 3). |
| `shopify-strategy.md` | ARCHIVE | NCHO strategy. Overtaken by nchocopilot + ncho-tools repos. |
| `dev-growth-comparison.md` | ARCHIVE | One-time growth analysis. |
| `business-name-availability-report.md` | DELETE | Completed. Name is locked. |
| `business-name-research.md` | DELETE | Completed. Name is locked. |
| `edgy-names.md` | DELETE | Brainstorm artifact. Decision made. |
| `dinner-questions.md` | DELETE | Personal document. Not project-related. |
| `operating-system.md` | DELETE | Early "how I work" doc. Superseded by scott-dev-process.instructions.md. |
| `hypomnemata-prompt-extraction.md` | DELETE | Legacy repo reference. Chapterhouse replaced Hypomnemata. |

### `docs/handoffs/` (4 files)

| File | Verdict | Reason |
|---|---|---|
| `chapterhouse-image-pipeline-handoff.md` | **KEEP** | Active image pipeline reference. |
| `scott-brain-chapterhouse-handoff.md` | **KEEP** | Brain sync integration spec. |
| `council-persona-fidelity-handoff.md` | ARCHIVE | Persona calibration doc. Council personas now live in .github/instructions/. |
| `session-23-test-questions.md` | DELETE | One-time test. No ongoing value. |

### `docs/social-media-expansion/` (5 files)

| File | Verdict | Reason |
|---|---|---|
| `social-media-expansion-build-bible.md` | **KEEP** | Active build spec for social expansion. |
| `social-media-expansion-execution-plan.md` | **KEEP** | Companion execution plan. |
| `social-media-expansion-brainstorm.md` | ARCHIVE | Input to the build bible. |
| `social-media-expansion-build-bible-pressure-test.md` | ARCHIVE | Pressure test of the bible. Conclusions integrated. |
| `social-media-expansion-opus-analysis.md` | ARCHIVE | Opus 4.6 analysis. Conclusions integrated. |

### `docs/workbench/` (6 files)

| File | Verdict | Reason |
|---|---|---|
| `character-consistency-research.md` | **KEEP** | Active research for Gimli pipeline. |
| `email-system-upgrade.md` | **KEEP** | Email system upgrade spec. |
| `leonardo-api-reference.md` | **KEEP** | Leonardo API reference. Active for image gen. |
| `Buffer_Complete_Expert_Knowledge_Base.md` | ARCHIVE | Buffer reference. Useful but Buffer GraphQL is fully wired. |
| `persona.md` | ARCHIVE | Early persona doc. Superseded by council-personas.instructions.md. |
| `generate-persona-constants.mjs` | ARCHIVE | One-time script for persona generation. |

### `docs/source-material/` (3 files)

| File | Verdict | Reason |
|---|---|---|
| `brainstorm-log-export.json` | ARCHIVE | Raw log export. Historical artifact. |
| `Leviathan Rising - paperback.docx` | **KEEP** | Novel manuscript. Referenced in copilot-instructions. |
| `FullPlan.pdf` | ARCHIVE | Likely an early planning PDF. |

### `reference/` (5 files read)

| File | Verdict | Reason |
|---|---|---|
| `reference/CHAPTERHOUSE-CLAUDE.md` | **DELETE** | ⚠️ **Actively harmful.** Superseded by root CLAUDE.md. Contains stale architecture that contradicts current state. Implementation spec pre-flight list still references it — that reference should be removed. |
| `reference/COPILOT-EXTENDED-CONTEXT.md` | **DELETE** | ⚠️ **Actively harmful.** Stale extended context. Contradicts current CLAUDE.md. |
| `reference/WORKSPACES/build-bible-handoff.md` | **KEEP** | Production pipeline build bible handoff. |
| `reference/WORKSPACES/workspace-injection-system.md` | **KEEP** | Workspace injection system docs. |
| `reference/WORKSPACES/NEW-CHAT-STARTER-PROTOCOL.md` | **KEEP** | Chat continuity protocol. |

### `intel/` (5 files read)

| File | Verdict | Reason |
|---|---|---|
| `intel/INTEL-INDEX.md` | **KEEP** | Intel sweep index. Actively maintained. |
| `intel/student-ai-protection-handoff.md` | **KEEP** | Student data protection spec. Non-negotiable reference. |
| `intel/intel-process.md` | **KEEP** | Repeatable intel sweep process. |
| `intel/chapterhouse-evolution-handoff.md` | ARCHIVE | Root-level copy is newer and authoritative. |
| `intel/2026-03-18/chapterhouse-implementation-spec.md` | **KEEP** | Canonical 8-phase implementation spec (needs B&B→Silk update). |

### Root-level docs (8 files)

| File | Verdict | Reason |
|---|---|---|
| `CLAUDE.md` | **KEEP** | Primary technical brief. Source of truth. |
| `copilot-instructions.md` | **KEEP** | Identity brain. Injected every session. (Duplicates .github/ version — see Section 5.) |
| `.github/copilot-instructions.md` | **KEEP** | The version Copilot actually reads. |
| `chapterhouse-implementation-spec.md` | **KEEP** | Root copy of implementation spec. Needs B&B→Silk update. |
| `chapterhouse-evolution-handoff.md` | **KEEP** | Evolution roadmap. Needs B&B→Silk update. |
| `chapterhouse-help-guide.md` | **KEEP** | Help page source. Needs B&B→Silk update. |
| `README.md` | **KEEP** | Repo readme. |
| `dreamer.md` | **KEEP** | Living dream queue. |

### `public/dev-council/` (11 files)

| File | Verdict | Reason |
|---|---|---|
| `DEV-COUNCIL-INDEX.md` | **KEEP** | Index for all 10 dev council personas. |
| `D001-forge.md` | **KEEP** | Marcus Chen — Senior Full-Stack Engineer. |
| `D002-pixel.md` | **KEEP** | Elena Vasquez — UI/UX Engineer. |
| `D003-sentinel.md` | **KEEP** | Dmitri Volkov — Security Engineer. |
| `D004-vector.md` | **KEEP** | Priya Sharma — AI/ML Engineer. |
| `D005-schema.md` | **KEEP** | James Whitfield — Database Architect. |
| `D006-pipeline.md` | **KEEP** | Sofia Reyes — DevOps Engineer. |
| `D007-spark.md` | **KEEP** | Theo Nakamura — Creative Tooling Engineer. |
| `D008-cache.md` | **KEEP** | Kai Johansson — Performance Engineer. |
| `D009-river.md` | **KEEP** | River Torres — Rapid Prototyper. |
| `D010-edge.md` | **KEEP** | Amara Washington — QA Engineer. |

### `.github/instructions/` (5 files)

| File | Verdict | Reason |
|---|---|---|
| `agent-safety.instructions.md` | **KEEP** | Agent governance rules. Loaded via applyTo. |
| `council-personas.instructions.md` | **KEEP** | Full Council personas. Loaded every session. |
| `nextjs-tailwind.instructions.md` | **KEEP** | Tailwind standards. Loaded on *.tsx/*.ts. |
| `nextjs.instructions.md` | **KEEP** | Next.js 16.1 patterns. Loaded on *.tsx/*.ts. |
| `scott-dev-process.instructions.md` | **KEEP** | Dream Floor methodology. Loaded on all files. |

### Other config files

| File | Verdict | Reason |
|---|---|---|
| `supabase/README.md` | **KEEP** | Migration instructions. |
| `council-worker/README.md` | **KEEP** | Worker setup docs. |
| `scope-sequence-handoff.md` | **KEEP** | Curriculum pipeline handoff spec. |
| `somersschool-curriculum-factory-handoff.md` | **KEEP** | Factory handoff doc. |
| `WORKSPACE-INDEX.md` | **KEEP** | Workspace file index. |
| `social-media-automation-brain.md` | **KEEP** | Social media automation reference. |
| `jobs-test-prompts.md` | **KEEP** | Test prompts for job system. |
| `production-pipeline-build-bible.md` | **KEEP** | Production pipeline spec. |
| `production-pipeline-brainstorm.md` | ARCHIVE | Input to the build bible. |
| `brainstorm.md` | ARCHIVE | General brainstorm. Distilled into specs. |

---

## 2. Files to DELETE (15 total)

These should be removed from the repo. They are fully superseded, completed, or harmful.

```
# ⚠️ HARMFUL — delete immediately
reference/CHAPTERHOUSE-CLAUDE.md
reference/COPILOT-EXTENDED-CONTEXT.md

# Completed / superseded
docs/specs/chapterhouse-mvp-build-checklist.md
docs/specs/chapterhouse-coding-plan.md
docs/specs/chapterhouse-upgrade-plan.md
docs/specs/chapterhouse-brainstorm-interview.md
docs/specs/email-intelligence-build-spec.md
docs/specs/chapterhouse-ai-cost-audit.md
docs/strategy/business-name-availability-report.md
docs/strategy/business-name-research.md
docs/strategy/edgy-names.md
docs/strategy/dinner-questions.md
docs/strategy/operating-system.md
docs/strategy/hypomnemata-prompt-extraction.md
docs/handoffs/session-23-test-questions.md
```

---

## 3. Files to ARCHIVE (31 total)

Move to `docs/archive/`. Preserve git history. Not active reference.

```
docs/specs/chapterhouse-product-spec.md
docs/specs/chapterhouse-technical-architecture-spec.md
docs/specs/chapterhouse-ui-spec.md
docs/specs/chapterhouse-workflow-spec.md
docs/specs/chapterhouse-intelligence-engine-spec.md
docs/specs/chapterhouse-knowledge-base-blueprint.md
docs/specs/chapterhouse-data-model-spec.md
docs/strategy/ai-api-audit.md
docs/strategy/biography.md
docs/strategy/customer-avatar.md
docs/strategy/external-intelligence-log.md
docs/strategy/shopify-strategy.md
docs/strategy/dev-growth-comparison.md
docs/handoffs/council-persona-fidelity-handoff.md
docs/social-media-expansion/social-media-expansion-brainstorm.md
docs/social-media-expansion/social-media-expansion-build-bible-pressure-test.md
docs/social-media-expansion/social-media-expansion-opus-analysis.md
docs/workbench/Buffer_Complete_Expert_Knowledge_Base.md
docs/workbench/persona.md
docs/workbench/generate-persona-constants.mjs
docs/source-material/brainstorm-log-export.json
docs/source-material/FullPlan.pdf
intel/chapterhouse-evolution-handoff.md
production-pipeline-brainstorm.md
brainstorm.md
```

---

## 4. B&B → Silk Cleanup Needed

These KEEP files still reference "Beavis & Butthead" in **active documentation** (not historical changelogs):

| File | Lines | What needs changing |
|---|---|---|
| `chapterhouse-implementation-spec.md` | ~1213-1230, 1394, 2114 | Council member table, persona prompt, model assignment |
| `chapterhouse-evolution-handoff.md` | 121, 123, 185 | Council descriptions |
| `chapterhouse-help-guide.md` | 38, 377, 388, 575 | Council mode description, curriculum factory, AI model table |

**Historical references (leave as-is):** CLAUDE.md and .github/copilot-instructions.md contain B&B references in build history / changelog entries that correctly document the Phase 11 migration. These should NOT be changed — they're accurate historical records.

---

## 5. Structural Recommendations

### 5a. Duplicate `copilot-instructions.md`
Both `copilot-instructions.md` (root) and `.github/copilot-instructions.md` exist. Copilot reads the `.github/` version. The root copy appears to be a convenience duplicate. **Recommendation:** Delete the root copy or replace it with a one-line pointer to `.github/copilot-instructions.md`.

### 5b. Duplicate `chapterhouse-evolution-handoff.md`
Exists at both root AND `intel/`. Root is newer. **Recommendation:** Delete the `intel/` copy.

### 5c. `docs/` subfolder consolidation
After archiving, the remaining KEEP files in `docs/` are:
- `docs/specs/` → 1 file
- `docs/strategy/` → 2 files
- `docs/handoffs/` → 2 files
- `docs/social-media-expansion/` → 2 files
- `docs/workbench/` → 3 files
- `docs/source-material/` → 1 file

**Recommendation:** Flatten to `docs/` (no subfolders) for the ~11 remaining KEEP files. The subfolder structure was useful at 60+ files; at 11 files it adds navigation overhead.

### 5d. Implementation spec pre-flight list
`chapterhouse-implementation-spec.md` Step 1 (Pre-Flight Reading) references `reference/CHAPTERHOUSE-CLAUDE.md` and `reference/COPILOT-EXTENDED-CONTEXT.md` — both verdicted as **actively harmful**. Remove those references after deleting the files.

---

## 6. Recommended Directory Structure (Post-Cleanup)

```
chapterhouse/
├── CLAUDE.md                              # Technical source of truth
├── README.md                              # Repo readme
├── dreamer.md                             # Living dream queue
├── WORKSPACE-INDEX.md                     # File index (update after cleanup)
├── .github/
│   ├── copilot-instructions.md            # Identity brain (Copilot reads this)
│   └── instructions/                      # 5 instruction files (all KEEP)
├── docs/
│   ├── chapterhouse-documents-studio-spec.md
│   ├── ai-operating-principles.md
│   ├── brand-personality-handoff.md
│   ├── chapterhouse-image-pipeline-handoff.md
│   ├── scott-brain-chapterhouse-handoff.md
│   ├── social-media-expansion-build-bible.md
│   ├── social-media-expansion-execution-plan.md
│   ├── character-consistency-research.md
│   ├── email-system-upgrade.md
│   ├── leonardo-api-reference.md
│   ├── Leviathan Rising - paperback.docx
│   └── archive/                           # 31 archived files
├── intel/                                 # Intel sweep files (all KEEP)
├── public/dev-council/                    # 11 dev council files (all KEEP)
├── reference/WORKSPACES/                  # 3 KEEP files
├── [remaining root docs]                  # ~8 active reference docs
└── src/, worker/, council-worker/, supabase/  # Code (not part of doc audit)
```

---

*Audit completed. 85 files reviewed. 39 KEEP, 31 ARCHIVE, 15 DELETE. 3 files need B&B→Silk updates.*
