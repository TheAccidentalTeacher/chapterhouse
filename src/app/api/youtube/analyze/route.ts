import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

// =============================================================================
// Zod Schema — expanded with all Hypomnemata sub-options
// =============================================================================
const analyzeSchema = z.object({
  videoId: z.string().min(1),
  videoTitle: z.string().min(1),
  transcript: z.string().min(50),
  outputType: z.enum([
    "quiz",
    "lesson-plan",
    "vocabulary",
    "discussion",
    "dok-project",
    "graphic-organizer",
    "guided-notes",
    "full-analysis",
  ]),
  options: z
    .object({
      // Grade band: elementary | middle | high | college
      gradeLevel: z
        .enum(["elementary", "middle", "high", "college"])
        .optional(),
      // Quiz options
      numMultipleChoice: z.number().min(0).max(20).optional(),
      numShortAnswer: z.number().min(0).max(10).optional(),
      numTrueFalse: z.number().min(0).max(10).optional(),
      numFillInBlank: z.number().min(0).max(10).optional(),
      difficulty: z
        .enum(["easy", "medium", "hard", "mixed"])
        .optional(),
      // DOK
      dokLevel: z.number().min(1).max(4).optional(),
      // Discussion options
      includeSocratic: z.boolean().optional(),
      includeDebate: z.boolean().optional(),
      // Guided Notes style
      noteStyle: z
        .enum(["cornell", "outline", "fillinblank", "guided"])
        .optional(),
      // Graphic organizer type
      organizerType: z
        .enum([
          "concept-map",
          "timeline",
          "venn",
          "cause-effect",
          "kwl",
          "mind-map",
        ])
        .optional(),
      // DOK Project sub-options
      projectType: z
        .enum(["research", "design", "investigation", "synthesis"])
        .optional(),
      duration: z.string().optional(),
      // Add-on toggles (available on guided-notes + graphic-organizer)
      includeReading: z.boolean().optional(),
      includeExitTicket: z.boolean().optional(),
    })
    .optional(),
});

// =============================================================================
// SDK factory
// =============================================================================
function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

// =============================================================================
// Grade label helper
// =============================================================================
const GRADE_LABELS: Record<string, string> = {
  elementary: "elementary school (K-5)",
  middle: "middle school (grades 6-8)",
  high: "high school (grades 9-12)",
  college: "college level",
};

function gradeLabel(g?: string): string {
  return g ? GRADE_LABELS[g] ?? GRADE_LABELS.middle : GRADE_LABELS.middle;
}

// =============================================================================
// DOK guidance helper (injected into quiz/project prompts)
// =============================================================================
function getDOKGuidance(level: number): string {
  const guidance: Record<number, string> = {
    1: `DOK Level 1 — Recall & Reproduction
Verbs: identify, recall, recognize, list, define, name, match, state
Questions test: basic facts, definitions, simple procedures
Example stems: "What is...?", "List the...?", "Define..."`,
    2: `DOK Level 2 — Skill/Concept
Verbs: classify, compare, organize, estimate, interpret, explain, summarize
Questions test: mental processing beyond recall, applying skills
Example stems: "How would you compare...?", "What is the relationship...?"`,
    3: `DOK Level 3 — Strategic Thinking
Verbs: analyze, evaluate, justify, formulate, investigate, cite evidence
Questions test: reasoning, planning, using evidence, abstract thinking
Example stems: "What evidence supports...?", "How would you prove...?"`,
    4: `DOK Level 4 — Extended Thinking
Verbs: design, synthesize, apply concepts to new situations, create, critique
Questions test: investigation, complex reasoning, planning, developing
Example stems: "Design an experiment that...", "What would happen if...?"`,
  };
  return guidance[level] ?? guidance[3];
}

