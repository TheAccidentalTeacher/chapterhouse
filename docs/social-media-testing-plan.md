# Social Media System — Testing Plan

> **Created:** Session 41 (current)
> **Scope:** End-to-end validation of the Chapterhouse social media automation system
> **Prereq:** Commit `ee96602` deployed to Vercel. `BUFFER_ACCESS_TOKEN` confirmed in Vercel env vars.

---

## Prerequisites — Before You Start

### Env Vars (verify at `/settings`)

Open Chapterhouse → Settings. Confirm these show **green** in the environment panel:

| Var | Group | Required For |
|---|---|---|
| `BUFFER_ACCESS_TOKEN` | social | Sync, approve, analytics, publish-check |
| `ANTHROPIC_API_KEY` | ai | AI content generation |
| `CRON_SECRET` | system | Weekly cron, publish-check cron |
| `QSTASH_TOKEN` | jobs | Weekly cron, Shopify webhook dispatch |
| `RAILWAY_WORKER_URL` | jobs | Weekly cron, Shopify webhook dispatch |
| `SHOPIFY_WEBHOOK_SECRET` | social | Shopify product webhook verification |

**If any are red/missing:** Add them in Vercel → Settings → Environment Variables → redeploy.

### Supabase Tables (verify in Supabase Dashboard)

Open Supabase Dashboard → Table Editor. Confirm these tables exist:

- [ ] `social_accounts` — should have columns: id, brand, platform, buffer_profile_id, display_name, is_active
- [ ] `social_posts` — should have columns: id, job_id, brand, platform, post_text, hashtags, status, scheduled_for, buffer_profile_id, buffer_update_id, published_at, buffer_stats, edit_history, image_brief, generation_prompt
- [ ] `brand_voices` — should have columns: id, brand, display_name, audience, tone, rules, forbidden_words, platform_hints, full_voice_prompt
- [ ] `jobs` — should exist (used by weekly cron + Shopify webhook)

### Buffer Account

