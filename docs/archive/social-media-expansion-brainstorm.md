# Social Media Expansion — Full Platform Brainstorm
### Living Document — Chapterhouse Social Media Management Platform
*Started: March 30, 2026. This doc evolves through Q&A sessions. Unanswered questions stay as questions. Answered questions become specs.*

---

## How This Works

Scott answers questions one at a time (or in clusters). Answers get recorded directly below each question. When a section is fully answered, it graduates to an implementation spec. The doc is never "done" — it grows as the platform grows.

**Current status of each question:**
- *(blank)* = Not yet asked
- `> ANSWER:` = Scott's response recorded
- `✅ LOCKED` = Decision made, building from this
- `⚠️ BLOCKED` = Waiting on something external

---

## SECTION 1 — Platform Priorities & Scope

*What we're building for, in what order, with what urgency.*

**Q1.** Which platforms are actively posting content TODAY for each brand? (Not "we intend to" — literally posting right now, as of this week.)

**Q2.** What's the minimum viable platform set to launch the new system? If you could only post to 3 brand+platform combos on day one, what are they?

**Q3.** Twitter/X — are you using it for any of the three brands, or have you written it off entirely? The API economics have gotten ugly ($100/mo for basic write access). Be honest.

**Q4.** Bluesky — is this a serious content channel or an experiment? The AT Protocol audience skews tech/academic. Which brand, if any, maps to that crowd?

**Q5.** Pinterest — NCHO and Alana Terry both feel like natural fits (visual, discovery-driven, evergreen content). Are either of those accounts already established, or starting from zero?

**Q6.** Reddit — this is the most fragile platform in the stack. The community will destroy a promotional account. What's the actual strategy here — value-first commenting in relevant subreddits, or something else?

**Q7.** TikTok — the political ban situation has been back-and-forth. Is TikTok a real platform investment for you, or too unstable to build on right now?

**Q8.** YouTube — you already have a channel for SomersSchool content (HeyGen videos, Gimli). Should YouTube Community posts and YouTube Shorts be managed from Chapterhouse, or is that a separate track?