// =============================================================================
// Reading Passage add-on prompt (appended to guided-notes / graphic-organizer)
// =============================================================================
function getReadingPassagePrompt(videoTitle: string, grade: string): string {
  return `

---

## ADDITIONAL REQUEST: INFORMATIONAL READING PASSAGE

After the content above, create a **3-paragraph informational reading passage** based on the same video content.

**Requirements:**
- Write at an accessible reading level (approximately 5th-6th grade Lexile level, 700-900L)
- Designed for struggling readers who need scaffolded text
- Use shorter sentences and common vocabulary while preserving accuracy
- **Paragraph 1:** Introduction — Hook the reader and introduce the main topic
- **Paragraph 2:** Body — Explain the key concepts, events, or information
- **Paragraph 3:** Conclusion — Summarize the main ideas and their significance

**Formatting:**
---

# 📖 Reading Passage: ${videoTitle}

[Paragraph 1 - Introduction]

[Paragraph 2 - Body with key information]

[Paragraph 3 - Conclusion and significance]

---

Make it engaging, clear, and accessible for ${grade} students who may struggle with grade-level text.`;
}

// =============================================================================
// Exit Ticket add-on prompt (appended to guided-notes / graphic-organizer)
// =============================================================================
function getExitTicketPrompt(videoTitle: string, grade: string): string {
  return `

---

## ADDITIONAL REQUEST: DOK 3 EXIT TICKET

After everything above, create **2 DOK Level 3 (Strategic Thinking) exit ticket questions** based on the content.

**DOK Level 3 Requirements:**
- Require reasoning, planning, or using evidence
- Ask students to justify, compare, analyze, or evaluate
- Cannot be answered with simple recall — require thinking

**Format each question like this:**

---

# 🎫 Exit Ticket: ${videoTitle}

## Question 1 (DOK 3 — Strategic Thinking)
[Open-ended question requiring analysis or evaluation]

**Sentence starters to help you get started:**
- "Based on the evidence..."
- "I can conclude that... because..."
- "Comparing these two ideas shows..."

**What to look for in student responses:**
[Brief rubric guidance for teachers — what a strong, adequate, and weak answer looks like]

---

## Question 2 (DOK 3 — Strategic Thinking)
[Open-ended question requiring comparison, justification, or synthesis]

**Sentence starters to help you get started:**
- "The most significant factor is... because..."
- "If we consider the evidence..."
- "This connects to... in the following way..."

**What to look for in student responses:**
[Brief rubric guidance for teachers]

---

Make questions appropriate for ${grade} level while maintaining DOK 3 rigor.`;
}

