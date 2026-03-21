// push-log.ts — Session history, committed with the codebase.
// Imported at build time so chat ALWAYS has the current session history.
// Update this file each session before committing.
// Injected into buildLiveContext() as "## App Session History" block.

export const PUSH_LOG = `## Chapterhouse — Session History (Recent)

### Session 23 — March 23, 2026
Live assistant upgrade. Push log injected into buildLiveContext() (this file — always current). Email intent detection: user asks "do I have new emails?" → live query of emails table → results injected as context. Dismiss signals: /dismiss [topic/reason] command in chat immediately stores to founder_notes (category: dismissed) and returns confirmation. Natural-language dismiss detection added to extract-learnings (GPT-5.4 detects "ignore/irrelevant/not worried about" patterns → category dismissed). Dismissed signals block injected into every chat context so AI knows what to filter. Brief generation now reads dismissed founder_notes and instructs Claude: "DO NOT SURFACE these dismissed topics." /api/dismiss-signal route (POST store / GET list / DELETE un-dismiss). debug-panel.tsx: App Map tab now shows Dismissed Signals panel with un-dismiss buttons.

### Session 22 — March 22, 2026
App self-diagnosis system. APP_ARCHITECTURE_BLOCK constant (all 22 pages, all API routes, key source files, Supabase tables, Railway worker) injected as first block in buildLiveContext() for both solo chat and Council routes — chat can now answer "where does X live?" questions about Chapterhouse itself. /api/debug/route.ts extended with 4 new check groups: QStash (live API ping), Railway worker (/health ping), and 18 env-var presence checks covering all services. /api/debug/app-map/route.ts — new route, 23-feature FEATURE_REGISTRY evaluated against env vars at request time, returns {available, partial, unavailable} with missing env var lists. debug-panel.tsx: 4th "App Map" tab added showing feature cards color-coded by availability, search input, filter buttons. Commit 30b39c9.

### Session 21 — March 21, 2026
Council of the Unserious synthesis in Intel reports. COUNCIL_SYNTHESIS_PROMPT added to processIntelUrls() in /api/intel/route.ts — Step 4 after Haiku verification pass: Claude Sonnet 4.6 generates voiced commentary from all 5 Council members on verified Intel findings. council_synthesis stored on IntelOutput. CouncilSynthesisBlock component in intel/page.tsx renders each member in a colored bordered card (Gandalf=amber, Data=blue, Polgara=emerald, Earl=orange, B&B=zinc). "⚔ Council Briefing" block between summary and structured sections. Non-fatal — Intel report still saves if synthesis fails.

### Session 20 — March 20, 2026
Intel→chat context wiring + full email AI pipeline (Phase 8). buildLiveContext() now queries intel_sessions last 48h and injects top A+/A signals into every chat. Daily brief cron Stage 3: after brief generates, fire-and-forgets POST /api/intel with brief content — brief flows through Intel's analysis pass. Migration 019: emails table with uid, subject, from/to, snippet, full body, category CHECK, ai_summary, action_required, urgency, search_vector TSVECTOR GENERATED ALWAYS, GIN index, Realtime. /api/email/sync (IMAP → Supabase, 30 days, dedup by UID, 50/call). /api/email/categorize (Haiku batch, 10 at a time). /api/email/search (TSVECTOR + category filter, paginated). /api/cron/email-digest (midnight UTC: sync→categorize→Sonnet digest→saves to context_files inject_order=5). email-inbox.tsx: Live/AI view toggle, AI view with category tabs + urgency dots + action_required red pulse + Sync & Categorize button.

### Session 19 — March 19, 2026
UI cleanup + gold/amber color scheme. System Status collapsible in left sidebar. Right column removed — layout is now 2-column [280px minmax(0,1fr)]. Full gold/amber scheme across 19 files: dark bg #0e0b02, accent #D4A80E dark / #8B5E00 light. All purple/blue hardcoded Tailwind classes → amber throughout. B&B persona dot + thread badge intentionally left purple. Action buttons on amber use text-zinc-900. Commits: d873472, a3a0658, 375de6e.

### Session 18 — March 19, 2026
Phase 3 Intel complete. Migration 018: intel_sessions + intel_categories tables with Realtime. 5 API routes. /intel page: split layout, New Session modal (1–20 URLs), PW Report modal (paste textarea), Realtime status updates, auto-seeds to dreams table. Daily cron 04:00 UTC fetching 5 watch sources. Council Sonnet synthesis pass on findings. Globe icon in nav. Commit 5bd251d.

### Session 17 — March 19, 2026
Phase 2 Dreamer System complete. Migration 017: dream_status enum, dreams table (RLS + Realtime), dream_log table. 6 API routes. /dreamer: Kanban board (Seeds/Active/Building/Shipped), ArchiveDrawer, AddDreamForm, Earl AI review (suggest-only). 48 seeds pre-loaded from dreamer.md. 4 Building repos + 9 Active repos inserted. Commit e0cde31.

### Session 16
Multi-document Context Brain (Phase 1.1). Migration 016: document_type + inject_order on context_files. getSystemPrompt() assembles all active docs in inject_order. Four named slots. /api/context/push push endpoint. Context Brain UI redesigned. Push tools: PUSH-DREAMER.bat, PUSH-ALL.bat, tools/push_to_chapterhouse.mjs. Email inbox IMAP fix: TLS rejectUnauthorized + socket timeout. Commits: c7d3413, 43b7790.

### Session 14 — March 17, 2026
Contract-clean Pipeline Handoff JSON + code audit. CANONICAL_SUBJECT_LABELS map. schema_version + generated_by guaranteed in post-extraction fixup. Earl (Pass 4) → GPT-5.4, Beavis (Pass 5) → gpt-5-mini via callWithOpenAI(). scope-sequence/ela-g1.json sample. CCSS-M → CCSS-Math. Railway TS build fix (TS18048 forEach narrowing). Commits: b35246e, 119279a.

### Session 13 — March 16, 2026
Phase 7 Brief Intelligence Upgrade. Full context injection into brief generation. Collision scoring: Claude Haiku 4.5 scores each item ncho/somersschool/biblesaas (0–3). Items scoring ≥2 on 2+ tracks get collision_note. ⚡ Collisions section pinned at top of daily brief page. Phase 7.1: daily.dev 5-feed integration (foryou/popular/anthropic/security/nextjs). Turbopack build fix for council-chamber-viewer.tsx (parseOutput() module-level opaque type boundary + !! JSX guards). chapterhouse-test-checklist.html interactive 182-item checklist.`;
