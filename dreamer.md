# The Dreamer
### A living creative intelligence file for Scott Somers / TheAccidentalTeacher
*Last synced: March 22, 2026 (Session 19) — Morning intel sweep complete. SEED 47 (Project Nomad, offline-first AI), SEED 48 (Remotion, video-as-code with React). Hooks category discovered in awesome-copilot. EdSurge "Restoring Wonder" confirmed as third brand layer. Trump AI child safety framework = SomersSchool positioning opportunity.*

> **How This Works**
> This file is a living document. Every time we talk, I update the repo registry, retire stale ideas, promote seeds to full dreams, and add new ones. Tell me what you shipped, what you're thinking, what's keeping you up at night — and I'll dream with you.

---

## Repo Registry
*Color code: 🔴 Hot (touched this week) | 🟡 Warm (touched this month) | 🔵 Cool (last 1-3 months) | ⚫ Cold (>3 months ago)*

### Tier 1 — The Crown Jewels
| # | Repo | Stack | Status | Live | What It Really Is |
|---|---|---|---|---|---|
| 1 | roleplaying | TS | 🔴 | roleplaying-nu.vercel.app | AI DM + 3D physics dice (Babylon.js + Ammo.js WASM) + ElevenLabs TTS + DALL-E + Supabase character persistence |
| 2 | chapterhouse | TS | 🔴 | chapterhouse.vercel.app | Private ops brain for Scott & Anna — daily brief, multi-model AI, research ingestion. **Full 8-phase implementation spec ready** (`intel/2026-03-18/chapterhouse-implementation-spec.md`). Multi-tenant from day one. Curriculum Factory migrated to SomersSchool — legacy code remains, do not build on it. |
| 3 | NextChapterHomeschool | TS | 🔴 | next-chapter-homeschool.vercel.app | ClassCiv — real-time multiplayer classroom civilization game, 29 tables, 11-phase epoch state machine |
| 4 | agentsvercel | JS | 🟡 | agentsvercel-beta.vercel.app | Hypomnemata — 12 AI personas, 39 serverless functions, 6 AI providers, YouTube intelligence, semantic memory (pgvector) |
| 5 | BibleSAAS | TS/HTML | 🟡 | bible-saas.vercel.app | BibleSaaS — 26/27 phases, living portrait, SM-2, 344K TSK refs, audio, gifting, Stripe — ONE PHASE from launch |
| 6 | arms-of-deliverance | TS | 🟡 | — | Epub/course generator — appears to be a curriculum builder framework |
| 7 | CoursePlatform | TS | 🔴 | — | SomersSchool — standalone homeschool SaaS. 52-course target. ALL SECULAR. COPPA. Clerk + Supabase + Stripe. Path B activated March 11, 2026. github.com/TheAccidentalTeacher/CoursePlatform |
| 8 | ncho-tools | TS | 🆕 | — | NCHO Tools — Next.js app for Shopify store management. AI-powered SEO, blog publisher, policy sync, product health dashboard. Standalone (not Chapterhouse). Shopify client credentials API. Decision: March 17, 2026 — build small and focused. |
| 9 | vigil | TS | 🆕 | — | Cognitive dashboard sidebar for Scott's 3440×1440 ultrawide. VS Code extension (vigil-listener) + Electron app. Detects Copilot done → Claude Haiku summary → WoW action bar flashes until acknowledged. Chrome tab groups per project slot. One-afternoon build. Spec: intel/cognitive-dashboard-brainstorm.md. |

### Tier 2 — Active Experiments
| # | Repo | Stack | Status | What It Is |
|---|---|---|---|---|
| 7 | talesofoldendays | HTML | 🟡 | 27-lesson literature course from 1930 public domain music reader |
| 8 | 1stgradescienceexample | TS | 🟡 | 1st grade science curriculum app |
| 9 | FoodHistory | TS | 🟡 | Food history site (Railway) |
| 10 | 2026worksheets | TS | 🟡 | Worksheet generator 2026 version |
| 11 | mythology | TS | 🟡 | MythoLogic Codex (Vercel) |
| 12 | adultaitutor | TS | 🔵 | AI tutor platform — KaTeX, MongoDB, GPT+Claude |
| 13 | gamedesigner | JS | 🔵 | Game level editor/designer tool |
| 14 | maps | JS | 🔵 | Geographic Detective Academy (Netlify) |
| 15 | ainovel | Python | 🔵 | AI novel generator (Python, different paradigm) |
| 16 | DeepResearcher | TS | 🔵 | Autonomous researcher — arXiv, PubMed, Semantic Scholar |
| 17 | Simulation-Factory | TS | 🔵 | Simulation engine factory |

### Tier 3 — The Workhorse Pipeline
| # | Repo | Stack | Status | What It Is |
|---|---|---|---|---|
| 18 | WorkbookCreator | TS/Other | 🔵 | Workbook creation pipeline |
| 19 | MathCurriculumA | TS | 🔵 | Math curriculum A |
| 20 | Social-Studies-Workbooks | — | 🔵 | Professional system for 150 social studies workbooks |
| 21 | homeschool-worksheet-ai | — | 🔵 | AI worksheet generator for homeschool families |
| 22 | Ultimate-Worksheet-Generator | JS | 🔵 | Full-featured worksheet generator |
| 23 | new-worksheet-generator | TS | 🟡 | KDP-first worksheet + book factory. Puppeteer PDF, pdf-lib merge, Prisma SQLite, math vertical + Novel Workbook phases. All phases complete. Visual Companion System (VC1) in queue — fractions first. Local: `new worksheet generator`. ⬆️ Elevated Session 8. |
| 24 | AccidentalTeacherWorksheets | — | 🔵 | Worksheet collection |
| 25 | working-generator | JS | ⚫ | Generator iteration (predecessor) |
| 26 | Curriculum | HTML | ⚫ | General curriculum app |

### Tier 4 — The Novel Factory
| # | Repo | Stack | Status | What It Is |
|---|---|---|---|---|
| 27 | Novel-Generator | JS | ⚫ | Novel generator (MIT License) |
| 28 | novel-generator-backend | JS | ⚫ | Novel generator backend |
| 29 | Novel-generator-october-2025 | JS | ⚫ | October 2025 iteration |
| 30 | OctoberNovelGenerator | JS | ⚫ | Earlier October version |
| 31 | NovGen | TS | ⚫ | TypeScript novel generator |
| 32 | Letswriteabook | JS | ⚫ | Book writing tool |
| 33 | Alanas-Novel-Assistant | JS | ⚫ | Anna's personal novel assistant |
| 34 | ainovel | Python | 🔵 | Python branch of the novel work |

### Tier 5 — Personal / Kids / One-offs
| # | Repo | Stack | Status | What It Is |
|---|---|---|---|---|
| 35 | SilasLand | JS | ⚫ | ⚑ REVISIT — Therapeutic portal for Silas. NOT a game. 9,247 lines of curated content across 18 JSON databases. 22 React components, 190 passing tests, WCAG 2.1 AA, offline PWA. Content: Rush/Dylan, Studio Ghibli, Star Trek, indie games, lit, poetry, neurodivergent support. Built ~8 months ago (zip-upload era). Needs a full rebuild — the bones are meaningful, the execution is early Scott. Hold the vision from SEED 01. |
| 36 | Ultimate-Silas-Hub | JS | ⚫ | Identical to SilasLand — same README, same codebase, later upload. Likely the "final" version. Consolidate into one before any rebuild. |
| 37 | SomersClassroomNewletter | JS | ⚫ | Classroom newsletter tool |
| 38 | Scotts-Social-Media | JS | ⚫ | Social media tools |
| 39 | glennallencarmansandiego | TS | ⚫ | Sourdough Pete (Railway) |
| 40 | eduhub | TS | ⚫ | Education hub |
| 41 | BookBuddy | TS | ⚫ | Book companion |
| 42 | aipublishing | HTML | ⚫ | AI publishing tools |
| 43 | Content-Monetization | HTML | ⚫ | Content monetization (MIT License) |
| 44 | newsletters | — | ⚫ | Newsletter system |
| 45 | Brainstorm | TS ⭐ | ⚫ | Ultimate Project & Brainstorm Hub — Neo4j, Redis, Pinecone |
| 46 | Ai-Agent | JS fork | ⚫ | AI agent (forked) |
| 47 | A-Required-Repository | — | ⚫ | Required GitHub repo |

---

## The Dream Queue
*Organized by type. New ideas land here. When you start building, they graduate to a repo.*

---

### 🔥 COLLISION DREAMS
*What happens when two repos crash into each other*

**COLLISION A: BibleSaaS + ClassCiv**
> *"The Catechism Campaign"*
What if the SM-2 spaced repetition engine in BibleSaaS powered a civilization-building reward loop in ClassCiv? Get a catechism question right → your civ gets a resource. Wrong answer → you lose turns. The first gamified theology curriculum that actually games correctly. Sunday school would lose its mind.
- **Effort:** Medium (both systems already exist)
- **Market:** Classical Christian homeschool, Sunday school, church youth groups
- **Revenue model:** $4.99/mo family subscription

---

**COLLISION B: Hypomnemata + DeepResearcher**
> *"The Oracle"*
Hypomnemata has 12 expert personas. DeepResearcher can pull arXiv, PubMed, and Semantic Scholar. What if you pointed DeepResearcher at a topic and all 12 personas cross-examined the source material — together, live? Not just "here's a summary" but "here's what your historian says, here's what your scientist says, here's where they disagree." That's not a research tool. That's a synthetic mind.
- **Effort:** Medium-high
- **Market:** Grad students, journalists, independent researchers, think tanks
- **Revenue model:** $29/mo — cheaper than one research assistant hour

---

**COLLISION C: Chapterhouse + Novel Generators**
> *"The Story Intelligence Layer"*
Chapterhouse already ingests URLs and briefs them. Anna writes novels. What if Chapterhouse had a "Story Bible" mode — a living document that tracks every character, every subplot, every unresolved thread in a manuscript — and auto-updates as new chapters are added? Not a writing tool. A story *memory* tool, for the author who's 200 pages in and forgot what eye color they gave the antagonist in chapter 4.
- **Effort:** Low (Chapterhouse architecture already does most of this)
- **Market:** Authors, novelists, screenwriters, Anna's entire network
- **Revenue model:** $9/mo — Anna tests it first, then recommends it on her platform

---

**COLLISION D: AI RPG + ClassCiv**
> *"Dungeon Classroom"*
ClassCiv is a civilization sim you play in class. The AI RPG has a DM, 3D dice, and ElevenLabs character voices. What if instead of a civilization, students were playing a dungeon crawl — where the DM is AI and the "game mechanics" are actually curriculum mastery? Get the history question right → your rogue can pick the lock. Math quiz determines your wizard's spell power. ELA reading level determines dialog options.
- **Effort:** High
- **Market:** 6th-8th grade teachers, enrichment programs, after-school, homeschool co-ops
- **Revenue model:** $19/teacher/mo — they'll budget it under "classroom supplies"

---

