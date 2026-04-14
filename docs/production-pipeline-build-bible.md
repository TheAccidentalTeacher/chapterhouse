# PRODUCTION PIPELINE — BUILD BIBLE
### The Guiding Beacon for the Whole Build

> **Generated:** March 2026 from brainstorm rounds 1–9.
> **Source doc:** `docs/production-pipeline-brainstorm.md` — decisions locked, not re-litigatable.
> **Two codebases in play:**
> - **Chapterhouse** → `c:\Users\Valued Customer\OneDrive\Desktop\WEBSITES\Brand guide` (operations hub, Scott-only)
> - **CoursePlatform** → `C:\Users\Valued Customer\OneDrive\Desktop\1st-Grade-Science-TEMPLATE` (student-facing SaaS)

---

## HOW TO USE THIS DOCUMENT

Each phase has:
1. **WHAT / WHY** — business purpose
2. **BEFORE** — what exists right now
3. **AFTER** — what exists when the phase is done
4. **STEPS** — numbered, granular, in order. Paste steps to Copilot one at a time.
5. **SMOKE TEST** — exact commands to verify the phase is complete

Do not skip phases. Phase N is a foundation for Phase N+1. See dependency map below.

---

## DEADLINES

Two hard business deadlines drive the sequence. Everything else is pure order.

| Phase | Priority | Business Constraint |
|---|---|---|
| Phase 0 | **First — gates everything** | Can't build on broken foundations |
| Phase 1 | **Second** | Unlocks Phase 2 (brand voice must be in DB before social ships) |
| Phase 2 | **⚠️ HARD DEADLINE: April 2026** | Social automation live before Scott's income gap (contract ends May 24) |
| Phase 3 | **Third** (before Phase 4+5) | Character Library gates image AND video consistency in Phase 4/5/6 |
| Phase 4 | **Fourth** (before Phase 6) | Video tab needs Characters from Phase 3; gates Phase 6 |
| Phase 5 | **Fourth** (parallel with Phase 4) | Bundle migration gates Phase 6+7 |
| Phase 6 | **⚠️ HARD DEADLINE: August 2026** | 168 sci-g1 videos before course launch |
| Phase 7 | **Alongside Phase 6** | Narration is simpler than video — run alongside |

**The only dates that matter are April 2026 (social) and August 2026 (videos). Phases 3-5 have no external deadline — do them in sequence as fast as possible.**

---

## DEPENDENCY MAP

```
Phase 0 (Smoke Test)  ─────────────────────────────────── anytime               ✅ COMPLETE
Phase 1 (Brand Voices → DB)  ──────────────────────────── gates Phase 2         ✅ COMPLETE
Phase 2 (Social Pipeline Version C)  ──────────────────── APRIL DEADLINE
Phase 3 (Character Library)  ──────────────────────────── gates Phase 4, 5, 6   ✅ COMPLETE
Phase 9 (Character Consistency Pipeline)  ──────────────────── gates Phase 4        ← BUILD THIS FIRST
  ⚠️ IMMEDIATE: Add negative_prompt anatomy fix to generate/route.ts (5 min) — do before writing Phase 9 code
  Phase 9A ("Save as Character" — Kontext-first)  ─────────────── 1–2 days
  Phase 9B (Batch Scene Generation — 112 images/course)  ─────── 3–5 days
  Phase 9C (Character Sheet Generator — 8 poses from seed)  ───── 2 days
  Phase 9D (HeyGen Scene Image Integration)  ─────────────────── 1 day
Phase 4 (Video Tab Rebuild)  ──────────────────────────── needs Phase 9 → gates Phase 6
  Pipeline: Phase 9 consistent image → Phase 4 animate → Phase 6 assemble 7 segments/lesson
Phase 5 (Bundle Migration + Asset Dashboard)  ──────────── gates Phase 6, 7     ✅ COMPLETE
Phase 8 (Course Pipeline Quality Gates)  ───────────────── gates Phase 6
  Phase 8A (Bundle Validation — Zod)  ────────────────────── ~1 afternoon
  Phase 8B (Unit Cross-Check — Claude Haiku)  ──────────────── ~1 day
  Phase 8C (AI Fact-Check — Gemini in Railway)  ────────────── ~1 day
  Phase 8D (Bundle Gen Trigger in Chapterhouse UI)  ─────────── ~2 days
Phase 6 (Course Video Pipeline)  ─── needs Phase 4 + Phase 5 + Phase 8 + Phase 9   AUGUST DEADLINE
  Produces 7 separate segments/lesson (intro, sections 1-5, conclusion) played sequentially
  by KaraokePlayer. Not a single stitched file — segments are independent Cloudinary assets.
Phase 7 (Voice Studio Narration)  ── needs Phase 5                                  alongside Phase 6
```

---

## ALL LOCKED DECISIONS — QUICK REFERENCE

| Decision | Value |
|---|---|
| North Star | Personal-use ToonBee/Leonardo/D-ID replacement. NOT a product. |
| Script a session | Brand voice NEVER hardcoded. Lives in Supabase `brand_voices` table. |
| Social pipeline version | **Version C** — full loop: Shopify → generate → Review Queue → Buffer publish |
| Social deadline | **April 2026** — hard |
| Course pipeline deadline | **August 2026** — hard |
| Character Library | First-class feature. `characters` table. Gimli is #1. Character-first image gen. |
| Claude prompt enhancement | Every image/video prompt passes through Claude before going to provider. |
| Text overlay strategy | Cloudinary URL transforms (e.g. `l_text:Arial_40_bold:Hello/fl_relative`) on clean images — never bake text into generated images. |
| Image providers | GPT Image 1, Stability AI, Flux (Replicate), Leonardo.ai — all selectable in UI. Leonardo is NOT the default and NOT the character consistency engine. |
| Character consistency | **FLUX.1 Kontext** (Leonardo Premium — already active). Inference-time conditioning: `hero_image_url` as reference → consistent character in new scene. No training. No UUID. `generation_strategy = 'kontext'` is the default for all characters. Full spec: Phase 9. — *LoRA via Leonardo Custom Model attempted March 24, 2026: training UI works but REST API exposes no user-trained model UUIDs. Abandoned March 27, 2026. See Phase 3.5 (buried).* |
| Video providers | **Leonardo Video tab first** — evaluate for Gimli animated clips BEFORE committing to Kling. Scott has Premium ($24/mo, already active). Feed a Kontext-generated Gimli hero image → Leonardo Video tab → animated clip. If quality is sufficient → skip Kling subscription ($29.99/mo saved). Kling AI second if Leonardo Video is inadequate. D-ID third (talking-head lip-sync). **HeyGen = Scott Mr. S avatar ONLY.** Not for Gimli. Evaluate before Phase 4 build. |
| Review Queue | Non-negotiable. All content (posts, images, videos) through human approval. |
| Bundle data | **Option C** — `bundles` table in CoursePlatform's Supabase. Both apps share it. |
| Asset Dashboard scope | Lesson grid, 5 status dots (Bundle / Images / Audio / Video / Worksheet), "Generate All Missing" button. |
| Anna in Chapterhouse | She does NOT use Chapterhouse. Scott-only. |
| Async jobs | Railway worker. Supabase Realtime for progress. QStash for delivery. |
| "Done" definition | Pick a lesson → get all production assets for it. Social is a side effect of the same engine. |

---

## CODEBASE QUICK REFERENCE

### Chapterhouse
| Path | What It Is |
|---|---|
| `src/app/creative-studio/page.tsx` | Creative Studio — 3-tab (Images / Sounds / Video) |
| `src/components/image-generation-studio.tsx` | All 4 image providers, stock search, upscale, save, session history |
| `src/components/video-generator.tsx` | HeyGen-only form (will be gutted in Phase 4) |
| `src/components/sound-browser.tsx` | Freesound search + in-browser play |
| `src/app/api/images/generate/route.ts` | 4 image providers, inserts to `generated_images` |
| `src/app/api/images/save/route.ts` | Upload to Cloudinary, sets `cloudinary_url` on row |
| `src/app/api/video/generate/route.ts` | HeyGen v2/video generate |
| `src/app/api/video/status/route.ts` | HeyGen status polling |
| `src/app/api/social/generate/route.ts` | **Brand voice: hardcoded here now. Moving to DB in Phase 1.** |
| `src/app/api/social/posts/[id]/approve/route.ts` | Buffer `createPost` GraphQL mutation |
| `src/app/api/social/accounts/sync/route.ts` | Buffer GraphQL channel sync |
| `src/app/api/webhooks/shopify-product/route.ts` | Shopify webhook → auto-generate NCHO posts |
| `src/app/api/cron/social-weekly/route.ts` | Monday 05:00 UTC weekly cron |
| `src/components/social-review-queue.tsx` | Social post review UI |
| `src/app/social/page.tsx` | Social tab UI (Review Queue / Generate / Accounts) |
| `src/lib/navigation.ts` | Nav groups — add new pages here |
| `src/lib/env.ts` | Env var registry — add new vars here |
| `worker/src/jobs/router.ts` | Job type dispatcher |
| `worker/src/index.ts` | Railway worker Express server |
| `worker/package.json` | Worker deps |
| `supabase/migrations/` | Migration files (last: 022) |
| `vercel.json` | Cron schedules + route maxDuration |

### CoursePlatform
| Path | What It Is |
|---|---|
| `data/bundles/*.json` | 24 sci-g1 bundles + 1 ela-g1 bundle, schema v2 |
| `data/bundles/courses/` | Course manifest JSONs |
| `data/outlines/*.json` | Unit outlines (contract for bundle generation) |
| `data/supabase-schema.sql` | DB schema (8 tables) — ALTER TABLE statements go here |
| `data/config/production-settings.json` | AI models, audio settings |
| `scripts/generate-bundle.js` | Main bundle generator (Claude Opus 4.5) |
| `scripts/generate-slide-images.mjs` | Slide image generation + Cloudinary upload |
| `scripts/generate-audio.js` | ElevenLabs/OpenAI narration |
| `scripts/upload-media.mjs` | Batch CDN upload |
| `components/KaraokePlayer.tsx` | Synced video + slides + word highlight |
| `app/(platform)/learn/[slug]/[lessonSlug]/page.tsx` | Lesson viewer page |
| `app/api/learn/[slug]/[lessonSlug]/route.ts` | **Lesson loader — reads bundle from DISK now. Reads from Supabase in Phase 5.** |
| `lib/supabase.ts` or similar | Supabase client instantiation |

### Shared Infrastructure
| Service | Account | Use |
|---|---|---|
| Cloudinary | `dpn8gl54c` | All generated + course media |
| Supabase (Chapterhouse) | Chapterhouse project | All Chapterhouse tables |
| Supabase (CoursePlatform) | CoursePlatform project | Users, children, enrollments, lessons, **bundles (added Phase 5)** |
| Railway | Chapterhouse worker | Async job processing |
| QStash | Upstash | Job queue delivery |
| Buffer | `accidentalakteacher` org | Social scheduling |

---

---

# PHASE 0 — SMOKE TEST & FOUNDATION AUDIT

**WHAT:** Light up every existing feature and document pass/fail. Build nothing new. Fix only what's broken enough to block later phases.

**WHY:** Can't build Phase 1-7 on top of pipes that don't actually work. 10 minutes of smoke testing saves 10 hours of debugging later.

---

## Step 0.1 — Check env vars

Run the Settings page health check (`/settings`) in Chapterhouse. Every provider used in Phase 1-4 must show green:

| Env var | Phase needed | What to check in `/settings` |
|---|---|---|
| `SHOPIFY_WEBHOOK_SECRET` | Phase 2 | Present + non-empty |
| `BUFFER_ACCESS_TOKEN` | Phase 2 | Present + non-empty |
| `ANTHROPIC_API_KEY` | Phase 1-7 | Present + non-empty |
| `OPENAI_API_KEY` | Phase 2-6 | Present + non-empty |
| `CLOUDINARY_URL` | Phase 3-7 | Present, format `cloudinary://key:secret@dpn8gl54c` |
| `ELEVENLABS_CURRICULUM_KEY` | Phase 7 | Present + non-empty |
| `RAILWAY_WORKER_URL` | Phase 5-7 | Present, should be Railway URL |
| `QSTASH_TOKEN` | Phase 5-7 | Present + non-empty |

**If any of these are missing:** Add them to Vercel env vars and Railway env vars before proceeding.

---

## Step 0.2 — Smoke test Creative Studio image generation

1. Open `/creative-studio`, Images tab
2. Try each provider: OpenAI, Stability AI, Replicate, Leonardo.ai
3. For each: enter a simple prompt ("a red apple"), generate, note pass/fail
4. Click "Save to CDN" on one successful image — verify it sets a Cloudinary URL

**Expected:** At least GPT Image 1 passes. Document which others work.

**⚙️ PHASE GATE (Q-0-1) — UPDATED:** Character consistency uses **FLUX.1 Kontext** (Leonardo Premium). No Replicate dependency for character generation. Phase 9 (Character Consistency Pipeline) gates on Leonardo passing this smoke test.

- Confirm `LEONARDO_API_KEY` or `LEONARDO_AI_API_KEY` is set in Vercel env
- Test Leonardo: generate an image using FLUX.1 Kontext with a reference image — confirm consistent character output
- Replicate still available as a selectable provider for non-character image generation (flux-schnell, flux-dev img2img).

---

## Step 0.3 — Smoke test Voice Studio

1. Open `/voice-studio`
2. Type "Hello, my name is Gimli and I am a malamute." 
3. Try ElevenLabs TTS — should produce audio
4. Try Azure Speech TTS — should produce audio
5. Try in-browser recording → Azure STT transcription

**Document:** Which TTS engines work. Which voice IDs are available in ElevenLabs.

---

## Step 0.4 — Smoke test Social pipeline (manual flow)

1. Open `/social`, Accounts tab
2. Click "Sync from Buffer" — should return a list of Buffer channels
3. Map at least one channel to a brand+platform in the UI
4. Switch to Generate tab
5. Select NCHO brand, Facebook platform, count=1, topic seed="new product"
6. Click Generate — should create a post in pending_review
7. Open Review Queue tab — post should appear
8. Edit it — verify edit saves
9. **Do NOT click Approve** yet — we're not ready to push to Buffer

**Document:** Whether a post generates successfully.

---

## Step 0.5 — Smoke test CoursePlatform lesson loader

> **✅ CONFIRMED (Q-PRE-3):** First bundle slug is `sci-g1-u1-l01`. The URL `/learn/sci-grade-1/sci-g1-u1-l01` is correct.

1. In CoursePlatform, navigate to `/learn/sci-grade-1/sci-g1-u1-l01`
2. Verify lesson loads — KaraokePlayer renders, slides show
3. Verify `image_url` fields show Cloudinary images (not emoji fallbacks) for slides that have been generated

**Document:** How many of the 24 sci-g1 lessons have `image_url` populated on their slides.

---

## Step 0.6 — Verify KaraokePlayer Cloudinary URL pattern (Q-0-2) ✅ ALREADY VERIFIED

> **✅ CONFIRMED FROM CODEBASE READ (March 22, 2026):** No action needed — URL convention is correct. Findings:
> - **`lib/media-url.ts`:** `mediaUrl.video(lessonSlug, segment)` → `https://res.cloudinary.com/dpn8gl54c/video/upload/q_auto/somerschool/videos/{lessonSlug}/{segment}.mp4`
> - The `.mp4` in the delivery URL is the format selector, NOT part of the Cloudinary `public_id`. Workers upload without extension (Appendix E convention) ✅
> - **Slide `image_url` field name:** `image_url` (confirmed — not `background_image`, not `media_url`) ✅
> - **Slide naming convention (existing):** intro slides → `somerschool/slides/{bundleId}/intro-{idx}.jpg`, section slides → `somerschool/slides/{bundleId}/section-{N}-{idx}.png`
> - **New image generation:** Use `.webp` format for all new generated images. Consistent within a run — the player reads `image_url` from JSON, whatever format you write there is what it requests.
> - **⚠️ Silent error gotcha:** `KaraokePlayer`'s `onError` handler calls `setHidden(true)` — a wrong Cloudinary URL causes the player to silently disappear with no console error. If slides go missing during testing, the first thing to check is the `image_url` path in the bundle JSON.
> - **`celebration_video_url`** is a SHARED asset hardcoded to `somerschool/celebration.mp4` in every bundle. Phase 6 worker does NOT generate this — skip it.

Skip this step entirely during Phase 0 execution. All path conventions are confirmed correct.

---

## Phase 0 SMOKE TEST COMPLETE when:
- [ ] All required env vars green
- [ ] At least 1 image provider generates + saves to Cloudinary
- [ ] At least 1 TTS voice produces audio
- [ ] Social generate creates a post in Review Queue
- [ ] CoursePlatform lesson loads from disk and KaraokePlayer renders

---

---

# PHASE 1 — BRAND VOICE → SUPABASE

**WHAT:** Move all three brand voice definitions out of hardcoded strings in `src/app/api/social/generate/route.ts` into a `brand_voices` Supabase table. Build a Settings UI to edit them. Wire all generation routes to pull from DB.

**WHY:** Brand voice will drift constantly. Scott rewrites the NCHO voice, Anna edits the Alana Terry voice. Every edit currently requires a code change + deploy. After this phase, it's a Settings form.

**BEFORE:**
- `BRAND_VOICE_SYSTEM` constant in `src/app/api/social/generate/route.ts` (module-level, ~45 lines hardcoded)
- No way to edit without a deploy

**AFTER:**
- `brand_voices` table in Supabase (one row per brand)
- Settings page has a "Brand Voices" section with 3 expandable editors
- `src/app/api/social/generate/route.ts` fetches voice from DB before constructing prompt
- Fallback: if DB fetch fails, fall back to the last-known hardcoded value (safety net)

---

## Step 1.1 — DB Migration

**File to create:** `supabase/migrations/20260401_023_create_brand_voices.sql`

> **✅ CONFIRMED:** `set_updated_at()` trigger function already exists from migration 001. Safe to call in all new triggers — no need to recreate.
> **⚠️ SEED NOTE (Q-X-1):** The seed SQL (Step 1.2) must be run in the Supabase Dashboard SQL Editor, which uses the service role key and bypasses RLS automatically. Do NOT run seed SQL from the app client.

```sql
-- Brand voices: one row per brand, editable from Settings
CREATE TABLE brand_voices (
  id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   TIMESTAMPTZ  DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  DEFAULT NOW(),
  user_id      UUID         REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Identity
  brand        TEXT         NOT NULL CHECK (brand IN ('ncho', 'somersschool', 'alana_terry', 'scott_personal')),
  display_name TEXT         NOT NULL,   -- e.g. "Next Chapter Homeschool Outpost"

  -- Voice definition fields (edited in Settings)
  audience     TEXT         NOT NULL DEFAULT '',  -- who is this brand writing to
  tone         TEXT         NOT NULL DEFAULT '',  -- voice characteristics
  rules        TEXT         NOT NULL DEFAULT '',  -- "always say X, never say Y" rules
  platform_hints JSONB      NOT NULL DEFAULT '{}', -- {"facebook": "...", "instagram": "..."}
  forbidden_words TEXT[]    NOT NULL DEFAULT '{}', -- words that are banned in this voice
  full_voice_prompt TEXT    NOT NULL DEFAULT '',  -- full assembled system prompt (assembled + saved)

  -- State
  is_active    BOOLEAN      NOT NULL DEFAULT true,
  version      INTEGER      NOT NULL DEFAULT 1,    -- increment on every edit

  UNIQUE (user_id, brand)
);

-- Update trigger
CREATE TRIGGER set_brand_voices_updated_at
  BEFORE UPDATE ON brand_voices
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Realtime (for live Settings page refresh)
ALTER PUBLICATION supabase_realtime ADD TABLE brand_voices;

-- RLS: Scott only (Chapterhouse is single-user; service role used by all API routes bypasses this anyway)
ALTER TABLE brand_voices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated users only" ON brand_voices
  FOR ALL USING (auth.role() = 'authenticated');
```

**Run this in:** Supabase Dashboard → SQL Editor.

---

## Step 1.2 — Seed the three brand voices

After running the migration, seed with the current hardcoded values.

**File to create:** `supabase/migrations/20260401_023b_seed_brand_voices.sql`

(Paste the actual voice text from `src/app/api/social/generate/route.ts` `BRAND_VOICE_SYSTEM` const into each `full_voice_prompt` below.)

```sql
-- Seed: NCHO brand voice
INSERT INTO brand_voices (brand, display_name, audience, tone, rules, full_voice_prompt)
VALUES (
  'ncho',
  'Next Chapter Homeschool Outpost',
  'Homeschool moms 30-45, faith-adjacent, overwhelmed by curriculum choices',
  'Warm, specific, teacher eye-view. Not corporate. Not cheerful filler.',
  'Always say "your child" never "your student". Never use: explore, journey, leverage, synergy, student.',
  -- full_voice_prompt: paste the entire ncho section from BRAND_VOICE_SYSTEM here
  'ncho (Next Chapter Homeschool Outpost — Shopify homeschool store):
- Audience: homeschool moms 30-45, faith-adjacent, overwhelmed by curriculum choices.
- Always say "your child" — never "your student."
- Core message emotional layer: "For the child who doesn''t fit in a box."
- Core message practical layer: "Your one-stop homeschool shop."
- Convicted, not curious. She''s already decided to homeschool. Write to conviction.
- Voice: warm, specific, teacher''s-eye-view. Not corporate. Not cheerful filler.
- Never use: explore, journey, spiritually curious, leverage, synergy, student.
- Facebook: 2-4 sentences. Hook → child → product → CTA. Max 400 chars.
- Instagram: first line is the hook (must work as standalone). 3-5 sentences total. 3-5 hashtags.'
);

-- Seed: SomersSchool brand voice
INSERT INTO brand_voices (brand, display_name, audience, tone, rules, full_voice_prompt)
VALUES (
  'somersschool',
  'SomersSchool',
  'Homeschool parents 30-50 who want structured teacher-designed secular courses',
  'Confident teacher who knows his craft. Specific over general.',
  'ALL SECULAR. Zero faith language. Never use: spiritual, faith, explore your beliefs, student.',
  'somersschool:
- ALL SECULAR. Zero faith language, ever. Alaska Statute 14.03.320 compliance.
- Visible progress is the product. Lead with what the child gets to SHOW.
- Voice: confident teacher who knows his craft. Specific over general.
- LinkedIn: counterintuitive first line, 3 short paragraphs, light CTA.
- Instagram: lesson preview or win showcase. Bold and clean.
- Never use: spiritual, faith, Christian, explore your beliefs, student (use "child").'
);

-- Seed: Alana Terry brand voice
INSERT INTO brand_voices (brand, display_name, audience, tone, rules, full_voice_prompt)
VALUES (
  'alana_terry',
  'Alana Terry (Christian Fiction)',
  'Christian fiction readers, existing fans, podcast listeners',
  'Personal, vulnerable, story-forward. Faith assumed, never preachy.',
  'Write as a woman (Anna''s voice). Community not audience. Facebook/Instagram only.',
  'alana_terry:
- Write as a woman (Anna''s voice, not Scott''s).
- Personal, vulnerable. Story-forward. Faith is assumed, never preachy.
- Community: readers and listeners are friends, not audiences.
- Facebook/Instagram only. LinkedIn does not apply.
- Book posts: question readers are asking → character/theme connection → CTA.
- Podcast posts: episode''s most arresting insight → 2 sentences context → "new episode live."'
);
```

---

## Step 1.3 — API Routes for Brand Voices

**File to create:** `src/app/api/brand-voices/route.ts`

> **✅ CONFIRMED (Q-PRE-2):** Actual export from `src/lib/supabase-server.ts` is `getSupabaseServiceRoleClient()` (synchronous, no `await`). There is no `createClient` export. All new routes use this pattern, matching `social/generate/route.ts`.

```typescript
// GET /api/brand-voices          — list all active brand voices
// GET /api/brand-voices?brand=ncho — get single brand voice

import { getSupabaseServiceRoleClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = getSupabaseServiceRoleClient()
  if (!supabase) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })
  const { searchParams } = new URL(request.url)
  const brand = searchParams.get('brand')

  let query = supabase
    .from('brand_voices')
    .select('id, brand, display_name, audience, tone, rules, platform_hints, forbidden_words, full_voice_prompt, version')
    .eq('is_active', true)
    .order('brand')

  if (brand) query = query.eq('brand', brand)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(brand ? data?.[0] ?? null : data)
}
```

**File to create:** `src/app/api/brand-voices/[id]/route.ts`

