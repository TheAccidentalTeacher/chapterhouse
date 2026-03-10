# Next Chapter Homeschool Outpost — Brand Operating System

> *This is the master operating document. Not the soul of the brand — that's deeper than a checklist — but the system that keeps the soul from getting lost once real work, real deadlines, real products, real marketing, and real money enter the chat. This is where the whole thing becomes usable.*
>
> *— The Brand Whisperer*

---

## What This Document Is

This is the **central operating system** for Next Chapter Homeschool Outpost and the connected brands around it.

It turns the existing document stack into a working machine for:
- brand decisions
- product decisions
- content decisions
- marketing decisions
- research intake
- tool building
- launch execution
- long-term platform thinking

If [README.md](README.md) is the map, this is the **operating center**.

---

## The Mission in One Sentence

Build the most trusted, joyful, intelligent homeschool storefront and resource ecosystem in the market — one that helps families buy better, teach better, and feel less alone doing it.

---

## The Brand Stack

### 1. Next Chapter Homeschool Outpost
The storefront. The front door. The thing customers see first.

### 2. SomerSchool
The curriculum engine. Scott as teacher-builder at full strength.

### 3. Mt. Drum Homeschool Outpost
The local expression. The in-person trust layer.

### 4. The Platform
The long game. Personalized curriculum, tools, systems, and software.

**Rule:** Every new idea must declare which layer it belongs to. If it belongs to all of them, it probably belongs to none of them yet.

---

## The Core Documents and What They Control

| Document | What It Governs |
|---------|------------------|
| [persona.md](persona.md) | Strategic voice, founder truth, brand core, positioning logic |
| [biography.md](biography.md) | Scott's story, founder narrative, emotional credibility |
| [brand-personality-handoff.md](brand-personality-handoff.md) | Tone, copy voice, customer-facing writing rules |
| [shopify-strategy.md](shopify-strategy.md) | Store architecture, tools, technical build plan |
| [business-name-research.md](business-name-research.md) | Past naming research and naming logic |
| [business-name-availability-report.md](business-name-availability-report.md) | Final naming conflict analysis |
| [brainstorm.md](brainstorm.md) | Raw strategic questions and early framing |
| [dinner-questions.md](dinner-questions.md) | Decision-forcing alignment questions |
| [edgy-names.md](edgy-names.md) | Brand personality edge exploration |
| [ai-operating-principles.md](ai-operating-principles.md) | Rules for using AI without becoming idiots at scale |
| [external-intelligence-log.md](external-intelligence-log.md) | Intake log for outside ideas, tools, and platform advice |
| [chapterhouse-knowledge-base-blueprint.md](chapterhouse-knowledge-base-blueprint.md) | High-level blueprint for Chapterhouse and the living knowledge base |
| [chapterhouse-product-spec.md](chapterhouse-product-spec.md) | Product definition for Chapterhouse |
| [chapterhouse-data-model-spec.md](chapterhouse-data-model-spec.md) | Core schema and memory structure for Chapterhouse |
| [chapterhouse-workflow-spec.md](chapterhouse-workflow-spec.md) | Operational loops for Chapterhouse briefs, research, opportunities, review, content, and tasks |
| [chapterhouse-ui-spec.md](chapterhouse-ui-spec.md) | Screen-by-screen UI structure for Chapterhouse |
| [chapterhouse-technical-architecture-spec.md](chapterhouse-technical-architecture-spec.md) | Hosting stack, service boundaries, flows, and deployment logic |
| [chapterhouse-intelligence-engine-spec.md](chapterhouse-intelligence-engine-spec.md) | Prompting, retrieval, scoring, and ingestion behavior |
| [README.md](README.md) | Project index, decision log, open questions |

---

## Two Active Build Tracks

### Track A — Storefront and Revenue Engine
This includes the Shopify store, product catalog, curriculum guide business model, launch planning, and commerce execution.

Primary source docs:
- [shopify-strategy.md](shopify-strategy.md)
- [README.md](README.md)
- [dinner-questions.md](dinner-questions.md)

### Track B — Chapterhouse
This includes Chapterhouse, the internal AI system for Scott and Anna: document memory, research intelligence, market tracking, opportunity scoring, content planning, review workflows, and task conversion.

**Chapterhouse is live at: https://chapterhouse.vercel.app**

**Status: ALL 9 SCREENS WORKING as of March 10, 2026.**

