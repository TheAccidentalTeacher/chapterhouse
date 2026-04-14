# Social Media Expansion — Build Bible

**Source documents:** `social-media-expansion-brainstorm.md` (D1–D117) + `social-media-expansion-opus-analysis.md`
**Status:** PHASE 1 COMPLETE — code deployed, migrations 033 + 035 + 037 applied (April 2026). ⚠️ BEFORE SMOKE TEST: (1) Deploy to Vercel + Railway, (2) Upgrade Buffer to Essentials plan (D124/D131 — Scott manual action), (3) Register Shopify blog webhook in Shopify dashboard, (4) Set BREVO_API_KEY in Railway env.
**Date:** April 2026
**What the brainstorm is now:** Discovery ledger and history. This document is the build truth.

---

## BOTTOM LINE UP FRONT

The brainstorm produced excellent strategic thinking but is not yet buildable as-is. It conflates five separate project domains, contains nine active contradictions, and lacks a clear Phase 1 boundary. This document resolves every contradiction, proposes answers to all blocking open items, and organizes everything into four canonical build tracks with Phase 1 as the only current work target.

**Track A — Social Publishing Core** is Phase 1. Tracks B, C, and D are explicitly deferred until Track A is proven.

If anything in this document contradicts the brainstorm, this document wins.

---

## PART 1 — ARCHITECTURE

### 1.1 Four-Track Model

The brainstorm conflated five different systems. They are now separated into four canonical tracks with distinct scopes, build phases, and data surfaces.

| Track | Name | Phase | What It Is |
|---|---|---|---|
| **A** | Social Publishing Core | Phase 1 | Generate → Review → Schedule → Publish. Brand voice by platform. Calendar. Image pipeline. Analytics. |
| **B** | Content Engine | Phase 2 | Hub-and-spoke cascade from published blog posts, Pinterest derivation, evergreen recycling, content entity model migration. Note: Blog generation, Shopify publishing, and newsletter are Phase 1 (D119, D126–D128). |
| **C** | Community & Listening | Phase 2 | Comment moderation, DM acknowledgment, Facebook Groups opportunity surfacing, social listening for untagged mentions. |
| **D** | Podcast Outreach CRM | Phase 3 | Prospect research, pitch generation, outbound queue, deliverability architecture, CRM, appearance tracking. |

**Rule:** Do not add Track B, C, or D capability to the existing `/social` feature. The `/social` page is Track A only. Tracks B–D get dedicated routes when their phases begin.

### 1.2 Phase Sequencing

```
Phase 1 (NOW)       Track A — Social Publishing Core
                    Platforms: Facebook, Instagram, LinkedIn (Threads DROPPED — D118)
                    Brands: NCHO, SomersSchool, Scott Personal
                    Architecture: Blog-first — 52-week calendar → topic → blog → social + newsletter (D126, D127, D128)
                    Also Phase 1: Blog + Newsletter + YouTube batch playlists (D119, D120)

Phase 2 (after A is proven)    Track B — Content Engine (cascade/Pinterest/evergreen) + Track C — Community & Listening

Phase 3 (after B+C stable)     Track D — Podcast Outreach CRM
```

Phase 1 is complete when (LOCKED — D119, D126, D127, D128):
- 52-week editorial calendar locked in advance — topic seeds for full year before pipeline runs (D126)
- A full week of posts has been approved, scheduled, AND published on time — no manual Buffer navigation
- All three brands live: NCHO, SomersSchool, Scott Personal
- All three social platforms live: Facebook, Instagram, LinkedIn
- Blog-first pipeline working: weekly topic → 3 blog posts → Shopify publish → auto-triggers social generation → review queue (D127)
- Newsletter auto-generates when blog publishes → lands in review queue → Scott reads, edits, sends. Never auto-sends (D128)
- YouTube batch playlist generation working via separate trigger button (50+ videos, 2–3 min HeyGen talking head — NOT part of weekly cron) — ⚠️ *job contract not yet fully specified; see Section 6.5 before sprint begins*
- Image pipeline live: Cloudinary corner badge + `[AI]` caption prefix on all AI-generated assets (D121)
- UTM tagging active on all published posts
- Edit-to-learn voice loop running, auto-updating brand_voices source of truth (D122)
- "Set it and forget it" — weekly: lock topic, blog publishes, social + newsletter appear in review queue

### 1.3 Canonical Platform Matrix

This is the authoritative platform state. No other document section overrides this table.

| Platform | NCHO | SomersSchool | Scott Personal | Phase | Publish Method | Notes |
|---|---|---|---|---|---|---|
| **Facebook** | ✅ IN | ✅ IN | ✅ IN | Phase 1 | Buffer GraphQL | Business Page only — not Group |
| **Instagram** | ✅ IN | ✅ IN | ✅ IN | Phase 1 | Buffer GraphQL | Feed posts only in Phase 1. Stories = Phase 1.5 |
| **LinkedIn** | ✅ IN | ✅ IN | ⚠️ Limited | Phase 1 | Buffer GraphQL | LinkedIn = educator-facing content for SomersSchool. NCHO = limited curated posts. Scott Personal = thought leadership only. Never promote store directly. |
| **Threads** | ❌ DROPPED | ❌ DROPPED | ❌ DROPPED | Never | — | Out of scope entirely. **D118 final decision.** |
| **Pinterest** | Phase 2 | Phase 2 | — | Phase 2 | Direct API | Blog cascade. Not in Phase 1. |
| **YouTube** | Phase 1 (batch) | Phase 1 (batch) | Phase 1 (batch) | Phase 1 | HeyGen API | Batch playlist generation via separate trigger (NOT part of weekly cron). 2–3 min HeyGen talking head videos. 50+ video batches on demand. YouTube Community posts = Phase 2. **D120 locked.** |
| **TikTok** | Deferred | Deferred | Deferred | Phase 4+ | TBD | Dog mascot short clips as future play. No pipeline built until animal mascot is established and TikTok Creator Marketplace API access is viable. **SUPERSEDES D3, D4, D34, D35.** |
| **X / Twitter** | ❌ DROPPED | ❌ DROPPED | ❌ DROPPED | Never | — | Cost/noise tradeoff not worth it. **D37 final decision. SUPERSEDES D3, D35.** |
| **Google Business Profile** | Create | Create | — | Phase 1 | Manual | Low leverage for national ecommerce; create for trust/completeness. Do not block anything on it. |
| **Nextdoor** | ❌ | ❌ | ❌ | Never | — | Local scope. Not relevant for national market. |

### 1.4 Brand Architecture and Cross-Funnel Rules

**Role of each brand:**

| Brand | Primary Role | Conversion Target |
|---|---|---|
| **Scott Personal** | Trust and authority. Founder story. Teacher worldview. | Routes to both NCHO and SomersSchool. The fuel. |
| **NCHO** | Commerce. Curated curriculum/resource products. | NCHO store. Category pages. Product spotlights. |
| **SomersSchool** | Structured course platform. Secular. Teacher-designed. | SomersSchool enrollment pages. Lead magnets. |
| **Alana Terry** | Deferred — D41 final. | — |

