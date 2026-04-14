# Social Media Expansion — Chunked Execution Plan

**Source of truth:** `social-media-expansion-build-bible.md` (780 lines, D1–D130 locked)
**Purpose:** Step-by-step, chunk-by-chunk plan for Claude Opus to execute in separate chat sessions. Each chunk is self-contained.
**Phase 1 code status:** ✅ COMPLETE (migrations 033/035/037 applied, all routes + worker jobs built)
**Current position:** Ready for Smoke Test → then Phase 1.5 → Phase 2 → Phase 3

---

## HOW TO USE THIS DOCUMENT

Each **CHUNK** below is designed for ONE Claude Opus chat session. Copy the chunk into a new chat, along with the build bible and CLAUDE.md, and execute.

**Rules for every chunk:**
1. Read the build bible (`social-media-expansion-build-bible.md`) and CLAUDE.md before touching code
2. Never edit original migration files — always new `ALTER TABLE` migrations
3. Buffer API = GraphQL only (`api.buffer.com`) — NEVER the old REST API
4. Next migration number: **038** (033–037 already applied)
5. Next decision number: **D131** (D1–D130 locked)
6. Next open item number: **OI-16** (OI-01 through OI-15 exist)
7. All code is TypeScript, Next.js 16.1.6 App Router, React 19, Tailwind 4, Supabase
8. Worker runs on Railway (Express server), jobs dispatched via QStash
9. Every new table gets `user_id UUID REFERENCES auth.users(id) NOT NULL` + RLS policy `USING (auth.uid() = user_id)`
10. Test after every step. Verify with `get_errors` after every file change.

---

## PHASE OVERVIEW

```
CHUNK 0 — Pre-Smoke-Test Checklist (Scott manual + deploy verification)
CHUNK 1 — Smoke Test: Single Post End-to-End
CHUNK 2 — Smoke Test: Blog-First Pipeline End-to-End
CHUNK 3 — Smoke Test: Newsletter Pipeline End-to-End
CHUNK 4 — Phase 1 Hardening: Edit-to-Learn Loop Verification + Review Queue Polish
CHUNK 5 — Phase 1.5: YouTube OAuth + Batch Playlist
CHUNK 6 — Phase 1.5: Instagram Stories + Platform Enhancements
CHUNK 7 — Phase 2 Track B: Content Entity Model Migration
CHUNK 8 — Phase 2 Track B: Blog Generation Engine + 52-Week Calendar
CHUNK 9 — Phase 2 Track B: Content Cascade (Pinterest + Evergreen Recycling)
CHUNK 10 — Phase 2 Track C: Comment Moderation System
CHUNK 11 — Phase 2 Track C: DM Policy + Social Listening
CHUNK 12 — Phase 3 Track D: Podcast CRM Foundation
CHUNK 13 — Phase 3 Track D: Outreach Sequences + Deliverability
```

**Hard sequencing rules:**
- CHUNK 0 must complete before CHUNK 1
- CHUNKS 1–3 are the smoke test — all three must pass before CHUNK 4
- CHUNK 4 must pass before any Phase 1.5 work
- CHUNKS 5–6 (Phase 1.5) can run in parallel with each other
- CHUNKS 7–9 (Phase 2 Track B) are sequential — 7 before 8, 8 before 9
- CHUNKS 10–11 (Phase 2 Track C) can run in parallel with Track B chunks
- CHUNKS 12–13 (Phase 3 Track D) only start after Tracks A+B+C are stable

---
---

## CHUNK 0 — Pre-Smoke-Test Checklist

**Goal:** Ensure the deployed system is ready for end-to-end testing. This is a manual + verification chunk — minimal code changes.

**Prerequisites:** Phase 1 code is already built and committed. Migrations 033/035/037 are applied to Supabase.

### Step 0.1 — Deploy to Vercel

**Action:** Push all Phase 1 code to the `main` branch. Verify Vercel auto-deploys.

**Verification:**
- Open the Chapterhouse Vercel dashboard
- Confirm the latest deployment succeeded (green checkmark)
- Visit the production URL and confirm `/social` page loads
- Confirm `/api/social/generate` returns a 405 on GET (route exists but only accepts POST)

### Step 0.2 — Deploy Worker to Railway

**Action:** Push the worker directory changes to Railway. The worker needs the new `newsletter-draft.ts` job and the `youtube_batch_playlist` stub in the router.

**Verification:**
- Open Railway dashboard
- Confirm the worker service is running (green status)
- Hit `GET {RAILWAY_WORKER_URL}/health` — should return 200
- Check Railway logs for startup errors

### Step 0.3 — Set Environment Variables

**Action (Railway worker — add if missing):**
```
BREVO_API_KEY=<from reference/api-guide-master.md>
```

**Action (Vercel — verify these exist):**
```
BUFFER_ACCESS_TOKEN=<existing>
SHOPIFY_WEBHOOK_SECRET=<existing>
SUPABASE_URL=<existing>
SUPABASE_SERVICE_ROLE_KEY=<existing>
QSTASH_TOKEN=<existing>
QSTASH_CURRENT_SIGNING_KEY=<existing>
QSTASH_NEXT_SIGNING_KEY=<existing>
RAILWAY_WORKER_URL=<existing>
ANTHROPIC_API_KEY=<existing>
OPENAI_API_KEY=<existing>
```

**Verification:** Open Chapterhouse `/settings` page → check environment status indicators. All social-related env vars should show green.

### Step 0.4 — Buffer Essentials Plan Upgrade (SCOTT MANUAL ACTION)

**This is a hard blocker. Cannot be automated. Scott must do this manually.**

**Action:** 
1. Go to `https://buffer.com/pricing`
2. Upgrade from Free plan to **Essentials plan** ($5/channel/month billed annually)
3. The Free plan caps at 3 channels — Essentials unlocks unlimited channels.
4. Anna does not need a separate Buffer login — Essentials is sufficient. Team plan adds multi-user collaboration seats, not more channels. Do not upgrade to Team.
5. **Recommended start: 5–6 channels** ($300–360/year). Connect these first:
   - NCHO Facebook Page
   - NCHO Instagram Business
   - SomersSchool Facebook Page
   - SomersSchool Instagram Business
   - Scott Personal Facebook Profile (or Page)
   - Scott Personal Instagram
6. **LinkedIn channels when audience justifies** (full 9 channels = $540/year):
   - NCHO LinkedIn Page
   - SomersSchool LinkedIn Page
   - Scott Personal LinkedIn Profile

**Decision reference:** D124 (updated) + D131 — locked.

**Verification:** 
1. Open Chapterhouse `/social` → Accounts tab
2. Click "Sync from Buffer"
3. All connected channels should appear with correct display names
4. Map each channel to the correct brand + platform combination
5. Save — all rows should show in the accounts table

### Step 0.5 — Register Shopify Blog Webhook (SCOTT MANUAL ACTION)

**Action:**
1. Log in to Shopify Admin: `https://next-chapter-homeschool.myshopify.com/admin`
2. Go to Settings → Notifications → Webhooks
3. Click "Create webhook"
4. Event: `blog_posts/create`
5. Format: JSON
6. URL: `https://<your-chapterhouse-vercel-url>/api/webhooks/shopify-blog-post`
7. API version: `2026-01`
8. Save

**Verification:** The webhook should appear in the list. No way to test it yet without publishing a blog post — that's CHUNK 2.

### Step 0.6 — Verify Database State

**Action (Supabase Dashboard — SQL Editor):**

```sql
-- Verify migration 033: cleaned brand/platform CHECK constraints
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'social_posts'::regclass AND conname LIKE '%brand%';

-- Verify migration 037: user_id exists on social_posts
SELECT column_name, is_nullable, data_type
FROM information_schema.columns
WHERE table_name = 'social_posts' AND column_name = 'user_id';

-- Verify migration 037: content_type exists on social_posts
SELECT column_name, is_nullable, data_type
FROM information_schema.columns
WHERE table_name = 'social_posts' AND column_name = 'content_type';

-- Verify migration 037: settings table exists
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'settings'
ORDER BY ordinal_position;

-- Verify migration 037: jobs CHECK constraint includes new types
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'jobs'::regclass AND conname = 'jobs_type_check';

-- Verify brand_voices has no alana_terry row
SELECT * FROM brand_voices WHERE brand = 'alana_terry';
-- Should return 0 rows
```

**Expected results:**
- `social_posts` brand CHECK: `ncho`, `somersschool`, `scott_personal` — NO `alana_terry`
- `social_posts` platform CHECK includes `email` (migration 035)
- `user_id` column exists, NOT NULL, on both `social_posts` and `social_accounts`
- `content_type` column exists, NOT NULL, default `'social_post'`
- `settings` table exists with `publishing_paused` boolean
- `jobs_type_check` includes `newsletter_draft` and `youtube_batch_playlist`
- Zero `alana_terry` rows in `brand_voices`

### CHUNK 0 — Done Criteria

