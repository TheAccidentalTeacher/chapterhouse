# Social Media Plan — April 15, 2026

> **Purpose:** NCHO content intelligence → content production pipeline. This document is the living brainstorm-to-build-bible for the next-generation social media system. It will be rewritten as the session progresses.
>
> **Pattern followed:** `.github/instructions/scott-dev-process.instructions.md` — The Dream Floor Brainstorm-to-Build-Bible.
>
> **Status:** 🟡 IN BRAINSTORM — Section 1 active. Do not build past open `⚠️ SCOTT DECIDES` gates.

---

## The Shape of What We're Trying to Build (working sketch — will be revised)

A content intelligence → content production pipeline for NCHO that:

1. **Watches** the homeschool world (trends + influencer voices)
2. **Proposes** blog post angles Anna can take
3. **Drafts** long-form blog posts (anchored on NCHO Shopify)
4. **Atomizes** each published blog post into social posts across all brands/platforms
5. **Measures** what performed and feeds it back into the scoring layer

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

**Q:** Last one for Section 1. When in your day does this happen? Morning before school? Evening after? Weekend batch? Knowing when you'll actually sit down with the queue tells me whether the pipeline should generate overnight and have everything waiting, or drip throughout the day.

---

## Section 2 — The Frustration Inventory

*(locked until Section 1 completes)*

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