**Cross-post allow/deny rules:**

| Source Brand | May Point To | May NOT Point To |
|---|---|---|
| Scott Personal | NCHO store, SomersSchool enrollment, lead magnets | Do not conflate Scott's health story with store promotions |
| NCHO | SomersSchool where clear curriculum fit | Alana Terry; SomersSchool in every post (selective only) |
| SomersSchool | NCHO only in clear curriculum/resource context | Generic store homepage from LinkedIn; Alana Terry |
| LinkedIn posts (any brand) | Educator-facing landing pages, lead magnets, demo pages | Generic NCHO store homepage |

**Funnel flow:**
```
Scott Personal (trust/authority)
      ↓
    NCHO (broad curriculum demand) ←→ SomersSchool (structured course demand)
      ↓                                        ↓
  Product pages                          Enrollment + demo pages
  Lead magnets                           Lead magnets
  Category pages                         AI teaching message
```

---

## PART 2 — TRACK A: SOCIAL PUBLISHING CORE (Phase 1)

### 2.1 Phase 1 Scope Boundary

**IN SCOPE for Phase 1:**
- Feed posts on Facebook, Instagram, LinkedIn (Threads DROPPED — D118)
- Three brands: NCHO, SomersSchool, Scott Personal
- AI generation of copy + images
- Human review + edit + approve before any publish
- Buffer scheduling for all three social platforms
- UTM tagging on all outbound links
- Image pipeline: AI generation + Cloudinary corner badge + `[AI]` caption prefix (D121)
- Edit-to-learn voice loop — automatically updates brand_voices source of truth (D122)
- Basic analytics: post count, scheduled vs. published, basic engagement dashboard
- Weekly cron batch generation (Monday 6 AM Alaska time — existing pattern)
- Shopify product webhook → auto-generate NCHO launch posts (existing — keep)
- Blog post generation and Shopify blog publishing (moved from Track B to Phase 1 — D119)
- Newsletter email trigger via Brevo (moved from Track B to Phase 1 — D119)
- YouTube batch playlist generation via separate trigger button — 2–3 min HeyGen talking head videos, 50+ video batches on demand (D120)

**EXPLICITLY OUT OF SCOPE for Phase 1:**
- Stories (Phase 1.5 after feed is stable)
- Reels or short-form video for social feeds (Phase 2)
- Pinterest (Phase 2)
- YouTube Community posts and video descriptions (Phase 2) — note: YouTube batch VIDEO generation IS Phase 1 via separate trigger (D120)
- AI auto-replies to comments (Phase 2 / Track C)
- DM automation beyond manual awareness (Phase 2 / Track C)
- Facebook Group posting (Phase 2 / Track C)
- Social listening for untagged mentions (Phase 2 / Track C)
- Evergreen recycling automation (Phase 2)
- A/B testing framework (Phase 2)
- Podcast guest outreach CRM (Phase 3 / Track D)

### 2.2 Content Cadence (RESOLVED — D49 wins over D22)

**The contradiction:** D22 described 60–80 posts/week total; D49 described 3 posts/week/brand.

**Resolution:** D49 is the correct Phase 1 operating cadence. D22 reflects long-term ambition, not Phase 1 discipline. At 3 brands × 3 platforms × 3 posts = approximately 27 unique approved pieces per week. At 60–80 posts/week, manual review becomes untenable and quality degrades. D22 is demoted to Phase 3 ambition.

**Active cadence rules:**

| Phase | Feed Posts | Stories | Additional |
|---|---|---|---|
| Phase 1 (baseline) | 3 per week per brand | None — Phase 1.5 | — |
| Phase 1.5 | 3 per week per brand | Daily where supported | After feed cadence is stable and proved |
| Phase 2 | 3–5 per week per brand | Daily | Plus blog cascade variants, evergreen recycling |
| Phase 3 | High-volume (ambition) | Daily | After proven quality at scale |

**5% promo rule (updated):** Replace percentage-only logic with absolute rules:
- No more than 1 in 10 posts per brand is hard-sell or direct-response
- Each active brand must receive at minimum 1 conversion-oriented post or CTA per week across feed, Stories, or email cascade
- This applies at low volume; revisit at Phase 3 cadence

### 2.3 Planning Horizon (RESOLVED — D55 wins over D15)

**The contradiction:** D15 described full-year pre-generation and bulk approve; D55 described rolling 90/30/7 model.

**Resolution:** D55 is the correct operational model. Full-year pre-generation creates stale content, locks in offers and URLs that will change, and locks in brand voice before it has matured. Year-ahead goes no further than theme planning.

**Active planning stack:**

| Horizon | What Gets Planned |
|---|---|
| 12 months | Themes, tentpole moments, seasonal anchors, campaign arcs |
| 90 days | Campaign planning — what products/courses are being spotlighted when |
| 30 days | Actual AI-drafted content inventory available for review |
| 7 days | Approved queued content in Buffer for scheduled publish |

The system never pre-generates beyond a 30-day draft horizon. AI batch generation runs weekly (Monday) and targets the rolling 30-day draft window.

### 2.4 Content Types Supported in Phase 1

| Format | Platforms | AI Support | Notes |
|---|---|---|---|
| Education tip/insight | All four | Full generation | Highest volume. Short, native-length |
| Product spotlight | FB, Instagram, Threads | Full generation | NCHO. Triggered by Shopify webhook on new product |
| Course/enrollment CTA | FB, Instagram, LinkedIn | Full generation | SomersSchool. Less frequent per 5% promo rule |
| Founder/teacher story | All four | Draft + Scott edits | Scott Personal. More first-person, Scott reviews carefully |
| Milestone/progress | All four | Draft + edit | Enrollments, product launches, school year milestones |
| Carousel (3–7 cards) | Instagram, Facebook | Draft cards | Phase 1 support — image pipeline handles cards |
| Link post | LinkedIn, Facebook | Full generation | Blog links, lead magnet CTAs, resource links |
| Quote card | All four | Image-driven | Clean font-on-background; pulls from existing content |

**NOT in Phase 1:** Video posts, Reels, animated Stories, YouTube Community.

### 2.5 Visual and Media Pipeline

**Image generation waterfall (existing — confirm active):**

1. **Leonardo.ai Phoenix** — Free tier (150/day). Primary for feed posts and cards.
2. **FLUX.1-Kontext via Azure Foundry** — Overflow (~$0.001/img).
3. **GPT Image-1 via Azure Foundry** — Hero content and text-in-image (~$0.02/img).

**Controlled by:** `SLIDE_IMAGE_PROVIDER` env var: `leonardo` | `kontext` | `openai` | `auto`.

**Text overlay rule:** Generate images text-free. Apply captions, labels, logos via Cloudinary URL transforms (`l_text:`) at render time. Never bake text into AI-generated images.

**Mascot and video identity (RESOLVED — D40 wins, D21 partially superseded):**