**COLLISION E: Simulation-Factory + Social Studies Workbooks**
> *"Living Textbooks"*
You have a simulation engine and a system that generates 150 social studies workbooks. What if the workbooks weren't just worksheets — but launched a simulation alongside them? Read chapter → click to run the simulation — watch the Battle of Gettysburg unfold with real troop counts, real terrain, real weather. The simulation is the answer key for the highest-order thinking questions.
- **Effort:** High (but the two hard pieces are already built)
- **Market:** Middle school social studies teachers
- **Revenue model:** $5/workbook as digital purchase. 150 workbooks × $5 = $750 in passive inventory

---

### 🌱 SEED DREAMS
*Half-baked, weird, or embryonic — not ready to build, but too interesting to lose*

**SEED 01 — SilasLand → "The Land" (Gift First, Product Second)**
Build it perfectly for one child you know completely. Then generalize. The commercial version doesn't need to be built differently — it just needs an onboarding flow that does for strangers what you already know about Silas.

**The vision:** Every homeschool family gets their own child's "Land" — a personalized world that ages with the child, tracks their interests, adapts to their needs. What Osmo tried to do, AI-native. "Land of Silas" → "Land of Emma" → $2.99/mo. Anna's audience (neurodivergent-friendly, faith-adjacent homeschool moms) is the warm launch market.

**Architecture direction (settled in session):**
- Gift version: hardcoded to Silas's world (existing 18 JSON databases are the content seed)
- Commercial version: parent interest intake → AI-curated content per child profile — same engine, different surface
- Key insight: the content isn't the point. **The feeling of being known is the point.** A world that feels like it was built by someone who loves you — not a database query.
- Build with files for the gift. Architect *as if* it's a database row underneath so the migration isn't a rewrite.
- What to track per child: interests, content preferences, regulation history, what they've visited, what they've skipped.

**Open questions before building:**
- How old is Silas and where is he developmentally right now?
- What does "therapeutic" mean for him specifically? (anxiety regulation? sensory? decompression space?)
- What did the first version get wrong in his eyes?
- Own brand? Under SomersVerse? Secular/neutral or family-configurable?
- What do we call it? "The Land" is a working name.
- Does Silas get to co-design it, or is it a complete surprise?

**The product demo:** Record his reaction when he sees it. That's the launch video.

**SEED 02 — The Vibe Coding Camp**
You are the world's most qualified person to run a 5-day summer coding camp for kids where "coding" means prompting AI to build apps. No syntax. No loops. Just: "I want to build a game about dinosaurs" and by Friday, they deploy it. Alaska in summer is 22 hours of daylight and one of the most dramatic backdrops on Earth. You'd have a waitlist in 48 hours.

**SEED 03 — Anna's Book as a Chapterhouse Plugin**
Anna writes a new novel. What if readers could add the book to a personal Chapterhouse-lite? AI-powered book club: "Ask the characters questions." "What would Priya do in your situation?" This is what every book-club-in-a-box Kickstarter has tried and failed to build. You could build it in a week.

**SEED 04 — The Alaska Curriculum**
There is effectively zero digital curriculum built by or for Alaska Native communities from a culturally grounded perspective. You are physically in Glennallen. You teach Title 1 students. You have an AI content pipeline. A curriculum series called "Seasons" — structured around the actual seasons of interior Alaska — for K-8 would be the first of its kind. BP, federal Indian education grants, and the Alaska Permanent Fund all fund exactly this. It's a grant application, not a startup pitch.

**SEED 05 — Sourdough Pete as a Food History Bridge**
You have glennallencarmansandiego (Sourdough Pete on Railway) AND FoodHistory. What if Sourdough Pete was actually a character-narrator for the food history site? Give him a voice (ElevenLabs, you already have it), a story, and a map. He walks you through the history of sourdough from ancient Egypt through the Alaskan Gold Rush. That's a 15-minute interactive experience that belongs in a museum gift shop and on History Channel's website.

**SEED 06 — The Homeschool Product Hunt**
There is no Product Hunt for homeschool curriculum. No aggregator where teachers and parents post what's working, upvote it, and discover new tools. You have the audience (Anna's podcast), the technical chops, and the category knowledge. A simple Supabase + Next.js community site with upvotes, tags, and affiliate links. Monetizes on day one if you do it right.

**SEED 07 — The AI Textbook Companion Standard**
Every physical textbook sold by Ingram Spark gets a companion URL. The URL is a Cloudflare Worker that routes to a Chapterhouse-lite for that book. A QR code on the back cover. Scan it → free AI study session for the chapter you're on. The physical book is the marketing. The digital companion is the subscription.

**SEED 08 — Brainstorm as a Public Thinking OS**
Brainstorm (Neo4j + Redis + Pinecone) was built for collaborative ideation. It's sitting cold. What if it became a public "thinking graph" — where you can share your idea maps? Like GitHub for thoughts. The education vertical is obvious (project-based learning planning), but the real audience might be startup founders who want to share their entire vision graph with an investor in one link.

**SEED 09 — Interactive SVG Lesson Embeds**
Google Gemini just shipped "interactive images" as a flagship education feature (Nov 2025): tap a cell diagram label → get a definition + explanation panel. It's a premium Gemini app feature. Scott can build the same thing as a *native course asset* with labeled SVGs + a Claude API call on click — single-file HTML, drops straight into any SomersSchool Next.js page.
- Click the mitochondria → Claude explains it in age-appropriate language for that grade level
- Works for: anatomy, geography maps, historical battle diagrams, cross-section science, architecture
- Build the first one (plant cell) as a 1st grade science lesson asset. Ship it. Then template it.
- **Effort:** 2-4 hours per asset once the pattern is established. Reusable SVG + one prompt template.
- **Market:** Every K-8 science and social studies course in SomersSchool — differentiates from static PDFs, worksheets, and anything Rainbow Resource sells
- **Google's version:** Locked inside Gemini app. Yours: inside a structured curriculum. Sequenced. Allotment-eligible. Exportable as a PDF worksheet companion.
- **Collision potential:** Merge with Simulation-Factory for animated interactive diagrams (water cycle, tectonic plates, food webs)

**SEED 10 — DeepResearcher for Homeschool Curriculum Research**
DeepResearcher currently points at academic databases. Retrain it (or add a tool) to search curriculum comparison sites, state standards databases, and Amazon reviews of educational materials. "Research 5th grade history curricula and compare them to Alaska state standards." That output is worth $200 to a homeschool parent who'd otherwise spend a weekend reading Rainbow Resource catalog.

**SEED 10 — The Game Designer as a Lesson Plan Editor**
gamedesigner is a visual level editor. What if a teacher could use it to design a "lesson level" — lay out stations, events, triggers, branching paths — and it exported a ClassCiv-compatible game session? The teacher designs the game without writing code. You've already built every component. This is just connecting them with a different UI frame.

**SEED 11 — "Progress Is the Product" (SomersSchool Retention Brief)**
RevenueCat's 2026 AI App Report (10 million users): AI apps churn 30% faster than non-AI apps. 21.1% vs 30.7% annual retention. The cause is clear — novelty wears off, there's no visible outcome. The counter is also clear: **structured curriculum with visible progress is the moat**. XP, badges, lesson streaks, and parent dashboards ("Tell Mom" feature) aren't nice-to-haves — they're the retention mechanism. SomersSchool is not a chatbot. It's a course. Design every lesson completion as a visible win. The question to answer before shipping: *"What does the child get to SHOW for finishing this?"*
- **Action:** Make lesson completion badges and XP the first post-launch feature sprint — not an afterthought
- **Design principle:** Every lesson ends with: a badge unlocked + parent notification + XP added + progress bar ticked
- **Market signal:** Parents pay for outcomes, not access. Churn is what kills the subscription

**SEED 12 — PRH "Grace Corner" Timing Pressure**
Penguin Random House Christian is launching a D2C platform called "Grace Corner" in Q1 2026 — streaming curriculum, live courses, webinars. IVP is building "Wholehearted Families" digital platform (2027). Baker launched "Haven" general-market imprint (Christian worldview, not preachy) — which is NCHO's exact positioning. The big publishers are waking up to the digital curriculum space. **Anna's window to establish her digital curriculum presence and NCHO's curation identity is NOW — before these platforms are fully established.** PRH has the catalog. NCHO has the curation and the teacher credibility. Differentiate hard on *"one real classroom teacher" vs "a corporation's catalog."* The underdog story is the marketing.
- **Timing:** PRH Grace Corner = Q1 2026. This is live or launching NOW. Not a threat in 18 months — a threat today.
- **Counter-position:** "Curated by a teacher who knows your kid's name" vs "shipped by a publishing house with 2,000 titles"

**SEED 13 — "Bushwhacking With a Lightsaber" Testimonial Format**
Craig Mod (Mar 13, 2026 blog) built custom personal accounting software in 5 days with Claude — multi-currency, US/Japan tax, PDF ingestion, learns categorizations. His words: *"It feels like bushwhacking with a lightsaber."* That's the exact emotional register Scott's SomersSchool origin story lives in. When collecting marketing testimonials, don't ask parents "what did you think?" Ask them: *"Describe the moment before you found SomersSchool, and then describe the moment you realized it was working."* The gap between those two moments IS the testimonial. That gap should feel like a lightsaber vs. a machete.
- **Use this framing for:** Founder story, social proof testimonials, Anna's podcast audience outreach, any SomersSchool landing page hero section
- **Real Scott story:** "I am a middle school teacher in a town of 439 people in Alaska and I built 47 apps without knowing how to code." That's the lightsaber.

**SEED 14 — Autoresearch Pattern for ClassCiv Performance Tuning**
Shopify CEO Tobi Lütke (Mar 13, 2026): ran ~120 automated optimization experiments using Claude Code + a robust test suite + a benchmarking script. Result: 53% performance improvement on the Liquid template engine — no human per-loop. Pattern: **robust test suite + benchmarking script + "make it faster" = actionable agent goal that can run unsupervised.** When ClassCiv hits performance ceilings under real classroom load (real-time state machine, 29 tables, multiplayer epoch transitions), this is the playbook. Don't optimize by hand. Write the benchmark first. Then `claude` in terminal + "make it faster" = come back to 50%+ gains.
- **Prerequisites for ClassCiv:** Need a solid Playwright/Cypress real-time load test + a DB query benchmarking setup
- **When to do this:** After classroom alpha reveals which queries are slow under real student load
- **Broader pattern:** Every performance bottleneck in every hot repo is now solvable this way

**SEED 15 — Vibe Coding as a Service**
Lovable: $400M ARR, $100M in February alone, 146 employees. The non-coder-builds-real-things wave is not a fad — it's the market. Scott is the world's most credentialed vibe coder: 47 apps, no prior coding background, 2,526 commits, Title 1 teacher in Alaska. If he ever has cycles, there's a legitimate side hustle or pivot here:
- **"Build it for you" service:** Fixed-scope, fixed-price (e.g. $750–$2,500). "Give me your problem. I'll ship you a working prototype in 72 hours." Target: solopreneurs, small businesses, other homeschool parents who have a tool they've always wanted.
- **Workshop model:** "Vibe code your own app in a weekend." $99 live workshop, Anna's audience as warm market. Teachers and homeschool parents are the exact persona — motivated, non-technical, outcome-oriented.
- **Niche: educators.** Every teacher in America has an idea for a tool they wish existed. Almost none can build it. Scott can teach them how. A 4-week cohort course at $299 would have a waitlist.
- **Content play:** "The Accidental Teacher builds live." A YouTube or Substack series where Scott builds a real app from scratch, narrating every prompt. The story sells itself. Audience becomes course buyers.
- **Positioning:** Not "learn to code." Learn to *get the thing you need built.* That reframe is worth $50M.

