# Intelligence Engine Spec — Chapterhouse Prompting, Retrieval, Scoring, and Ingestion

> *This is the thinking layer. The app can have a beautiful UI, a sharp schema, and a respectable hosting stack — and still be dumb if the engine that selects context, routes models, scores signals, and handles truth is sloppy. This document exists so the brain does not get left to vibes alone.*

---

## Purpose

This document defines the internal intelligence behavior of Chapterhouse.

It covers:
- prompt architecture
- model routing
- retrieval rules
- scoring behavior
- ingestion discipline
- citation and truth rules

This is the layer that determines whether the system becomes:
- a trustworthy internal operator
or
- a polished hallucination machine with a premium theme

---

## Core Principles

### 1. Retrieval before rhetoric
The system should retrieve relevant context before trying to sound smart.

### 2. Source-backed by default
When a claim matters, the engine should prefer citations, evidence grading, and explicit uncertainty.

### 3. Specialized thinking beats one-size-fits-all prompting
Different jobs need different prompt frames, retrieval sets, and model strengths.

### 4. Structured judgment beats generic synthesis
The engine should classify, compare, rank, and recommend using clear internal logic, not just summarize elegantly.

### 5. Brand truth is always in play
The system should never drift so far into "research mode" that it forgets the founder core, the brand posture, or the actual business model.

---

## Engine Layers

The intelligence engine should operate in five layers:

1. Intent detection
2. Context retrieval
3. Model routing
4. Reasoning / generation
5. Output validation and citation packaging

---

## 1. Intent Detection Layer

Every user request should be classified before the main response is generated.

### Primary intent classes
- brand guidance
- research analysis
- source comparison
- product opportunity analysis
- content generation
- document update proposal
- task/action planning
- general chat

### Secondary modifiers
- urgent
- citation required
- compare mode
- report mode
- brief mode
- creative mode
- executive summary mode

### Why this matters
The same question asked in different contexts should not trigger the same engine behavior.

Example:
- “What do you think about this article?”
- “Should this article change our strategy?”

Those are related but not identical jobs.

---

## 2. Prompt Architecture

The system should use layered prompting, not one giant unstable super-prompt.

### Prompt stack

#### Layer A — Global system layer
Always present. Includes:
- AI operating principles
- source discipline
- citation expectations
- uncertainty rules
- persistent founder truths

#### Layer B — Workspace layer
Context from current workspace:
- Brand HQ
- Research Desk
- Marketing Studio
- Product Lab
- Daily Briefing
- Ops Console

#### Layer C — Persona layer
Specialist mode behavior:
- Brand Whisperer
- Research Analyst
- Marketing Strategist
- Product Architect
- Managing Editor
- Ops Chief

#### Layer D — Task layer
The specific job:
- compare sources
- create a memo
- score an opportunity
- draft a campaign
- propose a doc update

#### Layer E — Retrieved context layer
Retrieved records and documents relevant to the task.

#### Layer F — Output contract
The expected answer structure:
- bullets
- memo
- table
- scored output
- citations
- action recommendations

### Prompt design rule
Prompts should be composable and inspectable.  
Do not hide everything in one unmaintainable prompt blob.

---

## 3. Persona Prompt Roles

### Brand Whisperer
Best for:
- positioning
- naming
- brand fit
- strategic language
- founder-truth interpretation

### Research Analyst
Best for:
- fact vs fluff
- source comparison
- evidence grading
- conflict surfacing

### Marketing Strategist
Best for:
- campaigns
- messaging
- channel plans
- email and content strategy

### Product Architect
Best for:
- product concepts
- bundle logic
- curriculum angles
- opportunity translation

### Managing Editor
Best for:
- cleaning drafts
- preserving coherence
- improving structure and clarity

### Ops Chief
Best for:
- turning decisions into workflows
- task logic
- prioritization
- execution sequencing

---

## 4. Model Routing Strategy

The engine should route requests to model lanes based on job type.

### Default model lanes

#### Fast lane
Use for:
- quick transformations
- lightweight summaries
- UI assistance
- brief rewrites

Suggested default:
- `DEFAULT_FAST_MODEL`

#### Reasoning lane
Use for:
- research analysis
- source comparison
- opportunity scoring logic
- strategic recommendations