All of the following must be true:
- [ ] Vercel deployment is green and `/social` loads
- [ ] Railway worker is running and `/health` returns 200
- [ ] `BREVO_API_KEY` is set in Railway env
- [ ] Buffer Essentials plan active with channels connected (minimum 5–6; 9 when LinkedIn justified)
- [ ] All 9 Buffer channels synced and mapped in Chapterhouse `/social` Accounts tab
- [ ] Shopify blog webhook registered for `blog_posts/create`
- [ ] All 6 database verification queries return expected results

---
---

## CHUNK 1 — Smoke Test: Single Post End-to-End

**Goal:** Generate one NCHO Facebook education tip post, review it, approve it, and verify it appears in Buffer's schedule. This is the minimal end-to-end validation.

**Prerequisites:** CHUNK 0 complete. Buffer Essentials plan active. At least NCHO Facebook channel synced and mapped.

### Step 1.1 — Generate a Single Post

**Action:**
1. Open Chapterhouse `/social` page
2. Go to the "Generate" tab
3. Select: Brand = `ncho`, Platform = `facebook`, Count = 1
4. Enter topic seed: "How to choose secular homeschool curriculum for 4th grade science"
5. Click Generate

**What should happen behind the scenes:**
- `POST /api/social/generate` fires
- Route reads `brand_voices` table for NCHO's `full_voice_prompt` + `platform_hints.facebook` (if any)
- Claude Sonnet 4.6 generates one post with text + hashtags
- Post inserted into `social_posts` with:
  - `brand: 'ncho'`
  - `platform: 'facebook'`
  - `status: 'pending_review'`
  - `content_type: 'social_post'`
  - `user_id: <Scott's UUID>`
- Supabase Realtime fires → post appears in Review Queue tab

**Verification:**
- Post appears in Review Queue within 5 seconds
- Post shows NCHO brand badge (amber)
- Post shows Facebook platform badge
- Post text follows NCHO voice rules: says "your child" (never "your student"), no forbidden words (explore, journey, leverage, synergy)
- Hashtags are present and relevant

### Step 1.2 — Edit the Post (Optional but Recommended)

**Action:**
1. In the Review Queue, click on the post to edit
2. Make a small text change (e.g., change a word or add a sentence)
3. Save the edit

**What should happen:**
- `PATCH /api/social/posts/[id]` fires
- The original text is pushed to `edit_history` JSONB array
- The new text replaces `post_text`

**Verification:**
- The card shows the updated text
- (DB check) `edit_history` array has one entry with the original text and `saved_at` timestamp

### Step 1.3 — Approve and Schedule

**Action:**
1. Set a schedule date/time (pick something in the next hour for testing)
2. Select the NCHO Facebook Buffer channel from the dropdown
3. Click "Approve"

**What should happen:**
- `POST /api/social/posts/[id]/approve` fires
- Route builds full text (post_text + hashtags appended)
- Route calls Buffer GraphQL `createPost` mutation:
  ```graphql
  mutation($input: CreatePostInput!) {
    createPost(input: $input) {
      ... on PostActionSuccess {
        post { id text }
      }
      ... on MutationError {
        message
      }
    }
  }
  ```
  With input: `{ text, channelId: <NCHO FB buffer_profile_id>, schedulingType: "automatic", mode: "customScheduled", dueAt: <ISO8601 timestamp> }`
- Buffer returns a post ID → stored as `buffer_update_id`
- Post status changes: `pending_review` → `scheduled`
- D130 edit-to-learn: if `edit_history.length > 0`, the approve route extracts a platform hint signal and writes to `brand_voices.platform_hints.facebook` for NCHO

**Verification:**
- Post disappears from Review Queue (or shows "scheduled" status)
- (DB check) `social_posts` row: `status = 'scheduled'`, `buffer_update_id` is not null, `scheduled_for` is set
- Open Buffer dashboard → confirm the post appears in NCHO Facebook queue scheduled for the correct time
- If you edited the post in Step 1.2: check `brand_voices` table for NCHO → `platform_hints` JSONB should now have a `facebook` key with a learned hint

### Step 1.4 — Wait for Publication

**Action:** Wait for the scheduled time to pass. Buffer will publish the post to Facebook.

**Verification:**
- Check NCHO Facebook page — the post should be live
- (Optional) Run analytics pull: `POST /api/social/analytics` — this queries Buffer for published post stats and updates `buffer_stats` JSONB on the `social_posts` row

### Step 1.5 — Verify Review Queue Realtime

**Action:** Open `/social` in two browser tabs. Generate a new post in tab 1.

**Verification:** The new post appears in tab 2 automatically (Supabase Realtime) without page refresh.

### CHUNK 1 — Done Criteria

- [ ] One NCHO Facebook post generated successfully
- [ ] Post appeared in Review Queue via Realtime
- [ ] Post text follows NCHO brand voice rules
- [ ] Post edited and edit_history tracked correctly
- [ ] Post approved → appeared in Buffer schedule
- [ ] Buffer published the post to Facebook at the scheduled time
- [ ] D130 edit-to-learn wrote a platform hint (if post was edited)
- [ ] Realtime works across browser tabs

---
---

## CHUNK 2 — Smoke Test: Blog-First Pipeline End-to-End

**Goal:** Publish a blog post on Shopify and verify the entire blog-first pipeline fires: webhook → social batch job → posts in review queue.

**Prerequisites:** CHUNK 1 complete. Shopify blog webhook registered (Step 0.5).

### Step 2.1 — Create and Publish a Test Blog Post on Shopify

**Action:**
1. Log in to Shopify Admin
2. Go to Online Store → Blog Posts → Add Blog Post
3. Title: "5 Tips for Choosing Secular Homeschool Science Curriculum"
4. Write 3-4 paragraphs of content (or paste placeholder content — this is a test)
5. Set visibility to "Visible" and click Save
6. **Important:** The post must have `published_at` set (not saved as draft) — the webhook route filters on this

### Step 2.2 — Verify Webhook Fires

**What should happen:**
1. Shopify sends `POST /api/webhooks/shopify-blog-post` with the blog post JSON
2. The route:
   - Verifies the HMAC signature (using `SHOPIFY_WEBHOOK_SECRET`)
   - Checks `published_at` is not null (filters out draft saves)
   - Creates TWO jobs in Supabase:
     - Job 1: `type: 'social_batch'` with payload `{ brands: ["ncho", "somersschool", "scott_personal"], platforms: ["facebook", "instagram", "linkedin"], count_per_combo: 1, topic_seed: "<blog title>", blog_post_id: "<shopify id>" }`
     - Job 2: `type: 'newsletter_draft'` with payload `{ blog_post_id: "<shopify id>", title: "<blog title>", body_html: "<blog HTML>" }`
   - Returns 200 immediately

**Verification:**
- Check Vercel function logs for the webhook route — should show successful execution
- Check Supabase `jobs` table: 2 new jobs with `status: 'queued'`
- Job 1: type `social_batch`
- Job 2: type `newsletter_draft`

### Step 2.3 — Verify Social Batch Job Completes

**What should happen:**
1. QStash delivers Job 1 to Railway worker
2. Worker calls back to `POST /api/social/generate` with the full payload
3. Claude generates posts for all 3 brands × 3 platforms = up to 9 posts
4. All posts inserted into `social_posts` with `status: 'pending_review'`
5. Job progress updates: 10% → 50% → 100%

**Verification:**
- Open Chapterhouse `/jobs` page — social_batch job should show 100% complete
- Open `/social` Review Queue — 9 new posts should appear (3 brands × 3 platforms)
- Each post references the blog topic
- Each post follows the correct brand voice for its brand
- Each post is tagged with the correct platform

### Step 2.4 — Verify Newsletter Draft Job Completes

**What should happen:**
1. QStash delivers Job 2 to Railway worker
2. Worker calls `runNewsletterDraft()`:
   - Strips HTML from the blog body
   - Claude Haiku generates a subject line + email HTML body
   - Inserts into `social_posts` with `content_type: 'newsletter'`, `platform: 'email'`, `status: 'pending_review'`
   - (If `BREVO_API_KEY` set) Creates a Brevo draft campaign — does NOT send, has no recipients
3. Job completes

**Verification:**
- `/jobs` page shows `newsletter_draft` job at 100%
- `/social` Review Queue shows 1 newsletter item (look for `content_type: 'newsletter'` badge or `platform: 'email'` indicator)
- The newsletter has a subject line and HTML body
- (DB check) `social_posts` row: `content_type = 'newsletter'`, `platform = 'email'`, `status = 'pending_review'`

### Step 2.5 — Approve Social Posts from Blog Trigger

**Action:** Approve 2-3 of the generated social posts (same flow as CHUNK 1 Step 1.3). Verify they schedule in Buffer correctly.

### CHUNK 2 — Done Criteria

- [ ] Shopify blog post published → webhook fired successfully
- [ ] HMAC signature verified (check logs for any 401 errors)
- [ ] Two jobs created: `social_batch` + `newsletter_draft`
- [ ] Social batch job completed → 9 posts in Review Queue
- [ ] Newsletter draft job completed → 1 newsletter in Review Queue
- [ ] Social posts follow correct brand voice per brand
- [ ] At least 2 social posts approved and scheduled in Buffer
- [ ] Brevo draft campaign created (or graceful fallback logged if BREVO_API_KEY missing)

