/**
 * doc-type-prompts.ts
 *
 * Definitions for all 15 Documents Studio document types.
 * Each type has:
 *   - label/description for the UI
 *   - fields: the form inputs shown to the user
 *   - buildPrompt(inputs): returns the final user prompt string merged with inputs
 *   - systemPromptSuffix: injected after buildLiveContext() in the generate route
 *   - defaultTitle(inputs): generates a document title from inputs
 *   - useCouncilDefault: whether the "Use Council" toggle is on by default
 *
 * The generate route calls buildLiveContext() for full Scott context, then appends
 * systemPromptSuffix so Claude knows which doc type it's producing.
 */

export type DocField = {
  key: string;
  label: string;
  type: "text" | "textarea" | "select" | "document_picker";
  placeholder?: string;
  options?: string[];   // only for type: "select"
  required?: boolean;
};

export type DocTypeDefinition = {
  id: string;
  label: string;
  description: string;
  category: "strategy" | "writing" | "planning" | "research" | "brainstorm";
  icon: string;
  fields: DocField[];
  systemPromptSuffix: string;
  buildPrompt: (inputs: Record<string, string>) => string;
  defaultTitle: (inputs: Record<string, string>) => string;
  useCouncilDefault: boolean;
};

// ── 1. PRD ────────────────────────────────────────────────────────────────────

const prd: DocTypeDefinition = {
  id: "prd",
  label: "Product Requirements Doc",
  description: "Generate a PRD with user stories, acceptance criteria, and success metrics ready for a code bot.",
  category: "strategy",
  icon: "📋",
  useCouncilDefault: true,
  fields: [
    { key: "feature_name", label: "Feature name", type: "text", placeholder: "e.g. Tell Mom button", required: true },
    { key: "problem_statement", label: "Problem this solves", type: "textarea", placeholder: "What breaks or is missing today?", required: true },
    { key: "target_user", label: "Target user", type: "select", options: ["Parent", "Student / child", "Anna", "Scott"], required: true },
    { key: "out_of_scope", label: "Explicitly out of scope", type: "textarea", placeholder: "What are we NOT building?" },
  ],
  systemPromptSuffix: "You are writing a Product Requirements Document. Every ambiguity you leave is a future bug in the code bot's output. Be specific. Use concrete acceptance criteria. Flag open decisions with ⚠️ SCOTT DECIDES.",
  buildPrompt: (i) => `Write a Product Requirements Document for the feature: **${i.feature_name}**

Target user: ${i.target_user}
Problem this solves: ${i.problem_statement}
Out of scope: ${i.out_of_scope || "Not specified"}

Structure:
1. One-paragraph vision
2. User stories (3-5) in "As a [user] I want [goal] so that [reason]" format
3. Acceptance criteria for each story (specific, testable)
4. Success metrics (how we know it's working)
5. Explicitly NOT building (repeat the out-of-scope with rationale)
6. Open questions flagged as ⚠️ SCOTT DECIDES

This PRD goes directly to a code bot. Every ambiguity is a bug. Be precise.`,
  defaultTitle: (i) => `PRD: ${i.feature_name || "New Feature"}`,
};

// ── 2. Architecture Decision Doc ──────────────────────────────────────────────

const archDoc: DocTypeDefinition = {
  id: "arch-doc",
  label: "Architecture Decision",
  description: "Draft an ADR in Scott's locked-decision format: Decision / Why / Not.",
  category: "strategy",
  icon: "🏗️",
  useCouncilDefault: false,
  fields: [
    { key: "decision_question", label: "Decision question", type: "text", placeholder: "e.g. Should we use Supabase Realtime or polling for job progress?", required: true },
    { key: "option_a", label: "Option A", type: "text", placeholder: "e.g. Supabase Realtime", required: true },
    { key: "option_b", label: "Option B", type: "text", placeholder: "e.g. Client polling every 2s", required: true },
    { key: "constraints", label: "Constraints", type: "textarea", placeholder: "Budget, time, team, tech stack limits...", required: true },
  ],
  systemPromptSuffix: "You are writing an Architecture Decision Record (ADR). Use Scott's locked decision format exactly. Be opinionated — recommend one option clearly. Data leads this pass.",
  buildPrompt: (i) => `Write an Architecture Decision Record for: **${i.decision_question}**

Options considered:
- Option A: ${i.option_a}
- Option B: ${i.option_b}

Constraints: ${i.constraints}

Format exactly:
**Decision**: [what was decided]
**Why**: [the actual reason — not "best practice," the real reason for this project]
**Not**: [the rejected option and exactly why]

Then add:
- Implementation notes (what changes when this decision is implemented)
- Rollback plan (how to undo this if it proves wrong)
- Open questions: ⚠️ SCOTT DECIDES: [any blocking question]`,
  defaultTitle: (i) => `ADR: ${i.decision_question || "Architecture Decision"}`,
};