```typescript
// PATCH /api/brand-voices/[id]  — update a brand voice
import { getSupabaseServiceRoleClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const updateSchema = z.object({
  audience:         z.string().optional(),
  tone:             z.string().optional(),
  rules:            z.string().optional(),
  platform_hints:   z.record(z.string()).optional(),
  forbidden_words:  z.array(z.string()).optional(),
  full_voice_prompt: z.string().optional(),
})

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const supabase = getSupabaseServiceRoleClient()
  if (!supabase) return NextResponse.json({ error: 'DB unavailable' }, { status: 503 })
  const body = await request.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 })

  // FIXED (Q-1-3): Supabase has no built-in increment RPC. Fetch version in JS, then +1.
  const { data: current } = await supabase
    .from('brand_voices')
    .select('version')
    .eq('id', params.id)
    .single()

  const { data, error } = await supabase
    .from('brand_voices')
    .update({ ...parsed.data, version: (current?.version ?? 1) + 1 })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
```

> **✅ DECISION LOCKED (Q-1-4):** Brand voices use **Option A**. `full_voice_prompt` is the source of truth — Scott edits it directly in the Settings textarea. Structured fields (`audience`, `tone`, `rules`) are display metadata only and do NOT auto-assemble into the prompt. Save button saves whatever is in the textarea verbatim.

---

## Step 1.4 — Wire generate route to pull from DB

**File to modify:** `src/app/api/social/generate/route.ts`

**What changes:**
1. Remove the hardcoded `BRAND_VOICE_SYSTEM` constant (lines 12–57)
2. Add a `getBrandVoice(brand: string)` helper that queries Supabase
3. Add hardcoded fallbacks as a `BRAND_VOICE_FALLBACK` constant (same text, never deleted)
4. Generate route calls `getBrandVoice(brand)` before constructing the system prompt

**Pattern to add at top of file:**

```typescript
const BRAND_VOICE_FALLBACK: Record<string, string> = {
  ncho: `ncho (Next Chapter Homeschool Outpost — Shopify homeschool store):
- Audience: homeschool moms 30-45, faith-adjacent, overwhelmed by curriculum choices.
- Always say "your child" — never "your student."
...`, // full text from existing BRAND_VOICE_SYSTEM
  somersschool: `somersschool:
- ALL SECULAR...`,
  alana_terry: `alana_terry:
- Write as a woman...`,
}

async function getBrandVoice(brand: string, supabase: SupabaseClient): Promise<string> {
  try {
    const { data } = await supabase
      .from('brand_voices')
      .select('full_voice_prompt')
      .eq('brand', brand)
      .eq('is_active', true)
      .single()
    if (data?.full_voice_prompt) return data.full_voice_prompt
  } catch { /* fall through */ }
  return BRAND_VOICE_FALLBACK[brand] ?? ''
}
```

**In the POST handler, before building the system prompt:**

```typescript
// Old (delete this):
// const voiceText = BRAND_VOICE_SYSTEM[brand] ?? ''

// New (add this):
const voiceText = await getBrandVoice(brand, supabase)
```

---

## Step 1.5 — Brand Voice editor in Settings page

**File to modify:** `src/app/settings/page.tsx`

**What to add:**
- A "Brand Voices" section below the existing env status cards
- 3 expandable panels (NCHO / SomersSchool / Alana Terry)
- Each panel shows `full_voice_prompt` in a `<textarea>` (editable)
- Save button → `PATCH /api/brand-voices/[id]`
- "Last edited" timestamp + version number shown

**Component sketch (add to settings page):**

```typescript
// Fetch brand voices on mount
const [voices, setVoices] = useState<BrandVoice[]>([])
useEffect(() => {
  fetch('/api/brand-voices').then(r => r.json()).then(setVoices)
}, [])

// Per voice: expandable editor
voices.map(voice => (
  <details key={voice.brand}>
    <summary>{voice.display_name} (v{voice.version})</summary>
    <textarea
      defaultValue={voice.full_voice_prompt}
      onBlur={(e) => saveBrandVoice(voice.id, e.target.value)}
      rows={20}
      className="w-full font-mono text-sm p-3 bg-zinc-900 border border-amber-800 rounded"
    />
    <p className="text-xs text-zinc-500">Save on blur. Version increments on save.</p>
  </details>
))
```

---

## Phase 1 SMOKE TEST

> **✅ COMPLETE — March 24, 2026 (Session 27).** `brand_voices` table (migration 023) + seed (023b) shipped. `BrandVoicesPanel` in `/settings` renders 4 brand editors. `/api/brand-voices/` CRUD routes live. Hardcoded `BRAND_VOICE_SYSTEM` in `/api/social/generate/route.ts` replaced with DB lookup.

1. Open `/settings` — verify 3 brand voice editors appear with the seeded text
2. Edit the NCHO voice — change one sentence, save (blur out of textarea)
3. Call `GET /api/brand-voices?brand=ncho` directly — verify changed text is returned
4. Call `POST /api/social/generate` with `brand: "ncho"` — verify the generated post reflects the changed voice (Claude used the new text)
5. Revert your edit in Settings

---

---

# PHASE 2 — SOCIAL PIPELINE VERSION C

**WHAT:** End-to-end social automation. Shopify adds a product → posts auto-generate in Review Queue → Scott approves → Buffer publishes. All three brands flowing. Images optionally attached.

**WHY:** April deadline. Scott's teaching contract ends May 24, 2026. Social presence must be automated before then. This phase makes content self-sustaining for NCHO launch.

**BEFORE:**
- Code infrastructure IS built (social routes, Buffer GraphQL, Shopify webhook)
- But: brand voice hardcoded (fixed in Phase 1)
- But: `SHOPIFY_WEBHOOK_SECRET` may not be set in production
- But: Buffer channels may not be mapped in `social_accounts` table
- But: posts are text-only (no images)
- But: full loop never been tested end-to-end

**AFTER:**
- Full Version C loop verified working in production
- Social posts have image briefs (images generated on demand from Creative Studio, NOT auto-attached)
- Weekly cron generating posts for all 3 brands
- Analytics pull-back wired

---

## Step 2.1 — Production environment verification

Check and set in **Vercel** (Chapterhouse project dashboard → Settings → Environment Variables):

| Var | How to get it | Where it must be set |
|---|---|---|
| `SHOPIFY_WEBHOOK_SECRET` | Shopify Admin → Settings → Notifications → Webhooks → the registered webhook → Show secret | Vercel prod + preview |
| `BUFFER_ACCESS_TOKEN` | Buffer dashboard → Apps → your app → Access Token | Vercel prod |

**Register the Shopify webhook (if not already done):**
1. Shopify Admin → Settings → Notifications → scroll to Webhooks
2. Add webhook: Event = "Product creation", URL = `https://your-chapterhouse.vercel.app/api/webhooks/shopify-product`, Format = JSON
3. Copy the signing secret → paste into `SHOPIFY_WEBHOOK_SECRET` Vercel env var
4. Redeploy Vercel for env to take effect

---

## Step 2.2 — Map Buffer channels to brands

This is a one-time setup that must be done before any social posts can be scheduled.

1. Open `/social`, Accounts tab
2. Click "Sync from Buffer" — this calls `POST /api/social/accounts/sync`
3. The UI returns a list of all Buffer channels with their IDs
4. For each brand+platform you want to use, create a mapping:
   - Brand: `ncho`, Platform: `facebook`, Buffer Channel ID: [the ID from sync]
   - Brand: `ncho`, Platform: `instagram`, Buffer Channel ID: [the ID from sync]
   - Brand: `somersschool`, Platform: `linkedin`, Buffer Channel ID: [if applicable]
   - Brand: `alana_terry`, Platform: `facebook`
   - Brand: `alana_terry`, Platform: `instagram`
5. Verify the `social_accounts` table in Supabase has rows for each mapping

**SQL to verify:**
```sql
SELECT brand, platform, display_name, buffer_profile_id, is_active
FROM social_accounts
ORDER BY brand, platform;
```

---

## Step 2.3 — Verify weekly cron timing

**File to check:** `vercel.json`

Find the social-weekly cron entry. Current schedule: `"0 5 * * 1"` (Monday 05:00 UTC = Sunday 9 PM Alaska).

If the schedule doesn't match what Scott wants, change it now:
- Monday morning Alaska = `"0 14 * * 1"` (Monday 14:00 UTC = Monday 6 AM Alaska in summer / 5 AM in winter)
- Current `"0 5 * * 1"` = Sunday 9 PM Alaska (technically overnight Sunday-Monday)

**✅ DECISION LOCKED (Q-2-1):** Cron schedule = `"0 14 * * 1"` — Monday 14:00 UTC = **Monday 6 AM Alaska**. Posts generate Monday morning, ready when you wake up.

**Also verify in `vercel.json`:**
```json
{
  "crons": [
    { "path": "/api/cron/social-weekly", "schedule": "0 14 * * 1" }
  ]
}
```

---

## Step 2.4 — Add image brief display in Review Queue

Currently `social_posts` has an `image_brief` field. The Review Queue component (`src/components/social-review-queue.tsx`) should surface this so Scott knows what image to generate.

**File to modify:** `src/components/social-review-queue.tsx`

**What to add:** In each post card, below the post text, if `post.image_brief` is non-empty:

```typescript
{post.image_brief && (
  <div className="mt-2 p-2 rounded bg-amber-950/30 border border-amber-800/30">
    <p className="text-xs text-amber-400 font-medium mb-1">📷 Image brief</p>
    <p className="text-xs text-zinc-400">{post.image_brief}</p>
    <a
      href={`/creative-studio?prompt=${encodeURIComponent(post.image_brief)}`}
      className="text-xs text-amber-500 underline mt-1 inline-block"
      target="_blank"
    >
      Open in Creative Studio →
    </a>
  </div>
)}
```

This links the copy-writer and the image generator without fully automating it. Scott sees the brief, clicks over to Creative Studio, generates, saves to Cloudinary. Phase 3's Character Library will make this tighter.

---

## Step 2.5 — Wire Alana Terry brand limitations

Current generate route builds prompts for all brands × all platforms. Alana Terry should only post to Facebook and Instagram.

**File to modify:** `src/app/api/social/generate/route.ts`

Find where brand+platform combos are constructed. Add a filter:

```typescript
// Filter out invalid brand+platform combos
const BRAND_PLATFORM_LIMITS: Record<string, string[]> = {
  alana_terry: ['facebook', 'instagram'],
  ncho: ['facebook', 'instagram'],
  somersschool: ['facebook', 'instagram', 'linkedin'],
  scott_personal: ['facebook', 'instagram', 'linkedin'],
}

// In the loop that builds combos:
if (!BRAND_PLATFORM_LIMITS[brand]?.includes(platform)) continue
```

---

## Step 2.6 — End-to-end smoke test — manual trigger

Use the `/social` Generate tab (not a real Shopify webhook):

1. Open `/social` → Generate tab
2. Select: Brand = NCHO, Platform = Facebook + Instagram, Count = 2, Topic = "new homeschool science books just added"
3. Click Generate
4. Wait ~10-15 seconds
5. Switch to Review Queue tab — 4 posts should appear (2 brands × 2 platforms)
6. Edit one post
7. Choose a scheduled date/time (set to tomorrow)
8. Select the NCHO Facebook Buffer channel
9. Click Approve
10. Verify in Buffer dashboard: post is scheduled

---

## Step 2.7 — End-to-end smoke test — Shopify webhook

This tests the actual automated loop:

1. In Shopify Admin, add a new product (even a draft product)
2. Wait ~30 seconds
3. Open Chapterhouse `/social` Review Queue — 3 new NCHO posts (Facebook + Instagram × 3 per combo) should appear
4. If nothing appears, check: Vercel function logs → look for `/api/webhooks/shopify-product` hits

If the webhook isn't arriving:
- Verify the Shopify webhook URL is the correct production Vercel URL
- Check Shopify Admin → Settings → Notifications → Webhooks → recent delivery logs (Shopify shows delivery attempts)
- Check `SHOPIFY_WEBHOOK_SECRET` matches what Shopify Admin shows

---

## Step 2.8 — Analytics pull-back cron

**File to check:** `src/app/api/social/analytics/route.ts` — this already exists and pulls Buffer stats.

**To automate it, add to `vercel.json`:** (optional — can be triggered manually for now)
```json
{ "path": "/api/social/analytics", "schedule": "0 12 * * 2" }
```
(Tuesdays at noon UTC — day after posts typically go out Monday morning)

**Also add to `vercel.json` maxDuration:**
```json
{ "path": "/api/social/analytics", "maxDuration": 30 }
```

---

## Phase 2 SMOKE TEST — Definition of Done

- [ ] NCHO posts appear in Review Queue within 60 seconds of a Shopify product creation
- [ ] Post approved in Review Queue → appears scheduled in Buffer
- [ ] Weekly cron fires on Monday and generates posts for all mapped brands/platforms
- [ ] Image brief visible on each post card, links to Creative Studio
- [ ] Alana Terry posts only appear for Facebook + Instagram

---

---

# PHASE 3 — CHARACTER LIBRARY + PROMPT ENHANCER

**WHAT:** Build a named character system in Supabase. Gimli the malamute is character #1. Every image and video generation can be anchored to a character, ensuring visual consistency across all assets. Claude enhances every rough prompt through a character-aware lens before it hits the image API.

**WHY:** Right now every Creative Studio image is a one-shot with no memory. When Gimli appears in 168 lesson slides, he needs to look the same malamute every time. Character Library + Claude enhancement is the infrastructure that makes that possible.

**BEFORE:**
- No character concept in Chapterhouse
- Image prompts typed raw, no enhancement
- `generated_images` table exists but has no character FK

**AFTER:**
- `characters` table in Supabase (Chapterhouse)
- Gimli as character #1 with reference images in Cloudinary
- Claude-based prompt enhancer that injects character physical description and art style into every prompt
- Character picker in Creative Studio Images tab
- `generated_images.character_id` FK to track which character appeared where

---

## Step 3.1 — DB Migration

**File to create:** `supabase/migrations/20260501_024_create_characters.sql`

```sql
-- Characters: named, reusable image generation anchors
CREATE TABLE characters (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ  DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  DEFAULT NOW(),
  user_id         UUID         REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Identity
  slug            TEXT         NOT NULL UNIQUE,  -- e.g. 'gimli', 'scott-avatar'
  name            TEXT         NOT NULL,         -- display name, e.g. "Gimli"
  description     TEXT         NOT NULL DEFAULT '',  -- what Scott would say about this character
  role            TEXT         NOT NULL DEFAULT '',  -- "curriculum explainer for K-5"

  -- Physical description (injected into every prompt)
  physical_description TEXT    NOT NULL DEFAULT '',  -- Claude uses this for every generation
  art_style            TEXT    NOT NULL DEFAULT '',  -- "cartoon illustration, child-friendly, warm colors"
  negative_prompt      TEXT    NOT NULL DEFAULT '',  -- "no text, no words, no letters"

  -- Reference images in Cloudinary
  reference_images TEXT[]      NOT NULL DEFAULT '{}',  -- Cloudinary URLs for reference shots
  hero_image_url   TEXT,                               -- primary display image

  -- Provider preferences
  preferred_provider TEXT      DEFAULT 'replicate',  -- openai | stability | replicate | leonardo
  lora_model_id      TEXT,                           -- LoRA model ID if fine-tuned

  -- State
  is_active BOOLEAN NOT NULL DEFAULT true,

  UNIQUE (user_id, slug)
);

CREATE TRIGGER set_characters_updated_at
  BEFORE UPDATE ON characters
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated users only" ON characters
  FOR ALL USING (auth.role() = 'authenticated');

-- Extend generated_images to track character usage
ALTER TABLE generated_images
  ADD COLUMN character_id     UUID REFERENCES characters(id) ON DELETE SET NULL,
  ADD COLUMN prompt_original  TEXT,           -- the raw prompt Scott typed
  ADD COLUMN prompt_enhanced  TEXT,           -- the Claude-enhanced prompt that was actually sent
  ADD COLUMN provider_used    TEXT,           -- which provider was used (redundant with provider col, but explicit)
  ADD COLUMN enhancement_notes TEXT;          -- why Claude changed what it changed (debug/audit)

-- Index for dashboard queries
CREATE INDEX characters_slug_idx ON characters(slug);
CREATE INDEX generated_images_character_idx ON generated_images(character_id);
```

---

## Step 3.2 — Seed Gimli as character #1

**File to create:** `supabase/migrations/20260501_024b_seed_gimli.sql`

```sql
-- Gimli: the 125-lb Alaskan Malamute, SomersSchool curriculum explainer for K-5
-- He is obstinate, mouthy, cross-eyed when annoyed.
-- His voice: reluctant but competent. Dry humor. Short sentences. Visual punchline.

INSERT INTO characters (
  slug,
  name,
  description,
  role,
  physical_description,
  art_style,
  negative_prompt,
  preferred_provider
) VALUES (
  'gimli',
  'Gimli',
  'The real Gimli is a 125-lb Alaskan Malamute. Obstinate, mouthy, cross-eyed when annoyed. Loves exactly one person: Scott. Walks into his office every day because he wants to.',
  'Curriculum explainer mascot for SomersSchool K-5 lessons. On-screen character for all lower-grade content.',
  'A large, fluffy Alaskan Malamute with grey-and-white fur, bright amber eyes, a thick tail that curls over his back, and a wide expressive face. Slight cross-eyed look when confused. Large and slightly imposing but clearly lovable. Paws are enormous relative to body.',
  'Friendly digital cartoon illustration, child-friendly, bright warm colors, thick clean outlines, expressive face, slightly exaggerated proportions, educational book illustration style',
  'no text, no words, no letters, no human figures, realistic photo, dark scary themes'
);
```

> **After running this seed:** Upload 5-8 reference photos of Gimli to Cloudinary at path `somerschool/characters/gimli/ref-{n}.jpg`, then update the `reference_images` array via the Settings UI (built in Step 3.5).

---

## Step 3.3 — Prompt Enhancer middleware

**File to create:** `src/lib/prompt-enhancer.ts`

This module takes a rough user prompt + optional character record and returns a Claude-enhanced prompt with full scene description.

```typescript
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface CharacterRef {
  name: string
  physical_description: string
  art_style: string
  negative_prompt: string
}

export interface EnhancedPrompt {
  enhanced: string
  negative: string
  notes: string
}

export async function enhancePrompt(
  rawPrompt: string,
  character?: CharacterRef,
  context?: string  // optional: "this is for a lesson about water cycle"
): Promise<EnhancedPrompt> {
  const characterBlock = character
    ? `The primary character in this image is ${character.name}.
Physical description: ${character.physical_description}
Art style: ${character.art_style}
`
    : ''

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5',  // Haiku for speed — this runs before every generation
    max_tokens: 400,
    system: `You are a professional AI image prompt engineer for educational content.
Your job is to take a rough image concept and expand it into a detailed, specific prompt
that will produce consistent, high-quality, child-appropriate educational illustrations.

Rules:
- Always describe scene, lighting, composition, style in the enhanced prompt
- If a character is provided, put their physical description FIRST in the prompt
- Keep educational content age-appropriate (K-12)
- End with style tags separated by commas
- Return JSON: { "enhanced": "...", "negative": "...", "notes": "..." }
- enhanced: the full prompt to send to the image API
- negative: things to explicitly exclude
- notes: 1 sentence explaining your key changes`,

    messages: [{
      role: 'user',
      content: `Raw concept: "${rawPrompt}"
${characterBlock}
${context ? `Context: ${context}` : ''}

Enhance this into a detailed image generation prompt.`
    }]
  })

  const raw = (message.content[0] as { type: string; text: string }).text
  try {
    return JSON.parse(raw)
  } catch {
    return { enhanced: rawPrompt, negative: '', notes: 'Enhancement failed — used raw prompt' }
  }
}
```

---

## Step 3.4 — API routes for Characters

**File to create:** `src/app/api/characters/route.ts`

```typescript
// GET /api/characters           — list all active characters
// POST /api/characters          — create new character
import { getSupabaseServiceRoleClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const createSchema = z.object({
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(100),
  description: z.string().default(''),
  role: z.string().default(''),
  physical_description: z.string().default(''),
  art_style: z.string().default(''),
  negative_prompt: z.string().default(''),
  preferred_provider: z.enum(['openai', 'stability', 'replicate', 'leonardo']).default('replicate'),
})

export async function GET() {
  const supabase = getSupabaseServiceRoleClient()
  if (!supabase) return NextResponse.json({ error: 'DB unavailable' }, { status: 500 })
  const { data, error } = await supabase
    .from('characters')
    .select('*')
    .eq('is_active', true)
    .order('name')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const supabase = getSupabaseServiceRoleClient()
  if (!supabase) return NextResponse.json({ error: 'DB unavailable' }, { status: 500 })
  const body = await request.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 })
  const { data, error } = await supabase.from('characters').insert(parsed.data).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
```

**File to create:** `src/app/api/characters/[id]/route.ts`

```typescript
// GET PUT DELETE /api/characters/[id]
// Full CRUD. PATCH for partial updates on reference_images, hero_image_url, etc.
```

---

## Step 3.5 — Wire prompt enhancer into image generation route

> **✅ DECISION LOCKED (Q-3-2): Character consistency uses Leonardo Custom Model fine-tune (Phoenix, `modelType: CHARACTERS`). Blocker cleared.**
>
> **Two-layer approach (both live in the same `characters` record):**
> - **Bridge (immediate, no training):** Pass `character.reference_images` as `imagePrompts` (weight 0.75) to Leonardo Phoenix. Works now. Output quality: "good 3D cartoon dog, not quite Gimli."
> - **Production (identity-level):** Train a Leonardo Custom Model on ToonBee Gimli images. Trained `modelId` stored in `characters.lora_model_id`. Generation uses the LoRA model ID instead of Phoenix base. Output quality: "this looks like my actual dog."
>
> **Bridge implementation (when `lora_model_id` is null — already live):**
> ```typescript
> // Leonardo generation with imagePrompts reference injection
> imagePrompts = validIds.map((imagePromptId) => ({ imagePromptId, weight: 0.75 }));
> genBody.modelId = "6b645e3a-d64f-4341-a6d8-7a3690fbf042"; // Phoenix base
> ```
>
> **LoRA implementation (when `lora_model_id` is set — identity-level consistency):**
> ```typescript
> genBody.modelId = character.lora_model_id; // Fine-tuned on Gimli ToonBee images
> // imagePrompts reference injection still applies on top of LoRA for extra lock
> ```
>
> **To train:** Generate 3D-render Gimli images via Leonardo Image tab (RENDER_3D preset, white background, Pixar-style) → train Custom Model (Flux Dev, Characters, Medium strength) → store returned model UUID as `lora_model_id`. One-time per character. Full workflow in Phase 3.5.
>
> *⚠️ March 27, 2026: LoRA training abandoned. Leonardo REST API does not expose user-trained model UUIDs. UUID inaccessible programmatically. FLUX.1 Kontext is the answer — see Phase 9. Phase 3.5 is buried.*

**File to modify:** `src/app/api/images/generate/route.ts`

**What changes:**
1. Accept optional `characterId` and `context` in request body
2. If `characterId` provided: fetch character from Supabase
3. Call `enhancePrompt(rawPrompt, character, context)` before hitting image API
4. Store `prompt_original`, `prompt_enhanced`, `character_id` on the `generated_images` row

**Request body shape change:**

```typescript
// Old
const { prompt, provider, style, negativePrompt, ... } = await req.json()

// New — add:
const { prompt, provider, style, negativePrompt, characterId, context, ... } = await req.json()
```

**Before calling image provider:**

```typescript
let finalPrompt = prompt
let finalNegative = negativePrompt ?? ''
let enhancementNotes = ''

if (characterId) {
  const { data: character } = await supabase
    .from('characters')
    .select('name, physical_description, art_style, negative_prompt, preferred_provider')
    .eq('id', characterId)
    .single()

  if (character) {
    const enhanced = await enhancePrompt(prompt, character, context)
    finalPrompt = enhanced.enhanced
    finalNegative = enhanced.negative || character.negative_prompt
    enhancementNotes = enhanced.notes
    // If provider not explicitly specified, use character's preferred provider
    if (!body.provider) provider = character.preferred_provider
  }
}
```

**On insert to `generated_images`:**

```typescript
await supabase.from('generated_images').insert({
  ...existingFields,
  character_id: characterId ?? null,
  prompt_original: prompt,
  prompt_enhanced: finalPrompt,
  enhancement_notes: enhancementNotes,
})
```

---

## Step 3.6 — Character picker in Creative Studio

**File to modify:** `src/components/image-generation-studio.tsx`

**What to add:**
1. Fetch characters on mount: `GET /api/characters`
2. Character selector dropdown above the prompt field
3. When a character is selected: pre-fill art style into the prompt, note that enhancement will fire
4. Send `characterId` with the generate request

