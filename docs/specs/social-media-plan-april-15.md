# Social Media Plan — April 15, 2026

> **Purpose:** NCHO content intelligence → content production pipeline. This document is the living brainstorm-to-build-bible for the next-generation social media system. It will be rewritten as the session progresses.
>
> **Pattern followed:** `.github/instructions/scott-dev-process.instructions.md` — The Dream Floor Brainstorm-to-Build-Bible.
>
> **Status:** 🟡 IN BRAINSTORM — Section 1 active. Do not build past open `⚠️ SCOTT DECIDES` gates.

---

## The Shape of What We're Trying to Build (working sketch — will be revised)

A content intelligence → content production pipeline for NCHO that:

1. **Plans** a quarter of blog topics in one session (13 weeks × 3 posts = 39 topics, themed weeks based on Scott's convictions + SEO opportunities)
2. **Generates** 3 blog posts per week around that week's theme (Claude Sonnet, SEO-optimized)
3. **Publishes** approved blogs to NCHO Shopify
4. **Atomizes** each published blog post into social posts across all 6 channels (5/channel at launch, 3/channel steady-state)
5. **Measures** what performed and feeds it back into the quarterly planning layer

This sketch will be re-written as Sections 1–8 surface the real shape.

---

## Decision Log

*(Decisions accumulate here as the conversation produces them.)*

1. **✅ Ground state: ZERO existing content.** No NCHO/SomersSchool/Accidental Teacher social has been produced on any platform. Pipeline is cold-start, not retrofit. *(Q1.1)*
2. **✅ Scope locked: 3 brands × 6 Buffer channels.** NCHO (FB Page, Pinterest, shared IG), SomersSchool (Pinterest, shared IG), The Accidental Teacher (FB Group, YouTube). Alana Terry, scott_personal, LinkedIn, TikTok, X/Twitter, Threads all out of scope. *(Q1.2)*
3. **✅ Documentation debt identified.** CLAUDE.md Phase 5 roster and `social_accounts` DB CHECK constraint both reflect the old/wrong assumption (NCHO + SomersSchool only, 6 uniform channels). Both must be corrected — separate task, blocks accurate sync output. *(Q1.2)*
4. **✅ The Accidental Teacher = Scott Somers.** Identity brand, not persona. Voice source of truth: [docs/strategy/biography.md](docs/strategy/biography.md). Canopy brand providing authority/trust; funnels organically to NCHO (store) and SomersSchool (SaaS). BRAND WALL with Alana Terry remains. Two channels: FB Group (community, not broadcast) and YouTube (long-form, separate production lane). *(Q1.3)*
5. **✅ YouTube in scope as brand surface, OUT of scope for short-social atomization.** Gets its own production stream. Treated separately from the blog→IG/FB/Pinterest atomization loop. *(Q1.3)*
6. **✅ TAT FB Group commercial policy: mixed, mission-first, commercial mentions only by deliberate Scott action.** AI pipeline tags all TAT posts `commercial_allowed: false` by default. Override is a manual, conscious decision — never an AI default. No automatic product CTAs on any TAT surface. *(Q1.4)*
7. **✅ Shared Instagram = Option A (tagged primary-audience per post). NCHO is the gateway brand.** Each IG post gets a `primary_brand` tag (NCHO or SomersSchool). NCHO is the front door — "you get to SomersSchool through NCHO." The shared feed brings both brands together, but NCHO sets the tone. SomersSchool posts on the shared IG should feel like natural extensions of the NCHO world, not a separate brand shouting. The funnel is NCHO → SomersSchool, and the IG reflects that. *(Q1.5)*
8. **✅ Launch cadence: 5 posts/channel/week (30 total). Steady-state (Day 91+): 3 posts/channel/week (18 total).** Cold start demands volume. Step-down at 90 days once algorithmic presence is established. *(Q1.6)*
9. **✅ Scott is sole approver.** Anna is not in the review queue workflow. One human, one queue. Pipeline UX must support fast batch approval (~4-5 posts/day). *(Q1.6b)*
10. **✅ Weekly batch review, evening session.** Generate full week's content in advance → Scott reviews once per week in the evening → approves/edits/rejects the whole batch → Buffer drips posts across the week. Current cron (Monday 05:00 UTC = Sunday 7 PM Alaska) already fits this rhythm. *(Q1.7)*
11. **✅ Blog-first content architecture.** Blog posts are the atomic unit — social is derived, never original. 3 blogs/week (themed), 30 social posts/week atomized from them. Quarterly scope & sequence (13 weeks planned at once). Scott provides passion/conviction, pipeline provides structure/SEO/volume. Scott has never written a blog post — Chapterhouse generates, Scott approves. *(Q2.4)*

---

## ⚠️ Open Gates

*(Questions Scott must answer before we build past them. Resolved gates move to the Decision Log above.)*

- **⚠️ GATE-A — Cold-start architecture.** Blog-first-then-atomize assumes blog posts exist. We have zero. Do we (a) hold social until the first blog ships, (b) produce cold-start social in parallel with blog production, or (c) something else? Revisit in Section 7 (Ship Order).
- **⚠️ GATE-B — The Accidental Teacher brand definition.** Not in any existing brand-voice doc. Needs audience, voice rules, editorial posture, and relationship to NCHO/SomersSchool (cross-promote? walled?). Must be defined before content generates for it. *(Q1.3 is addressing this now.)*
- ~~**⚠️ GATE-C — Shared Instagram editorial rule.**~~ **✅ RESOLVED.** Option A — tagged primary-audience per post. NCHO is the gateway brand; SomersSchool is reached through NCHO. See Decision #7.
- **⚠️ GATE-D — Facebook Group vs Page behavior.** Accidental Teacher FB Group is a community surface. Posting AI-generated broadcast content in a community group is a good way to kill it. Need a specific rule for what goes in that channel.
- **⚠️ GATE-E — YouTube treatment.** Long-form. Doesn't fit the short-social atomization loop. Is YouTube part of this pipeline at all, or does it get its own separate production plan?

---

## Section 1 — The Daily Reality

**Purpose:** Ground truth. What Scott and Anna actually do today when producing content for NCHO. Not what they wish they did. What they did last Tuesday.

### Q1.1 — First behavior

**Q:** The last time you or Anna produced a piece of content for NCHO — a social post, a blog post, a product description, anything — walk me through it from the moment you sat down. What tool opened first? What got finished? What got abandoned halfway?

**A (Scott, April 15, 2026):** *"We haven't at all. We are literally starting from Zero on all of our social media. That is why I want high production many times per week on all platforms."*

### ⚡ Key Extractions from Q1.1

- **Ground state: ZERO.** No existing NCHO social content has been produced on any platform. No blog posts have been published yet to the NCHO Shopify blog.
- **Implication:** This is a **cold-start system**, not a retrofit. No existing content to atomize from on day one. No audience signal yet. No historical engagement data to score against.
- **Target cadence:** "High production, many times per week, all platforms."
- **Implication:** Volume-first architecture. The pipeline must be able to sustain multi-post-per-week output across every active brand × platform combination without Scott or Anna becoming the bottleneck.
- **Chicken-and-egg:** The "blog anchors everything, social atomizes from blog" architecture Polgara proposed last session assumes blog posts exist. With zero blog posts, the pipeline either (a) produces blogs first and holds social until blogs publish, or (b) runs two parallel tracks — cold-start social + catching-up blog production — until the blog anchor is healthy. This is an open architectural question. **Parked as ⚠️ Gate.**

### Q1.2 — Scope (brands + channels in Buffer)

**Q:** What's actually connected in Buffer? Which brands, which platforms?

**A (Scott, April 15, 2026, with Buffer screenshot):** Six channels. **The CLAUDE.md documentation is wrong.** Actual live Buffer roster:

| # | Buffer channel | Platform | Brand | Notes |
|---|---|---|---|---|
| 1 | `ncho.somerschool` | Instagram | **NCHO + SomersSchool (SHARED)** | Single IG account serving two brands — editorial constraint |
| 2 | `Next Chapter Homeschool` | Facebook **Page** | NCHO | Broadcast-style |
| 3 | `nextchapterhomeschool` | Pinterest | NCHO | |
| 4 | `The Accidental Teacher` | Facebook **Group** | The Accidental Teacher | Community — discussion-first, not broadcast |
| 5 | `scosom2280` → rename to *SomersSchool* | Pinterest | SomersSchool | Needs Buffer-side rename |
| 6 | `TheAccidentalTeacher` | YouTube | The Accidental Teacher | Long-form — NOT a short-form social surface |

### ⚡ Key Extractions from Q1.2

- **Active brands: 3 (not 2 as docs claimed).** NCHO, SomersSchool, **The Accidental Teacher.**
- **The Accidental Teacher is a live brand we did not previously document.** It has its own Facebook Group and YouTube channel. It needs a brand voice entry, a DB enum value, a defined audience, and an editorial posture.
- **Instagram is shared NCHO + SomersSchool.** Single channel, dual-brand editorial job. Any IG post must either (a) serve both audiences, or (b) be framed so the non-target audience doesn't feel alienated.
- **Facebook surfaces are different species.** NCHO has a Facebook **Page** (broadcast). The Accidental Teacher has a Facebook **Group** (community). The same "facebook" label in the DB hides this difference — the atomization pipeline must know the surface type, not just the platform name.
- **YouTube is in scope but different.** Long-form video. Does NOT slot into the "atomize blog post → short social post" loop directly. Treated separately in Section 7.
- **Naming cleanup task:** `scosom2280` Pinterest → SomersSchool (cosmetic Buffer-side rename, not a code change).
- **DOC DEBT:** CLAUDE.md Phase 5 description and the social_accounts DB CHECK constraint both reflect the old assumed roster. Both need updating before the social page sync would produce accurate data. **Separate from this pipeline build but blocking if not fixed first.**

### ✅ DECISION LOCKED — Scope of this pipeline

**Three brands × three surface types = 6 channels.**

| Brand | Channels |
|---|---|
| NCHO | Facebook Page, Pinterest, Instagram (shared) |
| SomersSchool | Pinterest, Instagram (shared) |
| The Accidental Teacher | Facebook Group, YouTube |

**Out of scope for this plan:** Alana Terry (brand wall — no cross-promo), `scott_personal` brand enum (not an active Buffer channel), LinkedIn, TikTok, X/Twitter, Threads.

### ⚠️ New gates surfaced by this answer

- **⚠️ GATE-B — The Accidental Teacher brand definition.** Not in any existing brand-voice doc. Needs audience, voice rules, editorial posture, and relationship to NCHO/SomersSchool (cross-promote? walled?). Must be defined before content generates for it.
- **⚠️ GATE-C — Shared Instagram editorial rule.** One feed, two brands. Do we (a) tag each post as primary NCHO or primary SomersSchool with a secondary-audience guardrail, (b) always produce "dual-brand" posts that serve both, or (c) something else?
- **⚠️ GATE-D — Facebook Group vs Page behavior.** Accidental Teacher FB Group is a community surface. Posting AI-generated broadcast content in a community group is a good way to kill it. Need a specific rule for what goes in that channel.
- **⚠️ GATE-E — YouTube treatment.** Long-form. Doesn't fit the short-social atomization loop. Is YouTube part of this pipeline at all, or does it get its own separate production plan?

### Q1.3 — The Accidental Teacher brand identity

**Q:** What is The Accidental Teacher as a brand? Audience, voice, editorial job, relationship to NCHO/SomersSchool?

**A (Scott, April 15, 2026):** *"It's not a brand as much as it is me. My story, my biography. You need to search for that, it exists all over, and that has my journey."*

**Source document read:** [docs/strategy/biography.md](docs/strategy/biography.md) — *"SCOTT SOMERS - THE ACCIDENTAL TEACHER"* (last updated December 5, 2025, living document).

### ⚡ Key Extractions from Q1.3

**The Accidental Teacher IS Scott Somers.** This is not a persona, not a spin-out brand, not a marketing construct. It is his public-facing self: the teacher, the father, the deacon, the man who went 363 → 254, the accidental full-time teacher of 6th–8th graders in Glennallen, Alaska.

**Audience:**
- Homeschool parents (Anna's broader audience, but reached through Scott's teacher credibility)
- Parents in public/private school systems frustrated with curriculum bloat and standardized-test culture
- Fellow teachers who recognize the pattern and have no way out of the system alone
- A general Christian/conservative-adjacent audience drawn to the testimony itself (weight loss, fatherhood, faith, Alaska frontier life, AI-as-capacity-multiplier story)

**Voice (from biography + dev process + CLAUDE.md):**
- **Conviction-forward.** Not curious, decided. Reformed Baptist. Conservative libertarian constitutionalist. Meets "feels about it" with "here's what I actually do about it."
- **Story-driven.** The hallway floor, the iron-in-the-basement, the classroom gallery, the accidental journey. These are the anchors. Every post ties to lived experience, not abstract education theory.
- **Sarcastic with bone-deep affection.** Same voice Scott has with Tic. Same voice Gandalf already uses. ("Shut up, idiot." "After you, moron.") Roast with love underneath.
- **Direct. Irreverent. Unpolished.** Mediocre at math and doesn't hide it. Breaks into "Ice Ice Baby" mid-lesson. Grounds random 7th graders in the hallway just to tell them they matter. Cusses.
- **Never says "my student" — always says "my child" / "these kids" / "this kid."** Even in teaching context.

**Editorial job (two surfaces, two different jobs):**

| Surface | Job | Cadence model | What it looks like |
|---|---|---|---|
| **FB Group — The Accidental Teacher** | **Community** — not broadcast. Parents + teachers + homeschool folks who resonate with the story, showing up for discussion, stories, questions, behind-the-scenes. Generated AI broadcast content here is *the fastest way to kill a group*. | Low-frequency, high-value posts. Prompts that start conversation. Stories that invite response. | "Here's what happened in 7th grade math today." "Tic and I hit a new PR — here's the lesson." "Parent question: how do you handle [X] with a kid who [Y]?" |
| **YouTube — TheAccidentalTeacher** | **Long-form testimony and teaching.** Story-driven content where the mission gets expressed fully. Classroom moments (with consent), weight loss journey, AI-multiplier-of-capacity story, Alaska Native integration, father-son gym, "why homeschool curriculum is broken and what to do about it." | Not short-social-atomization output. Treated as its own production stream. | Out of scope for atomization pipeline. Handled separately. |

**Relationship to NCHO and SomersSchool:**
- The Accidental Teacher is the **canopy** — the authority and story layer that gives NCHO and SomersSchool their credibility. "You can trust this curriculum because the guy who built it is an actual teacher who actually did this."
- Therefore **cross-promotion FROM Accidental Teacher → NCHO and SomersSchool is core, not violation.** That's the funnel.
- **Alana Terry remains walled** (separate audience, separate brand promise, per the non-negotiable BRAND WALL rule). Accidental Teacher does not mention Alana Terry books or PCW podcast.
- NCHO and SomersSchool can *reference* Scott's story/authority, but each has its own distinct voice (Anna's warm-teacher-curator for NCHO; confident-secular-progress-visible for SomersSchool) and those voices stay dominant in their own channels.