// ── 3. Blog Post ──────────────────────────────────────────────────────────────

const blogPost: DocTypeDefinition = {
  id: "blog-post",
  label: "Blog Post",
  description: "Write a brand-voiced blog post for NCHO, SomersSchool, or Alana Terry.",
  category: "writing",
  icon: "✍️",
  useCouncilDefault: true,
  fields: [
    { key: "topic", label: "Topic", type: "text", placeholder: "e.g. Why secular homeschool curriculum is hard to find in Alaska", required: true },
    { key: "target_brand", label: "Brand", type: "select", options: ["NCHO", "SomersSchool", "Alana Terry"], required: true },
    { key: "angle", label: "Angle", type: "select", options: ["Educational / How-to", "Personal story", "News response", "Listicle", "Opinion"], required: true },
    { key: "target_audience", label: "Target reader", type: "text", placeholder: "e.g. Alaska homeschool mom, first year", required: true },
    { key: "cta", label: "Call to action", type: "text", placeholder: "e.g. Browse our secular curriculum collection" },
  ],
  systemPromptSuffix: "You are writing a blog post. Real teacher voice — not AI voice. No filler. Always 'your child' never 'your student.' Polgara leads the final pass.",
  buildPrompt: (i) => `Write a blog post for **${i.target_brand}**.

Topic: ${i.topic}
Angle: ${i.angle}
Target reader: ${i.target_audience}
CTA: ${i.cta || "None specified"}

Brand voice rules from context. Key rules:
- NCHO: emotional first ("for the child who doesn't fit in a box"), practical convert
- SomersSchool: convicted about homeschooling, curious about this platform
- Alana Terry: personal and vulnerable, faith assumed not preached, community not audience
- ALWAYS "your child" — never "the student" or "your learner"

Target length: 800-1200 words. Real teacher voice. Specific examples. No AI-sounding filler phrases ("In conclusion," "It's worth noting," etc.).`,
  defaultTitle: (i) => `Blog: ${i.topic || "New Post"} (${i.target_brand || ""})`,
};

// ── 4. Landing Page Copy ──────────────────────────────────────────────────────

const landingCopy: DocTypeDefinition = {
  id: "landing-copy",
  label: "Landing Page Copy",
  description: "Full landing page structure: hero, problem, solution, features, FAQ, CTA.",
  category: "writing",
  icon: "🖥️",
  useCouncilDefault: true,
  fields: [
    { key: "product", label: "Product", type: "select", options: ["SomersSchool (full platform)", "NCHO Store", "Specific SomersSchool course", "Alana Terry book"], required: true },
    { key: "product_detail", label: "Product detail (if specific)", type: "text", placeholder: "e.g. Les Misérables: Revolution and Justice" },
    { key: "audience_pain", label: "Primary audience pain", type: "textarea", placeholder: "What are they frustrated, worried, or overwhelmed about?", required: true },
    { key: "primary_cta", label: "Primary CTA", type: "text", placeholder: "e.g. Start your free trial", required: true },
  ],
  systemPromptSuffix: "You are writing landing page copy. Lead with emotional pain. Convert with practical clarity. Red/white visual identity — bold, clean, direct. 'Your child.' Never 'the student.'",
  buildPrompt: (i) => `Write landing page copy for **${i.product}${i.product_detail ? ` — ${i.product_detail}` : ""}**.

Primary audience pain: ${i.audience_pain}
Primary CTA: ${i.primary_cta}

Structure (output each section with a clear header):
1. Hero — headline (max 8 words) + subhead (1-2 sentences) + CTA button text
2. Problem — 3 bullet points naming the pain clearly
3. Solution — what this is, in 2-3 sentences (not features, the outcome)
4. Social proof — [3 placeholder testimonials in the right voice]
5. Features — 3 features, each with name + 1-sentence benefit
6. How it works — 3 numbered steps
7. FAQ — 3 questions with honest answers
8. Final CTA — closing line + CTA button text

Use red/white visual identity language. "Your child." Convicted, not curious. No edu-corp buzzwords.`,
  defaultTitle: (i) => `Landing Copy: ${i.product || "New Page"}`,
};