```typescript
// Add state
const [characters, setCharacters] = useState<Character[]>([])
const [selectedCharacter, setSelectedCharacter] = useState<string>('')

// Fetch on mount
useEffect(() => {
  fetch('/api/characters').then(r => r.json()).then(setCharacters)
}, [])

// Add to render — above the prompt textarea
<div className="mb-3">
  <label className="block text-xs text-amber-400 mb-1">Character (optional)</label>
  <select
    value={selectedCharacter}
    onChange={e => setSelectedCharacter(e.target.value)}
    className="w-full bg-zinc-900 border border-amber-800/40 rounded px-3 py-2 text-sm"
  >
    <option value="">No character — generate freely</option>
    {characters.map(c => (
      <option key={c.id} value={c.id}>{c.name} — {c.role}</option>
    ))}
  </select>
  {selectedCharacter && (
    <p className="text-xs text-zinc-500 mt-1">
      Claude will enhance your prompt with {characters.find(c=>c.id===selectedCharacter)?.name}'s physical description.
    </p>
  )}
</div>
```

---

## Step 3.7 — Upload Gimli reference images manually

> **✅ DECISION LOCKED (Q-3-1):** Scott has **ToonBee cartoon illustrations of Gimli already generated**. These become both the LoRA training set AND the reference injection bridge — no new generation needed, no Leonardo dependency.
>
> **Step 3.7 actions:**
> 1. Upload 10-20 ToonBee Gimli illustrations to Cloudinary at `somerschool/characters/gimli/ref-{n}.jpg`.
> 2. Set `reference_images` array in the Gimli character seed to those Cloudinary URLs.
> 3. Set `primary_reference_url` to the best single reference image.
> 4. **Bridge (works immediately):** `reference_images` are passed to Replicate Flux image-to-image — Gimli shows up consistently, no training wait.
> 5. **LoRA (next step, one-time 20-min job):** Feed those same Cloudinary URLs into `ostris/flux-dev-lora-trainer` on Replicate → trained model ID → stored as `lora_model_id` → identity-level consistency in every future generation.
>
> *⚠️ March 27, 2026: LoRA abandoned. See Phase 3.5 (buried) and Phase 9 (FLUX.1 Kontext — the actual solution).*

After deciding:

1. Generate or select Gimli reference images (see decision above)
2. Upload to Cloudinary: `cloudinary upload {file} --folder somerschool/characters/gimli`
3. Note the Cloudinary URLs
4. In Chapterhouse `/settings` (or directly via Supabase Dashboard), update Gimli's `reference_images` array with these URLs and set `hero_image_url` to the best one

---

## Phase 3 SMOKE TEST

> **✅ COMPLETE — March 24, 2026 (Sessions 29-30).** `characters` table (migration 024) + Gimli seed (024b, ToonBee reference images → Cloudinary) shipped. `src/lib/prompt-enhancer.ts` (Claude Haiku, physical_description front-loaded, art_style locked, features ×2). Character picker in `image-generation-studio.tsx`. `/api/characters/` CRUD routes. 3-tier Replicate character injection in `worker/src/jobs/course-slide-images.ts`. 6 bug-fix commits: model endpoint format, REPLICATE_API_TOKEN env name, provider enforcement, reference images correctly passed to Replicate img2img + Leonardo imagePrompts[], invalid Leonardo fields removed. `generated_images` extended with `character_id`, `prompt_original`, `prompt_enhanced`, `enhancement_notes`.

1. Open `/creative-studio`, Images tab
2. Character dropdown shows "Gimli — Curriculum explainer mascot for SomersSchool K-5 lessons"
3. Select Gimli, type prompt: "teaching about rainbows"
4. Generate with Replicate (flux-schnell or flux-dev + reference image if set) — should use Gimli's physical description in the actual API call
5. Check `generated_images` table in Supabase — should have `character_id`, `prompt_original`, `prompt_enhanced` all populated
6. `prompt_enhanced` should mention Gimli's malamute description

---

---

# PHASE 3.5 — CHARACTER LORA TRAINING

> ❌ **ABANDONED — March 27, 2026.**
>
> Leonardo's training UI works and the Gimli model trained successfully. The problem: **Leonardo's REST
> API does not expose user-trained model UUIDs.** The UUID only appears inside the Leonardo web UI under
> More → Models. There is no `GET /models/mine` endpoint and no way to retrieve it programmatically.
> Four hours lost trying to recover the UUID.
>
> **LoRA as an approach is dead for this project.** The underlying assumption — that training produces a
> UUID you can use in API calls — is false in Leonardo's implementation.
>
> **The answer is FLUX.1 Kontext** (already in Leonardo Premium). Inference-time character conditioning:
> feed a reference image at generation time, the model produces consistent character output in the new
> scene. No training loop. No UUID. No 20-minute wait. Works in seconds. This is what ToonBee does.
>
> **See Phase 9** for the implemented Kontext solution. The content below is preserved as a record
> of what was tried and why it was abandoned.

**WHAT:** Fine-tune Leonardo Flux Dev on a character's reference images to produce a character-specific model. Every image generated with the LoRA model looks like *that specific character* regardless of scene, prompt, or run — not just "similar style."

**WHY:** Reference injection (imagePrompts, weight 0.75) is the bridge — it helps, but Phoenix doesn't truly *learn* Gimli. A fine-tuned custom model bakes character identity into the weights. The difference is "good 3D cartoon dog" (bridge) vs. "this is my actual dog" (LoRA). With 168 lesson slides in sci-g1 alone, that difference compounds fast.

**The repeatable pattern — works for every character:**
```
New character created → upload 10–20 reference images → kick off training →
wait ~20 min → store returned modelId → lora_model_id set →
all future generations use LoRA, both Creative Studio and Course Asset pipeline
```

**BEFORE:**
- `characters.lora_model_id` = NULL for all characters
- All Leonardo generations use Phoenix base model + imagePrompts reference injection
- Output: consistent 3D cartoon style but character identity drifts across scenes

**AFTER:**
- `characters.lora_model_id` = Leonardo custom model UUID per trained character
- All Leonardo generations for that character use the fine-tuned model
- Output: character identity locked regardless of scene prompt variation

---

## Step 3.5.1 — Collect training images

> **✅ DONE — March 24, 2026.** Training images generated and uploaded to Leonardo for Gimli's first LoRA run.

Generate 10–20 3D-render-style malamute images via Leonardo Image tab. **Do NOT use ToonBee images** — ToonBee is retired and uses a different art style that would produce an inconsistent LoRA.

**Art style locked for Gimli: Option A — 3D Render (Pixar-style)**
- Clean white background
- Volumetric fur, warm lighting
- Pixar-adjacent proportions
- Generated via Leonardo Phoenix/Flux with RENDER_3D preset

**What makes a good training image:**
- Different angles: front, 3/4, side, slight overhead
- Different expressions: neutral, happy, confused, cross-eyed (his signature)
- Consistent 3D render style — NO mixing with flat cartoon or dark cinematic styles
- Clean white or simple background
- Minimum 1024×1024 (Flux Dev native resolution)
- No watermarks, no text, no other characters cropped into frame

Generate in batches of 4 from the Image tab. Download the best 15–20 and upload to Leonardo training.

---

## Step 3.5.2 — Train the LoRA via Leonardo web UI (Gimli, one-time)

> **✅ TRAINING NOW — March 24, 2026.** Gimli LoRA submitted and training. Awaiting completion (~15-25 min).

The web UI is the fastest path for Gimli. For all future characters, use the programmatic API route in Step 3.5.5 — one button click from inside Chapterhouse.

**⚠️ CORRECTION FROM DOCS:** Base Model is **Flux Dev**, NOT Phoenix. Phoenix is not available as a LoRA base in the current Leonardo UI. Always double-check the base model dropdown before hitting Start Training.

1. Go to [leonardo.ai](https://leonardo.ai) → More → **Models & Training** → **Train New Model**
2. Settings used for Gimli (first run):
   - **Name:** `Gimli`
   - **Description:** `Gimli First Try`
   - **Base Model:** Flux Dev (1024×1024) ← **this is the correct base**
   - **Category:** Character (NOT Style or Object)
   - **Training Strength:** Medium (leave default)
3. Upload your 15–20 3D-render Gimli images
4. **Instance Prompt:** `GIMLI` — trigger token for generation prompts (e.g. `GIMLI teaching fractions at a chalkboard`)
5. Click **Start Training ⓔ2** — costs 2 tokens, ~15–25 minutes
6. When complete, go to **My Models** → click the new model → copy its **Model ID** (UUID format)

**Cost:** 2 Leonardo tokens (~$0 on Premium plan token budget). One-time per character.

---

## Step 3.5.3 — Store the model ID in Supabase

Run in Supabase Dashboard → SQL Editor:

```sql
UPDATE characters
SET lora_model_id = '{YOUR_LEONARDO_MODEL_UUID}'
WHERE slug = 'gimli';
```

That's the entire integration. Both generation routes (`src/app/api/images/generate/route.ts` and `worker/src/jobs/course-slide-images.ts`) already check `character.lora_model_id` and substitute it for the Phoenix base model ID when set. No deploy needed.

---

## Step 3.5.4 — How the code uses it (already wired — March 24, 2026)

Both generation routes implement the same pattern:

```typescript
// LoRA model wins over Phoenix base when set
modelId: character?.lora_model_id ?? "6b645e3a-d64f-4341-a6d8-7a3690fbf042"
```

When `lora_model_id` is NULL → Phoenix base + reference injection bridge.
When `lora_model_id` is set → fine-tuned model (reference injection still applies on top for extra lock).

No additional code changes needed when you store a new model ID. SQL update → immediate effect on all future generations.

---

## Step 3.5.5 — Programmatic training route (for all future characters)

Build a "Train LoRA" button in the Character Library Settings panel. One click kicks off the whole training pipeline without leaving Chapterhouse.

**File to create:** `src/app/api/characters/[id]/train-lora/route.ts`

```typescript
// POST /api/characters/[id]/train-lora
// 1. Creates a Leonardo dataset
// 2. Uploads all character.reference_images to the dataset (presigned S3 upload)
// 3. Triggers Phoenix fine-tune training (modelType: CHARACTERS)
// 4. Returns {training_model_id, status: 'training', expected_minutes: 20}

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  if (!supabase) return Response.json({ error: "DB unavailable" }, { status: 500 });

  const key = process.env.LEONARDO_API_KEY ?? process.env.LEONARDO_AI_API_KEY;
  if (!key) return Response.json({ error: "LEONARDO_API_KEY not configured" }, { status: 500 });

  const { data: char } = await supabase
    .from("characters")
    .select("slug, name, reference_images")
    .eq("id", id)
    .single();

  if (!char) return Response.json({ error: "Character not found" }, { status: 404 });
  if (!char.reference_images?.length || char.reference_images.length < 5) {
    return Response.json({ error: "Upload at least 5 reference images before training" }, { status: 400 });
  }

  // 1. Create dataset
  const dsRes = await fetch("https://cloud.leonardo.ai/api/rest/v1/datasets", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name: `${char.name} LoRA Training Set` }),
  });
  const dsData = await dsRes.json() as { insert_datasets_one?: { id: string } };
  const datasetId = dsData.insert_datasets_one?.id;
  if (!datasetId) return Response.json({ error: "Failed to create Leonardo dataset" }, { status: 500 });

  // 2. Upload reference images to dataset
  await Promise.all(
    char.reference_images.map(async (imgUrl: string) => {
      const uploadRes = await fetch(
        `https://cloud.leonardo.ai/api/rest/v1/datasets/${datasetId}/upload`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
          body: JSON.stringify({ extension: "jpg" }),
        }
      );
      const uploadData = await uploadRes.json() as { uploadDatasetImage?: { url: string; fields: string } };
      const { url, fields } = uploadData.uploadDatasetImage ?? {};
      if (!url || !fields) return;
      const imgBlob = await (await fetch(imgUrl)).blob();
      const fieldsObj: Record<string, string> = JSON.parse(fields);
      const formData = new FormData();
      for (const [k, v] of Object.entries(fieldsObj)) formData.append(k, v);
      formData.append("file", imgBlob, "ref.jpg");
      await fetch(url, { method: "POST", body: formData });
    })
  );

  // 3. Kick off training
  const triggerWord = char.slug.toUpperCase().replace(/-/g, "_"); // 'gimli' → 'GIMLI'
  const trainRes = await fetch("https://cloud.leonardo.ai/api/rest/v1/models", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      name: `${char.name} Character LoRA`,
      description: `Character LoRA for ${char.name} — SomersSchool curriculum asset`,
      modelType: "CHARACTERS",
      nsfw: false,
      notSafeForWork: false,
      resolution: 1024,        // Flux Dev native resolution
      datasetId,
      num_train_epochs: 10,
      learning_rate: 0.0001,
      instance_prompt: triggerWord,
      sd_version: "FLUX_DEV",  // ⚠️ Flux Dev — NOT Phoenix. Confirmed March 24, 2026.
      strength: "MEDIUM",
    }),
  });
  const trainData = await trainRes.json() as { sdTrainingJob?: { customModelId?: string } };
  const trainingModelId = trainData.sdTrainingJob?.customModelId;
  if (!trainingModelId) return Response.json({ error: "Training failed to start" }, { status: 500 });

  return Response.json({
    training_model_id: trainingModelId,
    status: "training",
    expected_minutes: 20,
    trigger_word: triggerWord,
    next_step: `Poll GET /api/characters/${id}/lora-status?modelId=${trainingModelId} until status = COMPLETE`,
  });
}
```

**File to create:** `src/app/api/characters/[id]/lora-status/route.ts`

```typescript
// GET /api/characters/[id]/lora-status?modelId={trainingModelId}
// Polls Leonardo for training status. When COMPLETE, auto-writes lora_model_id to characters table.

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const modelId = searchParams.get("modelId");
  if (!modelId) return Response.json({ error: "modelId param required" }, { status: 400 });

  const key = process.env.LEONARDO_API_KEY ?? process.env.LEONARDO_AI_API_KEY;
  if (!key) return Response.json({ error: "LEONARDO_API_KEY not configured" }, { status: 500 });

  const res = await fetch(`https://cloud.leonardo.ai/api/rest/v1/models/${modelId}`, {
    headers: { Authorization: `Bearer ${key}` },
  });
  const data = await res.json() as { custom_models_by_pk?: { status: string } };
  const status = data.custom_models_by_pk?.status ?? "PENDING";

  if (status === "COMPLETE") {
    const supabase = await createClient();
    if (supabase) {
      await supabase.from("characters").update({ lora_model_id: modelId }).eq("id", id);
    }
    return Response.json({
      status: "COMPLETE",
      lora_model_id: modelId,
      message: "lora_model_id saved to character — all future generations use this model",
    });
  }

  return Response.json({ status, lora_model_id: null });
}
```

**UI hook in Character Library settings panel:** Poll `lora-status` every 30 seconds after training kicks off. Show a progress spinner. When status = COMPLETE, show "✅ LoRA trained — {trigger_word} is locked" and update the character card.

---

## Phase 3.5 SMOKE TEST

1. Train Gimli LoRA via Leonardo web UI (Step 3.5.2) — copy the model UUID
2. Run SQL: `UPDATE characters SET lora_model_id = '{uuid}' WHERE slug = 'gimli';`
3. Open Creative Studio → select Gimli → type "GIMLI teaching fractions at a chalkboard" → Generate
4. Compare to prior generations — Gimli's face, body proportions, and fur pattern should be significantly more consistent with your ToonBee references
5. Generate 3 more different scenes — confirm character identity holds across all of them
6. Check `generated_images` table — `model` column should contain the custom model UUID, not `"6b645e3a-d64f-4341-a6d8-7a3690fbf042"`

**For future characters:** POST to `/api/characters/{id}/train-lora` → 20 min → GET `/api/characters/{id}/lora-status?modelId={id}` until `status: COMPLETE` → character is locked.

---

---

# PHASE 4 — VIDEO TAB REBUILD

**WHAT:** Tear out the HeyGen-only video form. Replace with a character-first, multi-provider video generation system. Character selected first. Provider chosen second. Claude enhances the scene description. Video lands in a Review Queue panel.

**WHY:** Phase 9 produces a consistent Kontext-generated `hero_image_url` for every character. Phase 4 takes that image and animates it into a video clip. This is the hand-off point in the pipeline: character image → animated video → assembled lesson (Phase 6). For Gimli K-5 clips, **evaluate Leonardo Video tab FIRST** — Scott has Premium ($24/mo, already active). Feed the Kontext-generated Gimli hero image → Leonardo Video tab → animated clip. If quality is sufficient → skip Kling subscription ($29.99/mo saved). Kling AI second if Leonardo Video is inadequate. D-ID handles talking-head lip-sync (source image + audio → video). HeyGen = Scott Mr. S avatar only. Having a character-first architecture means the same workflow generates all types.

**BEFORE:**
- `src/components/video-generator.tsx`: HeyGen-only form with `avatarId`, `voiceId`, dimension picker
- `src/app/api/video/generate/route.ts`: Calls `https://api.heygen.com/v2/video/generate`
- `src/app/api/video/status/route.ts`: Polls HeyGen status endpoint

**AFTER:**
- `src/components/video-generator.tsx`: Rebuilt — character picker, provider picker, scene description, async job
- New provider routes for D-ID + Kling AI (alongside kept HeyGen route)
- Video generation creates a Railway async job (video takes 30-120 seconds)
- Generated videos stored in `generated_videos` table
- Video approval happens from a "Videos" tab in `/creative-studio` (not the existing Research review queue)

---

## Step 4.1 — New DB table for generated videos

Add to existing migration or create new:

**File to create:** `supabase/migrations/20260601_025_create_generated_videos.sql`

```sql
CREATE TABLE generated_videos (
  id              UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ  DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  DEFAULT NOW(),
  user_id         UUID         REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Generation inputs
  character_id     UUID         REFERENCES characters(id) ON DELETE SET NULL,
  provider         TEXT         NOT NULL CHECK (provider IN ('heygen', 'did', 'kling', 'wan', 'runway', 'pika')),
  scene_description TEXT        NOT NULL,  -- raw from Scott
  scene_enhanced   TEXT,                   -- Claude-enhanced IMAGE prompt (static frame)
  video_motion_prompt TEXT,               -- Claude-enhanced VIDEO MOTION prompt (how camera/scene moves)
                                          -- Distinct from image prompt — ToonBee uses two layers of AI direction per scene
  scene_duration_seconds FLOAT DEFAULT 6.0, -- Per-scene duration; ToonBee default = 6.0s, 7 scenes = ~42s total
  audio_source     TEXT         CHECK (audio_source IN ('tts', 'upload', 'none')),
  tts_text         TEXT,                   -- if audio_source = 'tts'
  tts_voice_id     TEXT,                   -- ElevenLabs voice ID

  -- Async job
  job_id           UUID         REFERENCES jobs(id) ON DELETE SET NULL,
  provider_job_id  TEXT,                   -- the video ID from the provider

  -- Output
  video_url        TEXT,                   -- final video URL from provider
  cloudinary_url   TEXT,                   -- permanent CDN URL after save
  thumbnail_url    TEXT,
  duration_seconds FLOAT,

  -- Review
  status           TEXT         NOT NULL DEFAULT 'generating'
                                CHECK (status IN ('generating','ready','approved','rejected','failed')),
  approved_at      TIMESTAMPTZ,
  usage_context    TEXT,                   -- "sci-g1-u1-l01 intro video", "NCHO promo", etc.

  -- Metadata
  metadata         JSONB        NOT NULL DEFAULT '{}'
);

CREATE TRIGGER set_generated_videos_updated_at
  BEFORE UPDATE ON generated_videos
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER PUBLICATION supabase_realtime ADD TABLE generated_videos;

ALTER TABLE generated_videos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated users only" ON generated_videos
  FOR ALL USING (auth.role() = 'authenticated');
```

---

## Step 4.2 — New API routes for video generation

**File to create:** `src/app/api/video/generate-v2/route.ts`

(Keep the old `/api/video/generate` for HeyGen backward compat — create a parallel v2 route)

```typescript
// POST /api/video/generate-v2
// Request: { characterId?, provider, sceneDescription, audioSource, ttsText?, ttsVoiceId? }
// Returns: { videoId (generated_videos.id), jobId (for Realtime tracking) }

// Flow:
// 1. Fetch character if characterId provided
// 2. Call enhancePrompt(sceneDescription, character) for scene enhancement
// 3. Insert row into generated_videos (status: 'generating')
// 4. Create Railway job (type: 'video_generate', payload: { videoId, provider, ... })
// 5. Return { videoId, jobId }
```

---

## Step 4.3 — D-ID provider integration

**D-ID API (talking head — reference photo + audio → lip-synced video):**

- Endpoint: `POST https://api.d-id.com/talks`
- Auth: Basic auth with `Authorization: Basic {base64(api_key:)}`
- Request body:
```json
{
  "source_url": "https://cloudinary.../gimli-ref.jpg",
  "script": {
    "type": "text",
    "input": "Hello! Today we are going to learn about the water cycle.",
    "provider": {
      "type": "elevenlabs",
      "voice_id": "EXAVITQu4vr4xnSDxMaL"
    }
  }
}
```
- Response: `{ id: "tlk_xxx", status: "created" }`
- Poll: `GET https://api.d-id.com/talks/{id}` until `status === "done"`, then `result_url` has the video

**File to create:** `src/app/api/video/providers/did/route.ts`

```typescript
// Internal route called by the Railway worker via HTTP
// POST /api/video/providers/did
// Body: { sourceImageUrl, scriptText, elevenLabsVoiceId, videoId }

const response = await fetch('https://api.d-id.com/talks', {
  method: 'POST',
  headers: {
    'Authorization': `Basic ${Buffer.from(`${process.env.DID_API_KEY}:`).toString('base64')}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    source_url: sourceImageUrl,
    script: {
      type: 'text',
      input: scriptText,
      provider: { type: 'elevenlabs', voice_id: elevenLabsVoiceId }
    }
  })
})
```

**Add to `src/lib/env.ts`:** `DID_API_KEY`

---

## Step 4.4 — Kling AI provider integration

> **✅ DECISION LOCKED (Q-4-1):** Kling AI is in Phase 4 — not deferred. D-ID and Kling ship together. They handle different use cases:
> - **D-ID** — talking head: Gimli/Scott reference image + ElevenLabs audio → lip-synced video. Use for lesson segments where Gimli speaks directly to the student.
> - **Kling** — animated clip: Gimli reference image + scene description → cartoon Gimli in motion. Use for intros, transitions, and celebration moments.

**Credit economics from ToonBee research (March 24, 2026):**
ToonBee's provider dropdown reveals the market pricing. Kling 2.1 costs 14 ToonBee credits/video vs WAN at 3cr/video. For 168 sci-g1 videos:
- WAN (free tier): 168 × 3cr = **504 credits** — viable
- Kling 2.1 via ToonBee: 168 × 14cr = **2,352 credits** — expensive through ToonBee's markup
- **Kling direct API billing is per-second**, not per-credit. At 5s/clip, direct API likely far cheaper than ToonBee's 14cr markup. Verify before committing to Kling for bulk course production.
- **WAN model (WAN-Video):** Check if available via Replicate or HuggingFace inference API. If yes, use WAN for bulk course generation (cost) and Kling/D-ID for hero content (quality).
- ToonBee's free tier providers beyond WAN: Hailuo 2.3 (6cr), Seedance 1 PRO (6cr/8cr) — these are likely Wan Video variants. All worth testing via direct API before defaulting to Kling everywhere.

**Note on Kling JWT:** Kling uses HS256 JWT with specific payload fields. **Read `https://platform.klingai.com/docs` before writing a single line of auth code.** Do not guess the JWT structure — it must match exactly or calls fail silently.

- Endpoint: `POST https://api-global.kuaishou.com/kling/v1/videos/image2video`
- Auth: JWT generated fresh per request from `KLING_API_KEY` + `KLING_API_SECRET` key pair
- Input: `{ image: characterRefUrl, prompt: enhancedScenePrompt, duration: '5', aspect_ratio: '16:9' }`
- **Pass `video_motion_prompt` to Kling, not `scene_enhanced`** — image providers get the static prompt; video providers get the motion prompt. Two separate Claude outputs.
- File to create: `src/app/api/video/providers/kling/route.ts`
- Railway env vars required: `KLING_API_KEY`, `KLING_API_SECRET`

**Add WAN provider:**
- File to create: `src/app/api/video/providers/wan/route.ts`
- Evaluate: Replicate `wan-video` model or direct Wan API. Cost target: <$0.05/video for bulk production.
- Fallback for Kling if character consistency passes threshold at lower cost.

---

## Step 4.5 — Video generate Worker job type

**File to modify:** `worker/src/jobs/router.ts`

Add case: `case 'video_generate': → runVideoGenerate()`

**File to create:** `worker/src/jobs/video-generate.ts`