**The Five Non-Negotiables (from biography, apply to every TAT post):**
1. Meet kids where they are — not where curriculum designers think they should be
2. Gamify education — make it irresistible, not insufferable
3. Cut the bloat — give families what they want, nothing they don't
4. AI-enhanced personalization — true adaptation, not corporate buzzwords
5. Relationship-focused — *"My life is better because you're in it"*

**Tagline:** *"Education that says: My life is better because you're in it."*

### ✅ DECISION LOCKED — TAT is Scott's public-facing identity brand

**Identity:** The Accidental Teacher = Scott Somers. Origin story, lived experience, daily classroom reality, AI-as-capacity-multiplier testimony. Not a persona. Him.

**Voice source of truth:** [docs/strategy/biography.md](docs/strategy/biography.md) + Gandalf's voice rules from global CLAUDE.md.

**Editorial job:** Canopy brand that provides trust and authority. Drives relationship, then funnels to NCHO (store) and SomersSchool (SaaS) as organic next-step. Does NOT cross Alana Terry brand wall.

**Channels in this pipeline:**
- ✅ FB Group (community, not broadcast — careful editorial hand required)
- ⚠️ YouTube — **separated** from short-social atomization; treated as its own production stream. Revisit in Section 7.

### ⚠️ Gates resolved by this answer

- **⚠️ GATE-B (TAT brand definition)** → **✅ RESOLVED.** TAT is Scott. Voice source = biography.md.
- **⚠️ GATE-E (YouTube treatment)** → **✅ PARTIALLY RESOLVED.** YouTube is in scope as a brand surface but OUT of scope for the short-form atomization pipeline. Gets its own production lane.

### ⚠️ Gates still open

- **GATE-A** (cold-start architecture) — Section 7
- **GATE-C** (shared IG editorial rule) — still open
- **GATE-D** (FB Group vs Page behavior) — clarified by biography (Group = community-first), but we need a hard editorial rule for what kind of AI-generated content ever goes into the TAT FB Group vs. what has to be hand-written by Scott personally

### Q1.4 — Commercial intent on Scott-surfaces (TAT FB Group)

**Q:** What's the ideal commercial outcome when someone follows The Accidental Teacher FB Group? (A) Funnel to NCHO/SomersSchool paying customer, (B) Pure testimony/ministry no commercial asks, or (C) Mixed — mostly mission/community, occasional soft promotional mention when it genuinely fits the moment?

**A (Scott, April 15, 2026):** **C — Mixed.**

### ⚡ Key Extractions from Q1.4