// ── 5. Notes → Spec Converter ─────────────────────────────────────────────────

const spec: DocTypeDefinition = {
  id: "spec",
  label: "Notes → Spec",
  description: "Convert rough notes, a voice transcript, or a brainstorm dump into a clean spec or decision log.",
  category: "planning",
  icon: "🔄",
  useCouncilDefault: false,
  fields: [
    { key: "raw_notes", label: "Paste your raw notes", type: "textarea", placeholder: "Dump everything — messy is fine", required: true },
    { key: "output_format", label: "Output format", type: "select", options: ["Feature spec", "Session summary", "Decision log", "Implementation plan", "Architecture spec"], required: true },
  ],
  systemPromptSuffix: "You are converting rough notes into a clean document. Preserve all decisions exactly as stated. Never invent decisions. Flag anything ambiguous as ⚠️ SCOTT DECIDES.",
  buildPrompt: (i) => `Convert these rough notes into a clean **${i.output_format}**.

Raw notes:
${i.raw_notes}

Rules:
- Preserve all decisions EXACTLY as stated — do not rephrase or combine
- Lock clearly-decided items in this format:
  **Decision**: [what was decided]
  **Why**: [the reason given]
  **Not**: [what was rejected]
- Flag anything ambiguous or requiring human input as: ⚠️ SCOTT DECIDES: [specific question]
- Do NOT invent decisions or fill in gaps with assumptions
- Output clean, organized markdown ready to paste into CLAUDE.md or a spec file`,
  defaultTitle: (i) => `Notes → ${i.output_format || "Spec"}`,
};

// ── 6. Session Close / CLAUDE.md Updater ─────────────────────────────────────

const sessionClose: DocTypeDefinition = {
  id: "session-close",
  label: "Session Close",
  description: "Generate the CLAUDE.md Build History entry and copilot-instructions.md Last Updated line. Step 5 of the dev process as a button.",
  category: "planning",
  icon: "🔒",
  useCouncilDefault: false,
  fields: [
    { key: "repo_name", label: "Repo name", type: "text", placeholder: "e.g. chapterhouse", required: true },
    { key: "what_was_built", label: "What was built this session", type: "textarea", placeholder: "Describe what changed — features, fixes, refactors", required: true },
    { key: "new_tables", label: "New DB tables (comma-separated)", type: "text", placeholder: "e.g. documents" },
    { key: "new_routes", label: "New API routes (comma-separated)", type: "text", placeholder: "e.g. /api/documents/generate, /api/documents/[id]" },
    { key: "new_env_vars", label: "New env vars (comma-separated)", type: "text", placeholder: "e.g. DOCUMENTS_MAX_TOKENS" },
    { key: "last_migration", label: "Last migration number", type: "text", placeholder: "e.g. 030" },
    { key: "commit_hash", label: "Commit hash (optional)", type: "text", placeholder: "e.g. a1b2c3d" },
  ],
  systemPromptSuffix: "You are writing a session close document. Dense, factual. Same voice as existing CLAUDE.md Build History entries. No commentary — just the two paste-ready blocks.",
  buildPrompt: (i) => `Write a session close document for the **${i.repo_name}** repo.

What was built: ${i.what_was_built}
New DB tables: ${i.new_tables || "None"}
New API routes: ${i.new_routes || "None"}
New env vars: ${i.new_env_vars || "None"}
Last migration: ${i.last_migration || "Unchanged"}
Commit hash: ${i.commit_hash || "Not provided"}

Output EXACTLY TWO SECTIONS — nothing else, ready to paste:

---
**SECTION 1 — CLAUDE.md Build History entry:**
One dense paragraph starting with: *Document version: [today's date] (Session [N]) — [headline of what was built].*
Same format and density as existing CLAUDE.md entries. List every file changed with the change made. Include commit hash if provided.

---
**SECTION 2 — copilot-instructions.md Last Updated entry:**
One dense paragraph starting with the date. Same format as existing Last Updated entries in copilot-instructions.md.
---`,
  defaultTitle: (i) => `Session Close: ${i.repo_name || "repo"} — ${new Date().toLocaleDateString()}`,
};