| Screen | What it does |
|--------|-------------|
| Chat (Home) | Multi-model AI chat (GPT-5.4, Claude Opus/Sonnet 4.6). Persistent threads. Auto-learns from every conversation. Founder memory + brief + research injected into context. |
| Daily Brief | Real RSS (9 feeds) + GitHub API (11 repos) → Claude Sonnet 4.6 → structured brief. Convert to task + Send to review on every item. Vercel Cron at 7am AKST. |
| Research | URL fetch + GPT-5.4 analysis, paste text, quick note, screenshot/Vision. Manual fallback. |
| Product Intelligence | GPT-5.4 opportunity scoring (Store/Curriculum/Content, A+ to C). Category filter. |
| Content Studio | 3 modes via Claude: Newsletter/Campaign, Curriculum Guide, Product Description. |
| Review Queue | Dual-feed: research items + opportunities. Approve/reject. Convert → task. |
| Tasks | Full CRUD. Status: open → in-progress → blocked → done → canceled. Source linking. |
| Documents | Server-rendered. Reads all .md from repo root. Search/filter. |
| Settings | Env status checker. Founder Memory CRUD + auto-extraction from chat. |

**Auth:** Supabase email/password. Middleware enforces `ALLOWED_EMAILS` allowlist (scott@somers.com, anna@somers.com). Login page with redirect. **Action needed:** set `ALLOWED_EMAILS` env var in Vercel production.

**Daily Brief pipeline:** RSS feeds (3/9 working, 6 blocked server-side — not a code bug). GitHub API (11/11 repos checked). First real brief generated March 10. Vercel Cron registered. `GITHUB_TOKEN`, `CRON_SECRET`, `NEXT_PUBLIC_APP_URL` all set in Vercel.

**Known issues:**
- `ALLOWED_EMAILS` not set in Vercel (P0 — auth gate is open in production)
- `/api/debug` returns API key prefixes without auth (P1)
- 6/9 RSS feeds fail server-side (P2 — feed-side, not code)
- No SSRF protection on research URL fetch (P3)

Primary source docs:
- [chapterhouse-knowledge-base-blueprint.md](chapterhouse-knowledge-base-blueprint.md)
- [chapterhouse-product-spec.md](chapterhouse-product-spec.md)
- [chapterhouse-data-model-spec.md](chapterhouse-data-model-spec.md)
- [chapterhouse-workflow-spec.md](chapterhouse-workflow-spec.md)
- [chapterhouse-ui-spec.md](chapterhouse-ui-spec.md)
- [chapterhouse-technical-architecture-spec.md](chapterhouse-technical-architecture-spec.md)
- [chapterhouse-intelligence-engine-spec.md](chapterhouse-intelligence-engine-spec.md)

These two tracks support each other. Chapterhouse exists in part to make the storefront smarter, faster, and more coherent.

---

## The Five Operating Lanes

### Lane 1: Brand Core
This lane protects identity.

Questions this lane answers:
- Does this sound like us?
- Does this fit the faith posture?
- Does this help the primary customer?
- Is this bright, confident, fun, trustworthy, and kid-first?

Primary source docs:
- [persona.md](persona.md)
- [brand-personality-handoff.md](brand-personality-handoff.md)
- [biography.md](biography.md)

### Lane 2: Commerce Engine
This lane turns attention into revenue.

Questions this lane answers:
- What are we selling first?
- How do customers browse, trust, and buy?
- What improves conversion, AOV, and repeat purchase rate?

Primary source docs:
- [shopify-strategy.md](shopify-strategy.md)
- [README.md](README.md)
- [dinner-questions.md](dinner-questions.md)

### Lane 3: Curriculum + Product Engine
This lane creates the differentiated stuff.

Questions this lane answers:
- What original products can only we make?
- Which books deserve companion guides?
- Which digital products can Scott create fast and sell with strong margin?

Primary source docs:
- [shopify-strategy.md](shopify-strategy.md)
- [biography.md](biography.md)
- [persona.md](persona.md)

### Lane 4: Content + Audience Engine
This lane earns attention and trust.

Questions this lane answers:
- What do we publish?
- Where do we publish it?
- Which channels actually fit us?
- What content drives discovery, trust, and sales?

Primary source docs:
- [brand-personality-handoff.md](brand-personality-handoff.md)
- [persona.md](persona.md)
- [README.md](README.md)

### Lane 5: Research + Intelligence Engine
This lane keeps the brand from building inside a bubble.

Questions this lane answers:
- What are platforms like HubSpot, Substack, Shopify, ConvertKit, and others doing that is actually useful?
- Which ideas are facts, which are patterns, and which are just polished content marketing?
- What should become part of our system?

Primary source docs:
- [ai-operating-principles.md](ai-operating-principles.md)
- [README.md](README.md)

---

## The Standard Workflow for Any New Idea

When a new tactic, platform, offer, product, tool, or marketing idea appears, run it through this sequence:

### 1. Name the thing
What is it, exactly?

### 2. Assign the lane
Brand? Commerce? Curriculum? Content? Research?