| Asset Type | Visual Treatment |
|---|---|
| K–5 content | Real dogs as visual language (photographs, illustration-style). Not AI-generated character consistency required. This is tone/warmth, not mascot lock-in. |
| Middle/High school content | Scott avatar (HeyGen). |
| Video content (all grades) | HeyGen Scott "Mr. S" avatar. Not Gimli. |
| Gimli (the actual dog) | Real-dog brand reference when relevant. Not a consistency requirement. Not the primary visual system. |
| AI character consistency | Deferred until leonardo LoRA is trained and proven. |

**AI disclosure policy (LOCKED — D121):**
- Disclosure is a brand authenticity feature (D43). It is not hidden.
- Caption prefix: `[AI]` on all AI-generated post text.
- Image corner: Small badge via Cloudinary `l_text:` transform on all AI-generated images.
- **Both.** Caption prefix AND image badge are active on every AI-generated asset.
- Every derivative asset (carousel cards, pinned variations) carries the same disclosure — no exceptions.

### 2.6 Brand Voice Rules Per Platform

| Brand | Facebook | Instagram | LinkedIn |
|---|---|---|---|
| **NCHO** | Warm and curated. "Your child" always. Education mom-accessible. Faith-adjacent but not exclusive. | Visual-first, same warm voice. Single direct CTA. | Not primary. Rare posts only — curated/informational. |
| **SomersSchool** | Confident, secular, progress-visible. Zero faith language. | Same voice, more visual proof of learning. | Professional and peer-facing. Educator-legible. Use this as the teacher credentialing channel. Never feel like a store. |
| **Scott Personal** | Founder/teacher authority. Authentic voice. Big public-school critique energy when relevant. The Accidental Teacher story. | More personal, behind-the-scenes. | Thought leadership. Educator community. "I've been teaching for X years and here's what I see." Authority subjects: weight loss + working with children (D123). |

**Forbidden language (all brands):** explore, journey, leverage, synergy, empower, unlock.
**Always say "your child"** — never "your student," "the learner," "young people."

**Cross-brand voice isolation rule:** SomersSchool's secular positioning must never be muddied by NCHO's faith-adjacent tone and vice versa. Do not cross-post between these two brands automatically. Every cross-brand reference is manually considered.

### 2.7 Automation Rights Matrix (NEW)

This matrix defines what AI is allowed to do without Scott's approval. Nothing in this matrix overrides the human review gate for publishing.

| Action | Phase 1 | Phase 2 | Phase 3 | Never Fully Auto |
|---|---|---|---|---|
| Draft post copy | ✅ Auto | ✅ Auto | ✅ Auto | |
| Generate images | ✅ Auto | ✅ Auto | ✅ Auto | |
| Schedule draft to review queue | ✅ Auto | ✅ Auto | ✅ Auto | |
| **Schedule approved post to Buffer** | ✅ Auto (after human approve) | ✅ Auto | ✅ Auto | |
| **Publish to platform** | Human gate required | Human gate OR auto (trust-based) | Auto-publish as end-state (D83/D84) | |
| Reply to generic positive comments | Draft only | Draft + suggest | Auto with threshold | |
| Reply to curriculum/standards/faith questions | ❌ Draft only | ❌ Draft only | ❌ Draft only | Never auto — ❌ |
| Reply to negative comments | Flag for Scott | Flag for Scott | Flag for Scott | Never auto — ❌ |
| Update brand voice rules | ❌ | ❌ | ❌ | Never auto — ❌ |
| Modify CTA destination URLs | ❌ | ❌ | ❌ | Never auto — ❌ |
| Send podcast outreach emails | ❌ | ❌ Draft, human gate | Queue with approval | Never fully autonomous — ❌ |
| Blog publishing to Shopify | Human gate required | Human gate required | Auto-publish (mature only) | Phase 1 blog-first pipeline (D127). Hallucinated state ESA claims — ❌ |

**Trust-building toward full automation (D83, D84):** Full auto-publish is the 12-month destination, not the launch state. Trust is earned by: N consecutive approved posts per brand per platform, zero rejected posts in rolling 30-day window, Scott manually enabling auto-publish mode per brand+platform combination. It is never globally toggled — it is earned brand-by-platform.

### 2.8 Scheduling and Buffer Integration

- **Primary scheduler:** Buffer GraphQL API (`https://api.buffer.com`). The old REST API (`api.bufferapp.com/1/`) is dead. Never reference it.
- **Buffer Organization ID:** `695b16d7995b518a94ef5f6a`
- **Scheduling type:** `customScheduled` + `dueAt` ISO8601. Not "optimal timing" optimization yet.
- **Weekly batch cron:** Monday `"0 14 * * 1"` (06:00 Alaska time = 14:00 UTC)
- **Shopify product webhook:** Triggers NCHO launch posts automatically on new product creation (existing)
- **Buffer channel requirement:** `buffer_profile_id` must be set in `social_accounts` table for each active brand+platform combination before any post can be approved and scheduled.

### 2.9 Review Queue Design

- **One queue. Scott only.** (D79) — no Anna involvement, no shared review.
- **Queue scope (blog-first pipeline, D127–D128):** Social posts across all active brands/platforms + newsletter drafts (one per weekly topic). Blog drafts publish to Shopify first — social posts and newsletter drafts are what appear in the queue.
- **Post and image are reviewed together.** One card, one approval action. No separate image approval.
- **What Scott sees per pending card:**
  - Generated post text (editable inline)
  - Generated image (swappable)
  - Hashtags (editable)
  - Suggested schedule date/time (editable)
  - Buffer channel selector
  - AI disclosure label status
  - Edit history (previous versions visible on expand)
- **Actions per card:** Approve + schedule | Edit + approve | Reject | Regenerate
- **Supabase Realtime:** Queue updates live as posts are generated — Scott never needs to refresh.

**Rejected post behavior (LOCKED — OI-01 resolved):**
Rejected posts move to a `rejected` archive (NOT hard-deleted). Status becomes `rejected`. Scott can optionally regenerate from the rejected post or the original topic seed. Rejection reason field available. The edit-to-learn loop sees rejection patterns and adjusts future generation.

**Batch-ready notifications (LOCKED — OI-03 resolved):**
Badge indicator in UI (dot on `/social` nav item). Resend email digest once-per-batch when batch is ready for review (not per-post). NO Twilio SMS in Phase 1. Revisit at Phase 2.

**Approval expiry (LOCKED — OI-02 resolved):**
No auto-expiry in Phase 1. A stale indicator appears on posts sitting in queue for 14+ days but nothing auto-rejects. Scott reviews on his schedule. Vacation/dark mode (OI-10, LOCKED): `publishing_paused` boolean on `settings` table. Cron skips all publishing if `true`. Manual toggle. No auto-resume. ✅ *`settings` table applied via migration 037 (April 2026).*

### 2.10 UTM Tagging and Analytics