```typescript
// Full async video generation flow
// 1. updateProgress(jobId, 10, 'Fetching character reference...')
// 2. If provider === 'did': call D-ID API → get provider_job_id
// 3. If provider === 'kling': call Kling API → get provider_job_id
// 4. updateProgress(jobId, 30, 'Video generation in progress...')
// 5. Poll provider every 10 seconds until complete or timeout (180s)
// 6. On success: update generated_videos with video_url + thumbnail
// 7. updateProgress(jobId, 100, 'Video ready for review', 'completed', { videoUrl })
// 8. Update generated_videos.status → 'ready'
```

---

## Step 4.6 — Rebuilt video-generator.tsx component

**File to modify:** `src/components/video-generator.tsx` — gut and rebuild

**New UI structure (informed by ToonBee BeeGuide full-pipeline research):**

```
[ Character ] ← ComboBox pulling from /api/characters
[ Provider  ] ← WAN (fast/cheap) / Kling AI (animated, quality) / D-ID (talking head) / HeyGen (Scott only)
[ Scene description ] ← textarea, rough concept
  → "Claude will generate both an image prompt and a motion prompt from this"
[ Scene Duration ] ← number input, default 6.0s (ToonBee default; 7 scenes × 6s = 42s)
[ Audio ] ← None / Text-to-speech / Upload audio
  → If TTS: voice picker (ElevenLabs voices)
  → If TTS: narration script textarea (separate from scene description)
[ Usage context ] ← text input, "sci-g1-u1-l01 intro", "NCHO promo"
[ Generate button ] → creates Railway job, shows Realtime progress bar
```

**Dual prompt generation (Claude step before provider call):**
Claude receives: character record + scene description → outputs TWO prompts:
1. **Image prompt** — static frame description for scene thumbnail / reference (`scene_enhanced`)
2. **Video motion prompt** — how camera moves, what action occurs, atmosphere details (`video_motion_prompt`)
Image providers receive `scene_enhanced`. Video providers receive `video_motion_prompt`. Never swapped.

**Style-reference for new character consistency:**
When generating character images in Phase 3, the Character picker for "Generate Character" should offer an existing character as visual style reference. ToonBee calls this "Image Reference As Style" — selecting Gimli as reference for Ninja Master ensures both characters live in the same art style. This is the `imagePrompts[0]` pattern already partially wired in Leonardo integration. Surface this in the Phase 3 character generation UI.

**After job completes:**
- Video previews in the component (HTML5 `<video>` element)
- "Approve" button → sets `generated_videos.status = 'approved'`
- "Reject" button → sets `status = 'rejected'`
- "Save to CDN" button → uploads to Cloudinary, sets `cloudinary_url`

---

## Step 4.7 — Add Videos tab to Creative Studio

**File to modify:** `src/app/creative-studio/page.tsx`

Change from 3-tab (Images / Sounds / Video) to 4-tab (Images / Sounds / Video / My Videos).

"My Videos" tab shows `generated_videos` table filtered to last 30 days, grouped by status (ready / approved / generating / rejected). Each card shows video preview + character + provider.

---

## Phase 4 SMOKE TEST

1. Open `/creative-studio`, Video tab
2. Select Gimli as character
3. Select D-ID as provider (talking head — fastest to validate)
4. Type scene: "Gimli sitting at a school desk explaining photosynthesis"
5. Confirm Claude generates BOTH `scene_enhanced` (image prompt) AND `video_motion_prompt` (motion prompt) — check the Railway job payload in Supabase `jobs` to verify both fields are populated and distinct
6. Set audio: TTS, pick a voice, type: "Today we are learning about how plants make food!"
7. Set scene duration: 6.0s (default)
8. Click Generate — Railway job created, Realtime progress bar appears
9. Wait 60-120 seconds — video appears in the component
10. Click Approve — `generated_videos.status` changes to `'approved'`
11. Check Supabase `generated_videos` table — `scene_enhanced`, `video_motion_prompt`, `scene_duration_seconds` all populated
12. **Kling test (second pass):** Repeat steps 2-11, switch provider to Kling. Compare character consistency against D-ID output. Decision gate: does Kling hold Gimli's visual identity better than D-ID for animated clips?
13. **WAN test (cost validation):** If WAN available via Replicate, run ONE clip. Compare output quality vs cost vs Kling. Document result.

---

---

# PHASE 5 — BUNDLE MIGRATION (OPTION C) + COURSE ASSET DASHBOARD

**WHAT:** Migrate all 25+ bundle JSON files from CoursePlatform's `data/bundles/*.json` flat files into a `bundles` table in CoursePlatform's Supabase. Give Chapterhouse read/write access to that Supabase project. Build the Course Asset Dashboard in Chapterhouse — a grid of 24 lessons showing which of 5 asset types have been generated.

**WHY:** Chapterhouse cannot see the CoursePlatform's disk files — they're on different servers. To let Chapterhouse generate course assets (images, audio, videos) and write the URLs back where CoursePlatform can read them, both apps must share the same database.

**BEFORE:**
- `data/bundles/*.json` = 25 files on disk, readable only by CoursePlatform
- `/api/learn/[slug]/[lessonSlug]/route.ts` reads bundle from `data/bundles/{lessonSlug}.json`
- Chapterhouse has no visibility into what course assets are generated

**AFTER:**
- `bundles` table in CoursePlatform's Supabase — full bundle JSON in `content JSONB` column, plus denormalized asset-status columns
- CoursePlatform lesson loader reads from Supabase (with disk fallback during cutover)
- Chapterhouse connects to CoursePlatform's Supabase via `COURSE_SUPABASE_URL` + `COURSE_SUPABASE_SERVICE_ROLE_KEY`
- Chapterhouse shows Course Asset Dashboard — course picker → 24-lesson grid → 5 status dots per lesson → "Generate All Missing" button

---

## Step 5.1 — Schema design: `bundles` table

This runs in **CoursePlatform's Supabase** (not Chapterhouse's).

**File to modify:** `data/supabase-schema.sql` (CoursePlatform) — add to bottom:

```sql
-- Bundles: full lesson content + asset status tracking
-- Primary key: bundle ID string (e.g. 'sci-g1-u1-l01')
CREATE TABLE bundles (
  -- Identity: matches bundle JSON top-level fields
  id              TEXT         PRIMARY KEY,   -- 'sci-g1-u1-l01'
  subject         TEXT         NOT NULL,      -- 'Science', 'Language Arts', 'Mathematics', 'Social Studies'
  subject_code    TEXT         NOT NULL,      -- 'sci', 'ela', 'math', 'hst'
  grade           INTEGER      NOT NULL,
  grade_band      TEXT         NOT NULL,      -- 'K-2', '3-5', '6-8', '9-12'
  unit            INTEGER      NOT NULL,
  lesson          INTEGER      NOT NULL,
  bundle_number   INTEGER      NOT NULL,
  title           TEXT         NOT NULL,
  big_idea        TEXT,

  -- Asset status (denormalized — updated by generation jobs, read by Course Asset Dashboard)
  slides_count       INTEGER   NOT NULL DEFAULT 0,    -- total slides in this bundle
  slides_generated   INTEGER   NOT NULL DEFAULT 0,    -- slides with image_url populated
  audio_generated    BOOLEAN   NOT NULL DEFAULT false,
  audio_url          TEXT,                             -- Cloudinary URL if generated
  videos_count       INTEGER   NOT NULL DEFAULT 0,    -- total video segments (typically 7)
  videos_generated   INTEGER   NOT NULL DEFAULT 0,    -- segments with cloudinary_url
  worksheet_present  BOOLEAN   NOT NULL DEFAULT false, -- worksheet object exists and non-empty

  -- Full content (the entire bundle JSON v2 content)
  content         JSONB        NOT NULL,

  -- Sync metadata
  created_at      TIMESTAMPTZ  DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  DEFAULT NOW(),
  last_synced_at  TIMESTAMPTZ,                        -- when this row was last read from disk source
  schema_version  TEXT         NOT NULL DEFAULT '2.0'
);

-- Indexes for Course Asset Dashboard queries
CREATE INDEX bundles_subject_grade_idx ON bundles(subject_code, grade);
CREATE INDEX bundles_status_idx ON bundles(audio_generated, slides_generated);

-- Update trigger
CREATE OR REPLACE FUNCTION set_bundles_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_bundles_updated_at
  BEFORE UPDATE ON bundles
  FOR EACH ROW EXECUTE FUNCTION set_bundles_updated_at();

-- RLS: service role key bypasses RLS; anon key can only read
ALTER TABLE bundles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read" ON bundles FOR SELECT USING (true);
CREATE POLICY "service role all" ON bundles FOR ALL USING (auth.role() = 'service_role');
```

**Run this in:** CoursePlatform's Supabase Dashboard → SQL Editor.

---

## Step 5.2 — Migration script: disk → Supabase

**File to create:** `scripts/migrate-bundles-to-supabase.mjs` (in CoursePlatform)

```javascript
import { createClient } from '@supabase/supabase-js'
import { readdir, readFile } from 'fs/promises'
import { join } from 'path'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const BUNDLES_DIR = join(process.cwd(), 'data/bundles')

async function migrateBundles() {
  const files = (await readdir(BUNDLES_DIR))
    .filter(f => f.endsWith('.json') && !f.startsWith('_'))

  console.log(`Migrating ${files.length} bundle files...`)

  for (const file of files) {
    const bundleId = file.replace('.json', '')
    const raw = await readFile(join(BUNDLES_DIR, file), 'utf8')
    const bundle = JSON.parse(raw)

    // Count slides across all sections
    const introSlideCount = bundle.lesson_script?.intro_slides?.length ?? 0
    const sectionSlideCount = bundle.lesson_script?.sections?.reduce(
      (sum, s) => sum + (s.slides?.length ?? 0), 0
    ) ?? 0
    const totalSlides = introSlideCount + sectionSlideCount

    // Count populated image_urls
    const introWithImages = bundle.lesson_script?.intro_slides?.filter(s => s.image_url)?.length ?? 0
    const sectionWithImages = bundle.lesson_script?.sections?.reduce(
      (sum, s) => sum + (s.slides?.filter(sl => sl.image_url)?.length ?? 0), 0
    ) ?? 0
    const generatedSlides = introWithImages + sectionWithImages

    const row = {
      id: bundle.id ?? bundleId,
      subject: bundle.subject,
      subject_code: bundleId.split('-')[0],  // 'sci', 'ela', etc.
      grade: bundle.grade,
      grade_band: bundle.grade_band,
      unit: bundle.unit,
      lesson: bundle.lesson,
      bundle_number: bundle.bundle_number ?? 0,
      title: bundle.title,
      big_idea: bundle.big_idea ?? null,
      slides_count: totalSlides,
      slides_generated: generatedSlides,
      audio_generated: bundle.meta?.audio_generated ?? false,
      audio_url: bundle.meta?.audio_file ? 
        `https://res.cloudinary.com/dpn8gl54c/video/upload/somerschool/audio/${bundleId}.mp3` : null,
      videos_count: 7,  // always 7 segments (intro + 5 sections + conclusion)
      videos_generated: 0,  // update manually after video pipeline runs
      worksheet_present: !!(bundle.worksheet?.activities?.length),
      content: bundle,
      schema_version: bundle.schema_version ?? '2.0',
    }

    const { error } = await supabase.from('bundles').upsert(row, { onConflict: 'id' })
    if (error) {
      console.error(`ERROR: ${bundleId}:`, error.message)
    } else {
      console.log(`✅ ${bundleId}: ${generatedSlides}/${totalSlides} slides, audio=${row.audio_generated}`)
    }
  }

  console.log('Migration complete.')
}

migrateBundles()
```

**Run with:** `node --env-file=.env.local scripts/migrate-bundles-to-supabase.mjs`

This is safe to re-run — `upsert` with `onConflict: 'id'` updates existing rows.

---

## Step 5.3 — Update CoursePlatform lesson loader

**File to modify:** `app/api/learn/[slug]/[lessonSlug]/route.ts`

The lesson loader currently reads `data/bundles/{lessonSlug}.json` from disk. After migration it reads from Supabase with a disk fallback.

**Strategy:** Add env flag `BUNDLE_SOURCE` (`disk` or `supabase`). Default to `disk` until fully tested.

```typescript
// ADD: near top of file
import { createClient } from '@supabase/supabase-js'
import { readFile } from 'fs/promises'
import { join } from 'path'

function createBundleClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function fetchBundle(lessonSlug: string): Promise<Record<string, unknown> | null> {
  const source = process.env.BUNDLE_SOURCE ?? 'disk'

  // Supabase path
  if (source === 'supabase') {
    const supabase = createBundleClient()
    const { data, error } = await supabase
      .from('bundles')
      .select('content')
      .eq('id', lessonSlug)
      .single()
    if (error || !data) return null
    return data.content as Record<string, unknown>
  }

  // Disk path (current behavior)
  try {
    const raw = await readFile(join(process.cwd(), 'data/bundles', `${lessonSlug}.json`), 'utf8')
    return JSON.parse(raw)
  } catch { return null }
}
```

**Replace the current readFile call:**
```typescript
// Old:
const bundleData = JSON.parse(await readFile(`data/bundles/${lessonSlug}.json`, 'utf8'))

// New:
const bundleData = await fetchBundle(lessonSlug)
if (!bundleData) return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
```

**Cutover sequence:**
1. Run migration script → all bundles in Supabase
2. Set `BUNDLE_SOURCE=supabase` in CoursePlatform `.env.local`
3. Test 5 lessons in development
4. Deploy with `BUNDLE_SOURCE=supabase` in Vercel env
5. Monitor lesson load errors for 24h
6. If clean: remove disk fallback code in next session

---

## Step 5.4 — Give Chapterhouse access to CoursePlatform Supabase

**Add to Chapterhouse `.env.local` AND Vercel env vars:**

> **✅ WHERE TO FIND THESE (Q-5-1):** Open the **CoursePlatform** Supabase project (NOT Chapterhouse's Supabase). Go to **Project Settings → API**. You need:
> - **Project URL** → `COURSE_SUPABASE_URL`
> - **service_role** key (NOT the anon key) → `COURSE_SUPABASE_SERVICE_ROLE_KEY`
> These are DIFFERENT values from `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` already in Chapterhouse.

```bash
# CoursePlatform's Supabase — for Course Asset Dashboard
# (DIFFERENT from Chapterhouse's own SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)
COURSE_SUPABASE_URL=https://[course-project-ref].supabase.co
COURSE_SUPABASE_SERVICE_ROLE_KEY=eyJ...  # CoursePlatform Supabase → Settings → API → service_role key
```

**Add to Chapterhouse `src/lib/env.ts`:**
```typescript
{ key: 'COURSE_SUPABASE_URL', required: true, group: 'course-platform' },
{ key: 'COURSE_SUPABASE_SERVICE_ROLE_KEY', required: true, group: 'course-platform' },
```

**Create: `src/lib/course-supabase.ts`:**
```typescript
import { createClient } from '@supabase/supabase-js'

let client: ReturnType<typeof createClient> | null = null

export function createCourseAdmin() {
  if (!client) {
    client = createClient(
      process.env.COURSE_SUPABASE_URL!,
      process.env.COURSE_SUPABASE_SERVICE_ROLE_KEY!
    )
  }
  return client
}
```

---

## Step 5.5 — Course Asset Status API route (Chapterhouse)

**File to create:** `src/app/api/course-assets/status/route.ts`

```typescript
// GET /api/course-assets/status?course=sci&grade=1
// Returns: array of 24 bundles with asset status for each

import { createCourseAdmin } from '@/lib/course-supabase'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const subjectCode = searchParams.get('course') ?? 'sci'
  const grade = parseInt(searchParams.get('grade') ?? '1')

  const supabase = createCourseAdmin()
  const { data, error } = await supabase
    .from('bundles')
    .select(`

---

---

# Phase 8 — Course Pipeline Quality Gates

> **Added:** March 27, 2026 — Pipeline Visualizer Gap Analysis (Round 9)
> **Gates:** Phase 6 (Course Video Pipeline). Build all of Phase 8 before Phase 6 starts.
> **Source of truth:** `docs/production-pipeline-brainstorm.md` Round 9

---

## WHAT / WHY

The pipeline visualizer (`pipeline-visualizer-v2.html` in CoursePlatform `/public/`) defines 11 steps for a complete course production pipeline. Comparing it against Chapterhouse reality revealed four missing quality gates (Steps 5, 7, 8 from the visualizer) plus one linchpin trigger step (Step 4). Without these, the pipeline has no safety net: malformed bundles corrupt lessons silently, facts go unchecked, vocabulary drifts across lessons in a unit, and every bundle generation still requires a terminal run in CoursePlatform.

Phase 8 closes all four gaps before the high-volume video pipeline (Phase 6) begins.

---

## THE FOUR SUB-PHASES

| Sub-Phase | Visualizer Step | What It Builds | Effort |
|---|---|---|---|
| **8A** | Step 5 — Validate Bundles | Zod schema check in Railway worker. Fails with clear error before bad data writes to DB. | ~1 afternoon |
| **8B** | Step 8 — Cross-Check Unit | Claude Haiku reads all N lessons in a unit together. Flags vocabulary drift, concept contradictions. Supabase writeback of QA flags. | ~1 day |
| **8C** | Step 7 — AI Fact-Check | Gemini 2.5 Flash + a second model independently fact-check each lesson bundle. `GEMINI_API_KEY` already on Railway — just not wired for curriculum fact-check. | ~1 day |
| **8D** | Step 4 — Bundle Generation Trigger | API route in Chapterhouse + button in `/course-assets` that triggers CoursePlatform `scripts/generate-bundle.js`. Removes the last manual terminal bottleneck. | ~2 days |

**Build order:** 8A → 8B → 8C → 8D. Each builds on the previous.

---

## BEFORE (Phase 8 start)

- Bundle generation requires a terminal run in CoursePlatform
- No schema validation — malformed bundles write to DB silently
- No fact-check pass — generated curriculum content is unverified
- No unit coherence check — vocabulary drift is invisible
- `/course-assets` can only trigger image generation, not bundle generation

## AFTER (Phase 8 complete)

- Chapterhouse `/course-assets` can trigger full bundle generation (no terminal access needed)
- Every generated bundle is validated against Zod schema before DB write
- Every lesson fact-checked by Gemini — violations flagged and stored
- Every unit run through a coherence check after all lessons generate
- Pipeline is production-safe for Phase 6 (168 videos)

---

## Phase 8A — Bundle Validation (Zod Schema Check)

### WHAT
Wire a Zod schema validation step into the Railway worker `course-slide-images.ts` (or a new `generate-bundle.ts` worker job). After each bundle generates but BEFORE it writes to CoursePlatform Supabase, validate the bundle JSON against the contract in `scope-sequence-handoff.md`.

### WHY
One malformed AI response currently writes bad data to the `bundles` table and corrupts a lesson for all students. Zod gives a clean error message, stops the write, and marks the job as `failed` with the exact field that broke.

### STEPS

**Step 8A.1 — Define the Zod bundle schema**

Create `worker/src/lib/bundle-schema.ts`:

```typescript
import { z } from 'zod'

export const SlideSchema = z.object({
  slide_number: z.number().int().min(1),
  title: z.string().min(1).max(200),
  content: z.string().min(1),
  speaker_notes: z.string().optional(),
  image_prompt: z.string().optional(),
})

export const VocabTermSchema = z.object({
  term: z.string().min(1),
  definition: z.string().min(1),
})

export const BundleContentSchema = z.object({
  lesson_title: z.string().min(1).max(300),
  learning_objectives: z.array(z.string()).min(1).max(5),
  slides: z.array(SlideSchema).min(3).max(20),
  vocabulary: z.array(VocabTermSchema).optional(),
  assessment_questions: z.array(z.string()).optional(),
})

export type BundleContent = z.infer<typeof BundleContentSchema>
```

**Step 8A.2 — Add validation call in the generate-bundle worker job**

In `worker/src/jobs/generate-bundle.ts` (new file — see Phase 8D for full spec), before the Supabase upsert:

```typescript
import { BundleContentSchema } from '../lib/bundle-schema'

const parseResult = BundleContentSchema.safeParse(generatedContent)
if (!parseResult.success) {
  await updateProgress(jobId, 100, `Validation failed: ${parseResult.error.issues[0].message}`, 'failed', null, JSON.stringify(parseResult.error.issues))
  return
}
// Safe to write to Supabase
const validatedContent = parseResult.data
```

**Step 8A.3 — Verify**

Intentionally feed a malformed bundle (missing `slides` field) to the worker. Confirm the job status is `failed` with a readable error, and no row is written to `bundles`.

---

## Phase 8B — Unit Cross-Check (Claude Haiku Coherence Pass)

### WHAT
After all lessons in a unit complete generation, run a single Claude Haiku pass that reads all N lessons together and checks for:
1. Vocabulary drift: same concept called different names in different lessons
2. Concept contradictions: lesson 3 says X, lesson 5 implies not-X
3. Coverage gaps: a concept introduced in unit outline never appears in any lesson

Output: a structured QA report stored in a new `unit_qa` Supabase column (or separate table).

### WHY
Individual lesson generation is good. Unit-level coherence is not automatic. A 6-lesson unit can have consistent individual lessons that, read together, are confusing. This pass catches it before video/audio production locks the content.

### STEPS

**Step 8B.1 — Add `unit_qa` column to CoursePlatform `bundles` or a new `unit_checks` table**

Option A (simpler — for MVP): Add `unit_qa JSONB` to the `bundles` table row for the FIRST lesson in each unit (lesson 1 of each unit carries the QA report).

Option B (clean schema): New `unit_checks` table:
```sql
CREATE TABLE unit_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course TEXT NOT NULL,
  grade INT NOT NULL,
  unit INT NOT NULL,
  check_type TEXT NOT NULL DEFAULT 'coherence',
  status TEXT NOT NULL DEFAULT 'pending', -- pending | passed | flagged
  flags JSONB,
  checked_at TIMESTAMPTZ DEFAULT NOW()
);
```

**⚠️ SCOTT DECIDES:** Option A or Option B?

**Step 8B.2 — New Railway worker job type: `unit_cross_check`**

Triggered after the last lesson in a unit completes generation (or manually from `/course-assets`).

```typescript
// worker/src/jobs/unit-cross-check.ts
// 1. Fetch all bundles for this unit from CoursePlatform Supabase
// 2. Build a single large prompt: all lesson content concatenated
// 3. Claude Haiku call: "Read these N lessons as a unit. Identify:
//    a) vocabulary drift (same concept, different names across lessons)
//    b) concept contradictions (lesson N says X, lesson M implies not-X)
//    c) gaps (concepts from unit outline missing from all lessons)
//    Respond as JSON: { drift: [...], contradictions: [...], gaps: [...] }"
// 4. Write QA result to CoursePlatform Supabase
```

**Step 8B.3 — Add "Run Unit Check" button to `/course-assets` UI**

In the unit header row (the collapsible row for each unit), add a button: "Run QA". Triggers the `unit_cross_check` job via QStash. Shows QA status badge (✅ Passed / ⚠️ N flags) after completion.

**Step 8B.4 — Verify**

Run on `sci-g1` Unit 1 (lessons 1–6). Review Claude Haiku's flags. Confirm the report writes to Supabase. Fix any false positives in the prompt.

---

## Phase 8C — AI Fact-Check (Gemini Dual-Verify in Railway Worker)

### WHAT
After each lesson bundle generates and passes Zod validation (Phase 8A), run a fact-check pass using Gemini 2.5 Flash on Railway. Gemini reads the lesson content and identifies factual errors or unsupported claims.

**Important:** This is a **verification pass**, not a rewrite. Gemini flags, it does not fix. Scott (or a future review queue) decides whether to accept flags and regenerate.

### WHY
Elementary science content must be factually accurate. A single wrong fact in a Grade 1 science lesson can persist for years if not caught. Gemini already runs on Railway (`GEMINI_API_KEY` confirmed in Railway env) — the ingredient is there, it just isn't wired for curriculum fact-check.

### STEPS

**Step 8C.1 — Add fact-check step to generate-bundle worker (after 8A validation)**

```typescript
// After Zod validation passes:
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

const factCheckPrompt = `
You are a fact-checker for elementary school curriculum (Grade ${grade}).
Review the following lesson content for factual errors or unsupported claims.
Respond as JSON: { "passed": boolean, "flags": [{ "claim": string, "issue": string, "severity": "minor"|"major" }] }
Content:
${JSON.stringify(validatedContent, null, 2)}
`
const factCheckResult = await model.generateContent(factCheckPrompt)
const factCheckJson = JSON.parse(factCheckResult.response.text())

if (!factCheckJson.passed && factCheckJson.flags.some(f => f.severity === 'major')) {
  await updateProgress(jobId, 100, `Fact-check: ${factCheckJson.flags.length} flags (${factCheckJson.flags.filter(f => f.severity === 'major').length} major)`, 'failed', { factCheckFlags: factCheckJson.flags })
  return
}