---
---

## CHUNK 3 — Smoke Test: Newsletter Pipeline Stress Test

**Goal:** Fully validate the newsletter draft → review → manual send workflow. Verify the Brevo integration handles edge cases.

**Prerequisites:** CHUNK 2 complete. `BREVO_API_KEY` set in Railway env.

### Step 3.1 — Review the Newsletter Draft

**Action:**
1. Open `/social` Review Queue
2. Find the newsletter item from CHUNK 2 (platform = `email`, content_type = `newsletter`)
3. Read the generated subject line and body
4. Edit if needed (this tests the edit-to-learn loop on newsletter content too)

### Step 3.2 — Verify Brevo Campaign Creation

**Action (Brevo Dashboard):**
1. Log in to Brevo: `https://app.brevo.com`
2. Go to Campaigns → Email
3. Find the draft campaign (it should have the blog title or similar as the campaign name)
4. Verify:
   - Campaign is in DRAFT status (not scheduled, not sent)
   - Campaign has NO recipients (cannot accidentally send)
   - The HTML content matches the newsletter body from the review queue

### Step 3.3 — Manual Send via Brevo

**Action:** This step is done manually in Brevo, not through Chapterhouse.
1. In Brevo, add a test recipient list (Scott's email only)
2. Review the campaign
3. Send to the test list

**Verification:**
- Email arrives at Scott's inbox
- Subject line is correct
- HTML renders correctly
- Links work
- No spelling errors or hallucinated content

### Step 3.4 — Test Newsletter Without Brevo Key

**Action:** Temporarily remove `BREVO_API_KEY` from Railway env. Trigger another blog post publish on Shopify (or manually create a `newsletter_draft` job via the API).

**Verification:**
- The newsletter draft job still completes successfully
- The newsletter still appears in the Review Queue
- The worker logs show a graceful message like "BREVO_API_KEY not set — skipping Brevo campaign creation"
- The only difference is: no draft campaign in Brevo

**Action:** Restore `BREVO_API_KEY` in Railway env.

### CHUNK 3 — Done Criteria

- [ ] Newsletter draft reviewed and edited in Review Queue
- [ ] Brevo draft campaign exists with correct content and DRAFT status
- [ ] Brevo campaign has no recipients by default (safety check)
- [ ] Manual send via Brevo delivers correctly formatted email
- [ ] System degrades gracefully when BREVO_API_KEY is missing
- [ ] Newsletter content follows the correct brand voice

---
---

## CHUNK 4 — Phase 1 Hardening: Edit-to-Learn + Review Queue Polish

**Goal:** Verify the D130 edit-to-learn voice loop works correctly across all brands and platforms. Polish any UI rough edges discovered during smoke testing.

**Prerequisites:** CHUNKS 1-3 complete.

### Step 4.1 — Verify D130 Edit-to-Learn Loop Across All Brands

**Test matrix — perform each of these combinations:**

| Brand | Platform | Action |
|---|---|---|
| ncho | facebook | Generate → Edit → Approve → Check `platform_hints.facebook` |
| ncho | instagram | Generate → Edit → Approve → Check `platform_hints.instagram` |
| ncho | linkedin | Generate → Edit → Approve → Check `platform_hints.linkedin` |
| somersschool | facebook | Generate → Edit → Approve → Check `platform_hints.facebook` |
| scott_personal | linkedin | Generate → Edit → Approve → Check `platform_hints.linkedin` |

**For each test:**
1. Generate a post for the brand/platform combo
2. Edit the post text (make a meaningful change — rewrite a sentence, change tone)
3. Approve the post
4. Check the `brand_voices` table for that brand → `platform_hints` JSONB
5. Verify the correct platform key was written (e.g., `platform_hints.linkedin` for a LinkedIn edit)
6. Verify NO other platform keys were modified (e.g., editing a Facebook post must NOT touch `platform_hints.instagram`)

**Critical check:** Cross-platform contamination must be zero. Each platform hint slot is independent.

### Step 4.2 — Verify Brand Voice Read Path

**Action:** After accumulating a few platform hints from Step 4.1:
1. Generate a NEW post for a brand/platform that has a platform hint
2. Check the Vercel function logs for `/api/social/generate`
3. Verify the system prompt includes BOTH:
   - The base `full_voice_prompt` from `brand_voices`
   - The `platform_hints[platform]` appended at the end
4. Verify the generated post reflects the learned hint

### Step 4.3 — Verify Settings → Brand Voices Panel

**Action:**
1. Open `/settings`
2. Find the Brand Voices panel
3. View the platform hints that were auto-learned in Step 4.1
4. Delete one platform hint
5. Generate a new post for that brand/platform
6. Verify the deleted hint is no longer included in the generation prompt

### Step 4.4 — Verify Publishing Pause (OI-10 / D settings table)

**Action:**
1. Open `/settings` (or directly update via Supabase): set `publishing_paused = true`
2. Trigger the weekly cron: `GET /api/cron/social-weekly`
3. Verify the cron skips social generation and logs "Publishing paused"
4. Set `publishing_paused = false`
5. Trigger the cron again
6. Verify the cron generates posts normally

### Step 4.5 — UI Polish Issues (Fix Any Found During Smoke Testing)

**Common issues to check and fix:**

1. **Newsletter items in Review Queue** — do they look different from social posts? They should show:
   - `platform: 'email'` badge (distinct color from social platforms)
   - `content_type: 'newsletter'` indicator
   - Subject line visible in the card header
   - "Send via Brevo" action instead of "Schedule via Buffer" (or at minimum, the Buffer channel picker should be hidden for newsletter items)

2. **Rejection flow** — reject a post, verify:
   - Status changes to `rejected`
   - Post is archived, not deleted
   - Rejection reason is stored (if the UI supports it)

3. **Regeneration flow** — from a rejected post, click "Regenerate" (if the button exists):
   - A new post is generated from the same topic seed
   - New post has `status: 'pending_review'`
   - Old rejected post stays in archive

4. **Empty state** — when Review Queue has no pending posts:
   - Shows helpful message, not a blank page
   - "Generate" button is accessible

5. **UTM tagging** — check approved posts:
   - URLs in post text should have UTM parameters: `utm_source=[platform]&utm_medium=social&utm_campaign=[brand]-[month]&utm_content=[post_id]`
   - (If UTM tagging is not yet implemented: NOTE THIS AS A GAP for implementation)

### Step 4.6 — Weekly Cron Full Run

**Action:**
1. Trigger the weekly cron manually: `GET /api/cron/social-weekly`
2. The cron should:
   - Create a `social_batch` job
   - QStash delivers to Railway worker
   - Worker generates posts for all active brands × platforms (cadence: D49 — 3 posts/week/brand, but cron generates a batch — verify count)
   - All posts land in Review Queue

**Verification:**
- Job completes in `/jobs`
- Posts appear in Review Queue
- Each brand has roughly equal representation
- No duplicate topics within the same batch

### CHUNK 4 — Done Criteria

- [ ] D130 edit-to-learn works for all 5 tested brand/platform combos
- [ ] Zero cross-platform contamination (platform hints are isolated)
- [ ] Platform hints correctly appended to generation prompts
- [ ] Platform hints deletable from Brand Voices panel
- [ ] Publishing pause stops cron, unpause resumes it
- [ ] Newsletter items render correctly in Review Queue
- [ ] Rejection + regeneration flow works
- [ ] UTM tagging verified (or gap documented)
- [ ] Weekly cron generates correct batch

---
---

## CHUNK 5 — Phase 1.5: YouTube OAuth + Batch Playlist

**Goal:** Wire up YouTube Data API v3 with upload OAuth scope, implement the `youtube_batch_playlist` worker job, and test end-to-end batch video creation + playlist publishing.

**Prerequisites:** Phase 1 smoke test and hardening (CHUNKS 0-4) complete. HeyGen API key in Railway env.

**Bible references:** D120, Section 6.5

### Step 5.1 — YouTube OAuth Setup (SCOTT MANUAL ACTION)

**Action:**
1. Go to Google Cloud Console → APIs & Services → Credentials
2. The existing `YOUTUBE_API_KEY` is a simple API key (read-only). YouTube uploads require OAuth.
3. Create an OAuth 2.0 client ID:
   - Application type: Web application
   - Authorized redirect URIs: `https://<chapterhouse-url>/api/youtube/oauth/callback`
4. Enable the "YouTube Data API v3" if not already enabled
5. Complete the OAuth consent screen (may need verification for `youtube.upload` scope)
6. Perform the OAuth grant flow manually (one-time):
   - Visit: `https://accounts.google.com/o/oauth2/v2/auth?client_id=<CLIENT_ID>&redirect_uri=<REDIRECT_URI>&response_type=code&scope=https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube&access_type=offline&prompt=consent`
   - Authorize with Scott's YouTube account
   - Exchange the code for tokens
   - Store the **refresh token** — this is permanent

**Environment variables to add:**
```
YOUTUBE_OAUTH_CLIENT_ID=<from Google Cloud>
YOUTUBE_OAUTH_CLIENT_SECRET=<from Google Cloud>
YOUTUBE_OAUTH_REFRESH_TOKEN=<from one-time auth flow>
```
Add to both Vercel and Railway env.

### Step 5.2 — OAuth Callback Route (Optional but Recommended)

**Create:** `src/app/api/youtube/oauth/callback/route.ts`

```
Purpose: Handles the OAuth redirect, exchanges code for tokens, displays the refresh token
for Scott to copy into env vars. This is a one-time-use route.

Logic:
1. Read `code` from query params
2. POST to `https://oauth2.googleapis.com/token` with:
   - code, client_id, client_secret, redirect_uri, grant_type=authorization_code
3. Display the refresh_token in the response (DO NOT store it in Supabase — env var only)
4. Log the access_token expiry for reference
```

### Step 5.3 — YouTube Upload Helper

**Create:** `worker/src/lib/youtube-upload.ts`

```
Purpose: Encapsulates YouTube Data API v3 upload logic.

Functions:
1. getAccessToken(): Uses YOUTUBE_OAUTH_REFRESH_TOKEN to get a fresh access token
   - POST https://oauth2.googleapis.com/token
   - body: { refresh_token, client_id, client_secret, grant_type: 'refresh_token' }
   - Returns access_token (valid ~1 hour)

2. uploadVideo(accessToken, videoBuffer, metadata):
   - Uses YouTube resumable upload API
   - POST https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status
   - Headers: Authorization: Bearer <accessToken>
   - Body: { snippet: { title, description, tags, categoryId: "27" (Education) }, status: { privacyStatus: "public" } }
   - Returns video ID

3. addToPlaylist(accessToken, playlistId, videoId):
   - POST https://www.googleapis.com/youtube/v3/playlistItems?part=snippet
   - Body: { snippet: { playlistId, resourceId: { kind: "youtube#video", videoId } } }

4. createPlaylist(accessToken, title, description):
   - POST https://www.googleapis.com/youtube/v3/playlists?part=snippet,status
   - Body: { snippet: { title, description }, status: { privacyStatus: "public" } }
   - Returns playlist ID
```

### Step 5.4 — Implement `youtube_batch_playlist` Worker Job

**Create:** `worker/src/jobs/youtube-batch-playlist.ts`

**Replace the stub in `worker/src/jobs/router.ts`** — currently it just fails with "YouTube OAuth not yet configured". Replace with: `await runYouTubeBatchPlaylist(jobId, payload)`.

```
Input payload (from Section 6.5):
{
  brand: "ncho" | "somersschool" | "scott_personal",
  playlist_title: string,
  topic_seeds: string[],           // Array of video topics
  heyGen_avatar_id: string,        // Scott's HeyGen avatar ID
  voice_id: string,                // ElevenLabs or HeyGen voice
  video_duration_seconds: 150,     // Target ~2.5 min
  youtube_playlist_id: string | null  // Existing playlist, or null to create new
}

Pipeline (per topic seed):
1. Check YOUTUBE_OAUTH_REFRESH_TOKEN exists — if not, fail job immediately with clear error
2. Get YouTube access token via refresh
3. If youtube_playlist_id is null, create a new playlist (once, before loop)
4. For each topic_seed (index i of N):
   a. Update progress: (i/N * 80)%, "Generating script for: <topic>"
   b. Call Claude Haiku to generate a 2-3 min script: 
      System: "You are writing a script for a short educational YouTube video. 
               The host is <brand> — <brand voice summary>. Duration: ~<seconds>s. 
               Write ONLY the spoken script, no stage directions."
      User: "Topic: <topic_seed>"
   c. Update progress: "Submitting to HeyGen for: <topic>"
   d. Submit to HeyGen API:
      POST https://api.heygen.com/v2/video/generate
      Body: { video_inputs: [{ character: { type: "avatar", avatar_id }, voice: { type: "text", input_text: script, voice_id }, ... }], dimension: { width: 1920, height: 1080 } }
   e. Poll HeyGen status until complete (may take 3-10 min per video):
      GET https://api.heygen.com/v1/video_status.get?video_id=<id>
      Poll every 30s, timeout at 20 min
   f. Download the rendered MP4 from HeyGen's URL
   g. Upload MP4 to YouTube via resumable upload
   h. Add video to playlist
   i. Update progress: ((i+1)/N * 80 + 10)%, "Uploaded: <topic>"
5. Final progress: 100%, "All videos uploaded"
6. Write output: { playlist_id, playlist_url, videos: [{topic, youtube_video_id, url}] }
```

### Step 5.5 — UI: YouTube Batch Trigger Button

**Modify:** `src/app/social/page.tsx` (or wherever the `/social` UI tabs live)

Add a "YouTube Batch" section (could be a 4th tab or a button in the existing Generate tab):

```
UI elements:
- Brand selector (dropdown: ncho / somersschool / scott_personal)
- Playlist title input
- Topic seeds textarea (one per line)
- HeyGen avatar ID input (pre-filled with default)
- Voice ID input (pre-filled with default)
- "Generate Batch" button

On click:
- POST /api/jobs/create with type: 'youtube_batch_playlist'
- Show job progress (link to /jobs or inline progress bar)
```

### Step 5.6 — Test with 3 Videos

**Action:**
1. Enter 3 topic seeds for NCHO (e.g., "Why secular science curriculum matters", "Reading together at bedtime", "3 mistakes new homeschool parents make")
2. Click "Generate Batch"
3. Wait for all 3 videos to render and upload (~10-30 min)

**Verification:**
- Job shows 100% in `/jobs`
- Job output contains 3 video entries with YouTube URLs
- All 3 videos appear in the YouTube playlist
- Videos are public and playable
- Video content matches the topic seeds

### CHUNK 5 — Done Criteria

- [ ] YouTube OAuth tokens obtained and stored in env vars
- [ ] YouTube upload helper works (access token refresh, upload, playlist management)
- [ ] `youtube_batch_playlist` worker job fully implemented (no longer a stub)
- [ ] HeyGen script generation → video render → YouTube upload pipeline works end-to-end
- [ ] 3 test videos successfully rendered, uploaded, and added to a playlist
- [ ] UI trigger button exists in `/social`
- [ ] Job progress updates correctly in `/jobs`

---
---

## CHUNK 6 — Phase 1.5: Instagram Stories + Platform Enhancements

**Goal:** Add Instagram Stories support and any platform-specific enhancements identified during smoke testing.

**Prerequisites:** CHUNKS 0-4 complete. This chunk can run in parallel with CHUNK 5.

### Step 6.1 — Evaluate Instagram Stories API Access

**Research needed:**
- Instagram Graph API supports Stories publishing for Business accounts
- Check if Buffer's API supports Story scheduling (Buffer has partial Stories support)
- If Buffer doesn't support Stories: evaluate direct Instagram Graph API publishing

**Decision gate:** If Buffer supports Stories → use the existing Buffer pipeline. If not → build a direct Instagram Graph API integration (new route).

### Step 6.2 — Stories Content Type

**If proceeding with Stories:**

**Migration:** `supabase/migrations/20260XXX_038_add_stories_content_type.sql`
```sql
-- Add 'story' to content_type CHECK constraint
ALTER TABLE social_posts DROP CONSTRAINT IF EXISTS social_posts_content_type_check;
ALTER TABLE social_posts ADD CONSTRAINT social_posts_content_type_check 
  CHECK (content_type IN ('social_post', 'newsletter', 'story'));
```

**Generate route changes:**
- Add `content_type: 'story'` option to the generation schema
- Story-specific prompt: shorter text (max 200 chars), vertical image orientation (1080×1920), CTA overlay
- Story posts should have a `story_sticker_type` field (poll, question, link) — evaluate if this belongs in `metadata` JSONB

### Step 6.3 — Platform Enhancement Audit

**Check these items from smoke test findings:**

1. **Instagram carousel support** — can we generate multi-image carousel posts?
   - Buffer supports carousel scheduling for Instagram Business accounts
   - Would need multiple image URLs per post → `image_urls TEXT[]` column or `metadata` JSONB
   - DEFERRED to Phase 2 if not trivial

2. **LinkedIn article publishing** — long-form articles vs. link posts
   - Buffer supports LinkedIn article creation for Company Pages
   - Blog-derived LinkedIn content could be full articles, not just link previews
   - Evaluate effort vs. benefit

3. **Hashtag optimization** — are generated hashtags relevant and not banned?
   - Add a hashtag validation step (Instagram has banned hashtags that cause shadow-banning)
   - Simple blocklist approach: maintain a `banned_hashtags` array in code or DB

### CHUNK 6 — Done Criteria

- [ ] Instagram Stories support evaluated and implemented (or documented as deferred with reasoning)
- [ ] Platform-specific enhancements from smoke test findings addressed
- [ ] Any new content types properly migrated in schema
- [ ] All changes tested end-to-end

---
---

## CHUNK 7 — Phase 2 Track B: Content Entity Model Migration

**Goal:** Migrate from the flat `social_posts` table to a multi-layer content entity model that supports blogs, primary assets, variants, and recycled content. This is the foundation for all Track B work.

**Prerequisites:** Phase 1 + 1.5 complete and stable.

**Bible references:** Section 6.1 (Content Entity Model)

### Step 7.1 — Design the Schema

The bible defines these conceptual layers (Section 6.1):

| Layer | Concept | Current State | Action |
|---|---|---|---|
| Idea / Source | Keyword seed, campaign brief, topic | None | NEW TABLE: `content_ideas` |
| Primary Asset | Blog post, long-form content | None (Shopify is source) | NEW TABLE: `content_assets` |
| Variants | Platform-specific adaptations | `social_posts` (conflated) | MIGRATE: add `content_asset_id` FK |
| Distribution Event | Scheduled publication | `social_posts.scheduled_for` | Keep as-is |
| Recycled Event | Re-use after 90+ days | None | NEW: `is_recycled` + `original_post_id` |

### Step 7.2 — Create Migration 038: Content Ideas Table

**Create:** `supabase/migrations/20260XXX_038_create_content_ideas.sql`

```sql
CREATE TABLE IF NOT EXISTS content_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  description TEXT,
  source_type TEXT NOT NULL CHECK (source_type IN (
    'editorial_calendar', 'keyword_research', 'manual', 'ai_suggested',
    'competitor_gap', 'seasonal', 'trending'
  )),
  brand TEXT NOT NULL CHECK (brand IN ('ncho', 'somersschool', 'scott_personal')),
  status TEXT NOT NULL DEFAULT 'seed' CHECK (status IN ('seed', 'planned', 'in_progress', 'published', 'archived')),
  scheduled_week DATE,        -- ISO week start date for 52-week calendar
  campaign_id UUID,           -- Future: link to campaign table
  keywords TEXT[],
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_content_ideas_user ON content_ideas(user_id);
CREATE INDEX idx_content_ideas_brand ON content_ideas(brand);
CREATE INDEX idx_content_ideas_status ON content_ideas(status);
CREATE INDEX idx_content_ideas_week ON content_ideas(scheduled_week);

ALTER TABLE content_ideas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner only" ON content_ideas FOR ALL USING (auth.uid() = user_id);
ALTER PUBLICATION supabase_realtime ADD TABLE content_ideas;
```

### Step 7.3 — Create Migration 039: Content Assets Table

**Create:** `supabase/migrations/20260XXX_039_create_content_assets.sql`

```sql
CREATE TABLE IF NOT EXISTS content_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  idea_id UUID REFERENCES content_ideas(id) ON DELETE SET NULL,
  asset_type TEXT NOT NULL CHECK (asset_type IN ('blog_post', 'video_script', 'podcast_notes', 'lead_magnet', 'long_form')),
  title TEXT NOT NULL,
  body TEXT,                   -- Full content (for blog posts: the blog body)
  body_html TEXT,              -- HTML version (for blog posts: Shopify HTML)
  external_id TEXT,            -- Shopify blog post ID, YouTube video ID, etc.
  external_url TEXT,           -- Shopify blog URL, YouTube URL, etc.
  brand TEXT NOT NULL CHECK (brand IN ('ncho', 'somersschool', 'scott_personal')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'published', 'archived')),
  published_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}', -- SEO data, tags, category, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_content_assets_user ON content_assets(user_id);