- All outbound links in published posts include UTM parameters (D71).
- UTM structure: `utm_source=[platform]&utm_medium=social&utm_campaign=[brand]-[month]&utm_content=[post_id]`
- Analytics dashboard (Phase 1): per-brand, per-platform post counts, scheduled vs published, basic engagement pull-back from Buffer stats.
- **Autoresearch loop instrument:** Track which brand/platform/topic combinations generate the most engagement. The edit-to-learn loop + engagement data drives future generation quality over time.

### 2.11 Edit-to-Learn Voice Loop

When Scott edits a post before approving:
1. The system records the original AI draft vs. the edited version in `edit_history` JSONB array.
2. A background job (async, non-blocking) compares draft vs edit and extracts a refinement signal keyed to the specific platform.
3. The signal writes to `brand_voices.platform_hints['platform']` — never to `full_voice_prompt`, `audience`, `tone`, or `rules`.
4. Future generation reads the base `full_voice_prompt` + appends `platform_hints[platform]` to the system prompt before calling Claude.
5. Scott can review and delete any auto-learned rule from the Brand Voices panel in Settings.

**Write target: `platform_hints[platform]` only (LOCKED — D130).** The `platform_hints JSONB` column already exists on `brand_voices` (migration 023) and was designed for exactly this separation. A LinkedIn edit signal cannot contaminate Facebook or Instagram generation because the write target is platform-keyed. The base voice (`full_voice_prompt`) is only modified by Scott's direct edits in the Settings panel — never by the auto-loop.

The loop auto-updates directly — it does not suggest (LOCKED — D122). Scott can review and delete any auto-learned rule from the Brand Voices panel in Settings. He remains the final authority on which rules persist.

**Required generate route change (Phase 1):** `getBrandVoiceSystem()` in `/api/social/generate/route.ts` must append `platform_hints[platform]` to the system prompt when a platform hint exists for the target platform. One function change, no schema migration needed.

### 2.12 Blog-First Pipeline — Event Chain and State Machine

The blog-first pipeline is not just an architectural preference — it is the automation trigger for all downstream social and newsletter content. The trigger mechanism and state machine must be precisely defined before any part of this is built.

**State machine:**

```
[Editorial calendar locked for week N]
         |
         v
[Cron generates 3 blog post drafts for topic → lands in review queue as content_type='blog']
         |
         | (Scott approves draft; publishes to Shopify)
         v
[Shopify blog.published webhook fires → POST /api/webhooks/shopify-blog-post/]
         |
         +--> [Job: social_batch — generates posts for all active brands × platforms]
         |            |
         |            v
         |    [Posts land in review queue (status: pending_review) — nothing publishes without approval]
         |
         +--> [Job: newsletter_draft — generates Brevo newsletter draft for this topic]
                      |
                      v
              [Newsletter lands in review queue (content_type='newsletter') — never auto-sends]
```

**Trigger mechanism:** Shopify `blog_posts/create` webhook — same HMAC-verified pattern as existing `/api/webhooks/shopify-product/`. New route: `/api/webhooks/shopify-blog-post/`. Filter: only process webhooks where `published_at IS NOT NULL` (ignore draft saves). Creates two jobs and returns HTTP 200 immediately.

**Key invariants (LOCKED):**
- Blog is the source of truth. Social posts and newsletters derive from a published blog post — never generated independently.
- All three output types pass through the review queue. Nothing auto-publishes or auto-sends.
- The Shopify blog webhook is the sole trigger for blog-derived social and newsletter generation. The weekly cron handles social cadence top-up only — it does not duplicate blog-triggered generation.

**New job type — ✅ BUILT:** `newsletter_draft` in jobs CHECK constraint (migration 037) + `worker/src/jobs/newsletter-draft.ts` + router case. `youtube_batch_playlist` also registered — defers to Phase 1.5 gate.

**New route — ✅ BUILT:** `src/app/api/webhooks/shopify-blog-post/route.ts` — HMAC-verified, filters on `published_at`, creates `social_batch` + `newsletter_draft` jobs. ⚠️ Still required before smoke test: register this webhook URL in Shopify dashboard → Webhooks → `blog_posts/create`.

---

## PART 3 — TRACK B: CONTENT ENGINE (Phase 2)

**Note:** Blog generation, Shopify publishing, and newsletter are Phase 1 (D119, D126–D128). Architecture: 52-week calendar → weekly topic → 3 blog posts → Shopify publish → auto-triggers social + newsletter draft → review queue. Track B Phase 2 covers cascade to Pinterest, evergreen recycling, and content entity model migration — build only after Track A and blog-first pipeline are proven.

*(Build only after Track A is proven. No parallel development.)*

### 3.1 Blog Generation

- **Cadence:** 3 posts per week, AI-managed (D94)
- **Format:** Full AI drafts, Scott edits/approves before publish (D95). NOT auto-publish from day one.
- **Hub role:** Blog is the content hub. Social posts, Pinterest pins, and email sequences cascade from blog content (D97).
- **Publish target:** Direct to Shopify blog via Admin API (D100)
- **CTA strategy:** Blog CTAs point to category pages or lead magnets — NOT generic store homepage
- **LinkedIn:** Blog posts trigger LinkedIn link posts (educator-facing angle)

**Blog governance requirements (before any auto-publishing):**
- Editorial rubric with content quality standards
- Fact-grounding rules: all state ESA claims must trace to verified source data (see Section 3.3)
- Anti-hallucination check for state-specific language
- Internal link strategy and canonical URL strategy
- Duplicate topic detection (prevent near-identical posts)
- Thin-content prevention (minimum depth bar)

**DEFERRED — See Part 8, OI-12.** Blog comments: Revisit before Phase 2 / Track B starts. Confirm Scott handles all moderation (D62 pattern). New comment surface = new operational load. Evaluate net benefit vs. cost before committing.

### 3.2 Content Cascade Model

Single blog post → generates downstream variants:

```
Blog post (primary asset)
  ├── 2–3 social post variants (per platform/brand)
  ├── Pinterest pin(s) with cleaned text-overlay image
  ├── LinkedIn link post (educator angle)
  ├── Email sequence trigger (if Brevo toggle is ON — D105)
  └── Carousel or quote card (if content supports it)
```

Each downstream variant is a separate item in the review queue with its own approval/reject action. No cascade publishes without human review at launch.

### 3.3 State ESA/Allotment Claim Policy

This is the highest legal and commercial risk area in the content system.

**Problem:** D26/D96 correctly broaden scope to national ESA/allotment audience. But every state has different eligibility rules, reimbursement workflows, vendor approval requirements, and allowed-implication rules.

**Requirements before any ESA/allotment claims are auto-generated:**

1. A structured, maintained state policy table in Supabase: `state_esa_policies` with columns: `state`, `program_name`, `eligible_vendors`, `approved_language`, `disallowed_language`, `last_verified`, `source_url`
2. AI generation must read from this table — never hallucinate state-specific claims
3. Any ESA claim that cannot be traced to `state_esa_policies` gets flagged `⚠️ UNVERIFIED` and requires human review before publish
4. Scott or a researcher maintains this table. AI never writes to it.

