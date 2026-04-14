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
Phase 0 (Smoke Test)  ─────────────────────────────────── anytime
Phase 1 (Brand Voices → DB)  ──────────────────────────── gates Phase 2
Phase 2 (Social Pipeline Version C)  ──────────────────── APRIL DEADLINE
Phase 3 (Character Library)  ──────────────────────────── gates Phase 4, 5, 6
Phase 4 (Video Tab Rebuild)  ──────────────────────────── gates Phase 6
Phase 5 (Bundle Migration + Asset Dashboard)  ──────────── gates Phase 6, 7
Phase 6 (Course Video Pipeline)  ────────── needs Phase 4 + Phase 5
Phase 7 (Voice Studio Narration)  ───────── needs Phase 5
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
| Character consistency | LoRA fine-tuning via **Leonardo Custom Model** (Flux Dev base, `modelType: CHARACTERS`). Generate 3D-render-style character images via Leonardo Image tab (3D Render/RENDER_3D preset, white background, Pixar-style) → train Custom Model in Leonardo UI → trained `modelId` stored in `characters.lora_model_id` → all future generations use LoRA model ID in place of Phoenix base. Reference injection serves as live bridge until training completes. Trigger token = character slug in UPPER_CASE (e.g. `GIMLI`). Repeatable for every new character. Full workflow in Phase 3.5. **⚠️ CORRECTION: Base model is Flux Dev (not Phoenix) — confirmed March 24, 2026 from Leonardo training UI.** |
| Video providers | **Leonardo Video tab first** — evaluate for Gimli animated clips BEFORE committing to Kling. Scott has Premium ($24/mo, already active). Native image→video inside Leonardo feeds from LoRA-trained Gimli image. If quality is sufficient → skip Kling subscription ($29.99/mo saved). Kling AI second if Leonardo Video is inadequate. D-ID third (talking-head lip-sync). **HeyGen = Scott Mr. S avatar ONLY.** Not for Gimli. ToonBee retired — superseded by Leonardo LoRA + Video tab. Evaluate before Phase 4 build. |
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

**⚙️ PHASE GATE (Q-0-1) — UPDATED:** Phase 3 (Character Library) no longer depends on Leonardo. Character consistency uses LoRA via Replicate. Phase 3 gates on Replicate passing this smoke test.

- Confirm `REPLICATE_API_TOKEN` is set in Vercel env
- Test Replicate: run `black-forest-labs/flux-schnell` with a simple prompt — confirm image returns
- Phase 3 requires Replicate working. Leonardo is optional (still available as a selectable provider, but not required for any feature).

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

> **🔴 IN PROGRESS — March 24, 2026.** Gimli LoRA is **actively training RIGHT NOW** in Leonardo.ai.
> - Name: `Gimli` — Description: `Gimli First Try`
> - Base Model: **Flux Dev (1024×1024)** ← confirmed correct base for character consistency
> - Category: Character | Instance prompt: `GIMLI` | Cost: 2 tokens
> - Art style locked: **Option A — 3D Render (Pixar-style), white background** — all training images generated fresh via Leonardo Image tab using RENDER_3D preset
> - ToonBee PNGs were NOT used (ToonBee = retired; images are different art style). Training set = newly generated 3D-render malamute poses from Leonardo Premium
> - Expected completion: ~15–25 minutes
> - **NEXT STEP when done:** More → Models → copy UUID → run SQL below:
>   ```sql
>   UPDATE characters SET lora_model_id = '{YOUR_UUID}' WHERE slug = 'gimli';
>   ```

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

**WHY:** HeyGen is $29/mo and requires a pre-built avatar ID + voice ID. For Gimli content (K-5 animated clips), **evaluate Leonardo Video tab FIRST** — Scott has Premium ($24/mo, already active). Leonardo takes a LoRA-trained Gimli image and animates it natively inside the same platform where images are generated. If Leonardo Video is sufficient → skip the Kling AI subscription entirely ($29.99/mo saved). Kling AI is the second-line provider if Leonardo Video is inadequate. D-ID handles talking-head lip-sync for Scott + Gimli. Having a character-first architecture means the same workflow generates both types.

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

## Phase 6 SMOKE TEST

1. Open Course Asset Dashboard → sci-g1 → pick U1-L01
2. Click "Generate Videos" (single lesson, 7 segments)
3. Railway worker runs — 7 jobs visible at `/jobs` (or 1 job with 7 sub-steps)
4. After completion: `bundles.videos_generated` = 7, dot 4 in Dashboard turns green
5. In CoursePlatform at `localhost:3001/learn/sci-grade-1/sci-g1-u1-l01`: video plays with Gimli in KaraokePlayer
6. Slides sync at correct timestamps (verify `at` fractions approximate real moments)

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

*Build bible version: March 2026 — from brainstorm rounds 1–9.*
*Next update: after Phase 2 ships (April 2026) — add Phase 2 lessons learned, update Phase 5+ if scope changed.*