CREATE INDEX idx_content_assets_type ON content_assets(asset_type);
CREATE INDEX idx_content_assets_brand ON content_assets(brand);
CREATE INDEX idx_content_assets_idea ON content_assets(idea_id);

ALTER TABLE content_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner only" ON content_assets FOR ALL USING (auth.uid() = user_id);
ALTER PUBLICATION supabase_realtime ADD TABLE content_assets;
```

### Step 7.4 — Create Migration 040: Link Social Posts to Content Assets

**Create:** `supabase/migrations/20260XXX_040_link_posts_to_assets.sql`

```sql
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS content_asset_id UUID REFERENCES content_assets(id) ON DELETE SET NULL;
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS is_recycled BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE social_posts ADD COLUMN IF NOT EXISTS original_post_id UUID REFERENCES social_posts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_social_posts_asset ON social_posts(content_asset_id);
CREATE INDEX IF NOT EXISTS idx_social_posts_recycled ON social_posts(is_recycled) WHERE is_recycled = true;
```

### Step 7.5 — Create CRUD API Routes

**Create these routes:**

1. `src/app/api/content-ideas/route.ts` — GET (list with filters) + POST (create)
2. `src/app/api/content-ideas/[id]/route.ts` — GET + PATCH + DELETE
3. `src/app/api/content-assets/route.ts` — GET (list) + POST (create)
4. `src/app/api/content-assets/[id]/route.ts` — GET + PATCH + DELETE

All routes follow existing patterns: Supabase service role client, Zod validation, proper error handling.

### Step 7.6 — Update Blog Webhook to Create Content Asset

**Modify:** `src/app/api/webhooks/shopify-blog-post/route.ts`

After receiving the webhook and before creating the social_batch + newsletter_draft jobs:
1. Insert a row into `content_assets` with `asset_type: 'blog_post'`, `external_id: <shopify blog post id>`, `external_url: <shopify blog URL>`, `status: 'published'`
2. Pass the `content_asset_id` in the job payloads
3. The social generation route uses this to link generated posts to the asset: `content_asset_id` set on each `social_posts` row

### CHUNK 7 — Done Criteria

- [ ] `content_ideas` table created with RLS + Realtime
- [ ] `content_assets` table created with RLS + Realtime
- [ ] `social_posts` linked to `content_assets` via FK
- [ ] Recycled content tracking columns added
- [ ] 4 new CRUD API routes working
- [ ] Blog webhook creates a content_asset record
- [ ] Social posts from blog trigger are linked to the content asset
- [ ] All existing functionality still works (no regressions)

---
---

## CHUNK 8 — Phase 2 Track B: Blog Generation Engine + 52-Week Calendar

**Goal:** Build the 52-week editorial calendar system and the AI blog generation pipeline. This is the content engine that feeds everything downstream.

**Prerequisites:** CHUNK 7 complete.

**Bible references:** D94, D95, D97, D100, D126, Section 3.1

### Step 8.1 — Editorial Calendar UI

**Create:** `src/app/editorial-calendar/page.tsx`

This is a new page in the Chapterhouse nav (add to Production group in `src/lib/navigation.ts`).

```
UI Layout:
- 52-week grid view (current year, scrollable)
- Each week cell shows: week number, date range, topic title (if assigned), status badge
- Click a week → opens a drawer/modal:
  - Topic title (editable)
  - Topic description / brief
  - Brand selector (which brand owns this topic)
  - Keywords
  - Status: seed → planned → in_progress → published
  - "Generate Blog Posts" button (creates AI generation job)
  - Links to generated content_assets for this week