// ── 7. Campaign Brief ─────────────────────────────────────────────────────────

const campaignBrief: DocTypeDefinition = {
  id: "campaign-brief",
  label: "Campaign Brief",
  description: "Facebook/social ad campaign brief with audience targeting, copy variants, and kill/scale criteria.",
  category: "writing",
  icon: "📣",
  useCouncilDefault: false,
  fields: [
    { key: "campaign_goal", label: "Campaign goal", type: "text", placeholder: "e.g. Drive first enrollments for SomersSchool", required: true },
    { key: "target_brand", label: "Brand", type: "select", options: ["NCHO", "SomersSchool", "Alana Terry"], required: true },
    { key: "audience_segment", label: "Audience segment", type: "text", placeholder: "e.g. Alaska homeschool moms, 28-45, interested in curriculum", required: true },
    { key: "offer", label: "The offer", type: "text", placeholder: "e.g. Free trial month, $149 course, free PDF guide", required: true },
    { key: "budget_range", label: "Budget range", type: "text", placeholder: "e.g. $5-10/day test" },
    { key: "test_variants", label: "Number of copy variants", type: "select", options: ["2", "3", "4", "5"], required: true },
  ],
  systemPromptSuffix: "You are writing a paid social campaign brief. Convicted not curious. 'Your child.' Include specific kill/scale criteria based on CPM and click-through benchmarks.",
  buildPrompt: (i) => `Write a Facebook/Instagram campaign brief for **${i.target_brand}**.

Goal: ${i.campaign_goal}
Audience: ${i.audience_segment}
Offer: ${i.offer}
Budget: ${i.budget_range || "To be determined"}
Variants needed: ${i.test_variants}

Include:
1. Campaign objective (awareness/traffic/conversion)
2. Audience targeting spec (interests, demographics, exclusions)
3. ${i.test_variants} ad copy variants — each with: headline (max 8 words), primary text (2-3 sentences), CTA button text
4. Creative direction (what the image/video should show — no stock photos)
5. Success metrics: what numbers make this a winner vs. a loser
6. Kill criteria: kill the ad if [specific metric threshold]
7. Scale criteria: scale the ad if [specific metric threshold]

Brand voice from context. "Your child." Convicted, not curious.`,
  defaultTitle: (i) => `Campaign Brief: ${i.campaign_goal || "New Campaign"} (${i.target_brand || ""})`,
};

// ── 8. Competitive Positioning ────────────────────────────────────────────────