// =============================================================================
// Guided Notes style-specific prompts
// =============================================================================
function getStylePrompt(
  style: string,
  videoTitle: string,
  grade: string,
  transcript: string,
): string {
  const prompts: Record<string, string> = {
    cornell: `Create Cornell Notes based on this video content.

**VIDEO:** ${videoTitle}
**GRADE LEVEL:** ${grade}

**CONTENT:**
${transcript}

Format as a clean markdown document:

# Cornell Notes: ${videoTitle}

## Instructions
Fold your paper into two columns. Write questions in the narrow left column and notes in the wider right column.

---

| Cue Questions | Notes |
|---|---|
| What is [concept]? | [Key information with **blanks** for students to fill in] |
| How does [process] work? | [Step-by-step explanation with key terms **blanked**] |
| Why is [topic] important? | [Significance with supporting details] |

(Continue with 10-12 rows covering all major concepts from the video)

---

## Summary
Write a 3-5 sentence summary of the main ideas:

*Today I learned that ____________________________________________.*
*The most important concept was ____________________________________________.*
*This connects to ____________________________________________.*

---
*Cornell Notes help you organize information and create study questions as you learn.*`,

    outline: `Create a Hierarchical Outline based on this video content.

**VIDEO:** ${videoTitle}
**GRADE LEVEL:** ${grade}

**CONTENT:**
${transcript}

Format as a clean markdown outline:

# Outline Notes: ${videoTitle}

## I. [First Major Topic]
   A. [Subtopic]
      1. [Key detail — with one word **blanked** for student to fill]
      2. [Key detail]
         a. [Supporting fact]
         b. [Supporting fact]
   B. [Subtopic]
      1. [Key detail]
      2. [Key detail]

## II. [Second Major Topic]
   A. [Subtopic]
      1. [Key detail with **blank**]
      2. [Key detail]
   B. [Subtopic]
      1. [Key detail]

## III. [Third Major Topic]
(Continue covering all content)

---

## Key Vocabulary
| Term | Definition |
|------|-----------|
| [term] | [student-friendly definition] |

---
*Outlines help you see the structure and hierarchy of information.*`,

    fillinblank: `Create a Fill-in-the-Blank Worksheet based on this video content.

**VIDEO:** ${videoTitle}
**GRADE LEVEL:** ${grade}

**CONTENT:**
${transcript}

Format as a clean markdown worksheet:

# Fill-in-the-Blank: ${videoTitle}

**Instructions:** Use the words from the Word Bank to complete each sentence.

---

## 📚 Word Bank
| | | | |
|---|---|---|---|
| [word1] | [word2] | [word3] | [word4] |
| [word5] | [word6] | [word7] | [word8] |
| [word9] | [word10] | [word11] | [word12] |

---

## Section 1: [Topic]

1. The process of ______________ involves [context clue].

2. According to the video, ______________ is important because [reason].

3. ______________ and ______________ work together to [action].

4. The main difference between ______________ and ______________ is [explanation].

5. Scientists discovered that ______________ when they [context].

---

## Section 2: [Topic]

6. [Another fill-in-blank sentence with clear context clues]
7. [Another sentence]
8. [Another sentence]

(Continue with 15-20 total blanks organized by topic)

---

## ✅ Answer Key

| # | Answer |
|---|--------|
| 1 | [answer] |
| 2 | [answer] |
| 3 | [answer, answer] |
(Continue for all blanks)

---
*Fill-in-the-blank worksheets help reinforce key vocabulary and concepts.*`,

    guided: `Create Guided Questions with content summaries based on this video.

**VIDEO:** ${videoTitle}
**GRADE LEVEL:** ${grade}

**CONTENT:**
${transcript}

Format as clean markdown:

# Guided Questions: ${videoTitle}

**Instructions:** Read each section summary, then answer the questions that follow.

---

## Section 1: [Topic Name] *(0:00 - 3:00)*

### 📖 Content Summary
[2-3 paragraph summary of this section of the video. Include key facts, concepts, and examples mentioned.]

### ❓ Comprehension Questions

1. **Recall:** [Question testing basic recall]

   *Space for answer:* _______________________________________________

2. **Understand:** [Question testing understanding]

   *Space for answer:* _______________________________________________

3. **Apply:** [Question asking students to apply the concept]

   *Space for answer:* _______________________________________________

---

## Section 2: [Topic Name] *(3:00 - 6:00)*

### 📖 Content Summary
[2-3 paragraph summary]

### ❓ Comprehension Questions

1. [Question]
   *Space for answer:* _______________________________________________

2. [Question]
   *Space for answer:* _______________________________________________

3. [Question]
   *Space for answer:* _______________________________________________

---

(Continue for 4-6 sections covering the whole video)

---

## 🎯 Reflection Questions

1. What was the most surprising thing you learned from this video?

2. How does this connect to something you already knew?

3. What questions do you still have after watching?

---
*Guided questions help you actively engage with video content.*`,
  };

  return prompts[style] ?? prompts.cornell;
}

