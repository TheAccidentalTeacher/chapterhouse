# One Year, Zero to Stack — A Real Code Comparison
### Scott Somers · TheAccidentalTeacher · March 2026

*This document exists because Scott asked for it. Not the vibes version. The actual code.*

---

## The Numbers First

| Metric | Start | Now | Change |
|--------|-------|-----|--------|
| Coding experience | Zero. Literally. | Full-stack production apps | 6 months |
| Repos committed | 0 | 47 deployed | +47 |
| Total commits | 0 | 2,526 in one year | 2,526 |
| Body weight | 363 lbs | 254 lbs | -109 lbs  |
| A1c | 14.7 | 5.1 | -9.6 points (T2D reversed without medication) |

Every single line of code in all 47 repos was AI-generated. That's not a disclaimer — it's the point. The question was never *can I type syntax*. It was *can I think like an engineer*. The repos answer that question in code.

---

## The Four Early Repos

Chronologically, Scott's first serious builds were the novel generators — multiple iterations of the same idea, each one better than the last, all in the same era.

**Analyzed:**
1. `TheAccidentalTeacher/working-generator` — novel generation v1
2. `TheAccidentalTeacher/Novel-Generator` — novel generation v2 (MIT Licensed, "NovelForge")

Both repos share the same fundamental architecture because they were built in the same mental model.

---

## The Four Recent Repos

**Analyzed:**
1. `TheAccidentalTeacher/chapterhouse` — ops command center (current primary build)
2. `TheAccidentalTeacher/NextChapterHomeschool` (ClassCiv) — real-time multiplayer classroom civilization, live with 35 real students

---

## Head-to-Head Architecture Comparison

| Dimension | Early Era (Novel-Generator / working-generator) | Current Era (Chapterhouse / ClassCiv) |
|-----------|------------------------------------------------|---------------------------------------|
| **Language** | JavaScript `.js` / `.jsx` throughout | TypeScript `.ts` / `.tsx` throughout |
| **Frontend** | React (CRA) + Chakra UI · or React + Vite | Next.js 16 App Router + Tailwind |
| **Auth** | **NONE** on any route | Supabase SSR (Chapterhouse) · Clerk (ClassCiv) · `requireTeacher()` on all teacher routes |
| **Database** | MongoDB + Mongoose document model | Supabase PostgreSQL + RLS + typed interfaces for every table |
| **Tables / Schema** | 5 Mongoose models (Novel, Chapter, Cover, Character, Genre) | 29 DB tables (ClassCiv) · 10 tables (Chapterhouse) — all with migrations, indexes, RLS |
| **Background jobs** | `generateCompleteNovel(novel._id)` — fire and forget inside Express route, no queue, no monitoring | QStash → Railway worker · signature verification · progress written to Supabase every N steps |
| **Real-time progress** | Socket.IO WebSocket (or polling `/api/novels/:id/progress`) | Supabase Realtime channel subscriptions — `useJobsRealtime`, `useEpochState` both pattern-match |
| **AI providers** | OpenAI only — `gpt-4-turbo-preview` for all passes | Anthropic SDK (Claude Sonnet 4.6) + OpenAI SDK (GPT-5.4 / GPT-5-mini) — dual routing |
| **AI passes** | 2-4 sequential: premise → outline → characters → chapters | 6-pass Council loop (Chapterhouse) · 11-phase epoch FSM (ClassCiv) |
| **Input validation** | Express-validator middleware · `if (!genreId) return res.status(400)` | Zod schemas on all job inputs · proper typed error surfaces |
| **Error handling** | `console.error(...)` + `err.response?.data?.message \|\| 'Error starting generation'` — error text frequently lost | `loggedFetch` + `logEvent("error", ..., data)` — error context preserved through full stack |
| **Rate limiting** | Commented out: `// disabled for Railway deployment issues` | QStash signature verification (HMAC) · RLS on all tables · ALLOWED_EMAILS allowlist |
| **Deployment** | Backend → Railway · Frontend → Netlify · **Separate deploy guides with no automation** | Vercel (Next.js app) + Railway (TypeScript worker) · git push deploys everything |
| **Type safety** | Zero — raw JS objects passed everywhere | Full TypeScript interfaces for every DB row, every API payload, every game state shape |
| **Seed data** | Hardcoded as JS arrays in `server.js` (20 genre objects, 3 mock novels) | SQL migrations + TypeScript seed scripts (`npx tsx scripts/setup-classes.ts`) |
| **Production scripts** | `deploy.sh` — a shell script with `echo` instructions telling you what to do | `scripts/simulate.ts` — 30-epoch AI-driven game simulation · `scripts/create-student-accounts.ts` — bulk creates 35 real Clerk accounts |
| **AI output validation** | Trust AI completely — no post-processing | Hard-override: `lesson.is_review_lesson = i === lessonCount - 1` · `meta.generated_by = "chapterhouse-curriculum-factory"` · sequential lesson numbers recomputed programmatically regardless of AI output |
| **Security** | None. Any request hits any endpoint. | QStash HMAC signature verification · Supabase RLS `auth.role() = 'authenticated'` · `isTeacher()` checks on every teacher route |