### 3. Define the job
What problem is it solving?

### 4. Score the evidence
- Firsthand experience
- Verifiable source
- Multiple-source pattern
- Anecdote only
- Guru fluff

### 5. Check brand fit
Does it match the actual customer, brand tone, and business model?

### 6. Decide the status
- **Adopt now**
- **Test next**
- **Watchlist**
- **Reject**

### 7. Record it
If it matters, it goes into the system. If not, it dies honorably and stops taking up brain space.

---

## External Intelligence Intake System

This is how we absorb useful information from the internet without becoming a scrapbook of everybody else's opinions.

### Acceptable Sources
- Platform documentation
- Official company blogs when discussing platform features or workflows
- Credible case studies
- Independent operators with real examples and specifics
- Industry reports with named methodology
- Podcast or interview transcripts with substance
- Communities where actual users describe what worked and what failed

### Sources to Treat Carefully
- SaaS company blogs trying to sell their SaaS
- marketers selling "systems"
- vague viral threads
- AI gurus promising 10x output with zero downside
- anything that sounds too clean, too instant, or too universal

### Required Output Format for External Research
Every piece of outside advice gets translated into:

1. **What it claims**
2. **What is factually supported**
3. **What is inference or opinion**
4. **What seems useful for this brand**
5. **What does not fit this brand**
6. **Whether we should adopt, test, or ignore it**

---

## Decision Filters

Before anything becomes part of the operating system, it must survive these filters:

### Customer Filter
Does this help a real homeschool parent make better decisions, save time, reduce overwhelm, or find better materials?

### Brand Filter
Does this feel like Barnes & Noble's cooler younger sibling with indie soul — not a warehouse, not a sermon, not a funnel cult?

### Revenue Filter
Can this help revenue now, improve conversion, raise AOV, create margin, or build a future asset?

### Capacity Filter
Can Scott and Anna actually sustain this without building a second job that's just chaos in nicer packaging?

### Strategic Filter
Does this strengthen the storefront, the curriculum engine, the audience, or the future platform?

If it fails three filters, it does not enter the system.

---

## The Weekly Rhythm

### Every Week
- Review current priorities
- Capture new ideas and incoming research
- Decide what gets tested, parked, or killed
- Move one meaningful thing forward in each active lane

### Weekly Questions
- What moved revenue this week?
- What improved trust this week?
- What reduced friction this week?
- What felt like noise dressed as opportunity?
- What needs to be written down before it evaporates?

---

## The Monthly Rhythm

### Every Month
- Review traffic, product movement, email growth, and digital sales
- Review which experiments worked
- Update core docs with any true changes in strategy
- Archive dead ideas so they stop haunting the hallway
- Re-rank immediate priorities for the next 30 days

---

## The Metrics That Matter

This is the first-pass scoreboard. It can evolve.

### Commerce
- Revenue
- Conversion rate
- Average order value
- Digital attach rate
- Repeat purchase rate

### Audience
- Email list growth
- Open rate
- Click rate
- Content-to-product traffic
- Social saves/shares over vanity likes

### Product
- Number of live SKUs
- Number of live digital guides
- Number of books with upsell pairing
- Time to create a new digital product

### Strategic
- Number of reusable systems built
- Number of decisions documented
- Number of useful outside insights adopted

---

## The Three Current Priorities

### Priority 1: Launch the storefront with a clean, differentiated buying experience
This means filters, curation, product clarity, and enough catalog depth to feel real.

### Priority 2: Build digital products that raise margin fast
Curriculum guides, companion materials, bundles, and anything that increases value without increasing warehouse complexity.

### Priority 3: Build the audience flywheel
Email, content, trust assets, and channel discipline — especially through platforms where Anna already has leverage and where the brand voice can actually breathe.

---

## What This System Is For Right Now

Right now, this operating system exists to help the team:
- launch cleanly
- think clearly
- avoid guru brain
- turn research into decisions
- turn decisions into products
- turn products into revenue
- keep the big platform dream connected to the next practical move

---

## What Gets Added Next

This document should eventually gain linked sections or companion docs for:
- channel strategy (email, Substack, podcast, social, SEO)
- audience acquisition system
- product launch templates
- content operating calendar
- partnership and affiliate framework
- research library / intelligence log
- decision archive
- dashboard and KPI reviews

---

## The Rule at the Center of It All

**If it helps real families, strengthens trust, sharpens the brand, and builds durable assets, it belongs here.**

Everything else is just internet confetti.

---

*Last updated: March 10, 2026 — Full audit complete. All 9 Chapterhouse screens working. Auth gate live. Daily Brief tested in production. Convert to task + Send to review wired. Outstanding: set ALLOWED_EMAILS in Vercel, fix RSS feeds, secure /api/debug.*