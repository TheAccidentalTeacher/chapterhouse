# Chapterhouse Workspace Index

This repo now separates active runtime files from grouped documentation.

Keep at root:
- `CLAUDE.md` — technical operating brief for the repo
- `README.md` — broad document index and project overview
- `copilot-instructions.md` — local context file
- `chapterhouse-implementation-spec.md` — active Chapterhouse build bible
- `production-pipeline-build-bible.md` — active production pipeline build bible
- `chapterhouse-evolution-handoff.md` — future-phase roadmap still referenced widely
- `chapterhouse-help-guide.md` — still referenced directly by app/help docs
- `dreamer.md` — active idea queue
- `scope-sequence-handoff.md` and `somersschool-curriculum-factory-handoff.md` — active pipeline contracts

Grouped folders:
- `reference/` — stable lookup docs like `reference/customer-avatar.md` and `reference/api-guide-master.md`
- `docs/strategy/` — founder, brand, naming, commerce, and operating docs such as `docs/strategy/ai-operating-principles.md`
- `docs/specs/` — non-root Chapterhouse specs and planning docs
- `docs/handoffs/` — secondary handoff docs not needed at root
- `docs/social-media-expansion/` — the whole social expansion doc cluster kept together
- `docs/workbench/` — prompts, checklists, and scratch build notes such as `docs/workbench/jobs-test-prompts.md`
- `docs/source-material/` — binary/source artifacts and exported logs
- `intel/` — dated research and canonical historical planning snapshots, including `intel/social-media-automation-brain.md` and `intel/scott-brain-chapterhouse-handoff.md`

Workspace hygiene:
- `.claude/worktrees/` is an active git worktree, not junk, but it is hidden in VS Code search/explorer to stop duplicate hits.
- `.next`, `node_modules`, and `dist` are hidden for the same reason.
- A full pre-cleanup backup exists outside the repo at `C:\Users\Valued Customer\OneDrive\Desktop\WEBSITES\_workspace-backups\chapterhouse-pre-cleanup-20260411-225458`.