**DEFERRED — See Part 8, OI-14.** Build `state_esa_policies` table before Track B starts, or enforce blanket national-only claim rule until the table exists. Legal risk — not a nice-to-have. Hard blocker for Track B.

---

## PART 4 — TRACK C: COMMUNITY AND LISTENING (Phase 2)

*(Build only after Track A is proven. No parallel development.)*

### 4.1 Comment Moderation Taxonomy

Replacing the "ignore and delete negative" rule (D63) with a proper moderation tree.

**Comment classes and default handling:**

| Class | Examples | Default Action |
|---|---|---|
| Spam / bot | Irrelevant links, repeated phrases | Auto-delete or filter |
| Troll / bad-faith attack | Personal attacks, coordinated negativity | Delete + ignore |
| Legitimate complaint | "I ordered X and it never arrived" | Route to customer service queue — NEVER delete |
| Product clarification | "Does this work for 4th grade math?" | Draft reply, Scott approves |
| Curriculum sensitivity question | "Is this actually secular?" "Does this align with CCSS?" | Draft reply, Scott approves — never auto-reply |
| Faith/religion question | "Is this a Christian curriculum?" | Human-only reply — never auto |
| Praise / engagement opportunity | "Love this! ❤️" | Draft optional reply, Scott approves |
| Customer service issue | Shipping, refunds, access problems | Route to `support@nextchapterhomeschool.com` |

**Rule:** Legitimate complaints and customer service issues are NEVER deleted. Deleting a real customer issue is a brand harm, not a brand win.

### 4.2 DM Policy

Phase 2. Not Phase 1. DM handling scope:
- Auto-acknowledge receipt with a template (within 24h)
- Classify DM type (customer service vs. inquiry vs. spam)
- Route customer service to NCHO support email
- Queue curriculum/product inquiries for Scott's manual response
- Never auto-answer curriculum capability questions (same as D66)

### 4.3 Facebook Groups

**Strategy: Manual-first opportunity intelligence — NOT automated publishing.**