**SEED 16 — The Anti-i-Ready SomersSchool Facebook Ad**
HN front page, March 13, 2026: A parent engineer's measured, devastating breakdown of i-Ready went viral among tech-parent families. Core fact: 10:1 narration-to-math ratio. Zero real adaptation. His son came home crying saying he hated math. Teacher comment: "as a teacher IREADY is satanic." Family changed districts to escape it. Parents named Khan Academy and Beast Academy as "what actually works."

This is not a competitor to attack — it's a symptom to name. Every homeschool parent who pulled their kid FROM a district did so in part because of software like i-Ready.

**The Facebook ad that writes itself:**
> "My son used to demand math problems in the car. Then he started crying every time he came home from school. The culprit? The school's 'adaptive' software — that spent 10 minutes of animation explaining the same problem he'd already answered 30 times. We pulled him out. We built something different. SomersSchool: built by a classroom teacher. Lessons that actually adapt. Progress your child can show you."

- Emotional lead (the child, not the software) ✓
- Teacher credibility ✓
- Implicit contrast without naming competitors ✓
- Call to "your child" not "your student" ✓

**Before running this:** Ensure SomersSchool has no unskippable animations >5 seconds. The anti-i-Ready positioning only works if Scott's own product is the opposite of what it's critiquing.

**SEED 17 — Beast Academy as the UX Benchmark**
Beast Academy (Art of Problem Solving) is what parents on HN name when asked "what educational software actually works?" It's math-only, K-5. But its UX design philosophy is worth studying before Scott finalizes SomersSchool's lesson flow.

Key questions to answer before build:
- How does Beast Academy handle "mastery vs time" (does the child advance when they KNOW the material, not when the clock runs out)?
- How does it handle repetition without torture (same concept, fresh problem, zero re-narration)?
- What does their progress visualization look like?
- What's their reward loop?

**Scott's edge over Beast Academy:** All 4 core subjects. K–12 (not just K–5). Gimli as mascot (K–5) vs Scott avatar (all grades). Real teacher behind every lesson. Parent notifications built-in. Alaska allotment eligible. Beast Academy is math-only and has no teacher-identity moat.

**Action item:** Before shipping SomersSchool lesson flow, spend 2 hours as a student inside Beast Academy. Take screenshots of every UX decision. Compare to SomersSchool wireframe. Every place they make friction zero, SomersSchool should too.

**SEED 18 — "Restoring Wonder" as NCHO/SomersSchool Brand Layer**
EdSurge, March 13, 2026: Teacher first-person piece called "When a Box Is No Longer a Castle: Restoring Wonder in a Screen-Filled World." That phrase is sitting unclaimed in the homeschool marketing space.

The current NCHO brand layer is: "For the child who doesn't fit in a box." (Emotional, validated.) The practical conversion hook is: "Your one-stop homeschool shop." Restoring wonder could be a *third layer* — the aspirational dimension that sits above product and below brand. Not "your child doesn't fit in a box." Not "one-stop shop." But: *"What if school felt like wonder again?"*

Test it in Facebook copy against the current headline. May outperform or serve as a complementary second hook — especially for parents who aren't framing their purpose as "my kid is different" but as "something has gone out of my child's eyes and I want it back."

**The Gimli application:** Every Gimli video should end with a moment of wonder, not a quiz. Current lesson arc: hook → concept → example → check → summary. Add a WONDER beat between example and check. A single question with no wrong answer. "What would happen if..." The wonder beat is the differentiator vs every worksheet generator and adaptive quiz platform on the market.

**SEED 19 — Screen-Time-With-Intention Positioning for SomersSchool**
Multiple states are now legislating "screen-free schools." Homeschool parents already distrust screens — this legislative wave validates their instinct. SomersSchool runs on a screen.

Instead of hiding from the objection, own it: *"Purposeful screen time with a real teacher behind every lesson."* 

This reframes the category. Not "online curriculum" (defensive). Not "digital learning" (generic). But *intentional, supervised, teacher-designed screen time* — which is the exact opposite of the passive, game-loop-driven, algorithm-addicted screen time that legislators are trying to ban.

**The landing page micro-copy:** Under the signup CTA — "Not a screen babysitter. A real classroom teacher's curriculum, delivered online." One sentence, does all the work.

**SEED 20 — "Convicted, Not Curious" — NCHO Positioning Against S&S**
Simon & Schuster launched their inaugural religion list in Q1 2026 targeting "spiritually curious people." PRH "Grace Corner" already live. Both are major secular publishers targeting the edges of the faith market — the dabblers, the seekers, the "spiritually adjacent."

NCHO's actual customer is not spiritually curious. She homeschools her children because she has convictions about what they learn, who is in the room when they learn it, and what worldview shapes the curriculum. She is not exploring faith. She is *living it and transmitting it.*

The NCHO brand distinction: **We are not for the spiritually curious. We are for the spiritually convicted.** Not preachy. Not corporate. Not a publishing catalog. One teacher who sees your child the way you see your child.

This distinction should appear nowhere in NCHO marketing copy directly — it should be *felt* in every word choice. "Your child" not "students." "Curriculum you believe in" not "resources for your journey." Conviction over curiosity, in tone and texture.

**SEED 21 — Autoresearch Loop for SomersSchool Lesson Quality**
Shopify CEO ran 120 automated optimization experiments using Claude Code + a benchmarking script. Result: 53% improvement. The key unlock: a *measurable goal the agent can track itself.*

SomersSchool's measurable goal analog: lesson completion rate. Already tracked in the `lesson_progress` table. The autoresearch loop for curriculum: generate lesson variant → deploy to test cohort → measure completion + badge unlock rate → agent iterates → better lesson.

This isn't hypothetical. With 52 courses and the `lesson_progress` table already specced, the instrument exists. After first real enrollment cohort (post-launch, when we have data), the autoresearch pattern becomes a curriculum quality flywheel: *"Lesson 3 of Grade 1 Science has 34% completion. Make it better."* The agent runs experiments. We ship the winner.

**When to do this:** Not now. After launch, after first paying cohort, after real completion data exists. This is a Month 3–6 move. But design the `lesson_progress` table to capture everything needed (time on lesson, completion boolean, exit point, badge trigger). The measurement apparatus goes in now; the optimization loop activates later.

---

**SEED 22 — "I-Ready Backlash = SomersSchool's Best Positioning Moment"**
*Source: HN front page, March 14, 2026 — 48 pts, 14 comments. Intel sweep: evening.*

I-Ready is getting publicly destroyed by parents and teachers online. HN front page. The details: 10:1 narration-to-math ratio. Zero real adaptation despite branding. Unskippable animations. One parent's son came home in tears saying he hated math. A teacher comment: "as a teacher IREADY is satanic." Family changed school districts to escape it.

**SomersSchool counter-position:** "Not an algorithm. A real teacher's sequence." — That's the headline.

The parents waking up to I-Ready's failure are the same parents considering homeschooling or buying supplemental curriculum. They're primed to buy something the *opposite* of I-Ready: teacher-designed, parent-controlled, structured, visible progress. We ARE that product. Name it explicitly.

Facebook ad candidate: "Your school district chose I-Ready. You don't have to."

---

**SEED 23 — "Co-Viewing: SomersSchool's Structural Differentiator Against AI Tutors"**
*Source: EdSurge, March 10, 2026 — "The First Screen My Daughter Ever Saw." Intel sweep: evening.*

AAP updated its screen-time guidance. The question is no longer "how many minutes." It's "what kind of digital ecosystem." The data is clear: **co-viewing** — when a parent watches and interacts with a child during media — dramatically improves learning outcomes over solo consumption.

Every AI tutor (Khanmigo, ChatGPT Study Mode, Socratic) is designed for solo child use. The child fires up the chatbot. No parent needed.

SomersSchool could be the only curriculum product explicitly designed for *parent + child together.* Every lesson ships with a Parent Guide. The "Tell Mom" button invites co-viewing. Lesson pace is set by the parent, not an algorithm.

Positioning test: **"Designed for two. Built for your child. Used together."** — test against "not an algorithm."

The AAP label gives this parental credibility. "AAP-aligned screen time principles" is a trust signal homeschool parents recognize.

---

**SEED 24 — "The Two Tyndales: Leadership Vacuum at the Biggest Christian Publisher"**
*Source: Publishers Weekly Religion, March 9, 2026. Intel sweep: evening.*

