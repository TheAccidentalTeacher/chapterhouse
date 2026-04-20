# Council Animation — Complete Build Plan

**Prepared:** 2026-04-19
**Scope:** Chat-as-unified-command-surface + visible agent work + member presence
**Estimated wall-clock:** 1 week (6 agent-shifts)
**Authorized:** Full autonomous execution, no check-ins unless blocked

Based on the Council Animation Research overnight run (120 exemplars, 10 build candidates). Top 2 shortlist items ship first, then the chat-invocation foundation, then feature migration.

---

## SHIFT 1 — Reasoning Trace Stream (Build Candidate #1)

**Goal:** When deep research runs, the user sees a live trace of what's happening, not a dead status line.

### 1a. Backend — augment deep research route
File: `src/app/api/research/deep/route.ts`
- Add event type `trace_step` alongside existing `phase` events
- Shape: `{ phase: "trace_step", step_type: "decompose"|"search"|"read"|"cross-reference"|"synthesize"|"compose", label, detail?, status: "active"|"complete" }`
- Emit at: receive query (decompose), search start, search done, synthesis start, synthesis done/compose
- Existing `phase` events stay intact for backward compatibility

### 1b. Frontend — ReasoningTrace component
File: `src/components/reasoning-trace.tsx` (new)
- Props: `steps: TraceStep[]`, `streaming: boolean`, `collapsed?: boolean`
- Renders vertical list with opacity/translateY transitions, active pulse, complete dim
- Thin progress bar at bottom
- Collapses/dims when streaming completes

### 1c. Wire into research page
File: `src/app/research/page.tsx`
- Replace line ~745 `{deepStatus && <p>…</p>}` with `<ReasoningTrace steps={deepTrace} streaming={deepSearching} />`
- Add `deepTrace` state, push trace steps as they arrive from SSE
- Keep `deepStatus` for fallback message display

### 1d. Commit + push

---

## SHIFT 2 — Member Speaking Presence (Build Candidate #2)

**Goal:** When one Council member speaks, the other four show presence without text — alive but quiet.

### 2a. MemberPresence component
File: `src/components/member-presence.tsx` (new)
- Props: `members: CouncilMemberInfo[]`, `currentSpeaker: string | null`
- Renders 5 member tokens in a horizontal bar: sigil + name + state indicator
- States: `idle` (dim), `thinking` (pulsing), `speaking` (bright), `done` (muted-check)
- Each member colored per their defined palette (Gandalf purple, Data blue, Polgara pink, Earl amber, Silk violet)

### 2b. Wire into chat-interface.tsx
- Render `<MemberPresence>` above the Council message stream during an active Council session
- Drive states from existing `activeCouncilMembers` + `currentSpeaker` state
- Hide when Council session completes

### 2c. Commit + push

---

## SHIFT 3 — Intent Detection Foundation

**Goal:** Chat detects feature-invocation intent in user messages and routes to the right pipeline.

### 3a. Intent classifier
File: `src/lib/intent-detection.ts` (new)
- Export `detectIntent(userMessage: string): Intent | null`
- Intent shape: `{ type: "deep_research"|"council_quick"|"doc_generate"|"social_generate"|"image_generate"|"voice_synth", confidence, params }`
- Regex + keyword scoring for v1 (AI classifier is v2)
- Patterns:
  - deep_research: `/research|investigate|look into|deep dive|find out about/i` + query noun
  - council_quick: `/council|get the council|ask the council|what does the council think/i`
  - doc_generate: `/write a|draft a|create a|generate a.*(doc|spec|brief|plan|report)/i`
  - social_generate: `/social post|instagram post|facebook post|write a post/i`
  - image_generate: `/generate.*(image|picture|illustration)|image of|picture of/i`

### 3b. Tool invocation card component
File: `src/components/tool-invocation-card.tsx` (new)
- Props: `intent: Intent`, `status: "detected"|"running"|"complete"|"error"`, `result?: unknown`
- Shows: feature icon, intent label, reasoning trace during run, result summary when done
- Borrows ReasoningTrace from Shift 1 for the running state

### 3c. Chat route integration
File: `src/app/api/chat/route.ts`
- After message validation, run `detectIntent(lastUserMsg)`
- If intent detected with confidence > threshold: emit a tool_invocation SSE event with the intent
- Execute the relevant feature (starting with deep_research as the first wired feature)
- Stream trace events back
- Emit final result event

### 3d. Chat frontend handling
File: `src/components/chat-interface.tsx`
- Handle new SSE events: `tool_invocation`, `trace_step`, `tool_result`
- Render ToolInvocationCard inline in the chat stream
- Insert card as a special message role `tool`

### 3e. Wire deep_research as the first invocable feature
- User types "research X for me" → chat detects intent → emits tool card → runs deep research SSE → renders trace → inserts result synthesis as final assistant message

### 3f. Commit + push

---

## SHIFT 4 — Expand Tool Invocation Surface

**Goal:** Add council_quick, doc_generate, social_generate to the invocable set.

### 4a. Council Quick intent
- Wire `/api/council/quick` as invocable from chat
- Intent detection already defined in 3a
- Card renders with 5-member presence + reasoning trace
- Final output streams as Council output messages

### 4b. Doc Generate intent
- Wire `/api/documents/generate` as invocable from chat
- User types "write a PRD for X" → card appears → doc generates → link to /doc-studio with doc pre-loaded
- Fallback to doc type detection in the router

### 4c. Social Generate intent
- Wire `/api/social/generate` as invocable from chat
- User types "write a social post about X for NCHO" → card → generates → inline preview
- Result inserts posts into review_queue, card shows "3 posts added to review queue" with link

### 4d. Commit + push

---

## SHIFT 5 — Remaining Feature Migration

**Goal:** Round out the invocable surface with image_generate, voice_synth, intel_fetch, folio_rebuild.

### 5a. Image Generate
- Wire `/api/images/generate` as invocable
- Card shows prompt enhancement step + generation trace
- Result: inline preview + save to library button

### 5b. Voice Synthesis
- Wire `/api/voice/synthesize` as invocable
- Card shows TTS generation + audio player inline

### 5c. Intel Fetch
- Wire `/api/intel` as invocable
- User types "run intel on X" → full 4-step Intel pipeline as trace → result link

### 5d. Folio / Focus / Dream queries
- Not new invocations — just ensure chat surfaces live data from these when asked
- Already partially built via `buildLiveContext()`

### 5e. Commit + push

---

## SHIFT 6 — Testing, Polish, Final Commit

### 6a. Manual smoke test
- Test each intent type end-to-end
- Verify reasoning trace animates correctly
- Verify member presence shows during Council
- Verify tool cards render with all states

### 6b. Fix any obvious issues surfaced in 6a

### 6c. Update CLAUDE.md build history with all six shifts

### 6d. Final commit + push

---

## Success Criteria

- [ ] Reasoning trace animates during deep research on `/research`
- [ ] Member presence bar shows during Council sessions on `/`
- [ ] Chat detects deep_research intent from natural language
- [ ] Chat detects council_quick intent
- [ ] Chat detects doc_generate intent
- [ ] Chat detects social_generate intent
- [ ] Chat detects image_generate intent
- [ ] Tool invocation cards render inline in chat stream
- [ ] All existing chat behavior unchanged when no intent detected
- [ ] CLAUDE.md updated
- [ ] All commits pushed, all deploys green

---

*Execution log appended below as shifts complete.*