Alternative: Calendar heatmap view (like GitHub contribution graph)
  - Green = published, Yellow = planned, Grey = empty, Red = overdue
```

### Step 8.2 — 52-Week Calendar API

**Create:** `src/app/api/editorial-calendar/route.ts`

```
GET: Returns all content_ideas for the current year, grouped by scheduled_week
  - Query: SELECT * FROM content_ideas WHERE scheduled_week BETWEEN <year-start> AND <year-end> ORDER BY scheduled_week
  
POST: Bulk create/update week assignments
  - Body: { weeks: [{ week_date: "2026-04-07", title: "...", brand: "ncho", keywords: [...] }] }
  - Upserts content_ideas rows with source_type: 'editorial_calendar'
```

### Step 8.3 — Blog Draft Generation Job

**Create:** `worker/src/jobs/blog-draft.ts`

```
Job type: 'blog_draft' (add to jobs CHECK constraint — new migration)

Input payload:
{
  idea_id: UUID,           // content_ideas row
  brand: string,
  title: string,
  keywords: string[],
  target_word_count: 800   // D94 minimum depth bar
}

Pipeline:
1. Read brand voice from brand_voices table
2. Read any relevant platform_hints (blog voice may differ from social)
3. Call Claude Sonnet 4.6:
   System: "You are writing a blog post for <brand>. Voice rules: <brand_voice>. 
            This is for a Shopify blog. Include a compelling title, meta description,
            proper H2/H3 structure, internal link placeholders, and a clear CTA.
            Target: <word_count> words. DO NOT include state-specific ESA/allotment claims
            unless explicitly provided in the brief."
   User: "Topic: <title>\nKeywords: <keywords>\nBrand: <brand>"
4. Insert content_asset with:
   - asset_type: 'blog_post'
   - body: markdown version
   - body_html: converted HTML
   - status: 'draft'
   - idea_id: linking back to the editorial calendar
5. Insert social_posts row with content_type: 'blog_draft', status: 'pending_review'
   (This puts it in the Review Queue for Scott to review before publishing to Shopify)
```

### Step 8.4 — Shopify Blog Publishing Route

**Create:** `src/app/api/blog/publish/route.ts`

```
POST: Publishes an approved blog draft to Shopify

Input: { content_asset_id: UUID }

Pipeline:
1. Read the content_asset row
2. Call Shopify Admin API — POST /admin/api/2026-01/blogs/<blog_id>/articles.json
   Body: { article: { title, body_html, author: "NCHO Team" / "SomersSchool" / "Scott Somers", tags, published: true } }