Suggested default:
- `DEFAULT_REASONING_MODEL`

#### Creative lane
Use for:
- campaign drafts
- product copy
- brand language
- alternate angles and hooks

Suggested default:
- `DEFAULT_CREATIVE_MODEL`

#### Retrieval / embedding lane
Use for:
- embeddings
- semantic indexing
- retrieval preparation

Suggested default:
- `DEFAULT_EMBEDDING_MODEL`

### Routing rules
The system should not default every request to the strongest or most expensive model. It should use the right tool for the job.

---

## 5. Retrieval Strategy

Retrieval should be hybrid.

### Retrieval sources
- structured data from Supabase
- semantic memory from Qdrant
- recent cache/context from Upstash
- current user session and active workspace

### Retrieval types

#### A. Structured retrieval
Used when exact fields matter.

Examples:
- score thresholds
- task states
- competitor tier
- book status

#### B. Semantic retrieval
Used when conceptual recall matters.

Examples:
- similar research findings
- founder posture
- faith balance principles
- prior strategy decisions

#### C. Temporal retrieval
Used when recency matters.

Examples:
- latest promotions
- newest competitor moves
- today's alerts
- recent brief items

### Retrieval order
1. identify object-level exact context
2. identify relevant recent records
3. run semantic retrieval for related reasoning context
4. prune and rank before prompt assembly

### Retrieval rule
More context is not always better.  
The engine should prefer the **most relevant** context, not the largest context window it can stuff full.

---

## 6. Retrieval Profiles by Workflow

### Brand question
Retrieve:
- persona doc
- biography
- brand voice doc
- operating principles

### Research analysis
Retrieve:
- source record(s)
- prior related reports
- relevant policy/strategy docs
- evidence grading rules

### Product opportunity analysis
Retrieve:
- linked book/author/publisher records
- competitor movement
- prior opportunities
- scoring rules
- founder priorities

### Content generation
Retrieve:
- brand voice doc
- relevant opportunity or campaign context
- channel rules
- prior related content if available

### Document update proposal
Retrieve:
- target document
- related staging docs
- supporting sources
- related prior decisions

---

## 7. Source and Truth Rules

The engine must distinguish among:
- facts
- inferences
- recommendations
- speculation

### Default output discipline
- cite meaningful claims
- expose source conflicts
- note weak evidence
- avoid bluffing certainty

### Source priority order
1. official platform docs and official site signals
2. official emails / owned promos
3. editorial recognition and institutional lists
4. organic signal from real users / communities
5. general social buzz
6. paid ads

### Rule on paid signals
Paid ads may be observed as context, but should not be treated as primary truth.

---

## 8. Ingestion Rules

Every ingested source should pass through these checks:

### A. Valid source check
Is this from an allowed or tolerated source class?

### B. Deduplication check
Has this already been seen under another URL, title, or feed path?

### C. Extraction quality check
Do we have enough actual content to analyze?

### D. Evidence check
What kind of source is this and how strong is it?

### E. Relevance check
Does this matter to one of the tracked domains or entity classes?

### F. Escalation check
Is this worth surfacing, storing, embedding, or ignoring?

### Ingestion rule
Not every fetched thing deserves permanent memory.

---

## 9. Embedding Rules

Do not embed everything blindly.

### Good candidates for embedding
- core brand docs
- durable research reports
- useful source summaries
- high-value competitor observations
- approved opportunities

### Lower-priority candidates
- low-confidence noise
- short-lived trivial alerts
- duplicate articles
- throwaway drafts

### Embedding principle
Embed what improves future recall, not what merely exists.

---

## 10. Scoring Engine

The app uses three formal scores:
- store score
- curriculum score
- content score

### Score thresholds
- 85+ = immediate attention
- 70–84 = strong watch
- 50–69 = maybe
- below 50 = low priority

### Scoring should consider
- source strength
- repetition
- cross-platform confirmation
- audience fit
- homeschool usefulness
- age/grade fit
- faith posture fit
- literary quality
- curriculum potential
- Alaska / allotment fit
- price drop or promo movement
- bundle potential
- content hook strength

---

## 11. Suggested Scoring Shape

Not final math, but strong default logic.