- **TAT default posture: mission-first, community-first.** Commercial mentions are the exception, not the rule.
- **No automatic commercial injection.** AI-generated posts for TAT FB Group do not include product CTAs by default. The "check out [NCHO product / SomersSchool feature]" sentence is not something the AI writes on its own judgment.
- **The "fits the moment" test is a human gate.** A TAT post only carries a commercial mention when Scott (or Anna, acting for Scott's voice) explicitly decides this specific post fits the moment. The AI's job is to produce the story/teaching content; the commercial ask is Scott's call to add.
- **Commercial mentions, when they happen, are soft.** Not "BUY NOW." Something like "if this resonates, Anna has a curriculum bundle that came out of this exact lesson — link in pinned post" — story continues into product as a natural extension, not a hard turn.
- **No numeric ratio locked** (Scott did not specify "1 in 10"). Interpretation: it's moment-dependent, not rate-dependent. Some weeks zero commercial mentions. A week with a new NCHO product launch that actually fits a story Scott is telling, maybe one. The AI cannot enforce this ratio — only Scott can.

### ✅ DECISION LOCKED — TAT FB Group commercial policy

- **Default content type for TAT FB Group = mission/community/story.** No product CTAs.
- **AI pipeline outputs for TAT FB Group are always the non-commercial variant.**
- **A TAT commercial post is always a deliberate Scott action** — it's an opt-in override, not an AI default.
- **Enforcement hook:** when/if the atomize route writes to TAT surfaces, it must tag the post as `commercial_allowed: false` by default. Overriding that flag is a conscious choice in the UI.

### ⚠️ Gates resolved

- **⚠️ GATE-D (TAT FB Group editorial rule)** → **✅ RESOLVED** for commercial policy. Still needs rule for which kinds of posts can be AI-generated vs. must be Scott-written — addressed in Section 3 (Core Vision) when we define the per-surface generation policy matrix.

### ⚠️ Gates still open

- **GATE-A** (cold-start architecture) — Section 7
- **GATE-C** (shared IG editorial rule) — **next, Q1.5**

### Q1.5 — The shared Instagram editorial rule

**Q:** One IG feed, two brands (NCHO + SomersSchool). Do we (a) tag each post as primary NCHO or primary SomersSchool with a secondary-audience guardrail, (b) always produce "dual-brand" posts that serve both, or (c) something else?

**A (Scott, April 15, 2026):** *"A. I want this to be a place that really brings both brands together because you get to SomersSchool through NCHO."*

### ⚡ Key Extractions from Q1.5

- **NCHO is the gateway brand on Instagram.** The shared IG is not a 50/50 split — NCHO sets the tone, SomersSchool is the natural next step for parents who are already in the NCHO world.
- **Funnel direction is explicit: NCHO → SomersSchool.** Not parallel. Not interchangeable. NCHO introduces the family to the homeschool ecosystem. SomersSchool is what they graduate into when they want structured curriculum with AI personalization.
- **Each post tagged `primary_brand`.** The pipeline must know which brand anchor each IG post serves. This is not cosmetic — it drives voice selection, CTA direction, and engagement scoring.
- **SomersSchool IG posts are NCHO-adjacent, not standalone.** A SomersSchool-primary IG post should still feel like it belongs in the NCHO feed. It's a natural extension ("here's what structured learning looks like"), not a context-switch.
- **Implication for pipeline:** The generate route needs a `primary_brand` field on shared-IG posts, and the brand voice should soften the SomersSchool tone to blend with NCHO's warm-teacher-curator feel on this specific surface. SomersSchool's confident-secular voice is for its own Pinterest — not for the shared IG.

### ✅ DECISION LOCKED — Shared Instagram = NCHO-first, tagged per post

- **Primary brand tag on every shared-IG post.** `primary_brand: 'ncho' | 'somersschool'`
- **NCHO is the dominant voice.** SomersSchool-primary posts on the shared IG use a blended voice — SomersSchool content delivered in NCHO-adjacent warmth.
- **Funnel: NCHO → SomersSchool.** The IG is the bridge. NCHO introduces. SomersSchool converts.
- **No standalone SomersSchool hard-sell on shared IG.** Product mentions for SomersSchool on this surface are "here's what we built for your family" — same organic tone as TAT → NCHO funnel.

### ⚠️ Gates resolved

- **⚠️ GATE-C (shared IG editorial rule)** → **✅ RESOLVED.** Option A — tagged primary-audience, NCHO is the gateway.

### ⚠️ Gates still open

- **GATE-A** (cold-start architecture) — Section 7
- **GATE-D** (TAT FB Group AI vs hand-written) — partially resolved (commercial policy locked); still needs rule for which posts can be AI-generated vs must be Scott-written. Section 3.
- **GATE-E** (Blog→social timing) — should social generation wait for blog approval or pre-generate from drafts? Section 3.

### Q1.6 — Production cadence and Anna's role

**Q:** How many posts per week per channel? Who approves?

**A (Scott, April 15, 2026):** *"5 to start, then after like, 90 days we'll reduce to 3."*

### ⚡ Key Extractions from Q1.6 (partial — cadence locked, approval TBD)

- **Launch cadence: 5 posts/week × 6 channels = 30 pieces of content per week.** This is aggressive and intentional — cold start demands volume to build algorithmic presence.
- **Steady-state cadence (Day 91+): 3 posts/week × 6 = 18 per week.** The step-down is smart — by Day 90 you'll know which channels are performing and can reallocate effort.
- **Pipeline implication:** The weekly cron currently generates 18/week (3 brands × 3 platforms × 2 each). Launch phase needs 30/week — cron config needs a `cadence_multiplier` or simply a `posts_per_channel` setting that drops from 5 to 3 at the 90-day mark.
- **Blog anchor math:** If each blog post atomizes into ~3-5 social posts per channel, launch cadence needs roughly 2-3 blog posts per week to feed 30 social posts. Steady-state needs 1-2.

### ✅ DECISION LOCKED — Launch cadence 5/week, steady-state 3/week

- **5 posts/channel/week for first 90 days** (30 total/week across 6 channels)
- **3 posts/channel/week after Day 91** (18 total/week)
- **Decision #8 in Decision Log**

### Q1.6b — Who approves?

**Q:** 30 posts/week hitting the review queue. Who approves — you, Anna, or both? Daily rhythm or ad hoc?

**A (Scott, April 15, 2026):** *"me"*

### ⚡ Key Extractions from Q1.6b

- **Scott is the sole approval gate.** Anna is not in the review queue workflow. This simplifies the pipeline — one human, one queue, one set of judgment calls.
- **Implication: Scott needs a fast approval flow.** 30 posts/week = ~4-5 posts/day to review. If each takes 30 seconds to scan + approve, that's ~2.5 minutes/day. If editing is needed, maybe 10-15 minutes. The review queue UX must be optimized for batch approval — swipe-through, not click-into-each-card.
- **No Anna handoff needed.** No shared permissions complexity, no "who approved what" audit trail beyond Scott.

### ✅ DECISION LOCKED — Scott is sole approver

- **Decision #9 in Decision Log**

---

That wraps the ground-truth questions for Section 1. Let me write the Section 1 summary extractions and move to Section 2.

*(awaiting answer for Q1.7 below)*

### Q1.7 — Daily rhythm

**Q:** When does this happen in your day? Overnight batch or drip throughout the day?

**A (Scott, April 15, 2026):** *"Probably in the evening, but I want to approve a week's worth at a time."*

### ⚡ Key Extractions from Q1.7

- **Weekly batch approval, not daily.** Scott sits down once a week (evening), reviews the full queue (~30 posts at launch), approves/edits/rejects the whole batch in one session.
- **Pipeline must generate the full week's content in advance.** All 30 posts for the coming week need to be ready and waiting in the review queue before Scott's evening session.
- **Scheduling matters.** Approved posts must be spread across the week (not all published Monday). Buffer handles the drip — pipeline needs to auto-assign `scheduled_for` dates across the 7 days when generating.
- **UX implication: batch approval mode.** The review queue needs a "select all" or rapid-fire swipe mode. Reviewing 30 posts one card at a time is death. Think: scan → edit the 3 that need it → approve the rest in bulk.
- **Generation cron timing:** Generate the full week's batch Sunday night or Monday early AM → Scott reviews Monday or Tuesday evening → posts drip all week. Current cron is Monday 05:00 UTC (Sunday 7 PM Alaska) — that's actually perfect timing for a Sunday-night generate → Monday-evening review cycle.

### ✅ DECISION LOCKED — Weekly batch review, evening session

- **Decision #10 in Decision Log**

---

## ⚡ SECTION 1 SUMMARY — The Daily Reality

**Who:** Scott only. Sole approver. Anna is not in the social pipeline.

**What:** 30 posts/week at launch (5/channel × 6 channels), stepping down to 18/week (3/channel) at Day 91.

**When:** Weekly batch. Generate Sunday night → Scott reviews one evening → approved posts drip all week via Buffer scheduling.

**Where (6 channels):**
| Channel | Brand | Surface Type | Special Rules |
|---|---|---|---|
| Next Chapter Homeschool FB Page | NCHO | Broadcast | Warm teacher-curator voice |
| nextchapterhomeschool Pinterest | NCHO | Discovery/SEO | Keyword-rich, save-worthy |
| ncho.somerschool IG (shared) | NCHO + SomersSchool | Gateway funnel | Tagged `primary_brand` per post. NCHO is front door. |
| The Accidental Teacher FB Group | TAT (Scott) | Community | `commercial_allowed: false` default. AI-drafted OK, but community tone. |
| scosom2280 Pinterest | SomersSchool | Discovery/SEO | Confident, secular |
| TheAccidentalTeacher YouTube | TAT (Scott) | Long-form | Separate production lane. NOT in blog→atomization loop. |

**How:** Blog posts on NCHO Shopify are the anchor content. Social posts atomized from blogs. YouTube is a separate stream.

**Cold start:** Zero existing content on any platform. Volume-first strategy for 90 days.

**Commercial policy:** TAT surfaces default `commercial_allowed: false`. NCHO/SomersSchool surfaces allow organic product mentions. No hard-sell anywhere.

**Funnel:** TAT → NCHO → SomersSchool (trust → store → SaaS)

---

---

## Section 2 — The Frustration Inventory

### Q2.1 — The core frustration

**Q:** What's the single most frustrating thing about social media right now?

**A (Scott, April 15, 2026):** *"That it is very overwhelming to manage on a day by day basis and very easy to get burned out. Posting at this frequency would be a full time job for a single social media manager. I don't have that time or those resources."*

### ⚡ Key Extractions from Q2.1

- **The enemy is not quality — it's volume × consistency × time.** Scott knows what needs to happen (5/channel/week). He knows he can't do it manually. That's not a preference — it's a physics problem. Full-time teacher. Full-time builder. 40 days to contract end.
- **Burnout is the kill vector, not incompetence.** This is a man who's shipped 47 repos and 2,526 commits. He doesn't lack ability. He lacks hours. The pipeline's job is to make 30 posts/week feel like 15 minutes of Scott's time, not 15 hours.
- **"Full time job for a single social media manager" = the cost Scott is replacing with AI.** The pipeline IS the social media manager. Scott is the creative director who approves the work. The pipeline generates, schedules, and measures. Scott reviews once a week.
- **This validates the weekly-batch-approve decision (Q1.7).** Daily management is what causes burnout. Weekly batch review is the antidote. The pipeline must be autonomous enough that Scott can ignore it for 6 days and sit down once to a clean, ready queue.
- **Implication: the pipeline cannot require daily babysitting.** No "check this," no "this failed, retry manually," no "the Buffer token expired." It must run silently and surface problems only when something is actually broken.

### Q2.2 — What have you tried before?

**Q:** Have you or Anna ever tried to maintain a posting schedule on any platform?

**A (Scott, April 15, 2026):** *"She does for her Praying Christian Women instagram and her True Crime Junkies podcast, but it is a massive job for her."*

### ⚡ Key Extractions from Q2.2

- **Anna has direct experience with the pain.** She maintains posting schedules for PCW IG and True Crime Junkies podcast — and confirms it's a massive time sink. This isn't theoretical burnout risk. There's a household data point.
- **Scott has NOT personally maintained a posting schedule.** The NCHO/SomersSchool/TAT channels have zero history. This means the pipeline is building a habit from scratch, not rescuing a broken one.
- **Anna's experience is on the BRAND WALL side.** PCW and True Crime Junkies are Alana Terry brands — completely separate from NCHO/SomersSchool/TAT. Her workflow and content patterns are hers. We don't cross-pollinate. But her lived experience of the time cost validates the pipeline's core value prop.
- **The pipeline must be so good that Anna eventually wants one too.** Not our problem today. But if this works for Scott's 30 posts/week, Anna will see it. That's a future revenue conversation (SaaS the pipeline itself? Later.).
- **No institutional knowledge to migrate.** No "we used to do X" patterns to preserve. Greenfield is confirmed across all NCHO/SomersSchool/TAT surfaces.

### Q2.3 — Content creation itself

**Q:** When you think about writing a social media post — what stops you?

**A (Scott, April 15, 2026):** *"I literally haven't started. What stops me is not knowing what the long term plan is and how I'll have time to do it justice."*

### ⚡ Key Extractions from Q2.3

- **The blocker is not creative — it's strategic.** Scott can write. Scott can think. What he won't do is start posting without a plan, because he knows random posting without strategy is wasted effort. This is discipline, not paralysis.
- **"Do it justice" = Scott won't half-ass it.** He'd rather ship nothing than ship garbage. This is the same instinct that produced 47 repos and a complete SaaS platform in 6 months. The standard is high. The pipeline must meet that standard or Scott will override it and do it himself (which means it won't get done).
- **THIS BRAINSTORM IS THE BLOCKER REMOVAL.** The long-term plan Scott needs before he can start? We're building it right now. When this document becomes the build bible, the "I don't know the plan" blocker evaporates. Then the pipeline handles the "I don't have time" blocker.
- **Two blockers, two solutions:**
  1. "Not knowing the long-term plan" → this spec document (Sections 1-8 → build bible)
  2. "Not having time to do it justice" → the pipeline (AI generates, Scott reviews weekly)
- **Quality bar is non-negotiable.** The pipeline must produce content Scott is proud to put his name on. If he has to rewrite every post, the pipeline failed. If he approves 25/30 with zero edits, the pipeline succeeded.

### Q2.4 — The blog anchor

**Q:** Have you written any blog posts? Is Shopify blog set up? What does a good blog post look like to you?

**A (Scott, April 15, 2026):** *"No, no, and what's best for the market and SEO. I have never, once, in my life, written a blog post, but I know that people still use them. The blog posts are something that Chapterhouse must help me generate. So let's say, I come and say, let's generate one quarter's worth of ideas, and we generate 3 blog posts ideas per week for 3 months. We come up with a scope and sequence for the posts, say, today I am really pissed about the fact that our students in our middle school take 12 total standardized tests per year and I hate it hate it hate it, so I want to have that be maybe a week's worth of blog posts, and then Sonnet will help me generate. I'll approve the three when they're done, then Chapterhouse will post to NCHO and develop social media for that week based on those. I hope that makes sense."*

### ⚡ Key Extractions from Q2.4 — THIS IS THE PIPELINE ARCHITECTURE

This answer reshapes everything. The pipeline is not "write social posts." The pipeline is:

1. **Quarterly planning session.** Scott sits down with Chapterhouse, says "give me 13 weeks of blog ideas." AI proposes a scope & sequence — themed weeks, topic arcs, seasonal hooks, SEO targets. Scott approves/edits the calendar. This happens ONCE per quarter.

2. **Weekly blog generation.** Each week has a theme (e.g., "standardized testing is broken"). Chapterhouse generates 3 blog posts around that theme using Claude Sonnet. Scott reviews and approves the three.

3. **Auto-publish to NCHO Shopify.** Approved blog posts get published to the NCHO Shopify blog (Blog Pipeline Phase 16 already exists for this).

4. **Auto-atomize into social posts.** Once a blog post is published, the pipeline atomizes it into social posts across all 6 channels (5 per channel at launch). The social posts are derived FROM the blog — they're not independent creations.

5. **Weekly batch review.** The atomized social posts land in the review queue. Scott approves the batch in one evening session.

**The architecture is now clear:**

```
Quarterly Planning (once)
    → 13 weeks × 3 blog ideas = 39 blog topics
    → Scott approves the calendar

Weekly Cycle (repeats):
    Monday: Chapterhouse generates 3 blog posts for this week's theme
    Tuesday: Scott reviews + approves blogs (evening)
    Tuesday night: Approved blogs → publish to NCHO Shopify
    Wednesday AM: Pipeline atomizes published blogs → 30 social posts
    Wednesday evening: Scott reviews + approves social batch
    Thursday–Sunday: Buffer drips approved posts across all channels
```

- **Scott's total weekly time commitment: ~30 minutes.** 15 min reviewing 3 blog posts + 15 min scanning 30 social posts.
- **Blog posts are the SINGLE SOURCE OF TRUTH for content.** Social is derivative. No orphan social posts. Everything traces back to a blog.
- **Passion-driven topic injection.** "I'm pissed about standardized testing" → that rage becomes a themed week. The pipeline channels Scott's convictions into structured content. This is not generic content marketing — it's Scott's actual opinions, amplified.
- **SEO-first blog strategy.** Scott doesn't know blog craft and doesn't need to. The pipeline handles SEO optimization, keyword targeting, structure. Scott provides the fire. Sonnet provides the form.
- **The existing Blog Pipeline (Phase 16) is the foundation.** `blog_posts` table, `blog/draft/[id]`, `blog/publish/[id]` — all exist. What's missing: quarterly calendar generation, theme-based multi-post generation, and the blog→social atomization bridge.

### ✅ DECISION LOCKED — Blog-first content architecture

- **Blog posts are the atomic unit.** Social is derived, never original.
- **3 blogs/week, themed. 30 social posts/week atomized from them.**
- **Quarterly scope & sequence for blog topics.** 13 weeks planned at once.
- **Scott provides passion/conviction. Pipeline provides structure/SEO/volume.**
- **Decision #11 in Decision Log**

### Q2.5 — The trust question

**Q:** What would make an AI-generated blog post feel like "you" vs. "a robot wearing your jacket"?

**A (Scott, April 15, 2026):** *"We will run every generated blog through the same structural passes that we have in the SomersSchool curriculum factory."* + *"I also want it to be specific to chapterhouse and social media, so the characters need to be different."*

**Follow-up:** Scott wants ~36 possible 6-person lineups pitched. He'll narrow to 4+, then iterate.

### Content Council — Candidate Lineups

**The 6 Passes (same architecture as curriculum factory, different expertise):**

| Pass | Role | Job |
|------|------|-----|
| 1 | **Drafter** | Writes the blog from Scott's conviction/topic seed |
| 2 | **Analyst** | SEO, structure, readability, keyword targeting |
| 3 | **Voice** | Brand tone, authenticity, warmth, "does this sound human?" |
| 4 | **Strategist** | Business value, CTA, funnel, what does this sell? |
| 5 | **Stress Tester** | Comments survival, preach check, repetition, cringe audit |
| 6 | **Extractor** | Structured output (title, slug, SEO, atomization hooks) |

---

#### LINEUP 1 — "The Newsroom"
*Theme: journalism meets content marketing. Gritty, deadline-driven, truth-first.*

| Pass | Character | Source | Why |
|------|-----------|--------|-----|
| 1 | **Will McAvoy** | *The Newsroom* (Sorkin) | Writes from conviction. Doesn't do balanced — does correct. Angry about the right things. |
| 2 | **Charlie Skinner** | *The Newsroom* | Old-school editor. Structure, flow, "does the lede bury the point?" |
| 3 | **Sloan Sabbith** | *The Newsroom* | Razor-sharp voice. Makes complex things accessible without dumbing down. |
| 4 | **Mackenzie McHale** | *The Newsroom* | Executive producer. Knows what story drives ratings (traffic). Every segment needs a reason to exist. |
| 5 | **Don Keefer** | *The Newsroom* | The cynic who watches the internet eat people alive. "Twitter will destroy this in four minutes." |
| 6 | **Jim Harper** | *The Newsroom* | Methodical. Builds the rundown. Gets the metadata right. |

---

#### LINEUP 2 — "Mad Men"
*Theme: advertising's golden age. Persuasion, positioning, the pitch.*

| Pass | Character | Source | Why |
|------|-----------|--------|-----|
| 1 | **Don Draper** | *Mad Men* | The pitch. The idea. The emotional hook that makes you feel before you think. |
| 2 | **Peggy Olson** | *Mad Men* | Structural craft. Grew from secretary to creative director. Knows both the art and the grind. |
| 3 | **Joan Holloway** | *Mad Men* | Voice and presence. Knows how to make every word land. Brand is her native language. |
| 4 | **Pete Campbell** | *Mad Men* | Accounts man. Knows the client (the customer). What sells, what doesn't, what the market wants. |
| 5 | **Roger Sterling** | *Mad Men* | The quip that cuts. If the copy is boring, Roger will say so in six words. |
| 6 | **Harry Crane** | *Mad Men* | Media and numbers. Metrics. The machine side. |

---

#### LINEUP 3 — "The West Wing"
*Theme: persuasion through policy. Message discipline. Every word matters.*

| Pass | Character | Source | Why |
|------|-----------|--------|-----|
| 1 | **Sam Seaborn** | *The West Wing* | Beautiful writer. Conviction turned into prose. The guy who rewrites the State of the Union at 3 AM because the words matter. |
| 2 | **C.J. Cregg** | *The West Wing* | Press Secretary. Knows what the audience will ask, what they'll misread, what headline they'll write. |
| 3 | **Toby Ziegler** | *The West Wing* | Voice of conscience. If it's not true, he'll burn it. Dark, principled, no bullshit. |
| 4 | **Josh Lyman** | *The West Wing* | Political strategist. What's the angle? Who does this move? What's the win? |
| 5 | **Ainsley Hayes** | *The West Wing* | The loyal opposition. Argues the other side honestly. If she can poke holes, the comments section will too. |
| 6 | **Donna Moss** | *The West Wing* | Organized, methodical, makes the machine run. Gets it formatted and filed. |

---

#### LINEUP 4 — "The Office"
*Theme: absurdist reality check. If it works in Dunder Mifflin, it works anywhere.*

| Pass | Character | Source | Why |
|------|-----------|--------|-----|
| 1 | **Michael Scott** | *The Office* | Heart-first writing. Earnest to the point of pain. Says the thing everyone's thinking in the worst possible way — but the feeling is real. |
| 2 | **Oscar Martinez** | *The Office* | "Actually..." The fact-checker. Pedantic but correct. |
| 3 | **Pam Beesly** | *The Office* | Warmth. Authenticity. The voice of the person who reads the blog and feels seen. |
| 4 | **Ryan Howard** | *The Office* | MBA brain. Startup energy. What's the growth hack? (Often wrong, but asks the right questions.) |
| 5 | **Stanley Hudson** | *The Office* | "Did I stutter?" If the content is boring, Stanley walks out. Zero patience for filler. |
| 6 | **Dwight Schrute** | *The Office* | Hyper-literal structural output. Will organize anything into a beet-farming efficiency matrix. |

---

#### LINEUP 5 — "Parks & Rec"
*Theme: civic passion meets marketing. Leslie Knope energy.*

| Pass | Character | Source | Why |
|------|-----------|--------|-----|
| 1 | **Leslie Knope** | *Parks & Rec* | Passionate first drafts. Will write 40 pages when you asked for 4. Over-delivers from love. |
| 2 | **Ben Wyatt** | *Parks & Rec* | Numbers. Structure. "That's literally not how budgets work." Catches the logical gaps. |
| 3 | **Ann Perkins** | *Parks & Rec* | The audience mirror. "Is this how a normal person would say this?" |
| 4 | **Tom Haverford** | *Parks & Rec* | Brand and marketing obsessed. Entertainment 720. Knows what's trendy even when he's wrong. |
| 5 | **Ron Swanson** | *Parks & Rec* | Strip it down. "This is too many words. Delete half of them." If Ron wouldn't read it, it's too long. |
| 6 | **April Ludgate** | *Parks & Rec* | Deadpan execution. Will format the structured output while hating every second and doing it perfectly. |

---

#### LINEUP 6 — "Seinfeld"
*Theme: observational content. The everyday made remarkable.*

| Pass | Character | Source | Why |
|------|-----------|--------|-----|
| 1 | **Jerry Seinfeld** | *Seinfeld* | Observational writing. "What's the deal with standardized testing?" Finds the universal in the specific. |
| 2 | **George Costanza** | *Seinfeld* | Overthinks everything. But that paranoia catches the SEO gaps and structural flaws nobody else sees. |
| 3 | **Elaine Benes** | *Seinfeld* | Editorial instinct (she was an editor). Voice and tone police. "This is not sponge-worthy." |
| 4 | **J. Peterman** | *Seinfeld* | Sells anything with a story. Turns a blog post into an adventure. Master of the product narrative. |
| 5 | **Larry David** (Curb) | *Curb Your Enthusiasm* | Social disaster antenna. If this will make people cringe, Larry knows first. |
| 6 | **Newman** | *Seinfeld* | Delivers the package. Gets it where it needs to go. Logistics and structure. |

---

#### LINEUP 7 — "Marvel/DC Editors"
*Theme: superheroes as content strategists.*

| Pass | Character | Source | Why |
|------|-----------|--------|-----|
| 1 | **Tony Stark** | *Marvel* | Writes fast, writes bold, engineers the narrative. Ego-driven first drafts that are annoyingly good. |
| 2 | **Jarvis/Friday** | *Marvel* | AI analyst. SEO metrics, readability scores, keyword optimization. No feelings, all data. |
| 3 | **Pepper Potts** | *Marvel* | Brand guardian. "You can't say that publicly, Tony." Makes it professional without killing the personality. |
| 4 | **Nick Fury** | *Marvel* | Strategic mind. What's the bigger play? How does this blog post serve the Avengers Initiative (the business)? |
| 5 | **Deadpool** | *Marvel* | Breaks the fourth wall. "Nobody's going to read this. I barely did." The cringe detector who makes you laugh while destroying your ego. |
| 6 | **Maria Hill** | *Marvel* | Executes the plan. Gets the structured output filed and deployed. |

---

#### LINEUP 8 — "Star Wars Rebels"
*Theme: rebellion as brand building. Insurgent marketing.*

| Pass | Character | Source | Why |
|------|-----------|--------|-----|
| 1 | **Ahsoka Tano** | *Star Wars* | Principled creator. Left the Jedi Order because she thought for herself. Writes from conviction, not doctrine. |
| 2 | **Thrawn** | *Star Wars* | Analyzes art to understand culture. Studies the market through its content. Tactical SEO through cultural intelligence. |
| 3 | **Hera Syndulla** | *Star Wars* | The heart. Keeps the crew together. Voice of "we're doing this for people, not metrics." |
| 4 | **Lando Calrissian** | *Star Wars* | The dealmaker. Smooth. Knows how to position a product as an opportunity, not a pitch. |
| 5 | **Chopper (C1-10P)** | *Star Wars* | Chaotic stress tester. Will sabotage anything that's not bolted down. If the content survives Chopper, it survives the internet. |
| 6 | **AP-5** | *Star Wars* | Inventory/logistics droid. Precise, annoyed, perfect structured output. |

---

#### LINEUP 9 — "Miyazaki Studio"
*Theme: beauty, craft, and respect for the audience.*

| Pass | Character | Source | Why |
|------|-----------|--------|-----|
| 1 | **Hayao Miyazaki** | *Studio Ghibli* | (as character) Creates from a place of wonder and fury simultaneously. Every frame matters. Every sentence should. |
| 2 | **Toshio Suzuki** | *Studio Ghibli* | Producer. Knows the market. Balances art with viability. Structure and timing. |
| 3 | **Sophie Hatter** | *Howl's Moving Castle* | The everywoman. Reads the blog and says "does this feel real?" Not flashy — grounded. |
| 4 | **Howl** | *Howl's Moving Castle* | Dramatic positioning. Makes everything feel more important than it is — which is marketing's job. |
| 5 | **Calcifer** | *Howl's Moving Castle* | "I don't cook. I'm a scary, powerful fire demon." Will roast bad content without mercy. Tiny but devastating. |
| 6 | **Turnip Head** | *Howl's Moving Castle* | Silently does the work. Reliable extraction. |

---

#### LINEUP 10 — "Anthony Bourdain's Kitchen"
*Theme: food, travel, culture. Authentic storytelling. Anti-pretension.*

| Pass | Character | Source | Why |
|------|-----------|--------|-----|
| 1 | **Anthony Bourdain** | *Parts Unknown* | Writes from lived experience. No pretension. Raw, honest, funny, devastating. Perfect Scott mirror for conviction-driven content. |
| 2 | **Alton Brown** | *Good Eats* | Science of food = science of content. Structure, methodology, "here's WHY this works." |
| 3 | **Julia Child** | Historical | "The only time to eat diet food is while waiting for the steak to cook." Authentic voice. Joy in craft. |
| 4 | **Gordon Ramsay** | *Kitchen Nightmares* | "This blog post is RAW." Business reality. Does this restaurant (store) survive or close? |
| 5 | **Guy Fieri** | *DDD* | Flavor check. If it's not FLAVORTOWN, it's boring. Energy and engagement stress test. |
| 6 | **Claire Saffitz** | *Bon Appétit* | Methodical. Precise. Tests the recipe (structured output) until it works every time. |

---

#### LINEUP 11 — "Brooklyn Nine-Nine"
*Theme: comedy procedural. Competence hidden behind chaos.*

| Pass | Character | Source | Why |
|------|-----------|--------|-----|
| 1 | **Jake Peralta** | *B99* | Creative, energetic, flies by instinct. Draft is messy and alive. |
| 2 | **Amy Santiago** | *B99* | Binder queen. Structure, organization, "there's a system for this." |
| 3 | **Captain Holt** | *B99* | Deadpan voice authority. "That sentence has too many adjectives. Remove twelve." Brand discipline. |
| 4 | **Rosa Diaz** | *B99* | Cuts through noise. "What's the point? Say it faster." Business directness. |
| 5 | **Charles Boyle** | *B99* | Unfiltered enthusiasm — if Charles thinks it's cringe, it's REALLY cringe. Sensitivity antenna. |
| 6 | **Gina Linetti** | *B99* | "I'm the human form of the 100 emoji." Social media native. Formats for the algorithm. |

---

#### LINEUP 12 — "Stranger Things"
*Theme: discovering the unknown. D&D party structure.*

| Pass | Character | Source | Why |
|------|-----------|--------|-----|
| 1 | **Dustin Henderson** | *Stranger Things* | Enthusiastic nerd. Explains complex things with infectious energy. |
| 2 | **Mr. Clarke** | *Stranger Things* | The science teacher. Structure, accuracy, "happy to help." |
| 3 | **Joyce Byers** | *Stranger Things* | Mama bear. Does this serve the parent who's scared and trying? Raw authenticity. |
| 4 | **Steve Harrington** | *Stranger Things* | Became a leader by accident. Practical strategy from unexpected places. |
| 5 | **Eddie Munson** | *Stranger Things* | Metalhead freak check. "Is this conformist garbage or does it actually SAY something?" |
| 6 | **Eleven** | *Stranger Things* | Minimal words, maximum extraction. Gets the structured output done with terrifying efficiency. |

---

#### LINEUP 13 — "Arrested Development"
*Theme: dysfunction that reveals truth. Narrator as quality gate.*

| Pass | Character | Source | Why |
|------|-----------|--------|-----|
| 1 | **Michael Bluth** | *AD* | The reasonable one trying to hold chaos together. Writes clear, grounded content. |
| 2 | **Narrator (Ron Howard)** | *AD* | "He didn't." Fact-checks every claim. Catches the gap between what you say and what's true. |
| 3 | **Maeby Fünke** | *AD* | "Marry me!" Audience instinct. Knows what people actually click on vs. what you think they'll click on. |
| 4 | **Lucille Bluth** | *AD* | "It's one banana, Michael. What could it cost, ten dollars?" Out-of-touch reality check from the other direction. |
| 5 | **Gob Bluth** | *AD* | "I've made a huge mistake." The content failure simulator. If Gob would post it, don't. |
| 6 | **Buster Bluth** | *AD* | Surprisingly competent at specific tasks. Meticulous structured output. |

---

#### LINEUP 14 — "The Wire"
*Theme: systems thinking. How institutions actually work.*

| Pass | Character | Source | Why |
|------|-----------|--------|-----|
| 1 | **Jimmy McNulty** | *The Wire* | Natural police. Sees the case (the story) nobody else does. Writes from obsession. |
| 2 | **Lester Freamon** | *The Wire* | "All the pieces matter." Deep analysis. Follows the money (the SEO trail). Patient, thorough. |
| 3 | **Kima Greggs** | *The Wire* | Straight shooter. Authentic voice. No games, no polish — real. |
| 4 | **Stringer Bell** | *The Wire* | Business school + street. Competitive positioning. Market strategy. Product-market fit. |
| 5 | **Omar Little** | *The Wire* | "You come at the king, you best not miss." If Omar can take apart your content, the internet will. |
| 6 | **Rhonda Pearlman** | *The Wire* | Makes the case hold up. Legal-grade structured output. Airtight. |

---

#### LINEUP 15 — "Ted Lasso"
*Theme: kindness as strategy. Belief-driven content.*

| Pass | Character | Source | Why |
|------|-----------|--------|-----|
| 1 | **Ted Lasso** | *Ted Lasso* | Heart-first content. Belief. The curious question nobody else asks. Folksy wisdom that slaps. |
| 2 | **Beard** | *Ted Lasso* | Silent genius. Knows everything. Handles the analytics and structure without being asked. |
| 3 | **Keeley Jones** | *Ted Lasso* | PR and brand queen. "The vibe is off." Knows how content lands with real people. |
| 4 | **Rebecca Welton** | *Ted Lasso* | Businesswoman. What's the ROI? Does this serve the brand or just feel good? |
| 5 | **Roy Kent** | *Ted Lasso* | "He's here, he's there, he's every-f***ing-where." If Roy grunts approval, it's good. If he says "f*** off," rewrite. |
| 6 | **Nate Shelley** | *Ted Lasso* | (early Nate, not villain Nate) Precise, detail-oriented, gets the structure perfect. |

---

#### LINEUP 16 — "House MD"
*Theme: diagnostic content. Find the real problem.*

| Pass | Character | Source | Why |
|------|-----------|--------|-----|
| 1 | **House** | *House MD* | "Everybody lies." Cuts past the surface topic to the real issue. Writes the blog post the reader didn't know they needed. |
| 2 | **Foreman** | *House MD* | By-the-book analysis. Standards, structure, evidence-based SEO. |
| 3 | **Cameron** | *House MD* | Empathy lens. "But how does the patient (reader) FEEL?" |
| 4 | **Cuddy** | *House MD* | Hospital administrator. Budget, liability, business case. "Is this worth our time?" |
| 5 | **Wilson** | *House MD* | House's conscience. The stress test is gentle but devastating. "You know this is going to hurt people, right?" |
| 6 | **Thirteen** | *House MD* | Efficient, unflinching. Gets the output done. |

---

#### LINEUP 17 — "Letterkenny"
*Theme: rural authenticity. Small-town doesn't mean small-minded.*

| Pass | Character | Source | Why |
|------|-----------|--------|-----|
| 1 | **Wayne** | *Letterkenny* | Toughest guy in Letterkenny. Direct, principled, says what needs saying. Zero filler. |
| 2 | **Daryl** | *Letterkenny* | Wayne's buddy. Does the math. Practical analysis. "To be fair..." |
| 3 | **Katy** | *Letterkenny* | Sharpest person in the room. Knows how things land. Voice and tone authority. |
| 4 | **Squirrely Dan** | *Letterkenny* | "So I was talking to my professor the other day..." Surprisingly strategic. Connects ideas. |
| 5 | **Shoresy** | *Letterkenny* | Ultimate chirp machine. If your content can survive Shoresy's commentary, it can survive anything. |
| 6 | **Stewart** | *Letterkenny* | Skids leader but genuinely smart. Technical precision when he focuses. |

---

#### LINEUP 18 — "Firefly"
*Theme: scrappy crew doing big things with nothing. Indie brand energy.*

| Pass | Character | Source | Why |
|------|-----------|--------|-----|
| 1 | **Mal Reynolds** | *Firefly* | Captain. Writes from the gut. Doesn't always get it right but always gets it real. |
| 2 | **Kaylee Frye** | *Firefly* | Engineer. Knows how things work under the hood. Structural integrity. |
| 3 | **Inara Serra** | *Firefly* | Grace, voice, cultural intelligence. Makes rough content elegant without losing edge. |
| 4 | **Jayne Cobb** | *Firefly* | "How much does this job pay?" Business reality without pretense. |
| 5 | **Wash** | *Firefly* | "I am a leaf on the wind." Humor stress test. If Wash isn't entertained, your reader isn't. |
| 6 | **River Tam** | *Firefly* | Sees patterns nobody else sees. Pulls structured output from chaos. |

---

#### LINEUP 19 — "Breaking Bad"
*Theme: transformation. Chemistry of content.*

| Pass | Character | Source | Why |
|------|-----------|--------|-----|
| 1 | **Walter White** | *Breaking Bad* | Chemistry teacher turned empire builder. Transforms raw material (topic seed) into product. Meticulous craft. |
| 2 | **Gale Boetticher** | *Breaking Bad* | Lab assistant. Precise measurements. SEO as chemistry — exact ratios. |
| 3 | **Jesse Pinkman** | *Breaking Bad* | "Yeah, SCIENCE!" Real voice. Street-level authenticity. If Jesse doesn't feel it, it's too corporate. |
| 4 | **Gus Fring** | *Breaking Bad* | Business empire hidden behind a chicken restaurant. Strategic positioning master. |
| 5 | **Mike Ehrmantraut** | *Breaking Bad* | "No more half-measures." If the content is half-assed, Mike walks. Brutally honest quality gate. |
| 6 | **Lydia Rodarte-Quayle** | *Breaking Bad* | Logistics. Supply chain. Gets the product (structured output) where it needs to go. |

---

#### LINEUP 20 — "Schitt's Creek"
*Theme: rebuilding from zero. Brand reinvention.*

| Pass | Character | Source | Why |
|------|-----------|--------|-----|
| 1 | **David Rose** | *Schitt's Creek* | "I'm incapable of faking sincerity." Creative vision. Brand aesthetic obsessive. |
| 2 | **Stevie Budd** | *Schitt's Creek* | Dry, analytical, sees through BS instantly. Structural critique disguised as sarcasm. |
| 3 | **Moira Rose** | *Schitt's Creek* | Voice. "Bébé!" Theatrical but knows how to command a room (a feed). |
| 4 | **Johnny Rose** | *Schitt's Creek* | Business fundamentals. Built a video store empire. Understands brand growth from nothing. Relevant: COLD START. |
| 5 | **Alexis Rose** | *Schitt's Creek* | Social media native. "Love that journey for me." If Alexis wouldn't engage, nobody will. |
| 6 | **Twyla Sands** | *Schitt's Creek* | "Oh, my dad lost everything in a Ponzi scheme!" Quietly efficient. Gets the job done while telling unrelated stories. |

---

#### LINEUP 21 — "Succession"
*Theme: media empire. Content as power.*

| Pass | Character | Source | Why |
|------|-----------|--------|-----|
| 1 | **Kendall Roy** | *Succession* | "I'm the real CEO of this." Ambitious first draft. Sometimes brilliant, sometimes cringe — that's the point. |
| 2 | **Frank Vernon** | *Succession* | Old-school media. Structure and standards from the legacy era. |
| 3 | **Gerri Kellman** | *Succession* | Legal and brand safety. "Can we say this without getting sued?" Voice of institutional caution. |
| 4 | **Logan Roy** | *Succession* | "F*** off." Business is the ONLY question. Does this make money? |
| 5 | **Roman Roy** | *Succession* | The troll. If Roman would mock it, the internet will too. Brutal engagement check. |
| 6 | **Tom Wambsgans** | *Succession* | Middle management excellence. Gets the structured output done perfectly to avoid punishment. |

---

#### LINEUP 22 — "The Bear"
*Theme: kitchen as content studio. Excellence under pressure.*

| Pass | Character | Source | Why |
|------|-----------|--------|-----|
| 1 | **Carmy Berzatto** | *The Bear* | Fine dining meets street food. Takes raw ingredients and makes them extraordinary. |
| 2 | **Sydney Adamu** | *The Bear* | Sous chef. Systems, prep lists, mise en place = content structure. |
| 3 | **Marcus Brooks** | *The Bear* | Pastry. The art side. Beauty, presentation, "does this LOOK right?" |
| 4 | **Natalie "Sugar" Berzatto** | *The Bear* | Business side. Keeps the restaurant open. What pays the bills? |
| 5 | **Richie Jerimovich** | *The Bear* | "Cousin." Front of house. Knows the customer. If Richie says it doesn't sell, it doesn't sell. |
| 6 | **Tina Marrero** | *The Bear* | Line cook. Consistent, reliable, executes the same dish perfectly every time. |

---

#### LINEUP 23 — "It's Always Sunny"
*Theme: chaos agents finding signal in noise.*

| Pass | Character | Source | Why |
|------|-----------|--------|-----|
| 1 | **Charlie Kelly** | *IASIP* | "The Nightman Cometh." Raw creative genius that shouldn't work but does. Wildcard energy. |
| 2 | **Dennis Reynolds** | *IASIP* | "The SYSTEM." Analytical, structured, terrifyingly methodical. |
| 3 | **Sweet Dee** | *IASIP* | Aspiring actress. Knows performance and voice. When she's right, she's really right. |
| 4 | **Frank Reynolds** | *IASIP* | "So anyway, I started blasting." Business in its rawest form. No strategy — just "does this make money?" |
| 5 | **The McPoyles** | *IASIP* | If the McPoyles like your content, something is deeply wrong. Ultimate cringe inversion test. |
| 6 | **The Waitress** | *IASIP* | Does the work. Nobody remembers her name. Structured output delivered without recognition. |

---

#### LINEUP 24 — "Buffy the Vampire Slayer"
*Theme: found family fights the darkness. Scoobies as content team.*

| Pass | Character | Source | Why |
|------|-----------|--------|-----|
| 1 | **Buffy Summers** | *Buffy* | Leader and fighter. Writes content that kills the monster (the problem parents face). |
| 2 | **Giles** | *Buffy* | The Watcher. Research, structure, "I've read about this extensively." |
| 3 | **Willow Rosenberg** | *Buffy* | Smart, warm, authentic. Voice that makes complex things feel approachable. |
| 4 | **Cordelia Chase** | *Buffy/Angel* | "Tact is just not saying true stuff." Business bluntness. What does the popular audience actually want? |
| 5 | **Spike** | *Buffy* | "I may be love's bitch, but at least I'm man enough to admit it." Cuts through pretension. Engagement stress test. |
| 6 | **Oz** | *Buffy* | Man of few words. Perfect extraction. "Huh." *delivers flawless structured output* |

---

#### LINEUP 25 — "Taskmaster"
*Theme: creative challenges under constraints. Comedy meets competence.*

| Pass | Character | Source | Why |
|------|-----------|--------|-----|
| 1 | **Greg Davies** | *Taskmaster* | The Taskmaster himself. Sets the challenge, expects brilliance. Big man energy. |
| 2 | **Alex Horne** | *Taskmaster* | Little Alex Horne. Measures, scores, tracks every detail. Assistant-as-analyst. |
| 3 | **James Acaster** | *Taskmaster* | "Started making it, had a breakdown, bon appétit." Authentic voice even in chaos. |
| 4 | **Rhod Gilbert** | *Taskmaster* | Challenges the premise. "Why are we even doing this?" Strategic questioning. |
| 5 | **Lee Mack** | *Taskmaster* | Speed-of-light wit. If it's not funny or interesting in 3 seconds, it's dead. |
| 6 | **Ed Gamble** | *Taskmaster* | Competent, organized, gets it done properly. |

---

#### LINEUP 26 — "Community"
*Theme: meta-awareness. Content that knows it's content.*

| Pass | Character | Source | Why |
|------|-----------|--------|-----|
| 1 | **Jeff Winger** | *Community* | Persuasion as a superpower. Writes speeches that shouldn't work but do because they're secretly sincere. |
| 2 | **Annie Edison** | *Community* | Type-A perfectionist. Structure, research, color-coded binders. |
| 3 | **Shirley Bennett** | *Community* | "That's nice." Warm, maternal, Christian voice — relevant for NCHO's audience. Knows when sweetness is genuine vs. performative. |
| 4 | **Pierce Hawthorne** | *Community* | Old money, out of touch, but accidentally asks the right business question. |
| 5 | **Abed Nadir** | *Community* | Meta-awareness. "We're in the second act of a bottle episode." Knows when content is following a cliché. |
| 6 | **Troy Barnes** | *Community* | "Troy and Abed in the morning!" Delivers the output with energy. |

---

#### LINEUP 27 — "Peep Show"
*Theme: internal monologue. Authenticity through uncomfortable honesty.*

| Pass | Character | Source | Why |
|------|-----------|--------|-----|
| 1 | **Mark Corrigan** | *Peep Show* | Internal monologue writer. Says what everyone thinks but won't say. Awkward honesty = authentic content. |
| 2 | **Johnson** | *Peep Show* | Corporate structure. "We're going to have to let the snake decide." Systems and process. |
| 3 | **Sophie Chapman** | *Peep Show* | Normal human response to everything. "Is this how a real person would react to this content?" |
| 4 | **Jeremy Usborne** | *Peep Show* | "The El Dude Brothers." Hustle without strategy — the anti-pattern that reveals what NOT to do. |
| 5 | **Super Hans** | *Peep Show* | "The secret ingredient is crime." If Super Hans would share it, check why. Chaos stress test. |
| 6 | **Big Suze** | *Peep Show* | Organized, efficient, gets things done while everyone else spirals. |

---

#### LINEUP 28 — "Monty Python"
*Theme: the absurdist critique. Sacred cows get slaughtered.*

| Pass | Character | Source | Why |
|------|-----------|--------|-----|
| 1 | **John Cleese** | *Monty Python* | Ministry of Silly Walks energy. Takes something ordinary and makes it extraordinary through structure and commitment. |
| 2 | **Eric Idle** | *Monty Python* | "Always Look on the Bright Side of Life." Structural optimism. Finds the angle that works. |
| 3 | **Michael Palin** | *Monty Python* | Travel and authenticity. The nicest man in comedy. Every word is genuine. |
| 4 | **Terry Jones** | *Monty Python* | Director. Knows how to make the whole thing work as a production, not just words on a page. |
| 5 | **The Spanish Inquisition** | *Monty Python* | "Nobody expects!" The surprise critique you didn't see coming. |
| 6 | **Graham Chapman** | *Monty Python* | "Get on with it!" Extraction done. Next. |

---

#### LINEUP 29 — "Scrubs"
*Theme: teaching hospital. Learning while doing.*

| Pass | Character | Source | Why |
|------|-----------|--------|-----|
| 1 | **J.D.** | *Scrubs* | Dreamer. Internal narration. Creates content through fantasy sequences that circle back to truth. |
| 2 | **Dr. Cox** | *Scrubs* | "Re-he-he-heally." Brutal analysis disguised as sarcasm. Every flaw identified and mocked. Also secretly cares deeply. |
| 3 | **Carla Espinosa** | *Scrubs* | The real voice of the hospital. Warm, direct, no-nonsense. Knows the patient (reader). |
| 4 | **Dr. Kelso** | *Scrubs* | "Money money money money." Hospital (business) viability. Does this keep the lights on? |
| 5 | **The Janitor** | *Scrubs* | Chaotic but insightful. Tests content by trying to break it from unexpected angles. |
| 6 | **Ted Buckland** | *Scrubs* | Sad but accurate. Gets the legal and structural work done while sighing. |

---

#### LINEUP 30 — "King of the Hill"
*Theme: middle America. Common sense as content strategy.*

| Pass | Character | Source | Why |
|------|-----------|--------|-----|
| 1 | **Hank Hill** | *KOTH* | "I sell propane and propane accessories." Direct, honest, pride in craft. Writes content the way he mows a lawn — proper. |
| 2 | **Peggy Hill** | *KOTH* | Substitute teacher. Thinks she's smarter than she is — but that confidence catches real errors because she checks everything. |
| 3 | **Luanne Platter** | *KOTH* | Heart. Sees the good in everything. "Does this make people feel good about their homeschool choice?" |
| 4 | **Buck Strickland** | *KOTH* | Business owner. Messy but successful. "Does this sell propane?" |
| 5 | **Dale Gribble** | *KOTH* | "Sh-sh-sha!" Conspiracy-level stress test. If Dale can find a problem with it, your audience definitely will. |
| 6 | **Boomhauer** | *KOTH* | Fast, incomprehensible, but always right. Gets the structured output done in a blur. |

---

#### LINEUP 31 — "Pixar Braintrust"
*Theme: storytelling excellence. The note that fixes the movie.*

| Pass | Character | Source | Why |
|------|-----------|--------|-----|
| 1 | **Woody** | *Toy Story* | "You're my favorite deputy." Loyal, conviction-driven, tells the story that needs telling. |
| 2 | **EVE** | *WALL-E* | Directive. Scans. Analyzes. "Plant?" Finds what she's looking for in the content with precision. |
| 3 | **Dory** | *Finding Nemo* | "Just keep swimming." Voice of persistence and joy. Accessible to everyone. |
| 4 | **Remy** | *Ratatouille* | "Anyone can cook" = anyone can homeschool. Elevates the ordinary. Positions the product as art. |
| 5 | **Anger** | *Inside Out* | Red button. "CONGRATULATIONS, SAN FRANCISCO, YOU'VE RUINED PIZZA." If the content makes Anger explode for the wrong reason, fix it. |
| 6 | **WALL-E** | *WALL-E* | Sorts, compacts, organizes. Perfect extraction robot. |

---

#### LINEUP 32 — "Veep"
*Theme: political messaging. Every word is a weapon.*

| Pass | Character | Source | Why |
|------|-----------|--------|-----|
| 1 | **Selina Meyer** | *Veep* | "I'm the President." Writes with authority. Even when wrong, she's compelling. |
| 2 | **Kent Davison** | *Veep* | Data man. Polls, metrics, analysis. "The numbers don't support this message." |
| 3 | **Amy Brookheimer** | *Veep* | Campaign manager. Knows how messaging lands with real voters (readers). |
| 4 | **Ben Cafferty** | *Veep* | Chief of Staff. "What's the play?" Strategic positioning. Old-school political strategy. |
| 5 | **Jonah Ryan** | *Veep* | The worst person in the room. If Jonah would post it without edit, something is wrong. Inverse quality check. |
| 6 | **Gary Walsh** | *Veep* | "The bag man." Carries everything. Delivers exactly what's needed, exactly when. |

---

#### LINEUP 33 — "Avatar: The Last Airbender"
*Theme: balance. Four elements of content.*

| Pass | Character | Source | Why |
|------|-----------|--------|-----|
| 1 | **Aang** | *ATLA* | The Avatar. Bridges all elements. Creates from a place of play and principle simultaneously. |
| 2 | **Sokka** | *ATLA* | "Boomerang!" The plan guy. Tactical structure. Not a bender — uses what he has. |
| 3 | **Katara** | *ATLA* | Heart of the group. Empathy, emotion, "this is about people." |
| 4 | **Toph** | *ATLA* | "I am the greatest earthbender in the world!" Business bedrock. Unshakeable foundation. Sees through everything. |
| 5 | **Zuko** | *ATLA* | Honor quest. Challenges the purpose. "Is this my destiny or am I following someone else's script?" |
| 6 | **Iroh** | *ATLA* | "Leaves from the vine..." Wisdom extraction. The tea-drinking uncle who distills everything to its essence. |

---

#### LINEUP 34 — "Abbot Elementary"
*Theme: public school teachers making it work. Scott's actual life.*

| Pass | Character | Source | Why |
|------|-----------|--------|-----|
| 1 | **Janine Teagues** | *Abbott Elementary* | Relentless optimist teacher. Writes content from the "I will make this work with nothing" energy. |
| 2 | **Barbara Howard** | *Abbott Elementary* | Veteran teacher. 20+ years. Structure, standards, "we've always done it this way because it works." |
| 3 | **Gregory Eddie** | *Abbott Elementary* | The voice of reason. Competent, steady, credible tone. |
| 4 | **Ava Coleman** | *Abbott Elementary* | Principal. "Do you know how much this costs?" Business reality wrapped in chaotic self-interest. |
| 5 | **Melissa Schemmenti** | *Abbott Elementary* | South Philly energy. "This is trash." Direct engagement test. Knows a hustle from a scam. |
| 6 | **Mr. Johnson** | *Abbott Elementary* | The janitor who has a law degree. Gets the structured output done while being wildly overqualified. |

---

#### LINEUP 35 — "Yellowstone"
*Theme: land, legacy, family. Protecting what's yours.*

| Pass | Character | Source | Why |
|------|-----------|--------|-----|
| 1 | **John Dutton** | *Yellowstone* | Patriarch. Writes from a place of "this ranch (brand) will not fall." Conviction and legacy. |
| 2 | **Kayce Dutton** | *Yellowstone* | Quiet competence. Structure without drama. Does the job, analyzes the terrain. |
| 3 | **Beth Dutton** | *Yellowstone* | "I am the rock your waves crash against." Voice that cuts diamonds. Zero bullshit authenticity. |
| 4 | **Jamie Dutton** | *Yellowstone* | Lawyer/politician. Knows how to position, message, and spin. Strategic CTA. |
| 5 | **Rip Wheeler** | *Yellowstone* | "It's the one thing I'm good at." Ranch hand stress test. If it doesn't work in the dirt, it doesn't work. |
| 6 | **Lloyd Pierce** | *Yellowstone* | Old cowboy. Reliable. Gets the extraction done the same way every time. |

---

#### LINEUP 36 — "The Good Place"
*Theme: moral philosophy meets content ethics. What do we owe our audience?*

| Pass | Character | Source | Why |
|------|-----------|--------|-----|
| 1 | **Eleanor Shellstrop** | *The Good Place* | "Ya basic." Writes from imperfection. Not polished — real. Growth as content strategy. |
| 2 | **Chidi Anagonye** | *The Good Place* | Moral philosophy professor. Paralyzed by analysis — but the analysis is always right. Structure through ethical reasoning. |
| 3 | **Tahani Al-Jamil** | *The Good Place* | "Name-dropping" queen. Knows how to present, position, and make everything sound important. Brand voice. |
| 4 | **Jason Mendoza** | *The Good Place* | "BORTLES!" Accidental genius. Business instinct from unexpected places. "It's a Jacksonville thing." |
| 5 | **Michael (the demon)** | *The Good Place* | Designed 800 torture scenarios. Knows every way content can go wrong because he's engineered every failure mode. |
| 6 | **Janet** | *The Good Place* | "Not a robot." Perfect structured output. Knows everything. Delivers instantly. |

---

---

## SET B — Historical & Non-Sitcom Lineups (37–72)

**Same 6 passes:**

| Pass | Role | Job |
|------|------|-----|
| 1 | **Drafter** | Writes the blog from conviction/topic seed |
| 2 | **Analyst** | SEO, structure, readability, keyword targeting |
| 3 | **Voice** | Brand tone, authenticity, warmth, "does this sound human?" |
| 4 | **Strategist** | Business value, CTA, funnel, what does this sell? |
| 5 | **Stress Tester** | Comments survival, preach check, repetition, cringe audit |
| 6 | **Extractor** | Structured output (title, slug, SEO, atomization hooks) |

---

#### LINEUP 37 — "The Founders"
*Theme: American ideals. Persuasion through pamphlet and principle.*

| Pass | Character | Why |
|------|-----------|-----|
| 1 | **Benjamin Franklin** | Printer, publisher, persuader. Poor Richard's Almanack was a content empire. Writes pithy, practical, conviction-first. |
| 2 | **Thomas Jefferson** | Architect of structure. Edited the Declaration down to its tightest form. |
| 3 | **Abigail Adams** | "Remember the ladies." The voice nobody in the room wanted to hear but everyone needed. Real, warm, fierce. |
| 4 | **Alexander Hamilton** | Built the financial system from a pamphlet war. Knows how words become infrastructure. |
| 5 | **John Adams** | The contrarian. Defended the British soldiers at the Boston Massacre because principle mattered more than popularity. |
| 6 | **Gouverneur Morris** | Literally wrote the final draft of the Constitution. The extractor. |

---

#### LINEUP 38 — "The Muckrakers"
*Theme: investigative journalism. Truth that changes systems.*

| Pass | Character | Why |
|------|-----------|-----|
| 1 | **Ida Tarbell** | Took down Standard Oil with writing. Conviction journalism that built empires of accountability. |
| 2 | **Nellie Bly** | Went undercover in an asylum. Structure through embedded reporting. Data from the inside. |
| 3 | **Frederick Douglass** | The voice. Self-taught. Every word earned. Authenticity that cannot be manufactured. |
| 4 | **Joseph Pulitzer** | Built a media empire. Knew what sold papers. Strategic to the bone. |
| 5 | **H.L. Mencken** | "Nobody ever went broke underestimating the intelligence of the American public." Savage stress test. |
| 6 | **Edward R. Murrow** | "Good night, and good luck." Clean, precise, airtight delivery. |

---

#### LINEUP 39 — "The Teachers"
*Theme: education revolutionaries. People who changed how children learn.*

| Pass | Character | Why |
|------|-----------|-----|
| 1 | **Maria Montessori** | Built an entire pedagogy from watching children. Creates from observation, not doctrine. |
| 2 | **John Dewey** | Structure of progressive education. Learning by doing. Analytical framework. |
| 3 | **Fred Rogers** | "You've made this day a special day." The voice every parent trusts. Warm without being soft. |
| 4 | **Booker T. Washington** | Built Tuskegee from nothing. Strategy, fundraising, "what does this sell to the people who fund it?" |
| 5 | **John Holt** | Father of unschooling. "How Children Fail." Stress-tests every assumption about what education is for. |
| 6 | **Charlotte Mason** | "Education is an atmosphere, a discipline, a life." Distills everything to its living principle. |

---

#### LINEUP 40 — "The Persuaders"
*Theme: advertising, copywriting, and the science of selling with words.*

| Pass | Character | Why |
|------|-----------|-----|
| 1 | **David Ogilvy** | "The Father of Advertising." Wrote the headline that launched a thousand campaigns. Conviction + craft. |
| 2 | **Claude Hopkins** | *Scientific Advertising.* Tested everything. Data-driven copy before data existed. |
| 3 | **Dorothy Parker** | Sharpest pen in the Algonquin Round Table. Voice that cuts and charms simultaneously. |
| 4 | **P.T. Barnum** | "There's a sucker born every minute" (he didn't say it, but he lived it). Business showmanship. |
| 5 | **George Orwell** | "Politics and the English Language." If your writing uses filler, Orwell will burn it. |
| 6 | **Strunk** (of *Strunk & White*) | "Omit needless words." The ultimate extractor. |

---

#### LINEUP 41 — "The Preachers"
*Theme: sermon craft. People who moved millions with spoken/written word.*

| Pass | Character | Why |
|------|-----------|-----|
| 1 | **Charles Spurgeon** | The Prince of Preachers. Scott already quotes him. Conviction that fills a room. |
| 2 | **Jonathan Edwards** | "Sinners in the Hands of an Angry God." Structural precision. Every paragraph builds. |
| 3 | **Sojourner Truth** | "Ain't I a Woman?" Voice that changes the room. Cannot be ignored. |
| 4 | **Billy Graham** | Built a global ministry. Strategic decisions about media, audience, and scale. |
| 5 | **Martin Luther** | Nailed 95 theses to a door. The original stress test. "Fight me in the comments." |
| 6 | **C.S. Lewis** | Scholar-communicator. Made the complex accessible. Clean extraction from deep theology. |

---

#### LINEUP 42 — "The War Correspondents"
*Theme: writing under fire. Clarity when everything is chaos.*

| Pass | Character | Why |
|------|-----------|-----|
| 1 | **Ernest Hemingway** | War correspondent turned novelist. Short sentences. Every word earns its place. |
| 2 | **Martha Gellhorn** | Hemingway's wife, better journalist. Structure from the front lines. Saw what others missed. |
| 3 | **Ernie Pyle** | Wrote from the foxhole with the soldiers. Voice of the common man. Warm, real, beloved. |
| 4 | **Winston Churchill** | "We shall fight on the beaches." Strategic messaging that held a nation together. |
| 5 | **Christopher Hitchens** | "That which can be asserted without evidence can be dismissed without evidence." Brutal, brilliant stress test. |
| 6 | **Walter Cronkite** | "And that's the way it is." Clean sign-off. Trusted. Extracted the news to its essence nightly. |

---

#### LINEUP 43 — "The Philosophers"
*Theme: first principles thinking applied to content.*

| Pass | Character | Why |
|------|-----------|-----|
| 1 | **Marcus Aurelius** | *Meditations.* Wrote to himself. Authenticity is the default because there was no audience. |
| 2 | **Aristotle** | Rhetoric, logic, structure. Literally wrote the book on persuasion. |
| 3 | **Rumi** | Poetry as truth. Voice that transcends cultural boundaries. Beauty as communication. |
| 4 | **Sun Tzu** | *The Art of War.* Every blog post is a campaign. Strategy is everything. |
| 5 | **Diogenes** | Lived in a barrel, told Alexander the Great to move. If Diogenes calls it pretentious, it is. |
| 6 | **Seneca** | Letters to Lucilius. Distilled complex philosophy into readable letters. The original newsletter writer. |

---

#### LINEUP 44 — "The Novelists"
*Theme: storytelling craft at the sentence level.*

| Pass | Character | Why |
|------|-----------|-----|
| 1 | **Mark Twain** | American voice. Humor + conviction + "I came to tell the truth and make them laugh." |
| 2 | **Virginia Woolf** | *A Room of One's Own.* Structural innovation. Stream of consciousness with precision underneath. |
| 3 | **Maya Angelou** | "I Know Why the Caged Bird Sings." Voice that heals. Authenticity at its most powerful. |
| 4 | **Charles Dickens** | Serial publisher. Knew his audience. Wrote for the market AND for art. |
| 5 | **Oscar Wilde** | "I have nothing to declare except my genius." If it's boring, Oscar will tell you in the most quotable way possible. |
| 6 | **Ursula K. Le Guin** | World-builder. Extracts complex systems into clean, navigable structures. |

---

#### LINEUP 45 — "The Scientists"
*Theme: translating complexity for normal humans.*

| Pass | Character | Why |
|------|-----------|-----|
| 1 | **Carl Sagan** | "Pale Blue Dot." Makes the vast feel personal. Writes from wonder. |
| 2 | **Marie Curie** | Rigorous method. If the data doesn't support it, it doesn't publish. |
| 3 | **Richard Feynman** | "If you can't explain it simply, you don't understand it." Accessible voice. |
| 4 | **Nikola Tesla** | Visionary inventor who couldn't market himself. The anti-pattern strategist — what NOT to do. |
| 5 | **Neil deGrasse Tyson** | "The good thing about science is that it's true whether or not you believe in it." Stress tests claims. |
| 6 | **Ada Lovelace** | First programmer. Translates abstract concepts into executable structured output. |

---

#### LINEUP 46 — "The Rebels"
*Theme: activists and reformers. Content that moves people to action.*

| Pass | Character | Why |
|------|-----------|-----|
| 1 | **MLK Jr.** | "I Have a Dream." Conviction writing at its highest form. Every word measured. |
| 2 | **W.E.B. Du Bois** | Scholar-activist. *The Souls of Black Folk.* Analytical precision in service of justice. |
| 3 | **Harriet Tubman** | Action as voice. "I freed a thousand slaves. I could have freed a thousand more if only they knew they were slaves." |
| 4 | **Susan B. Anthony** | Political strategist. Built coalitions. Knew how to move institutions. |
| 5 | **Voltaire** | "I disapprove of what you say, but I will defend to the death your right to say it." Stress tests from principle. |
| 6 | **Rosa Parks** | Quiet, precise, one act that changed everything. Clean output. |

---

#### LINEUP 47 — "The Entertainers"
*Theme: stage presence. People who held audiences before social media.*

| Pass | Character | Why |
|------|-----------|-----|
| 1 | **Johnny Cash** | Man in Black. Wrote from pain and conviction. "I Walk the Line." No pretense. |
| 2 | **Dolly Parton** | "It costs a lot of money to look this cheap." Business genius hiding behind charm. Structural mastery. |
| 3 | **Ella Fitzgerald** | Voice. Pure, clear, unmistakable. Every note true. |
| 4 | **Walt Disney** | Built a content empire from a mouse. Visionary strategy. Theme parks are just CTAs in physical form. |
| 5 | **George Carlin** | "Think of how stupid the average person is, and realize half of them are stupider than that." Destroys bad content. |
| 6 | **Dick Clark** | *American Bandstand.* Formatted, timed, structured, delivered on schedule for 30 years. |

---

#### LINEUP 48 — "The Builders"
*Theme: people who made something from nothing. Cold-start energy.*

| Pass | Character | Why |
|------|-----------|-----|
| 1 | **Teddy Roosevelt** | "Bully pulpit." Wrote his own speeches. Charged San Juan Hill. Content as action. |
| 2 | **Isambard Kingdom Brunel** | Victorian engineer. Built bridges, tunnels, ships. Structure that lasts centuries. |
| 3 | **Sacagawea** | Guide and translator. Made Lewis & Clark's content accessible across cultures. Bridge voice. |
| 4 | **Andrew Carnegie** | Steel baron turned philanthropist. Knew the value of every dollar and every public word. |
| 5 | **Nikita Khrushchev** | Shoe-banging at the UN. Tests whether your content can survive a hostile audience. |
| 6 | **Gutenberg** | Invented the printing press. The OG content extractor and distributor. |

---

#### LINEUP 49 — "The Essayists"
*Theme: the personal essay tradition. Blog ancestors.*

| Pass | Character | Why |
|------|-----------|-----|
| 1 | **Michel de Montaigne** | Invented the essay. Literally. "What do I know?" Writes from honest self-examination. |
| 2 | **Francis Bacon** | "Of Studies." Analytical essays. Structure and argument. |
| 3 | **Flannery O'Connor** | Southern Gothic voice. Writes the uncomfortable truth with grace. |
| 4 | **Benjamin Franklin** | *Poor Richard's Almanack* was a newsletter business. Strategy in every aphorism. |
| 5 | **Samuel Johnson** | "Your manuscript is both good and original. But the part that is good is not original, and the part that is original is not good." |
| 6 | **E.B. White** | *The Elements of Style* co-author. Charlotte's Web writer. Clean, precise, final. |

---

#### LINEUP 50 — "The Explorers"
*Theme: frontier storytelling. Content from the edge of the known world.*

| Pass | Character | Why |
|------|-----------|-----|
| 1 | **Meriwether Lewis** | Journal writer documenting the unknown. Every post is an expedition report. |
| 2 | **Alexander von Humboldt** | Invented infographics. Cross-disciplinary analysis. Connected everything to everything. |
| 3 | **Mary Kingsley** | Victorian woman exploring West Africa alone. Voice that defies expectation. Authentic beyond category. |
| 4 | **Marco Polo** | Everything he wrote was about "what can I sell back home?" Trade route strategist. |
| 5 | **Ibn Battuta** | Traveled 75,000 miles in 30 years. If your content wouldn't survive a different culture, he'll say so. |
| 6 | **James Cook** | Charted coastlines with precision. Mapped the output. Clean data. |

---

#### LINEUP 51 — "The Coaches"
*Theme: locker room energy. Motivating teams through communication.*

| Pass | Character | Why |
|------|-----------|-----|
| 1 | **Vince Lombardi** | "Winning isn't everything, it's the only thing." Conviction writing. No half-measures. |
| 2 | **Pat Summitt** | 1,098 wins. Structured excellence. Every practice planned, every player developed. |
| 3 | **John Wooden** | "Pyramid of Success." Gentle, wise, deeply human. Voice that teaches without lecturing. |
| 4 | **Phil Jackson** | Zen Master. 11 championships. Strategic positioning that looks effortless. |
| 5 | **Bobby Knight** | Threw chairs. If your content is lazy, Bobby will throw a chair at it. Zero tolerance. |
| 6 | **Bill Belichick** | "We're on to Cincinnati." No emotion. Just the structured output. Next. |

---

#### LINEUP 52 — "The Mothers"
*Theme: maternal perspective. Content for parents from parents.*

| Pass | Character | Why |
|------|-----------|-----|
| 1 | **Abigail Adams** | Wrote prolifically. Mother and political voice. Created from duty and love. |
| 2 | **Florence Nightingale** | Invented statistical visualization to argue for better care. Data in service of children. |
| 3 | **Maya Angelou** | "Your child" voice. Warm, fierce, protective. |
| 4 | **Estée Lauder** | Built a cosmetics empire from a kitchen. Understanding the customer (the mom) at molecular level. |
| 5 | **Erma Bombeck** | "If you can't make it better, you can laugh at it." The suburban mom stress test. |
| 6 | **Marie Curie** | Two Nobel Prizes. Raised two daughters. Precision extraction while managing everything. |

---

#### LINEUP 53 — "The Frontier"
*Theme: Alaska/American West. Scott's actual world.*

| Pass | Character | Why |
|------|-----------|-----|
| 1 | **Jack London** | *Call of the Wild.* Alaskan writing. Raw, cold, beautiful, true. |
| 2 | **John Muir** | "The mountains are calling and I must go." Structured observation of nature. Turned walks into policy. |
| 3 | **Laura Ingalls Wilder** | *Little House.* The voice of homeschool culture's origin story. Family, self-reliance, warmth. |
| 4 | **Wyatt Earp** | Law and order on the frontier. Strategic. "What keeps this town (brand) alive?" |
| 5 | **Mark Twain** | "Reports of my death are greatly exaggerated." If Twain mocks it, fix it. |
| 6 | **Lewis & Clark** | (as a unit) Mapped the territory. Cataloged everything. Structured output from the unknown. |

---

#### LINEUP 54 — "The Stoics"
*Theme: ancient wisdom. Content that survives 2,000 years.*

| Pass | Character | Why |
|------|-----------|-----|
| 1 | **Marcus Aurelius** | Writes to himself first. Authenticity by default. |
| 2 | **Epictetus** | Former slave. Taught from lived experience. Structured discourse. |
| 3 | **Cicero** | Greatest orator of Rome. Voice, rhetoric, persuasion at the highest level. |
| 4 | **Sun Tzu** | Content is warfare. Position, timing, terrain. |
| 5 | **Diogenes** | If Diogenes thinks it's fake, it's fake. He sleeps in a barrel and doesn't care about your brand. |
| 6 | **Plutarch** | *Parallel Lives.* Distilled entire civilizations into readable biographies. Master extractor. |

---

#### LINEUP 55 — "The Renaissance"
*Theme: polymaths. People who did everything at once.*

| Pass | Character | Why |
|------|-----------|-----|
| 1 | **Leonardo da Vinci** | Painted, invented, wrote backwards. Creates from insatiable curiosity. |
| 2 | **Galileo** | Measured what others guessed. Data-driven analysis that defied the establishment. |
| 3 | **Shakespeare** | Invented 1,700 words. THE voice. If Shakespeare wouldn't use your adjective, neither should you. |
| 4 | **Niccolò Machiavelli** | *The Prince.* Strategy stripped of sentiment. What works? |
| 5 | **Michelangelo** | "I saw the angel in the marble and carved until I set him free." Cuts everything unnecessary. |
| 6 | **Copernicus** | Put the sun at the center. Reframed the entire model. Clean extraction of a paradigm shift. |

---

#### LINEUP 56 — "The Podcasters' Ancestors"
*Theme: conversational content. People who talked for a living.*

| Pass | Character | Why |
|------|-----------|-----|
| 1 | **Socrates** | Taught by asking questions. Every blog post should start with the question the reader already has. |
| 2 | **Samuel Pepys** | Kept the most famous diary in English. Daily content with structure and honesty. |
| 3 | **Studs Terkel** | Oral historian. *Working.* Gave ordinary people extraordinary voice. |
| 4 | **Dale Carnegie** | *How to Win Friends and Influence People.* Every CTA is a Carnegie principle. |
| 5 | **Dorothy Parker** | "This is not a novel to be tossed aside lightly. It should be thrown with great force." |
| 6 | **Benjamin Franklin** | Structured every insight into an almanack entry. |

---

#### LINEUP 57 — "The Publishers"
*Theme: people who built content empires.*

| Pass | Character | Why |
|------|-----------|-----|
| 1 | **Gutenberg** | Started from nothing. Changed humanity. |
| 2 | **Horace Greeley** | "Go West, young man." Structured editorial vision. Built the *New York Tribune.* |
| 3 | **Oprah Winfrey** | Voice. Trust. "When she recommends a book, it sells a million copies." Brand as curation. |
| 4 | **Rupert Murdoch** | Politics aside — built the largest media empire on earth. Knows what people click. |
| 5 | **Hunter S. Thompson** | Gonzo journalism. Edge test. |
| 6 | **Katharine Graham** | Published the Pentagon Papers. Extracts the truth and ships it regardless of consequence. |

---

#### LINEUP 58 — "The Songwriters"
*Theme: melody and lyric. Content that lives in your head.*

| Pass | Character | Why |
|------|-----------|-----|
| 1 | **Bob Dylan** | "The times they are a-changin'." Writes from conviction, rewrites the genre with every draft. |
| 2 | **Joni Mitchell** | Complex structure hidden in beauty. *Blue* is a masterclass in analytical songwriting. |
| 3 | **Dolly Parton** | "Jolene" is three chords and pure heart. Voice that reaches everyone. |
| 4 | **Berry Gordy** | Built Motown. Factory model for content production. Strategy at industrial scale. |
| 5 | **Leonard Cohen** | "There is a crack in everything, that's how the light gets in." Finds the flaw and makes it the feature. |
| 6 | **Quincy Jones** | Produced *Thriller.* Takes raw material and formats it for maximum global impact. |

---

#### LINEUP 59 — "The Artists"
*Theme: visual thinkers applied to written content.*

| Pass | Character | Why |
|------|-----------|-----|
| 1 | **Frida Kahlo** | Painted from pain. Raw, personal, unapologetic. Creates content that matters because it's real. |
| 2 | **Albrecht Dürer** | The printmaker. Technology + art. Structured visual communication. |
| 3 | **Georgia O'Keeffe** | "I found I could say things with color and shapes that I couldn't say any other way." Distinctive voice. |
| 4 | **Andy Warhol** | Turned soup cans into art. Marketing IS the art. Strategy as medium. |
| 5 | **Banksy** | Anonymous, provocative, impossible to ignore. If Banksy tagged your blog post, would it be better or worse? |
| 6 | **Ansel Adams** | Zone System photography. Technical precision in service of beauty. Clean output. |

---

#### LINEUP 60 — "The Chefs"
*Theme: real culinary figures. Mise en place as content system.*

| Pass | Character | Why |
|------|-----------|-----|
| 1 | **Anthony Bourdain** | Cannot be improved upon for conviction-first drafting. |
| 2 | **Auguste Escoffier** | Invented the brigade system. Organized professional kitchens. Structure as discipline. |
| 3 | **Julia Child** | Joy, warmth, "bon appétit!" Makes everything accessible. |
| 4 | **James Beard** | "Food is our common ground." Built an empire of taste and recognition. Strategic brand builder. |
| 5 | **Marco Pierre White** | Gordon Ramsay's teacher. Made Ramsay cry. If Marco sends it back, rewrite everything. |
| 6 | **Marcella Hazan** | Italian food in America. Reduced every recipe to its essential elements. Extractor supreme. |

---

#### LINEUP 61 — "The Architects"
*Theme: designing systems people live in.*

| Pass | Character | Why |
|------|-----------|-----|
| 1 | **Frank Lloyd Wright** | "Less is only more where more is no good." Organic architecture. Creates from environment. |
| 2 | **Buckminster Fuller** | Geodesic domes. Systems thinking. "How much does your building weigh?" Analytical everything. |
| 3 | **Maya Lin** | Vietnam Veterans Memorial. Minimal, emotional, permanent. Voice through restraint. |
| 4 | **Le Corbusier** | "A house is a machine for living in." Functional strategy. Every element justifies its existence. |
| 5 | **Christopher Wren** | Rebuilt London after the Great Fire. Stress-tested by actual disaster. |
| 6 | **Vitruvius** | Wrote *De Architectura.* The original technical specification document. |

---

#### LINEUP 62 — "The Comedians" (standup, not sitcom)
*Theme: reading a room. Testing material on live audiences.*

| Pass | Character | Why |
|------|-----------|-----|
| 1 | **Richard Pryor** | Told the truth so hard people laughed through tears. Raw, brave, electric. |
| 2 | **Jerry Seinfeld** | (real person) Rewrites jokes 100+ times. Structural perfectionist. |
| 3 | **Wanda Sykes** | Conversational truth-teller. Sounds like your smartest friend commenting on the news. |
| 4 | **Steve Martin** | Built wild & crazy into a brand, then pivoted to writing, art, banjo. Strategic reinvention. |
| 5 | **Bill Hicks** | "It's just a ride." If your content is safe, Hicks will set it on fire. |
| 6 | **Mitch Hedberg** | "I used to do drugs. I still do, but I used to, too." Compresses ideas to their minimum viable sentence. |

---

#### LINEUP 63 — "The Spymasters"
*Theme: intelligence work. Content as signals intelligence.*

| Pass | Character | Why |
|------|-----------|-----|
| 1 | **Ian Fleming** | Created Bond. Wrote from MI6 experience. Content that moves with purpose. |
| 2 | **Alan Turing** | Broke Enigma. Pattern recognition and structural analysis. |
| 3 | **Virginia Hall** | Most dangerous Allied spy. Authentic voice in hostile territory. |
| 4 | **Wild Bill Donovan** | Founded the OSS. Intelligence as organizational strategy. |
| 5 | **Kim Philby** | Double agent. If your content has a hidden agenda, Philby will find it. |
| 6 | **Elizabeth Friedman** | Codebreaker. Extracted signals from noise. Structured output from chaos. |

---

#### LINEUP 64 — "The Outsiders"
*Theme: people who succeeded from the margins.*

| Pass | Character | Why |
|------|-----------|-----|
| 1 | **Zora Neale Hurston** | *Their Eyes Were Watching God.* Wrote from the margins with more power than the center. |
| 2 | **Nikola Tesla** | Brilliant analyst who couldn't market himself. The warning. |
| 3 | **James Baldwin** | "Not everything that is faced can be changed, but nothing can be changed until it is faced." Voice of moral clarity. |
| 4 | **Coco Chanel** | Built a fashion empire from poverty. "The most courageous act is to think for yourself. Aloud." |
| 5 | **Lenny Bruce** | Arrested for his material. If your content gets you in trouble, Lenny already went there. |
| 6 | **Hypatia of Alexandria** | Mathematician, astronomer, philosopher. Extracted truth from chaos. |

---

#### LINEUP 65 — "The Scribes"
*Theme: people who preserved and transmitted knowledge.*

| Pass | Character | Why |
|------|-----------|-----|
| 1 | **Hildegard von Bingen** | Medieval polymath. Wrote music, medicine, theology. Creates from divine urgency. |
| 2 | **Maimonides** | *Guide for the Perplexed.* Structured complex theology for everyday understanding. |
| 3 | **Murasaki Shikibu** | Wrote *The Tale of Genji* — first novel in history. Literary voice 1,000 years ahead. |
| 4 | **Kublai Khan** | Empire as strategy. Built systems that were content distribution before content existed. |
| 5 | **Thomas More** | Wrote *Utopia,* got beheaded for his convictions. Ultimate stress test: would you die for this content? |
| 6 | **al-Khwarizmi** | Invented algebra. The word "algorithm" comes from his name. Structured extraction is literally his legacy. |

---

#### LINEUP 66 — "The Naturalists"
*Theme: observation-first content. Write what you see.*

| Pass | Character | Why |
|------|-----------|-----|
| 1 | **Thoreau** | *Walden.* "I went to the woods because I wished to live deliberately." Conviction writing from stillness. |
| 2 | **Charles Darwin** | 20 years of data before publishing. Patient, thorough, lets evidence structure the argument. |
| 3 | **Rachel Carson** | *Silent Spring.* Changed the world with accessible, emotional science writing. |
| 4 | **Aldo Leopold** | *A Sand County Almanac.* Strategy: convince people to care about what you care about. |
| 5 | **Edward Abbey** | "Growth for the sake of growth is the ideology of the cancer cell." Provocative stress test. |
| 6 | **John James Audubon** | Drew every bird in America. Catalogued, classified, published. Systematic extraction. |

---

#### LINEUP 67 — "The Economists"
*Theme: making money make sense. Content about value.*

| Pass | Character | Why |
|------|-----------|-----|
| 1 | **Adam Smith** | *The Wealth of Nations.* Made economics readable. Wrote from moral philosophy. |
| 2 | **John Maynard Keynes** | Counter-cyclical thinking. Structural analysis that challenges the obvious. |
| 3 | **Jane Jacobs** | *Death and Life of Great American Cities.* Saw what economists missed. Human-scale voice. |
| 4 | **Warren Buffett** | Annual shareholder letters are content marketing masterclasses. Strategy in plain English. |
| 5 | **Nassim Taleb** | "If you see fraud and don't shout fraud, you are a fraud." Intellectual stress test. |
| 6 | **Peter Drucker** | "What gets measured gets managed." Clean extraction of business into actionable steps. |

---

#### LINEUP 68 — "The Revolutionaries"
*Theme: content that changes the world. Pamphlet power.*

| Pass | Character | Why |
|------|-----------|-----|
| 1 | **Thomas Paine** | *Common Sense.* The pamphlet that started a revolution. Blog post energy before blogs. |
| 2 | **Karl Marx** | (analytical lens) Structured critique of systems. 2,500 pages of analysis. |
| 3 | **Emmeline Pankhurst** | "Deeds, not words." When she DID use words, they were unforgettable. |
| 4 | **Toussaint Louverture** | Led the Haitian Revolution. Strategic genius with no resources. Cold-start playbook. |
| 5 | **Galileo** | "And yet it moves." Tested against the Pope and won. |
| 6 | **Thomas Aquinas** | *Summa Theologica.* Extracted all of Christian theology into organized questions and answers. |

---

#### LINEUP 69 — "The Healers"
*Theme: content that helps. Medical communication.*

| Pass | Character | Why |
|------|-----------|-----|
| 1 | **Hippocrates** | "First, do no harm." Write content that helps, never exploits. |
| 2 | **Florence Nightingale** | Proved with data that handwashing saves lives. Visualization pioneer. |
| 3 | **Oliver Sacks** | *The Man Who Mistook His Wife for a Hat.* Made neurology human. |
| 4 | **Jonas Salk** | Gave away the polio vaccine. "Could you patent the sun?" Strategic generosity. |
| 5 | **Ignaz Semmelweis** | Proved handwashing worked. Colleagues rejected him. If your content is right and hated, Semmelweis understands. |
| 6 | **William Harvey** | Discovered blood circulation. Mapped the system. Clean, precise extraction. |

---

#### LINEUP 70 — "The Homesteaders"
*Theme: self-reliance. Build it yourself. Scott's literal audience.*

| Pass | Character | Why |
|------|-----------|-----|
| 1 | **Laura Ingalls Wilder** | THE homeschool origin voice. Family, grit, making do. |
| 2 | **Benjamin Franklin** | Almanack structure. Practical analysis for practical people. |
| 3 | **Wendell Berry** | Farmer-poet. "The soil is the great connector of lives." Voice of land, family, community. |
| 4 | **Henry Ford** | Assembly line. Scaled individual craft to mass production. Strategy for volume. |
| 5 | **Erma Bombeck** | "If you can't make it better, laugh at it." Suburban parent stress test. |
| 6 | **Almanzo Wilder** | *Farmer Boy.* Did the work quietly, reliably, every day. Output delivered. |

---

#### LINEUP 71 — "The Wordsmiths"
*Theme: people famous for the quality of their sentences.*

| Pass | Character | Why |
|------|-----------|-----|
| 1 | **Toni Morrison** | "If there's a book that you want to read, but it hasn't been written yet, then you must write it." |
| 2 | **George Orwell** | Six rules for writing. If you break one, you'd better know why. |
| 3 | **Annie Dillard** | *Pilgrim at Tinker Creek.* Observational voice. Finds the sacred in the ordinary. |
| 4 | **David Ogilvy** | "On average, five times as many people read the headline as read the body copy." |
| 5 | **Joan Didion** | "We tell ourselves stories in order to live." If your story doesn't hold, Didion will tell you. |
| 6 | **Strunk** | "Omit needless words. Omit needless words. Omit needless words." |

---

#### LINEUP 72 — "The Alaskans"
*Theme: Scott's literal home. Content from the Last Frontier.*

| Pass | Character | Why |
|------|-----------|-----|
| 1 | **Jack London** | *The Call of the Wild, White Fang.* Alaska is in his ink. |
| 2 | **Robert Service** | "The Cremation of Sam McGee." Structured verse. Every stanza builds. The Bard of the Yukon. |
| 3 | **Velma Wallis** | *Two Old Women.* Gwich'in Athabascan author. Authentic Alaska Native voice. Survival as narrative. |
| 4 | **E.T. Barnette** | Founded Fairbanks. Built something from nothing in impossible conditions. Cold-start strategist. |
| 5 | **Sidney Huntington** | *Shadows on the Koyukuk.* If it wouldn't survive a winter on the Koyukuk, it's soft. |
| 6 | **William Dall** | Naturalist who mapped Alaska's coastline, collected 100,000+ specimens. Systematic cataloger. |

---

### ⚠️ SCOTT DECIDES — Content Council Lineup Selection

**72 total lineups:** Set A (1–36, sitcom/fiction) + Set B (37–72, historical/non-fiction).

**Pick 4 or more lineups** from either set — or mix individuals across lineups. We'll iterate on the finalists until the final 6-person Content Council is locked.

*(awaiting answer)*

---

## Section 3 — The Core Vision

*(locked until Section 2 completes)*

---

## Section 4 — The Experience Layer

*(locked until Section 3 completes)*

---

## Section 5 — Context and Memory

*(locked until Section 4 completes)*

---

## Section 6 — People, Users, and Commercial

*(locked until Section 5 completes)*

---

## Section 7 — The Primary Destination

*(locked until Section 6 completes)*

---

## Section 8 — Priorities and Ship Order

*(locked until Section 7 completes)*

---

## 📌 Pinned Questions

*(Questions that surface mid-session but would derail the current section. Revisited at the end.)*

*(none yet)*

---

## Synthesis

*(Written after all 8 sections and all pinned questions are answered. This becomes the spec.)*

---

*Document started: April 15, 2026. Last updated: April 15, 2026 — Section 1 Q1.6 pending Scott answer.*