3. Store the Shopify article ID in content_assets.external_id
4. Store the Shopify URL in content_assets.external_url
5. Update content_assets.status = 'published', published_at = NOW()
6. Return the Shopify URL

Note: This replaces the need for manual Shopify blog posting. Scott reviews the draft
in Chapterhouse → clicks "Publish to Shopify" → Shopify publishes → webhook fires → 
social + newsletter cascade auto-triggers.
```

### Step 8.5 — Blog Governance Checks

**Before any auto-generation is considered (Bible Section 3.1 requirements):**

1. **Minimum depth bar:** Reject any generated blog under 600 words
2. **Duplicate topic detection:** Before generating, check `content_assets` for similar titles (fuzzy match or embedding similarity)
3. **Anti-hallucination:** System prompt explicitly forbids state-specific ESA claims without source data
4. **Internal link strategy:** Blog generation includes `[INTERNAL_LINK: <topic>]` placeholders that Scott fills in manually (or a future step resolves automatically)

### Step 8.6 — Migration for New Job Type

**Create:** `supabase/migrations/20260XXX_041_add_blog_draft_job.sql`

```sql
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_type_check;
ALTER TABLE jobs ADD CONSTRAINT jobs_type_check CHECK (type IN (
  'curriculum_factory', 'research_batch', 'council_session', 'social_batch',
  'youtube_transcript', 'intel_fetch', 'brief_pregenerate', 'seed_extract',
  'context_condense', 'course_slide_images', 'generate_character_scenes',
  'train_character_lora', 'generate_segment_audio', 'generate_segment_video',
  'lesson_video_pipeline', 'generate_bundle_anchor',
  'youtube_batch_playlist', 'newsletter_draft',
  'blog_draft'
));
```

### CHUNK 8 — Done Criteria

- [ ] Editorial calendar page built and accessible from nav
- [ ] 52-week calendar view shows weeks with status badges
- [ ] Content ideas can be created, assigned to weeks, and managed via API
- [ ] Blog draft generation job produces quality blog posts
- [ ] Blog drafts land in Review Queue for approval
- [ ] Approved blogs publish to Shopify via Admin API
- [ ] Shopify publish triggers the existing webhook cascade (social + newsletter)
- [ ] Duplicate topic detection prevents near-identical blogs
- [ ] Minimum word count enforced
- [ ] No state-specific ESA claims in generated content

---
---

## CHUNK 9 — Phase 2 Track B: Content Cascade (Pinterest + Evergreen Recycling)

**Goal:** Add Pinterest pin generation from blog content, and build the evergreen content recycling system.

**Prerequisites:** CHUNK 8 complete.

**Bible references:** Section 3.2 (Content Cascade), D97

### Step 9.1 — Pinterest Integration Research

**Decision needed:** How to publish to Pinterest.
- Option A: Through Buffer (if Pinterest is supported on Buffer Essentials plan)
- Option B: Direct Pinterest API integration
- Option C: Manual for now, automated later

**If Buffer supports Pinterest:**
1. Add Pinterest channel in Buffer
2. Add `'pinterest'` to platform CHECK constraints (new migration)
3. Update generate route to support Pinterest pin format (image + description + link + board)
4. Pinterest pins derived from blog posts: take the hero image + blog title + excerpt + link

**If direct API:**
1. Pinterest API v5 (OAuth 2.0)
2. `POST /pins` — requires board_id, media_source (image URL), title, description, link
3. New route: `src/app/api/pinterest/publish/route.ts`

### Step 9.2 — Pinterest Content Type

**Migration:** Add `'pinterest'` to platform CHECK on `social_posts` (and `social_accounts` if using Buffer).

**Generate route changes:**
- Pinterest-specific prompt: short description (max 500 chars), keyword-rich, link to blog post
- Image: use the blog's hero image or generate a Pinterest-optimized image (2:3 aspect ratio, 1000×1500)
- Board selection: map brands to Pinterest boards

### Step 9.3 — Evergreen Content Recycling

**Concept:** Posts older than 90 days that performed well (high engagement) get recycled — regenerated with fresh text but same core message.

**Implementation:**

1. **Identification query:**
```sql
SELECT sp.* FROM social_posts sp
WHERE sp.status = 'published'
  AND sp.published_at < NOW() - INTERVAL '90 days'
  AND sp.is_recycled = false
  AND (sp.buffer_stats->>'likes')::int > 5  -- Adjust threshold
ORDER BY (sp.buffer_stats->>'likes')::int DESC
LIMIT 10;
```

2. **Recycling job:** `worker/src/jobs/content-recycle.ts`
   - Takes the original post's topic and brand
   - Generates a fresh variant (new text, same core message)
   - Creates new `social_posts` row with `is_recycled = true`, `original_post_id = <original>`
   - Lands in Review Queue

3. **Cron trigger:** Monthly recycling cron that identifies candidates and creates recycling jobs

4. **Migration:** Add `'content_recycle'` to jobs CHECK constraint

### Step 9.4 — Content Cascade Automation

**Update the blog webhook pipeline** to include Pinterest in the cascade:

```
Blog published on Shopify
  ├── social_batch job (existing — FB, IG, LinkedIn)
  ├── newsletter_draft job (existing)
  └── pinterest_batch job (NEW — generates Pinterest pins)
```

### CHUNK 9 — Done Criteria

- [ ] Pinterest integration working (via Buffer or direct API)
- [ ] Pinterest pins generate from blog content with correct format (2:3 image, description, link)
- [ ] Blog-first cascade includes Pinterest
- [ ] Evergreen recycling identifies high-performing old posts
- [ ] Recycled posts generate fresh copy and land in Review Queue
- [ ] `is_recycled` and `original_post_id` correctly track lineage
- [ ] Monthly recycling cron runs

---
---

## CHUNK 10 — Phase 2 Track C: Comment Moderation System

**Goal:** Build the comment moderation queue with AI classification, draft replies, and proper routing for different comment types.

**Prerequisites:** Phase 1 complete and stable. Can run in parallel with Track B chunks.

**Bible references:** Section 4.1 (Comment Moderation Taxonomy)

### Step 10.1 — Comment Moderation Schema

**Create:** `supabase/migrations/20260XXX_042_create_comments.sql`

```sql
CREATE TABLE IF NOT EXISTS social_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'linkedin')),
  brand TEXT NOT NULL CHECK (brand IN ('ncho', 'somersschool', 'scott_personal')),
  post_id UUID REFERENCES social_posts(id) ON DELETE SET NULL,
  external_comment_id TEXT,     -- Platform's native comment ID
  external_post_id TEXT,        -- Platform's native post ID
  author_name TEXT,
  author_profile_url TEXT,
  comment_text TEXT NOT NULL,
  comment_class TEXT NOT NULL DEFAULT 'unclassified' CHECK (comment_class IN (
    'spam', 'troll', 'legitimate_complaint', 'product_clarification',
    'curriculum_question', 'faith_question', 'praise', 'customer_service',
    'unclassified'
  )),
  ai_confidence FLOAT,         -- 0.0–1.0 classification confidence
  suggested_action TEXT CHECK (suggested_action IN (
    'auto_delete', 'delete_ignore', 'route_support', 'draft_reply',
    'human_only', 'draft_optional', 'unreviewed'
  )),
  draft_reply TEXT,             -- AI-generated reply draft
  actual_action TEXT,           -- What Scott actually did
  replied_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'handled', 'ignored', 'deleted')),
  received_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comments_user ON social_comments(user_id);
CREATE INDEX idx_comments_status ON social_comments(status);
CREATE INDEX idx_comments_class ON social_comments(comment_class);
CREATE INDEX idx_comments_post ON social_comments(post_id);

ALTER TABLE social_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner only" ON social_comments FOR ALL USING (auth.uid() = user_id);
ALTER PUBLICATION supabase_realtime ADD TABLE social_comments;
```

### Step 10.2 — Comment Classification Route

**Create:** `src/app/api/comments/classify/route.ts`

```
POST: Classifies a batch of comments

Input: { comments: [{ id, comment_text, platform, brand, context }] }

Pipeline (per comment):
1. Call Claude Haiku with the comment moderation taxonomy (Section 4.1):
   System: "Classify this social media comment. Return JSON: 
     { class: one of [spam, troll, legitimate_complaint, product_clarification,
       curriculum_question, faith_question, praise, customer_service],
       confidence: 0.0-1.0,
       suggested_action: one of [auto_delete, delete_ignore, route_support, 
         draft_reply, human_only, draft_optional],
       draft_reply: string or null }"
   
   Rules from bible Section 4.1:
   - spam/troll → auto_delete or delete_ignore
   - legitimate_complaint → route_support (NEVER delete)
   - product_clarification → draft_reply (Scott approves)
   - curriculum_question → draft_reply (Scott approves, never auto-reply)
   - faith_question → human_only (NEVER auto-reply)
   - praise → draft_optional
   - customer_service → route_support (email to support@nextchapterhomeschool.com)