Tyndale House — one of the largest Christian publishers in the US — lost BOTH its most senior leaders in the span of one month:
- **Jan Long Harris** (Executive Publisher, nonfiction, 26 years) — retiring March 20, 2026
- **Mark Taylor** (Board Chairman, literally the founder's son, 53 years at the company)

Two leadership departures simultaneously = slower acquisitions, possible editorial repositioning, uncertainty about who's greenlighting new projects.

**What this means for Anna:** Tyndale is Christian fiction's institutional center of gravity. A leadership gap doesn't mean the company collapses — it means the next 12-18 months are an institutional pause. Slower response times. Less appetite for risk on new authors. More committee decisions.

**The window this opens:** Anna's direct sales through NCHO and her existing audience at Alana Terry are more valuable than a Tyndale submission right now. If Anna has a book ready in the next 12 months, the calculus may favor direct launch over traditional acquisition — especially while Tyndale finds its footing.

Watch: Whoever they hire as Executive Publisher will signal which direction they're moving. A hire from a trade house = more mainstream. Promoting internally = staying in lane. The hire will happen in the next 6 months.

---

**SEED 25 — Chapterhouse Answer Engine (Perplexity-Style)**
*Build spec complete: `intel/social-media-automation-brain.md` Part 2. March 15, 2026.*

The backend already exists. `/api/research/deep/route.ts` does Tavily → Claude synthesis → `[1][2][3]` citations. The gap is a streaming chat UI. What needs to be built:
- `/api/research/ask/route.ts` — SSE streaming route, Tavily-only for speed, follow-up question generation built in
- `src/app/ask/page.tsx` — standalone question → streaming answer → clickable inline citation page
- `src/components/answer-display.tsx` — renders `[N]` markers as superscript links with source cards

**Why this matters beyond Chapterhouse:** This is the pattern for every AI-powered research feature in every future product. The two-layer model — Markdown skill (system prompt) as the interface, Supabase as storage — is the reusable template. Build it once in Chapterhouse. Copy the pattern into SomersSchool's teacher research tools.

**Estimated build:** 4–5 hours. 5 files. No new dependencies. No new DB migrations.

---

**SEED 26 — CLAUDE.md as Competitive Skill Layer**
*Insight from Brad Feld's CompanyOS, March 2026. March 15, 2026.*

Every tool vendor (GitHub Copilot, Claude Code, Cursor) reads a Markdown skill file at startup. This file = zero-token warm context. The GitHub MCP server costs ~23,000–50,000 tokens of context. A SKILL.md covering the same workflow costs 200 tokens. **100x token advantage.**

Scott's `copilot-instructions.md` IS a CompanyOS skill file — just not named as such. Each active repo needs its own `CLAUDE.md`:

| Repo | Key facts to encode |
|---|---|
| Chapterhouse | Jobs pattern (Supabase→QStash→Railway→router.ts), model names, migration convention, Realtime pattern |
| CoursePlatform | COPPA architecture, 12-table schema, Stripe vs Shopify routing, `faith_based` must be false |
| roleplaying | Babylon.js + Ammo.js WASM pattern, ElevenLabs scoped key, dice physics notes |
| BibleSaaS | SM-2 algorithm state, TSK graph, 26-phase summary, privacy-first hard constraint |

**The standalone test (from Brad Feld):** If you disconnect Claude Code's tools and it can only read the CLAUDE.md, does it still produce the right analysis and recommendations? If yes — knowledge is properly separated from execution. If no — execution logic snuck into the skill file.

**This is now a locked architectural decision, not a suggestion.** Every hot/warm repo ships with a CLAUDE.md before any new feature work begins.

---

**SEED 27 — Visual Companion System (Print-First Interactive Layer)**
*Architecture session, March 15, 2026. Source: `intel/interactive-visuals-math-science.md` Parts 9–22. Handoff: `intel/visual-companion-handoff.md`.*

ChatGPT launched interactive math visuals (Mar 10, 2026). The SomersSchool response is not to match ChatGPT's UI — it's to own the *print* layer they can't touch.

The Visual Companion System adds AI-generated concept diagrams to math worksheet PDFs. A fraction bar visual, base-ten blocks, a measurement comparison model — printed into the KDP workbook itself, between instructions and problems. The WONDER beat. The moment between hearing and knowing.

**Phase VC1 implementation target:** `new worksheet generator` (local KDP book factory — all 9 phases + Novel Workbook phases 1-14 complete).

**Key architectural decisions:**
- Store visual bundle in `contentJson._meta.visualBundle` — follows the existing `_meta` pattern (borderId/verseText already there)
- No new Prisma table in Phase 1 — ship light, prove value first
- `src/lib/visuals/` module: 5 files (types, prompt-builder, generator, print-renderer, registry)
- Supported types Phase 1: fractions, place_value, comparison, number_patterns, measurement, counting
- Print format priority: SVG first → HTML fragment → PNG dataURL
- Fractions is the proof slice — visual clarity, black-and-white safe, Grade 2-5 value
- Later: QR code in printed worksheet → links to digital interactive companion
- Even later: prompted visual types for SomersSchool lesson assets

**Why fractions beats every other first slice:** Visually obvious on paper. Easy to validate correctness. Works in black and white. High Grade 2-5 value. Clean SVG anatomy.

**The long game:** Every printed lesson asset is a future QR-linked companion. Every KDP workbook becomes a portal to a digital lesson. The physical product drives the digital subscription.

---

**SEED 28 — PW Intelligence → Weekly Podcast Pipeline**
*Session 11, March 16, 2026.*

(See below for details.)

---

**SEED 29 — NCHO Shopify Store Audit & CSV Enrichment Pipeline**
*Session 12, March 17, 2026.*

Yellow CoPilot custom app connected to NCHO Shopify store via Dev Dashboard → client credentials grant. Full audit pulled: 108 products (102 Ingram GetBooks imports + 6 manual), 33 smart collections (auto-ruled by tags), 49 product tags (Age/Grade/Subject/Type taxonomy).

**The CSV enrichment pipeline concept:** When Anna imports a new batch of books (from Ingram catalog or manual CSV), a Python script pre-processes every row before upload:
- Auto-tags by age range → Grade: Pre-K through Grade: High School
- Auto-tags by title/description keywords → Mathematics, Language Arts, Science, Social Studies + sub-tags
- Auto-tags product type → Workbook, Activity Books, Games, etc.
- Generates SEO title + description (155 chars) for every product
- Cleans vendor names, validates required fields
- Outputs Matrixify-compatible CSV for direct upload

**Key audit finding:** Zero of 108 products have SEO metadata. This is a critical fix before going live — every product is invisible to Google. Policies are also mostly empty (paste-ready versions exist in `ncho-shopify-policies.md`).

---

**SEED 30 — r/homeschool AI Backlash: Earn Trust First**
*Source: r/homeschool hot feed, March 18, 2026. Intel sweep: morning.*

r/homeschool is 219,000 subscribers. A moderator-adjacent post today: *"Every day, all day, I see another AI driven app being advertised on this sub. Or people looking for free market research or product testing. I'm about done here."* The sub is explicitly hostile to AI app promotion and cold market research.

**What this means:** Do NOT market SomersSchool directly on r/homeschool, ever. The backlash will come fast. The community can smell a promotional post in two sentences.

**The right path in:** Become a contributing member first. Answer difficult curriculum questions (phonics methods, special needs, early learners). Post as Scott the teacher, not Scott the founder. After 6 months of genuine contributions, you could share SomersSchool in context. Before that — stay out of the marketing mindset entirely.

**What the feed *does* tell us:** The curriculum questions dominating discussion are: phonics methodology, special needs/neurodivergent approaches, kindergarten readiness, early math fluency without killing interest. These are the course gaps SomersSchool can fill. Build those first.

---

**SEED 31 — Stripe Machine Payments → Chapterhouse Agent Economy Layer**
*Source: HN front page, March 18, 2026. Intel sweep: morning.*

Stripe is building infrastructure for AI agent-to-agent payments — machines paying machines without human approval loops. This is the billing layer of the agent economy. Chapterhouse, as a multi-agent orchestration engine, will eventually route work to sub-agents that may cost money to run (API calls, tool calls, premium data). The moment agent-to-agent payment is a standard Stripe API, Chapterhouse can bill per-workflow without storing payment tokens per client.

**The architecture implication:** Every Chapterhouse workflow that calls external APIs should eventually be instrumented with a cost meter. Not for billing today — for billing later, when Stripe's machine payments layer is stable. Design the `workflow_run` table to include `cost_usd` (nullable, populated when available). Future: parent plans that include "agent budgets."

**When to act:** Not now. Watch Stripe's developer preview. Subscribe to their changelog. When the Machine Payments API hits GA, revisit Chapterhouse's billing architecture.

---

**SEED 32 — `obra/superpowers`: Agentic Skills Methodology for Chapterhouse**
*Source: GitHub All-Language Trending #2, 4,091 stars today, 95K total. March 18, 2026.*

`obra/superpowers` is the #2 trending repo on all of GitHub today (behind only a Claude Code plugin). It's a composable agentic skills framework — not a product, not an API, but a *methodology*: define skills, compose them, hand them to an agent. Built with Claude Code. Shell-based.

**What makes this different from just prompting:** Skills are reusable named behaviors. An agent doesn't just "do the thing" — it calls named skills (e.g., `parse_code`, `generate_tests`, `explain_concept`) that are separately defined, separately tested, separately version-controlled. This is the Claude Code equivalent of React components: composable, testable, reusable.

**For Chapterhouse:** Before designing the next agent pipeline, read `obra/superpowers` and extract the skills-composition pattern. Chapterhouse's agent router (`router.ts` + Jobs pattern) maps naturally onto a skills architecture. The question is whether to adopt the Superpowers methodology directly or just borrow the pattern.

**Action:** Read the README before the next Chapterhouse architecture session. Check if `copilot plugin install superpowers@...` or a direct clone is the right install path.

**Store credentials (for `shopify_audit.py`):**
- Store: `next-chapter-homeschool.myshopify.com`
- Plan: Basic
- App: Yellow CoPilot (Dev Dashboard, client credentials grant)
- Client ID: `[see api-guide-master.md — local only]`
- Client Secret: `[see api-guide-master.md — local only]`
- Token: refreshed per-run (24hr expiry), no persistent storage needed

---


*Session 11, March 16, 2026.*

Every week, Publishers Weekly releases a PDF full of signal for Scott and Anna: faith publishing moves, children's catalog news, indie author economics, IngramSpark health, AI in publishing. Scott doesn't have time to read it. Anna listens while driving.

The pipeline converts that intelligence into a 5–6 minute podcast MP3:
`PDF → extract.py (PyMuPDF, bypasses PW RC4 DRM) → briefing → generate_podcast.py (ElevenLabs Rachel / OpenAI nova fallback) → MP3`

**Status:** FULLY OPERATIONAL. First episode: `pw-briefing-2026-03-16.mp3` — ElevenLabs Rachel voice, ~5–6 min. Documented in `intel/Publishers Weekly/PIPELINE.md`.

**Editorial filter (one-sentence test):** *Does this change a decision Scott or Anna would make in the next 90 days?*
- ALWAYS IN: faith/Christian publishing market moves, homeschool signals, AI in publishing/education, IngramSpark ecosystem health, indie author economics, Authors Guild policy, major children's catalog titles
- ALWAYS OUT: literary fiction, academic publishing, secular genre fiction (unless crossover), bookstore industry (NCHO is online-only), international rights (unless on NCHO watch list)

**The extension play:** Three PW issues extracted and archived as `.txt` files. When Chapterhouse Phase B is live with 1M context, feed all three at once for multi-week trend analysis. That's a briefing capability no individual subscriber has.

**ElevenLabs key note:** "Revered Grizzly Bear" scoped key has TTS permission (✅) but NOT `voices_read` (❌ 401 on `/v1/voices`). TTS endpoint works fine. Rachel voice ID: `21m00Tcm4TlvDq8ikWAM`.

---

**SEED 30 — Chapterhouse Email Triage + Ops Dashboard (validated by Forbes)**
*Session 13, March 17, 2026. Corrected Session 13b — build it, don't rent it.*

Forbes: Rachel Wells saved 8-9 hours/week by connecting Outlook email + calendar + Stripe to ChatGPT's "Apps in ChatGPT" feature. Her workflow (email triage → calendar prep → Stripe dashboard → dormant opportunity mining) is exactly what Chapterhouse's daily brief should do. But every capability in that article is an API call Scott already has keys for.

**Build into Chapterhouse daily brief:**
- **Gmail triage:** `googleapis` npm — read, classify (urgent/needs-response/info/junk), AI-draft replies, save as Gmail drafts
- **SiteGround email triage:** `imapflow` npm — read `scott@` and `support@nextchapterhomeschool.com` via IMAP 993, same AI classification
- **Support auto-draft:** `support@` emails get template-matched responses (order status, allotment FAQ, returns) held for Anna's approval
- **Stripe dashboard:** Stripe API — revenue summary, failed payments, refund requests. Already have keys.
- **Newsletter intel extraction:** Read PW, daily.dev, industry emails → feed into intel pipeline instead of manual reading
- **Shopify/Stripe notification parsing:** Surface actionable alerts ("2 failed payments, 1 refund request") in daily brief

**Key prompts to steal from the Forbes workflow:** "What dormant business opportunities are in my inbox?" + "Summarize my correspondence with [name] for meeting prep" + Stripe → Q1 revenue dashboard.

**Why not ChatGPT Plus:** Everything it does is a standard API call. Scott owns Stripe keys, Gmail OAuth, IMAP credentials, Resend, Brevo. Chapterhouse also has Council synthesis, PW pipeline, collision mapping, and dream generation — things ChatGPT Apps will never have. Don't pay $240/year to rent what you already own the parts to build.

---

**SEED 31 — Trust-Optimized Product Pages for AI Agent Eligibility**
*Session 13, March 17, 2026.*

Wharton research (via Search Engine Journal): As AI agents start making purchasing decisions, trust becomes the ranking factor. Agents won't recommend brands they can't *defend* recommending. Rand Fishkin/SparkToro found AI recommendations vary wildly in ordering — but a stable "core consideration set" always emerges. You're now optimizing for **eligibility**, not just visibility.

**NCHO/SomersSchool action:** Every product page needs structured data, transparent pricing (no gated info), comparison tables, "best for X" guidance, and FAQ depth sufficient to survive interrogation by an autonomous purchasing agent. External validation (reviews, communities, teacher endorsements, tutorials) is the moat.

**"Curated by a real classroom teacher" is the strongest possible signal for AI agent trust.** It's specific, verifiable, defensible. A publishing conglomerate's catalog can't compete with that claim under agent scrutiny.

---

### 💰 QUICK WIN DREAMS
*Buildable in a weekend. Revenue possible within 30 days.*

**QW-01 — BibleSaaS Phase 27 (The Tuesday Launch)**
You are ONE phase from launching. Phase 27 = LLC + real Stripe keys + production environment. If you did nothing else this week, this is the right thing to do. There is no quicker win in your entire portfolio.

**QW-02 — Worksheet Subscription Box (Digital)**
Take your worksheet generators. Pick one subject. Offer a $5/mo subscription: 20 new worksheets every month, PDF download, printer-ready. Gumroad or Payhip handles the payments. You're already generating these. This is a storefront + a cron job.

**QW-03 — "Powered by Xeno" AI Lesson Plans for TPT**
Teachers Pay Teachers has 8 million active users. A set of 10 AI-enhanced lesson plan templates for $5.99. Your content pipeline generates them. Your Shopify store links to them. Anna's podcast mentions them.

**QW-04 — Canary Token Domains for My Own Repos**
Any time someone forks or clones your novel generators, a canary token fires and you know about it. Competitive intelligence on who's using your work. Takes 20 minutes with a cheap domain + Cloudflare Worker.

**QW-05 — MythoLogic Codex as a Curriculum Anchor**
mythology has been sitting warm for a month. A mythology-based vocabulary program — 5 words per week drawn from Greek/Latin roots, each with a story — is $3.99/mo and every homeschool parent buying the Shopify store would add it to their cart.

**QW-06 — Suno AI Music for SomersSchool Course Assets**
Scott has a Suno account (50 credits, username mrsomers). Already generated "Friday at Our School" — usable school anthem, download and deploy in InVideo NCHO videos immediately. Bigger play: upgrade to Pro (commercial use rights required), then generate once per course — 52 course themes, a Gimli jingle, badge unlock sting. One month of Pro credits = permanent audio asset library. Watch for official API access at suno.com/api to automate generation at course-creation time. Do NOT build on the unofficial community wrapper (ToS violation). Pin: revisit when CoursePlatform course generator is being built.

---

**SEED 32 — "Real Teacher" Opens Gates Against PRH, S&S, KA, IXL**
*Validated by HN + FWC market research. March 17, 2026 intel sweep.*

The homeschool curriculum market now has four tier-one players attacking from different angles:
- **Penguin Random House** ("Grace Corner" D2C platform, Q1 2026) — publishing scale + DTC capability
- **Simon & Schuster** (religion list for "spiritually curious," Q1 2026) — trade publisher pivot
- **Khan Academy** ("personalized" marketing, but 34M students chasing scale) — free + freemium model  
- **IXL** (already $475/yr, destroying teacher morale, now class-bundled) — entrenched in districts

All four have one vulnerability: **nobody built these things because they love teaching.** They're businesses optimizing metrics.

**NCHO (real teacher) + SomersSchool (secular, teacher-designed) are positioned as the *only* credible counter-position.** Not "we're different from big publishers" (cheap claim). But "a real classroom teacher in Alaska sees your specific child."

This is credibility moat vs scale moat. If we defend the "real teacher" positioning with rigor (every lesson designed by Scott, reviewed by someone who knows 6th graders), then PRH → "a corporation with a curriculum division" is how the market hears them. Our window: NOW, before these platforms stabilize.

**Action:** Every piece of SomersSchool marketing, every cover page, every testimonial, every lesson preview should answer: "How do I know a real teacher designed this?" Make it impossible to doubt. That doubt is where customers convert to KA or IXL instead.

---

**SEED 33 — VCs Are Funding "Wonder in Education" — Market Segmentation Shift**
*Source: Getting Smart podcast Mar 13, 2026. Pattern recognition across Q1 2026 startup trends.*

Three converging signals:
1. **EdSurge edits:** "Restoring Wonder," "Youth Agency," "Bottom-Up Innovation" (all Q1 2026, all trending)
2. **VC funding:** Microschools, personalized learning platforms, "awe-driven" curriculum getting Series A interest
3. **Reddit/HN:** "My kid used to love learning" is the #1 parent comment on screen-time and curriculum threads

The market is bifurcating:
- **"Efficiency" tier:** IXL, i-Ready, Khan (30% of market, declining, commoditized)
- **"Wonder" tier:** Beast Academy, project-based learning, Montessori, classical homeschool (emerging, VC-backed, growing)

**NCHO's positioning:** "For the child who doesn't fit in a box" + "Your one-stop shop" (eff tier defensive). Add "restoring wonder" → elegible for VC-backed networks now forming around wonder-driven pedagogy.

**SomersSchool positioning:** "Purposeful screen time with a real teacher" + wonder beat in every Gimli script = alignment with the emerging VC-funded segment.

**Action:** Before shipping SomersSchool, audit every lesson:
- Is there a moment of *awe/curiosity that surprises the child?*
- OR is it optimization/gamification narrowing attention?
- The former = venture-backable category. The latter = commoditized.

The market is willing to pay MORE for wonder. VCs are funding it. This is not aspirational positioning—it's where the growth capital is flowing NOW.

---

---

**SEED 34 — VIGIL: The Cognitive Dashboard**
*Source: Dream Floor session, March 17, 2026. Extended Mind applied to developer workflow. Decisions locked same session.*

Scott has 5 VS Code instances, dozens of Chrome tabs, and no cognitive map of any of it. Working memory can't hold the state of everything open. He loses context, loses tabs, loses track of which VS Code window Copilot just finished in.

**VIGIL** is the answer. Permanent 250px strip on the left of his 3440×1440 ultrawide. Pushes workspace to 3190px. Always there.

**Core job:** When a VS Code Copilot session finishes — or a terminal process completes — VIGIL taps Scott on the shoulder: *"Chapterhouse is done. Go look."* Flashes until acknowledged. Claude Haiku generates a one-sentence summary. One click (or Win+1 through Win+5) jumps to that VS Code window AND surfaces the associated Chrome tab group.

**Architecture:** Two pieces.
- `vigil-listener` — VS Code extension. Detects file save bursts (proxy for Copilot done) + terminal exits. Writes to `~/.vigil/events.json`.
- `VIGIL` — Electron sidebar app. Watches that file. Calls Haiku. Shows WoW-style action bar slots that flash until acknowledged.

**The WoW action bar:** One slot per project. Each slot shows project name + one-sentence Haiku summary + Chrome tab count. Click or keyboard shortcut to acknowledge + focus VS Code + surface Chrome group. Chrome tab groups manually assigned per slot.

**Wild ideas logged:**
- Session memory: snapshot VS Code state on close, surface on reopen
- Monday Morning Brief: local TTS of machine state on first launch of the week
- Dead tab graveyard: tabs untouched 72hrs move to archive
- Earl intervention: 6th VS Code at 10pm → Earl's question in the slot
- Chapterhouse integration: VIGIL pushes machine state into daily brief context
- Voice control: "Hey VIGIL, bring up Chapterhouse" (Whisper local)
- Mission Control overlay: fullscreen Exposé view of all windows + tabs

**Full spec:** `intel/cognitive-dashboard-brainstorm.md`
**Case study (job applications):** `reference/vigil-case-study.md`
**Build time:** One afternoon. ~70 minutes to first production deploy. Electron + VS Code extension + Haiku.
**Status:** ✅ SHIPPED. Running in daily use. Screenshot confirmed.

---

**SEED 35 — KILLED**
*Local LoRA training (A1111/kohya_ss) — rejected. Going API-first instead. Character consistency handled via Leonardo Character Reference API + FLUX.1-Kontext via Azure Foundry (D11). No desktop apps, no local model training.*

---

**SEED 36 — WHISPER PIPELINE: Local Transcription at 50x Real-Time**
*Source: Hardware audit, March 17, 2026. The 9800X3D + 5070 Ti make this trivial.*

`whisper.cpp` running on the RTX 5070 Ti transcribes audio at 50x real-time speed locally. That means a 60-minute podcast becomes text in 72 seconds. With zero API cost. Forever.

**Immediate applications Scott already has:**
- PW Podcast → drop the audio in, get the full transcript instantly (enhances the Chapterhouse pipeline)
- Classroom recordings → auto-transcribed, auto-summarized, sent to parents as lesson notes
- Scott's own voice memos → ideas he speaks instead of types → auto-filed to dreamer.md
- Any YouTube video → download audio → transcribe → feed to Claude for deep analysis
- HeyGen avatar script creation → dictate naturally → Whisper cleans it up → paste into HeyGen

**Voice-to-code loop:** Scott dictates an idea → Whisper transcribes → Copilot builds it. No typing. This is vibe coding at the physical interface layer.

**The "Monday Morning Brief" wild idea from VIGIL:** VIGIL could call Whisper + local TTS to read Scott's day out loud on first VS Code launch. Local, private, instant.

**What to install:** `whisper.cpp` (C++ binary, one cmake build), or `faster-whisper` (Python, simpler). Model: `large-v3` fits in VRAM on the 5070 Ti.

**Status:** Seed. One hour of setup. Permanent capability upgrade.

---

**SEED 37 — THE PHYSICAL BELL** *(parked — revisit at first revenue)*
*Source: Dream Floor, March 17, 2026. Because money should make a sound.*

When SomersSchool makes its first sale — when a parent subscribes — Scott's desk should ring. Arduino Uno ($25), USB-serial bridge, webhook receiver. 40 lines of code. The psychological effect of a physical bell ringing is completely different from a notification. It's *real*.

**Status:** ⏸ Parked. Revenue infrastructure comes first. Revisit when first paying enrollment exists. $25 Arduino, one afternoon.

---

**SEED 38 — ORACLE: "What Should I Work On Right Now?"**
*Source: Dream Floor, March 17, 2026. 47 repos, one brain, one question.*

Scott has 47 repos, a contract ending May 24, a revenue deadline of August 2026, and a copilot-instructions.md that contains the full state of every project and every dependency.

ORACLE is a personal tool — not a product — that answers exactly one question: **"Given everything, what should I be doing right now?"**

Input: copilot-instructions.md + dreamer.md + today's date + Scott's answer to "what have I done today?"
Output: Three specific next actions, ranked by revenue impact × deadline proximity × build time.

**Model:** OpenRouter API — routes to `nous-hermes2:34b` or `mistral-large` hosted at full speed. Local Ollama runs the same models but 5+ minutes per response makes it impractical. OpenRouter key already exists in `C:\Users\Valued Customer\OneDrive\Desktop\writer\.env`.

**What to build:** A Python script. 50 lines. Reads the two files, calls OpenRouter API (`https://openrouter.ai/api/v1/chat/completions`, OpenAI-compatible), prints three ranked next actions. Can be wired into VIGIL as a "morning brief" button.

**Status:** Seed. OpenRouter key in hand. This is a Tuesday afternoon.

---

**SEED 39 — MOMENTUM: Where Does Your Time Actually Go?**
*Source: Dream Floor, March 17, 2026. The autoresearch loop applied to Scott himself.*

Scott believes he works on ClassCiv most. The data probably says Chapterhouse. Or the worksheet generator. Or none of them regularly.

MOMENTUM is a VS Code extension that logs active file focus time per project (not just open tabs — actual focused editing time) to a SQLite file. Every 30 days, VIGIL shows Scott a simple bar chart: here's where your hours actually went.

The autoresearch loop applied to himself: **the metric is focus time, the script produces it on demand, the agent (Scott) has a goal to realign.**

**What gets measured:** Active VS Code focus time per workspace/project. Idle time excluded. Copilot wait time flagged separately (time where AI was running, not Scott).

**The insight this generates:** When SomersSchool is supposed to be the revenue priority but the data shows Scott spent 80% on ClassCiv — that's a conversation to have with himself. VIGIL shows it. Earl says something dry.

**Status:** Seed. Buildable as a VIGIL Phase 2 feature. One additional VS Code extension event hook.

---

**SEED 41 — Claude-mem Pattern for VIGIL**
*Source: GitHub Trending, March 17, 2026. `thedotmack/claude-mem` — 1,153 stars today, 37K total.*

`claude-mem` is a Claude Code plugin that automatically captures everything Claude does in a session, compresses it with AI, and injects relevant context into future sessions. It's a memory system for Claude Code. It got 37K stars.

The VIGIL connection: VIGIL externalizes real-time cognitive state (what's happening now). `claude-mem` externalizes session history (what happened before). Together they'd be complete coverage — presence + memory.

**The question:** Does `claude-mem` work with VS Code Copilot, or is it Claude Code terminal only? If terminal only, the pattern is still correct — when Scott runs Claude Code in any project, it should use the project's CLAUDE.md as the seed file that `claude-mem` builds on.

**What VIGIL + claude-mem would be:**
- VIGIL → "Here's what's happening right now in your VS Code session"
- claude-mem → "Here's what you worked on in your last 5 Claude Code sessions"
- Together: Temporal + Situational awareness. The extended mind at full coverage.

**Build path:** First install `claude-mem` and run it in Chapterhouse for one week. Measure whether session startup is faster / context is more accurate. If yes: document the pattern and design the VIGIL Phase 2 that auto-exports session summaries to a shared context store.

**Status:** Seed. Investigate this week. Install claude-mem in Chapterhouse first.

---

**SEED 40 — THE BENCH: Race Models Side-by-Side**
*Source: Hardware audit, March 17, 2026.*

Scott uses OpenRouter for practical LLM work (local Ollama models are too slow — 5+ min per response). OpenRouter gives access to 300+ hosted models on a single API key. The question is: which model is actually best for which task? Nobody knows without testing. He defaults to whatever he tried first.

THE BENCH is a single-page app. Type a prompt once. Select 3–5 models from a dropdown (all via OpenRouter). Results stream in parallel columns. One-click rating. Over time: "for Gimli scripts, claude-3-haiku wins. For curriculum writing, mistral-large wins. For quick answers, llama-3-8b is fast enough and cheap."

**What to build:** Single HTML file (Scott's signature move). OpenRouter API is OpenAI-compatible — same `fetch` call, different base URL. Parallel requests. Side-by-side columns. One afternoon.

**The taste profile payoff:** After 20+ prompts rated, a score table shows which models consistently produce better outputs for Scott's specific use cases — and at what cost per call. Autoresearch loop applied to model selection.

**Status:** Seed. OpenRouter key in hand. Sunday fun build.

---

**SEED 42 — AI Video Creation Toolkit: Gimli Comes Alive**
*Source: Dream Floor planning session, March 18, 2026.*

AI video tools have crossed the threshold where a classroom teacher can produce professional-looking instructional content without a crew. The seven-layer learning arc maps directly onto Scott's product stack — and the most valuable piece is Gimli on screen.

**Tools in priority order for Scott:**

| Priority | Tool | Why | Status |
|----------|------|-----|--------|
| 1 | **HeyGen or Synthesia** | Gimli avatar presenter for SomersSchool K-5 lessons | Not yet |
| 2 | **ElevenLabs deeper** | Already have API — build Gimli voice profile, badge sounds, lesson stings | API in stack |
| 3 | **Veo 3 (Google)** | NCHO marketing videos, curriculum preview clips, background footage | Not yet |
| 4 | **Copyright framework** | Needed before any commercial use of AI-generated content | Pending |
| 5 | **Descript or CapCut AI** | Video polish, captions, editing automation | Not yet |
| 6 | **Platform-specific formats** | NCHO social, SomersSchool promos, shorts vs. long-form | Pending |
| 7 | **Multi-tool pipelines** | Chapterhouse automation — script → voice → avatar → edit → publish | Future |

**The Gimli payoff:** HeyGen API + FLUX.1-Kontext character reference (Azure Foundry) + ElevenLabs Gimli voice clone = a fully AI-generated K-5 host who appears on screen, speaks in character, and runs entirely through API calls. Every SomersSchool lesson gets a face. This is content moat.

**The ElevenLabs upgrade:** Scott already has an ElevenLabs API key and has used Rachel for the PW podcast. The next step is a dedicated Gimli voice clone — consistent across all K-5 lesson narration, badge unlock audio, and welcome messages.

**The commercial rule:** Do not publish AI-generated video content commercially until the copyright/licensing day is complete (Day 7 of the study arc). Veo 3 and HeyGen have different commercial terms — read both before shipping anything.

**Full study plan:** `intel/2026-03-18/ai-video-course-plan.md`

**Status:** Seed. Begin with HeyGen free tier. Gimli voice profile is the first build target.

---

**SEED 43 — Chapterhouse as A2A Node: The SomersVerse Interconnect**
*Source: Google Developer's Guide to AI Agent Protocols, March 18, 2026.*

Google's Agent2Agent (A2A) protocol establishes how agents discover each other: every agent publishes `/.well-known/agent-card.json` declaring its name, capabilities, and endpoint. Any other agent can discover it and call it — no custom integration code required, no re-deployment when the remote agent changes.

**The idea:** Expose a `/.well-known/agent-card.json` route from the Chapterhouse Next.js app. The card declares: brief generation, research synthesis, Council of the Unserious analysis, collision detection. SomersSchool's teacher research tools and BibleSaaS can then route queries to Chapterhouse agents without Scott writing custom fetch logic for each connection. This is the SomersVerse plug-in architecture — Chapterhouse stops being a standalone app and becomes the intelligence hub of a federated product network.

**The student safety application:** The `student-safe-completion.ts` pipe itself could be exposed as an A2A agent. SomersSchool routes all student AI calls through it. Observable, governable, hot-swappable without touching SomersSchool code.

**AG-UI alignment:** A2A's streaming pattern maps to AG-UI. The Chapterhouse spec already locked typed SSE events (`{ type: "council_turn", persona: "Gandalf" }`). Before implementing Phase 2 streaming: check Chapterhouse event type names against AG-UI standard names. Using the open standard means any AG-UI-compatible frontend can render Chapterhouse outputs without custom parsing code.

**Build path:** Phase 0 creates `CLAUDE.md`. Phase 1 wires context. Then: 1 route file (`src/app/.well-known/agent-card.json/route.ts`), 1 JSON object declaring capabilities. That's the entire A2A surface. The full federation (SomersSchool → Chapterhouse queries via A2A) is a future phase.

**Status:** Architecture seed. Add `agent-card.json` placeholder route to the Chapterhouse Phase 6–7 backlog.

---

**SEED 44 — UCP: Make NCHO Products AI-Agent-Purchasable**
*Source: Google Developer's Guide to AI Agent Protocols, March 18, 2026.*

Google's Universal Commerce Protocol (UCP) standardizes the shopping lifecycle for AI agents: discover a store's catalog at `/.well-known/ucp`, build a typed checkout request, complete payment — via REST, MCP, or A2A. AI shopping agents (Google Shopping, Klarna, OpenAI Operator) that support UCP can transact with any UCP-compliant store.

**The idea:** NCHO's Shopify store currently sells to human browsers. When AI agents start routing purchase decisions for homeschool families — and they will — NCHO needs to be discoverable and transactable by those agents. A UCP adapter on top of the existing Shopify API exposes NCHO's products in the format AI shopping agents read. Anna's curated homeschool curriculum becomes *eligible* for AI agent purchase recommendations. This is not hypothetical: Google's ADK tutorial already demonstrates a Kitchen Manager agent completing wholesale purchases via UCP.

**Connection to existing seeds:** SEED 31 (Trust-Optimized Product Pages for AI Agent Eligibility) made NCHO pages *findable* by agents. UCP makes them *purchasable*. Same architecture, next layer.

**AP2 extension:** Google's Agent Payments Protocol (AP2) adds typed payment mandates with guardrails and a full audit trail. When AP2 stabilizes (currently v0.1), UCP stores that also speak AP2 become the safest commercial endpoint for high-trust agent transactions. NCHO + UCP + AP2 = an AI-native store that parents and agents both trust.

**Build path:** ncho-tools → add `/api/ucp/.well-known` route that returns UCP profile JSON from Shopify's product catalog. The Shopify API key is already in the stack. No new dependencies.

**When:** Not before the NCHO storefront launches. But design the ncho-tools product page endpoint with UCP in mind — one route, no rework later.

**Status:** Seed. File in ncho-tools backlog after storefront launches.

---

**SEED 45 — Filesystem-First Knowledge Architecture**
*Source: Vercel "Build Knowledge Agents Without Embeddings," March 19, 2026.*

Vercel replaced vector DB + embeddings with filesystem + bash for their knowledge agents. The agent uses `grep`, `find`, `cat` inside isolated sandboxes. Their sales call summarization agent went from ~$1.00 to ~$0.25 per call with *better* output quality. The key insight: LLMs already understand filesystems — navigating directories, grepping files — trained on massive codebases. You're not teaching a new skill; you're using the one it's best at.

**The debugging advantage kills it:** With vectors, if the agent returns bad info, you have to figure out which chunk scored 0.82 vs the correct one at 0.79. Could be chunking boundary, embedding model, or similarity threshold. With filesystem, you see: it ran `grep -r "pricing" docs/`, read `docs/plans/enterprise.md`, pulled the wrong section. Fix the file or the search strategy. Minutes, not hours.

**Why this validates our architecture:** Chapterhouse already uses `context_files` table → `buildLiveContext()` → system prompt. That's filesystem-first thinking with database persistence. The Vercel pattern confirms this is the right call for structured knowledge bases (briefs, context docs, lesson content). Reserve vector search for genuine semantic similarity — BibleSaaS cross-reference discovery, maybe SomersSchool "find related lessons" features.

**Smart complexity router pattern:** Vercel's template classifies every incoming question by complexity and routes to the right model automatically. This is our Opus/Sonnet/Haiku calibration, formalized as infrastructure. Worth building as a shared utility across all AI-calling apps.

**Connection to existing seeds:** Reinforces Chapterhouse context architecture (Phase 1–2). Challenges the Upstash Vector + Pinecone default for cases where documents are structured.

**Build path:** Evaluate. For each knowledge retrieval use case, ask: is this semantic similarity (→ vectors) or document lookup (→ filesystem)? Most of our use cases are document lookup.

**Status:** Architecture insight. Apply to Chapterhouse Phase 1 context design and SomersSchool lesson search.

---

**SEED 46 — Spline 3D for Education Visuals**
*Source: spline.design, evaluated March 21, 2026.*

Spline is a browser-based 3D design tool (Y Combinator backed) with AI 3D generation, style transfer, physics simulation, and a component system. The killer feature: embed interactive 3D scenes in any web app via `@splinetool/runtime` npm package. No Babylon.js code needed for educational visualizations.

**The idea:** SomersSchool science lessons get interactive 3D models — cell diagrams students can rotate, solar system simulations, geological cross-sections — built in Spline's visual editor and embedded with one npm package. This is the "clickable SVG anatomy diagram" pattern (SEED 09) elevated to full 3D.

**What it replaces:** Custom Babylon.js work for non-game educational visuals. Spline handles the visualization; Babylon.js stays for the roleplaying game engine where physics simulation matters.

**Gimli 3D possibility:** AI 3D generation could create a 3D Gimli mascot for interactive lesson intros. Lower effort than commissioning custom 3D work.

**What it doesn't replace:** Babylon.js + Ammo.js for the roleplaying repo's game physics. Different tools for different layers.

**Build path:** Free tier test first. Create one 3D cell diagram, embed it in a Next.js page, verify it loads fast and is mobile-friendly. If it works, add to the SomersSchool lesson asset toolkit alongside Doodly/ToonBee.

**Status:** 🟡 Evaluate. Free tier test needed.

---

**SEED 47 — Groundedness-as-a-Service for Chapterhouse**
*Source: Azure Content Safety, March 21, 2026 Azure brainstorm — D7.*

Wire Azure Content Safety Groundedness Detection to every factual block in Council briefs. Auto-flag ⚠️ on any claim without a traceable source URL. Scale it: every Chapterhouse brief gets a "grounding score" — a percentage of claims that are sourced. Make it a dashboard metric.

**The autoresearch loop application:** "Get the Chapterhouse brief grounding score above 90%." Agent generates brief → Groundedness scores it → agent revises ungrounded claims → agent re-checks. Automated anti-hallucination loop with a number.

**What it enforces:** The methodology already requires traceable claims. This is the automated enforcement at runtime — not a style guide, an API call.

**Status:** 🔴 Wire in Chapterhouse Phase 2.

---

**SEED 47 — Project Nomad / Offline-First AI Knowledge Delivery**
*Source: GitHub Trending TypeScript #1 + HN front page #2, March 22, 2026. Repo: Crosstalk-Solutions/project-nomad. 8,519 stars total, 2,294 today. Built by @claude contributor.*

Project Nomad is a self-contained offline "survival computer with AI" — a TypeScript application that packs critical tools, knowledge bases, and an AI assistant into a single deployable unit that runs without internet access. 

**The Scott application:** SomersSchool students in Glennallen run satellite internet. It's not reliable. Lesson videos buffer. Pages fail to load. A student doing Scott's math course at 10pm during a storm can't do their lesson if the API call to Claude fails.

**The seed:** Build a "SomersSchool Offline Pack" using Project Nomad's pattern — a self-contained unit that includes:
- The lesson content (text, images, embedded exercises) as static assets
- A small local LLM (via Ollama or a quantized model) for the AI tutor function
- `lesson_progress` writes locally, syncs to Supabase when connection resumes

This isn't just an Alaska feature — it's a rural/mobile/international feature. Every homeschool student who does their work in the car, on the farm, or in places without broadband wins.

**What makes this timely:** Project Nomad hit #1 GitHub TypeScript and HN #2 on the same day. The offline-first pattern is having a moment. The tools to implement it (Ollama, service workers, IndexedDB, Supabase offline sync) all exist.

**Connection to existing seeds:** Reinforces SEED 21 (autoresearch loop — offline lesson quality meter needs local instrumentation). Relevant to SomersSchool's Alaska allotment pitch (rural students are specifically the target market).

**Build path:** Explore Project Nomad repo architecture first. Then prototype: one lesson (Balancing a Checkbook) as an offline-capable Progressive Web App with local storage and background sync. If it works at lesson scale, design as a platform feature.

**Status:** 🟡 Explore. Read Nomad repo architecture. Map to SomersSchool lesson structure.

---

**SEED 48 — Remotion / Programmatic Lesson Video with React**
*Source: GitHub Trending TypeScript (133 today, 40,388 total). Repo: remotion-dev/remotion. March 22, 2026.*

Remotion lets you build videos using React components. You write JSX, it renders to MP4. Animations are CSS/JS. Text is React. Timelines are code. The entire video is version-controlled.

**The Scott application:** Every SomersSchool lesson starts with a short intro video (HeyGen avatar) and uses slide images (Leonardo.ai). The current production pipeline has manual steps (HeyGen dashboard, Flixier assembly). Remotion would let the lesson video GENERATE from the lesson data:

```tsx
// Lesson video builds from lesson content directly
<LessonVideo 
  title="Balancing a Checkbook" 
  avatar={scottAvatarUrl}
  slides={lesson.slides} 
  narration={lesson.narrationScript} 
/>
```

**What it replaces:** Flixier (manual assembly), slide animation timing (code-driven), the hand-build step in lesson production.

**What it doesn't replace:** HeyGen (Scott's actual digital avatar generation — Remotion can consume the HeyGen output as a video clip). ElevenLabs TTS (narration still comes from ElevenLabs; Remotion syncs it to visuals). The Descript editing step for raw recording.

**Revenue path:** If lesson video production becomes code-driven, Scott can generate 52 course intro videos programmatically. The pipeline cost per lesson drops toward zero. Turn-around goes from hours to minutes.

**Connection to existing SEEDs:** Connects to SEED 42 (AI video creation toolkit), the production tab (Chapterhouse Phase 2 UI), and the `SLIDE_IMAGE_PROVIDER` pluggable architecture already built into SomersSchool.

**Build path:** Install Remotion. Build one lesson intro video as React. Compare to Flixier production time. If it wins on speed AND quality, start migrating lesson production pipeline.

**Status:** 🟡 Evaluate. Free tier. Build one lesson intro as proof of concept.

---
*Source: Azure AI Services, March 21, 2026 Azure brainstorm — D14.*

Immersive Reader is FREE at any scale and takes 30 minutes to wire into any web app. It does what ElevenLabs TTS cannot: highlights each word as it's spoken, breaks words into syllables, shows parts-of-speech color coding, renders a picture dictionary (image appears next to tapped word), supports OpenDyslexic font, supports single-line focus mode for attention issues, and inline translates any word in 60+ languages.

**The marketing distinction:** ElevenLabs plays pre-recorded audio. Immersive Reader reads ANY text dynamically — lesson text, quiz questions, instructions, tooltips. A child who can't read yet can tap any word anywhere in the app.

**Marketing line:** "Every lesson adapts to how your child reads." Defensible, true, and rare — most homeschool platforms can't say it.

**The bonus sentence:** "Our lessons use the same reading technology as Microsoft Word and OneNote." True. That sentence builds trust with the parent who lives in Office.

**Status:** 🔴 Ship next sprint. 30-minute build.

---

**SEED 49 — Mistral Document AI for Curriculum PDF Intake**
*Source: Azure Foundry catalog, March 21, 2026 Azure brainstorm.*

`mistral-document-ai-2512` is in the Azure Foundry catalog — no new billing relationship, same Azure account. Mistral built this model specifically for document processing: structured extraction from PDFs, layout understanding, table parsing, handwriting recognition.

**The test:** Run an Alana Terry novel chapter, a standard curriculum PDF, and a state standards document through both Mistral Document AI and Azure Content Understanding (D2). Compare: extraction quality, cost per page, speed. Same Azure billing either way — no risk to test.

**If it wins:** Mistral Document AI becomes the primary intake layer for Chapterhouse curriculum research pipeline. Textbook pages → structured lesson outlines in one pass.

**Status:** 🟡 Evaluate. Free test in Foundry playground.

---

### 🚀 MOONSHOT DREAMS
*These take months. But the payoff is a different life.*

**MOON-01 — The Platform (Your Stated Endgame)**
You've already named it. The Platform = personalized AI curriculum SaaS. But here's the thing: you've already built 80% of it, scattered across 47 repos. The Platform isn't a new thing to build. It's the name you put on what you've already built when you connect the pieces.
- ClassCiv = the engagement layer
- BibleSaaS's SM-2 = the retention layer
- Worksheet generators = the content layer
- DeepResearcher = the curriculum research layer
- Chapterhouse = the teacher ops layer
- The novel tools = the creative writing layer
- The Platform = all of it under one roof, with one login, one Stripe subscription

When you're ready to name it and unify it, nothing new needs to be built. Just stitched.

**MOON-02 — Acquisition Target: Logos Bible Software**
Logos has 4 million users, aging product design, and no meaningful AI personalization. BibleSaaS has living portrait, SM-2, TSK graph, commentary synthesis, and a privacy-first architecture. You are 18 months ahead of whatever they're building internally. A cold email to their CPO isn't crazy. It's just a Monday.

**MOON-03 — The Classroom Game Engine as API**
ClassCiv's real-time multiplayer epoch state machine is a hard engineering problem you've already solved. Package it as a managed service: `game.theaccidentalteacher.com/api`. Other edtech developers consume your engine. You charge $49/mo per game instance. The teacher-facing UI is free; the engine is the moat.

**MOON-04 — The Alaska Education Innovation Lab**
You're at a Title 1 school in Alaska. After May 24th, you're free. A nonprofit "Education Innovation Lab" based in Glennallen — where you test AI-native curriculum tools with real rural Alaskan students — is:
- A story no one else can tell
- A grant magnet (federal, state, corporate)
- The most defensible moat possible
- A path to "Scott Somers, educational technology advocate" appearing before the Alaska state legislature within 2 years

**MOON-05 — The Vibe Coding Book**
Working title: *"Vibe Teaching: How an Alaskan Schoolteacher Built 47 Apps Without Ever Learning to Code"*
Anna is a bestselling author. She knows agents. She knows the structure. Your story writes itself. The book would be a calling card, a speaking platform, and a marketing channel for every other product simultaneously.

---

## 🌀 Cross-Repo Collision Map
*Which repos share DNA and could be fused*

```
BibleSaaS (SM-2, living portrait) ——— ClassCiv (game loop, real-time)
    |                                       |
    ├── Could share: reward engine          ├── Could share: simulation engine
    |                                       |
    └── Hypomnemata (persona debates) ──────┘
              |
              ├── DeepResearcher (academic sources)
              |         |
              └── Chapterhouse (ops brain, ingestion)
                        |
                        ├── Novel tools (Anna's creative layer)
                        |         |
                        └── Alanas-Novel-Assistant (personal)
                                  |
                        AI RPG (ElevenLabs, DALL-E, dice physics)
                                  |
                        ClassCiv (same game engine family)
                                  |
                        Simulation-Factory ─── Social Studies Workbooks
```

---

## 📊 The Dreamer's Inventory Metrics
*Tracked as of March 19, 2026*

| Metric | Count |
|---|---|
| Total repos | 47 |
| Active (touched this week) 🔴 | 3 |
| Warm (touched this month) 🟡 | 9 |
| Cool (1–3 months ago) 🔵 | 5 |
| Cold (>3 months) ⚫ | 30 |
| TypeScript repos | 21 |
| JavaScript repos | 15 |
| HTML repos | 5 |
| Python repos | 1 |
| Languages unknown | 5 |
| Marketplaces with live deployments (confirmed) | 9 |
| Repos one phase from launch | 1 (BibleSaaS) |
| Repos with commercial potential | ~18 |
| Repos with grant potential | ~4 |
| Collision dream pairs identified | 5 |
| Seed ideas in queue | 48 |
| Quick wins buildable this week | 5 |
| Moonshots | 5 |

---

## 🗓 Dream Log
*Running history of ideas, decisions, and graduations*

| Date | Event |
|---|---|
| Mar 8, 2026 | Dreamer file created; 47 repos synced; 5 collisions + 10 seeds + 5 moonshots populated |
| Mar 13, 2026 | Intel sweep: 5 new seeds added (11–15). Claude 1M context GA + architectural implications logged. PRH Grace Corner = positioning fuel. RevenueCat churn data → visible progress design brief. "Bushwhacking with a lightsaber" testimonial format. Autoresearch pattern from Shopify CEO. Vibe coding as a service concept. All SomersSchool misspellings fixed across files. "Child not student" language rule locked in. |
| Mar 14, 2026 | Afternoon intel sweep: 4 new seeds added (18–21). "Restoring wonder" language surfaced from EdSurge — potential NCHO/SomersSchool 3rd brand layer + Gimli wonder beat. Screen-time-with-intention SomersSchool positioning (response to screen-free school legislation). "Convicted not curious" NCHO distinction vs S&S/PRH secular publisher religion lists. Autoresearch loop for lesson quality logged as Month 3–6 move post-launch. Afternoon briefing written to intel-2026-03-14-afternoon.md. |
| Mar 16, 2026 | PW podcast pipeline fully operational (Session 11). Three PW issues extracted. First episode generated: Rachel voice, ~5–6 min. Anna/Alana Terry catalog documented. christianbooks.today identified. Brand wall locked. |
| Mar 17, 2026 | **NCHO Shopify store API connected.** Yellow CoPilot custom app created via Dev Dashboard → installed via client credentials grant. Full store audit completed: 108 products, 33 collections, 49 tags, 5 themes (242 assets), 4 pages, 3 menus, 2 shipping zones, 1 discount. Key findings: ALL 108 products missing SEO metadata (critical), 5 placeholder products (vendor="Author Name"), policies mostly empty. Audit script (`shopify_audit.py`) and dump (`ncho_store_audit.json`, 708KB) saved. CSV enrichment pipeline concept designed for bulk book imports with auto-tagging. Yellow CoPilot app credentials: Client ID `8f84e5c69f9313b01da58f18164d4047`, uses 24hr client_credentials grant tokens. |
| Mar 19, 2026 (Evening) | **Intel sweep — 4 of 5 sources assimilated (Forbes 403).** Boris Cherny (Claude Code creator) runs 10–15 parallel sessions — phone start, system notifications, Plan Mode first (Shift+Tab twice). Validates VIGIL entirely. Model calibration: Opus over Sonnet for serious work. `/init` generates starter CLAUDE.md — run in all hot repos. `.mcp.json` checked into repo = team standard. Google published 6 agent protocols: A2A (agent discovery via `/.well-known/agent-card.json`), UCP (AI-purchasable commerce), AP2 (payment mandates), AG-UI (typed SSE streaming — **matches Chapterhouse Phase 2 spec exactly — align event type names before build**), A2UI, MCP. Two new seeds: SEED 43 (Chapterhouse as A2A node — SomersVerse interconnect architecture), SEED 44 (UCP for NCHO — AI-agent-purchasable curriculum). GitHub Copilot coding agent now runs CodeQL + secret scanning for **free** — enable on all hot repos (Settings → Copilot → Coding agent). Windows 365 for Agents + Agent 365 GA May 1 — enterprise AI governance arrives same month Scott's contract ends. Filed: `intel/2026-03-19/intel-2026-03-19.md`. |
| Mar 19, 2026 | **Session 17 — Chapterhouse full brainstorm + implementation spec.** 92-question Q&A brainstorm interview completed (`intel/2026-03-18/chapterhouse-brainstorm-interview.md`). Full 8-phase implementation spec written (~2,000 lines, `intel/2026-03-18/chapterhouse-implementation-spec.md`). Key decisions locked: Curriculum Factory migrated to SomersSchool (legacy — do not build on). Multi-tenant from day one (user_id + RLS all tables). Calvin & Hobbes as default Chapterhouse companion personas (Chapterhouse persona DB only, not in copilot-instructions.md). Context stored in Supabase `context_files` table rather than markdown. Spec ready for code bot — execute Phase 0 next. 5 clarifying questions answered re: spec and execution. |
| Mar 22, 2026 | **Intel sweep — full cycle.** Batch A (TechCrunch, HN, Simon Willison, EdSurge), Batch B (partial), Batch C (Awesome Copilot /agents/, /hooks/, /workflows/ — hooks category discovered for first time, 6 hooks rated), Batch D (GitHub TS trending, Reddit r/homeschool). Key signals: Trump AI child safety framework → SomersSchool "parent-first architecture" positioning opportunity. EdSurge "Restoring Wonder" confirmed third brand layer (independent convergence from Mar 13). Project Nomad hit #1 GH TS + HN #2 simultaneously (8,519 stars, 2,294 today, built by @claude). Remotion 133 today, 40,388 total — video-as-code with React. Gem Suite (8-agent team) appeared 1 hour before sweep — full orchestrated team now available natively in VS Code. Tool Guardian hook blocks destructive ops before Copilot executes. NC parent fleeing online public school (kids "hate school now") = strongest conversion narrative in Reddit this week. Filed: `intel/2026-03-22/intel-2026-03-22.md`. Two new seeds: SEED 47 (Project Nomad / Offline-First), SEED 48 (Remotion / Video-as-Code). |
| Mar 21, 2026 | **Intel sweep — 4 sources.** Anthropic webinar "Claude Code Advanced Patterns" announced March 24 (subagents, hooks, MCP, monorepo CLAUDE.md, CI pipelines) — register. Vercel open-sourced Knowledge Agent Template: filesystem + bash replaces vector DB + embeddings, 75% cost reduction, transparent debugging. Validates Chapterhouse context architecture. GitHub Copilot coding agent shipped 10 improvements in 4 days (Mar 17–20): Raycast live logs, commit→session tracing, 50% faster start, validation tools config, GPT-5.4 mini GA, GPT-5.3-Codex LTS, semantic code search. Spline 3D evaluated: browser-based 3D design with `@splinetool/runtime` npm embed — potential SomersSchool interactive lesson visuals. Two new seeds: SEED 45 (Filesystem-First Knowledge Architecture), SEED 46 (Spline 3D for Education Visuals). Filed: `intel/2026-03-21/intel-2026-03-21.md`. Also: **Production Tab Overhaul brainstorm brief written** — full 6-studio pipeline spec (Content/Creative/Voice/Review Queue/Tasks/Documents), integrated automated loop (Trigger→Content→Creative→Review Queue→Tasks→Buffer→analytics), image waterfall locked, `BUFFER_ACCESS_TOKEN` missing + Migration 012 identified as blocking. Filed: `intel/2026-03-21/production-tab-overhaul-brainstorm.md`. |
| Mar 18, 2026 (Afternoon) | **Session 16 — 5-item Awesome Copilot plan completed.** (1) obra/superpowers: deep read done, adoption plan written, pinned for Chapterhouse + SomersSchool + BibleSaaS — Claude Code only, not VS Code Copilot. (2) claude-hud: N/A, CLI only. (3) secrets-scanner + GHAS Pack: deferred, skipped. (4) claude-code-ultimate-guide: scanned, 95% CLI, extracted auto-compact threshold tip. (5) Awesome Copilot table fully scored — Learning Hub bookmark saved (`awesome-copilot.github.com`), llms.txt URL confirmed. New SEED 42: AI Video Creation Toolkit — Gimli avatar (HeyGen/Synthesia), ElevenLabs Gimli voice, Veo 3, copyright framework. AI video course plan created: `intel/2026-03-18/ai-video-course-plan.md`. Sync line updated to Session 16, 42 seeds. |
| Mar 17, 2026 (Evening) | **Full intel sweep completed.** 10+ sources: TechCrunch, Hacker News, Simon Willison, EdWeek, EdSurge, Getting Smart. Key signals: (1) "Restoring wonder" in education trending independent across multiple sources + validated SEED 28 third brand layer. (2) Screen-free legislation rising—NCHO positioned perfectly. (3) School choice expanding nationally (EdWeek Market Brief)—challenges NCHO positioning, forces "teacher-curated" differentiation. (4) AI in K-12 now mandatory baseline—SomersSchool's "co-viewing" model differentiates. (5) AI models consolidating (Mistral Small 4) but Claude/GPT still differentiated on reliability. (6) Vibe coding validated mainstream (NYT Magazine), creating credibility moat for Scott's founder story. (7) PRH "Grace Corner" now live—not future threat, current threat. (8) Tyndale House leadership crisis (2 execs departing, 1-month gap)—validates indie author timing. (9) Personalized learning credentialing trending (LERs)—SomersSchool's portfolio export becomes feature. (10) HN signals: small web/indie/teacher-built beating corporate alternatives. Two new SEEDs added (32–33): "Real Teacher" opens gates against tier-one players, VCs funding wonder-in-education category (SomersSchool/NCHO positioning alignment). Full briefing: `intel/2026-03-17/intel-2026-03-17-sweep.md`. |

---

## 📬 How to Use This With Me

Just talk. Say things like:
- *"I just shipped X — update the registry"*
- *"I'm thinking about building Y — is there anything in my repos that helps?"*
- *"What's the weirdest thing I could build this weekend?"*
- *"Give me 3 dreams based on what's changed since last time"*
- *"I got a grant opportunity — what qualifies?"*
- *"Anna wants to launch something for her audience — match her to my repos"*

I'll update this file, move things around, retire dead ideas, and generate new ones based on everything I know about you.

That's what Dreamers do.