- [ ] Log into [Buffer](https://buffer.com) with `accidentalakteacher` account
- [ ] Confirm 6 channels are connected:

| Buffer Channel | Platform | Brand Mapping | Notes |
|---|---|---|---|
| ncho.somerschool | Instagram | `ncho` + `instagram` | **Also mapped to `somersschool` + `instagram`** (shared account) |
| Next Chapter Hom... | Facebook (Page) | `ncho` + `facebook` | |
| nextchapterhomes... | Pinterest | `ncho` + `pinterest` | |
| The Accidental Te... | Facebook (Group) | `scott_personal` + `facebook` | |
| scosom2280 | Pinterest | `somersschool` + `pinterest` | |
| TheAccidentalTea... | YouTube | `scott_personal` + `youtube` | Publish/Community/Analytics |

- [ ] Note: Buffer Essentials plan = 6 physical channels, but 7 Chapterhouse mappings (Instagram is dual-mapped to ncho + somersschool)

---

## Phase 1 — Account Management

### Test 1.1: Sync Channels from Buffer

**Where:** `/social` → **Accounts** tab

1. Click **"Sync from Buffer"** button
2. **Expected:** Loading spinner appears → channel list populates from Buffer
3. **Verify:** You see your connected Buffer channels listed (name, service icon, avatar)
4. **If error:** Check browser console for 503 (missing `BUFFER_ACCESS_TOKEN`) or 500 (Buffer API issue)

**Result:** ☐ Pass ☐ Fail — Notes: _______________

### Test 1.2: Map a Channel to a Brand

**Where:** `/social` → **Accounts** tab → Add Account form

1. Select a brand (e.g., `ncho`)
2. Select a platform (e.g., `facebook`)
3. Select the matching Buffer channel from the dropdown (populated by sync)
4. Enter a display name (e.g., "NCHO Facebook Page")
5. Click **Save**
6. **Expected:** Account appears in the active accounts list below
7. **Verify in Supabase:** `social_accounts` table has a new row with correct brand, platform, buffer_profile_id

**Map all 7 brand+platform combos (6 physical channels, 1 shared):**
- [ ] `ncho` → `facebook` → "Next Chapter Hom..." channel
- [ ] `ncho` → `instagram` → "ncho.somerschool" channel
- [ ] `ncho` → `pinterest` → "nextchapterhomes..." channel
- [ ] `somersschool` → `instagram` → "ncho.somerschool" channel *(same buffer_profile_id as ncho instagram)*
- [ ] `somersschool` → `pinterest` → "scosom2280" channel
- [ ] `scott_personal` → `facebook` → "The Accidental Te..." channel *(Facebook Group)*
- [ ] `scott_personal` → `youtube` → "TheAccidentalTea..." channel

> **Note:** The Instagram channel is shared — after syncing from Buffer, you'll need to manually add the second `somersschool` + `instagram` row pointing to the same `buffer_profile_id` as the `ncho` + `instagram` row.

**Result:** ☐ Pass ☐ Fail — Notes: _______________

### Test 1.3: Delete an Account

1. Click the delete/remove button on any mapped account
2. **Expected:** Account removed from list
3. **Verify in Supabase:** Row deleted from `social_accounts`
4. Re-add the account after confirming delete works

**Result:** ☐ Pass ☐ Fail — Notes: _______________

---

## Phase 2 — Brand Voices

### Test 2.1: View Brand Voices

**Where:** `/settings` → Brand Voices panel (scroll down)

1. **Expected:** You see brand voice cards for existing brands
2. Verify `scott_personal` voice exists (added in commit `ee96602`)
3. If no voices exist yet, proceed to Test 2.2 to create them

**Result:** ☐ Pass ☐ Fail — Notes: _______________

### Test 2.2: Create a Brand Voice

**Where:** `/settings` → Brand Voices panel → Add/Create button

1. Create a voice for `ncho`:
   - Brand: `ncho`
   - Display name: "NCHO — Next Chapter Homeschool Outpost"
   - Audience: "Homeschool moms (30-45), faith-adjacent, overwhelmed by choices"
   - Tone: "Warm, teacher-curated, convicted"
   - Rules: "Always say 'your child' not 'your student'. Lead with the child, convert with practical."
   - Forbidden words: explore, journey, leverage, synergy
   - Full voice prompt: (paste the complete brand voice prompt)
2. Click Save
3. **Expected:** Voice appears in the panel
4. **Verify in Supabase:** `brand_voices` table has new row

**Repeat for:**
- [ ] `ncho`
- [ ] `somersschool`
- [ ] `scott_personal`

**Result:** ☐ Pass ☐ Fail — Notes: _______________

### Test 2.3: Edit a Brand Voice

1. Click edit on any brand voice
2. Change one field (e.g., add a forbidden word)
3. Save
4. **Expected:** Updated in UI
5. **Verify in Supabase:** Row updated

**Result:** ☐ Pass ☐ Fail — Notes: _______________

### Test 2.4: Delete a Brand Voice

1. Click delete on a test brand voice
2. **Expected:** Removed from panel
3. **Verify in Supabase:** Row deleted
4. Re-create if needed for later tests

**Result:** ☐ Pass ☐ Fail — Notes: _______________

---

## Phase 3 — Content Generation

> **⚠️ This uses Claude API credits.** Each generation costs ~$0.01–0.03. Generate small batches for testing.

### Test 3.1: Generate Posts — Single Brand, Single Platform

**Where:** `/social` → **Generate** tab

1. Select **one** brand: `ncho`
2. Select **one** platform: `facebook`
3. Set count: **1**
4. Leave topic seed empty
5. Click **Generate**
6. **Expected:**
   - Loading state shows while Claude generates
   - Tab auto-switches to Review Queue when done
   - 1 new post card appears with status `pending_review`
7. **Verify post card shows:**
   - NCHO brand badge
   - Facebook platform badge
   - Post text (should follow NCHO voice rules — "your child" language, warm tone)
   - Hashtags
   - Image brief

**Result:** ☐ Pass ☐ Fail — Notes: _______________

### Test 3.2: Generate Posts — With Topic Seed

1. Go back to Generate tab
2. Select `somersschool` + `instagram`
3. Count: **1**
4. Topic seed: "back to school tips for homeschool families"
5. Generate
6. **Expected:** Generated post content relates to the topic seed
7. **Verify:** Post text references back-to-school / homeschool tips

**Result:** ☐ Pass ☐ Fail — Notes: _______________

### Test 3.3: Generate Posts — Multi-Brand Multi-Platform

1. Select both `ncho` AND `somersschool`
2. Select `facebook` AND `instagram`
3. Count: **1** per combo
4. Generate
5. **Expected:** 4 posts created (2 brands × 2 platforms × 1 each)
6. **Verify in Review Queue:** 4 new posts, each with correct brand/platform badges

> **Tip:** Both ncho and somersschool Instagram posts will route to the same physical Instagram account (ncho.somerschool) — that's by design.

**Result:** ☐ Pass ☐ Fail — Notes: _______________

### Test 3.4: Verify Brand Voice Differentiation

1. Compare the NCHO post vs the SomersSchool post from Test 3.3
2. **NCHO should:** Use "your child", warm teacher voice, faith-adjacent
3. **SomersSchool should:** Be secular, confident, progress-focused, zero faith language
4. **If both sound the same:** Brand voice injection from `brand_voices` table may not be working

**Result:** ☐ Pass ☐ Fail — Notes: _______________

---

## Phase 4 — Review Queue

### Test 4.1: View Pending Posts

**Where:** `/social` → **Review Queue** tab (default)

1. **Expected:** All posts with status `pending_review` appear as cards
2. Cards should show: brand badge, platform badge, post text, hashtags, image brief
3. Each card should have: Edit, Approve, Reject buttons

**Result:** ☐ Pass ☐ Fail — Notes: _______________

### Test 4.2: Edit a Post

1. Click the **edit** button on any pending post
2. Change the post text (add something recognizable like "EDITED FOR TEST")
3. Save the edit
4. **Expected:** Post text updates in the card
5. **Verify in Supabase:** `social_posts` row shows updated `post_text` AND `edit_history` array has the previous version saved

**Result:** ☐ Pass ☐ Fail — Notes: _______________

### Test 4.3: Reject a Post

1. Click **Reject** on a post you don't want to publish
2. **Expected:** Post disappears from Review Queue
3. **Verify in Supabase:** Post status changed to `rejected` (soft delete — row still exists)

**Result:** ☐ Pass ☐ Fail — Notes: _______________

### Test 4.4: Approve and Schedule a Post

> **⚠️ This WILL schedule a real post to Buffer.** Use a test post or be ready to delete it from Buffer.

1. Pick a post you're comfortable publishing (or will delete from Buffer after)
2. Click **Approve**
3. In the approval form:
   - Select a **scheduled date/time** (set it 2+ hours in the future to give you time to inspect)
   - Select the matching **Buffer channel** from the dropdown
4. Confirm approval
5. **Expected:**
   - Post status changes to `scheduled`
   - Post shows the scheduled date/time
   - Post disappears from "pending" view (or shows as scheduled if filtered)
6. **Verify in Supabase:**
   - `social_posts` row: `status = 'scheduled'`, `scheduled_for` set, `buffer_profile_id` set, `buffer_update_id` populated (Buffer's post ID)
7. **Verify in Buffer:**
   - Open Buffer → Queue → find the scheduled post
   - Confirm text matches, scheduled time matches

**Result:** ☐ Pass ☐ Fail — Notes: _______________

### Test 4.5: Cancel a Scheduled Post (in Buffer)

If you need to prevent the test post from actually publishing:

1. Go to Buffer → Queue
2. Find the test post
3. Delete it from Buffer's queue
4. **Note:** The `social_posts` row in Supabase will still say `scheduled`. The publish-check cron (Test 6.1) will eventually mark it `failed` when it can't find the post in Buffer. This is expected behavior.

---

## Phase 5 — Post Lifecycle Verification

### Test 5.1: Check Post Status Transitions

Review the Supabase `social_posts` table and verify the following statuses exist from your tests:

- [ ] At least one row with `status = 'pending_review'`
- [ ] At least one row with `status = 'rejected'`
- [ ] At least one row with `status = 'scheduled'` (with `buffer_update_id`)

**Result:** ☐ Pass ☐ Fail — Notes: _______________

### Test 5.2: Verify Edit History

1. Find the post you edited in Test 4.2
2. In Supabase, check the `edit_history` column
3. **Expected:** JSON array with at least one entry containing `saved_at` and `post_text` (the original text before your edit)

**Result:** ☐ Pass ☐ Fail — Notes: _______________

---

## Phase 6 — Cron Jobs

### Test 6.1: Publish-Check Cron (every 15 minutes)

> This cron checks scheduled posts whose `scheduled_for` has passed and verifies their Buffer status.

**Option A — Wait for natural trigger:**
1. If a post was approved and scheduled for a past time, wait up to 15 minutes
2. Check Supabase `social_posts` — the post should transition from `scheduled` to `published` (if Buffer sent it) or stay `scheduled` (if Buffer hasn't sent yet)

**Option B — Manual trigger:**
1. In a terminal or browser, hit: `GET https://your-app.vercel.app/api/cron/social-publish-check` with header `Authorization: Bearer YOUR_CRON_SECRET`
2. **Expected response:** `{ checked: N, published: N, failed: N }`

**Result:** ☐ Pass ☐ Fail — Notes: _______________

### Test 6.2: Weekly Cron (Monday 05:00 UTC)

> **⚠️ This creates a QStash job that dispatches to Railway → generates 16 posts. Only trigger if you want a full batch.**

**Option A — Wait for Monday morning:**
- The cron fires automatically at Monday 05:00 UTC (Sunday 9 PM Alaska)
- After it fires, check `/jobs` for a new `social_batch` job
- Check Review Queue for ~16 new posts (2 brands × 4 platforms × 2 each)

**Option B — Manual trigger (careful):**
1. Hit: `GET https://your-app.vercel.app/api/cron/social-weekly` with header `Authorization: Bearer YOUR_CRON_SECRET`
2. **Expected:** Creates a `social_batch` job in Supabase `jobs` table
3. QStash dispatches to Railway worker
4. Worker calls back to `/api/social/generate` on Chapterhouse
5. Posts appear in Review Queue within 1–3 minutes

**Verify:**
- [ ] `jobs` table has new row with type `social_batch`, status progresses from `queued` → `running` → `completed`
- [ ] Review Queue shows new posts for `ncho` (facebook, instagram, pinterest), `somersschool` (instagram, pinterest), and `scott_personal` (facebook, youtube)
- [ ] Posts are NOT auto-published (all should be `pending_review`)
- [ ] Post count should be ~14 (3 brands × varying platforms × 2 each)

**Result:** ☐ Pass ☐ Fail — Notes: _______________

---

## Phase 7 — Shopify Webhook

> **⚠️ This requires either a real Shopify product creation or a manual webhook simulation.**

### Test 7.1: Simulate Shopify Webhook

The Shopify webhook fires when Anna adds a new product to the NCHO store. To test without adding a real product:

**Option A — Add a test product in Shopify:**
1. In the NCHO Shopify admin, create a draft product (title: "TEST PRODUCT — DELETE ME")
2. Publish it
3. **Expected:** Shopify sends a `products/create` webhook to Chapterhouse
4. Check `/jobs` for a new `social_batch` job with topic_seed containing "TEST PRODUCT"
5. Check Review Queue for 9 new NCHO posts (facebook + instagram + pinterest × 3 each)
6. Delete the test product from Shopify after

**Option B — Skip for now:**
If you don't want to touch Shopify, mark this as "deferred" and test when Anna adds the next real product.

**Verify (if triggered):**
- [ ] HMAC signature verification passes (no 401 error in Vercel logs)
- [ ] Job created with `brands: ['ncho']`, `platforms: ['facebook', 'instagram', 'pinterest']`
- [ ] Generated posts reference the product title

**Result:** ☐ Pass ☐ Fail ☐ Deferred — Notes: _______________

---

## Phase 8 — Analytics Pull-Back

### Test 8.1: Pull Analytics for Published Posts

> **Requires at least one post that has actually been published through Buffer.**

1. If you have any posts with status `published` and a `buffer_update_id`:
   - Hit `POST /api/social/analytics` (no body needed) via browser console or API tool
   - **Expected response:** `{ updated: N, failed: N, errors: [] }`
2. **Verify in Supabase:** `social_posts` rows with `buffer_stats` JSONB populated (reach, clicks, likes, comments, shares)

**If no published posts yet:** Skip and return after a post has been published by Buffer.

**Result:** ☐ Pass ☐ Fail ☐ Deferred — Notes: _______________

---

## Phase 9 — Edge Cases & Error Handling

### Test 9.1: Generate with No Brand Voices in DB

1. Temporarily delete all rows from `brand_voices` table in Supabase
2. Go to Generate tab → select `ncho` + `facebook` → count 1 → Generate
3. **Expected:** Generation still works — falls back to `BRAND_VOICE_FALLBACK` hardcoded constant
4. **Verify:** Post text is generated (may not perfectly match NCHO voice without DB voice)
5. Re-insert your brand voices after this test

**Result:** ☐ Pass ☐ Fail — Notes: _______________

### Test 9.2: Approve with No Buffer Token

1. In Vercel, temporarily remove `BUFFER_ACCESS_TOKEN` (or test locally without it set)
2. Try to approve a post
3. **Expected:** 503 error with message about missing Buffer token
4. **Verify:** Post status remains `pending_review` — not corrupted
5. Re-add the token after testing

**Result:** ☐ Pass ☐ Fail ☐ Skip — Notes: _______________

### Test 9.3: Generate with Invalid Brand

1. Via browser console or API tool, POST to `/api/social/generate` with `brands: ["invalid_brand"]`
2. **Expected:** 400 error from Zod validation

**Result:** ☐ Pass ☐ Fail — Notes: _______________

---

## Phase 10 — UI Polish Verification

### Test 10.1: Social Page Help Link

1. On the `/social` page, find the help link (should link to `/social/help` or `/help`)
2. Click it
3. **Expected:** Opens help page with social media system documentation

**Result:** ☐ Pass ☐ Fail — Notes: _______________

### Test 10.2: Settings Page — Social Env Vars

1. Go to `/settings`
2. Scroll to environment status panel
3. **Expected:** `BUFFER_ACCESS_TOKEN` and `SHOPIFY_WEBHOOK_SECRET` appear in the "social" group with green status indicators

**Result:** ☐ Pass ☐ Fail — Notes: _______________

### Test 10.3: Tab Navigation

1. On `/social`, click through all three tabs: Review Queue → Generate → Accounts
2. **Expected:** Each tab loads its content without errors
3. **Verify:** No blank screens, no console errors

**Result:** ☐ Pass ☐ Fail — Notes: _______________

### Test 10.4: Responsive Layout

1. Open `/social` on a narrower window (squeeze to ~768px)
2. **Expected:** Cards stack vertically, buttons remain clickable, text doesn't overflow

**Result:** ☐ Pass ☐ Fail — Notes: _______________

---

## Results Summary

| Phase | Test | Result |
|---|---|---|
| 1 — Accounts | 1.1 Sync channels | ☐ |
| 1 — Accounts | 1.2 Map channels | ☐ |
| 1 — Accounts | 1.3 Delete account | ☐ |
| 2 — Brand Voices | 2.1 View voices | ☐ |
| 2 — Brand Voices | 2.2 Create voice | ☐ |
| 2 — Brand Voices | 2.3 Edit voice | ☐ |
| 2 — Brand Voices | 2.4 Delete voice | ☐ |
| 3 — Generation | 3.1 Single brand/platform | ☐ |
| 3 — Generation | 3.2 With topic seed | ☐ |
| 3 — Generation | 3.3 Multi-brand multi-platform | ☐ |
| 3 — Generation | 3.4 Voice differentiation | ☐ |
| 4 — Review Queue | 4.1 View pending | ☐ |
| 4 — Review Queue | 4.2 Edit a post | ☐ |
| 4 — Review Queue | 4.3 Reject a post | ☐ |
| 4 — Review Queue | 4.4 Approve + schedule | ☐ |
| 5 — Lifecycle | 5.1 Status transitions | ☐ |
| 5 — Lifecycle | 5.2 Edit history | ☐ |
| 6 — Crons | 6.1 Publish-check | ☐ |
| 6 — Crons | 6.2 Weekly cron | ☐ |
| 7 — Shopify | 7.1 Webhook | ☐ |
| 8 — Analytics | 8.1 Pull stats | ☐ |
| 9 — Edge Cases | 9.1 No brand voices | ☐ |
| 9 — Edge Cases | 9.2 No Buffer token | ☐ |
| 9 — Edge Cases | 9.3 Invalid brand | ☐ |
| 10 — UI | 10.1 Help link | ☐ |
| 10 — UI | 10.2 Settings env vars | ☐ |
| 10 — UI | 10.3 Tab navigation | ☐ |
| 10 — UI | 10.4 Responsive layout | ☐ |

---

## Recommended Test Order

1. **Phase 1 first** — you need accounts mapped before anything else works
2. **Phase 2** — brand voices feed into generation quality
3. **Phase 3** — generates content for all remaining tests
4. **Phase 4** — tests the core workflow (review → approve → schedule)
5. **Phase 6.1** — verify the publish-check cron picks up scheduled posts
6. **Phase 5** — verify lifecycle states in Supabase
7. **Phase 10** — quick UI checks throughout
8. **Phase 8** — only after a post has actually published
9. **Phase 6.2** — only when you want a full batch generated
10. **Phase 7** — only when convenient with Shopify
11. **Phase 9** — edge cases last (destructive tests)

---

## Known Limitations

1. **Buffer Essentials = 6 physical channels.** 7 Chapterhouse mappings fit because Instagram is dual-mapped (ncho + somersschool → same channel). Adding a new physical channel (e.g., LinkedIn, TikTok) requires a Buffer plan upgrade.
2. **Shared Instagram account.** Both `ncho` and `somersschool` posts route to "ncho.somerschool" Instagram. Brand voice differentiation in post copy is critical — the account itself won't distinguish them.
3. **`alana_terry` brand** is in the UI labels but excluded from the weekly cron and Shopify webhook. Generate manually if needed.
4. **Instagram type metadata** sends `type: "image"` even for text-only posts. Buffer may require an image URL for Instagram — monitor for errors.
5. **YouTube posts via Buffer** — verify Buffer supports the post format for YouTube (may be Community posts, not video uploads). If Buffer can't post to YouTube Community, the `scott_personal` + `youtube` mapping is cosmetic only.
6. **Facebook Group vs Page** — "The Accidental Te..." is a Facebook Group, not a Page. Buffer Group posting may have different permissions/limitations than Page posting.
7. **Analytics** requires posts to have actually been published and have had enough time to accumulate stats.
8. **Shopify webhook** requires the webhook to be configured in Shopify Admin → Settings → Notifications → Webhooks pointing at `https://your-app.vercel.app/api/webhooks/shopify-product`.

---

*Last updated: Session 41*