2. Update social_comments row with classification results
3. If draft_reply suggested: generate a reply using brand voice for that brand
```

### Step 10.3 — Comment Moderation UI

**Create:** `src/app/comments/page.tsx` (or add as a tab in `/social`)

```
UI Layout:
- Filter tabs by comment_class (All, Spam, Complaints, Questions, Praise, etc.)
- Each comment card shows:
  - Comment text
  - Author name + profile link
  - Platform + brand badges
  - Classification badge (color-coded by class)
  - Confidence indicator
  - Suggested action
  - Draft reply (if generated) — editable
  - Action buttons: Reply, Ignore, Delete, Route to Support
- Bulk actions: Select multiple spam comments → bulk delete
- Supabase Realtime for live updates
```

### Step 10.4 — Comment Ingestion

**Note:** This requires platform API access to read comments. Each platform has different APIs:
- **Facebook:** Graph API `GET /{post-id}/comments`
- **Instagram:** Graph API `GET /{media-id}/comments`
- **LinkedIn:** Limited comment API access

**Create:** `src/app/api/comments/sync/route.ts` — pulls new comments from platforms
**Create:** A cron job that runs every 30 min to check for new comments

**If Buffer provides comment access:** Use Buffer's API instead of direct platform APIs.

### CHUNK 10 — Done Criteria

- [ ] `social_comments` table with full moderation taxonomy
- [ ] AI classification correctly routes comments by type
- [ ] Legitimate complaints and customer service issues are NEVER auto-deleted
- [ ] Faith/religion questions are flagged as human-only
- [ ] Draft replies follow correct brand voice
- [ ] Moderation UI allows review, reply, ignore, delete, and route to support
- [ ] Comment ingestion works for at least Facebook
- [ ] Bulk spam deletion works

---
---

## CHUNK 11 — Phase 2 Track C: DM Policy + Social Listening

**Goal:** Build automated DM acknowledgment, classification, and routing. Set up basic social listening for brand mentions.

**Prerequisites:** CHUNK 10 complete.

**Bible references:** Section 4.2 (DM Policy), Section 4.4 (Social Listening)

### Step 11.1 — DM Handling

**Schema:** Use `social_comments` table with a new `comment_type` distinction, OR create a separate `social_dms` table. Evaluate which is cleaner.

**DM Pipeline (Section 4.2):**
1. Ingest DMs via platform APIs (Facebook Messenger API, Instagram Direct API)
2. Auto-acknowledge within 24h: "Thanks for reaching out! We'll get back to you shortly."
3. Classify: customer_service → route to `support@nextchapterhomeschool.com`, inquiry → queue for Scott, spam → ignore
4. NEVER auto-answer curriculum capability questions (D66 pattern)
5. Queue for Scott's manual response

### Step 11.2 — Social Listening

**Scope (Section 4.4):** Basic untagged mention monitoring.

**Implementation options:**
- Option A: Buffer has mention tracking on Essentials plan
- Option B: Direct platform APIs for mention search
- Option C: Third-party social listening tool integration (Mention.com, Brand24) — evaluate cost vs. build

**Minimum viable:** 
- Track mentions of "NCHO", "Next Chapter Homeschool", "SomersSchool", "Scott Somers"
- Flag potential support situations or influencer engagement opportunities
- Queue for manual review
- NEVER auto-respond to untagged mentions

### CHUNK 11 — Done Criteria

- [ ] DM auto-acknowledgment within 24h
- [ ] DM classification and routing working
- [ ] Curriculum questions never auto-answered
- [ ] Social listening detects brand mentions
- [ ] Mentions flagged for manual review
- [ ] No auto-response to untagged mentions

---
---

## CHUNK 12 — Phase 3 Track D: Podcast CRM Foundation

**Goal:** Build the database model and basic CRUD for podcast outreach CRM. Research prospects, generate pitches, manage outreach pipeline.

**Prerequisites:** Tracks A+B+C stable. Dedicated outreach domain confirmed (OI-13).

**Bible references:** Part 5 (Track D), D106–D117

### Step 12.1 — Deliverability Prerequisites (HARD BLOCKER)

**Before writing ANY code for Track D, confirm these exist (Bible Section 5.2):**

1. **Dedicated outreach subdomain:** `pitch.nextchapterhomeschool.com` (or separate domain)
   - DNS configured with SPF, DKIM, DMARC records
   - NOT the same domain as customer-facing emails
   - This is a security/deliverability requirement — cold outreach from the main domain damages sender reputation

2. **Email sending service for outreach:** Separate from Brevo (customer email) and Resend (transactional)
   - Options: Amazon SES, SendGrid dedicated IP, or Brevo with separate IP
   - Must support throttling, bounce handling, and one-click unsubscribe

**Gate:** If these are not ready, stop here. Track D cannot proceed without deliverability infrastructure.

### Step 12.2 — Podcast CRM Schema

**Create:** `supabase/migrations/20260XXX_043_create_podcast_crm.sql`

```sql
-- Podcast shows we're targeting
CREATE TABLE IF NOT EXISTS podcast_shows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  show_name TEXT NOT NULL,
  host_name TEXT,
  host_email TEXT,
  show_url TEXT,
  rss_feed_url TEXT,
  apple_podcasts_url TEXT,
  spotify_url TEXT,
  description TEXT,
  audience_size_estimate TEXT,     -- "small", "medium", "large"
  audience_overlap_score FLOAT,    -- 0.0–1.0 relevance to our audience
  topics TEXT[],                   -- Topics the show covers
  guest_booking_url TEXT,          -- If show has a booking form
  status TEXT NOT NULL DEFAULT 'prospect' CHECK (status IN (
    'prospect', 'researching', 'pitch_ready', 'pitched', 
    'follow_up_1', 'follow_up_2', 'booked', 'appeared',
    'declined', 'no_response', 'archived'
  )),
  notes TEXT,
  last_episode_date DATE,
  reciprocal_flag BOOLEAN DEFAULT false,  -- D117: would benefit from appearing on Scott's show
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual outreach messages
CREATE TABLE IF NOT EXISTS podcast_outreach (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  show_id UUID NOT NULL REFERENCES podcast_shows(id) ON DELETE CASCADE,
  outreach_type TEXT NOT NULL CHECK (outreach_type IN ('initial_pitch', 'follow_up_1', 'follow_up_2')),
  subject TEXT NOT NULL,
  body_text TEXT NOT NULL,
  body_html TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'sent', 'bounced', 'replied')),
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,          -- If tracking pixel supported
  replied_at TIMESTAMPTZ,
  bounce_type TEXT,                -- 'hard' | 'soft'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS + indexes for both tables
ALTER TABLE podcast_shows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner only" ON podcast_shows FOR ALL USING (auth.uid() = user_id);
ALTER TABLE podcast_outreach ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner only" ON podcast_outreach FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_podcast_shows_status ON podcast_shows(status);
CREATE INDEX idx_podcast_outreach_show ON podcast_outreach(show_id);
CREATE INDEX idx_podcast_outreach_status ON podcast_outreach(status);

ALTER PUBLICATION supabase_realtime ADD TABLE podcast_shows;
ALTER PUBLICATION supabase_realtime ADD TABLE podcast_outreach;
```

### Step 12.3 — Podcast CRM CRUD Routes

**Create:**
1. `src/app/api/podcasts/route.ts` — GET (list with filters) + POST (create)
2. `src/app/api/podcasts/[id]/route.ts` — GET + PATCH + DELETE
3. `src/app/api/podcasts/[id]/outreach/route.ts` — GET outreach for this show + POST create pitch
4. `src/app/api/podcasts/research/route.ts` — POST: AI-powered prospect research (Tavily search for podcasts in niche)

### Step 12.4 — Prospect Research Job

**Create:** `worker/src/jobs/podcast-research.ts`

```
Job type: 'podcast_research' (add to CHECK constraint)

Input: { niche: "homeschool education", keywords: [...], max_results: 20 }

Pipeline:
1. Tavily search: "homeschool education podcast guest booking"
2. For each result: extract show name, host name, contact info, RSS feed
3. Claude Haiku: score audience overlap (0.0–1.0) and extract topics
4. Insert into podcast_shows with status: 'prospect'
5. Flag shows where Scott could also invite the host as guest (D117 reciprocal)
```

### Step 12.5 — Pitch Generation

**Create:** `src/app/api/podcasts/[id]/generate-pitch/route.ts`

```
POST: Generates a personalized pitch for a specific show

Pipeline:
1. Read the podcast_shows row
2. Claude Sonnet 4.6:
   System: "You are writing a personalized podcast guest pitch from Scott Somers.
            Scott is a middle school teacher in Glennallen, Alaska who built a 
            homeschool curriculum SaaS using AI. He reversed Type 2 diabetes 
            without medication (A1c 14.7 → 5.1). He is a deacon.
            CTAs: NCHO (primary), SomersSchool (secondary). D114.
            4 standard talking points (D112):
            1. Teaching in rural Alaska (65% Alaska Native students, Title 1)
            2. Building an education business using AI with zero coding background
            3. Reversing Type 2 diabetes through lifestyle changes
            4. Faith + entrepreneurship: building during a teaching career
            Personalize to THIS specific show — reference recent episodes and host's interests."
   User: "Show: <show_name>, Host: <host_name>, Topics: <topics>, Recent episodes: <if available>"