const positioning: DocTypeDefinition = {
  id: "positioning",
  label: "Competitive Positioning",
  description: "Define Scott's moat against a specific competitor with positioning statement and ad copy lines.",
  category: "strategy",
  icon: "🎯",
  useCouncilDefault: true,
  fields: [
    { key: "competitor", label: "Competitor", type: "select", options: ["ChatGPT Study Mode", "i-Ready", "Beast Academy", "Plato Courseware", "PRH Grace Corner", "Teachers Pay Teachers", "Khan Academy", "IXL", "Other"], required: true },
    { key: "competitor_detail", label: "Competitor detail (if Other)", type: "text", placeholder: "Competitor name and URL" },
    { key: "audience_context", label: "Audience context", type: "text", placeholder: "e.g. Alaska homeschool mom, secular, allotment-eligible", required: true },
    { key: "claim_to_defend", label: "Scott's core claim", type: "text", placeholder: "e.g. Built by a real classroom teacher", required: true },
  ],
  systemPromptSuffix: "You are writing a competitive positioning document. Be honest about the competitor's real strengths — dismissing them makes the positioning weaker. Find the structural moat they literally cannot replicate.",
  buildPrompt: (i) => `Write a competitive positioning document for SomersSchool vs **${i.competitor === "Other" ? i.competitor_detail : i.competitor}**.

Audience: ${i.audience_context}
Core claim to defend: ${i.claim_to_defend}

Structure:
1. Their real strength — what they genuinely do well (do not dismiss it)
2. Their structural weakness — what they literally cannot fix without breaking their business model
3. Scott's moat — what SomersSchool has that they cannot replicate (real classroom teacher, Alaska context, secular + allotment-eligible, parent-first COPPA design, visible progress architecture)
4. One-sentence positioning statement
5. Three ad copy lines that execute the positioning
6. What NOT to say — the traps that make the positioning look defensive or weak
7. One question to test the positioning: "Would this copy make a parent of a struggling learner stop scrolling?"

Use intel and research context if available for this competitor. Do not invent market stats.`,
  defaultTitle: (i) => `Positioning: SomersSchool vs ${i.competitor || "Competitor"}`,
};

// ── 9. Launch Checklist ───────────────────────────────────────────────────────

const launchChecklist: DocTypeDefinition = {
  id: "launch-checklist",
  label: "Launch Checklist",
  description: "Full launch checklist with tech, content, legal, marketing, and post-launch monitoring tasks.",
  category: "planning",
  icon: "🚀",
  useCouncilDefault: false,
  fields: [
    { key: "product_or_feature", label: "What is launching", type: "text", placeholder: "e.g. SomersSchool public beta, NCHO Shopify store", required: true },
    { key: "launch_date_target", label: "Target launch date", type: "text", placeholder: "e.g. May 1, 2026", required: true },
    { key: "known_dependencies", label: "Known dependencies or blockers", type: "textarea", placeholder: "What must be true before launch can happen?" },
  ],
  systemPromptSuffix: "You are writing a launch checklist. Be exhaustive. Flag blocking items 🔴. Assign owners (Scott or Anna). Include the things people always forget (robots.txt, error messages, support email, COPPA disclosure if student-facing).",
  buildPrompt: (i) => `Build a launch checklist for **${i.product_or_feature}**, targeting **${i.launch_date_target}**.

Known dependencies / blockers: ${i.known_dependencies || "None specified"}

Format: checkbox markdown (- [ ] item)
Owner column: (Scott) or (Anna) after each item
Flag blockers: 🔴 before any item that blocks launch

Categories to cover:
**Tech**
- Domain + DNS, env vars in prod, webhooks wired, monitoring active, error tracking, robots.txt, sitemap

**Content**
- Landing page copy, SEO titles/descriptions, email sequences, FAQ page

**Legal / Compliance**
- Privacy policy, terms of service, refund policy, COPPA notice (if student-facing), support@nextchapterhomeschool.com as contact

**Marketing**
- Email list notification, social posts queued, Facebook ad ready, Alana Terry cross-promo if applicable

**Support**
- Support email configured, error messages written, 404 page, known issue list

**Post-Launch (first 48 hours)**
- Monitor error logs, check Vercel/Railway metrics, watch for payment webhook failures, first-customer response time target`,
  defaultTitle: (i) => `Launch Checklist: ${i.product_or_feature || "New Launch"}`,
};

// ── 10. Market Sizing ─────────────────────────────────────────────────────────