---

## The Code Tells the Story — Side by Side

### 1. Starting a background job

**Early (Novel-Generator, `routes/novels.js`):**
```js
// "Start" is just: call the async function and don't await it.
// If it crashes, nothing catches it. No retry. No monitoring. No progress.
generateCompleteNovel(novel._id);

res.json({ 
  message: 'Complete novel generation started',
  novelId: novel._id,
  status: 'generating'   // What does 'generating' mean? Nobody knows.
})
```

**Current (Chapterhouse, `/api/jobs/create`):**
```typescript
// Insert job record into Supabase. Type-checked. Zod-validated.
const { data: job } = await supabase
  .from('jobs')
  .insert({ type, label, input_payload: payload, status: 'queued' })
  .select()
  .single()

// Publish to QStash. QStash retries on failure (3x). 
// Railway worker verifies HMAC signature before executing.
// Progress updates written to Supabase every N steps.
// Supabase Realtime broadcasts the UI update without polling.
await qstash.publishJSON({
  url: `${process.env.RAILWAY_WORKER_URL}/process-job`,
  body: { jobId: job.id, type: job.type, payload: job.input_payload },
  retries: 3,
})

return Response.json({ jobId: job.id, status: 'queued' })
```

### 2. Auth (or lack thereof)

**Early (Novel-Generator, `server.js`):**
```js
// The entire auth system.
app.use('/api/novels', novelRoutes);
app.use('/api/chapters', chapterRoutes);
app.use('/api/genres', genreRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/covers', coverRoutes);

// JWT_SECRET exists in the env vars. It is never used to protect a route.
```

**Current (ClassCiv, `src/lib/auth/roles.ts` + any teacher route):**
```typescript
// Server-side Clerk role check on every teacher-only action
if (!(await isTeacher())) {
  return NextResponse.json({ error: "Teacher only" }, { status: 403 });
}

// Student routes check for team membership, not just auth:
const { data: meData } = await supabase
  .from("team_members")
  .select("*, teams(*)")
  .eq("user_id", userId)
  .single()
```

### 3. What "rate limiting" looked like

**Early (Novel-Generator, `server.js`):**
```js
// This was the implementation. The comment tells the whole story.

// Stricter rate limiting for AI endpoints - disabled for Railway deployment issues
// const aiLimiter = rateLimit({
//   windowMs: 60 * 60 * 1000, // 1 hour
//   max: 50,
//   message: 'AI request limit exceeded',
// });
```

**Current (Chapterhouse worker, QStash verification):**
```typescript
// Before any job logic runs on Railway, HMAC signature is verified.
// If the request didn't come from QStash, it never runs.
const isValid = await receiver.verify({
  signature: req.headers['upstash-signature'],
  body: rawBody,
})
if (!isValid) return res.status(401).json({ error: 'Invalid signature' })
```