### Store Score (0–100)
Suggested factor buckets:
- market signal strength — 30
- audience/store fit — 25
- pricing/promo leverage — 20
- bundle/cross-sell potential — 15
- risk penalty — 10

### Curriculum Score (0–100)
Suggested factor buckets:
- teaching depth — 25
- curriculum extension potential — 25
- age/grade usefulness — 15
- differentiation potential — 15
- Scott priority / override weight — 10
- risk penalty — 10

### Content Score (0–100)
Suggested factor buckets:
- hook potential — 20
- trend / seasonal relevance — 20
- audience resonance — 20
- author/title recognizability — 15
- campaign usefulness — 15
- risk penalty — 10

### Important note
These weights should live in settings, not hardcode forever.

---

## 12. Literary Quality Model

The engine should estimate literary quality using:
- awards / notable list presence
- review sentiment quality
- backlist staying power
- trusted publisher / imprint
- librarian / teacher recommendation signal
- educational usefulness
- Anna editorial priority

### Rule
Anna's editorial judgment carries very high weight.

---

## 13. Curriculum Potential Model

The engine should estimate curriculum potential using:
- discussion depth
- interdisciplinary potential
- age/grade usability
- extension and project potential
- series/world depth if relevant
- alignment with personalized curriculum philosophy
- Scott curriculum priority

### Rule
Scott's curriculum instinct carries high weight.

---

## 14. Opportunity Escalation Logic

An item should escalate when combinations occur such as:
- repeated competitor push
- cross-platform signal
- price movement
- title/author recurrence
- seasonal timing
- founder override

### Weak signal behavior
- store in low-confidence watchlist
- increase visibility only when repeated or corroborated

---

## 15. Output Contracts

Each major engine mode should return a structured shape.

### Research verdict output
- summary
- fact/pattern/opinion/hype split
- confidence
- cited sources
- recommended action

### Opportunity output
- why it matters
- three scores
- evidence grade
- trigger badges
- risks
- suggested next move

### Brief item output
- title
- 1-sentence summary
- why it matters
- severity/score
- source links
- action options

### Content draft output
- primary draft
- alternate hooks
- CTA suggestions
- channel notes
- source basis if relevant

---

## 16. Output Validation Layer

Before final display, the system should perform lightweight checks:
- are citations present where needed?
- is confidence appropriate to source strength?
- does the answer confuse fact with opinion?
- is the output missing an obvious linked record?
- does the tone fit the workspace/persona?

This should be a practical safeguard, not a bureaucratic second trial.

---

## 17. Default Memory Rules

### Always-available memory
- biography
- persona
- brand voice
- AI principles
- operating system

### Usually retrieved when relevant
- recent briefs
- recent reports
- opportunities
- tasks
- decisions

### Selectively retrieved
- raw sources
- low-confidence items
- old drafts

---

## 18. Hallucination Risk Controls

The engine should reduce hallucination risk by:
- retrieving before answering
- preferring citations
- exposing uncertainty
- separating fact from inference
- suppressing overconfident language when evidence is thin

### Rule
If the source base is weak, the answer should sound appropriately provisional.

---

## 19. Cost Discipline Rules

The engine should conserve cost by:
- caching repeated fetches
- using fast models for lightweight tasks
- embedding selectively
- retrieving surgically
- running deeper reasoning only when needed

This matters because a smart system that burns money stupidly is not actually smart.

---

## 20. Recommended Build Order for the Engine

### Phase 1
- intent classification
- hybrid retrieval foundation
- source-backed research outputs
- basic model routing

### Phase 2
- daily brief assembly logic
- opportunity scoring engine
- citation packaging
- confidence handling

### Phase 3
- richer persona orchestration
- configurable score weights
- stronger escalation logic
- validation layer improvements

### Phase 4
- advanced routing
- dynamic prompt assembly tuning
- long-term memory refinement

---

## Final Recommendation

Build the engine around:
- layered prompts
- hybrid retrieval
- formal scoring
- source-backed outputs
- configurable weighting

Do not build it around:
- one giant prompt
- blind summarization
- ad-driven signal chasing
- overstuffed context windows

---

*Last updated: March 6, 2026 — The engine should think clearly before it speaks beautifully.*