**Q9.** Threads (Meta's Instagram spinoff) — it shares your Instagram follow graph. It's text-first, low-effort, high-discovery for existing Instagram audiences. Is this on the list?

**Q10.** Are there any platforms I haven't mentioned that you're already on or want to be on? (Substack, Discord, Mastodon, Snapchat, WhatsApp Business, BeReal, Tumblr, Medium, Podcast directories?)

---

## SECTION 2 — Per-Brand Platform Matrix

*Which brand goes where, and why.*

**Q11.** NCHO Shopify store — the audience is homeschool moms 30-45, faith-adjacent. Facebook is obvious. Instagram is obvious. Pinterest is a strong case (curriculum discovery is huge there). What about beyond those three?

**Q12.** SomersSchool — this is a secular homeschool SaaS. LinkedIn feels awkward for a B2C parent product. Who is the LinkedIn audience here, if there is one? Homeschool consultants? Educators?

**Q13.** Alana Terry — Anna already has an established Facebook author page and the PCW podcast audience on LifeAudio. What platforms is she actively on right now (not aspirationally — actually active)?

**Q14.** Scott Personal (`scott_personal`) — is this a real brand, or a placeholder? Would Scott ever post as himself (Alaska teacher, building in public, vibe coding) rather than under a brand name?

**Q15.** Praying Christian Women podcast — does PCW get its own social channels separate from Alana Terry? Or does all podcast promotion flow through the Alana Terry brand accounts?

**Q16.** christianbooks.today (existing Shopify store, separate from NCHO) — does it have its own social presence or is it totally dark?

**Q17.** Are there brand combinations that are definitely OFF-LIMITS? (e.g., Alana Terry on LinkedIn, SomersSchool on Pinterest, NCHO on Mastodon) Let's build a "never post here" matrix alongside the "post here" matrix.

**Q18.** Do NCHO and SomersSchool ever share content? They serve overlapping audiences but different products. Cross-pollination or strict silos?

**Q19.** What follower count / engagement milestone per platform signals "this is working and worth continuing investment"? Give me your gut instinct per brand.

**Q20.** Given May 24, 2026 is the hard deadline, which single brand's social presence is highest-priority for revenue impact before that date?

---

## SECTION 3 — Content Types & Formats

*What form the content actually takes.*

**Q21.** Instagram — are we doing static single images, carousels (2-10 images), Reels, or all three? Per brand?

**Q22.** TikTok/Instagram Reels — are you using original vertical video content or repurposing HeyGen (Scott avatar) and Gimli content at a different aspect ratio? Is anyone shooting new footage?

**Q23.** Pinterest — static pins, idea pins (video), board organization. Are boards pre-assigned per brand (NCHO: "Homeschool Math Resources," "Curriculum Picks for 4th Grade") or is that part of what we design?

**Q24.** Facebook — are you using Pages, Groups, or both? The Facebook Groups play for homeschool parents is huge — a real community, not just a broadcast channel. Is that in scope?

**Q25.** LinkedIn — Articles (long-form, indexed on Google) vs. regular posts. Do you ever want to publish a 600-word teacher thought leadership piece on LinkedIn, or is it pure post distribution?

**Q26.** What's the content ratio you're aiming for? Industry rule of thumb is 60-30-10: 60% value/educational, 30% community/engagement, 10% direct promo. Does that feel right for your brands, or different per brand?

**Q27.** Is Stories (Instagram + Facebook) part of this system? Stories are 24-hour content — ephemeral, casual, behind-the-scenes. Or is that too high-frequency to manage?

**Q28.** For NCHO product posts — do they link to the Shopify product page directly, or to a blog post / landing page? (Direct links on Instagram don't work in the copy — it has to be link-in-bio.)

**Q29.** For Alana Terry — is the priority book promotion (specific titles), series promotion, or community/podcast building? The call-to-action changes dramatically based on the answer.

**Q30.** Is there a "Scott as a person" narrative — teacher leaving rural Alaska, building a company from scratch with no prior coding, reversed Type 2 diabetes — that runs across all brands? Because that story is legitimately extraordinary and could drive significant organic reach on its own.

---

### SESSION 2 ANSWERS — Q21–Q30 (Scott, voice dictation, April 1, 2026)

**Q21 — Instagram format (answered):**
All of the above for all brands. 2–3 posts per day per brand. Use HeyGen videos already created → repurpose as Reels. Blog posts → clips/Reels. AI generates content; nobody creates fresh assets manually. High volume is the strategy, and AI makes it sustainable.

**Q22 — TikTok/Reels footage (answered):**
No new footage. Zero. All faceless or avatar-based. Scott will A/B-test avatar styles on TikTok (click-test style — find what gets traction before locking in a single approach). All video = 9:16 vertical ratio on every platform. One spec, one pipeline. No exceptions.

**Q23 — Pinterest (answered):**
Make it robust, large, fully automated. AI runs it daily — not just post copy generation but full strategy: WHAT to post, which boards, what pin descriptions, what SEO keyword targeting is right for each brand. Pinterest runs on autopilot at the same level as the weekly social cron. Not an afterthought — treat it as a primary channel.

**Q24 — Facebook (answered):**
Both Pages AND Groups. Scott wants to post INTO existing groups (respecting each group's individual terms of service — vet and document per group before posting). **He already has a real Facebook group: "The Accidental Teacher."** This is an established community asset — build ON it, not from scratch. He also wants to build additional brand-specific groups as a long-term community play.

**Q25 — LinkedIn articles (answered):**
YES — long-form teacher thought leadership on LinkedIn. Scott will execute whatever needs to be done; he needs the system to assign tasks clearly (e.g., "this article needs to be written today"). LinkedIn must be built into the weekly assignment calendar with clear prompts/briefs. Content calendared 12–18 months out. Articles, not just posts.

**Q26 — Content ratio (answered):**
5% direct promo (NOT 10%). Posting 60–80 times per week total across brands — 5% is still meaningful volume at that frequency. Every post has a clear, value-forward CTA that makes NCHO/SomersSchool part of the reader's awareness. Never overt sell-sell-sell. The ratio isn't about reducing promotion — it's about making everything else so good the 5% lands clean.

**Q27 — Stories (answered):**
YES. One Story per day, per platform (Instagram Stories + Facebook Stories). Build it into the production pipeline as a standard daily slot for each active brand. Not optional — daily cadence.

**Q28 — Outbound links (answered):**
Flexible by context. Sometimes the right destination is a direct product page. Sometimes a blog post. Sometimes a standalone sales page (SomersSchool landing, NCHO store, future product pages). The AI picks the most contextually appropriate destination per post. The system must accept a `destination_url` parameter per post — never hardcode a single link strategy across the board.

**Q29 — Alana Terry (N/A):**
Alana Terry removed from this social media automation system per D9. Her brand is handled separately and manually. Not part of this build.

**Q30 — The Scott narrative / biography (answered):**
Scott has NOT left Alaska. He is still in Glennallen, teaching. The framing of "teacher leaving rural Alaska" is NOT the story he wants told — that framing scared him. The diabetes reversal is PAST history, not current identity. He's not living in that space anymore.

He's living in: his love for children. The Accidental Teacher story. Incarnational education. Fighting corporate curriculum exploitation.

The brand narrative runs across all three active brands but is never heavy-handed:
- He stumbled into teaching with zero credentials in September 2023
- He fell in love with his students on purpose
- He built this because a curriculum company tried to exploit his work — "Never again"
- He is still there, still teaching, still in -50°F Alaska, still telling his class every Monday: "My life is better because you're in it"

The health transformation can appear as context in the biography (it's true and remarkable) — never as the centerpiece of any post. It's a detail in a larger story. **The bigger story is the love for children and the mission.**

The Accidental Teacher Facebook group already exists as an established community. SomersSchool, NCHO, and The Accidental Teacher personal brand all share this origin story, but it surfaces differently per brand context. ⚠️ Do not write posts that center the diabetes story — mention only when directly and authentically relevant.

**Q31.** For SomersSchool — do you want posts that showcase student progress (badges, completions) as social proof? With full COPPA compliance (no names, no faces, text/data only)?

> **ANSWERED:** Hard no. No student content online in any form. Not vague terms, not aggregated stats, nothing. Scott's students are not content. Full stop.

**Q32.** Evergreen content vs. timely content — what's the ratio? NCHO curriculum recommendations are evergreen (a post about a great math workbook is relevant year-round). What timely hooks exist for each brand (back-to-school, tax season, state education allotment deadlines)?

> **ANSWERED:** Mostly evergreen. Timely hooks exist and should be used (back-to-school season, state allotment application windows, product launches, classroom milestones). The AI should maintain an evergreen post queue that fills most slots and hot-swap in timely content when hooks are relevant.
>
> ⚠️ **MAJOR SYSTEM FLAG — D26:** "Alaska allotment" language must be changed to "state education allotment" everywhere across all documentation, marketing copy, SEO terms, and system prompts. Scott wants SomersSchool and NCHO to qualify and market to EVERY state that has an education allotment, ESA, or school choice program — not just Alaska. See D26 in Decisions Log.

**Q33.** Do you want the AI to produce platform-native post variations from a single topic seed? (One topic → Facebook 3-sentence post + Instagram first-line hook + LinkedIn 3-paragraph thought piece + Pinterest pin description — all in one generation job.)

> **ANSWERED:** Yes, absolutely. One topic → all platform variants in a single generation job. This is a core UI/UX requirement.
>
> 🔬 **RESEARCH TASK (assigned):** Do deep research on GitHub and other sources for open-source social media management platform UI/UX. Find what's been built, how they design the generation/review/approval interface, what patterns work. Scott wants a VERY robust user interface modeled on best-in-class examples. See Research Task R1 appended below.

**Q34.** For video content specifically — what does the production pipeline look like TODAY? Is anyone shooting video? Can HeyGen and Gimli content be the full answer for now?

> **ANSWERED (via Q22):** No new footage ever. HeyGen (Scott Mr. S avatar) + Gimli (AI-generated character, Leonardo/FLUX) = the complete video pipeline. All 9:16 vertical ratio. This IS the full answer for now and likely long-term.

**Q34b.** *(New)* The Accidental Teacher Facebook group — what's the content strategy for it specifically? Is it: (a) Scott posts curriculum tips and interacts personally, (b) a community where members share and Scott is the facilitator, or (c) a broadcast channel?

> **ANSWERED:** Model (b) — facilitated community. Members share, Scott facilitates and guides. The group originally started as a diabetes community and has a small existing presence (grew via engaging in other Facebook groups + inviting members). Scott is open to either: (1) restarting The Accidental Teacher group with a new focus, or (2) starting a fresh brand-specific group.
>
> ⚠️ **FLAG:** Circle back for full deep-dive discussion on Facebook group growth strategy. This is a major community-building pillar. Growth playbook needed: research how to grow a Facebook group from scratch or restart with a shifted identity. Do not build the social pipeline without a clear group strategy. See Research Task R2.

**Q35.** Are there post types you've seen from competitors or accounts you admire that you want to replicate? Who are you watching for inspiration on any of these platforms?

> **PENDING — not yet answered.**

**Q35b.** *(New)* LinkedIn thought leadership — what subjects is Scott most credentialed to write about for a professional educator audience? (Not homeschool parents — LinkedIn is professional educators.) Angles: AI in the classroom, rural/Title 1 education realities, curriculum design vs. delivery, accidental path to teaching, vibe coding as a teacher.

> **PENDING — not yet answered.**

---

### SESSION 3 ADDITIONAL ANSWERS — Q36–Q40 (Scott, voice dictation, March 31, 2026)

**Q36 — A/B testing TikTok avatars (answered):**
Manual process. Scott and Anna will run ABCDEF click-testing via PAID ADS driving traffic to the NCHO website. Test multiple avatar styles simultaneously, measure which drives the most clicks and conversions. Anna runs the click testing — she is experienced and good at it. **This is a confirmed, imminent action.**

> 🚨 **ADDED TO CLAUDE.MD + DREAMER + COPILOT-INSTRUCTIONS.MD — see below.** Scott explicitly asked for this to live prominently in all context files so it surfaces as a daily reminder.

**Q37 — Pinterest strategy (answered):**
Scott knows nothing about Pinterest and cannot answer strategy questions about it. He wants a full research-backed plan built from scratch — what boards to create, what to post, what keywords to target, what cadence. The system tells him what to do; he does not tell the system. **This is a research deliverable, not a Q&A item.** See Research Task R3.

> 🔴 **PROCESS NOTE:** Going forward, stop asking Scott operational/technical questions where there is no existing opinion to surface. For any question where the answer is "I don't know, you're the expert" — do the research, build the plan, and present the recommendation. He will approve or adjust. Do not treat every system design decision as a question that needs his input.

**Q38 — Weekly batch generation (answered):**
Generate full week of posts for all brands at once (most cost-efficient, single job run, least failure surface). Optimization criteria: minimize AI API cost, minimize failure points, maximize reliability. Execute all brands/platforms in one Monday batch job rather than staggered daily runs. If a batch run fails, the retry is simpler on one job than on seven.

**Q39 — Upload file → generate posts (answered):**
Not decided on overall repurposing strategy yet. BUT: there must be a dedicated "Upload a file (PDF, blog post, URL, document) → generate social posts from it" feature. Drop a PDF → tell the system what brand + platforms → get this week's (or next week's) posts generated from that content. This is a hard product requirement, not optional.

**Q40 — Holy grail post format (answered):**
No. Scott does not have a preferred format he's trying to replicate at volume. AI should figure out what works based on platform norms and engagement patterns — not a prescribed template.

---

### RESEARCH TASKS (assigned this session)

**R1 — Social Media Management Platform UI/UX Research (GitHub + broader):**
Deep research on open-source and commercial social media management platform UIs. What patterns do best-in-class tools use? How is the generate/review/approve/schedule flow laid out? What does a post card look like? How are platform-native variations displayed side by side? Find GitHub repos with relevant UI reference code. Report back with visual patterns, component ideas, and implementation recommendations for Chapterhouse's `/social` page rebuild.

**R2 — Facebook Group Growth Strategy:**
Research: how does a creator restart a dormant Facebook group with a shifted identity? What's the growth playbook for a teacher/educator community group starting from <100 members? Best practices for invite flows, engagement hooks, content cadence inside a group, and using other groups to drive membership. Deliver as a recommended playbook.

**R3 — Pinterest Strategy from Scratch:**
Research and build a full Pinterest strategy for Scott's three active brands (NCHO, SomersSchool, Scott Personal / The Accidental Teacher). Board taxonomy, pin cadence, SEO keyword approach per brand, automated pinning pipeline design, what the best homeschool/education/teacher accounts are doing on Pinterest. Deliver as a complete actionable plan — Scott will approve or adjust.

**R4 — X/Twitter Audience Research for Homeschool Market (PENDING EXECUTION):**
Deep research: is the homeschool parent audience (30–45F, faith-adjacent, convinced homeschoolers) actually reachable on X/Twitter in 2026? Scott IS on X but his personal feed is extreme right wing / libertarian political content. He sees the platform as dominated by political fighting (pro- and anti-Trump). Question: has this polarization driven away the parent/education audience Scott needs, or do homeschool/education accounts still have real reach there? Research: platform demographics post-Musk acquisition, engagement rates for parenting/homeschool/education content in 2026, whether the target persona is still discoverable there, what competitor homeschool accounts are doing on X if anything. Deliver: Yes/No/Conditional recommendation with rationale.

**R5 — TikTok Audience Research for Homeschool Market (PENDING EXECUTION):**
Deep research: is Scott's target audience (homeschool parents, 30–45F, faith-adjacent, curriculum buyers) actually on TikTok in 2026? Scott's gut: TikTok skews very young and that age group doesn't care about education products. Validate or challenge this. Research: TikTok demographics by content category, whether homeschool/parent/education content gets traction there, who the real audience is for education content on TikTok (students? parents? educators?), whether #homeschool and #homeschooltiktok have parent engagement or just teen jokes. Deliver: Yes/No/Conditional recommendation with rationale.

**R6 — Pinterest Business API Approval Process (PENDING EXECUTION):**
Scott has not applied for Pinterest Business API access and didn't know it was required. Research: what is the Pinterest API approval process? What are the requirements (account size, content type, prior Pinterest activity)? Is a small homeschool education account with <1,000 followers likely to get approved? What's the typical timeline? Is there an expedited path? Is organic publishing via Buffer a viable alternative that sidesteps API approval entirely? Deliver: recommendation on whether to apply now vs. wait, and what prerequisites to establish first.

**R7 — Best posting times for homeschool mom audience, by platform (COMPLETE):**
Global baselines from Sprout Social 2026 (2B engagements, 307K profiles) + Later.com (6M+ posts), adjusted for homeschool audience timing. Findings locked as D50.

**R8 — Homeschool seasonal trigger calendar (COMPLETE):**
Pre-load list of annual homeschool content events: co-op registration, back-to-school, state testing, convention season, ESA/allotment cycles, curriculum planning season. Findings locked as D52.

---

### RESEARCH OUTPUT — R4: X/Twitter Audience Research (Completed March 31, 2026)

**Source:** Sprout Social 2026 Twitter Statistics Report (sproutsocial.com, March 2026)

**The numbers:**
- **251 million daily active users**, 557M ad reach
- **Gender: 64.4% male.** X is one of the most male-skewed major platforms.
- **Age: 25–34 = 37.5%, 18–24 = 32.1%, 35–49 = 21.1%.** Scott's target (women 30–45) is roughly 10–12% of the user base.
- **Primary use: 60% use X for news and current events.** Second most popular: researching brands (38%). Entertainment third (35.7%). It is not a community platform. It is not a shopping platform. It is a news and discourse platform.
- **Top industries by engagement:** Sports (0.073%), Higher Education (0.036%), Financial Services (0.025%). Education does better than average but the absolute numbers are tiny.
- **Top content format:** Short-form video (37%) barely edges text posts (36%). Carousels don’t exist as a format on X.
- **Political reality confirmed:** X is now the #1 platform for real-time news and political discourse. This is baked into the demographics and use patterns.

**Scott’s gut: CORRECT.**
His target persona — homeschool mom, 30–45, faith-adjacent, conviction-driven curriculum buyer — is a small minority on X. She is there, but she is not there FOR content like Scott's. She is there to argue about school board elections or follow a few accounts she trusts. She is not in discovery mode. She is not in shopping mode.

**Verdict for the pipeline: ⛔ Skip API. Manual personal brand only.**
- Do NOT pay $100/month for X Basic API access.
- Do NOT build X into the Chapterhouse social automation pipeline.
- IF Scott wants to post on X personally: manual, text-based, teacher voice, no images required. Scott's "accidental teacher" narrative (vibe coding, Alaska, building a business after 20 years) is the ONE content type that would work there. But that's a personal brand play, not a scale play.
- **Do not build infrastructure for this audience on this platform right now.**

> **D37 locked: X/Twitter — dropped from pipeline.** See decisions log.

---

### RESEARCH OUTPUT — R5: TikTok Audience Research (Completed March 31, 2026)

**Sources:** Sprout Social 2026 TikTok Stats (March 2026), BusinessOfApps TikTok Statistics (2026)

**The numbers:**
- **1.99 billion monthly active users globally.** Not a small platform.
- **Age demographics (global):** 18–24 = 30.7%, **25–34 = 35.3%**, 35–44 = 16.4%, 45–54 = 9.2%, 55+ = 8.4%
- **Gender:** 55.7% male / 44.3% female (for reference, Instagram is 52.5% male)
- **Gen Z saturation:** 72% of Gen Z has a TikTok account. It is *the* Gen Z platform.
- **But:** BusinessOfApps age brackets show 13–17 = 21%, 18–24 = 30.2%, 25–34 = 23.3% — so over 50% of users are under 25.
- **Engagement rate: 3.73%** — highest of any platform by a wide margin. This is real.
- **Primary use:** Trends and cultural moments (37%), product discovery for Gen Z (42%)
- **TikTok Shop top categories:** Beauty/personal care, women's fashion, household items. **Education curriculum is not in the top purchase categories.**
- **Average session:** 1 hour 37 minutes per user per day. More than any other platform.

**Scott’s gut: MOSTLY CORRECT with one nuance.**

His target buyer (homeschool mom, 35–45) is **16.4%** of TikTok's user base at most. The platform skews young. The primary use case is entertainment and trends, not deliberate curriculum shopping. A conviction-driven purchase (“I am going to enroll my child in SomersSchool for this school year”) does not happen in a TikTok scroll the way it does from a Facebook group post or a Pinterest pin that gets saved.

**However — the nuance Scott should know:**
There IS a real #homeschoolmom and #homeschool community on TikTok. It skews younger (the new wave of 25–35-year-old mothers who started homeschooling post-COVID). These are not Scott’s primary buyers yet — but they will be as they age into the homeschool system. TikTok is an awareness play, not a conversion play for this audience.

Also: **Gimli is a TikTok-native character.** A 15-30 second animated Gimli clip explaining one thing (“Why the American Revolution actually started with a tea tax”) is exactly the content format TikTok rewards. This is not a curriculum pitch. It is brand-building that puts SomersSchool in front of a younger generation of homeschool parents before they’re ready to buy.

**Verdict for the pipeline: 🟡 Conditional — Gimli shorts only, no subscription pipeline.**
- Do NOT build a TikTok subscription/enrollment conversion funnel.
- Do NOT put curriculum feature posts on TikTok.
- Gimli short-form clips (15–30 sec, one concept, visually engaging, no audio required) = YES as a future play.
- This is a brand-building channel, not a conversion channel. Build it AFTER the primary conversion infrastructure (Facebook, Instagram) is working.

> **D38 locked: TikTok — Gimli-only brand-building channel, not in pipeline.** See decisions log.

---

### RESEARCH OUTPUT — R6: Pinterest Business API Approval (Completed March 31, 2026)

**Source:** Pinterest Developer Documentation (developers.pinterest.com, accessed March 31, 2026)

**The process — simpler than Scott thought:**
1. **Prerequisite:** Pinterest Business account (free to create at business.pinterest.com)
2. **Verify email address** on the business account
3. **Go to developers.pinterest.com/apps** — accept Developer Terms of Service
4. **Fill out a request form** with app name, description, use case
5. **Applications reviewed each business day** — you get an email when approved
6. **Trial access is granted first** — lets you test all API endpoints with a temporary token
7. There is **NO minimum follower count** mentioned. Approval is based on use case legitimacy, not account size.

**Is a small homeschool education account likely to get approved?**
Yes. The Pinterest API is not heavily gatekept like Meta. A creator/educator registering an app to automate publishing for their own accounts is the exact intended use case. Buffer already has Pinterest integration fully built — which means if you’re going through Buffer, you may not need the Pinterest API directly at all. Buffer handles the OAuth scope for you.

**Recommendation: Apply this week.** Steps:
1. Make sure you have a Pinterest Business account for NCHO, SomersSchool, and Scott Personal
2. Go to developers.pinterest.com/apps and register one Chapterhouse app
3. Describe use case: "social media management and content scheduling for three education/homeschool brands"
4. Get trial access (same business day or next)
5. Then either: wire directly into Chapterhouse OR confirm Buffer handles Pinterest scheduling (it does)

**Buffer path (recommended for now):** Buffer’s Pinterest integration uses their own OAuth flow — you just connect your Pinterest Business accounts inside Buffer. No separate API application needed on Pinterest’s end for Buffer-mediated posting. **Apply for the Chapterhouse direct API access anyway** so you have the option, but Buffer is the faster path right now.

> **D39 locked: Pinterest API — apply this week, use Buffer integration as primary path.** See decisions log.

---

### RESEARCH OUTPUT — R7: Best Posting Times for Homeschool Audience (Completed March 31, 2026)

**Sources:** Sprout Social 2026 Social Media Industry Report (2B engagements, 307K profiles, Nov 2025–Feb 2026) + Later.com Optimal Posting Times Analysis (6M+ posts)

**Global baseline by platform:**

| Platform | Best Days | Best Times (Local) |
|---|---|---|
| **Facebook** | Mon–Thu | 12–8 PM (peak Tue/Wed) |
| **Instagram** | Mon–Thu | 12–4 PM midday — OR — overnight schedule for 5 AM slot |
| **Pinterest** | Mon–Fri | 10 AM–1 PM (peak Tue–Thu) |
| **LinkedIn** | Mon–Fri | 11 AM–5 PM (peak Tue/Wed) |
| **YouTube** | Wed–Fri | 12–3 PM |

**Homeschool mom audience adjustment:**
Global baselines skew toward 9–5 office workers (lunch break scrolling). Homeschool moms are home. Their schedule: morning prep (5–8 AM), active school hours (8 AM–12 PM, mostly occupied), post-school relax window (2–4 PM), evening (7–10 PM). Recommended adjustments:
- **Facebook:** 7–9 AM (morning coffee) or 2–4 PM (post-school wrap-up)
- **Instagram:** Schedule overnight for 5 AM slot (highest engagement rate per Later.com)
- **Pinterest:** 10 AM–12 PM Tue–Thu (planners plan mid-morning, midweek)
- **LinkedIn:** 11 AM–1 PM (stays same — SomersSchool's LinkedIn targets educators, not just moms)

**Override rule (locked as D50):** After 30 days live, use platform native analytics + Buffer to override these defaults with actual audience activity windows. Global baselines are the starting point only.

> **D50 locked: use global baselines as defaults; override with real data at 30 days.** See decisions log.

---

### RESEARCH OUTPUT — R8: Homeschool Seasonal Trigger Calendar (Completed March 31, 2026)

**Source:** Known homeschool calendar patterns + HSLDA, THSC, FPEA convention schedules

**Annual calendar triggers to pre-load as content suggestion events:**

| Season | Trigger Event | Typical Window | Brands Most Affected |
|---|---|---|---|
| Summer | Co-op registration opens | July–August | NCHO, SomersSchool |
| Late Summer | Back-to-homeschool push | August–September | NCHO, SomersSchool |
| Fall | State testing registration | September–October | SomersSchool |
| Fall/Winter | Curriculum planning season | November–December | NCHO, SomersSchool |
| Winter | Holiday gift curriculum buying | November–December | NCHO |
| Spring | Convention season begins | March–May | NCHO, SomersSchool |
| Spring | THSC Texas Convention | March (varies) | NCHO, SomersSchool |
| Spring | FPEA Florida Convention | May (varies) | NCHO, SomersSchool |
| Spring | State testing windows | March–May (varies) | SomersSchool |
| Year-round | ESA/allotment application cycles | State-specific; AK: spring | NCHO, SomersSchool |

**How these fire in the pipeline:**
Content suggestion triggers, not mandatory posts. When a trigger date approaches (within 14 days), the pipeline surfaces 2–3 brand-relevant post suggestions in the review queue labeled "📅 Seasonal Trigger: [Event]". Scott approves or skips. No automated publishing of seasonal content — review required.

> **D52 locked: seasonal triggers pre-loaded as content suggestion events, not auto-posts.** See decisions log.

---

 — Q41–Q49 (Scott, voice dictation, March 31, 2026)

**Q41 — X/Twitter for homeschool market (answered: research needed):**
Scott IS on X but his feed is extreme right-wing because he's libertarian and tends to follow right-wing media. He observes that the platform has become dominated by political fighting — either attacking or defending the presidential administration. His real question: is his target audience (homeschool moms, faith-adjacent, 30-45) even living on X in 2026, or has the political drift of the platform pushed them elsewhere? → **Assigned as Research Task R4.** Decision pending R4 output.

**Q42 — Pinterest Business API (answered: research needed):**
Has NOT applied. Didn't know Pinterest required a separate Business API application. Wants to understand: (a) what the approval process looks like, (b) whether a small homeschool account is likely to get approved. → **Assigned as Research Task R6.** Decision pending R6 output.

**Q43 — TikTok for homeschool market (answered: strong skepticism + research needed):**
Gut instinct: TikTok = very young audience that doesn't care about education. Doesn't think his target audience lives there. BUT — wants the same thorough research treatment as X/Twitter before making the final call. → **Assigned as Research Task R5.** Decision pending R5 output.

**Q44 — Bluesky (answered: DROPPED ⛔):**
No. Bluesky is perceived as too left-leaning for Scott's audience. His target customers are faith-adjacent, entrepreneurial, conservative-Christian-adjacent homeschool parents — not Bluesky's demographic. Platform removed from consideration. See D29.

**Q45 — Instagram carousels (answered: YES, prioritized ✅):**
Strong yes. Scott is personally drawn to carousels more than videos as an Instagram user. Use case he described: late at night, laying in bed, doesn't want to disturb Anna — browses carousels silently. This is exactly the idle-scroll browsing behavior carousels are built for. "I like the carousel idea an awful lot." See D30.

**Q46 — Post preview / review flow (answered: semi-auto first, then full auto ✅):**
Yes to review flow at launch. He wants a semi-automated phase while he builds trust that the system isn't going to produce TOS violations or embarrassing posts. Once that confidence is established, transition to full automation. Progressive automation architecture: semi-auto → full auto. See D31.

**Q47 — Scheduling conflict detection (answered: just let it through ✅):**
No conflict warnings. If two posts for the same brand land within 30 minutes of each other, just publish both. Don't interrupt the flow with warnings. See D32.

**Q48 — Auto image generation on `image_brief` field (answered: AUTO with manual override ✅):**
Automatic — when a post has an `image_brief` field, image generation triggers in the background automatically. Manual override is a per-brand or per-post setting. See D36.

**Q49 — Recurring post templates (answered: YES ✅):**
Yes. He liked this idea during his diabetes content phase — ran a "1 Minute Diabetes Destroyer" daily series and got traction. Observation: 1 minute was too long for today's attention spans. Also articulated his content philosophy: informational posts YES, but not overly dense or intense. Carousels work because you can browse selectively — stop if a card interests you, scroll past if not. He's asking for a "happy medium" content style that is useful and browsable without being lecture-dense. **This is a design principle, not a question — see D33 and the carousel content architecture note below.**

> 📐 **CONTENT ARCHITECTURE NOTE:** The "happy medium" Scott is describing is a carousel-first, snackable-informational content model:
> - Each carousel card = one digestible idea (not a paragraph, a sentence + visual)
> - 3–7 cards per carousel (respects scroll fatigue ← 5 is the sweet spot)
> - Card 1 = hook (the problem or the thing they didn't know)
> - Cards 2–5 = quick wins / insights (one per card)
> - Final card = soft CTA (not "BUY NOW", something like "save this post" or "link in bio for the full unit")
> - This format works silently (no audio needed), is platform-native on Instagram and Facebook, and rewards the browser without demanding full attention. AI generates all 5–7 captions; Cloudinary renders the images at the right dimensions. This is the default SomersSchool and NCHO carousel template.

---

## SECTION 4 — Technical Architecture

*The plumbing that makes it all work.*

**Q36.** Buffer is your current scheduler and you're on the free tier (3 channel slots). To post to 4 brands × 7 platforms = up to 28 channels, you'd need Buffer Team (or equivalent). What's your budget tolerance for a scheduler? Buffer Team is ~$12-15/channel/month. Alternatives: Later (~$45/mo flat), SocialBee (~$29/mo flat), Publer (~$50/mo).

**Q37.** Have you explored building direct platform API integrations instead of going through Buffer? Facebook/Instagram (Meta API), Pinterest API, LinkedIn API, and X API all have direct publisher access. More complexity, more control, no monthly scheduler fee.

**Q38.** X/Twitter API tiers: Free = 1,500 tweet writes/month (barely functional). Basic = $100/month = 10,000 writes. If you want to post to X, you need to budget for Basic at minimum. Deal-breaker or cost-of-doing-business?

**Q39.** Pinterest API — requires a Business account and API approval. Have you applied? The Ads API is free for organic publishing.

**Q40.** TikTok Business API — requires a TikTok Business account, API approval, and has strict policies about AI-generated content disclosure. Has any of this been set up?

**Q41.** Bluesky uses the AT Protocol — fully open, no cost, direct API available. No API key required beyond creating an account. This could be a zero-cost channel. Does anyone in your stack need Bluesky support?

**Q42.** Instagram carousels (2-10 images) require a different API call structure than single-image posts. Buffer handles this. If you go direct API, it's a separate upload flow. Is carousel format important enough to spec separately?

**Q43.** For platforms where you eventually go direct API — should the authentication/token storage live in Supabase (encrypted) or in environment variables? (The platform API token issue maps directly to the security architecture.)

**Q44.** Should each brand have its own "social media manager" login concept, or does everything run under one Chapterhouse auth user?

**Q45.** Do you want a post preview before approval that renders what the post will look like on each platform? (Mock-up with character count, hashtag position, link preview card.)

**Q46.** Post scheduling conflict detection — if two NCHO posts are scheduled within 30 minutes of each other on Instagram, should the system warn you?

**Q47.** Do you want a "best time to post" AI suggestion based on your historical engagement data? This needs Buffer analytics or platform insights to work.

**Q48.** Auto-retry logic: if a post fails to publish (Buffer error, platform 5xx), should it auto-retry 3x and then alert you? Or manual retry only?

**Q49.** For image attachments — should every post that has an `image_brief` automatically trigger an image generation job (Leonardo/Flux/GPT Image), or should image generation be an optional manual step in the review flow?

**Q50.** Should the system support scheduling recurring posts? (E.g., NCHO "weekly curriculum pick" — same template, different product, every Tuesday at 9AM.)

---

 — Q51–Q60 (Scott, voice dictation, March 31, 2026)

**Q51 — Cloudinary resize targets (confirmed: 5-image set ✅):**
Confirmed. Standard resize set from one master source image: Instagram square (1080×1080), Instagram portrait (1080×1350), Facebook/LinkedIn (1200×630), Pinterest pin (1000×1500), Story/Reel cover (1080×1920). X/Twitter and TikTok dimensions excluded — platforms dropped from pipeline per D37/D38.

**Q52 — Text overlays on images (already locked, confirmed ✅):**
Already locked. Clean images generated text-free; captions/labels added via Cloudinary URL transforms at render time. Enables reuse across platforms with different text requirements. Confirmed.

**Q53 — K-5 educational mascot (answered: DOGS — not Gimli-as-character ⚠️ SIGNIFICANT CHANGE):**
Gimli (the real 125-lb malamute) is still Scott's dog. But **Gimli-as-consistent-AI-character for K-5 content is DEFERRED** — AI character consistency is too unreliable without a solved LoRA/seed approach. Decision: the K-5 educational mascot is **dogs — various breeds, context-appropriate, educational illustration style**. Different dogs for different topics and grades. Variety is intentional. No character consistency requirement — much simpler to generate reliably. Scott may revisit Gimli-as-character once the consistency problem is solved. **All documentation updated to reflect this.** → **D40**

**Q54 — Alana Terry book covers (answered: N/A — brand deferred ✅):**
Not posting for Alana Terry brand in this pipeline build phase. When Anna is ready to market her books, that lane will run under the christianbooks.today channel separately. No infrastructure needed now. → **D41**

**Q55 — Carousel slide copy + automation philosophy (answered: FULL AI AUTOMATION ✅):**
AI generates all of it — all carousel card captions, hashtags, image briefs — in one job. No manual text entry in the generation phase. Scott's north star: wake up Monday morning, click generate, have everything generate and post without touching it. AI chatbots eventually handle comment replies too. Semi-auto at launch, progressively automated. → **D42**

> 🤖 **NEW DESIGN PRINCIPLE — AI Disclosure Label:** Scott specifically stated he does not want users to be surprised that AI generated this content. All AI-generated social posts must carry a visible AI disclosure indicator — small, consistent, always present. Exact implementation (Cloudinary watermark text "✨ AI", caption tag, or post label) is a UI decision — but **transparency about AI generation is a brand value, non-negotiable.** → **D43**

**Q56 — TikTok/Reels production process (N/A — TikTok dropped from pipeline, D38):**
Skipped.

**Q57 — Pinterest SEO text (answered: full AI automation ✅):**
Scott's answer: "If it can be automated and AI generated, yes." Pinterest board descriptions, pin titles, and SEO keyword copy are ALL AI-generated alongside the image and caption. No manual handling. Scott's universal rule: if it can be automated, automate it. → **D48**

**Q58 — Watermarks and branding (answered: small URL watermark on NCHO + SomersSchool ✅):**
NCHO post images: small "nextchapterhomeschool.com" URL watermark — very small, non-intrusive. SomersSchool: equivalent small URL watermark. Both applied via Cloudinary text overlay at render time. Alana Terry: N/A (deferred). Scott Personal: none. → **D44**

**Q59 — Image generation failure fallback (answered: text-only to review queue ✅):**
Image failure does NOT block the post. Goes to queue as text-only with "image pending" state and a **"Regenerate Image"** button inline in the review card. Clicking triggers a new generation job; image replaces inline when complete. Post can be approved text-only at any time. → **D45**

**Q60 — Stock photos vs. AI-generated (answered: NO stock photos for automation ✅):**
Pexels/Pixabay/Unsplash excluded from the automated social pipeline. Concept-to-result mismatch is too unpredictable for automation. AI-generated images (Leonardo/Flux) only. Educational-specific stock APIs may be evaluated in future if content quality can be guaranteed. → **D46**

> ⚠️ **NEW PIPELINE REQUIREMENT — Negative Prompts:** Scott identified that AI images without negative prompts produce artifacts (extra limbs, blurry faces, distorted hands). **All image generation prompts in the social pipeline MUST include a negative prompt block.** Not optional. Extend the existing `characters.negative_prompt` pattern to the social pipeline. → **D47**

---

## SECTION 5 — Visual & Media Pipeline

*Images, video, and media specs per platform.*

**Q51.** Here are the standard platform image dimensions. Which of these do you want Cloudinary to auto-resize to from a single master image?
- Instagram square: 1080×1080 (1:1)
- Instagram portrait: 1080×1350 (4:5)
- Instagram Story/Reel cover: 1080×1920 (9:16)
- Facebook post: 1200×630 (1.91:1)
- LinkedIn post: 1200×627 (1.91:1)
- Pinterest pin: 1000×1500 (2:3)
- Twitter/X card: 1200×675 (16:9)
- TikTok cover: 1080×1920 (9:16)

**Q52.** Should images have text overlays baked via Cloudinary URL transforms (no image re-generation needed) or should every image be generated clean and text added separately?

**Q53.** For Gimli on NCHO posts — should Gimli character illustration appear in NCHO social content, or is Gimli strictly SomersSchool content?

**Q54.** For Alana Terry posts — book cover images. Are those already in Cloudinary, or would they need to be uploaded? Cover images should pull automatically for book promotion posts.

**Q55.** Instagram carousels: are you generating 2-10 individual images per carousel post? Who writes the copy for each slide?

**Q56.** For TikTok/Reels — is the process: (1) generate script, (2) HeyGen renders avatar video, (3) assemble in Flixier, (4) post? Or is there a simpler path for short-form?

**Q57.** Pinterest — do you want AI-generated board descriptions and pin titles alongside the image and caption, or just the image/caption?

**Q58.** Watermarks and branding — should NCHO posts have a subtle logo/URL watermark on images? What about SomersSchool? Alana Terry author photos?

**Q59.** When image generation fails (Leonardo/Flux quota exceeded) — should the post still go to review queue (text-only) or should image failure block the post?

**Q60.** Stock photos vs. AI-generated — you have Pexels/Pixabay/Unsplash wired already. For which brands/content types is stock photo acceptable vs. must-be-AI-generated?

---

## SECTION 6 — Scheduling, Timing & Calendar

*When things post, how often, how far out.*

**Q61.** What's your target posting frequency per brand per week? Give me your gut instinct — how aggressive do you want to be?
- NCHO: ___ posts/week
- SomersSchool: ___ posts/week
- Alana Terry: ___ posts/week
- Scott Personal: ___ posts/week

**Q62.** Do you have a mental model or research on the best posting times for homeschool moms specifically? (The audience is home. Kids' nap time, before school, after dinner?) Does this vary by platform?

**Q63.** Do you want a content calendar view in Chapterhouse? A week-grid or month-grid showing all scheduled posts across all brands?

**Q64.** Holiday and seasonal triggers — there are homeschool-specific calendar events (co-op registration periods, allotment deadlines, state testing seasons, convention season in spring). Do you want these pre-loaded as content trigger dates?

**Q65.** Evergreen recycling — should high-performing posts be automatically re-queued every 90 days for platforms that have long content half-lives (Pinterest, LinkedIn)?

**Q66.** Quiet periods — no posting on Sundays? No posting during major Christian holidays for Alana Terry posts? Do you want configurable blackout dates?

**Q67.** How far ahead do you want to schedule? Does 2 weeks of buffer feel right, or do you want a full month scheduled at all times?

**Q68.** Does the Shopify product webhook behavior feel right? Right now a new product auto-generates NCHO social posts. Should there be an approval step before those posts enter the queue, or can the AI-generated posts go straight to pending review without a secondary gate?

---

### — Q61–Q68 (Scott, voice dictation, March 31, 2026)

**Q61 — Posting frequency per brand per week (answered ✅):**
3 posts per week per active brand (NCHO, SomersSchool, Scott Personal). Alana Terry remains deferred (D41). Total minimum: ~9 posts/week across 3 brands. Aspirational pipeline additions (v2, not day-one): 2 YouTube videos/week (shared/cross-brand) + 1 ElevenLabs AI-generated podcast episode/week. → **D49**

**Q62 — Best posting times for homeschool moms (research required → R7 ✅):**
Scott requested deep research before locking times. Research complete (R7 — Sprout Social 2026 + Later.com). Recommendation: Facebook 7–9 AM or 2–4 PM local; Instagram overnight schedule for 5 AM slot; Pinterest 10 AM–12 PM midweek (Tue–Thu); LinkedIn 11 AM–1 PM. Homeschool-specific adjustment offsets office-worker baselines toward early AM (pre-school prep) and early afternoon (post-school wrap-up). Override rule: after 30 days live, use native analytics + Buffer to adjust. → **D50**

**Q63 — Content calendar UI (answered ✅):**
Full content calendar inside Chapterhouse. Week-grid is the default view. Month-grid and day-view also available (user can switch). Shows all active brands simultaneously. Review queue buffer zone visible within calendar (pending posts shown in distinct visual state). → **D51**

**Q64 — Homeschool seasonal triggers (research required → R8 ✅):**
Scott requested deep research. R8 complete. Pre-load the following as system content trigger events: co-op registration (Jul–Aug); back-to-homeschool (Aug–Sep); state testing registration (Sep–Oct); convention season (Mar–May: THSC TX, FPEA FL); ESA/allotment cycles (state-specific; AK quarterly); curriculum planning season (Nov–Dec); holiday curriculum buying (Nov–Dec). Fires as review queue suggestions — not auto-posts. → **D52**

**Q65 — Evergreen recycling (answered ✅):**
YES. High-performing posts auto-requeue every 90 days. Cross-platform reuse enabled — a post that performs on Facebook can be adapted and requeued on Pinterest and LinkedIn. Buffer (or equivalent) monitors performance; anything above threshold triggers the requeue job. Viral posts flagged for manual review before reuse. "Wash, rinse, repeat." → **D53**

**Q66 — Blackout dates (answered: none ✅):**
No blackout dates. Post 7 days a week including Sundays. Scott explicitly confirmed Sunday posting does not conflict with his convictions. → **D54**

**Q67 — How far ahead to schedule (answered ✅):**
Planning horizon: 90 days of content planned at any given time. Deeply planned (actual post drafts): 1 full month minimum. Rolling weekly execution: always at least 7 days of approved posts queued ahead of today. Cadence: generate a week → queue the next week. Scott always knows 7+ days ahead what he needs to physically produce (video appearances, recordings, etc.). → **D55**

**Q68 — Shopify product webhook (confirmed ✅):**
Confirmed correct. New Shopify product → automatically generates NCHO social posts → enters review queue as pending. No secondary gate before queue entry. Scott reviews and approves from the queue. → locked per existing design.

---

## SECTION 7 — Brand Voice Per New Platform

*The tone, culture, and rules for platforms not currently specced.*

**Q69.** X/Twitter voice for each brand — X has a different energy than Facebook. It's public, clipped, quote-retweetable. Do you want a specific X voice for NCHO (homeschool teacher brevity vs. Facebook warmth)?

**Q70.** Pinterest voice — pin descriptions are SEO text, not social copy. They should contain keywords people search for ("secular homeschool math curriculum 4th grade"). Is that handled separately from the social copywriting prompt?

**Q71.** TikTok captions are 150 characters max visible before truncation. Hook in the first 3 words. Ultra-aggressive hashtag use (7-10 tags). Is TikTok caption strategy built into the brand voice, or is it its own config section?

**Q72.** Bluesky culture is tech-adjacent, community-focused, no algorithm. Posts thrive on authenticity and directness. Which brand voice maps best to Bluesky without modification, and which would need a Bluesky-specific fork?

**Q73.** Reddit strategy is fundamentally different — it's never promotional, always value-first. Should Reddit responses be a separate module entirely (not generated with the social post pipeline, but with a "suggested comment" tool for relevant threads)?

**Q74.** LinkedIn for SomersSchool — if we use it, it should probably target homeschool consultants, educational therapists, and co-op leaders rather than end-parent consumers. Is that a different brand voice than the parent-facing Instagram content?

**Q75.** For platforms where you're building from zero followers — should the AI generate "introduction posts" (who we are, what we're about) rather than standard content posts for the first 3-5 pieces?

**Q76.** Does the current Brand Voices DB (migration 023) in Settings have the right structure to add new platform-specific rules, or does the schema need to expand? (Right now `platform_hints` is a JSONB field — it can hold any platform key without a migration.)

---

### — Q69–Q76 (Scott, voice dictation, March 31, 2026)

**Q69 — X/Twitter voice for Scott Personal (answered ✅):**
X/Twitter is Scott Personal brand only — not NCHO or SomersSchool in the automation pipeline. Voice: **Insider Credentialed Critic.** 20+ years in the classroom. Content focus: the systemic failure of public education from the inside — not the media's surface narrative, but the deep structural evidence only a classroom teacher can provide. Goal: "expand the reasons why people should question public education" for an audience that already distrusts it. Direct. Convicted. Factual. "Preaching to the choir, but upgrading the argument." NOT partisan political fighting — educator truth-telling with receipts. → **D57**

**Q70 — Pinterest voice (deferred — full handholding mode required):**
Scott has zero Pinterest knowledge. Explicit instruction: "Feed everything Pinterest to me with a spoon, like a newborn baby. I do not know Pinterest." Every Pinterest decision in this brainstorm must be delivered as a concrete recommendation for Scott to approve or adjust — never as an open question Scott has to answer independently. This applies to ALL Pinterest topics: board taxonomy, pin cadence, SEO copy structure, voice, board naming, everything. Scott will learn Pinterest by approving or adjusting specific recommendations. → **Pinterest Protocol: recommendation-first, validate-second. No open Pinterest questions going forward.**

**Q71 — TikTok captions (not answered — governed by D38):**
TikTok = Gimli-only brand-building channel (D38). TikTok caption strategy is part of the Gimli/video production pipeline, not the main social post pipeline. Not a priority until the primary conversion infrastructure (Facebook, Instagram) is operating.

**Q72 — Bluesky (confirmed dropped ✅):**
Confirmed. D29. ⛔

**Q73 — Threads (answered: deprioritize ✅):**
Scott: "I don't think anybody even cares about it. LinkedIn is far more important." Verdict: minimum viable — auto-copy Instagram posts to Threads via the same Meta pipeline. Zero dedicated voice work, zero dedicated strategy, no Threads-specific review cards. One post, two platforms for free. → **D58**

**Q74 — LinkedIn voice (answered ✅):**
Professional. Direct. Diplomatic. Scott's formula: "Never pull my punches, always say what I believe, but say it professionally." Precision over heat. Educator authority rather than culture-war framing. For SomersSchool specifically: audience shifts toward educators, co-op leaders, curriculum consultants, and homeschool advocates — peer-to-peer professional voice, not parent-persuasion copy. → **D59**

**Q75 — YouTube video descriptions (answered ✅):**
Pipeline auto-generates YouTube descriptions from script/slide content. Scott never writes these manually. Descriptions enter review queue for approval before publishing. "I might approve it manually, but I'm never going to write it manually." → **D60**

**Q76 — Voice correction mechanism (my hard recommendation ✅):**
Scott asked for a hard stance, not agreement. Here it is:

**Wrong answer: "Regenerate with feedback" as the primary correction mechanism.** Asking Scott to type "too corporate, redo it warmer" is asking him to translate a felt impression into words. That translation is imprecise, the loop rarely converges, and it treats the symptom not the cause.

**Right answer: edits ARE the correction. Let them teach the system.** When Scott edits a post in the review queue before approving it, that edit is the clearest possible signal — no translation required. The system should capture the before/after diff automatically. After 20+ edit signals accumulate for a brand, Claude analyzes the diffs and proposes a revised `brand_voices` profile text. Scott approves the update in one click. Brand voice improves every week without Scott doing anything extra. This is the autoresearch loop principle applied to voice calibration:

1. Every manually edited review card saves a `voice_example` diff (before → after) to the `brand_voices` record for that brand
2. **"Voice Refinement" button** in Settings → Brand Voices panel — triggers Claude to analyze accumulated diffs and propose updated voice profile text
3. Scott approves or rejects the proposed update in one click
4. **Regenerate button EXISTS** on review cards as a secondary option — for total rewrites only (post so far off that editing line-by-line takes longer than starting fresh)

The regenerate button is a painkiller. The edit-to-learn system is the cure. → **D56**

---

## SECTION 8 — Community Management

*Comments, DMs, and responding to the audience.*

**Q77.** Do you want AI-assisted reply drafts for comments? The flow would be: comment comes in → AI drafts 2-3 reply options → Scott/Anna picks one or edits → posts. Or is comment management fully manual?

**Q78.** For NCHO — customer service questions in comments/DMs (shipping times, product availability, returns). Should there be a FAQ auto-responder for the most common questions?

**Q79.** For Alana Terry — Anna's readers expect a personal connection. Does she want comment drafts she can personalize, or would AI-drafted responses feel inauthentic and she'd rather skip that feature entirely?

**Q80.** For negative comments or reviews — what's the protocol? Ignore, respond calmly, delete, or something else? Is there a brand-specific policy?

**Q81.** Brand monitoring — should Chapterhouse alert you when your brand name is mentioned across platforms, even when you're not tagged? (Requires a social listening layer, which is a separate technical track.)

**Q82.** DM volume management — if NCHO takes off and Instagram DMs get heavy, is there a "I'll respond within 24 hours" auto-reply that buys time?

**Q83.** For SomersSchool specifically — if a parent asks about curriculum content in a comment (faith-based, secular, etc.) — these are sensitive questions. Does the AI draft ever touch that terrain, or is it human-only?

**Q84.** For Reddit — if a highly relevant thread appears where someone is asking for exactly what NCHO or SomersSchool offers, do you want to be notified so you can respond personally (as Scott, authentically)?

---

### — Q77–Q84 (Scott, voice dictation, March 31, 2026)

**Q77 — AI reply drafts for comments (answered ✅):**
YES. AI generates 2–3 reply options. Scott reviews and picks one, or goes in manually and writes his own. No auto-posting of replies — always human-approved. → **D61**

**Q78 — FAQ auto-responder + community management ownership (answered ✅ + critical clarification):**
YES to FAQ auto-responder for common NCHO questions (shipping, allotment eligibility, returns, etc.). **Critical correction to earlier framing:** ALL community management goes to Scott — not Anna. 100%. Scott handles every comment, DM, and reply across all brands in this system. Anna is helping build this business but she does not want to be a face of it. She has her own separate work entirely. This system is Scott's business. → **D62**

**Q79 — Alana Terry reader comments (answered: out of scope ✅):**
This question assumed Anna manages Alana Terry community engagement as part of this system. That assumption is wrong. Alana Terry is Anna's independent author brand — completely separate from Chapterhouse. If Alana Terry is ever added to this system's pipeline (deferred — D41), Scott would still be the one managing community, not Anna. Anna's Alana Terry work is outside the scope of Chapterhouse entirely. → Reinforces D41. No new decision needed.

**Q80 — Negative comments protocol (answered ✅):**
Ignore and delete. No public response, no engagement with bad-faith comments. Clean feed policy. → **D63**

**Q81 — Brand monitoring (answered ✅):**
YES. Scott wants alerts when "NCHO", "Next Chapter Homeschool", "SomersSchool", or "The Accidental Teacher" are mentioned across platforms without a tag. Separate technical track (social listening layer). Worth building. Correct spelling confirmed by Scott: **SomersSchool** (one word, camelCase). → **D64**

**Q82 — DM auto-reply (answered ✅):**
YES. "I’ll respond within 24 hours" auto-reply when DM volume gets heavy. Buys time, prevents open-read abandonment. → **D65**

**Q83 — Curriculum content questions: AI-draft or human-only (answered ✅):**
Human-only. AI never drafts responses to questions about curriculum content (secular vs. faith-based, standards alignment, content warnings, etc.). These are legally and reputationally sensitive under Alaska Statute 14.03.320 and COPPA architecture. Scott answers manually. → **D66**

**Q84 — Reddit flagging (answered ✅):**
YES to flagging. **NO to auto-posting.** Chapterhouse flags the thread, surfaces it for Scott's review. Scott responds himself, authentically, as Scott. AI does not draft Reddit responses and does not post to Reddit. → **D67**

---

## SECTION 9 — Analytics, Tracking & Optimization

*Measuring what matters, feeding the loop.*

**Q85.** What are the actual KPIs per brand? I want to know what a "good week" looks like for each:
- NCHO: clicks to Shopify? Followers? Post reach?
- SomersSchool: clicks to enrollment? Email signups? Lesson demo views?
- Alana Terry: book clicks? Podcast listens driven from social? Email list growth?

**Q86.** Buffer analytics gives reach, clicks, likes, comments, shares. Is that enough for your current needs, or do you want deeper platform-native analytics pulled in?

**Q87.** UTM parameter tracking — should every outbound link in a social post get a UTM tag so you can trace social → Shopify sale or social → SomersSchool enrollment in Google Analytics / native analytics?

**Q88.** Do you want a weekly "social performance digest" — top post from each brand, total reach, follower delta — as a section in the daily brief or as a separate report?

**Q89.** A/B testing — should the AI generate 2 variants of the same post (different angles/hooks) and split them across similar time slots to learn which performs better? Or is that too complex for now?

**Q90.** Autoresearch loop application: if long-form captions consistently outperform short ones on NCHO Facebook, should the system detect that and update the brand voice prompt automatically? Or just surface the insight for Scott to decide manually?

**Q91.** For platforms like Pinterest that have a very long content half-life (pins get discovered for years, not days) — should the analytics window be different? (30-day view vs. 7-day view for fast platforms.)

**Q92.** Should there be a "content frequency vs. engagement" chart? (Did posting 5x/week outperform 2x/week, or did it cannibalize engagement?) This matters for calibrating the cron schedule.

---

### — Q85–Q92 (Scott, voice dictation, March 31, 2026)

*Note on question mapping: Questions were paraphrased for voice dictation. Doc Q87 (UTM) = presented as Q89; doc Q88 (digest) = presented as Q87+Q92; doc Q89 (A/B) = presented as Q91. All Q85–Q92 now answered ✅.*

**Q85 — KPIs per brand (answered ✅):**
Primary KPI = **link clicks**. Getting people to the NCHO store or SomersSchool enrollment page is the #1 measurable outcome. "If we're getting a lot of clicks and sales aren't going well, what do we change on the store?" — social's job is to drive the click. Secondary KPIs: real engagement rate, profile visits. **Follower count explicitly deprioritized:** "Aren't most followers in 2026 just bots? I want real people, not fake people. Real engagement, not fake engagement." → **D68, D69**

**Q86 — Analytics depth: Buffer native or deeper unified dashboard (answered ✅):**
YES to unified analytics dashboard inside Chapterhouse. Starting with Buffer's native data (reach, clicks, likes, comments, shares) but Scott wants one view pulling all platforms together — not scattered across individual platform dashboards. → **D70**

**Q87 — UTM tracking on every outbound link (answered ✅ via presented Q89):**
YES. Scott approved without knowing the technical meaning: "I don't know what it means, but yes." **Implementation note for build:** UTM parameters (`?utm_source=facebook&utm_medium=social&utm_campaign=ncho-[post-id]`) tag every link automatically. Shopify and SomersSchool analytics then trace which post drove which click. Explain once during onboarding; pipeline handles it silently afterward. → **D71**

**Q88 — Review cadence and performance digest (answered ✅):**
Daily snapshot + weekly report + monthly deep-dive. All three, intentional. Each serves a different decision horizon: daily = adjust this week, weekly = calibrate next week, monthly = strategic pattern. YES to auto-surfacing best performers for recycling as templates. → **D72, D73**

**Q89 — A/B testing (answered ✅ via presented Q91):**
YES. Scott is not new to this — "Next Chapter Homeschool" as a name resulted from several thousand clicks of Facebook ad click-testing. Name, colors, and title were all A/B tested. Same methodology applies here: generate 2 variants, split across similar time slots, read results, learn. "If there's another way to do it, I am all ears." → **D75**

**Q90 — Autoresearch loop: auto-update brand voice prompt vs. surface manually (answered ✅):**
Surface the insight. Brand voice evolution is always human-gated. If the system detects a consistent performance pattern (e.g., long-form captions outperforming short on NCHO Facebook), it surfaces the finding as a recommendation — Scott approves before anything in the brand voice prompt changes. No auto-updates to voice direction, ever. → **D78**

**Q91 — Pinterest analytics window: 30-day vs. 7-day (Pinterest protocol applied — recommendation):**
Scott has zero Pinterest context — spoon-feed protocol applies. **Recommended:** Pinterest analytics default window = **30 days** (pins have multi-year discovery cycles; 7-day data is noise for Pinterest, not signal). Applied as D74 unless Scott overrides. → **D74**

**Q92 — Frequency vs. engagement chart (answered ✅ by implication):**
YES — covered by "all three cadences" answer and explicit YES to a weekly readable narrative summary: what worked, what didn't, recommendation for next week. Not a spreadsheet. Plain-language synthesis. Frequency-vs-engagement chart is a known output of this system — included. → **D76**

**Conversion tracking — connecting social to Shopify sales + SomersSchool enrollments (answered ✅ via presented Q90):**
YES. Scott will provide **read-only** API/analytics access to both. **Hard security boundary:** another tool already has read-write access — Chapterhouse gets read-only only, no exceptions. Scott enforcing this deliberately. → **D77**

---

## SECTION 10 — Workflow, Team, Access & Future

*Who does what, how, and where is this going.*

**Q93.** Review Queue access — right now it's a single queue. Should Anna see only Alana Terry posts? Should she have a separate login view, or is the current "everything in one queue" workable while it's just the two of you?

**Q94.** When Anna wants to add copy context for an Alana Terry post (e.g., "making a post about the new Kennedy Stern book releasing next week") — what's her interface? Does she use the Generate tab directly, or does she message Scott who runs it?

**Q95.** Rejected posts — when a post gets rejected, what happens next? Disappears? Goes to a "rewrite pile"? Should there be a one-click "regenerate this post with a different angle" button?

**Q96.** Should there be an approval deadline system? If a post in the queue isn't approved within 48 hours, it auto-expires (greys out, moves to archived). Prevents the queue from filling with stale posts.

**Q97.** Do you want email/SMS notifications when a batch of posts is ready for review? (Resend email is wired. Twilio is available.) Or is the Chapterhouse UI sufficient?

**Q98.** Long-term — would you ever open this to manage other brands/clients beyond Scott and Anna? A social media management micro-SaaS for other homeschool content creators, for example? This changes the architecture significantly if yes.

**Q99.** What does "done" look like for Phase 1 of this expansion? Complete the sentence: "I'll know the social system is working when ______________________."

**Q100.** What's the very first piece of content you want to go live from this system, on this week? Brand, platform, topic. Give me the specific assignment so we can use it as the smoke test for the full new pipeline.

---

### — Q93–Q100 (Scott, voice dictation, March 31, 2026)

**⚠️ NOTE — Question mapping mismatch:** The Section 10 questions in this doc were written with Anna as a participant (Q93 about Anna's queue view, Q94 about Anna's interface). D62 (Scott owns 100% of community management, Anna is not in this pipeline) makes those questions invalid. The questions I presented Scott were re-framed accordingly. Original doc Q93/Q94 texts are preserved below for reference but are N/A.

**Doc Q93 — Anna separate queue view (N/A — superseded by D62):**
Anna does not use this system. She is not in this pipeline. Original question obsolete. However, Scott's re-framed answer: one unified review queue is fine. It's just Scott. No brand-filtered views needed right now. → **D79**

**Doc Q94 — Anna's context input interface (N/A — re-framed):**
Original question was about Anna's interface. Re-framed as Scott's interface for adding copy context before generating a post ("making a post about X this week"). Answer: Generate tab directly. But the input options need to be multimodal — **text box, voice/TTS dictation, copy-paste, and PDF upload are all required input modes.** Scott uses voice heavily; text-only input is not sufficient. → **D80**

**Doc Q95 — Rejected posts: disappear, rewrite pile, or regenerate button (⏳ PENDING):**
Not fully answered this session. Scott answered my presented Q95 (mobile access) instead of this one. See Open Items at end of doc. → **Open Item OI-01**

**Mobile access (answered ✅ — new question, no doc equivalent):**
Samsung Z Fold 5 (large inner screen). Also accesses Chapterhouse from work computer at school. Chrome on both. No native app needed — browser-responsive is the requirement. "Anywhere I can access Chapterhouse" is the standard. → **D81**

**Doc Q96 — Approval deadline / 48hr expiry (⏳ PENDING):**
Not answered. Scott skipped from mobile access to hosting. See Open Items. → **Open Item OI-02**

**Doc Q97 — Email/SMS notifications when batch is ready (⏳ PENDING):**
Not answered this session — Scott answered my hosting question instead. See Open Items. → **Open Item OI-03**

**Hosting platform (answered ✅ — Scott's question to me, not a doc question):**
Scott is NOT married to Vercel + Railway. Has used Netlify. Wants a real recommendation, not an assumption. "You are my tech team — tell me if something is better. Push back against me."

**My recommendation (as tech team):** Stay on Vercel Pro + Railway. Here's why — and I'll push back if I thought something was genuinely better:
- **Vercel Pro** is purpose-built for Next.js App Router. Cron jobs, edge functions, Supabase integration — all native. Switching to Netlify means losing cron support and degraded Next.js compatibility.
- **Railway** for the worker is the right call for long-running jobs (Gemini 2.5 Flash, social batch, etc.). Fly.io and Render are alternatives but offer no meaningful advantage for this specific workload pattern.
- The only scenario to re-evaluate: if monthly costs spike above ~$80/month combined, or if you start needing real-time infrastructure at scale (100+ concurrent users). At that point, a Coolify self-hosted stack on a $20/month VPS becomes worth evaluating.
- **Verdict: stay put. No migration.** Flag this for re-evaluation at significant scale. → **D82**, **R9**

**Doc Q98 — Long-term micro-SaaS for other creators (⏳ PENDING):**
Not answered. See Open Items. → **Open Item OI-04**

**Auto-publish as end-state goal (answered ✅):**
YES — auto-publish is the long-term destination. Staged trust model: start human-review-every-post → build track record over weeks → flip to auto-publish with an exception alerting system. Scott's framing: "After 6–8–10 weeks of good genuine publishing, I'm going to want to just set it up automatically." Auto-publish is not a question of *if*, only *when*. Exception system = alert Scott if something anomalous needs attention. → **D83**

**12-month vision (answered ✅):**
"A full-time social media manager doing all of this and I am sitting at home." Translation: fully automated system. Zero Scott involvement in day-to-day social. Scott is freed up for other work. Social just runs. By August 2026 this system should be executing without his daily attention. → **D84**

**Q100 / Audience framing correction (answered ✅ — critical correction):**
Scott pushed back hard: **This is NOT tied to Alaska homeschool families.** "Get off this idea that this is somehow tied to just Alaska homeschool families. This is in no way, shape or form tied to Alaska homeschool families."

This is a systemic correction. Any question in this doc that frames the audience as "Alaska homeschool" is wrong. The correct framing: **national homeschool market** (faith-adjacent families across the US, homeschool parents buying online curriculum and resources). Alaska is where Scott lives, not where his customers are. → **D85**

**Brain dump preservation note:** Scott also asked that raw brain dump answers be preserved near each section (not just distilled summaries), and that all still-unresolved items be relocated to a single "What You Still Need to Discuss" section. The answers blocks in this doc already preserve raw voice dictation context. The Open Items section at the end of this file consolidates all unresolved questions.

---

## SECTION 11 — Niche & Emerging Platforms

*The long tail worth thinking about.*

**Q101.** Substack — Anna has a newsletter (Alana Terry). Should Substack posts be "published" from Chapterhouse, or is Substack an independent tool she manages herself?

**Q102.** Podcast directories (Apple Podcasts, Spotify, etc.) — do you want Chapterhouse to draft show notes and episode descriptions for PCW when Anna records? Or out of scope?

**Q103.** Discord — some homeschool communities are moving to Discord. Is there a SomersSchool Discord server being considered? Community management there is very different from social.

**Q104.** WhatsApp Business — in some international homeschool markets (Latin America, Southeast Asia) WhatsApp is the primary channel. Is international reach relevant for SomersSchool / NCHO at this stage?

**Q105.** Mastodon / Fediverse — open protocol like Bluesky. Very small homeschool audience. Worth tracking but probably not worth building for yet. Agree?

**Q106.** Nextdoor — hyper-local. Might be relevant for "Alaska homeschool community" awareness or even local co-op building. Is this on the radar?

**Q107.** Amazon Author Central (for Alana Terry) — Author Central posts appear on Amazon book pages. Should this be in the content pipeline even though it's not traditional "social media"?

**Q108.** Google Business Profile — if NCHO or SomersSchool has a Google Business listing, posts there drive local SEO. Is this wired anywhere?

---

### — Q101–Q108 (Scott, voice dictation, March 31, 2026)

**Q101 — Substack (out of scope for now — future exploration flagged):**
Anna manages her own Alana Terry Substack independently — out of scope for this pipeline. BUT: Scott is interested in building *something* on Substack at some point. Doesn't know what yet. "I wouldn't mind building something on Substack." This needs a dedicated conversation once NCHO social is running. Seed filed. → **D86**

**Q102 — PCW podcast show notes (out of scope):**
Right now 100% Anna's lane. Chapterhouse does not draft podcast content for Praying Christian Women. Out of scope. → **D87**

**Q103 — Discord (no):**
Scott is not a fan of Discord. No SomersSchool Discord server planned. → **D88**

**Q104 — WhatsApp Business (no):**
Not relevant at this stage. → **D89**

**Q105 — Mastodon/Fediverse (no):**
No. → **D90**

**Q106 — Nextdoor (no):**
No. Also confirms D85 — NCHO is a national brand. Hyper-local platforms are not relevant. → **D91**

**Q107 — Amazon Author Central for Alana Terry (no):**
No. (Note: voice transcribed as "Now" — interpreted as "No" based on context. Consistent with Alana Terry deferral per D41.) → **D92**

**Q108 — Google Business Profile (doesn't exist yet — build it):**
Neither NCHO nor SomersSchool has a Google Business Profile yet. But Scott confirmed they need one and wants help setting it up and eventually wiring it into the content pipeline. "We need to. You're going to have to help me do that." — Action item: create Google Business profiles for NCHO and SomersSchool, then evaluate pipeline integration. → **D93**, **R10**

---

## SECTION 12 — NCHO Blog Strategy

*The blog at nextchapterhomeschool.com/blogs/news is live but has zero posts. This section specs the blog as an SEO-first content engine and its relationship to the social pipeline.*

**Q109.** The NCHO blog exists at `/blogs/news` and has zero posts. What's the target posting frequency once running? Daily, 3x/week, or something else?

**Q110.** Who writes the blog content? AI drafts + Scott approves? Scott writes from scratch? Or AI generates a full draft from a keyword/topic seed and Scott edits and approves?

**Q111.** What are the primary SEO keyword categories for NCHO blog posts? Options: curriculum reviews by grade, subject-specific buying guides, Alaska education allotment guides, homeschool how-tos, product spotlights, faith-adjacent content, seasonal/holiday content?

**Q112.** Should each blog post automatically cascade into downstream content: social media snippet → Pinterest pin description → short video script? Or is the blog standalone to start?

**Q113.** What's the target post length for SEO? Standard for homeschool search traffic is 800–1,500 words. Do you want a mix of short (300-word) product spotlights and long-form (1,500-word) guides?

**Q114.** Should product spotlight posts pull data from the Shopify catalog (title, price, description, image) and auto-link to the product page? Chapterhouse already has Shopify API access.

**Q115.** Publishing workflow: does Chapterhouse publish blog posts directly to Shopify via the Admin API, or does Scott copy-paste approved drafts into the Shopify post editor manually?

**Q116.** Should there be a blog-specific editorial calendar UI in Chapterhouse, or does the blog share the social content calendar view?

**Q117.** Blog taxonomy: predefined categories/tags from day one (Grade Level, Subject, Faith-Based, Allotment-Eligible, Product Spotlight) or grow organically?

**Q118.** Comments on the Shopify blog — enable or disable? If enabled, what's the moderation plan?

**Q119.** New blog post → email newsletter trigger: should each published post automatically generate a teaser snippet pushed to the NCHO Brevo subscriber list?

**Q120.** Blog-to-video pipeline: vision is blog post → 60-second video script (Gimli or Scott avatar) → HeyGen render → YouTube Short / Instagram Reel. Is that the right pipeline order, or does video come first and blog follows?

---

### — Q109–Q120 (Scott, voice dictation, March 31, 2026)

**Q109 — Blog frequency + ownership (answered ✅):**
3x per week. AI does everything: keyword research, scheduling, drafting, publishing. Scott approves before anything goes live. "Schedule it, write it, do all of it." This is a fully AI-managed content engine. → **D94**

**Q110 — Who writes it (answered ✅):**
AI generates full drafts from keyword seeds. Scott approves. That's the workflow. → **D95**

**Q111 — SEO keyword categories (answered ✅ + correction):**
YES to state ESA/allotment-eligible curriculum guides — **national scope, not Alaska.** "This is not about Alaska." This confirms D85. The full keyword category list: state ESA/allotment guides (all participating states), curriculum reviews by grade level, subject buying guides, homeschool how-tos, product spotlights, faith-adjacent family content, seasonal content. → **D96**

**Q112 — Blog-to-social cascade (answered ✅):**
YES. Every blog post automatically spins off: social media snippet, Pinterest pin description, short video script. Blog is the hub; everything else is derived. → **D97**

**Q113 — Post length (confirmed ✅):**
Confirmed: mix of 300-word product spotlights and 1,200-word SEO guides. → **D98**

**Q114 — Auto-pull from Shopify catalog (answered ✅):**
YES. Product spotlight posts auto-pull title, price, description, and image from the Shopify catalog via existing API access. → **D99**

**Q115 — Publishing workflow (answered ✅):**
YES. Chapterhouse publishes directly to Shopify via Admin API. No copy-paste. Scott approves in Chapterhouse, it goes live. → **D100**

**Q116 — Blog calendar (answered ✅):**
Shared with the social content calendar. One unified calendar view for blog posts and social posts. → **D101**

**Q117 — Categories from day one (answered ✅):**
Predefined categories from day one. Suggested taxonomy: Grade Level, Subject, Allotment-Eligible, Product Spotlight, Faith-Adjacent, How-To. → **D102**

**Q118 — Blog comments ON (answered ✅):**
Comments enabled. Moderation plan needed — Scott's note: flagged for future convo on spam/moderation workflow. Basic plan: Shopify has a comments approval workflow (approve before visible). → **D103**

**Q119 — Brevo email trigger (⏳ PENDING — needs explanation first):**
Scott: "I don't know. You'll have to explain this to me."

**Explanation:** Brevo is your email marketing platform (already in the stack). When each new blog post goes live, Chapterhouse could automatically send a short teaser email to your NCHO subscriber list — something like: subject line = blog post title, body = first 2 sentences + a "Read More" button linking to the post. This is called a blog broadcast. It keeps your email list warm, drives repeat traffic to the store, and turns blog readers into buyers.

**My recommendation:** YES, build it in. But trigger it on a delay — send 24 hours after publish so you can catch any errors first. Make it one-tap to disable per post if you don't want a particular post emailed. → **PENDING Scott's confirmation — see OI-11**

**Q120 — Blog-first pipeline (answered ✅):**
YES. Blog post first → 60-second video script derived from the post → HeyGen or Gimli render → YouTube Short / Instagram Reel. "I like the way that sounds." Blog is always the anchor piece; video is the derivative. → **D104**

---

## SECTION 13 — Podcast Guest Outreach Campaign

*Getting Scott onto OTHER people's podcasts as a guest. Separate from the social posting pipeline AND from Scott's own planned AI-generated podcast. This is a PR/business development track.*

**Q121.** What's a sustainable outreach cadence? How many cold pitches per week is ambitious-but-achievable without burning out?

**Q122.** What podcast profile are you targeting? Episode download size (any size, 1K+, 10K+)? Topic focus: homeschool, faith/Christian, teacher burnout and reinvention, entrepreneurship, building in public, AI/tech for non-coders, rural Alaska/education?

**Q123.** Primary pitch angle — is Scott positioned as: (A) homeschool teacher building a SaaS from scratch with no coding background, (B) the Type 2 diabetes reversal story — A1c 14.7→5.1, 363→254 lbs, (C) vibe coding and AI as equalizer for non-technical founders, (D) rural Alaska teacher perspective and the unique challenges of frontier education? Or a combination depending on the show?

**Q124.** Contact database: should Chapterhouse build and maintain a CRM of podcast hosts (name, show, episode count, audience estimate, contact email, pitch status, follow-up dates)? Or is this purely a pitch-copy generator and Scott tracks contacts himself?

**Q125.** Personalization level: should each pitch reference a specific episode or moment from the target podcast, or is a well-crafted template that fills in show name, host name, and audience sufficient?

**Q126.** Follow-up sequences: if a host doesn't reply within 7 days, auto-draft a gentle follow-up. How many follow-ups before marking "no response" and archiving?

**Q127.** What primary talking points and stories does Scott bring to podcast appearances? Rank the angles in Q123 or add others.

**Q128.** Outcome tracking: when Scott lands an appearance, should Chapterhouse log it — show name, air date, CTA used, estimated audience, traffic driven to NCHO or SomersSchool?

**Q129.** What's the CTA Scott offers on podcast appearances right now? Free SomersSchool lesson? Discount on NCHO? Free lead magnet PDF? Email list signup? He needs one clear ask.

**Q130.** Existing warm relationships: are there podcast hosts Scott already knows or has mutual connections with — start there before cold outreach?

**Q131.** UI placement inside Chapterhouse: own nav section ("Outreach"), a tab inside social, a module inside Tasks/Dreamer, or something else?

**Q132.** Reciprocal play: as Scott builds his AI-generated podcast, should the system identify outreach targets who might also want to be a guest on Scott's show — builds relationships in both directions and generates content?

---

### — Q121–Q132 (Scott, voice dictation, April 1, 2026)

**Q121 — Pitch cadence (answered ✅):**
Volume is irrelevant — AI writes the emails and can automate the send. Scott said 5/week or 50/week doesn't matter. The system scales to whatever volume is sustainable. Fully automated outreach engine. → **D106**

**Q122 — Target podcast profile (answered ✅):**
Any audience size. Topic categories: homeschool, faith/Christian, teacher burnout, entrepreneurship, building in public, AI for non-coders. Scott specifically emphasized AI for non-coders: "I really want to get into that. AI for non-coders marketplace." All of these are active targeting lanes — system selects the appropriate pitch angle per show. → **D107**

**Q123 — Pitch angle (answered ✅):**
All four angles, combo depending on the show:
- A) Teacher building a SaaS with zero coding background
- B) Type 2 diabetes reversal (A1c 14.7→5.1, 363→254 lbs, no medication)
- C) Rural Alaska teacher / frontier education perspective
- D) AI as equalizer for non-technical people
System matches angle to show category automatically. → **D108**

**Q124 — Podcast CRM in Chapterhouse (answered ✅):**
YES. Chapterhouse tracks: host name, show info, pitch status, follow-up dates. Full CRM. Not just a pitch-copy generator — a full outreach relationship tracker. → **D109**

**Q125 — Personalization level (answered ✅):**
Full personalization. Reference a specific episode in every pitch. "We're going to go all out on this." No generic template fills. System researches the show, finds a specific episode to reference, personalizes the pitch accordingly. → **D110**

**Q126 — Follow-up sequences (answered ✅):**
Gentle follow-up after 7 days of no response. Archive as "no response" after 3 follow-ups total. → **D111**

**Q127 — Core talking points (answered ✅):**
Four must-tell stories/angles:
1. **How bad public school actually is** — lived it as a teacher, seeing it daily, systems failing kids
2. **How good AI can actually be** — not the fear version, not the hype version, the real version
3. **The difference between using AI and being controlled by AI** — Scott's core philosophical distinction
4. **Elevator pitch:** Creating materials USING AI → then building a personalized experience from those materials — SomersSchool in one sentence
→ **D112**

**Q128 — Log podcast appearances (answered ✅):**
YES. Log everything: show name, air date, CTA used, estimated audience, traffic driven to NCHO and SomersSchool. → **D113**

**Q129 — CTA on podcast appearances (answered ✅):**
Send people to **Next Chapter Homeschool** (nextchapterhomeschool.com). That's the top of the funnel. NCHO website leads to SomersSchool. Scott also plans a dedicated SomersSchool summer school landing page. Full journey: podcast → NCHO website → purchase or explore → SomersSchool summer school landing page → enrollment. Primary CTA = one URL: nextchapterhomeschool.com. → **D114**

**Q130 — Warm relationships (answered ✅):**
None. No existing podcast host relationships to start with. All outreach is cold. → **D115**

**Q131 — UI placement (answered ✅):**
Two locations: (1) a **tab inside the social section** for pitch generation and queue management, AND (2) integrated into the **Tasks/Dreamer board** so active outreach campaigns show up alongside other work. Not a standalone nav section. → **D116**

**Q132 — Reciprocal outreach (answered ✅):**
"Yes, yes, yes — 1000 times yes." As Scott builds his own AI-generated podcast, the system flags outreach targets who might also make good guests on Scott's show. Builds the relationship both ways. Generates content AND grows the network. → **D117**

---

## ANSWERS — Record Session Responses Here

*As we work through these questions, answers go below each section. This doc becomes the living spec.*

### Session 1 — March 31, 2026 (Q1–Q10)

**Q1. Platforms actively posting TODAY:**
> ANSWER: None. Zero. Zip. Starting from scratch across all brands.

**Q2. Minimum viable set — 3 brand+platform combos on day one:**
> ANSWER: Facebook, Instagram, Pinterest. These are the core three to build around. Everything else layers on top.

**Q3. X/Twitter:**
> ANSWER: Yes, want to use X — the audience (politically engaged, values-driven parents) is there. But $100/mo API is not the first move. **Strategy: pipeline generates the copy, Scott posts manually on X.** If he gets traction on X, revisit the paid API tier. The system just needs to produce X-ready copy (short, punchy) as part of each generation run.

**Q4. Bluesky:**
> ANSWER: ⛔ NO. Skip entirely. Not the audience.

**Q5. Pinterest:**
> ANSWER: ✅ YES — going for it. Scott has never really used Pinterest as a social media platform. **Key requirement: the system needs to give clear, specific daily instructions on what to post.** Pinterest is discovery-driven and evergreen, which fits NCHO and SomersSchool perfectly — but Scott needs the AI to do the strategic thinking, not just generate copy.

**Q6. Reddit:**
> ANSWER: ⛔ NO. Staying away from Reddit entirely.

**Q7. TikTok:**
> ANSWER: 🟡 LOW PRIORITY but not ruled out. Secular homeschool parents probably aren't heavy TikTok users. Maybe 1-2x/week. **If the API is free, auto-post HeyGen talking-head videos.** Generates presence without heavy investment. Don't design around it — let it be a byproduct.

**Q8. YouTube:**
> ANSWER: ✅ DEFINITE YES. Avatar videos (HeyGen/Mr. S) + free teaching content. Scott wants to build an audience on YouTube and use it as a funnel for everything else. **Needs help building the strategy.** YouTube Community posts and Shorts should be in the pipeline.

**Q9. Threads:**
> ANSWER: ✅ YES — if it's genuinely low effort. Shares the Instagram follow graph. Low friction means yes.

**Q10. Other platforms:**
> ANSWER: Substack — maybe (Anna already has Alana Terry newsletter there). Snapchat no. WhatsApp no. Medium no. Podcast directories no. **NEW ITEM: Scott wants to create a biweekly AI-generated podcast.** This is a separate track but should be designed to feed the whole content ecosystem.

### Session 1 continued — Q11–Q20 (April 1, 2026)

---

**NCHO SITE RESEARCH** *(fetched April 1, 2026 — nextchapterhomeschool.com)*

The live Shopify store is up with real products organized by age (Preschool through High School) and subject (Language Arts, Math, Science, Social Studies, Faith-Based). Tote bags, board games, science kits present. Most critical finding:
- **Blog at `/blogs/news` — LIVE but has ZERO posts.** "News listing below" — not a single post published. Massive untapped SEO channel sitting idle.
- **No social media links in site footer** — only a Shopify shop icon. No Facebook, Instagram, or Pinterest linked anywhere on the site.
- Tagline: *"A homeschool outpost that's as unique as your children"*
- Physical: PO Box 29, Glennallen, AK 99588 | support@nextchapterhomeschool.com
- Free shipping over $55, 30-day hassle-free returns, "family business — mom and pop operation" messaging

---

**Q11. NCHO on YouTube — beyond Facebook/Instagram/Pinterest:**
> ANSWER: ✅ YES — NCHO will be on YouTube. Product showcases, curriculum walkthroughs. **Major new track surfaced here: NCHO has a blog at `/blogs/news` that is completely empty. Daily blogging is a top SEO priority.** Blog content → snippet video pipeline is the vision. New Section 12 added to this doc to spec the blog strategy.

**Q12. SomersSchool LinkedIn audience:**
> ANSWER: ✅ YES — LinkedIn confirmed for SomersSchool. Target: homeschool co-op organizers and consultants. **Scott already has a Scott Somers LinkedIn account** (existing). Both SomersSchool and Scott Personal content can flow through that account.

**Q13. Alana Terry — active platforms:**
> ✅ LOCKED — **Alana Terry is REMOVED ENTIRELY from this system.** Scott is running this pipeline, not Anna. Alana Terry has her own completely separate workflows and brand presence. No Alana Terry in any Chapterhouse social planning — no accounts, no posts, no crossover. This applies to all questions, platforms, and pipeline design going forward.

**Q14. Scott Personal — real or placeholder:**
> ANSWER: ✅ REAL BRAND. Scott posts as himself — Alaska middle school teacher, building a software company from scratch, vibe coding with no prior background, reversed Type 2 diabetes without medication. **Expandability is a hard requirement**: the system must support adding new brands and channels over time. Multiple YouTube channels are a future possibility. PCW will probably join at some point.

**Q15. PCW separate channels from Alana Terry:**
> ANSWER: 🟡 FUTURE — "Will probably be advertising this at some point." Not in scope for the initial build. Design the brand-slot architecture to support adding PCW later without a refactor.

**Q16. christianbooks.today:**
> ANSWER: *Not directly addressed. Presumed out of pipeline scope for now — Anna's separate operation. Revisit if Scott brings it up explicitly.*

**Q17. Off-limits brand combinations:**
> ANSWER: By explicit decision (Q13): **Alana Terry = ⛔ on all platforms in this system.** No other hard off-limits combinations stated. Cross-promotion across NCHO, SomersSchool, and Scott Personal is actively encouraged — see Q18.

**Q18. NCHO + SomersSchool content sharing:**
> ANSWER: ✅ NOT SILOED AT ALL. All three active brands (NCHO, SomersSchool, Scott Personal) cross-post and reference each other intentionally. "They're not gonna be separate, they're gonna post and cross post." Cross-promotion is a feature, not a bug. Design for interconnection.

**Q19. Follower milestone signaling "working":**
> ANSWER: Can't define a specific metric yet. Complex relationship with social media — has gotten exactly **one sale from social media** in his entire history. Wants it to work but needs real data before defining a success benchmark. Build instrumentation first; let the data reveal what "good" means.

**Q20. Highest-priority brand for revenue before May 24:**
> ANSWER: **NCHO is #1.** That's where all products live and where revenue registers. SomersSchool sends people back to the NCHO store. Scott Personal feeds NCHO. "Next Chapter Homeschool is going to be our primary brand."
>
> **Additional items surfaced in this answer:**
> - Content planning horizon = minimum 2 weeks, but actually wants **full-year pre-generation** — a year's worth of posts bulk-generated ahead of time, then approve and schedule. Not reactive daily posting.
> - **AI agents for auto-responding to social comments and DMs** — wants this eventually. Platforms with comment/DM APIs: Meta (FB/IG), LinkedIn, YouTube. Tools to research: ManyChat, custom Claude-powered reply drafts. Design the architecture to support this from day one.
> - **Podcast guest outreach campaign** = major new pipeline. Daily pitching to podcast hosts. AI generates personalized pitches. System tracks outreach and responses. "I know companies charge tens of thousands of dollars for this." New Section 13 added to this doc.

---

## EMERGING DECISIONS LOG

*As answers crystallize into locked decisions, they move here.*

| # | Decision | Rationale | Locked Date |
|---|----------|-----------|-------------|
| D1 | **Core three platforms: Facebook, Instagram, Pinterest** | Where the homeschool parent audience lives. Starting point for all brands. | Mar 31, 2026 |
| D2 | **Reddit and Bluesky are OFF the list** | Not the audience. Not worth the effort or risk. | Mar 31, 2026 |
| D3 | **X/Twitter: generate copy for manual posting, no API spend yet** | Audience is there but $100/mo API not justified at launch. System produces X-ready copy, Scott posts manually. Revisit when traction exists. | Mar 31, 2026 |
| D4 | **TikTok: low-frequency auto-post if free API, HeyGen content only** | Not the core audience but free presence is fine. Don't design around it. | Mar 31, 2026 |
| D5 | **YouTube is a definite — avatar videos + free teaching content** | Primary audience-building channel. YouTube Community + Shorts in scope. | Mar 31, 2026 |
| D6 | **Threads: yes, if low effort** | Shares Instagram graph. Free presence. | Mar 31, 2026 |
| D7 | **Pinterest requires strategic daily instructions from the AI, not just copy** | Scott has never used Pinterest as social media. System must guide what to post, not just generate. | Mar 31, 2026 |
| D8 | **AI-generated biweekly podcast is a new track to design** | Not social media management — separate pipeline. Feed it into the content ecosystem. | Mar 31, 2026 |
| D9 | **Alana Terry removed entirely from Chapterhouse social pipeline** | Scott runs this operation, not Anna. Alana Terry has her own workflows. No crossover anywhere. | Apr 1, 2026 |
| D10 | **All active brands cross-post and interconnect — no silos** | NCHO ↔ SomersSchool ↔ Scott Personal all feed each other intentionally. Cross-promotion is a feature. | Apr 1, 2026 |
| D11 | **NCHO is primary brand — everything feeds toward it** | Products, revenue conversations, and conversions all happen at NCHO. All other brands funnel there. | Apr 1, 2026 |
| D12 | **NCHO blog (currently 0 posts) is a top-priority content channel — daily, SEO-first** | Blog at `/blogs/news` is live but empty. Daily posting is the goal. SEO → organic discovery → Shopify revenue. See Section 12. | Apr 1, 2026 |
| D13 | **Scott Personal is a real brand — posting as himself** | Alaska teacher building in public, vibe coding, entrepreneurship story. Extraordinary organic reach potential. | Apr 1, 2026 |
| D14 | **LinkedIn confirmed for SomersSchool and Scott Personal (Scott's existing account)** | Target: co-op organizers, homeschool consultants, educators. LinkedIn is NOT for NCHO (B2C parent product). | Apr 1, 2026 |
| D15 | **Content planning horizon = 1 full year; bulk-generate, bulk-approve, bulk-schedule** | Not reactive daily posting. Generate a year ahead, approve in batches, schedule far in advance. | Apr 1, 2026 |
| D16 | **AI comment/DM response agents are a future-state goal — design toward it now** | Not built yet but architecture must account for Meta/LinkedIn/YouTube comment APIs from the start. | Apr 1, 2026 |
| D17 | **Podcast guest outreach is a major new pipeline track (Section 13)** | AI generates personalized pitches, tracks outreach, builds portfolio. Completely separate from social posting. | Apr 1, 2026 |
| D18 | **PCW is future — design brand-slot architecture to add it without a refactor** | Scott expects to add PCW eventually. Must be addable as a new brand slot, not hardcoded for current brands. | Apr 1, 2026 |
| D19 | **Scott Personal brand = The Accidental Teacher narrative, NOT the health story** | He's living in love for children. Still in Glennallen, still teaching. Health transformation is past context only — never the centerpiece. | Apr 1, 2026 |
| D20 | **"The Accidental Teacher" Facebook group already exists — real community asset** | When building Facebook group strategy, start with and center on this existing group. Don't build from scratch. | Apr 1, 2026 |
| D21 | **All video = 9:16 vertical ratio, avatar-based only, no new footage ever** | One spec, one pipeline. HeyGen (Scott avatar) + Gimli cover all video needs. No raw filming. | Apr 1, 2026 |
| D22 | **Posting frequency = 2–3 posts/day/brand across all active platforms** | ~60–80 total posts/week. Volume is sustainable because AI generates everything. | Apr 1, 2026 |
| D23 | **Stories: 1 per day on Instagram + Facebook per brand** | Daily cadence, in the pipeline as a standard slot. | Apr 1, 2026 |
| D24 | **Direct promo capped at 5% (not 10%), always include a soft CTA** | High volume makes 5% sufficient weekly promo. NCHO always in the picture even in pure-value posts. | Apr 1, 2026 |
| D25 | **Link destinations are flexible per post — no fixed one-URL strategy** | System accepts `destination_url` per post; AI picks product page / blog post / sales page contextually. | Apr 1, 2026 |
| D26 | **"Alaska allotment" → "state education allotment/ESA" everywhere in marketing copy** | Scott wants all 20+ ESA/allotment states, not just Alaska. All marketing copy, SEO terms, system prompts, and UI use broad state-agnostic language. Legal compliance references (Alaska Statute 14.03.320) are exempt — those are specific law. | Mar 31, 2026 |
| D27 | **Avatar A/B click testing = confirmed near-term action** | Scott + Anna run ABCDEF click tests via paid ads to NCHO site. Anna leads testing. Goal: find which HeyGen avatar style drives the most clicks before committing to one style system-wide. Status: NOT YET STARTED. | Mar 31, 2026 |
| D28 | **"Upload file → generate social posts" is a hard product requirement** | Drop PDF/URL/doc → select brand + platforms → generate posts for that week. Non-optional feature for the Chapterhouse social pipeline. | Mar 31, 2026 |
| D29 | **Bluesky dropped — not where Scott's audience lives** | Platform skews too left-leaning for faith-adjacent, conservative-Christian-adjacent homeschool parent audience. Removed from platform matrix permanently. | Mar 31, 2026 |
| D30 | **Instagram carousels = YES, prioritized feature** | Scott personally loves carousels as a user. Late-night silent-browse use case resonates. Default format for informational posts on Instagram + Facebook. 5-card sweet spot. | Mar 31, 2026 |
| D31 | **Review flow = semi-automated at launch, full automation as trust builds** | Start with human approval on every post until TOS confidence is established. Architecture must support progressive automation: semi-auto → full auto toggle per brand or platform. | Mar 31, 2026 |
| D32 | **Scheduling conflict detection = disabled** | If two posts land within 30 min of each other on the same platform, just publish both. No warnings, no interruptions. | Mar 31, 2026 |
| D33 | **Recurring post templates = confirmed feature** | Weekly/daily templated post series (e.g., "NCHO Weekly Curriculum Pick" every Tuesday 9AM). AI fills the template; Scott approves the slot. | Mar 31, 2026 |
| D34 | **X/Twitter decision pending R4 research** | Scott's gut: platform has been taken over by politics. Target audience may have left. Deep research required before deciding to build X integration. | Mar 31, 2026 |
| D35 | **TikTok decision pending R5 research** | Scott's gut: TikTok = young audience, not homeschool parents. Research required to validate or challenge before deciding. | Mar 31, 2026 |
| D36 | **Auto image generation on `image_brief` = automatic, with manual override option** | When a post has an image_brief, Leonardo/Flux job triggers automatically in background. Manual-only toggle available per-brand or per-post for control. | Mar 31, 2026 |
| D37 | **X/Twitter — dropped from pipeline** | Data confirms: 64.4% male, 60% use X for news, target audience (homeschool mom 30-45) is ~10-12% of user base and in news-consumption not shopping mode. $100/mo API not justified. Manual personal brand posts only if Scott chooses. Do not build automation. | Mar 31, 2026 |
| D38 | **TikTok — dog mascot short clips only (awareness), not in main pipeline** | Data confirms Scott's gut: 53% of users under 25, primary use = trends/entertainment. Homeschool parent (35-44) = 16% of users. Not a conversion channel. Potential future play for 15-30 sec dog mascot clips (awareness only). Not built until Facebook/Instagram pipeline is working. (Note: Gimli-as-character deferred per D40 — dog mascot used instead.) | Mar 31, 2026 |
| D39 | **Pinterest API — apply this week, use Buffer integration as primary path** | Approval process is simpler than feared: business account + request form + business-day turnaround for trial access. No follower count requirement. Buffer handles Pinterest OAuth natively — use Buffer first, direct API as backup. | Mar 31, 2026 |
| D40 | **K-5 educational mascot: Dogs (various breeds), Gimli-as-AI-character deferred** | Consistent AI Gimli character is too unreliable without solved LoRA/seed. Dogs (variety by design, breed-appropriate, educational illustration style) are the K-5 mascot going forward. Gimli remains Scott's real dog — not a fixed AI character until consistency is solved. | Mar 31, 2026 |
| D41 | **Alana Terry social posting: DEFERRED** | Brand lane not in current pipeline build. Alana Terry book/content marketing will run under christianbooks.today channel when Anna is ready. Outside this build scope. | Mar 31, 2026 |
| D42 | **Social post generation: FULL AUTOMATION target** | AI generates all content (copy, all carousel card captions, image briefs, hashtags) in one job. Goal: wake up Monday, click generate, everything posts. Semi-auto at launch, progressively automated over time. | Mar 31, 2026 |
| D43 | **AI disclosure label on all AI-generated posts: REQUIRED** | All posts must carry a visible AI disclosure indicator. Small, consistent, always present. Exact implementation TBD (Cloudinary text watermark, caption tag, post label). Transparency about AI use is a brand value — non-negotiable. | Mar 31, 2026 |
| D44 | **Image watermarks: small URL text on NCHO + SomersSchool** | NCHO: "nextchapterhomeschool.com" — very small. SomersSchool: equivalent. Applied via Cloudinary text overlay at render time. Alana Terry: N/A (deferred). Scott Personal: none. | Mar 31, 2026 |
| D45 | **Image generation failure: text-only to review queue with inline regenerate button** | Failure does not block post. Goes to queue text-only with "Regenerate Image" button inline. Clicking triggers new generation job; image replaces inline when complete. Post can be approved text-only at any time. | Mar 31, 2026 |
| D46 | **Stock photos excluded from automated social pipeline** | Pexels/Pixabay/Unsplash excluded — concept-to-result mismatch too unpredictable. AI-generated images (Leonardo/Flux) only. Educational-specific stock APIs may be evaluated separately in future. | Mar 31, 2026 |
| D47 | **Negative prompts required in all social pipeline image generation** | All prompts must include a negative prompt block (no extra limbs, blurry faces, distorted hands, text artifacts, watermarks, etc.). Pipeline requirement. Extend existing characters.negative_prompt pattern to social pipeline image gen. | Mar 31, 2026 |
| D48 | **Pinterest: full AI generation of all SEO copy** | Board descriptions, pin titles, and keyword copy all AI-generated automatically. No manual Pinterest copy handling. Scott's rule: if it can be automated, automate it. | Mar 31, 2026 |
| D49 | **Posting frequency: 3/week/brand minimum; YouTube + podcast aspirational** | NCHO, SomersSchool, Scott Personal: 3 posts/week each (~9/week total). Aspirational v2: 2 YouTube videos/week (cross-brand) + 1 ElevenLabs AI podcast episode/week. Alana Terry deferred (D41). | Mar 31, 2026 |
| D50 | **Posting times: global baselines as defaults; override with real data at 30 days** | Facebook 7–9 AM or 2–4 PM local; Instagram overnight for 5 AM slot; Pinterest 10 AM–12 PM Tue–Thu; LinkedIn 11 AM–1 PM. Homeschool audience offset applied. Override after 30 days with native analytics. Source: Sprout Social 2026 / Later.com. | Mar 31, 2026 |
| D51 | **Content calendar UI: week-grid default, month + day views available** | Week-grid is default. Month and day views selectable. All active brands shown simultaneously. Review queue buffer visible inline. | Mar 31, 2026 |
| D52 | **Homeschool seasonal triggers pre-loaded as content suggestion events** | Co-op registration, back-to-school, state testing, convention season (THSC TX / FPEA FL), ESA/allotment cycles, curriculum planning season, holiday buying. All fire as review queue suggestions — not auto-posts. | Mar 31, 2026 |
| D53 | **Evergreen recycling: 90-day auto-requeue for high performers** | High-performing posts auto-requeue every 90 days. Cross-platform reuse enabled. Buffer monitors performance threshold. Viral posts → manual review before reuse. | Mar 31, 2026 |
| D54 | **No blackout dates — post 7 days/week including Sundays** | No scheduling restrictions. Sunday posting confirmed acceptable. | Mar 31, 2026 |
| D55 | **Planning horizon: 90 days planned, 1 month drafted, 7 days queued ahead** | 90 days in planning. 1 full month with actual drafted posts. Always 7+ days of approved posts queued ahead of today. Rolling weekly generation cadence. | Mar 31, 2026 |
| D56 | **Voice correction: edit-to-learn system, not regenerate-first** | Every manual edit in review queue saves a voice_example diff to brand_voices record. "Voice Refinement" button in Brand Voices panel triggers Claude to analyze diffs → propose updated voice profile → Scott approves. Regenerate button = secondary only (total rewrites). The edit IS the correction signal. | Mar 31, 2026 |
| D57 | **X/Twitter = Scott Personal, Insider Credentialed Critic voice only** | Topic: systemic public education failure from the inside. Goal: expand the argument for an audience already skeptical of public ed. Direct, convicted, factual, teacher-credentialed. Not partisan fighting. No NCHO or SomersSchool in the X pipeline. | Mar 31, 2026 |
| D58 | **Threads = Instagram auto-copy, no dedicated work** | Instagram posts auto-copy to Threads via the same Meta pipeline. No dedicated Threads voice, strategy, or review cards. Zero incremental effort. | Mar 31, 2026 |
| D59 | **LinkedIn voice: professional, direct, diplomatic — never pull punches** | Scott's formula: say what you believe, say it professionally. Educator authority, not culture-war heat. For SomersSchool: peer-to-peer professional voice targeting educators and co-op leaders, not parent-persuasion copy. | Mar 31, 2026 |
| D60 | **YouTube descriptions: auto-generate from script/slides + review queue approval** | Pipeline auto-generates from script/slide content. Never written manually. Enters review queue for approval before publishing. | Mar 31, 2026 |
| D61 | **AI reply drafts: 2–3 options per comment, human-approved before posting** | AI generates 2–3 reply options per comment. Scott picks or edits. No auto-posting of replies. Always human-approved. | Mar 31, 2026 |
| D62 | **Scott owns 100% of community management — not Anna** | All comments, DMs, and replies across all brands go to Scott. Anna is not a face of this business. She has her own separate work. Alana Terry is Anna's independent brand outside this system. | Mar 31, 2026 |
| D63 | **Negative comments: ignore and delete** | No public response to bad-faith or negative comments. Clean feed policy across all brands. | Mar 31, 2026 |
| D64 | **Brand monitoring: YES — alert on untagged mentions** | Alert when "NCHO", "Next Chapter Homeschool", "SomersSchool", or "The Accidental Teacher" appear anywhere on social without a tag. Separate social listening layer to build. Correct spelling: SomersSchool (one word, camelCase). | Mar 31, 2026 |
| D65 | **DM auto-reply: YES — 24-hour acknowledgment** | Auto-reply when DM volume is high: "I'll respond within 24 hours." Prevents open-read abandonment. | Mar 31, 2026 |
| D66 | **Curriculum content questions: human-only, no AI drafts** | AI never drafts responses to secular/faith-based content questions, Standards questions, or content warning questions. Legally sensitive under Alaska Statute 14.03.320 and COPPA. Scott answers manually. | Mar 31, 2026 |
| D67 | **Reddit: flag relevant threads, Scott posts authentically — no AI drafts or auto-posting** | Chapterhouse surfaces relevant Reddit threads for Scott's review. Scott responds himself. AI does not draft or post Reddit responses. | Mar 31, 2026 |
| D68 | **Primary KPI = link clicks** | Link clicks to NCHO store or SomersSchool enrollment page are the #1 measurable social outcome. If clicks are high and sales are low, the problem is on the store — not social. | Mar 31, 2026 |
| D69 | **Follower count deprioritized — real engagement over numbers** | "Aren't most followers in 2026 just bots?" Scott wants real engagement rate and profile visits tracked. Follower count is vanity metric in this system. | Mar 31, 2026 |
| D70 | **Unified analytics dashboard inside Chapterhouse — YES** | All platform analytics pulled into one Chapterhouse view. Not scattered across individual platform dashboards. Starts with Buffer data, extends with platform-native pull. | Mar 31, 2026 |
| D71 | **UTM tracking YES — every outbound social link tagged automatically** | Scott approved without knowing the term. Pipeline auto-appends UTM params to every link. Onboarding gets one explanation; silent thereafter. Enables social→sale tracing in Shopify + SomersSchool. | Mar 31, 2026 |
| D72 | **Review cadence: daily + weekly + monthly, all three** | Daily snapshot (adjust this week), weekly report (calibrate next week), monthly deep-dive (strategic patterns). All three are intentional and distinct. | Mar 31, 2026 |
| D73 | **Auto-surface best performers for recycling and templates — YES** | System identifies top-performing posts per brand/platform and surfaces them for 90-day requeue and as generation templates. | Mar 31, 2026 |
| D74 | **Pinterest analytics window = 30 days (recommendation applied)** | Pinterest pins have multi-year discovery cycles; 7-day data is noise. 30-day default applied via Pinterest protocol (Scott approved recommendation-first). | Mar 31, 2026 |
| D75 | **A/B testing YES — NCHO click-test methodology applies** | NCHO name/colors/title were all A/B click-tested to thousands of results. Same methodology: 2 variants, split time slots, read results. Scott open to new approaches. | Mar 31, 2026 |
| D76 | **Weekly readable narrative report YES — not a spreadsheet** | Plain-language weekly synthesis: what worked, what didn't, recommendation for next week. Frequency-vs-engagement chart included. | Mar 31, 2026 |
| D77 | **Conversion tracking YES — read-only access only, hard security boundary** | Scott provides read-only API/analytics access to Shopify + SomersSchool. Another tool has read-write — Chapterhouse read-only only, no exceptions. Scott-enforced security boundary. | Mar 31, 2026 |
| D78 | **Brand voice evolution: surface insight, human-gated — never auto-update** | When analytics detect a consistent performance pattern, Chapterhouse surfaces it as a recommendation. Scott approves before any brand voice prompt changes. No autonomous brand voice updates. | Mar 31, 2026 |
| D79 | **Review queue: one unified queue, Scott only** | Single queue for all brands. No brand-filtered login views needed. Only Scott approves posts. | Mar 31, 2026 |
| D80 | **Generate tab context input: multimodal — text, voice/TTS, copy-paste, PDF upload** | All four input modes required. Scott uses voice heavily. Text-only input is not sufficient. PDF upload enables product sheet / doc → social pipeline. | Mar 31, 2026 |
| D81 | **Mobile access: browser-responsive only, no native app** | Samsung Z Fold 5 (large inner screen) + work computer at school. Chrome on both. "Anywhere I can access Chapterhouse" is the standard. No app build needed. | Mar 31, 2026 |
| D82 | **Hosting: stay on Vercel Pro + Railway — no migration** | Recommendation from tech team: Vercel Pro is purpose-built for Next.js + cron. Railway handles long-running workers. No meaningful advantage in switching. Re-evaluate if monthly cost exceeds ~$80/month or scale requires it. | Mar 31, 2026 |
| D83 | **Auto-publish is the end-state destination — staged trust model** | Start: human review every post. After 6–8–10 weeks of good track record, flip to auto-publish with exception alerting. Auto-publish is not a question of if, only when. | Mar 31, 2026 |
| D84 | **12-month vision: fully automated social media manager, zero Scott involvement** | "A full-time social media manager doing all of this and I am sitting at home." By August 2026 this system runs without daily Scott attention. | Mar 31, 2026 |
| D85 | **Audience correction: national homeschool market — NOT Alaska-specific** | The target audience is national homeschool parents (faith-adjacent families buying online curriculum and resources across the US). Alaska is where Scott lives, not where his customers are. Any question or copy framing this as Alaska-specific is wrong. | Mar 31, 2026 |
| D86 | **Substack: out of scope now — future exploration flagged** | Anna's Alana Terry Substack is hers. Pipeline does not touch it. Scott wants to build *something* on Substack eventually but doesn't know what yet. Future conversation needed after NCHO social is running. | Mar 31, 2026 |
| D87 | **PCW podcast show notes: 100% Anna's lane, out of scope** | Chapterhouse does not draft Praying Christian Women podcast content. Not in pipeline. | Mar 31, 2026 |
| D88 | **Discord: no** | Scott is not a fan of Discord. No Discord server planned for SomersSchool or any brand. | Mar 31, 2026 |
| D89 | **WhatsApp Business: no** | Not relevant at this stage. | Mar 31, 2026 |
| D90 | **Mastodon/Fediverse: no** | No. | Mar 31, 2026 |
| D91 | **Nextdoor: no** | No use case for a national brand. | Mar 31, 2026 |
| D92 | **Amazon Author Central: no** | Deferred with Alana Terry brand per D41. | Mar 31, 2026 |
| D93 | **Google Business Profile: doesn't exist yet — must build, then wire** | Neither NCHO nor SomersSchool has a GBP. Scott confirmed need. Action: create profiles for both brands, then evaluate pipeline integration. R10 filed. | Mar 31, 2026 |
| D94 | **Blog frequency: 3x/week, fully AI-managed** | AI researches keywords, schedules, drafts, and publishes. Scott approves before anything goes live. "Schedule it, write it, do all of it." | Mar 31, 2026 |
| D95 | **Blog authorship: AI full draft from keyword seed, Scott approves** | No manual writing. AI generates; Scott is the editorial gate. | Mar 31, 2026 |
| D96 | **Blog SEO categories: national ESA/allotment scope, not Alaska** | Seven categories: state ESA/allotment guides (all 20+ participating states), curriculum reviews by grade, subject buying guides, homeschool how-tos, product spotlights, faith-adjacent content, seasonal content. National audience per D85. | Mar 31, 2026 |
| D97 | **Blog-to-social cascade: YES — blog is the hub** | Every published blog post spins off: social snippet, Pinterest pin description, short video script. Blog anchors; everything derives from it. | Mar 31, 2026 |
| D98 | **Post length mix: 300-word product spotlights + 1,200-word SEO guides** | Confirmed. Short format for products; long format for SEO authority pieces. | Mar 31, 2026 |
| D99 | **Product spotlight posts: auto-pull from Shopify catalog** | Title, price, description, and image pulled via Chapterhouse's existing Shopify API access. | Mar 31, 2026 |
| D100 | **Publishing workflow: Chapterhouse publishes directly to Shopify via Admin API** | No copy-paste. Scott approves in Chapterhouse; post goes live automatically. | Mar 31, 2026 |
| D101 | **Blog + social share one unified content calendar** | One calendar view in Chapterhouse shows both blog posts and social posts. | Mar 31, 2026 |
| D102 | **Blog taxonomy: predefined categories from day one** | Grade Level, Subject, Allotment-Eligible, Product Spotlight, Faith-Adjacent, How-To. Set on launch, not grown organically. | Mar 31, 2026 |
| D103 | **Blog comments: ON** | Shopify approve-before-visible moderation. Full moderation workflow TBD. | Mar 31, 2026 |
| D104 | **Blog-first pipeline: blog post → video script → HeyGen/Gimli render → Short/Reel** | Blog is always the anchor piece. Video is the derivative. "I like the way that sounds." | Mar 31, 2026 |
| D105 | **Brevo email trigger: YES — build toggle in, leave OFF for Phase 1** | Each published blog post will eventually auto-trigger a teaser email to the NCHO Brevo list (24-hour delay, subject = title, body = first 2 sentences + Read More). Build the infrastructure now; activate when content rhythm and subscriber list are ready. | Apr 1, 2026 |
| D106 | **Podcast outreach cadence: fully automated, unlimited volume** | AI writes and sends pitches. 5/week or 50/week — doesn't matter. System scales to whatever is sustainable. | Apr 1, 2026 |
| D107 | **Podcast targeting: any size, all 6 topic categories** | Any audience size. Topics: homeschool, faith/Christian, teacher burnout, entrepreneurship, building in public, AI for non-coders. AI for non-coders is a priority lane. | Apr 1, 2026 |
| D108 | **Pitch angle: all four, combo by show** | Angles: (A) teacher building SaaS with no coding background, (B) T2D reversal (A1c 14.7→5.1, no meds), (C) rural Alaska frontier teacher, (D) AI as equalizer. System matches angle to show category. | Apr 1, 2026 |
| D109 | **Podcast outreach CRM: full tracking in Chapterhouse** | Host name, show info, pitch status, follow-up dates. Full relationship CRM, not just copy generation. | Apr 1, 2026 |
| D110 | **Personalization: full — reference a specific episode every time** | "We're going to go all out." System researches the show, finds a real episode to cite, personalizes every pitch. No generic template fills. | Apr 1, 2026 |
| D111 | **Follow-up: archive after 3 no-responses** | Gentle follow-up after 7 days silence. Three total follow-ups before marking "no response" and archiving. | Apr 1, 2026 |
| D112 | **Core talking points: 4 locked angles** | (1) How bad public school is — teacher perspective. (2) How good AI can actually be. (3) Using AI vs. being controlled by AI. (4) Elevator pitch: create materials with AI → build personalized experience from them = SomersSchool. | Apr 1, 2026 |
| D113 | **Log podcast appearances: YES — all data** | Show name, air date, CTA used, estimated audience, traffic to NCHO + SomersSchool. | Apr 1, 2026 |
| D114 | **Podcast CTA: nextchapterhomeschool.com** | Primary CTA on all podcast appearances = NCHO website. Funnel: podcast → NCHO → SomersSchool summer landing page → enrollment. Summer school landing page TBD. | Apr 1, 2026 |
| D115 | **No warm podcast relationships — all cold outreach** | Starting from zero. No existing host connections. | Apr 1, 2026 |
| D116 | **Podcast CRM UI: tab inside social + Tasks/Dreamer integration** | Not a standalone nav section. Lives as a tab in the social section AND surfaces active campaigns in the Tasks/Dreamer board. | Apr 1, 2026 |
| D117 | **Reciprocal outreach: YES — flag guests for Scott's own podcast too** | "1000 times yes." System identifies outreach targets who could also appear on Scott's AI-generated podcast. Mutual relationship building + content generation. | Apr 1, 2026 |

---

## PLATFORM MATRIX (WORK IN PROGRESS)

*Updated Mar 31, 2026. Bluesky confirmed dropped (D29 — too left-leaning, audience not there). X/Twitter and TikTok moved to 🔬 pending research (D34, D35 — R4, R5 in progress). Instagram carousels confirmed YES (D30). Reddit, Bluesky removed per D2/D29.*

| Brand | Facebook | Instagram | Reels/Stories | Pinterest | X/Twitter | TikTok | LinkedIn | Threads | YouTube | Blog |
|-------|----------|-----------|---------------|-----------|-----------|--------|----------|---------|---------|------|
| NCHO | ✅ | ✅ carousel | ✅ stories | ✅ | 🔬 R4 | 🔬 R5 | ⛔ | ✅ | ✅ | ✅ daily SEO |
| SomersSchool | ✅ | ✅ carousel | ✅ stories | ✅ | 🔬 R4 | 🔬 R5 | ✅ | ✅ | ✅ | ❓ |
| Scott Personal | ✅ | ✅ carousel | ✅ stories | 🟡 | 🔬 R4 | 🔬 R5 | ✅ | ✅ | ✅ | ❓ |
| ~~Alana Terry~~ | ⛔ OUT | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ |
| ~~Bluesky~~ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ | ⛔ |
| PCW *(future)* | ❓ | ❓ | ❓ | ❓ | ❓ | ❓ | ❓ | ❓ | ❓ | ❓ |

**Key:** ✅ Build now | 🟡 Low-priority | 🔬 Pending audience research | ⛔ Never / removed | ❓ Not yet decided

---

## TECHNICAL GAP LOG

*Things already confirmed as needed that don't exist yet.*

| Gap | Priority | Blocks | Notes |
|-----|----------|--------|-------|
| Buffer 3-slot limit | High | Multi-brand/platform posting | Need upgrade or alternative scheduler |
| X/Twitter API cost | Medium | X presence | $100/mo Basic minimum for write access |
| Pinterest API setup | Medium | Pinterest posts | Business account + API approval needed |
| TikTok Business API | Medium | TikTok posts | Separate approval, AI content disclosure rules |
| Character count validation per platform | Medium | UX | UI gap — no current count shown in review queue |
| Hashtag editing in review queue | Medium | Editing workflow | Hashtags display but are read-only |
| Scheduled/Published post views | Medium | Post lifecycle visibility | Only pending_review visible currently |
| Image generation auto-trigger per post | Medium | Full post pipeline | image_brief exists but does nothing yet |
| Analytics dashboard | Low | Performance visibility | `/api/social/analytics` exists, no UI |
| Bulk approve across brand/platform | Low | Efficiency | One-by-one approve only |
| Encoding bug in cron label | Fix now | Weekly cron | `â€"` instead of `—` in job label |

---

## WHAT'S ALREADY BUILT (CURRENT STATE — March 30, 2026)

For reference as we design what comes next.

### ✅ Fully Built
- `/social` — 3-tab UI: Review Queue, Generate, Accounts
- `POST /api/social/generate` — Claude Sonnet 4.6, brand voice from DB, 3 brands × 3 platforms
- `GET /api/social/posts` — list by status/brand
- `PATCH /api/social/posts/[id]` — edit with full history tracking
- `DELETE /api/social/posts/[id]` — soft-reject
- `POST /api/social/posts/[id]/approve` — Buffer GraphQL `createPost` mutation → scheduled
- `GET /api/social/accounts` — list active Buffer channel mappings
- `POST /api/social/accounts` — add/upsert account
- `POST /api/social/accounts/sync` — Buffer GraphQL channel pull (GetOrganizations → GetChannels)
- `POST /api/social/analytics` — fetch stats from Buffer and write to `buffer_stats` JSONB
- `GET /api/cron/social-weekly` — Monday 05:00 UTC batch generation
- `POST /api/webhooks/shopify-product` — HMAC-verified Shopify new product → auto-generate NCHO posts
- `brand_voices` table (migration 023) — per-brand voice prompts, editable from Settings
- `BrandVoicesPanel` component
- Supabase Realtime on `social_posts`
- Edit history tracking (full JSONB log of every edit)

### 🔴 Built but broken/incomplete
- Encoding bug: `Weekly social batch â€" week of` (corrupted em dash) in cron job label
- No pagination on `GET /api/social/posts` — will blow up at scale
- `platforms` in generate UI hardcoded to facebook/instagram/linkedin — DB schema supports 7

### 🟡 Routes exist, no UI
- `/api/social/analytics` — exists, never called from UI

### ⛔ Not built at all
- Scheduled/Published post tabs
- Hashtag editing in review queue
- Character count per platform
- Image generation auto-trigger from image_brief
- Analytics dashboard
- Bulk approve
- Per-user queue filtering (Anna sees only her brand)
- Post re-generate button
- Approval deadline/expiry
- Content calendar view
- Bluesky integration (direct AT Protocol)
- X/Twitter posting
- Pinterest posting
- TikTok posting
- Threads posting
- Reddit monitoring

---

## ⚠️ OPEN ITEMS — WHAT YOU STILL NEED TO DISCUSS

*Consolidated from all sections. These are unresolved questions and decisions that need Scott's input before building. Presented as specific choices, not open-ended questions.*

**Updated:** March 31, 2026

---

### 🔴 HIGH PRIORITY — Blocks build decisions

**OI-01 — Rejected posts lifecycle (doc Q95)**
When a post is rejected in the review queue, what happens?
- Option A: Disappear into an archived pile (recoverable but out of sight)
- Option B: Move to a "Rewrite Pile" tab — visible, waiting for a rewrite
- Option C: One-click "Regenerate with different angle" button fires a new AI draft immediately
- **My recommendation:** Option C with Option A fallback. Regenerate fires fresh draft; if rejected again, archives. Scott approves the new draft before it moves to the queue.

**OI-02 — Approval deadline / post expiry (doc Q96)**
If a post sits unapproved for 48 hours, should it auto-expire (grey out, archive)?
- Prevents queue rot when Scott is busy
- **My recommendation:** YES — 72 hours not 48. Generous but still prevents stale queue. Scott can un-archive any expired post.

**OI-03 — Email/SMS notification when batch is ready (doc Q97)**
Resend email is wired. Twilio is available. When a batch of posts generates, should Scott get a notification?
- Option A: Chapterhouse UI only — Scott checks when he logs in
- Option B: Resend email notification — "Your Monday batch is ready for review"
- Option C: Twilio SMS — immediate nudge on phone
- **My recommendation:** Resend email (Option B) initially. SMS later when volume makes it worth setting up.

**OI-04 — Long-term: micro-SaaS for other homeschool content creators? (doc Q98)**
This is an architecture decision. If yes — multi-tenant DB, brand isolation, billing. If no — simpler, faster. Scott said his 12-month vision is fully automated for himself, not managing for others.
- **My read:** No, not yet. But the architecture should not prevent it. Design for one tenant now, multi-tenant later. Confirm.

**OI-05 — Phase 1 "done" definition (doc Q99)**
Complete this sentence: "I'll know the social system is working when ________________."
- Needed to establish the smoke test and go-live criteria.

**OI-06 — First smoke test post (doc Q100 — original version)**
What is the very first specific post you want live from this expanded system?
- Brand, platform, topic, week target.
- This post is the end-to-end test of the full new pipeline.

---

### 🟡 MEDIUM PRIORITY — Needs answer before Section 11-13 build

**OI-07 — Section 11: Niche platforms (Q101-Q108)**
All unanswered. Substack, Discord, WhatsApp, Amazon Author Central, Google Business Profile, Mastodon, Nextdoor. Most will be "no for now" but need explicit decisions.

**OI-08 — Section 12: NCHO blog strategy (Q109-Q120)**
All unanswered. Blog exists at `/blogs/news` with zero posts. Frequency, SEO keywords, AI draft vs Scott writes, Shopify API publishing, email trigger, video-to-blog or blog-to-video pipeline order.

**OI-09 — Section 13: Podcast guest outreach (Q121-Q129)**
All unanswered. Pitch angles, CRM vs manual tracking, personalization level, follow-up sequences, CTA for podcast appearances.

**OI-10 — Vacation/dark mode (my Q96 — Scott skipped)**
When Scott goes dark for a few days, should the queue:
- Auto-pause (nothing publishes during silence)
- Keep draining (approved posts keep publishing on schedule)
- Vacation mode toggle that holds everything until he manually reactivates
- **My recommendation:** Keep draining — that's the whole point of having a queue. But add a one-tap "Pause everything" emergency stop for genuine blackouts.

---

### 🔵 ARCHITECTURAL FLAGS — Decisions affected by D85 (audience correction)

**AF-01 — Alaska-specific framing in Section 11 (Q106)**
Q106 asks about Nextdoor for "Alaska homeschool community awareness." This framing is wrong per D85 (national audience). The real question: is Nextdoor relevant for any geo-targeted NCHO campaign? Probably no.

**AF-02 — All Section 12 SEO keyword suggestions assumed Alaska audience**
Q111 includes "Alaska education allotment guides" as a keyword category. This IS a valid SEO category (allotment/ESA is a national trend across 20+ states) but should not be framed as Alaska-specific. Re-frame as "State ESA/allotment-eligible curriculum guides" across all participating states.

**AF-03 — Research task R9 filed: hosting evaluation**
R9 = Vercel Pro + Railway cost/scale evaluation at 100 posts/day volume. Recommendation already filed (D82: stay put). R9 status = resolved by recommendation. No action needed unless costs spike.

**AF-04 — Alaska framing in Q111 corrected by D96**
Q111 originally said "Alaska education allotment guides." Per D96: reframed as national state ESA/allotment guides across all 20+ participating states. Confirmed by Scott at Q111.

---

### 🟡 NEW — Section 12 pending item

**OI-11 — Brevo email trigger on blog publish ✅ RESOLVED — D105**
YES but not at launch. Toggle built in, left OFF for Phase 1. Activate when content and list are ready.

---

*Last updated: March 31, 2026. As questions are answered, move them from this section to the appropriate section answer block above.*