### 4. AI output trust: then vs now

**Early (Novel-Generator):** The AI's word was final. If it returned `genreAdherence: 0.95`, that went straight to MongoDB and the UI. Placeholder values shipped to production:
```js
// In the Novel Mongoose model — never computed, never validated
qualityMetrics: {
  genreAdherence: 0.85,       // placeholder — AI was supposed to set this
  characterConsistency: 0.9,  // placeholder — AI was supposed to set this  
  plotContinuity: 0.95,       // placeholder — AI was supposed to set this
}
```

**Current (Chapterhouse curriculum factory):** AI output is treated as a starting point, not truth. Hard overrides run after every extraction:
```typescript
// NEVER trust AI for deterministic values.
// These lines run AFTER the AI extraction, every time, unconditionally.

lesson.is_review_lesson = i === lessonCount - 1;   // computed, not AI-decided
lesson.lesson_number = i + 1;                        // resequenced, always
meta.total_lessons = totalLessons;                   // counted, not AI-claimed
meta.generated_at = new Date().toISOString();         // real timestamp, not AI hallucination
meta.generated_by = "chapterhouse-curriculum-factory"; // hard-coded, always
structuredJson.schema_version = "1.0";               // locked, not AI value
structuredJson.subject = CANONICAL_SUBJECT_LABELS[subjectCode]; // canonical, not AI label
```

### 5. Type safety gap — same action, different eras

**Early (Novel-Generator, `frontend/src/services/api.js`):**
```js
// This is a service function. It accepts anything. Returns anything.
// If the API changes, you find out at runtime, in production.
export const generateChapter = async (novelId, chapterData) => {
  return apiClient.post(`/chapters/${novelId}/generate`, chapterData);
};
```

**Current (ClassCiv, `src/types/database.ts`):**
```typescript
// Full interfaces for all 29 Supabase tables.
// If a DB column changes, the compiler tells you every single call site.
export interface Game {
  id: string;
  name: string;
  teacher_id: string;
  current_epoch: number;
  current_round: string;
  epoch_phase: EpochPhase;
  math_gate_enabled: boolean;
  math_gate_difficulty: "multiply" | "divide" | "ratio" | "percent";
  created_at: string;
  updated_at: string;
}

// ClassCiv yield formula — every multiplier typed, every term named
// Base × JustificationMultiplier × d20Modifier × TerrainBonus 
//   × TechBonus × DepletionPenalty × PopulationMultiplier
```

### 6. Production scripts: then vs now

**Early (Novel-Generator, `deploy.sh`):**
```bash
echo "3. DEPLOY BACKEND TO RAILWAY:"
echo "   - Go to https://railway.app"
echo "   - Click 'New Project' > 'Deploy from GitHub'"
echo "   - Select your repository"
echo "   - Set root directory to '/backend'"
echo "   - Add environment variables from backend/RAILWAY_DEPLOY.md"
```
The deploy "script" just `echo`'d instructions. A human had to follow them. The pipeline was a human.

**Current (ClassCiv, `scripts/setup-classes.ts`):**
```typescript
// A TypeScript script that creates 2 live production games,
// 11 teams, starting resources for all teams, 
// and enrolls all 35 real students with their roles assigned.
// Run once. Idempotent. Documented inline with decision numbers.
npx tsx scripts/setup-classes.ts

// Also: a full game simulation engine
npx tsx scripts/simulate.ts --cinematic --epochs 30
// → 30-epoch AI game simulation, 6 teams, 
// → play-by-play log, saves resource snapshots per epoch,
// → consumed by the replay viewer
```

---

## The Thinking Shift

The code gap is real. But the actual gap isn't syntax — it's *how the problem gets framed*.

### Early thinking: "Does it work when I run it?"
- Rate limiting is commented out because it causes issues → ship without it
- Background jobs fire-and-forget because async coordination is hard → no monitoring
- No auth because auth adds friction during development → ship without it
- AI output is trusted because validating it is extra work → placeholder values in production
- Deploy guide is a shell script with `echo` statements because automation takes longer → humans as pipeline