// Write fact_check_flags to the bundle row (minor flags are logged but don't block)
```

**Step 8C.2 — Add `fact_check_flags JSONB` and `fact_check_passed BOOLEAN` columns to `bundles`**

New migration in CoursePlatform:
```sql
ALTER TABLE bundles 
  ADD COLUMN IF NOT EXISTS fact_check_passed BOOLEAN,
  ADD COLUMN IF NOT EXISTS fact_check_flags JSONB;
```

**Step 8C.3 — Show fact-check status in `/course-assets` status dots**

Update the 5-dot status row to include a **6th dot: Fact-Check** (🟢 = passed, 🔴 = major flags, ⚪ = not run).

**Step 8C.4 — Verify**

Run on 3 existing `sci-g1` bundles. Review flags. Calibrate prompt aggressiveness — goal is catching real errors, not flagging every hedged statement.

---

## Phase 8D — Bundle Generation Trigger in Chapterhouse

### WHAT
Add a "Generate Bundle" button and supporting API route in Chapterhouse `/course-assets` that triggers CoursePlatform's bundle generation scripts without requiring a terminal session in CoursePlatform.

This is the **linchpin**. Without it, the full pipeline still requires terminal access to CoursePlatform. With it, Scott can drive the entire pipeline from Chapterhouse alone.

### BEFORE
- Bundle generation: open CoursePlatform terminal → `node scripts/generate-bundle.js --unit 1 --lesson 1`
- No visibility into progress in Chapterhouse
- No way to trigger from `/course-assets` UI

### AFTER
- Click "Generate Bundle" next to any lesson in `/course-assets`
- QStash → Railway worker `generate-bundle.ts` → calls CoursePlatform generation logic → writes validated bundle to Supabase → Realtime progress in Chapterhouse

### ARCHITECTURE DECISION (LOCKED)

Bundles write to **CoursePlatform Supabase `bundles` table** — NOT to flat files on disk. The visualizer's `data/bundles/` file-based model is reference architecture only. DB-first wins.

### STEPS

**Step 8D.1 — Create Railway worker job: `generate-bundle.ts`**

```
worker/src/jobs/generate-bundle.ts
```

Responsibilities:
1. Receive payload: `{ course, grade, unit, lesson, subjectCode, characterId? }`
2. Fetch the relevant scope-sequence JSON from CoursePlatform Supabase (or from `scope-sequence/` in Chapterhouse — whichever has the latest)
3. Build the lesson generation prompt via Claude Sonnet 4.6
4. Parse and validate output via Zod (Phase 8A schema)
5. Run fact-check via Gemini (Phase 8C)
6. Write to CoursePlatform Supabase `bundles` table if all checks pass
7. Update Chapterhouse `jobs` table with progress

**Step 8D.2 — Add API route: `POST /api/course-assets/generate-bundle`**

```typescript
// src/app/api/course-assets/generate-bundle/route.ts
// POST body: { bundleId: string, course: string, grade: number, unit: number, lesson: number }
// 1. Insert job into Chapterhouse `jobs` (type: 'generate_bundle')
// 2. QStash → Railway worker
// 3. Return { jobId }
```

**Step 8D.3 — Add "Generate Bundle" button to `/course-assets` UI**

In each lesson row in the bundle status grid, when `slides_count === 0` (no bundle yet) or via a "Regenerate" button:
- Button: "Generate" → fires POST to `/api/course-assets/generate-bundle`
- Shows job progress via Supabase Realtime (same pattern as image generation)
- Status dots update when bundle completes

**Step 8D.4 — Add "Generate All Missing Bundles" batch button at course level**

In the course/grade header: "Generate All Missing" → iterates lessons with no bundle → fires one QStash message per lesson (staggered by 3s to respect Anthropic rate limits).

**Step 8D.5 — Verify**

Pick a lesson with no bundle (e.g. `sci-g1` Unit 2 Lesson 1). Click "Generate Bundle". Watch progress in `/jobs`. Confirm bundle row appears in CoursePlatform Supabase. Confirm validation and fact-check pass. Confirm status dot turns green in `/course-assets`.

---

## Phase 8 Smoke Test

1. `sci-g1` Unit 1 Lesson 1 — click "Generate Bundle" → job completes → bundle writes to Supabase → Zod passes → Gemini fact-check passes → all 6 status dots green
2. Intentionally inject a schema-invalid bundle payload → job fails with Zod error, no Supabase write
3. Run "Unit Cross-Check" on Unit 1 → Haiku report appears in `/course-assets` unit header → QA badge shows ✅ or flag count
4. Phase 6 is unblocked. No terminal access to CoursePlatform needed for any production step.

---

## Phase 8 — Status

| Sub-Phase | Status |
|---|---|
| 8A — Bundle Validation (Zod) | 🔴 NOT STARTED |
| 8B — Unit Cross-Check (Claude Haiku) | 🔴 NOT STARTED |
| 8C — AI Fact-Check (Gemini) | 🔴 NOT STARTED |
| 8D — Bundle Gen Trigger (Chapterhouse UI) | 🔴 NOT STARTED |

**Build 8A first.** It takes an afternoon and protects everything downstream. 8D is the linchpin — prioritize it over 8B and 8C if time is short before Phase 6 starts.
      id, subject, subject_code, grade, unit, lesson, bundle_number, title,
      slides_count, slides_generated, audio_generated, audio_url,
      videos_count, videos_generated, worksheet_present, updated_at
    `)
    .eq('subject_code', subjectCode)
    .eq('grade', grade)
    .order('bundle_number')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
```

**Also create:** `src/app/api/course-assets/bundle/[id]/route.ts` ✅ **BUILT**

```typescript
// GET /api/course-assets/bundle/[id] — full bundle content for preview
// PATCH /api/course-assets/bundle/[id] — update asset URLs (image_url, audio_url, etc.)
```

The PATCH endpoint is what generation jobs call when they complete — writing generated asset URLs back into Supabase.

---

## Step 5.6 — Course Asset Dashboard UI

**Navigation:** Add to `src/lib/navigation.ts` in AI & Automation group:
```typescript
{ label: 'Course Assets', href: '/course-assets', icon: BookOpen, status: 'live', 
  tooltip: 'Course production dashboard — generate and track all lesson assets' }
```

**File to create:** `src/app/course-assets/page.tsx`

**UI structure:**

```
Course Asset Dashboard
┌─────────────────────────────────────────────────────────────┐
│  Course: [sci ▼]  Grade: [1 ▼]  [sci-g1: Grade 1 Science] │
│  24 lessons  ████████████████░░░░░░░░  14/24 images done   │
│  [Generate All Missing — 10 images, 24 audio, 168 videos ]  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ U1-L01 All About Animals      [●●●○○]  ← 5 dots            │
│ U1-L02 Animal Homes           [●●○○○]                       │
│ U1-L03 What Animals Eat       [●○○○○]                       │
│ ...                                                         │
└─────────────────────────────────────────────────────────────┘
```

**The 5 status dots:**
- **Dot 1 (Bundle):** Green if row in `bundles` table. Red if missing.
- **Dot 2 (Images):** Green if `slides_generated >= slides_count`. Orange if partial (>0 but <100%). Red if none.
- **Dot 3 (Audio):** Green if `audio_generated = true`. Red if false.
- **Dot 4 (Video):** Green if `videos_generated >= videos_count`. Orange if partial. Red if none.
- **Dot 5 (Worksheet):** Green if `worksheet_present = true`. Red if false.

**Per-lesson row actions (shown on hover):**
- "Generate Images" button → queues `course_slide_images` job for this bundle
- "Generate Audio" button → queues `course_narration` job for this bundle
- "Generate Video" button → queues `course_video` job for this bundle (Phase 6)
- "Preview" button → opens the bundle in a modal showing the lesson structure

**"Generate All Missing" button:**
- Inspects all 24 lessons
- Queues one Railway job per missing asset type per lesson
- Shows total job count: "Queuing 10 image jobs + 24 audio jobs..."
- Progress: Supabase Realtime on `jobs` table shows completion

---

## Step 5.7 — Image generation job type for courses

**File to modify:** `worker/src/jobs/router.ts`

Add: `case 'course_slide_images': → runCourseSlideImages()`

**File to create:** `worker/src/jobs/course-slide-images.ts`

```typescript
// Generates all missing slide images for one bundle
// Input payload: { bundleId: 'sci-g1-u1-l01', characterId?: 'gimli-character-uuid' }

// 1. Fetch bundle from CoursePlatform Supabase: bundles.select('content').eq('id', bundleId)
// 2. Extract all slides from content.lesson_script (intro_slides + each section's slides)
// 3. Filter to slides where image_url is null/empty
// 4. For each missing slide:
//    a. updateProgress(jobId, pct, `Generating slide ${n}/${total}...`)
//    b. If characterId: fetchCharacter, call enhancePrompt(slide.label, character)
//    c. Call Replicate (3-tier: LoRA if character.lora_model_id, flux-dev bridge if character.reference_images, else flux-schnell)
//    d. Upload result to Cloudinary:
//       - Intro slide:   public_id = somerschool/slides/{bundleId}/intro-{idx}  (no extension)
//       - Section slide: public_id = somerschool/slides/{bundleId}/section-{N}-{idx}  (no extension)
//       - Format: request .webp delivery for all new images (consistent, smaller than png/jpg)
//       - Delivery URL pattern: https://res.cloudinary.com/dpn8gl54c/image/upload/q_auto/f_webp/{public_id}
//    e. Write the delivery URL into content.lesson_script[section][slideIdx].image_url
//       NOTE: wrong URL = silent disappear in KaraokePlayer (onError hides slide). Always verify URL.
//    f. PATCH bundles.content and bundles.slides_generated in CoursePlatform Supabase
// 5. Final update: bundles.slides_generated = total count with image_url
// 6. updateProgress(jobId, 100, 'All slides generated', 'completed')
```

**Note:** This job writes to CoursePlatform's Supabase via `COURSE_SUPABASE_URL` from Railway env.

**Add to Railway worker env:**
- `COURSE_SUPABASE_URL`
- `COURSE_SUPABASE_SERVICE_ROLE_KEY`
- `REPLICATE_API_TOKEN` (replaces Leonardo — used for course slide generation)
- `CLOUDINARY_URL`
- `ANTHROPIC_API_KEY` (for prompt enhancement)

---

## Phase 5 SMOKE TEST

> **✅ COMPLETE — March 24, 2026 (Session 28).** `src/app/course-assets/page.tsx` (BundleRow, StatusDot, 5-dot status grid), `src/lib/course-supabase.ts` singleton for CoursePlatform DB. Routes: `/api/course-assets/status/` (GET), `/api/course-assets/generate-slides/` (POST → QStash → Railway), `/api/course-assets/bundle/[id]/` (GET). Railway worker job `course-slide-images.ts` with 3-tier Replicate (LoRA → flux-dev img2img → flux-schnell), Cloudinary upload, CoursePlatform Supabase status updates. Env vars `COURSE_SUPABASE_URL` + `COURSE_SUPABASE_SERVICE_ROLE_KEY` active.

1. Run migration script — check Supabase Dashboard shows `bundles` table with 25 rows
2. Open Chapterhouse `/course-assets`
3. Select "sci", grade "1" — 24 lessons appear in grid
4. Status dots reflect actual state (U1-L01 should show dots matching `meta` fields in the JSON)
5. Click "Generate Images" on one lesson
6. Railway job starts — progress shown in dashboard at `/jobs`
7. On completion: `bundles.slides_generated` increments, dot 2 updates in grid (via Supabase Realtime)
8. Set `BUNDLE_SOURCE=supabase` in CoursePlatform `.env.local`
9. Navigate to a lesson in CoursePlatform at `localhost:3001/learn/...` — it loads successfully

---

---

# PHASE 6 — COURSE VIDEO PIPELINE

**WHAT:** Generate all 168 videos for sci-g1 (24 lessons × 7 segments each). Each lesson gets 7 video segments: `intro`, `section-1`, `section-2`, `section-3`, `section-4`, `section-5`, `conclusion`. Each segment is a character video (Gimli for K-5) with synced slides.

**WHY:** KaraokePlayer in CoursePlatform expects video files at `somerschool/videos/{bundleId}/{segment}`. Without them, the lesson viewer falls back to slides-only mode. 168 videos = the sci-g1 course fully PRODUCTIONized.

**BEFORE:**
- Video generation exists in Chapterhouse (Phase 4)
- But: no "batch all lessons" mechanism
- But: no per-segment video scripts derived from bundle JSON

**AFTER:**
- `course_video` job type in Railway worker
- "Generate Videos" button in Course Asset Dashboard generates all 7 segments per lesson
- Videos uploaded to Cloudinary at `somerschool/videos/{bundleId}/{segment}`
- `bundles.videos_generated` counter updates on Supabase
- KaraokePlayer reads `video/{bundleId}/{segment}` and videos load

---

## Step 6.1 — 7-Segment script splitter

**File to create:** `src/lib/bundle-to-video-scripts.ts` (Chapterhouse)

```typescript
interface VideoScript {
  segment: string        // 'intro', 'section-1', 'section-2', etc., 'conclusion'
  scriptText: string     // the narration text for this segment
  slideContext: string   // what slides appear during this segment (for scene description)
  estimatedDuration: number // seconds (scriptText word count / 2.5 words/sec)
}

export function bundleToVideoScripts(bundle: Bundle): VideoScript[] {
  const scripts: VideoScript[] = []

  // Intro
  scripts.push({
    segment: 'intro',
    scriptText: bundle.lesson_script.intro,
    slideContext: bundle.lesson_script.intro_slides.map(s => s.label).join(', '),
    estimatedDuration: Math.ceil(bundle.lesson_script.intro.split(' ').length / 2.5),
  })

  // Each section (up to 6)
  bundle.lesson_script.sections.forEach((section, i) => {
    scripts.push({
      segment: `section-${i + 1}`,
      scriptText: section.script,
      slideContext: section.slides.map(s => s.label).join(', '),
      estimatedDuration: Math.ceil(section.script.split(' ').length / 2.5),
    })
  })

  // Conclusion
  scripts.push({
    segment: 'conclusion',
    scriptText: bundle.lesson_script.conclusion,
    slideContext: '',
    estimatedDuration: Math.ceil(bundle.lesson_script.conclusion.split(' ').length / 2.5),
  })

  return scripts
}
```

---

## Step 6.2 — `course_video` Worker job type

**File to modify:** `worker/src/jobs/router.ts` — add `course_video`

**File to create:** `worker/src/jobs/course-video.ts`

```typescript
// Input payload: { bundleId, characterId, provider: 'did' | 'kling', ttsProvider: 'elevenlabs' }

// Input payload: { bundleId, characterId, provider: 'did' | 'kling', ttsProvider: 'elevenlabs' }
// Segments: 7 = intro + section-1 + section-2 + section-3 + section-4 + section-5 + conclusion
// DO NOT generate `celebration_video_url` — it is a SHARED asset at somerschool/celebration.mp4

// 1. Fetch bundle from CoursePlatform Supabase
// 2. Call bundleToVideoScripts(bundle) → get 7 VideoScript objects (intro + sections + conclusion)
// 3. For each segment (run sequentially to avoid provider rate limits):
//    a. updateProgress(jobId, Math.round(n/7*90), `Generating ${segment}...`)
//    b. Generate TTS audio for scriptText → upload to Cloudinary temp path
//       somerschool/videos/{bundleId}/audio-{segment}
//    c. Get character hero_image_url from characters table
//    d. Call D-ID API (or Kling): sourceImage + audioUrl → video
//    e. Poll until done (10s intervals, 180s max)
//    f. Upload completed video to Cloudinary: somerschool/videos/{bundleId}/{segment}  (no extension in public_id)
//       Delivery URL: https://res.cloudinary.com/dpn8gl54c/video/upload/q_auto/{public_id}.mp4
//    g. Update bundles.content with video URL
//    h. Increment bundles.videos_generated
// 4. Final update: bundles.videos_generated = total generated, updated_at = now
// 5. updateProgress(jobId, 100, 'All 7 segments generated', 'completed')
```

**Rate limiting note:** D-ID concurrent video limit is 5 on standard tier. Run segments sequentially, not in parallel.

---

## Step 6.3 — Batch all 168 videos from Asset Dashboard

**File to modify:** `src/app/course-assets/page.tsx`

> **⚠️ CONCURRENCY FIX (Q-6-1):** The phrase "24 parallel jobs" is WRONG for D-ID. D-ID's standard tier allows max **5 concurrent videos**. Each `course_video` job has 7 sequential segments, so with 5 concurrent lessons = potentially 5 videos generating at once (well within D-ID's limit). The batch endpoint must enforce `concurrency: 5` — never queue more than 5 `course_video` jobs simultaneously.
> **Architecture:** QStash `parallelism` parameter caps concurrent delivery. Set `parallelism: 5` on the batch QStash publish call, or use a Railway worker semaphore. Run segments within each lesson sequentially (already specified in Step 6.2).

The "Generate All Missing → Video" button should:
1. Fetch all lessons where `videos_generated < videos_count` (from `/api/course-assets/status`)
2. For each missing lesson, queue one `course_video` job — **max 5 concurrent (D-ID rate limit)**
3. Show: "Queuing 24 video jobs (168 segments total, 5 at a time)..."
4. Progress: `/jobs` page shows active jobs — new ones activate as previous ones complete

**API route to add:** `POST /api/course-assets/batch-generate`

```typescript
// Body: { course: 'sci', grade: 1, assetType: 'video' | 'images' | 'audio' }
// 1. Fetch all bundles for course+grade from CoursePlatform Supabase
// 2. Filter to those missing the requested asset type
// 3. Create a parent job in Chapterhouse Supabase (type: 'course_batch', label: 'sci-g1 batch videos')
// 4. For each missing bundle: create child job with parent_job_id, queue on QStash
// 5. Return: { parentJobId, childCount, bundleIds[] }
```

---

## Step 6.4 — KaraokePlayer Cloudinary URL pattern

**File to check:** `components/KaraokePlayer.tsx` in CoursePlatform

Find where `mediaUrl.video(bundleId, segment)` resolves to. The `lib/media-url` utility should resolve to:

```
https://res.cloudinary.com/dpn8gl54c/video/upload/q_auto/somerschool/videos/{bundleId}/{segment}
```

Verify this matches what `upload-media.mjs` and the new `course-video.ts` worker write to Cloudinary. If there's a mismatch, fix the `mediaUrl` utility to match the write path.

---

## Step 6.5 — ffmpeg concat: single downloadable lesson video

After all 7 segments for a lesson are generated and uploaded to Cloudinary, concatenate them into one full-lesson MP4. This is the downloadable/YouTube-ready version. The 7 KaraokePlayer segments remain untouched — this creates an additional `lesson_video_url` field alongside them.

**Why:** The 7-segment approach is correct for the player (accurate slide sync). But parents want a downloadable lesson. YouTube needs one file. Offline use needs one file. The concat step is free — the segments already exist.

**ffmpeg is already on Railway** — no new dependency. All segment files are Cloudinary URLs, which ffmpeg can stream directly via HTTP.

**Add to `bundles` table:**

```sql
-- Add to existing migration or create new: 20260601_026_add_lesson_video_url.sql
ALTER TABLE bundles ADD COLUMN IF NOT EXISTS lesson_video_url TEXT;
-- Stores: https://res.cloudinary.com/dpn8gl54c/video/upload/q_auto/somerschool/videos/{bundleId}/full-lesson.mp4
```

**Add Step 6.5 to `worker/src/jobs/course-video.ts`** — run after Step 6.2's 7-segment loop completes:

```typescript
// Step 6.5 — ffmpeg concat all 7 segments into one full-lesson video
// Runs inside the same Railway worker job, after all segments are uploaded to Cloudinary.