3. Generate subject line + personalized pitch body
4. Insert into podcast_outreach with status: 'draft'
5. Lands in Review Queue (all pitches require Scott's approval before send)
```

### Step 12.6 — Podcast CRM UI

**Create:** `src/app/podcasts/page.tsx`

```
UI Layout:
- Pipeline view (kanban or table): Prospect → Researching → Pitch Ready → Pitched → Follow-up → Booked → Appeared
- Show detail drawer: name, host, contact, topics, overlap score, reciprocal flag, notes
- Outreach thread: all messages to this show, with status badges
- "Research New Shows" button → triggers research job
- "Generate Pitch" button on each show card → generates personalized pitch
- Pitch editor → edit before approving → "Send" button (goes to outreach queue)
- Stats: total prospects, pitches sent, response rate, bookings
```

### CHUNK 12 — Done Criteria

- [ ] Deliverability prerequisites confirmed (dedicated domain, SPF/DKIM/DMARC)
- [ ] `podcast_shows` and `podcast_outreach` tables created
- [ ] CRUD routes working for both tables
- [ ] AI prospect research finds relevant shows
- [ ] Personalized pitches generate with correct talking points
- [ ] All pitches go through approval queue (never auto-send)
- [ ] CRM UI shows pipeline view
- [ ] Reciprocal flag (D117) correctly identifies potential mutual guests

---
---

## CHUNK 13 — Phase 3 Track D: Outreach Sequences + Deliverability

**Goal:** Build the full outreach sequence engine with follow-ups, bounce handling, throttling, and compliance.

**Prerequisites:** CHUNK 12 complete. Dedicated outreach domain live with SPF/DKIM/DMARC.

**Bible references:** Section 5.2 (Deliverability)

### Step 13.1 — Email Sending Infrastructure

**Create:** `worker/src/lib/outreach-email.ts`

```
Functions:
1. sendOutreachEmail(to, subject, htmlBody, textBody):
   - Send via dedicated outreach email service (SES, SendGrid, etc.)
   - Include one-click unsubscribe header (CAN-SPAM/GDPR)
   - Include physical mailing address in footer
   - Track send event

2. Daily send throttle:
   - Week 1: max 10 emails/day
   - Week 2: max 25 emails/day
   - Week 3+: max 50 emails/day
   - Track via Redis counter or Supabase
   - Never exceed limit — queue excess for next day

3. Bounce handling:
   - Hard bounce → update podcast_outreach status = 'bounced', bounce_type = 'hard'
   - Hard bounce → update podcast_shows status = 'no_response'
   - Hard bounce → NEVER send to this email again
   - Soft bounce → retry once, then mark as 'bounced' with bounce_type = 'soft'
```

### Step 13.2 — Follow-up Sequence

**Rules (Bible Section 5.2):**
- Max 2 follow-ups per prospect (hard stop)
- Follow-up 1: 5 business days after initial pitch (if no reply)
- Follow-up 2: 10 business days after follow-up 1 (if no reply)
- After follow-up 2 with no reply: status → 'no_response', archived

**Create:** `worker/src/jobs/podcast-followup.ts`

```
Job type: 'podcast_followup'
Cron: Daily at 10:00 UTC

Pipeline:
1. Query podcast_outreach for pitches where:
   - status = 'sent'
   - sent_at < NOW() - INTERVAL '5 days' (for follow_up_1)
   - No existing follow_up_1 for this show
2. For each: generate follow-up using Claude (shorter, reference the original pitch)
3. Insert as outreach_type = 'follow_up_1', status = 'draft'
4. Lands in approval queue

Same logic for follow_up_2 (10 days after follow_up_1).
After follow_up_2 ages out: auto-archive the show.
```

### Step 13.3 — Outreach Approval Queue

**Extend:** the existing Review Queue in `/social` (or create a dedicated outreach queue in `/podcasts`)

```
Outreach queue shows:
- Show name
- Outreach type (initial / follow-up 1 / follow-up 2)
- Subject line (editable)
- Body preview (editable)
- Recipient email
- "Approve & Send" button
- "Edit" button
- "Skip" button (delays the follow-up)
- "Cancel" button (stops outreach to this show)
```

### Step 13.4 — Compliance

**Implementation:**
1. Every outreach email includes:
   - One-click unsubscribe link (List-Unsubscribe header)
   - Physical mailing address in footer
   - Clear identification of who is sending
2. Unsubscribe webhook → immediately marks show as 'declined', stops all future outreach
3. Maintain `outreach_suppressions` list — emails that have opted out or hard bounced

### Step 13.5 — Analytics Dashboard

**Add to podcast CRM UI:**
- Emails sent this week / this month
- Response rate (replied / sent)
- Booking rate (booked / pitched)
- Bounce rate
- Average time to response
- Pipeline conversion funnel visualization

### CHUNK 13 — Done Criteria

- [ ] Outreach emails send via dedicated domain (not main NCHO domain)
- [ ] Send throttling enforced (ramp from 10/day to 50/day)
- [ ] Hard bounces permanently suppress the email
- [ ] Follow-up sequences fire at 5 and 10 business day intervals
- [ ] Max 2 follow-ups per prospect (hard stop)
- [ ] All outreach requires Scott's approval before sending
- [ ] One-click unsubscribe in every email
- [ ] Unsubscribe immediately stops all future outreach
- [ ] Analytics dashboard shows key metrics
- [ ] CAN-SPAM/GDPR compliance verified

---
---

## CROSS-CHUNK REFERENCE: KEY DECISIONS

These decisions from the build bible apply to ALL chunks:

| Decision | What | Applies To |
|---|---|---|
| D49 | 3 posts/week/brand baseline | All social generation |
| D97 | Blog is content hub — social + newsletter derive from it | Chunks 2, 8, 9 |
| D119 | Phase 1 = full scope (blog + newsletter + YouTube + all social) | Chunks 0-4 |
| D121 | AI disclosure: `[AI]` prefix + Cloudinary badge | All generated content |
| D122 | Edit-to-learn auto-updates (not suggest) | Chunk 4 |
| D124 | Buffer Essentials plan ($5/ch/mo — 5–6ch = $300–360/yr; 9ch = $540/yr) | Chunk 0 |
| D131 | Anna no separate Buffer login; Essentials confirmed over Team | Chunk 0 |
| D126 | 52-week editorial calendar backbone | Chunk 8 |
| D127 | Blog-first: social derives from published blog | Chunks 2, 8 |
| D128 | Newsletter never auto-sends | Chunks 3, 8 |
| D129 | `user_id NOT NULL` on all tables | All migrations |
| D130 | Edit-to-learn writes `platform_hints[platform]` only | Chunk 4 |

---

## CROSS-CHUNK REFERENCE: CRITICAL INVARIANTS

1. **Nothing auto-publishes.** Every piece of content passes through the Review Queue.
2. **Blog is source of truth.** Social posts derive from published blogs. Never generate social content independently (except the weekly cron top-up).
3. **Buffer GraphQL only.** The old REST API is dead. `api.buffer.com` GraphQL endpoint only.
4. **Brand wall:** Alana Terry / PCW / christianbooks.today are completely separate. Never cross-promote.
5. **Secular only for SomersSchool.** Alaska Statute 14.03.320. Zero faith language.
6. **"Your child" not "your student."** In ALL NCHO and SomersSchool copy.
7. **Legitimate complaints are NEVER deleted.** Customer service issues route to `support@nextchapterhomeschool.com`.
8. **Track D outreach uses a dedicated domain.** Never send cold outreach from the customer-facing domain.
9. **ESA/allotment claims must trace to verified source data.** Never hallucinate state-specific claims.

---

## CROSS-CHUNK REFERENCE: FILE LOCATIONS

| What | Where |
|---|---|
| Social generate route | `src/app/api/social/generate/route.ts` |
| Social approve route | `src/app/api/social/posts/[id]/approve/route.ts` |
| Social accounts route | `src/app/api/social/accounts/route.ts` |
| Review queue component | `src/components/social-review-queue.tsx` |
| Blog webhook route | `src/app/api/webhooks/shopify-blog-post/route.ts` |
| Product webhook route | `src/app/api/webhooks/shopify-product/route.ts` |
| Newsletter draft worker | `worker/src/jobs/newsletter-draft.ts` |
| YouTube batch worker (stub) | Router case in `worker/src/jobs/router.ts` |
| Weekly social cron | `src/app/api/cron/social-weekly/route.ts` |
| Brand voices table | `brand_voices` in Supabase |
| Social posts table | `social_posts` in Supabase |
| Social accounts table | `social_accounts` in Supabase |
| Settings table | `settings` in Supabase |
| Jobs table | `jobs` in Supabase |
| Build bible | `social-media-expansion-build-bible.md` |
| Navigation config | `src/lib/navigation.ts` |
| Supabase server helper | `src/lib/supabase-server.ts` |

---

*End of Social Media Expansion Execution Plan — 14 chunks covering Smoke Test through Phase 3.*
*Copy one chunk per Opus chat session. Execute sequentially. Trust the bible.*