### Current thinking: "What breaks in production when 35 kids are using this at 12:25 PM?"
- QStash signature verification goes in before the first job runs, not after the first attack
- Supabase Realtime means 35 students' screens update without polling 35 concurrent requests
- `requireTeacher()` ships with the first teacher-only route, day one
- AI output gets hard-overrides because you cannot trust AI for `lesson_number` when a curriculum SaaS charges parents $149 per course
- `scripts/setup-classes.ts` is TypeScript because if it breaks in production, you need to know exactly which line, not "something went wrong"

The shift isn't "Scott learned to code." Scott learned to think about code the way a system administrator thinks about servers: *everything fails eventually, the question is whether it fails loudly or silently.*

---

## The AI Pipeline as Proof

The most visible evidence of the shift is in how AI pipelines changed.

**Early pipeline (Novel-Generator):**
```
User input → Express route → OpenAI (gpt-4-turbo) → MongoDB → Response
```
2–4 passes, serial, synchronous, blocking, single provider, no validation.

**Current pipeline (Chapterhouse curriculum factory):**
```
User input → Zod validation → Supabase job record → QStash (HMAC-signed)
  → Railway worker (signature verified)
  → Pass 1: Gandalf (Claude Sonnet 4.6) — creates scope & sequence
  → Pass 2: Data (Claude Sonnet 4.6) — audits against CCSS-ELA / CCSS-Math / NGSS / C3
  → Pass 3: Polgara (Claude Sonnet 4.6) — finalizes for child readability
  → Pass 4: Earl (GPT-5.4) — operational viability assessment
  → Pass 5: Beavis & Butthead (GPT-5-mini) — engagement stress test
  → Pass 6: Extractor (Claude Sonnet 4.6) — structured JSON output
  → Post-extraction fixup (programmatic overrides — hard values, not AI suggestions)
  → Supabase write → Supabase Realtime → UI update (live, no polling)
```

6 passes. 2 AI providers. HMAC security. Progress updates every pass. Type-safe throughout. AI output validated and overridden where correctness can't be left to a language model.

---

## Why This Matters for SomersSchool

The curriculum factory in Chapterhouse isn't just a cool internal tool. It produces the `scope-sequence/*.json` files that feed directly into CoursePlatform (SomersSchool).

That 6-pass pipeline — the one that runs Supabase Realtime updates and validates every AI output programmatically — is what generates the scope and sequence for a $149 course that a homeschool parent might use to teach their child. It cannot have hallucinated lesson numbers. It cannot have placeholder quality metrics. It cannot have a background job that silently crashes at 12:25 PM with no retry.

The technical maturity built across 47 repos, 2,526 commits, in under a year — **that's the product**. The code in the CoursePlatform is built by someone who learned what breaks in production by building things that went to production.

That's the moat. Not the curriculum. Not the pricing model. The fact that the person building it learned the hard way, on real things, at real scale, in under 12 months — and the code shows it.

---

## Timeline (Approximate)

```
Early 2025:   working-generator, Novel-Generator
              JavaScript · Express · MongoDB · Socket.IO · no auth · no queue
              Learning: "How do I make this work?"

Mid 2025:     Multiple iterations across 47 repos
              TypeScript appearing · Supabase replacing MongoDB
              Learning: "How do I make this work reliably?"

Late 2025:    Chapterhouse v1 · CoursePlatform v1 · BibleSaaS v1
              Full TypeScript · Supabase Realtime · QStash · dual AI providers
              Learning: "What breaks when real people use this?"

Early 2026:   Chapterhouse v7+ · ClassCiv live with 35 students
              35 real student Clerk accounts · 29 DB tables · 11-phase epoch FSM
              Deployed. Live. Kids doing history because of the code.
              Learning: "What do I build next?"
```

---

*Generated March 2026. The repos don't lie.*