// =============================================================================
// Graphic Organizer type-specific instructions
// =============================================================================
function getOrganizerInstructions(type: string): string {
  const instructions: Record<string, string> = {
    "concept-map": `
# Concept Map: [Title]

## 🎯 Central Concept
**[Main Topic]**

## 🔗 Connected Concepts

### Branch 1: [Subtopic]
- Key idea 1
- Key idea 2
  - Supporting detail
  - Supporting detail

### Branch 2: [Subtopic]
- Key idea 1
- Key idea 2

(Continue with all major branches)

## 📝 Relationships
- [Concept A] → relates to → [Concept B] because...
- [Concept C] → leads to → [Concept D] because...`,

    timeline: `
# Timeline: [Title]

## 📅 Chronological Events

| Time/Date | Event | Significance |
|-----------|-------|--------------|
| [time] | [event] | [why it matters] |

## Detailed Timeline

### ⏱️ [Time 1]: [Event]
**What happened:** [Description]
**Why it matters:** [Significance]

(Continue for each major event)`,

    venn: `
# Venn Diagram: Comparing [Topic A] and [Topic B]

## 🔵 [Topic A] Only
- Unique characteristic 1
- Unique characteristic 2
- Unique characteristic 3

## 🟡 Both [Topic A] AND [Topic B]
- Shared characteristic 1
- Shared characteristic 2
- Shared characteristic 3

## 🔴 [Topic B] Only
- Unique characteristic 1
- Unique characteristic 2
- Unique characteristic 3`,

    "cause-effect": `
# Cause and Effect: [Title]

## 🔄 Cause-Effect Relationships

### Cause 1: [What happened]
**Effects:**
- → Effect 1
- → Effect 2
- → Effect 3

### Cause 2: [What happened]
**Effects:**
- → Effect 1
- → Effect 2

## 📊 Chain Reactions
[Event A] → leads to → [Event B] → leads to → [Event C]`,

    kwl: `
# KWL Chart: [Title]

## 🤔 K — What I KNOW
(Prior knowledge about the topic)
- [Known fact 1]
- [Known fact 2]
- [Known fact 3]

## ❓ W — What I WANT to Know
(Questions to explore)
- [Question 1]
- [Question 2]
- [Question 3]

## 📚 L — What I LEARNED
(Key takeaways from the video)
- [Learned fact 1]
- [Learned fact 2]
- [Learned fact 3]`,

    "mind-map": `
# Mind Map: [Title]

## 🧠 Central Topic
**[Main Subject]**

---

## Branch 1: [Major Theme]
- Sub-idea 1.1
  - Detail
  - Detail
- Sub-idea 1.2
- Sub-idea 1.3

## Branch 2: [Major Theme]
- Sub-idea 2.1
- Sub-idea 2.2
  - Detail
  - Detail

(Continue for all major branches)`,
  };

  return instructions[type] ?? instructions["concept-map"];
}

// =============================================================================
// Main prompt builder
// =============================================================================
type AnalyzeOptions = z.infer<typeof analyzeSchema>["options"];