const marketSizing: DocTypeDefinition = {
  id: "market-sizing",
  label: "Market Sizing",
  description: "TAM/SAM/SOM analysis with sourced stats for grant applications, pitch decks, or planning.",
  category: "research",
  icon: "📊",
  useCouncilDefault: false,
  fields: [
    { key: "market_segment", label: "Market segment", type: "text", placeholder: "e.g. Alaska homeschool allotment-eligible families", required: true },
    { key: "use_case", label: "Use case for this report", type: "select", options: ["Personal planning", "Grant application", "Pitch deck", "Press / media kit"], required: true },
  ],
  systemPromptSuffix: "You are writing a market sizing report. Every statistic must have a named source. Flag any unverifiable number with ⚠️. Anti-hallucination standard: a made-up market stat is worse than no stat.",
  buildPrompt: (i) => `Write a market sizing report for: **${i.market_segment}**

Use case: ${i.use_case}

Structure:
1. TAM — Total Addressable Market (everyone who could theoretically use this)
2. SAM — Serviceable Addressable Market (realistic reach given platform, geo, product)
3. SOM — Serviceable Obtainable Market (realistically capturable in the next 12 months with current resources)
4. Key growth drivers (3 specific factors)
5. Key risks (3 specific factors)
6. Bottom-line number — the single number to use in ${i.use_case}

Rules:
- Cite every statistic: [Source name, year]
- ⚠️ flag any number you cannot verify from a named source — never guess
- Use intel and research context for any relevant data already captured
- Alaska-specific data where available (allotment program size, homeschool population)`,
  defaultTitle: (i) => `Market Sizing: ${i.market_segment || "New Market"}`,
};

// ── 11. Customer Feedback Synthesis ──────────────────────────────────────────

const feedbackSynthesis: DocTypeDefinition = {
  id: "feedback-synthesis",
  label: "Feedback Synthesis",
  description: "Synthesize customer/community feedback into actionable product and copy insights.",
  category: "research",
  icon: "💬",
  useCouncilDefault: false,
  fields: [
    { key: "feedback_source", label: "Paste raw feedback", type: "textarea", placeholder: "Reddit comments, email replies, Facebook group quotes, review text...", required: true },
    { key: "product_context", label: "Product context", type: "select", options: ["SomersSchool", "NCHO Store", "Both", "Alana Terry / PCW"], required: true },
  ],
  systemPromptSuffix: "You are synthesizing customer feedback. Find the pattern beneath the words. What are they really asking for? Polgara's lens: what does this mean for the actual child or reader?",
  buildPrompt: (i) => `Synthesize this customer/community feedback for **${i.product_context}**:

${i.feedback_source}

Output:
1. Top 3 pain points — with frequency signal (how many said it or implied it)
2. Top 3 desires / explicit requests
3. One thing they're NOT asking for but clearly need — infer from what they say around it
4. Specific product changes implied by this feedback (concrete, actionable)
5. Specific copy changes implied — words they're using that should appear in headlines
6. Polgara's read — one sentence: what does this feedback really mean for the child or reader?`,
  defaultTitle: (i) => `Feedback Synthesis: ${i.product_context || "Product"} — ${new Date().toLocaleDateString()}`,
};

// ── 12. Study Guide ───────────────────────────────────────────────────────────

const studyGuide: DocTypeDefinition = {
  id: "study-guide",
  label: "Study Guide",
  description: "Create a grade-appropriate study guide (self-quiz, summary, vocabulary, or concept map) from source material.",
  category: "research",
  icon: "📚",
  useCouncilDefault: false,
  fields: [
    { key: "topic", label: "Topic", type: "text", placeholder: "e.g. The American Revolution — causes and timeline", required: true },
    { key: "grade_level", label: "Grade level", type: "select", options: ["K-2", "3-5", "6-8", "9-12", "Adult"], required: true },
    { key: "source_material", label: "Source material (paste or describe)", type: "textarea", placeholder: "Paste the text to study, or describe the source: chapter, video transcript, article..." },
    { key: "output_format", label: "Output format", type: "select", options: ["Self-quiz (Q&A)", "Summary (key points)", "Vocabulary list", "Concept map outline", "Guided notes (fill-in)"], required: true },
  ],
  systemPromptSuffix: "You are creating a study guide. Secular. Accurate. No filler. Every fact traceable to the source. Flag anything inferred beyond the source with ⚠️.",
  buildPrompt: (i) => `Create a **${i.output_format}**-format study guide for **${i.topic}** at **${i.grade_level}** level.

Source material: ${i.source_material || "Use general knowledge for this topic at this grade level"}

Rules:
- Secular — no faith-based framing
- Every fact traceable to the source material (or notable general knowledge)
- ⚠️ flag anything you infer beyond the source
- Grade-appropriate vocabulary and sentence structure for ${i.grade_level}
- No padding — respects the student's time`,
  defaultTitle: (i) => `Study Guide: ${i.topic || "Topic"} (${i.grade_level || ""})`,
};