import { execSync } from 'child_process'
import { writeFileSync, unlinkSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'

async function concatSegments(bundleId: string, segments: string[]): Promise<string> {
  // 1. Build ffmpeg concat manifest (list of Cloudinary segment URLs)
  //    ffmpeg can read HTTP URLs directly in concat mode.
  const segmentOrder = ['intro', 'section-1', 'section-2', 'section-3', 'section-4', 'section-5', 'conclusion']
  const manifestPath = join(tmpdir(), `${bundleId}-concat.txt`)
  const outputPath   = join(tmpdir(), `${bundleId}-full-lesson.mp4`)

  const lines = segmentOrder
    .filter(seg => segments.includes(seg))
    .map(seg => {
      const url = `https://res.cloudinary.com/dpn8gl54c/video/upload/q_auto/somerschool/videos/${bundleId}/${seg}.mp4`
      return `file '${url}'`
    })
    .join('\n')

  writeFileSync(manifestPath, lines)

  // 2. ffmpeg concat — copy streams (no re-encode, fast, lossless quality)
  //    Requires all segments to have identical codec/resolution (they will — same provider, same settings)
  //    protocol_whitelist is REQUIRED for ffmpeg to read HTTPS URLs from the manifest
  execSync(
    `ffmpeg -y -f concat -safe 0 -protocol_whitelist file,http,https,tcp,tls -i "${manifestPath}" -c copy "${outputPath}"`,
    { stdio: 'pipe', timeout: 120_000 }
  )

  unlinkSync(manifestPath)

  // 3. Upload full-lesson video to Cloudinary
  const cloudinary = (await import('cloudinary')).v2
  const result = await cloudinary.uploader.upload(outputPath, {
    resource_type: 'video',
    public_id: `somerschool/videos/${bundleId}/full-lesson`,
    overwrite: true,
  })

  unlinkSync(outputPath)

  return result.secure_url
  // → https://res.cloudinary.com/dpn8gl54c/video/upload/v.../somerschool/videos/{bundleId}/full-lesson.mp4
}

// After the 7-segment loop completes in course-video.ts:
const lessonVideoUrl = await concatSegments(bundle.id, segmentOrder)
await courseSupabase
  .from('bundles')
  .update({ lesson_video_url: lessonVideoUrl })
  .eq('id', bundle.id)
await updateProgress(jobId, 98, 'Full lesson video concatenated and uploaded')
```

**Add dot 6 to Course Asset Dashboard status grid:**

```typescript
// In BundleRow status dots — add after the existing 5:
{ label: 'Full Video', value: !!bundle.lesson_video_url }

// Add download link to bundle row:
{bundle.lesson_video_url && (
  <a href={bundle.lesson_video_url} download
     className="text-xs text-amber-400 hover:underline ml-2">
    ↓ full lesson
  </a>
)}
```

**Notes:**
- `-c copy` zero-encodes. Copies stream directly. ~2–5 seconds regardless of video length.
- All 7 segments must exist before concat runs. Worker already generates sequentially — concat is step 8.
- If a segment failed (provider timeout), skip concat for that lesson, leave `lesson_video_url` null. KaraokePlayer still works.
- `protocol_whitelist` flag is mandatory. Without it, ffmpeg refuses to read HTTPS URLs from the concat manifest.
- Segment duration: ~6s × 7 = ~42s per lesson. Full file: typically 5–15 MB.

---

## Phase 6 SMOKE TEST

1. Open Course Asset Dashboard → sci-g1 → pick U1-L01
2. Click "Generate Videos" (single lesson, 7 segments)
3. Railway worker runs — job visible at `/jobs`
4. After completion: `bundles.videos_generated` = 7, dot 4 (Video) turns green
5. In CoursePlatform at `localhost:3001/learn/sci-grade-1/sci-g1-u1-l01`: video plays in KaraokePlayer
6. Slides sync at correct timestamps (verify `at` fractions approximate real moments)
7. Dot 6 (Full Video) turns green — `lesson_video_url` populated in Supabase
8. `↓ full lesson` link appears on the bundle row — click it, one ~42s MP4 downloads, plays continuously from intro through conclusion

---

---

# PHASE 9 — CHARACTER CONSISTENCY PIPELINE

**STATUS: 🔴 NOT STARTED — Build this before Phase 4 (gates Phase 4 → Phase 6)**

**WHAT:** A two-path character consistency system. The **Kontext fast path** (FLUX.1 Kontext — already in Leonardo Premium) gives inference-time character consistency from a single reference image with zero training. The **LoRA production path** (Replicate — for characters appearing in 10+ courses) automates training and stores the UUID programmatically. Both paths feed the same batch generation pipeline. LoRA is optional — Kontext works today.

**WHY:** Every course needs 112+ scene images featuring a consistent character. IP-Adapter at weight 1.0 (current implementation) causes anatomy artifacts (5th-limb problem). Prompt-only descriptions don't reproduce the same character twice. Neither approach is production-grade. Kontext solves this immediately; LoRA solves it permanently for high-volume characters.

**The two-path decision rule:**

| Situation | Use | Why |
|---|---|---|
| New character, prototyping or 1–5 courses | **Kontext** | Zero setup. Works today. `hero_image_url` is the only requirement. |
| Character in 10+ courses (Gimli) | **LoRA** | ~$2 training cost amortizes across volume. Better identity lock. |
| Character sheet needed for LoRA training | **Kontext (poses) → LoRA** | Use Kontext to generate 8 training-quality poses, then train LoRA |

**Cost reality:**
- Kontext fast path: ~50 Leonardo tokens/image × 112 images = 5,600 tokens/course. Premium includes 25K fast tokens/month — ~4 courses/month at no extra cost.
- LoRA path: ~$2 to train per character + ~$0.34/course at flux-schnell quality (112 images × $0.003).
- 52 courses, 10 characters, LoRA for all: training ~$20 + generation ~$17.68 = **~$38 total**.

**BEFORE (current state):**
- IP-Adapter at weight 1.0 → anatomy artifacts ("5th-limb problem")
- `lora_scale` hardcoded to 1.0 in `course-slide-images.ts` → oversaturation
- `characters.lora_model_id = 'PASTE-UUID-HERE'` for Gimli → LoRA never fires
- No "Save as Character" flow → characters require manual DB edits
- No batch generation tied to character identity
- No `generation_strategy` column — all characters treated identically

**AFTER:**
- Any character usable immediately via Kontext (no training, no UUID)
- `generation_strategy` column routes each character to the right model
- Gimli LoRA UUID retrieved + `generation_strategy = 'lora'` — LoRA fires correctly
- "Save as Character" in Creative Studio → Kontext-ready in 60 seconds
- Batch generation: character + lesson content → 112 images → Cloudinary → bundles
- Approval grid: approve / reject / regenerate (rejected → auto-queue, not manual)

---

## ⚠️ IMMEDIATE ACTIONS — Do Before Writing Any Phase 9 Code

### Action 1 — Negative prompt anatomy fix (5 min)

**File:** `src/app/api/images/generate/route.ts`

Find `negativePrompt` construction. Add:

```
extra limbs, malformed anatomy, fused fingers, bad anatomy, extra fingers, missing limbs
```

Commit and deploy. This reduces the current IP-Adapter artifact rate while Phase 9 builds. Non-negotiable — anatomy failures are in production images today.

### Action 2 — lora_scale bug fix (5 min)

**File:** `worker/src/jobs/course-slide-images.ts`

Change `lora_scale: 1.0` → `lora_scale: 0.85`. Redeploy Railway worker.

> Locked value (Spark, Round 10): 0.85 for cartoon characters in education contexts. 1.0 fights coherent generation. 0.7 produces visible drift. 0.85 is the correct default.

### Action 3 — Add `generation_strategy` column to `characters` table (10 min)

**File to create:** `supabase/migrations/20260327_025_characters_generation_strategy.sql`

```sql
ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS generation_strategy TEXT DEFAULT 'kontext'
    CHECK (generation_strategy IN ('kontext', 'lora', 'ip_adapter')),
  ADD COLUMN IF NOT EXISTS lora_training_status TEXT DEFAULT 'none'
    CHECK (lora_training_status IN ('none', 'queued', 'training', 'succeeded', 'failed')),
  ADD COLUMN IF NOT EXISTS lora_training_job_id TEXT,
  ADD COLUMN IF NOT EXISTS lora_training_error TEXT;

UPDATE characters SET generation_strategy = 'kontext' WHERE generation_strategy IS NULL;
```

Run in Supabase Dashboard → SQL Editor.

### Action 4 — Gimli LoRA UUID (30 min, Scott only — no code)

1. Log into Leonardo web UI → Elements / Models
2. Find Gimli fine-tune (trained Session 30, Flux Dev base)
3. Copy UUID from the model card
4. Open CoursePlatform Supabase → `characters` table → Gimli row
5. Paste UUID into `lora_model_id` (replacing `'PASTE-UUID-HERE'`)
6. Set `generation_strategy = 'lora'` on the Gimli row
7. Chapterhouse Creative Studio → select Gimli → generate test image
8. If Gimli looks consistent → done. If not → keep `generation_strategy = 'kontext'` and use Kontext for Gimli until quality is confirmed.

**After Actions 3+4:** New characters default to Kontext (works immediately). Gimli uses LoRA if UUID is valid. Both feed the same batch pipeline.

---

## Phase 9A — "Save as Character" Button (Kontext-First)

### WHAT

"Save as Character" button in Creative Studio results. Clicking opens a **3-field modal** (name, trigger word, Train LoRA? checkbox). Character is production-ready immediately via Kontext — no waiting for training. LoRA training is optional, background, non-blocking.

### WHY

A character should be usable within 60 seconds of clicking "Save as Character." FLUX.1 Kontext works from `hero_image_url` alone — no LoRA training required. The old design blocked character creation on a 2-minute training run. Wrong gate.

### Steps

**Step 9A.1 — Migration (already in Action 3 above — same SQL)**

Also add `lora_training_job_id` and `lora_training_error` if not already in the Action 3 migration.

**Step 9A.2 — New API route: `POST /api/characters/[id]/train-lora`**

```typescript
// 1. Fetch character — must have reference_images.length >= 5
// 2. Reject 409 if lora_training_status = 'training' already
// 3. Set lora_training_status = 'queued'
// 4. Create jobs row: type = 'train_character_lora', label = 'Train LoRA: {name}'
// 5. Publish to QStash → Railway worker: { characterId, jobId }
// 6. Return { jobId, status: 'queued' }
```

Minimum 5 reference images validated before queuing. No concurrent training enforced by 409 guard. This is a sub-route of `/api/characters/[id]/` — not a top-level route.

**Step 9A.3 — Railway worker: `train_character_lora`**

**File:** `worker/src/jobs/train-character-lora.ts`

```
Core flow:
1. updateProgress(jobId, 10, 'Starting LoRA training on Replicate...')
2. Set characters.lora_training_status = 'training'
3. POST https://api.replicate.com/v1/trainings:
     trainer: ostris/flux-dev-lora-trainer (latest)
     destination: {REPLICATE_USERNAME}/{character.slug}-lora
     input:
       input_images: character.reference_images (Cloudinary URLs as ZIP or array)
       trigger_word: character.slug.toUpperCase()
       steps: 1000
       lora_rank: 16
       learning_rate: 0.0004
4. POLLING LOOP (every 30s, max 60 attempts = 30 min):
     GET /v1/trainings/{trainingId}
     Update job progress incrementally (10% → 90% over polling iterations)
     On succeeded: extract output.weights URL → parse version ID
     On failed: set lora_training_status = 'failed', lora_training_error = message, fail job
5. On success:
     characters.lora_model_id = versionId
     characters.lora_training_status = 'succeeded'
     characters.generation_strategy = 'lora'  -- auto-upgrade from Kontext
6. updateProgress(jobId, 100, 'LoRA ready: {versionId}', 'completed')
```

> **Forge mandate (Round 10):** This MUST poll to completion. The UUID is unavailable until `status === 'succeeded'`. Fire-and-forget means the UUID never lands in `characters.lora_model_id` and Phase 9B's LoRA path never runs. The polling loop runs in Railway — no Vercel serverless timeout constraint.

**Step 9A.4 — "Save as Character" button in Creative Studio**

**File:** `src/components/image-generation-studio.tsx`

Button appears in the image results area, below "Save to CDN". Visible only when `cloudinary_url` is set on current result (CDN save required first).

3-field modal on click:

| Field | Type | Note |
|---|---|---|
| Character name | Text input | "Gimli", "Alex Student", etc. |
| Trigger word | Text input | Auto-suggest: `SLUGNAME`. Used if LoRA trains later. |
| Train LoRA now? | Checkbox | **Default unchecked**. Check only if this character will be in 10+ courses. |

On submit:
1. `POST /api/characters` → creates row, `hero_image_url` = Cloudinary URL, `reference_images = [url]`, `generation_strategy = 'kontext'`
2. Toast: **"Character saved — ready immediately with FLUX Kontext."** No wait.
3. If checkbox checked: `POST /api/characters/{id}/train-lora` in background. Job visible at `/jobs`. Character picker shows amber "Training..." badge while job runs. On completion: picker auto-updates to green "LoRA" badge.

**Step 9A.5 — Character picker strategy badges**

In the character picker dropdown, show a badge next to each name:
- `Kontext` (blue) — `generation_strategy = 'kontext'`
- `LoRA` (green) — `generation_strategy = 'lora'`
- `Training…` (amber, pulsing) — `lora_training_status = 'training'`

### Phase 9A Smoke Test

- [ ] "Save as Character" only appears after "Save to CDN" is clicked (cloudinary_url gate)
- [ ] Modal has exactly 3 fields — no extras (River: 3 fields max)  
- [ ] Submit creates `characters` row with `generation_strategy = 'kontext'` immediately
- [ ] Toast says character is ready — NOT "queued for training"
- [ ] Character immediately selectable for batch generation (Phase 9B) via Kontext
- [ ] If "Train LoRA now?" checked: background job queues, picker shows amber "Training…" badge
- [ ] When training completes: `generation_strategy` auto-upgrades to `'lora'`, badge turns green

---

## Phase 9B — Batch Scene Generation (112 images/course)

### WHAT

New API route + Railway worker job: given `characterId` + `bundleId`, generate all 112 course images. Worker reads `character.generation_strategy` and routes to FLUX.1 Kontext (Leonardo) or Replicate LoRA. Same input, same output. Claude Haiku generates scene descriptions from bundle lesson content. Results → Cloudinary → `bundles.content.slides[i].image_url`. Approval grid in `/course-assets`.

### STEPS

**Step 9B.1 — New API route: `POST /api/course-assets/generate-character-scenes`**

```typescript
// Input: { characterId, bundleId, sceneCount?: number }
// 1. Fetch character from Chapterhouse Supabase
//    Must have hero_image_url set. If generation_strategy = 'lora', also needs lora_model_id.
// 2. Fetch bundle from CoursePlatform Supabase (course-supabase.ts ONLY — never main supabase)
// 3. Claude Haiku: given bundle.content, generate scene descriptions
//    Format: [{ slideIndex: number, description: string }]  (1–2 sentences each)
//    Generate 120% of target count — budgets for 10–15% rejection rate (Vector, Round 10)
// 4. Create Railway job: type = 'generate_character_scenes', payload: { characterId, bundleId, scenes[] }
// 5. Return { jobId, sceneCount }
```

**Step 9B.2 — Railway worker: `generate_character_scenes`**

**File:** `worker/src/jobs/generate-character-scenes.ts`

Model select per generation type (Vector, Round 10):

| Image type | Model | Why |
|---|---|---|
| Course scene images (bulk, 112/course) | `flux-schnell-lora` (Replicate) or Kontext (Leonardo) | Cost > quality for bulk |
| Character sheet poses (LoRA training data) | `flux-dev-lora` or Kontext | Quality > cost for training data |
| Hero images (visible in CoursePlatform UI) | `flux-dev-lora` or Kontext | Quality matters |
| Background-only (no character) | `flux-schnell` standard | Character model not needed |

```
Core flow (batches of 10 — batch size law):
1. Fetch character (generation_strategy, lora_model_id, hero_image_url, art_style, negative_prompt)

2. Route by generation_strategy:

   IF 'kontext':
     Leonardo FLUX.1 Kontext call per scene:
       prompt: "{sceneDescription}, {character.art_style}"
       negative_prompt: character.negative_prompt + ", extra limbs, malformed anatomy, fused fingers"
       imagePrompts: [{ url: character.hero_image_url, weight: 0.85 }]
       Note: weight 0.85 = identity lock without over-constraining scene. Do NOT exceed 0.90.

   IF 'lora':
     Replicate flux-schnell with LoRA per scene:
       lora_weights: character.lora_model_id
       lora_scale: 0.85 (NEVER 1.0)
       prompt: "{TRIGGER_WORD}, {sceneDescription}, {character.art_style}"
       negative_prompt: character.negative_prompt + ", extra limbs, malformed anatomy, fused fingers"
       timeout: 30s per image

3. Per generated image:
   a. Upload to Cloudinary: somerschool/slides/{bundleId}/{slideIndex}.webp
   b. Update CoursePlatform bundles.content.slides[i].image_url via course-supabase.ts
   c. Update job progress
4. After all scenes: bundles.slides_generated = true
```

> **DB client rule (Forge, Round 10):** All CoursePlatform Supabase writes use `course-supabase.ts` singleton ONLY. Never import main Chapterhouse `supabase-server.ts` in this worker.

**Step 9B.3 — Approval grid in `/course-assets`**

When `slides_generated === true`, add "Review Images" button to the bundle row. Opens full-window grid modal:
- Thumbnails, lazy-loaded 20 at a time
- Per image: large preview on hover, ✅ Approve / ❌ Reject / 🔄 Regenerate
- Rejected → auto-queues `generate_character_scenes` for just those slide indices (same description, new seed). No manual re-trigger required. (Forge, Round 10)
- "Approve All" bulk action
- Progress bar: X of 112 approved

> **River's UX rule (Round 10):** Approval grid = approve / reject / regenerate. No inline editor. If the scene description needs changing, fix it and regenerate — don't try to edit the image.

**Step 9B.4 — Wire "Generate Character Scenes" button to asset dashboard**

Next to "Generate Slides" on each bundle row. Visible when `character_id` is set. On click: `POST /api/course-assets/generate-character-scenes`. Supabase Realtime updates the Images dot as generation progresses.

### Phase 9B Smoke Test

- [ ] "Generate Character Scenes" button visible on bundle rows where character is set
- [ ] Creates `generate_character_scenes` job in `/jobs`
- [ ] **Kontext path:** 112 images generated with NO `lora_model_id` — Kontext only, zero training required
- [ ] **LoRA path:** Railway logs show `lora_scale: 0.85` (FAIL if 1.0 appears)
- [ ] Images in Cloudinary at `somerschool/slides/{bundleId}/{n}.webp`
- [ ] `bundles.content.slides[i].image_url` populated in CoursePlatform Supabase (via course-supabase.ts)
- [ ] Approval grid shows all generated thumbnails, lazy-loads correctly
- [ ] Reject → auto-regenerates that slide index (no manual step)
- [ ] Approve All → Images dot turns green in bundle grid

---

## Phase 9C — Character Sheet Generator

### WHAT

From 1 seed image (`hero_image_url`), auto-generate 8 pose variations: front, 3/4, side, sitting, pointing, surprised, neutral, dynamic. These become LoRA training data. One image → weak LoRA. 8 varied poses → strong LoRA.

> **Art style lock (Spark, Round 10):** Every pose prompt MUST include `character.art_style` verbatim. Style drift between training images degrades LoRA identity lock.

### Steps

**Step 9C.1 — New API route: `POST /api/characters/[id]/generate-sheet`**

Fetch character (must have `hero_image_url`). Create Railway job `generate_character_sheet`. Return `{ jobId }`.

**Step 9C.2 — Railway worker: `generate_character_sheet`**

```
POSE_PROMPTS (8 total):
  1. 'front view, facing camera, neutral expression, full body standing'
  2. 'three-quarter view, slight turn right, neutral, full body'
  3. 'side profile, facing right, full body standing'
  4. 'sitting pose, relaxed, looking toward camera'
  5. 'pointing gesture, one limb extended toward viewer'
  6. 'surprised expression, eyes wide, alert, full body'
  7. 'neutral relaxed stance, approachable expression'
  8. 'dynamic active pose, mid-movement, energetic'

For each pose — Leonardo FLUX.1 Kontext (quality path, not schnell):
  prompt: "{poseDesc}, {character.art_style}, {character.physical_description}"
  negative_prompt: character.negative_prompt + anatomy safety string
  imagePrompts: [{ url: character.hero_image_url, weight: 0.85 }]

Run all 8 in parallel (8 is below the batch-size-law threshold for coordination overhead)

After all 8:
  Upload to Cloudinary: somerschool/characters/{slug}/sheet-{n}.webp
  Update characters.reference_images = [...existing, ...8 new sheet URLs]
  If reference_images.length >= 8 AND user opted in during Save as Character:
    Auto-trigger train-lora job (POST /api/characters/{id}/train-lora)
```

**Step 9C.3 — "Generate Character Sheet" button** in Settings character section. Visible when `hero_image_url` is set and `lora_training_status !== 'training'`.

### Phase 9C Smoke Test

- [ ] Button visible in Settings when `hero_image_url` is set
- [ ] Creates `generate_character_sheet` job in `/jobs`
- [ ] 8 Cloudinary URLs appear in `characters.reference_images`
- [ ] All 8 images visually recognizable as same character
- [ ] All 8 share same art style — no style drift between poses
- [ ] Auto-triggers `train-lora` if opted in and count >= 8

---

## Phase 9D — HeyGen Scene Image Integration

### WHAT

Pass Phase 9B's `slides[i].image_url` as scene backgrounds in HeyGen video calls. Scott/Gimli avatar delivers narration in front of character-consistent scene images instead of plain backgrounds.

### Steps

**Step 9D.1** — Extend `/api/video/generate/route.ts` to accept optional `backgroundImageUrl`. Pass to HeyGen scene payload when provided.

**Step 9D.2** — Wire Phase 6 course video pipeline: when building the HeyGen job for a lesson, pull `slides[i].image_url` from the bundle and pass as `backgroundImageUrl` per segment.

**Step 9D.3** — Verify with 1 test lesson: avatar foreground, scene image background, audio aligned, KaraokePlayer renders correctly.

### Phase 9D Smoke Test

- [ ] 1 test lesson video generated with Phase 9B background images
- [ ] Avatar (Scott or Gimli) visible in foreground against scene image
- [ ] KaraokePlayer syncs text to narration correctly
- [ ] Slides carousel shows character-consistent scene images

---

## Phase 9 FUTURE ENHANCEMENTS (Not day-1 — evaluate post-launch)

### ControlNet Pose Consistency (Spark, Round 10)

OpenPose ControlNet + LoRA: same character identity (LoRA) + controlled body language (ControlNet). 7 lesson segment types map to 7 pose reference images per character:

| Segment | Pose |
|---|---|
| Intro | Standing, facing camera, arms at sides |
| Teaching (sections 1–3) | Pointing at content |
| Explanation (sections 4–5) | One arm raised |
| Conclusion | Relaxed, satisfied lean |

Model on Replicate: `fofr/realvisxl-v3-multi-controlnet-lora`. Build 7 pose reference images once per character, condition per segment. **Flag as Phase 9E** if pose inconsistency is visible in production videos post-launch.

### Wan2.1 LoRA for Direct Video (Spark, Round 10)

Replicate `fofr/wan2.1-with-lora` drives animated video generation using the same LoRA weights trained in Phase 9A/9C. If Leonardo Video tab clips need > 2 quality-review loops per lesson, Wan2.1 with existing Gimli LoRA is the drop-in fallback — no new training required.

**Decision gate:** After Phase 4 smoke test. Evaluate only if Leonardo Video quality is insufficient or cost is too high. The LoRA trained in Phase 9A/9C is immediately compatible — no additional work.

---

## Phase 9 SMOKE TEST — Definition of Done

- [ ] **Action 1:** `generate/route.ts` anatomy negative prompt active, anatomy artifacts reduced in test batch
- [ ] **Action 2:** `lora_scale: 0.85` confirmed in Railway logs — never 1.0
- [ ] **Action 3:** Migration 025 applied — `generation_strategy`, `lora_training_status`, `lora_training_job_id` exist in `characters`
- [ ] **Action 4:** Gimli `lora_model_id` set and `generation_strategy = 'lora'`, OR fallback `kontext` with documented reason
- [ ] **9A Kontext:** New character saved → `generation_strategy = 'kontext'`, immediately usable for batch, no wait
- [ ] **9A LoRA optional:** Background training job queues, picker badge progresses Training → LoRA on completion
- [ ] **9B Kontext:** New character (no LoRA ever trained) → 112 images generated, character visually consistent
- [ ] **9B LoRA:** Gimli 112-image batch: `lora_scale = 0.85` in Railway logs (HARD FAIL if 1.0 appears)
- [ ] **9B Approval:** Reject one image → auto-regenerates that slide, no manual trigger required
- [ ] **9C:** 8-pose sheet from 1 seed image — all recognizably same character, art style consistent across all 8
- [ ] **9D:** 1 test lesson video uses Phase 9B background images, renders correctly in KaraokePlayer
- [ ] `lora_scale` is **0.85** in all generated Replicate calls — verify in Railway logs, fail if 1.0 appears
- [ ] **Action 2:** `lora_scale: 0.85` confirmed in Railway logs — never 1.0
- [ ] **Action 3:** Migration 025 applied — `generation_strategy`, `lora_training_status`, `lora_training_job_id` exist in `characters`
- [ ] **Action 4:** Gimli `lora_model_id` set and `generation_strategy = 'lora'`, OR fallback `kontext` documented reason
- [ ] **9A Kontext:** New character saved → `generation_strategy = 'kontext'`, immediately usable for batch, no wait
- [ ] **9A LoRA optional:** Background training job queues, picker badge progresses Training → LoRA on completion
- [ ] **9B Kontext:** New character (no LoRA ever trained) → 112 images generated, character visually consistent
- [ ] **9B LoRA:** Gimli 112-image batch: `lora_scale = 0.85` in Railway logs (HARD FAIL if 1.0 appears)
- [ ] **9B Approval:** Reject one image → auto-regenerates that slide, no manual trigger
- [ ] **9C:** 8-pose sheet from 1 seed image — all recognizably same character, art style consistent across all 8
- [ ] **9D:** 1 test lesson HeyGen video uses Phase 9B background images, renders correctly in KaraokePlayer
- [ ] `lora_scale` is **0.85** in all generated Replicate calls (verify in Railway logs — fail if 1.0 appears).

---

## Phase 9 FUTURE ENHANCEMENTS (Not day-1 — flag for post-launch)

### ControlNet Pose Consistency (Spark, Round 10)

OpenPose ControlNet + LoRA: same character identity (LoRA) + controlled body language (ControlNet). 7 lesson segment types map to 7 pose templates:

| Segment | Pose |
|---|---|
| Intro | Standing, facing camera |
| Teaching sections | Pointing at content |
| Explanation | One arm raised |
| Conclusion | Relaxed, satisfied |

Model: `fofr/realvisxl-v3-multi-controlnet-lora` (Replicate). Build 7 pose reference images once per character, condition per segment. Flag as Phase 9E if pose inconsistency becomes a visible production issue post-launch.

### Wan2.1 LoRA for Direct Video (Spark, Round 10)

Replicate model `fofr/wan2.1-with-lora` can drive animated clip generation using the same LoRA weights trained in Phase 9A/9C. If Leonardo Video tab clips need > 2 quality-review loops per lesson, evaluate Wan2.1 as drop-in replacement.

**Decision gate:** After Phase 4 smoke test. If Leonardo Video tab quality is sufficient → skip. If not → Wan2.1 with same Gimli LoRA, no new training required.

---

## Phase 9 SMOKE TEST — Definition of Done

- [ ] **Action 1:** `generate/route.ts` anatomy negative prompt active — verify reduced artifacts in next batch
- [ ] **Action 2:** `course-slide-images.ts` `lora_scale: 0.85` confirmed in Railway logs (never 1.0)
- [ ] **Action 3:** Migration 025 applied — `generation_strategy`, `lora_training_status`, `lora_training_job_id` columns exist in `characters`
- [ ] **Action 4:** Gimli `lora_model_id` set, `generation_strategy = 'lora'` — test image passes (or fallback to kontext documented)
- [ ] **9A Kontext:** New character saved → `generation_strategy = 'kontext'`, immediately usable for batch
- [ ] **9A LoRA:** Background training job completes → picker badge auto-updates to green "LoRA"
- [ ] **9B Kontext:** 112 images generated for any character with zero LoRA training — identity consistent
- [ ] **9B LoRA:** Gimli 112-image batch: `lora_scale = 0.85` in Railway logs (FAIL if 1.0)
- [ ] **9B Approval:** Reject one image → auto-regenerates that slide without manual trigger
- [ ] **9C:** 8-pose sheet from 1 seed — all recognizably same character, consistent art style
- [ ] **9D:** 1 test lesson with Phase 9B backgrounds renders in KaraokePlayer correctly
- [ ] `lora_scale: 1.0` MUST NOT appear anywhere in Railway production logs — hard fail

### Phase 9B Smoke Test

- [ ] "Generate Character Scenes" button visible on bundle rows where character is set
- [ ] Creates `generate_character_scenes` job in `/jobs`
- [ ] **Kontext path:** 112 images generated with NO `lora_model_id` — Kontext only
- [ ] **LoRA path:** Railway logs show `lora_scale: 0.85` (never 1.0)
- [ ] Images in Cloudinary at `somerschool/slides/{bundleId}/{n}.webp`
- [ ] `bundles.content.slides[i].image_url` populated after generation
- [ ] Approval grid shows all generated thumbnails
- [ ] Reject → auto-regenerates (no manual intervention)
- [ ] Approve All → Images dot turns green in bundle grid

---

## Phase 9C — Character Sheet Generator

### WHAT

From 1 seed image (`hero_image_url`), auto-generate 8 training poses: front, 3/4, side, sitting, pointing, surprised, neutral, dynamic. These become the LoRA training set. Better training data → more consistent identity in 112 course images.

### WHY

Gimli's LoRA trained on ToonBee images (varied, high quality). For a NEW character where Scott has only 1 reference image, training quality degrades. Character Sheet Generator turns 1 image into 8 high-quality training poses automatically. (One image → weak LoRA. 8 varied poses → strong LoRA.)

> **Art style lock (Spark, Round 10):** Every pose prompt MUST include the character's `art_style` string verbatim. If any training images deviate in style, the LoRA learns conflicting aesthetics and produces inconsistent results. Lock it.

### Steps

**Step 9C.1 — New API route: `POST /api/characters/[id]/generate-sheet`**

```typescript
// 1. Fetch character — must have hero_image_url
// 2. Create Railway job: type = 'generate_character_sheet', payload: { characterId }
// 3. Return { jobId }
```

**Step 9C.2 — Railway worker: `generate_character_sheet`**

```
8 parallel Leonardo Kontext calls (quality > speed for training data):

const POSE_PROMPTS = [
  'front view, facing camera, neutral expression, full body standing',
  'three-quarter view, slight turn right, neutral expression, full body',
  'side profile, facing right, full body standing',
  'sitting pose, relaxed, looking toward camera',
  'pointing gesture, one arm/limb extended toward viewer',
  'surprised expression, eyes wide, alert, full body',
  'neutral relaxed stance, approachable expression',
  'dynamic active pose, mid-movement, energetic',
]

For each pose — Leonardo FLUX.1 Kontext:
  prompt: "{poseDescription}, {character.art_style}, {character.physical_description}"
  negative_prompt: character.negative_prompt + standard anatomy safety net
  imagePrompts: [{ url: character.hero_image_url, weight: 0.85 }]

Run all 8 in parallel (batch size law exemption: count = 8, no coordination overhead)

After all 8:
  Upload to Cloudinary: somerschool/characters/{slug}/sheet-{n}.webp
  Update characters.reference_images = [...existing, ...8 new URLs]
  Auto-trigger train-lora if reference_images.length >= 8 (optional — only if user confirmed during Save as Character)
```

**Step 9C.3 — "Generate Character Sheet" button in character settings**

Visible next to each character's hero image thumbnail. Active when `hero_image_url` is set and `lora_training_status !== 'training'`.

### Phase 9C Smoke Test

- [ ] Button visible in Settings character section when `hero_image_url` is set
- [ ] Creates `generate_character_sheet` job in `/jobs`
- [ ] 8 Cloudinary URLs in job output
- [ ] All 8 images visually recognizable as the same character in different poses
- [ ] All 8 images share the same art style (no style drift between poses)
- [ ] `characters.reference_images` updated with 8 new URLs

---

## Phase 9D — HeyGen Scene Image Integration

### WHAT

Pass Phase 9B scene images (`bundles.content.slides[i].image_url`) as scene backgrounds in HeyGen video calls. Scott/Gimli avatar delivers narration in front of the character-consistent scene images.

### STEPS

**Step 9D.1 — Extend `/api/video/generate/route.ts`** to accept optional `backgroundImageUrl`. Pass to HeyGen scene payload when provided.

**Step 9D.2 — Wire course video pipeline (Phase 6) to pull scene images.** When building the HeyGen job for a lesson, pull `slides[i].image_url` from the bundle and pass as `backgroundImageUrl` per segment.

**Step 9D.3 — Verify** with 1 test lesson video: avatar in foreground, scene image background, audio aligned, KaraokePlayer renders correctly.

---

## Phase 9 FUTURE ENHANCEMENTS (Not day-1, flag for later)

### ControlNet Pose Consistency (Spark, Round 10)

When Gimli needs identical body language across lessons (pointing at vocabulary, looking surprised at a concept), OpenPose ControlNet + LoRA produces better results than prompt-based pose variation alone. The 7 HeyGen scene types per lesson map directly to 7 pose templates:

| Segment | Pose template |
|---|---|
| Intro | Standing, facing camera, arms at sides |
| Section 1–3 | Teaching stance, pointing at chalk/slide |
| Section 4–5 | Explaining pose, one arm raised |
| Conclusion | Satisfied/wrap-up pose, slight lean |

Build the 7 pose reference images once per character, then condition ControlNet on the appropriate template per segment. This requires `fofr/realvisxl-v3-multi-controlnet-lora` on Replicate (different model endpoint). Flag for Phase 9E if pose inconsistency becomes a visible production issue.

### Wan2.1 LoRA for Direct Video (Spark, Round 10)

Replicate has `fofr/wan2.1-with-lora`. If a Gimli LoRA is trained, the same weights can drive **direct video generation** (not just stills). This means: skip Leonardo Video tab → skip D-ID → generate animated Gimli clips directly from the LoRA in one Replicate call.

**Decision gate:** After Phase 4 (Leonardo Video tab evaluation), if animated clip quality is insufficient OR cost is too high, `fofr/wan2.1-with-lora` is the fallback path. The LoRA trained in Phase 9A/9C is immediately usable — no new training. Flag on Phase 4 smoke test: if Leonardo Video tab clips need >2 quality-review loops per lesson, evaluate Wan2.1 as replacement.

---

## Phase 9 SMOKE TEST — Definition of Done

- [ ] **Action 1:** `generate/route.ts` has anatomy negative prompt — anatomy artifacts reduced in generated images
- [ ] **Action 2:** `course-slide-images.ts` has `lora_scale: 0.85` in Railway logs (not 1.0)
- [ ] **Action 3:** Migration 025 applied — `generation_strategy`, `lora_training_status`, `lora_training_job_id` columns exist
- [ ] **Action 4:** Gimli UUID in `characters.lora_model_id`, `generation_strategy = 'lora'` — Gimli test image passes (or fallback `generation_strategy = 'kontext'`)
- [ ] **9A:** New character via "Save as Character" — `generation_strategy = 'kontext'` in DB, immediately usable
- [ ] **9A:** LoRA checkbox triggers background job — picker badge progresses Training → LoRA on completion
- [ ] **9B (Kontext):** 112 images generated for brand-new character with zero LoRA training
- [ ] **9B (LoRA):** Gimli batch job: `lora_scale = 0.85` confirmed in Railway logs
- [ ] **9B:** Approval grid functional — reject → auto-regenerates, no manual step
- [ ] **9C:** 8-pose character sheet from 1 seed image — all 8 recognizably the same character, consistent art style
- [ ] **9D:** Test lesson video generated with Phase 9B scene image as HeyGen background
- [ ] `lora_scale: 1.0` must NEVER appear in Railway production logs — fail this smoke test if it does

  // 2. ffmpeg concat — copy streams (no re-encode, fast, lossless quality)
  //    Requires all segments to have identical codec/resolution (they will — same provider, same settings)
  execSync(
    `ffmpeg -y -f concat -safe 0 -protocol_whitelist file,http,https,tcp,tls -i "${manifestPath}" -c copy "${outputPath}"`,
    { stdio: 'pipe', timeout: 120_000 }
  )

  unlinkSync(manifestPath)

  // 3. Upload full-lesson video to Cloudinary
  const cloudinary = await import('cloudinary').then(m => m.v2)
  const result = await cloudinary.uploader.upload(outputPath, {
    resource_type: 'video',
    public_id: `somerschool/videos/${bundleId}/full-lesson`,
    overwrite: true,
  })

  unlinkSync(outputPath)

  return result.secure_url
  // → https://res.cloudinary.com/dpn8gl54c/video/upload/v.../somerschool/videos/{bundleId}/full-lesson.mp4
}

// After the 7-segment loop: call concatSegments, write lesson_video_url to bundles
const lessonVideoUrl = await concatSegments(bundle.id, segmentOrder)
await courseSupabase
  .from('bundles')
  .update({ lesson_video_url: lessonVideoUrl })
  .eq('id', bundle.id)

await updateProgress(jobId, 98, 'Full lesson video concatenated and uploaded')
```

**Add `lesson_video_url` dot to Course Asset Dashboard:**

The existing 5 status dots are: Bundle / Images / Audio / Video / Worksheet.  
Add dot 6: **Full Video** — green when `lesson_video_url` is set.

```typescript
// In BundleRow status dots:
{ label: 'Full Video', value: !!bundle.lesson_video_url }
```

**Add download button to Course Asset Dashboard:**

```tsx
{bundle.lesson_video_url && (
  <a
    href={bundle.lesson_video_url}
    download
    className="text-xs text-amber-400 hover:underline"
  >
    ↓ Download lesson video
  </a>
)}
```

**Notes:**
- `-c copy` does NOT re-encode. It copies the stream. Zero quality loss, takes ~2–5 seconds regardless of video length.
- All 7 segments must exist before concat runs. The worker already generates them sequentially — concat is the 8th step.
- If a segment failed (provider timeout, etc.), skip concat for that lesson and leave `lesson_video_url` null. The KaraokePlayer still works.
- `protocol_whitelist` flag is required for ffmpeg to read HTTPS URLs in concat mode. Without it, ffmpeg refuses to read Cloudinary URLs from the manifest.
- Segment duration: ~6s × 7 = ~42s per lesson. Full file size: typically 5–15MB at standard video quality.

---

## Phase 6 SMOKE TEST

1. Open Course Asset Dashboard → sci-g1 → pick U1-L01
2. Click "Generate Videos" (single lesson, 7 segments)
3. Railway worker runs — 7 jobs visible at `/jobs` (or 1 job with 7 sub-steps)
4. After completion: `bundles.videos_generated` = 7, dot 4 in Dashboard turns green
5. In CoursePlatform at `localhost:3001/learn/sci-grade-1/sci-g1-u1-l01`: video plays with Gimli in KaraokePlayer
6. Slides sync at correct timestamps (verify `at` fractions approximate real moments)
7. Dot 6 (Full Video) turns green — `lesson_video_url` populated in Supabase
8. Download link appears on lesson row — click it, one ~42s MP4 downloads, plays in VLC/browser with all 7 segments continuous

---

---

# PHASE 7 — VOICE STUDIO NARRATION

> **✅ DECISION LOCKED (Q-7-1):** **Option A** — upload the existing 24 MP3s, mark done, use Voice Studio for new content only. Implemented as Step 7.0 below.

## Step 7.0 — Upload existing 24 sci-g1 audio files (Option A — recommended)

**File to create:** `scripts/upload-existing-audio.mjs` (in CoursePlatform)

```javascript
import { createClient } from '@supabase/supabase-js'
import { v2 as cloudinary } from 'cloudinary'
import { readdir } from 'fs/promises'
import { join } from 'path'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

cloudinary.config({ cloudinary_url: process.env.CLOUDINARY_URL })

const AUDIO_DIR = join(process.cwd(), 'data/audio')

async function uploadExistingAudio() {
  // IMPORTANT: data/audio/ contains 34 files — 24 lesson MP3s + 10 audition voice samples.
  // The audition files are named audition-{elevenlabs_voice_id}.mp3 — exclude them.
  // Only upload files that match the lesson bundle naming pattern.
  const files = (await readdir(AUDIO_DIR)).filter(f => /^[a-z]+-g\d+-u\d+-l\d+\.mp3$/.test(f))
  console.log(`Uploading ${files.length} lesson audio files (excludes audition samples)...`)

  for (const file of files) {
    const bundleId = file.replace('.mp3', '')  // e.g. 'sci-g1-u1-l01'
    const localPath = join(AUDIO_DIR, file)
    const publicId = `somerschool/audio/${bundleId}`

    try {
      const result = await cloudinary.uploader.upload(localPath, {
        resource_type: 'video',  // Cloudinary treats audio as 'video'
        public_id: publicId,
        overwrite: false,
      })
      const audioUrl = result.secure_url

      // Update bundles table in CoursePlatform Supabase
      const { error } = await supabase
        .from('bundles')
        .update({ audio_generated: true, audio_url: audioUrl })
        .eq('id', bundleId)

      if (error) throw error
      console.log(`✅ ${bundleId}: ${audioUrl}`)
    } catch (err) {
      console.error(`❌ ${bundleId}:`, err.message)
    }
  }
  console.log('Done.')
}

uploadExistingAudio()
```

**Run with:** `node --env-file=.env.local scripts/upload-existing-audio.mjs`

This must run AFTER Phase 5's bundle migration (bundles table must exist). Skip Step 7.3 audio generation for any lesson where `audio_generated = true` is already set by this script.

---

**WHAT:** Add a Narration workflow to Voice Studio. Pick a course + lesson → generates ElevenLabs MP3 → uploads to Cloudinary → updates `bundles.audio_generated = true` and `audio_url` in Supabase.

**WHY:** Currently `generate-audio.js` runs as a CoursePlatform CLI script (local only). After the Supabase migration, narration can be triggered and tracked from Chapterhouse's Voice Studio — no CoursePlatform CLI needed.

**BEFORE:**
- Audio generated via `npm run generate:audio` in CoursePlatform CLI
- 24 sci-g1 audio files already exist at `data/audio/sci-g1-*.mp3`
- These are uploaded to Cloudinary via `upload-media.mjs`
- `bundles.audio_generated` tracks status (as of Phase 5)

**AFTER:**
- Voice Studio has a "Course Narration" tab
- Pick subject + grade + lesson from a dropdown (pulls from CoursePlatform Supabase)
- Pick ElevenLabs voice
- Generate → uploads to Cloudinary → updates Supabase
- Batch mode: "Generate All Missing" for a course

---

## Step 7.1 — Voice assignment table

**File to create:** `supabase/migrations/20260601_026_create_voice_assignments.sql` (Chapterhouse)

```sql
-- Voice assignments: which ElevenLabs voice to use for each subject/grade combination
CREATE TABLE voice_assignments (
  id           UUID   PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  user_id      UUID   REFERENCES auth.users(id) ON DELETE CASCADE,

  subject_code TEXT   NOT NULL CHECK (subject_code IN ('sci', 'ela', 'math', 'hst', 'all')),
  grade_band   TEXT   NOT NULL CHECK (grade_band IN ('K-2', '3-5', '6-8', '9-12', 'all')),
  voice_id     TEXT   NOT NULL,             -- ElevenLabs voice ID
  voice_name   TEXT   NOT NULL,             -- human-readable name e.g. "Jessica"
  speed        FLOAT  NOT NULL DEFAULT 1.0, -- 0.5–2.0

  UNIQUE (user_id, subject_code, grade_band)
);

ALTER TABLE voice_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "authenticated users only" ON voice_assignments
  FOR ALL USING (auth.role() = 'authenticated');
```

**Seed initial assignments** (these match the existing `generate-audio.js` voice rotation logic):

```sql
-- Grade 1 Science → Jessica (matches existing audio files)
INSERT INTO voice_assignments (subject_code, grade_band, voice_id, voice_name)
VALUES ('sci', 'K-2', 'cgSgspJ2msm6clMCkdW9', 'Jessica');
```

---

## Step 7.2 — Course Narration tab in Voice Studio

**File to modify:** `src/components/voice-studio.tsx` (or `src/app/voice-studio/page.tsx`)

Add a third tab: "Course Narration"

**Tab UI:**

```
[ TTS ] [ Recording ] [ Course Narration ]

Course Narration
┌────────────────────────────────────────────────────┐
│  Subject: [Science ▼]  Grade: [1 ▼]               │
│  Lesson:  [U1-L01: All About Animals ▼]            │
│  Voice:   [Jessica (K-2 Science default) ▼]        │
│  Speed:   [  1.0× ──────────── ]                   │
│                                                    │
│  Script preview:                                   │
│  ┌──────────────────────────────────────────────┐  │
│  │ Hello everyone! Today we're going to ...     │  │
│  └──────────────────────────────────────────────┘  │
│                                                    │
│  [▶ Generate Audio]  [Generate All Missing]       │
└────────────────────────────────────────────────────┘
```

**On lesson select:** Fetch `GET /api/course-assets/bundle/{id}` → extract `lesson_script` → concatenate intro + all section scripts + conclusion → show in preview textarea.

**On "Generate Audio":**
1. POST to `/api/course-assets/narration` with `{ bundleId, voiceId, speed }`
2. Server calls ElevenLabs API with the narration text
3. Upload MP3 to Cloudinary: `somerschool/audio/{bundleId}`
4. Update `bundles.audio_generated = true`, `bundles.audio_url = cloudinaryUrl` in CoursePlatform Supabase
5. Return `{ audioUrl }`
6. Play audio in browser (HTML5 `<audio>`)

---

## Step 7.3 — Narration API route

**File to create:** `src/app/api/course-assets/narration/route.ts`

```typescript
// POST /api/course-assets/narration
// Body: { bundleId, voiceId, speed? }
// 1. Fetch bundle from CoursePlatform Supabase
// 2. Build narration text: intro + all section.scripts + conclusion (same as generate-audio.js)
// 3. Call ElevenLabs TTS: POST https://api.elevenlabs.io/v1/text-to-speech/{voiceId}
//    Headers: xi-api-key: ELEVENLABS_CURRICULUM_KEY
//    Body: { text, model_id: 'eleven_multilingual_v2', voice_settings: { stability: 0.75, style: 0.35 } }
// 4. Upload binary MP3 to Cloudinary:
//    cloudinary.uploader.upload_stream({ resource_type: 'video', public_id: `somerschool/audio/${bundleId}`, overwrite: true })
// 5. Update CoursePlatform Supabase: bundles.audio_generated = true, bundles.audio_url = secureUrl
// 6. Return { audioUrl, bundleId, durationEstimate }
```

**maxDuration**: 60 seconds in `vercel.json` (ElevenLabs + Cloudinary upload can take ~30s on long lessons).

---

## Step 7.4 — Batch narration for all 24 lessons

The "Generate All Missing" button:
1. Queries `/api/course-assets/status?course=sci&grade=1`
2. Filters to `audio_generated = false`
3. Creates one Railway job per missing lesson (type: `course_narration`)
4. Or runs sequentially via API calls if total < 5

**Add to `worker/src/jobs/router.ts`:** `case 'course_narration': → runCourseNarration()`

**File to create:** `worker/src/jobs/course-narration.ts` — calls the existing `/api/course-assets/narration` route on Chapterhouse with appropriate payload.

---

## Phase 7 SMOKE TEST

1. Open `/voice-studio`, Course Narration tab
2. Select Science, Grade 1, U1-L01
3. Voice: Jessica
4. Script preview shows: intro text + section scripts + conclusion
5. Click "Generate Audio"
6. Wait ~30s — audio plays in browser
7. Check CoursePlatform Supabase: `bundles` row for `sci-g1-u1-l01` shows `audio_generated = true`
8. Open CoursePlatform lesson at `localhost:3001/learn/sci-grade-1/sci-g1-u1-l01`
9. Audio narration plays when lesson starts

---

---

# APPENDIX A — MIGRATION NUMBERING

| Number | File | Phase |
|---|---|---|
| 001–022 | Existing Chapterhouse migrations | Pre-existing |
| 023 | `20260401_023_create_brand_voices.sql` | Phase 1 |
| 023b | `20260401_023b_seed_brand_voices.sql` | Phase 1 |
| 024 | `20260501_024_create_characters.sql` | Phase 3 |
| 024b | `20260501_024b_seed_gimli.sql` | Phase 3 |
| 025 | `20260601_025_create_generated_videos.sql` | Phase 4 |
| 026 | `20260601_026_create_voice_assignments.sql` | Phase 7 |
| — | CoursePlatform `bundles` table (add to `data/supabase-schema.sql`) | Phase 5 |

---

# APPENDIX B — NEW ENV VARS BY PHASE

Add these as you reach each phase:

| Phase | Var | Where to add |
|---|---|---|
| Phase 2 | `SHOPIFY_WEBHOOK_SECRET` | Vercel (Chapterhouse) |
| Phase 2 | `BUFFER_ACCESS_TOKEN` | Vercel (Chapterhouse) |
| Phase 4 | `DID_API_KEY` | Vercel + Railway + `src/lib/env.ts` |
| Phase 4 | `KLING_API_KEY` | Vercel + Railway + `src/lib/env.ts` |
| Phase 4 | `KLING_API_SECRET` | Vercel + Railway + `src/lib/env.ts` |
| Phase 4 | `WAN_API_KEY` (or use `REPLICATE_API_TOKEN`) | Vercel + Railway — TBD once WAN provider evaluated |
| Phase 5 | `COURSE_SUPABASE_URL` | Vercel (Chapterhouse) + Railway |
| Phase 5 | `COURSE_SUPABASE_SERVICE_ROLE_KEY` | Vercel (Chapterhouse) + Railway |
| Phase 5 | `BUNDLE_SOURCE` | CoursePlatform Vercel (`'disk'` initially, then `'supabase'`) |

---

# APPENDIX C — NEW WORKER JOB TYPES

Add these to `worker/src/jobs/router.ts` as each phase is built:

| Job type | Phase | File | Payload |
|---|---|---|---|
| `video_generate` | Phase 4 | `video-generate.ts` | `{ videoId, provider, characterId?, sceneEnhanced, videoMotionPrompt, sceneDurationSeconds, audioSource, ttsText?, ttsVoiceId? }` |
| `course_slide_images` | Phase 5 | `course-slide-images.ts` | `{ bundleId, characterId? }` |
| `course_batch` | Phase 5 | *(parent container)* | `{ course, grade, assetType }` |
| `course_video` | Phase 6 | `course-video.ts` | `{ bundleId, characterId, provider, ttsProvider }` |
| `course_narration` | Phase 7 | `course-narration.ts` | `{ bundleId, voiceId, speed? }` |

---

# APPENDIX D — NEW NAVIGATION ITEMS

Add to `src/lib/navigation.ts` as each page is built:

| Phase | Label | href | Group |
|---|---|---|---|
| Phase 3 | Characters | `/characters` | Production |
| Phase 5 | Course Assets | `/course-assets` | AI & Automation |

---

# APPENDIX E — CLOUDINARY PATH CONVENTIONS

All media follows this pattern: `somerschool/{type}/{id}/{variant}`

| Content type | Path | Example |
|---|---|---|
| Slide images | `somerschool/slides/{bundleId}/{sectionKey}-{idx}` | `somerschool/slides/sci-g1-u1-l01/section-1-0` |
| Audio narration | `somerschool/audio/{bundleId}` | `somerschool/audio/sci-g1-u1-l01` |
| Video segments | `somerschool/videos/{bundleId}/{segment}` | `somerschool/videos/sci-g1-u1-l01/section-1` |
| Character refs | `somerschool/characters/{slug}/ref-{n}` | `somerschool/characters/gimli/ref-1` |
| Generated images (Chapterhouse) | `chapterhouse/generated/{timestamp}-{rand}` | `chapterhouse/generated/1714012800-abc123` |
| Generated videos (Chapterhouse) | `chapterhouse/videos/{timestamp}-{rand}` | `chapterhouse/videos/1714012800-def456` |

---

# APPENDIX F — WHAT ALREADY EXISTS (DO NOT REBUILD)

These are fully built and working. Reference them; don't recreate them.

| Feature | File | Notes |
|---|---|---|
| Image generation (4 providers) | `src/app/api/images/generate/route.ts` | Phase 3 EXTENDS this, does not replace |
| Save to Cloudinary | `src/app/api/images/save/route.ts` | Works via `image_url` key lookup |
| Social posts CRUD | All files under `src/app/api/social/` | Phase 2 extends, does not replace |
| Buffer GraphQL (createPost) | `src/app/api/social/posts/[id]/approve/route.ts` | Working |
| Shopify webhook with HMAC | `src/app/api/webhooks/shopify-product/route.ts` | Just needs `SHOPIFY_WEBHOOK_SECRET` set |
| Social review queue UI | `src/components/social-review-queue.tsx` | Phase 2 adds image brief display |
| QStash → Railway job delivery | `src/app/api/jobs/create/route.ts` + `worker/src/index.ts` | Phase 5-7 add job types, don't change plumbing |
| ElevenLabs TTS | `src/app/api/voice/synthesize/route.ts` | Phase 7 generates course narration via this |
| Supabase Realtime job progress | `src/hooks/use-jobs-realtime.ts` | Used by all new generation UIs |
| KaraokePlayer | `components/KaraokePlayer.tsx` (CoursePlatform) | Phase 6 feeds it videos; player code unchanged |
| Bundle generation CLI | `scripts/generate-bundle.js` (CoursePlatform) | Still the master for NEW bundle creation |

---

*Build bible version: March 2026 — from brainstorm rounds 1–10.*
*Next update: after Phase 9A ships — mark Gimli UUID unblocked, update Phase 9 smoke test status.*

---

---

# PHASE 9 — CHARACTER CONSISTENCY PIPELINE

**WHAT:** Build a two-path character consistency system. The **Kontext fast path** uses FLUX.1 Kontext (already in Leonardo Premium) for inference-time character consistency — no training, no UUID, works from a single reference image. The **LoRA production path** (for high-volume characters like Gimli) automates training via Replicate and stores the UUID automatically. Both paths feed into the same batch generation pipeline. LoRA is not required. LoRA is optional and worth it when the character appears in 10+ courses.

**WHY the old plan was wrong:** The Phase 9 spec written March 27 assumed LoRA was the only production path. It isn't. FLUX.1 Kontext is specifically designed for subject-consistent image editing — give it a reference image + scene prompt, it places the character in the new scene while maintaining identity. No training required. Scott has Leonardo Premium ($24/mo) which already includes FLUX.1 Kontext and the Consistent Character Blueprint. The LoRA requirement was blocking every new character. Kontext removes the blocker.

**The two-path decision rule:**

| Situation | Use | Why |
|---|---|---|
| New character, prototyping | **Kontext** | Zero setup. Works today. |
| Character in 1–5 courses | **Kontext** | Training cost not worth it |
| Character in 10+ courses (Gimli) | **LoRA** | Training amortizes across volume |
| Character sheet needed for LoRA training | **Kontext** (to generate poses) → **LoRA** | Use Kontext to build the training set |

**Cost reality:**

*Kontext fast path:*
- Per course (112 images via Leonardo Kontext): ~$0.05–0.10/image = ~$5.60–11.20/course using Leonardo Premium token budget
- Leonardo Premium: 25K fast tokens/month — at ~50 tokens/image, that's 500 images/month included before overage
- For low-volume characters: effective cost near $0 within token budget

*LoRA production path (Gimli, high-volume):*
- Per character (LoRA training via Replicate): ~$2.00
- Per course (112 images, flux-schnell-lora): ~$0.34
- Per course (112 images, flux-dev-lora for quality): ~$5.60
- All 52 courses at flux-schnell: ~$17.68
- All 10 characters trained: ~$20
- **Grand total: under $300 for all 52 courses at production quality**

**BEFORE:**
- Every character required LoRA training — blocking new characters entirely
- `characters.lora_model_id` = `'PASTE-UUID-HERE'` for Gimli — blocked, no LoRA generation works
- IP-Adapter at weight 1.0 causing 5th-limb anatomy failures in slide generation
- `lora_scale` in `course-slide-images.ts` set to 1.0 (should be 0.85)
- No batch scene generation tied to character identity

**AFTER:**
- **Any character works immediately** via Kontext fast path — zero training required
- `generation_strategy` field on `characters` table: `'kontext'` | `'lora'` | `'ip_adapter'`
- Batch generation worker picks model based on `generation_strategy` — same pipeline, two backends
- Gimli LoRA UUID retrieved (Action 3) → `generation_strategy = 'lora'` for Gimli
- New characters default to `generation_strategy = 'kontext'` — upgrade to LoRA if volume justifies
- "Save as Character" button in Creative Studio → Kontext-ready immediately, LoRA training optional
- Approval grid: approve / reject / regenerate; rejected → auto-queued for retry
- Character Sheet Generator uses Kontext to produce training poses (better LoRA input than raw ToonBee exports)

---

## ⚠️ IMMEDIATE ACTIONS — Do Before Writing Any Phase 9 Code

### Action 1 — Negative prompt fix (5 minutes)

**File:** `src/app/api/images/generate/route.ts`

Find where `negativePrompt` is constructed or used. Add to it:

```
extra limbs, malformed anatomy, fused fingers, bad anatomy, extra fingers, missing limbs
```

Commit and deploy. This makes the current IP-Adapter approach tolerable while LoRA is being completed. Do not skip this — anatomy artifacts are visible in generated course images right now.

### Action 2 — lora_scale bug fix (5 minutes)

**File:** `worker/src/jobs/course-slide-images.ts`

Find `lora_scale` — currently set to `1.0`. Change to `0.85`. Redeploy Railway worker.

IP-Adapter at 1.0 fights coherent generation. 0.85 is the correct default for character identity without anatomy degradation (locked: Spark, Round 10).

### Action 3 — Add `generation_strategy` column to `characters` table (10 minutes)

**File to create:** `supabase/migrations/20260327_025_characters_generation_strategy.sql`

```sql
ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS generation_strategy TEXT DEFAULT 'kontext'
    CHECK (generation_strategy IN ('kontext', 'lora', 'ip_adapter')),
  ADD COLUMN IF NOT EXISTS lora_training_status TEXT DEFAULT 'none'
    CHECK (lora_training_status IN ('none', 'queued', 'training', 'succeeded', 'failed')),
  ADD COLUMN IF NOT EXISTS lora_training_job_id TEXT,
  ADD COLUMN IF NOT EXISTS lora_training_error TEXT;

-- Existing characters: default to kontext until LoRA is confirmed working
UPDATE characters SET generation_strategy = 'kontext' WHERE generation_strategy IS NULL;
```

Run in Supabase Dashboard → SQL Editor.

### Action 4 — Gimli LoRA UUID (30 minutes, Scott only — no code required)

1. Log into Leonardo web UI → Elements section → Models
2. Find the Gimli fine-tune (trained Session 30, model type: Characters, Flux Dev base)
3. Copy the UUID from the model card
4. Open CoursePlatform Supabase → `characters` table → Gimli row
5. Paste UUID into `lora_model_id` column (replacing `'PASTE-UUID-HERE'`)
6. Set `generation_strategy = 'lora'` on the Gimli row (upgrading from default Kontext)
7. Open Chapterhouse Creative Studio → select Gimli from character picker → generate test image
8. If Gimli looks right → done. If not → leave `generation_strategy = 'kontext'` and use Kontext for Gimli too until LoRA quality is confirmed.

**Un-blocked by Actions 3+4:** New characters default to Kontext (works immediately). Gimli can use LoRA if UUID is valid. Both paths feed the same batch pipeline.

---

## Phase 9A — "Save as Character" Button (Kontext-First)

### WHAT

A "Save as Character" button in Creative Studio's image results. When Scott generates a great image, he clicks it → 3-field modal → character is production-ready immediately via Kontext. LoRA training is a separate optional step, not a prerequisite. A new character should be usable for batch generation within 60 seconds of clicking "Save as Character."

### WHY

The previous design required waiting ~2 minutes for LoRA training before a character could be used. That's the wrong gate. FLUX.1 Kontext works from the `hero_image_url` alone. Save the character → it's ready. Train LoRA later if volume justifies it.

### STEPS

**Step 9A.1 — DB migration: add training status columns to `characters`**

**File:** `supabase/migrations/20260501_025_characters_lora_training_status.sql`

```sql
ALTER TABLE characters
  ADD COLUMN IF NOT EXISTS lora_training_status TEXT DEFAULT 'none'
    CHECK (lora_training_status IN ('none', 'queued', 'training', 'succeeded', 'failed')),
  ADD COLUMN IF NOT EXISTS lora_training_job_id TEXT,   -- Replicate training ID (for polling)
  ADD COLUMN IF NOT EXISTS lora_training_error TEXT;    -- Error message if training failed
```

Run in Supabase Dashboard → SQL Editor.

**Step 9A.2 — New API sub-route for LoRA training**

**File:** `src/app/api/characters/[id]/train-lora/route.ts`

> Architecture note (River, Round 10): This is a sub-route of `/api/characters/[id]/`, not a top-level `/api/train-lora/` route.

```typescript
// POST /api/characters/[id]/train-lora
// 1. Fetch character — must have reference_images[] (min 5) and hero_image_url
// 2. Validate: reference_images.length >= 5 — reject if not
// 3. Validate: lora_training_status !== 'training' — reject if already in progress (409)
// 4. Set lora_training_status = 'queued'
// 5. Create jobs row: type = 'train_character_lora', label = 'Train LoRA: {name}'
// 6. Publish to QStash → Railway worker with { characterId, jobId }
// 7. Return { jobId, status: 'queued' }
```

Key validation (prevents wasted Replicate credits):
- Min 5 reference images (Replicate fast-flux-trainer minimum for quality)
- No concurrent training (409 if already training)
- Must have `hero_image_url` set (requires at least 1 generation + CDN save)

**Step 9A.3 — New Railway worker job type: `train_character_lora`**

**File:** `worker/src/jobs/train-character-lora.ts` (sibling to `course-slide-images.ts`)

```
Core flow:
1. updateProgress(jobId, 10, 'Fetching character data...')
2. Set characters.lora_training_status = 'training'
3. Submit POST to Replicate:
   - Trainer: ostris/flux-dev-lora-trainer (latest version)
   - destination: {REPLICATE_USERNAME}/{character.slug}-lora
   - input:
       input_images: character.reference_images (array of Cloudinary URLs)
       trigger_word: character.slug.toUpperCase()  -- e.g. 'GIMLI'
       steps: 1000
       lora_rank: 16
       learning_rate: 0.0004
4. POLLING LOOP (Railway worker — no timeout constraint):
   - Every 30 seconds: GET /v1/trainings/{trainingId}
   - Update job progress incrementally
   - Max 60 attempts = 30 minutes
   - On succeeded: extract output.weights URL → parse version ID
   - On failed/canceled: set lora_training_status = 'failed', log error
5. On success: update characters.lora_model_id = versionId, lora_training_status = 'succeeded'
6. updateProgress(jobId, 100, 'LoRA training complete! UUID: {versionId}', 'completed')
```

> **Forge mandate (Round 10):** This MUST poll until complete. The LoRA UUID is not available until `status === 'succeeded'`. Fire-and-forget means the UUID never gets written to `characters.lora_model_id` and Phase 9B can never run. The polling loop runs in the Railway worker where there is no Vercel serverless timeout.

**Add `train_character_lora` to `worker/src/jobs/router.ts`** — follows the existing job type dispatch pattern.

**Step 9A.4 — "Save as Character" button in Creative Studio**

**File:** `src/components/image-generation-studio.tsx`

In the image results area, below the "Save to CDN" button, add "Save as Character" button. Visible only when a `cloudinary_url` is set on the current result (requires CDN save first).

Clicking opens a 3-field modal (River: 3 fields max, no extras):

| Field | Type | Note |
|---|---|---|
| Character name | Text input | e.g. "Gimli", "Alex Student" |
| Trigger word | Text input | Auto-suggest: slug-version of name. Used if LoRA is trained later. |
| Train LoRA now? | Checkbox (optional) | Default **unchecked**. Check only if this character will appear in 10+ courses. |

On submit:
1. `POST /api/characters` — creates row with `hero_image_url` = saved Cloudinary URL, `reference_images` = [same URL], `generation_strategy = 'kontext'` (default)
2. Toast: **"Character saved! Ready to use immediately with FLUX Kontext."** — NOT waiting for LoRA training.
3. If "Train LoRA now?" was checked: `POST /api/characters/{newId}/train-lora` in background. Job appears in `/jobs`. Character continues using Kontext while LoRA trains. When LoRA completes, `generation_strategy` auto-updates to `'lora'`.

If character already exists (same slug): modal switches to update mode — adds new image to `reference_images[]` and optionally re-trains.

**Step 9A.5 — Update character picker in Creative Studio to show strategy badge**

In the character picker dropdown, next to each character's name, show a small badge:
- `Kontext` (blue) — `generation_strategy = 'kontext'`
- `LoRA` (green) — `generation_strategy = 'lora'`
- `Training...` (amber pulsing) — `lora_training_status = 'training'`

This tells Scott at a glance which path each character uses without requiring him to know the difference.

**Step 9A.6 — Add `train_character_lora` progress visibility to Jobs dashboard**

The `/jobs` page already shows all job types automatically. The label "Train LoRA: Gimli" distinguishes it. No additional code needed.

### Phase 9A Smoke Test

- [ ] "Save as Character" button appears in Creative Studio only after "Save to CDN" was clicked
- [ ] Modal has exactly 3 fields (name, trigger word, Train LoRA? checkbox)
- [ ] Submit creates `characters` row with `generation_strategy = 'kontext'` (NOT waiting for LoRA)
- [ ] Toast says character is ready immediately — NOT "queued for training"
- [ ] Character immediately appears usable in batch generation (Phase 9B) via Kontext path
- [ ] If "Train LoRA now?" checked: background job queues, character picker shows amber "Training..." badge
- [ ] When training completes: `generation_strategy` auto-updates to `'lora'`, badge turns green

---

## Phase 9B — Batch Scene Generation (112 images/course)

### WHAT

New API route and Railway worker job type: given a `characterId` + `bundleId`, generate all 112 course images. The worker looks at `character.generation_strategy` and routes to FLUX.1 Kontext (Leonardo API) or Replicate LoRA accordingly. Same input, same output — the strategy is an implementation detail. Claude generates scene descriptions from bundle lesson content. Results → Cloudinary → `bundles.content.slides[i].image_url`. Approval grid in `/course-assets` for Scott to review.

### WHY

Phase 5's asset dashboard shows the status dot-grid but has no "generate all 112 images for this course using [character]" button. Phase 9B is that button. Both Kontext and LoRA characters work out of the box — no separate pipeline per strategy.

### STEPS

**Step 9B.1 — New API route: `POST /api/course-assets/generate-character-scenes`**

```typescript
// Input: { characterId, bundleId, sceneCount?: number (default: bundle slide count) }
// 1. Fetch character — must have hero_image_url set (Kontext) OR lora_model_id set (LoRA)
//    Reject with 400 if NEITHER is set (shouldn’t happen after Phase 9A ships)
// 2. Fetch bundle from CoursePlatform Supabase (course-supabase.ts singleton)
// 3. Call Claude Haiku: given bundle.content, generate N scene descriptions
//    Each scene: 1-2 sentence visual description for the slide
//    Format: [{ slideIndex: number, description: string }]
// 4. Create Railway job: type = 'generate_character_scenes'
//    payload: { characterId, bundleId, scenes: [{slideIndex, description}] }
// 5. Return { jobId, sceneCount }
```

> **Validation rules:** Reject 400 if `hero_image_url` is null (required for all strategies). If `generation_strategy === 'lora'`, also reject 400 if `lora_model_id` is null or `'PASTE-UUID-HERE'`.

**Step 9B.2 — New Railway worker job type: `generate_character_scenes`**

**File:** `worker/src/jobs/generate-character-scenes.ts`

```
Core flow (per scene, in batches of 10 — batch size law):
1. Fetch character record from Supabase
   Fields: slug, art_style, negative_prompt, generation_strategy, lora_model_id, hero_image_url
2. Determine generation path from character.generation_strategy:

   IF generation_strategy === 'kontext'  (default — works for all new characters):
   - Leonardo FLUX.1 Kontext call
     - modelId: FLUX.1 Kontext (from Leonardo Premium — see leonardo-ai-deep-dive.md for model ID)
     - prompt: "{sceneDescription}, {character.art_style}"
     - negative_prompt: character.negative_prompt + ", extra limbs, malformed anatomy, fused fingers"
     - imagePrompts: [{ url: character.hero_image_url, weight: 0.85 }]
     - Note: Kontext treats the reference as identity anchor. Weight 0.85 = identity lock
       without over-constraining scene composition. Do NOT go above 0.90.

   IF generation_strategy === 'lora'  (Gimli + characters in 10+ courses):
   - Replicate flux-schnell with LoRA:
     - model: flux-schnell (NOT flux-dev — bulk generation, cost > quality)
     - lora_weights: character.lora_model_id
     - lora_scale: 0.85 (NEVER 1.0)
     - prompt: "{TRIGGER_WORD}, {sceneDescription}, {character.art_style}"
     - negative_prompt: character.negative_prompt + ", extra limbs, malformed anatomy, fused fingers"
     - num_outputs: 1 (one per scene)
     - Timeout: 30s per image

3. For each generated image:
   a. Upload result to Cloudinary: somerschool/slides/{bundleId}/{slideIndex}.webp
   b. Update CoursePlatform bundles.content.slides[i].image_url via course-supabase.ts
   c. Update job progress: (completedCount / totalCount) * 100
4. After all scenes: set bundles.slides_generated = true
```

> **Model note:** Generate 120% of scenes (round up to nearest 10) to budget for the 10–15% rejection rate. Extra generated images sit in Cloudinary but are not written to `slides` unless Scott approves them in the approval grid.

> **DB client note (Forge, Round 10):** All CoursePlatform Supabase writes in this worker go through `course-supabase.ts` singleton ONLY. Never use the main Chapterhouse `supabase-server.ts` for CoursePlatform writes.

**Step 9B.3 — Approval grid in `/course-assets` UI**

After generation completes, Scott reviews the 112 images before they go to video production.

**File:** `src/app/course-assets/page.tsx`

Add to each bundle row (when `slides_generated === true`):
- "Review Images" button → opens a full-window approval grid modal
- Grid shows all generated slides as thumbnails (lazy-load: 20 at a time)
- Per image: large preview on hover, ✅ Approve / ❌ Reject / 🔄 Regenerate button
- Rejected images: automatically queue a `generate_character_scenes` job for just those slide indices (same scene description + new random seed)
- "Approve All" bulk button
- Progress bar: X of 112 approved

**River's UX mandate (Round 10):** Approval grid = approve / reject / regenerate. No inline image editor in the grid. If an image needs creative changes (not just "wrong anatomy"), fix the scene description and regenerate.

**Step 9B.4 — Wire "Generate Character Scenes" button to the asset dashboard**

In `/course-assets`, in the bundle row (next to "Generate Slides"):
- Button: "Generate Character Scenes" — only visible if bundle has a `character_id` reference
- On click: `POST /api/course-assets/generate-character-scenes` with `{ characterId, bundleId }`
- Supabase Realtime updates the Images status dot as generation progresses

### Phase 9B Smoke Test

- [ ] "Generate Character Scenes" button appears on bundle rows when character is set
- [ ] Clicking creates a `generate_character_scenes` job visible in `/jobs`
- [ ] **Kontext path (new character, no LoRA):** Job runs and produces 112 images — NO `lora_model_id` required
- [ ] **LoRA path (Gimli):** `lora_scale` logged at 0.85 in Railway worker logs (never 1.0)
- [ ] Kontext consistency check: same character visually present across all 112 scenes (spot-check 10 random images)
- [ ] Job produces images in Cloudinary at `somerschool/slides/{bundleId}/{n}.webp`
- [ ] `bundles.content.slides[i].image_url` is populated after generation
- [ ] Approval grid shows all generated images as thumbnails
- [ ] Reject → image auto-regenerates (new seed, same scene description) without manual intervention
- [ ] Approve All → Images status dot turns green in the main bundle grid

---

## Phase 9C — Character Sheet Generator

### WHAT

From 1 seed image (the character's `hero_image_url`), automatically generate 8 different training poses: front view, 3/4 view, side profile, sitting, pointing, surprised, neutral, dynamic. These 8 images become the LoRA training set, producing a higher-quality LoRA than a single image.

### WHY

Gimli's LoRA was trained on existing ToonBee images (good result). For a NEW character where Scott only has 1 reference image, LoRA training quality is limited. Character Sheet Generator turns 1 good image into 8 training-quality poses automatically. Better training data → more consistent identity across 112 course images.

### STEPS

**Step 9C.1 — New API route: `POST /api/characters/[id]/generate-sheet`**

```typescript
// 1. Fetch character — must have hero_image_url set
// 2. Create Railway job: type = 'generate_character_sheet', payload: { characterId }
// 3. Return { jobId }
```

**Step 9C.2 — New Railway worker job type: `generate_character_sheet`**

```
8 parallel Replicate calls — each is a flux-dev call (quality > speed for training data):

const POSE_PROMPTS = [
  'front view, facing camera directly, neutral expression, full body standing',
  'three-quarter view, slight turn to right, neutral expression, full body',
  'side profile, facing right, full body standing',
  'sitting pose, relaxed, looking toward camera',
  'pointing gesture, one limb/arm extended toward viewer, engaging pose',
  'surprised expression, eyes wide, alert, full body',
  'neutral relaxed stance, slight approachable expression',
  'dynamic active pose, mid-movement, energetic',
]

For each pose — use FLUX.1 Kontext (same model as Phase 9B/9C):
- modelId: FLUX.1 Kontext (Leonardo Premium)
- prompt: "{poseDescription}, {character.art_style}, {character.physical_description}"
- negative_prompt: character.negative_prompt + standard anatomy safety net
- imagePrompts: [{ url: character.hero_image_url, weight: 0.85 }]
- Note: Kontext maintains character identity across pose changes without IP-Adapter artifacts.
  Do NOT use IP-Adapter (weight 0.60 style-only) here — Kontext is strictly better for
  pose generation and produces cleaner LoRA training data.
- Wait for all 8 to complete (run in parallel — no batch law applies at count=8)

After all 8:
- Upload each to Cloudinary: somerschool/characters/{slug}/sheet-{n}.webp
- Update characters.reference_images = [...existing, ...8 new URLs]
- Optionally auto-trigger train-lora if reference_images.length now >= 8
```

> Style consistency note (Spark, Round 10): The `character.art_style` string must appear verbatim in all 8 pose prompts. If art style drifts between poses, the LoRA learns inconsistent styles and produces degraded character consistency. Lock it.

**Step 9C.3 — "Generate Character Sheet" button in character settings**

In the Settings page brand voices section (or a future `/characters` management page), add a "Generate Character Sheet" button next to each character's hero image thumbnail.

Button shows only when `hero_image_url` is set and `lora_training_status !== 'training'` (don't regenerate the sheet while training is in progress).

### Phase 9C Smoke Test

- [ ] "Generate Character Sheet" button visible in Settings character section when `hero_image_url` is set
- [ ] Clicking creates `generate_character_sheet` job in `/jobs`
- [ ] 8 images generated (confirm in Railway job output: 8 Cloudinary URLs)
- [ ] All 8 images visually consistent art style (same character, different poses — not 8 different characters)
- [ ] `characters.reference_images` updated with 8 new Cloudinary URLs
- [ ] If LoRA not yet trained and reference_images count ≥ 8: auto-queues `train_character_lora` job

---

## Phase 9D — HeyGen Scene Image Integration

### WHAT

Pass pre-generated scene images from `bundles.content.slides[i].image_url` (populated by Phase 9B) as scene backgrounds in HeyGen video generation calls. Scott's HeyGen avatar delivers lesson narration appearing in front of the character-consistent scene images.

### WHY

Phase 6 (Course Video Pipeline) assembles lesson videos using HeyGen for the Scott avatar. Without Phase 9D, the video assembly doesn't know about Phase 9B's generated images. Phase 9D is the connector.

### STEPS

**Step 9D.1 — Extend HeyGen route to accept background image**

**File:** `src/app/api/video/generate/route.ts`

HeyGen API supports background images in scene inputs. When `backgroundImageUrl` is provided in the request body, include it in the HeyGen scene payload.

**Step 9D.2 — Wire course-assets bundle assembly to include scene images**

When the Phase 6 pipeline builds the HeyGen job for a lesson, pull `slides[i].image_url` from the bundle and pass as `backgroundImageUrl` per scene. The Cloudinary URL produced by Phase 9B is the input.

**Step 9D.3 — Verify**

Generate 1 test lesson video using Phase 9B images. Confirm:
- Scott avatar appears in front of scene image (avatar is foreground, image is background)
- Audio narration (Phase 7) aligns with correct scene images
- KaraokePlayer in CoursePlatform renders the assembled video correctly

---

## Phase 9 SMOKE TEST — Definition of Done

- [ ] **Actions 1+2+3:** Negative prompt added, `lora_scale` fixed to 0.85, Gimli UUID + `generation_strategy = 'lora'` populated — all in ~40 minutes
- [ ] **9A (Kontext path):** New character created via "Save as Character" with no LoRA checkbox — `generation_strategy = 'kontext'` in DB. Immediately works for batch generation. No waiting.
- [ ] **9A (LoRA path):** "Upgrade to LoRA?" checkbox triggers background training. Badge shows "Training..." and auto-updates to "LoRA" when complete.
- [ ] **9B (Kontext path):** "Generate Character Scenes" produces 112 consistent images for a brand-new character with zero LoRA training. Character visually consistent across all 112.
- [ ] **9B (LoRA path):** Gimli generates 112 images via Replicate flux-schnell. `lora_scale = 0.85`. Approval grid functional.
- [ ] **9C:** Character sheet from 1 seed image → 8 consistent poses via Kontext → `reference_images[]` updated. All 8 images recognizably the same character.
- [ ] **9D:** Phase 6 video pipeline uses Phase 9B images as HeyGen backgrounds. 1 test lesson video rendered correctly.
- [ ] **9D:** 1 test lesson video passes through HeyGen with Phase 9B images as scene backgrounds.
- [ ] `lora_scale` is **0.85** in all generated Replicate calls (verify in Railway logs — fail if 1.0 appears).

---