function buildPrompt(
  outputType: string,
  videoTitle: string,
  transcript: string,
  opts?: AnalyzeOptions,
): string {
  const grade = gradeLabel(opts?.gradeLevel);
  const o = opts ?? {};

  switch (outputType) {
    // ------------------------------------------------------------------
    // QUIZ — rich format with configurable question counts, DOK, difficulty
    // ------------------------------------------------------------------
    case "quiz": {
      const mc = o.numMultipleChoice ?? 5;
      const sa = o.numShortAnswer ?? 3;
      const tf = o.numTrueFalse ?? 5;
      const fib = o.numFillInBlank ?? 5;
      const diff = o.difficulty ?? "mixed";
      const dokSection = o.dokLevel
        ? `\n\n**DOK Framework:**\n${getDOKGuidance(o.dokLevel)}\nEnsure all questions meet DOK Level ${o.dokLevel} or above.`
        : "";

      return `You are an expert test creator for ${grade} students.

Given this video transcript, create a comprehensive quiz. Difficulty: ${diff}.${dokSection}

Include EXACTLY:
- ${mc} Multiple Choice questions (4 options each: A/B/C/D, mark the correct answer with ✓)
- ${sa} Short Answer questions (require 1-3 sentence responses)
- ${tf} True/False questions (include the correct answer)
- ${fib} Fill-in-the-Blank questions (provide answer key)

Format as clean markdown:

# Quiz: ${videoTitle}
**Grade Level:** ${grade} | **Difficulty:** ${diff}

## Part 1: Multiple Choice (${mc} questions)
1. [Question]
   - A) [option]
   - B) [option]
   - C) [option] ✓
   - D) [option]

## Part 2: Short Answer (${sa} questions)
1. [Question requiring 1-3 sentence response]

## Part 3: True or False (${tf} questions)
1. [Statement] — **True / False**

## Part 4: Fill in the Blank (${fib} questions)
1. [Sentence with _____________ for missing key term]

---

## ✅ Answer Key
(Full answers for all sections)

Questions should progress from recall → understanding → application (Bloom's taxonomy).

Video: "${videoTitle}"

TRANSCRIPT:
${transcript}`;
    }

    // ------------------------------------------------------------------
    // LESSON PLAN — backward design, differentiation, ELL support
    // ------------------------------------------------------------------
    case "lesson-plan":
      return `You are an experienced curriculum designer creating a lesson plan for ${grade} using backward design (Understanding by Design / UbD framework).

Create a comprehensive lesson plan based on this video content.

**VIDEO:** ${videoTitle}
**GRADE LEVEL:** ${grade}
**DURATION:** ${o.duration ?? "45 minutes"}

**CONTENT:**
${transcript}

Format as clean markdown with these sections:

# Lesson Plan: [Creative Title]

## 📋 Overview
| | |
|---|---|
| **Subject** | [Subject area] |
| **Grade** | ${grade} |
| **Duration** | ${o.duration ?? "45 minutes"} |
| **Standards** | [CCSS/NGSS/C3 standards] |

## 🎯 Learning Objectives
Students will be able to (SWBAT):
1. [Measurable objective using Bloom's verb — e.g., "Analyze the causes of..."]
2. [Measurable objective]
3. [Measurable objective]

## 📚 Essential Question
[Big, open-ended question that drives inquiry]

## 🧰 Materials Needed
- [Material 1]
- [Material 2]
- Video: "${videoTitle}"

## ⏱️ Lesson Sequence

### Warm-Up / Hook (5 minutes)
[Engaging opening activity or question]

### Direct Instruction (10-15 minutes)
[Key concepts from the video — what the teacher presents/discusses]

### Guided Practice (10 minutes)
[Structured activity students do WITH teacher support]

### Independent Practice (10 minutes)
[Activity students do ON THEIR OWN to demonstrate understanding]

### Closure / Exit Ticket (5 minutes)
[How the lesson wraps up — quick assessment of understanding]

## 🔄 Differentiation

### For Advanced Learners
[Extension activities, deeper questions, acceleration]

### For Struggling Learners
[Scaffolds, modified expectations, support strategies]

### For ELL Students
[Language supports — sentence frames, visual aids, vocabulary pre-teaching, native language resources]

## 📊 Assessment
**Formative:** [How you check understanding during the lesson]
**Summative:** [How you assess mastery after the lesson]

## 📎 Teacher Notes
[Any additional guidance, common misconceptions to address, tips]`;

    // ------------------------------------------------------------------
    // VOCABULARY — Tier 2/3 words, memory tips, flashcard format
    // ------------------------------------------------------------------
    case "vocabulary":
      return `You are a vocabulary specialist for ${grade}.

From this video transcript, extract 15-20 key academic and content-specific vocabulary terms. Focus on:
- **Tier 2 words** (high-utility academic words used across subjects)
- **Tier 3 words** (domain-specific technical vocabulary)

For each term provide:

# Vocabulary: ${videoTitle}

## Key Terms

### 1. [Term]
- **Definition:** [Clear, grade-appropriate definition]
- **Part of Speech:** [noun/verb/adjective/etc.]
- **Context from Video:** "[Quote or paraphrase where it appears in the video]"
- **Student-Friendly Sentence:** [A natural sentence a student might say/write]
- **Related Words:** [Word family members, synonyms, antonyms]
- **Memory Tip:** [Mnemonic device, word root breakdown, or visual association to help remember]

(Repeat for all 15-20 terms, organized alphabetically)

---

## 📋 Flashcard Format
| Term | Definition |
|------|-----------|
| [term] | [brief definition] |

---

## 🎯 Vocabulary Challenge
1. Use 5 of the vocabulary words in a single paragraph about [topic].
2. Create a concept map showing how 3 of the terms relate to each other.
3. Explain [key concept from video] using at least 3 vocabulary words.

Video: "${videoTitle}"

TRANSCRIPT:
${transcript}`;

    // ------------------------------------------------------------------
    // DISCUSSION — Bloom's taxonomy, Socratic + Debate add-ons
    // ------------------------------------------------------------------
    case "discussion": {
      const socratic = o.includeSocratic !== false; // default true
      const debate = o.includeDebate !== false; // default true

      return `You are a Socratic seminar facilitator and discussion leader for ${grade}.

Create rich discussion questions based on this video, organized by all 6 levels of Bloom's Revised Taxonomy.

**VIDEO:** ${videoTitle}
**GRADE LEVEL:** ${grade}

**CONTENT:**
${transcript}

Format as clean markdown:

# Discussion Questions: ${videoTitle}

## Level 1 — Remember (Recall & Recognition)
*Students retrieve relevant knowledge from memory.*
1. [Factual recall question]
   - **Follow-up probe:** [Deeper question if student answers correctly]
2. [Factual recall question]
   - **Follow-up probe:**
3. [Factual recall question]
   - **Follow-up probe:**

## Level 2 — Understand (Explain & Interpret)
*Students construct meaning from information.*
1. [Question asking students to explain in own words]
   - **Follow-up probe:**
2. [Question asking for interpretation]
   - **Follow-up probe:**
3. [Question asking to summarize or paraphrase]
   - **Follow-up probe:**

## Level 3 — Apply (Use in New Situations)
*Students carry out a procedure in a new situation.*
1. [Question connecting concepts to real-world scenarios]
   - **Follow-up probe:**
2. [Question asking to apply a concept to a different context]
   - **Follow-up probe:**
3. [Question asking how this knowledge could be used]
   - **Follow-up probe:**

## Level 4 — Analyze (Break Down & Examine)
*Students break material into parts, determine relationships.*
1. [Question asking to compare/contrast perspectives]
   - **Follow-up probe:**
2. [Question asking to identify assumptions or biases]
   - **Follow-up probe:**
3. [Question asking to examine cause-and-effect]
   - **Follow-up probe:**

## Level 5 — Evaluate (Judge & Justify)
*Students make judgments based on criteria.*
1. [Question asking to judge, critique, or defend a position]
   - **Follow-up probe:**
2. [Question asking to evaluate effectiveness or quality]
   - **Follow-up probe:**

## Level 6 — Create (Design & Produce)
*Students put elements together to form something new.*
1. [Question asking to propose solutions or design alternatives]
   - **Follow-up probe:**
2. [Question asking to create, invent, or hypothesize]
   - **Follow-up probe:**
${
  socratic
    ? `
---

## 🏛️ Socratic Seminar Questions
*These questions have no single right answer — they're designed to generate dialogue.*
1. [Open question that invites multiple perspectives and evidence-based reasoning]
2. [Question that challenges an assumption from the video]
3. [Question that connects the video content to students' lives or current events]`
    : ""
}
${
  debate
    ? `
---

## ⚔️ Debate Prompts
*"Would You Rather" style prompts to generate structured argumentation.*
1. **[Position A] vs [Position B]:** [Frame the debate clearly]
2. **[Position A] vs [Position B]:** [Frame the debate]
3. **[Position A] vs [Position B]:** [Frame the debate]`
    : ""
}`;
    }

    // ------------------------------------------------------------------
    // DOK PROJECT — configurable type, duration, DOK level
    // ------------------------------------------------------------------
    case "dok-project": {
      const dokLvl = o.dokLevel ?? 3;
      const projType = o.projectType ?? "research";
      const dur = o.duration ?? "2-3 weeks";
      const dokDesc =
        dokLvl === 4
          ? "Extended Thinking — requires investigation, synthesis, real-world application"
          : "Strategic Thinking — requires reasoning, planning, evidence use, and abstract thinking";

      return `Create a rigorous DOK ${dokLvl} (${dokDesc}) ${projType} project based on this video content.

**VIDEO:** ${videoTitle}
**DOK LEVEL:** ${dokLvl}
**PROJECT TYPE:** ${projType}
**DURATION:** ${dur}
**GRADE LEVEL:** ${grade}

**CONTENT:**
${transcript}

Create a comprehensive project in markdown format:

# DOK ${dokLvl} Project: [Creative Project Title]

## 📋 Project Overview
| | |
|---|---|
| **DOK Level** | ${dokLvl} — ${dokDesc} |
| **Type** | ${projType.charAt(0).toUpperCase() + projType.slice(1)} |
| **Duration** | ${dur} |
| **Grade Level** | ${grade} |

## 🎯 Essential Question
[Big, open-ended question that drives inquiry]

## 📚 Learning Objectives
Students will:
1. [Objective with Bloom's verb]
2. [Objective with Bloom's verb]
3. [Objective with Bloom's verb]

## 🔍 Project Description
[Detailed description of what students will do, create, or investigate]

## 📅 Project Timeline

### Week 1: Research & Planning
- [ ] Day 1-2: [Task]
- [ ] Day 3-4: [Task]
- [ ] Day 5: [Checkpoint]

### Week 2: Development & Creation
- [ ] Day 1-2: [Task]
- [ ] Day 3-4: [Task]
- [ ] Day 5: [Final submission]

## ✅ Requirements

### Research Component
- [Requirement 1]
- [Requirement 2]

### Analysis Component
- [Requirement 1]
- [Requirement 2]

### Creation/Synthesis Component
- [Requirement 1]
- [Requirement 2]

## 📊 Rubric

| Criteria | Exceeds (4) | Meets (3) | Approaching (2) | Beginning (1) |
|----------|-------------|-----------|-----------------|----------------|
| Research Quality | [descriptor] | [descriptor] | [descriptor] | [descriptor] |
| Analysis Depth | [descriptor] | [descriptor] | [descriptor] | [descriptor] |
| Presentation | [descriptor] | [descriptor] | [descriptor] | [descriptor] |
| DOK Alignment | [descriptor] | [descriptor] | [descriptor] | [descriptor] |

## 🌐 Real-World Connection
[How this project connects to careers, current events, or community issues]

## ♿ Differentiation
- **Advanced:** [Extension challenge]
- **Struggling:** [Scaffolded version]
- **ELL:** [Language supports]

## 💭 Reflection
Students complete after submitting:
1. What was the most challenging part of this project?
2. What would you do differently if you started over?
3. How has your understanding of [topic] changed?`;
    }

    // ------------------------------------------------------------------
    // GRAPHIC ORGANIZER — 6 types, with optional reading + exit ticket
    // ------------------------------------------------------------------
    case "graphic-organizer": {
      const orgType = o.organizerType ?? "concept-map";
      const orgLabel = orgType.replace("-", " ").replace(/\b\w/g, (c) => c.toUpperCase());

      let prompt = `Create a ${orgLabel} graphic organizer based on this video content.

**VIDEO:** ${videoTitle}
**GRADE LEVEL:** ${grade}
**ORGANIZER TYPE:** ${orgLabel}

**CONTENT:**
${transcript}

Create a detailed ${orgLabel} in markdown format that helps students visualize the key concepts and relationships.

${getOrganizerInstructions(orgType)}

Format your response as clean, printable markdown that teachers can use directly.`;

      if (o.includeReading) {
        prompt += getReadingPassagePrompt(videoTitle, grade);
      }
      if (o.includeExitTicket) {
        prompt += getExitTicketPrompt(videoTitle, grade);
      }

      return prompt;
    }

    // ------------------------------------------------------------------
    // GUIDED NOTES — 4 styles, with optional reading + exit ticket
    // ------------------------------------------------------------------
    case "guided-notes": {
      const style = o.noteStyle ?? "cornell";
      let prompt = getStylePrompt(style, videoTitle, grade, transcript);

      if (o.includeReading) {
        prompt += getReadingPassagePrompt(videoTitle, grade);
      }
      if (o.includeExitTicket) {
        prompt += getExitTicketPrompt(videoTitle, grade);
      }

      return prompt;
    }

    // ------------------------------------------------------------------
    // FULL ANALYSIS — multi-perspective expert panel (unchanged)
    // ------------------------------------------------------------------
    case "full-analysis":
      return `You are a panel of education experts analyzing this video for curriculum use at ${grade} level.

Provide a comprehensive analysis from multiple perspectives:

**1. Content Accuracy & Depth**
- Are claims factually accurate?
- What's missing or oversimplified?
- What prerequisite knowledge does a student need?

**2. Pedagogical Value**
- How well does this teach the concepts?
- What learning styles does it serve?
- Engagement level assessment (1–10 with justification)

**3. Standards Alignment**
- Which Common Core / NGSS / C3 standards does this address?
- What standards are partially covered vs fully addressed?

**4. Classroom Integration**
- Best use: direct instruction, flipped classroom, enrichment, or review?
- Recommended pre-viewing and post-viewing activities
- Potential student misconceptions this might create or reinforce

**5. Accessibility & Inclusivity**
- Reading level of any on-screen text
- Cultural sensitivity assessment
- ELL accessibility rating

**6. Verdict**
- Overall rating (A+ to F)
- Use it / Skip it / Use with modifications
- One-paragraph recommendation

Video: "${videoTitle}"

TRANSCRIPT:
${transcript}`;

    default:
      return `Analyze this video transcript for educational use at ${grade} level.\n\nVideo: "${videoTitle}"\n\nTRANSCRIPT:\n${transcript}`;
  }
}

// =============================================================================
// Model + token config per output type
// =============================================================================
type ModelConfig = {
  model: string;
  maxTokens: number;
  temperature: number;
};

function getModelConfig(outputType: string): ModelConfig {
  // All tools use Sonnet for quality — Hypomnemata validated this approach
  switch (outputType) {
    case "quiz":
    case "vocabulary":
      return { model: "claude-sonnet-4-6", maxTokens: 4096, temperature: 0.7 };
    case "discussion":
      return { model: "claude-sonnet-4-6", maxTokens: 4096, temperature: 0.8 };
    case "graphic-organizer":
      return { model: "claude-sonnet-4-6", maxTokens: 6000, temperature: 0.7 };
    case "full-analysis":
      return { model: "claude-sonnet-4-6", maxTokens: 8192, temperature: 0.7 };
    default:
      return { model: "claude-sonnet-4-6", maxTokens: 4096, temperature: 0.7 };
  }
}

// =============================================================================
// Route handler
// =============================================================================
export async function POST(req: Request) {
  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json(
      { error: "ANTHROPIC_API_KEY not configured" },
      { status: 503 },
    );
  }

  try {
    const body = await req.json();
    const parsed = analyzeSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { videoId, videoTitle, transcript, outputType, options } = parsed.data;
    const prompt = buildPrompt(outputType, videoTitle, transcript, options);
    const config = getModelConfig(outputType);

    const response = await getAnthropic().messages.create({
      model: config.model,
      max_tokens: config.maxTokens,
      temperature: config.temperature,
      messages: [{ role: "user", content: prompt }],
    });

    const result = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n\n");

    return Response.json({
      videoId,
      videoTitle,
      outputType,
      content: result,
      model: config.model,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("YouTube analyze error:", error);
    return Response.json(
      { error: "Failed to generate curriculum content" },
      { status: 500 },
    );
  }
}