// ── 13. Report Writer ─────────────────────────────────────────────────────────

const reportWriter: DocTypeDefinition = {
  id: "report",
  label: "Report",
  description: "Write a board summary, grant narrative, session summary, or annual review.",
  category: "writing",
  icon: "📄",
  useCouncilDefault: false,
  fields: [
    { key: "report_type", label: "Report type", type: "select", options: ["Board / stakeholder summary", "Grant application narrative", "Session summary", "Annual review", "Progress report"], required: true },
    { key: "audience", label: "Audience", type: "text", placeholder: "e.g. Alaska education grant committee", required: true },
    { key: "key_points", label: "Key points to include", type: "textarea", placeholder: "Numbers, outcomes, stories, decisions made — paste them in messy", required: true },
    { key: "tone", label: "Tone", type: "select", options: ["Formal", "Conversational", "Persuasive"], required: true },
  ],
  systemPromptSuffix: "You are writing a formal document. Frame around outcomes, not activities. Specific numbers where available. No filler. No bureaucratic padding.",
  buildPrompt: (i) => `Write a **${i.report_type}** for **${i.audience}**.

Key points:
${i.key_points}

Tone: ${i.tone}

Structure:
- Executive summary / opening (2-3 sentences)
- Body sections appropriate to ${i.report_type} (3-5 sections)
- Key outcomes with specific numbers
- Forward-looking close

Frame around outcomes and impact, not activities and effort.
Specific numbers where given. No filler. No passive voice.`,
  defaultTitle: (i) => `${i.report_type || "Report"}: ${i.audience || ""}`,
};

// ── 14. Dream Floor Brainstorm ────────────────────────────────────────────────

const brainstorm: DocTypeDefinition = {
  id: "brainstorm",
  label: "Dream Floor Brainstorm",
  description: "Launch a structured Council brainstorm on any topic. Gandalf opens with the right sequence — one question at a time.",
  category: "brainstorm",
  icon: "💡",
  useCouncilDefault: true,
  fields: [
    { key: "topic", label: "Topic / problem", type: "text", placeholder: "e.g. Should we build a mobile app for SomersSchool?", required: true },
    { key: "problem_type", label: "Problem type", type: "select", options: ["Architecture / technical decision", "Business / product direction", "Curriculum / content design", "New feature before building", "Stuck on a bug", "New project / repo idea", "Marketing / copy / positioning"], required: true },
    { key: "what_scott_knows_already", label: "What you already know", type: "textarea", placeholder: "Context that's already clear — decisions already made, constraints, what you've tried" },
  ],
  systemPromptSuffix: "This is a Dream Floor brainstorm. Gandalf opens. One question at a time — never a list. Wait for Scott's answer before asking the next question. Log decisions in standard format as they emerge. Flag ⚠️ SCOTT DECIDES when a decision needs human input.",
  buildPrompt: (i) => `BRAINSTORM TRIGGER — **${i.problem_type}** mode.

Topic: ${i.topic}
What Scott already knows: ${i.what_scott_knows_already || "Nothing specified — start from scratch"}

Sequence for ${i.problem_type}:
${{
  "Architecture / technical decision": "First Principles → Structured Thinking → Real-World Test",
  "Business / product direction": "Contrarian → Expert Panel → Real-World Test",
  "Curriculum / content design": "Simplify It → Improve the Idea → Expert Panel",
  "New feature before building": "Contrarian → Real-World Test → First Principles",
  "Stuck on a bug": "Structured Thinking → First Principles",
  "New project / repo idea": "Expert Panel → Contrarian → Real-World Test",
  "Marketing / copy / positioning": "Simplify It → Expert Panel → Improve the Idea",
}[i.problem_type] || "First Principles → Structured Thinking → Real-World Test"}

Gandalf opens. ONE question at a time. Wait for Scott's answer. Never list all questions at once.
Log decisions in format: **Decision**: / **Why**: / **Not**:
Flag ⚠️ SCOTT DECIDES for anything requiring human input.`,
  defaultTitle: (i) => `Brainstorm: ${i.topic || "New Topic"}`,
};