- Facebook Groups are community surfaces, not broadcast surfaces. They require different operating rules than Pages.
- AI does NOT draft Group posts automatically.
- System surfaces Group posting opportunities (upcoming product launch aligns with a group's stated interests) as suggestions for Scott to evaluate manually.
- Per-Group rulebook stored in Supabase: `fb_groups` table with `group_name`, `posting_rules`, `approved_to_post`, `posting_frequency_policy`, `last_post_at`.
- Scott manually posts to Groups. System tracks activity to prevent over-posting.

### 4.4 Social Listening

Phase 2. Basic untagged mention monitoring for NCHO, SomersSchool, and Scott's real name across Facebook and Instagram. Flag potential support situations or influencer engagement opportunities for manual review. Never auto-respond to untagged mentions.

---

## PART 5 — TRACK D: PODCAST OUTREACH CRM (Phase 3)

*(Build only after Tracks A+B+C are stable. Do not begin until deliverability architecture exists.)*

**Track D scope:** Automated CRM for booking Scott on podcast shows as a guest. Fully automated prospect research, pitch generation, outbound queue, follow-ups, appearance tracking, reciprocal guest discovery (D106–D117).

### 5.1 Architecture Summary

- **CTA on all outreach pitches:** NCHO (primary) and SomersSchool (secondary) (D114)
- **Personalization:** Full — references specific episodes, host's stated interests (D110)
- **Automation ambition:** Unlimited volume target on prospecting (D106)
- **Reciprocal flag:** System identifies guests on target shows who would benefit from appearing on Scott's future podcast. Tracked separately (D117).
- **Talking points:** 4 standard talking points per brand (D112) — generated from real stats and credentials, not invented

### 5.2 Deliverability and Domain Policy (CRITICAL — DO NOT SKIP)

**This is the highest-risk technical decision in Track D.**

Cold outreach at volume can destroy sender reputation and harm the customer-facing email domain.

**Requirements before Track D sends a single outreach email:**

1. **Dedicated outreach subdomain or domain.** Do NOT use the same domain as customer-facing emails. Use something like `pitch.nextchapterhomeschool.com` or a separate domain entirely.
2. **SPF, DKIM, DMARC** configured on the outreach domain/subdomain before first send.
3. **Send throttling:** No more than N emails per day per domain, ramping up from low volume.
4. **Bounce handling:** Hard bounces remove from all future outreach immediately. Soft bounces tracked.
5. **Follow-up suppression:** No more than 2 follow-ups per prospect. Hard stop.
6. **Legal compliance:** Each outreach email must include a clear one-click opt-out. CAN-SPAM/GDPR minimum compliance.
7. **Approval queue at launch:** Track D starts with every outreach email requiring Scott's manual approval. Auto-send is Phase 3+ only, after reputation baseline is established.

**DEFERRED — See Part 8, OI-13.** Confirm dedicated outreach domain/subdomain (`pitch.nextchapterhomeschool.com` or separate domain) before Track D begins. Hard blocker for Track D.

---

## PART 6 — TECHNICAL ARCHITECTURE

### 6.1 Content Entity Model (BEYOND FLAT `social_posts`)

The current `social_posts` table is sufficient for Track A Phase 1. It will NOT be sufficient for Tracks B–D.

**The needed conceptual layers:**

| Layer | Concept | Current Table | Phase Needed |
|---|---|---|---|
| Idea / Source | Keyword seed, campaign brief, topic | None | Phase 2 |
| Primary Asset | Blog post, long-form content, video script | None | Phase 2 |
| Variants | Platform-specific adaptations of a primary asset | `social_posts` (currently conflated) | Phase 2 |
| Distribution Event | Scheduled publication of a variant | `social_posts.scheduled_for` | Phase 1 (ok for now) |
| Recycled Event | Re-use of a variant after 90+ days | None | Phase 2 |
| Comment/Reply | Moderation queue items | None | Phase 2 |
| Mention | Untagged brand mention | None | Phase 2 |
| Outreach Target | Podcast/partner prospect | None | Phase 3 |
| Outreach Sequence | Multi-step pitch thread | None | Phase 3 |

**Phase 1 decision:** Keep `social_posts` as-is. Do NOT attempt to refactor into a full content entity model in Phase 1. The model above is the Phase 2 migration target. Build toward it — don't add technical debt by shoehorning blog posts or carousel cards into the `social_posts` table.

### 6.1a Phase 1 Data Surfaces

| Content Type | Storage | Notes |
|---|---|---|
| Social posts | `social_posts` table (existing — backfill `user_id`, D129) | Standard review queue flow |
| Blog posts | Shopify blog via Admin API | Not in Chapterhouse Supabase. Shopify is source of truth. |
| Newsletter drafts | `social_posts` with `content_type='newsletter'` column — ✅ *column added via migration 037 (April 2026)* | Same review queue flow as social posts |
| YouTube batch jobs | `jobs` table (existing), `type: 'youtube_batch_playlist'` — ✅ *job type added to CHECK constraint via migration 037; worker router case added (defers gracefully — requires YOUTUBE_OAUTH_TOKEN, Phase 1.5 gate)* | Job contract defined in Section 6.5 |

### 6.2 Multi-Tenancy Schema Rule

**LOCKED — D129:** `user_id UUID REFERENCES auth.users(id) NOT NULL` is enforced on all new social/content/blog tables from day one. Phase 1 migration backfills `user_id` on existing `social_accounts` and `social_posts` tables. The cost of doing it now is one migration. The cost of doing it later is a full schema audit plus data backfill under live traffic.

✅ **Applied (migration 037, April 2026):** Both `social_accounts` and `social_posts` have `user_id UUID NOT NULL` with backfill to Scott's user ID. RLS policies updated to `USING (auth.uid() = user_id)`.

### 6.3 Phase 1 De-Legacy Checklist — Deprecated Brands and Platforms

The blast radius of the `alana_terry` removal is wider than three items. The following is the complete checklist. All items must be addressed before the Phase 1 smoke test.

| File | What to Change | Location |
|---|---|---|
| `src/app/api/social/generate/route.ts` | Remove `"alana_terry"` from `generateSchema` zod enum | Line 6 |
| `src/app/api/social/generate/route.ts` | Remove entire `"alana_terry"` block from `BRAND_VOICE_FALLBACK` constant | Lines ~14–62 |
| `src/app/api/social/accounts/route.ts` | Remove `"alana_terry"` from `accountSchema` brand enum | Line 5 |
| `src/app/api/social/accounts/route.ts` | Remove `"threads"`, `"tiktok"`, `"youtube"`, `"pinterest"` from `accountSchema` platform enum | Line 6 |
| `supabase/migrations/` | Write `20260402_033_clean_deprecated_brands.sql` — ALTER TABLE to drop and recreate `brand` and `platform` CHECK constraints on both `social_accounts` and `social_posts`, removing `alana_terry`, `threads`, `tiktok`, `youtube`, `pinterest` | New file |
| `src/components/social-review-queue.tsx` | Remove `alana_terry` from `BRAND_LABEL`, `BRAND_COLOR`, and `BRAND_ORDER` | Lines 23–37 |
| `brand_voices` seed data | Remove or reassign any row where `brand = 'alana_terry'` | Supabase dashboard or migration 023b |

**Note on CHECK constraints:** ✅ Original migration files (010/011) left intact. Migration 033 applied — dropped and recreated both CHECK constraints with cleaned values (`ncho/somersschool/scott_personal` for brand; `facebook/instagram/linkedin` for social_accounts platform).

**Status: ✅ ALL ITEMS COMPLETE (April 2026).** Migration 033 applied. Code files updated. `brand_voices` `alana_terry` row removed via migration 033.

---

### 6.4 Phase 1 Schema Delta — ✅ APPLIED (April 2026)

Applied via three migrations (all run April 2026): **033** (deprecated brand/platform cleanup + alana_terry purge), **035** (email platform added to `social_posts` CHECK), **037** (user_id backfill on both tables, `content_type` column, `settings` table, jobs CHECK constraint with new types). Migrations 034 and 036 were superseded — 034 failed because `settings` already existed, 036 failed because of pre-existing table shape; 037 was the robust replacement for both. The SQL in items (a)–(e) below is preserved as reference.

**(a) `user_id` on `social_posts`** (D129 — absent from migration 011)

```sql
ALTER TABLE social_posts ADD COLUMN user_id UUID REFERENCES auth.users(id);
UPDATE social_posts SET user_id = (SELECT id FROM auth.users LIMIT 1); -- backfill to Scott
ALTER TABLE social_posts ALTER COLUMN user_id SET NOT NULL;
DROP POLICY IF EXISTS "authenticated users only" ON social_posts;
CREATE POLICY "owner only" ON social_posts FOR ALL USING (auth.uid() = user_id);
```

**(b) `content_type` on `social_posts`** (newsletter drafts share review queue — absent from migration 011)

```sql
ALTER TABLE social_posts
  ADD COLUMN content_type TEXT NOT NULL DEFAULT 'social_post'
  CHECK (content_type IN ('social_post', 'newsletter'));
```

**(c) `user_id` on `social_accounts`** (D129 — absent from migration 010)

```sql
ALTER TABLE social_accounts ADD COLUMN user_id UUID REFERENCES auth.users(id);
UPDATE social_accounts SET user_id = (SELECT id FROM auth.users LIMIT 1); -- backfill
ALTER TABLE social_accounts ALTER COLUMN user_id SET NOT NULL;
DROP POLICY IF EXISTS "authenticated users only" ON social_accounts;
CREATE POLICY "owner only" ON social_accounts FOR ALL USING (auth.uid() = user_id);
```

**(d) `settings` table** (OI-10 / `publishing_paused` — no `settings` table exists in any migration)

```sql
CREATE TABLE settings (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID        NOT NULL REFERENCES auth.users(id),
  publishing_paused BOOLEAN     NOT NULL DEFAULT false,
  paused_until      TIMESTAMPTZ,
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id)
);
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner only" ON settings FOR ALL USING (auth.uid() = user_id);
```

**(e) New job types** (absent from current live CHECK constraint in migration 028)

```sql
-- Add youtube_batch_playlist (D120) and newsletter_draft (Section 2.12)
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_type_check;
ALTER TABLE jobs ADD CONSTRAINT jobs_type_check CHECK (type IN (
  'curriculum_factory', 'research_batch', 'council_session', 'social_batch',
  'youtube_transcript', 'intel_fetch', 'brief_pregenerate', 'seed_extract',
  'context_condense', 'course_slide_images', 'generate_character_scenes',
  'train_character_lora', 'generate_segment_audio', 'generate_segment_video',
  'lesson_video_pipeline', 'generate_bundle_anchor',
  'youtube_batch_playlist',  -- D120: Section 6.5
  'newsletter_draft'         -- Section 2.12: blog → newsletter auto-trigger
));
```

✅ Cases added in `worker/src/jobs/router.ts`: `newsletter_draft` runs `runNewsletterDraft()`; `youtube_batch_playlist` defers gracefully with Phase 1.5 message (YOUTUBE_OAUTH_TOKEN required).

---

### 6.5 YouTube Batch Job Contract

D120 locked YouTube batch playlist generation as Phase 1. When D120 was locked, the trigger, payload, storage, and worker contract were not defined. This section defines them. Nothing for this feature should be built until this section is confirmed.

**Trigger:** Manual button in `/social` UI — NOT the weekly cron. Scott presses it when he has a batch of topics ready. This aligns with D120: "separate trigger button, on demand."

**Job type:** `youtube_batch_playlist` (requires Section 6.4 item (e) first)

**Input payload schema:**
```json
{
  "brand": "ncho | somersschool | scott_personal",
  "playlist_title": "string",
  "topic_seeds": ["string"],
  "heyGen_avatar_id": "string",
  "voice_id": "string",
  "video_duration_seconds": 150,
  "youtube_playlist_id": "string | null"
}
```

**Worker responsibilities** (`worker/src/jobs/youtube-batch-playlist.ts` — new file):
1. For each topic seed: call Claude Haiku to generate a 2–3 min script
2. Submit script + avatar ID to HeyGen API → returns render job ID
3. Poll HeyGen render status until complete (videos take several minutes each)
4. Upload rendered MP4 to YouTube via YouTube Data API v3 (`youtube.upload` OAuth scope)
5. Add each video to the playlist
6. Update `jobs.progress` after each video completes
7. Write to `jobs.output`: `{ playlist_id, playlist_url, videos: [{topic, youtube_video_id, url}] }`

**Pre-conditions before this job type can run:**
- YouTube Data API v3 with `youtube` OAuth scope (upload capability) — distinct from the read-only `YOUTUBE_API_KEY` used for search and metadata today. Requires a separate OAuth grant and refresh token stored in Railway env.
- HeyGen API key (already in Railway env)

**Phase 1 scope gate:** If YouTube OAuth is not established before Phase 1 sprint begins, demote `youtube_batch_playlist` to Phase 1.5 and do not hold the weekly social + blog + newsletter pipeline on it. The core pipeline ships independently.

**Done criteria:** 5 test videos render via HeyGen, upload to YouTube, appear in a test playlist — triggered manually from the UI with no cron involvement.

---

## PART 7 — RESOLVED CONTRADICTIONS

This is the authoritative resolution of the nine critical contradictions identified in the opus analysis. Each resolution is final.

| # | Contradiction | Old (Superseded) | New (Active) |
|---|---|---|---|
| 1 | **Posting cadence** | D22: 60–80 posts/week total | **D49: 3 posts/week/brand baseline.** D22 becomes Phase 3 ambition only. |
| 2 | **Planning horizon** | D15: Full-year pre-generation | **D55: Rolling 90/30/7.** Full-year concept retained for theme-only planning, not post drafting. |
| 3 | **X/Twitter** | D3/D4: Limited X support | **D37: DROPPED.** D3, D4, D34, D35 are superseded. Platform matrix and technical gap log updated. |
| 4 | **TikTok** | D4: Included in some form | **D38: Deferred until dog mascot and TikTok API are viable.** Not in pipeline. D34 superseded. |
| 5 | **Mascot/video identity** | D21: HeyGen + Gimli cover all video | **D40: Dogs for K–5 visual language, Scott avatar for video, Gimli as real-dog brand reference only.** Not a consistency requirement. |
| 6 | **Cross-post scope** | D10: All brands cross-post and interconnect | **Allow/deny matrix governs all cross-brand references.** See Section 1.4. |
| 7 | **Automation governance** | D31/D42/D83/D84: Various | **Automation rights matrix** in Section 2.7 is the canonical authority. |
| 8 | **5% promo compatibility** | D24: 5% of 60–80 posts | **Update:** 1-in-10 posts max hard-sell + at least 1 CTA slot per brand per week minimum. |
| 9 | **Anna/Alana stale references** | Anna involved in community, cross-promotion | **D41/D62 final:** Alana Terry deferred. Scott owns 100% of community management. All stale references moved to Appendix B. |

---

## PART 8 — OPEN ITEMS STATUS

All blocking items resolved. Three items deferred (non-blocking — revisit before their respective phases begin).

| # | OI | Status | Resolution |
|---|---|---|---|
| 1 | OI-05 | ✅ RESOLVED | Phase 1 done = full week published on schedule across all brands + social + blog + newsletter + YouTube batch. See Section 1.2. D119. |
| 2 | OI-06 | ✅ RESOLVED | First smoke test: NCHO on Facebook with a single education tip post. Validate full generate→review→approve→schedule→publish loop on one post before batch. |
| 3 | OI-01 | ✅ RESOLVED | Rejected posts → `rejected` archive (not deleted). Regeneration available from original seed. Rejection reason field. Loop sees rejection patterns. See Section 2.9. |
| 4 | OI-03 | ✅ RESOLVED | UI badge + Resend email digest once-per-batch. No SMS in Phase 1. See Section 2.9. |
| 5 | OI-02 | ✅ RESOLVED | No auto-expiry. Stale indicator at 14 days. No auto-reject. See Section 2.9. |
| 6 | OI-10 | ✅ FULLY RESOLVED | `publishing_paused` boolean on `settings` table, cron skips if true, manual toggle, no auto-resume. **Applied via migration 037 (April 2026).** |
| 7 | OI-04 | ✅ RESOLVED | `user_id NOT NULL` enforced on all new tables from day one. Backfill migration on existing social tables. |
| 8 | OI-08 | ✅ RESOLVED | `[AI]` caption prefix + Cloudinary corner badge on all AI-generated posts and derivative assets. Both. D121. See Section 2.5. |
| 9 | Q35b | ✅ RESOLVED | Scott Personal LinkedIn authority subjects: **weight loss + working with children**. D123. See Section 2.6. |
| 10 | Buffer plan | ✅ RESOLVED | Upgrade from Free to **Essentials plan ($5/ch/mo — recommended start: 5–6 channels at $300–360/year; full 9 channels at $540/year)**. Anna does not need a separate Buffer login — Essentials is sufficient. Hard blocker before Phase 1 sprint begins. D124 + D131. |
| 11 | Existing /social status | ✅ RESOLVED | The existing `/social` system has routes, schema, and UI patterns but was never production-tested. Phase 1 extends and refactors these patterns. D125, Section 6.3. |
| 12 | Blog comments | ⏳ DEFERRED | Revisit before Phase 2 / Track B starts. Confirm Scott handles all moderation (D62 rule). Every new comment surface is operational load. |
| 13 | Podcast outreach domain | ⏳ DEFERRED | Hard blocker for Track D only. Confirm subdomain (`pitch.nextchapterhomeschool.com`) or separate domain before Track D begins. |
| 14 | ESA policy table | ⏳ DEFERRED | Build `state_esa_policies` before Track B starts, OR enforce blanket national-only claim rule until table exists. Legal risk — not a nice-to-have. |
| 15 | Q35 | ⏳ DEFERRED | Competitor tab-closing patterns (Instagram brands Scott actively avoids). Scott will research 3–4 homeschool brands and return. Not a blocker. |

---

## PART 9 — DECISION LOG AMENDMENT (SUPERSEDED DECISIONS)

The following decisions from the brainstorm are now superseded. They are preserved here for history. They should not be referenced in any technical spec or implementation work.

| Decision | Why Superseded | Superseded By |
|---|---|---|
| D3 — Early X/Twitter inclusion | Platform dropped entirely | D37 |
| D4 — Early TikTok inclusion | Platform deferred to Phase 4+ | D38 |
| D22 — 60–80 posts/week | Too high for Phase 1 discipline | D49 |
| D15 — Full-year pre-generation | Stale content risk; calendar flexibility lost | D55 |
| D21 — HeyGen+Gimli cover all video | Mascot strategy changed | D40 |
| D34 — X/TikTok decisions pending research | Research done; both deferred or dropped | D37/D38 |
| D35 — X pending cost/noise research | Research done; X dropped | D37 |
| D10 — All brands cross-post and interconnect | Too blunt; cross-brand funnel map replaces | Section 1.4 |

### New Decisions Locked — Resolution Session (April 2026)

| Decision | What | Notes |
|---|---|---|
| D118 | **Threads DROPPED** — out of scope entirely | Supersedes Phase 1 inclusion in original platform matrix |
| D119 | **Phase 1 = full scope** — blog + newsletter + YouTube batch + all social platforms, full week published on time | Supersedes OI-05 partial scope definition. "Set it and forget it." |
| D120 | **YouTube batch playlists = Phase 1, separate trigger** — 2–3 min HeyGen talking head videos, 50+ video batches triggered manually (NOT weekly cron) | Supersedes Phase 2 YouTube placement |
| D121 | **AI disclosure = both** — `[AI]` caption prefix AND Cloudinary corner badge on every AI-generated post and derivative asset | Resolves OI-08 |
| D122 | **Edit-to-learn auto-updates brand_voices directly** — no "suggest only" mode. Write target is `brand_voices.platform_hints[platform]` — never `full_voice_prompt`. Zero cross-platform contamination. Scott deletes rules via Settings panel. | Resolves brand_voices schema conflict. Write target precision-locked by D130. |
| D123 | **LinkedIn authority subjects for Scott Personal = weight loss + working with children** | Resolves Q35b. These anchor the Scott Personal LinkedIn generation prompt. |
| D124 | **Buffer Essentials plan ($5/ch/mo)** — required for >3 channels. Free plan (3-channel cap) insufficient for Phase 1. Team plan not required. Recommended start: 5–6 channels ($300–360/year); scale to 9 channels ($540/year) when LinkedIn audience justifies for NCHO + SomersSchool. | Hard blocker before Phase 1 development can be tested end-to-end. Updated by D131. |
| D125 | **Existing /social system is schema-only, never production-tested** — routes, schema, and UI patterns exist but were never production-tested. Phase 1 extends and refactors these patterns. | See Section 6.3 for deprecated brand/platform cleanup before Phase 1 sprint. |
| D126 | **52-week editorial calendar as backbone** — one topic/week → 3 blog posts/topic → publish to Shopify. Topic seeds locked before pipeline runs. | Blog anchor content structure (D119 Phase 1). |
| D127 | **Blog-first pipeline** — blog publishes → auto-triggers social generation → review queue. Social derives from published blog content. | Nothing goes to social without blog existing first. |
| D128 | **Newsletter review queue** — auto-generates when blog publishes → lands in review queue → Scott reads, edits, sends. Never auto-sends. | Human gate before every send. |
| D129 | **`user_id NOT NULL` on all social tables, Phase 1** — backfill `social_accounts` and `social_posts` in Phase 1 migration. | Resolves OI-04. 20 min now vs. painful schema audit later. |
| D130 | **Edit-to-learn write target is `platform_hints[platform]` only** — signals from post edits write to the platform-keyed slot in `platform_hints JSONB`, never to `full_voice_prompt`, `audience`, `tone`, or `rules`. `getBrandVoiceSystem()` reads base voice + appends platform hint at generation time. No schema migration required — `platform_hints` column already exists on `brand_voices` (migration 023). | Precision-locks D122 to eliminate cross-platform voice contamination. |
| D131 | **Anna does not need a separate Buffer login** — Essentials plan ($5/ch/mo) is sufficient; Team plan ($10/ch/mo) adds multi-user collaboration seats, not channels. Confirmed start: 5–6 channels (NCHO FB/IG + SomersSchool FB/IG + Scott Personal FB/IG = $300–360/year). Scale to 9 channels ($540/year) when LinkedIn audience justifies for NCHO + SomersSchool. | Supersedes D124 Team plan requirement. |

---

## APPENDIX A — DEFERRED FEATURES (Phase 4+ / "Someday" Lane)

These are real ideas from the brainstorm that are not wrong — they are premature. File them here.

- Full auto-publish without human review gate (until trust-building criteria are verified per Section 2.7)
- TikTok pipeline with dog mascot (no current API path; revisit when account and TikTok Creator access are viable)
- YouTube Community post automation
- Evergreen recycling automation (Phase 2 lower priority)
- A/B testing framework for post copy variants
- Scott's own podcast (referenced in D117 as reciprocal guest target — requires launching the podcast first)
- Animaker/Kling AI video content pipeline for social
- Social listening for brand sentiment tracking across platforms
- Full AI auto-answer for generic comments (requires trust baseline and comment taxonomy validation first)
- Outbound growth tools targeting FB Group moderation

---

## APPENDIX B — SUPERSEDED DISCOVERY QUESTIONS

These questions from the brainstorm were answered in ways that made the original question moot, or they were superseded by later decisions. They should no longer appear in the main question flow.

- Early questions about X/Twitter strategy (answered: dropped D37)
- Early questions about TikTok API integration timeline (answered: deferred D38)
- Early questions about Anna's social media involvement (answered: deferred D41/D62)
- Questions about full-year pre-generation and batch approval workflows (superseded by D55 rolling model)
- Questions about high-volume automation without human gate (superseded by trust-building model + automation rights matrix)

---

## APPENDIX C — WHAT THIS DOCUMENT DOES NOT COVER

- ClassCiv / NextChapterHomeschool (completely separate product — never mention in social content)
- Alana Terry / Praying Christian Women (brand wall — completely deferred, D41)
- Anna's personal social media or podcast social presence
- NCHO Shopify store operations, product sourcing, or order management
- BibleSaaS social presence (not in scope for this build)
- Internal ops posting (job listings, team hiring, etc.) — Scott works alone

---

*End of Social Media Expansion Build Bible — Decisions Complete (April 2026)*
*All blocking open items (OI-01 through OI-10, Q35b, Buffer plan, system status) are resolved. Three deferred items (Q35, blog comments, podcast domain, ESA table) are non-blocking — revisit before their respective phases.*
*Phase 1 code complete (April 2026). Pre-smoke-test checklist: (1) Deploy to Vercel + Railway, (2) Upgrade Buffer to Essentials plan — start $300–360/year (5–6ch), scale to $540/year (9ch); D124/D131, Scott manual action, (3) Register `/api/webhooks/shopify-blog-post/` in Shopify dashboard under `blog_posts/create`, (4) Set `BREVO_API_KEY` in Railway env. Smoke test target: NCHO single Facebook post → generate → review → approve → schedule → verify appears in Buffer.*
*Track A Phase 1 development is COMPLETE. Decisions D118–D130 locked. Three deferred items (Q35, blog comments, podcast domain, ESA table) are non-blocking — revisit before their respective phases.*