// ── 15. Academic Comparison Paper ──────────────────────────────────────────────

const academicPaper: DocTypeDefinition = {
  id: "academic_paper",
  label: "Academic Comparison Paper",
  description:
    "Generates a 12-page scholarly paper comparing two uploaded documents with real peer-reviewed citations from Semantic Scholar. Output is formatted Markdown ready to download.",
  category: "research",
  icon: "🎓",
  useCouncilDefault: false,
  fields: [
    {
      key: "doc1_id",
      label: "First source document",
      type: "document_picker",
      required: true,
    },
    {
      key: "doc2_id",
      label: "Second source document",
      type: "document_picker",
      required: true,
    },
    {
      key: "thesis",
      label: "Central thesis / research question",
      type: "textarea",
      placeholder:
        "What are you comparing? What argument should the paper make?",
      required: true,
    },
    {
      key: "page_length",
      label: "Target length",
      type: "select",
      options: ["8 pages", "12 pages", "15 pages", "20 pages"],
      required: true,
    },
    {
      key: "citation_style",
      label: "Citation style",
      type: "select",
      options: ["APA", "MLA", "Chicago", "Turabian"],
      required: true,
    },
    {
      key: "additional_guidance",
      label: "Additional guidance (optional)",
      type: "textarea",
      placeholder: "Sections, angles, or themes to emphasize?",
    },
  ],
  systemPromptSuffix: `You are writing a formal academic comparison paper.

Rules you must follow without exception:
- ONLY cite sources returned by the Semantic Scholar search provided to you. Do NOT invent, hallucinate, or fabricate any citation. If no search results were returned, acknowledge the limitation and note that citations could not be retrieved.
- Every claim that requires a citation must reference a specific paper from the provided list using the requested citation style.
- Structure the paper with: Abstract, Introduction, Literature Review, Comparative Analysis, Discussion, Conclusion, and References.
- Use formal academic prose throughout. No first-person unless quoting sources.
- The References section must list every cited paper in full bibliographic format.
- Format the entire output as Markdown (use ## for section headings, **bold** for emphasis, proper citation inline markers).`,
  buildPrompt: (i) =>
    `Write an academic comparison paper.\n\nThesis: ${i.thesis || "(no thesis provided)"}\nLength: ${i.page_length || "12 pages"}\nCitation style: ${i.citation_style || "APA"}${i.additional_guidance ? `\nAdditional guidance: ${i.additional_guidance}` : ""}`,
  defaultTitle: (i) =>
    `Academic Paper: ${(i.thesis ?? "Comparison Study").slice(0, 60)}`,
};

// ── Registry ──────────────────────────────────────────────────────────────────

export const DOC_TYPES: DocTypeDefinition[] = [
  prd,
  archDoc,
  blogPost,
  landingCopy,
  spec,
  sessionClose,
  campaignBrief,
  positioning,
  launchChecklist,
  marketSizing,
  feedbackSynthesis,
  studyGuide,
  reportWriter,
  brainstorm,
  academicPaper,
];

export const DOC_TYPE_MAP: Record<string, DocTypeDefinition> = Object.fromEntries(
  DOC_TYPES.map((d) => [d.id, d])
);

export const DOC_CATEGORIES = [
  { id: "strategy", label: "Strategy", icon: "🎯" },
  { id: "writing",  label: "Writing",  icon: "✍️" },
  { id: "planning", label: "Planning", icon: "📋" },
  { id: "research", label: "Research", icon: "🔍" },
  { id: "brainstorm", label: "Brainstorm", icon: "💡" },
] as const;
