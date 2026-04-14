# Hypomnemata Prompt Extraction — Complete Reference
> Extracted from github.com/TheAccidentalTeacher/agentsvercel on March 16, 2026
> For porting into Chapterhouse YouTube Intelligence

---

## TABLE OF CONTENTS
1. [video-content-tools.js — buildQuizPrompt()](#1-buildquizprompt)
2. [video-content-tools.js — buildLessonPlanPrompt()](#2-buildlessonplanprompt)
3. [video-content-tools.js — buildDOKProjectPrompt()](#3-builddokprojectprompt)
4. [video-content-tools.js — getDOKGuidance()](#4-getdokguidance)
5. [video-content-tools.js — Discussion Questions (client-side prompt)](#5-discussion-questions-client-side)
6. [api/video-quiz.js — Full API Route](#6-apivideo-quizjs)
7. [api/video-lesson-plan.js — Full API Route](#7-apivideo-lesson-planjs)
8. [api/video-discussion.js — Full API Route (Bloom's format)](#8-apivideo-discussionjs)
9. [api/video-discussion-questions.js — Full API Route (Bloom's markdown)](#9-apivideo-discussion-questionsjs)
10. [api/video-guided-notes.js — Full API Route (427 lines)](#10-apivideo-guided-notesjs)
11. [api/video-graphic-organizer.js — Full API Route (310 lines)](#11-apivideo-graphic-organizerjs)
12. [api/video-dok-project.js — Full API Route](#12-apivideo-dok-projectjs)
13. [content-tools-ui.js — UI Selection Logic](#13-content-tools-uijs)

---

## 1. buildQuizPrompt()

**File:** `video-content-tools.js` lines 67-161

```js
buildQuizPrompt(mc, sa, tf, fib, difficulty, dokLevel, includeDOK) {
    const dokGuidance = dokLevel ? this.getDOKGuidance(dokLevel) : '';
    const dokInstruction = includeDOK ? '- Label each question with its DOK level (1-4)\n   ' : '';
    
    return `You are an expert educator creating a comprehensive quiz from this YouTube video.

VIDEO INFORMATION:
- Title: ${this.videoTitle}
- Duration: ${this.duration}
- Video ID: ${this.videoId}

TRANSCRIPT:
${this.transcript.substring(0, 8000)} // Truncate if too long

${dokGuidance}

TASK: Create an educational quiz with the following components:

1. MULTIPLE CHOICE QUESTIONS (${mc} questions)
   - 4 answer options for each question
   - Clearly mark the correct answer
   - Include an explanation for why the correct answer is correct
   - Address common misconceptions
   - Vary difficulty: ${difficulty === 'mixed' ? 'Include easy (2), medium (2), and hard (1)' : `All ${difficulty} difficulty`}
   - Reference the timestamp in the video where the answer can be found

2. SHORT ANSWER QUESTIONS (${sa} questions)
   - Open-ended questions requiring synthesis
   - Provide a detailed sample answer (3-5 sentences)
   - Include a grading rubric (key points to look for)
   - Reference relevant timestamps

3. TRUE/FALSE QUESTIONS (${tf} questions)
   - Clear statements that are unambiguously true or false
   - Explain why the statement is true or false
   - Reference supporting content from video

4. FILL-IN-THE-BLANK QUESTIONS (${fib} questions)
   - Key terms or concepts with blanks
   - Provide word bank (include extra distractors)
   - Ensure only one answer makes sense

FORMATTING REQUIREMENTS:
- Return as structured JSON
- ${dokInstruction}Include timestamps for all questions
- Provide detailed explanations
- Include section headers
- For timestamps, use format: "MM:SS"
- Include difficulty rating for each question
- Add teaching notes where helpful

RESPONSE FORMAT:
{
  "title": "Quiz: [Video Title]",
  "videoId": "${this.videoId}",
  "totalQuestions": ${mc + sa + tf + fib},
  "estimatedTime": "30-45 minutes",
  "multipleChoice": [
    {
      "question": "...",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."],
      "correctAnswer": "B",
      "explanation": "...",
      "timestamp": "3:45",
      "difficulty": "medium"
    }
  ],
  "shortAnswer": [
    {
      "question": "...",
      "sampleAnswer": "...",
      "rubric": ["Point 1", "Point 2", "Point 3"],
      "timestamp": "5:20",
      "difficulty": "hard"
    }
  ],
  "trueFalse": [
    {
      "statement": "...",
      "correct": true,
      "explanation": "...",
      "timestamp": "2:10"
    }
  ],
  "fillInBlank": [
    {
      "sentence": "The ____ is responsible for ____.",
      "blanks": ["brain", "thinking"],
      "wordBank": ["brain", "heart", "thinking", "pumping", "breathing"],
      "timestamp": "7:30"
    }
  ]
}

Generate a comprehensive, educationally sound quiz that tests understanding at multiple levels.`;
  }
```

---

## 2. buildLessonPlanPrompt()

**File:** `video-content-tools.js` lines 319-498

```js
buildLessonPlanPrompt(gradeLevel, duration, subject, activities, differentiation) {
    return `You are an expert educator creating a comprehensive lesson plan using this YouTube video as the core instructional content.

VIDEO INFORMATION:
- Title: ${this.videoTitle}
- Duration: ${this.duration}
- Video ID: ${this.videoId}

TRANSCRIPT:
${this.transcript.substring(0, 8000)}

LESSON PARAMETERS:
- Grade Level: ${gradeLevel}
- Lesson Duration: ${duration}
- Subject Area: ${subject}

TASK: Create a complete, ready-to-use lesson plan with these components:

1. LEARNING OBJECTIVES (3-5 objectives)
   - Use Bloom's Taxonomy verbs (understand, analyze, evaluate, create)
   - Make objectives measurable and specific
   - Align to video content
   - Progressive difficulty

2. MATERIALS NEEDED
   - Video link and duration
   - Any handouts/worksheets
   - Technology requirements
   - Additional resources

3. LESSON SEQUENCE
   A. OPENING (10-15 min)
      - Hook/Attention-getter
      - Activate prior knowledge
      - Pre-video activity (KWL chart, anticipation guide, vocabulary preview)
      - Preview key questions

   B. VIDEO VIEWING (${this.duration})
      - Guided viewing strategy
      - Pause points with discussion questions (3-5 pauses)
      - Note-taking template or graphic organizer
      - Active watching techniques

   C. POST-VIDEO DISCUSSION (15-20 min)
      - Key questions to process content
      - Small group or whole class discussion
      - Think-Pair-Share activities
      - Connections to real world

   D. APPLICATION ACTIVITY (15-20 min)
      - Hands-on activity applying concepts
      - Group work or individual task
      - Creative extension

   E. CLOSURE (5-10 min)
      - Summarize key learnings
      - Preview homework/next lesson

4. ASSESSMENT
   - Formative assessment during lesson
   - Summative assessment (quiz, project, essay)
   - Exit ticket question
   - Homework assignment

${differentiation ? `5. DIFFERENTIATION
   - For struggling learners (scaffolds, simplifications)
   - For advanced learners (extensions, enrichment)
   - For ELL students (vocabulary support, visuals)
   - For different learning styles (visual, auditory, kinesthetic)` : ''}

6. EXTENSION IDEAS
   - Related topics to explore
   - Additional resources
   - Cross-curricular connections

RESPONSE FORMAT:
{
  "title": "Lesson Plan: [Video Title]",
  "gradeLevel": "${gradeLevel}",
  "duration": "${duration}",
  "subject": "${subject}",
  "objectives": ["...", "...", "..."],
  "materials": ["...", "..."],
  "lessonSequence": {
    "opening": {
      "duration": "10 min",
      "hook": "...",
      "priorKnowledge": "...",
      "preVideoActivity": "..."
    },
    "videoViewing": {
      "duration": "${this.duration}",
      "strategy": "...",
      "pausePoints": [
        {
          "timestamp": "3:45",
          "question": "...",
          "purpose": "Check understanding"
        }
      ],
      "noteStrategy": "Cornell notes / Guided notes"
    },
    "discussion": {
      "duration": "15 min",
      "questions": [
        "...",
        "..."
      ],
      "activities": [
        "Think-Pair-Share: ...",
        "Small group discussion: ..."
      ]
    },
    "application": {
      "duration": "15 min",
      "activity": {
        "name": "...",
        "description": "...",
        "grouping": "pairs/groups/individual",
        "materials": "..."
      }
    },
    "closure": {
      "duration": "5 min",
      "exitTicket": "...",
      "summary": "...",
      "homework": "..."
    }
  },
  
  "assessment": {
    "formative": ["...", "..."],
    "summative": "...",
    "exitTicket": "...",
    "homework": "..."
  },
  
  ${differentiation ? `"differentiation": {
    "strugglingLearners": ["...", "..."],
    "advancedLearners": ["...", "..."],
    "ellStudents": ["...", "..."],
    "learningStyles": {
      "visual": "...",
      "auditory": "...",
      "kinesthetic": "..."
    }
  },` : ''}
  
  "extensions": [
    "...",
    "..."
  ]
}

Create a detailed, practical lesson plan that a teacher could use immediately.`;
  }
```

---

## 3. buildDOKProjectPrompt()

**File:** `video-content-tools.js` lines 768-873

```js
buildDOKProjectPrompt(dokLevel, projectType, duration, gradeLevel, subject) {
    const dokDescription = dokLevel === 3 
      ? 'DOK 3 (Strategic Thinking): Requires reasoning, planning, using evidence, and abstract thinking. Students make complex inferences and support with evidence.'
      : 'DOK 4 (Extended Thinking): Requires investigation over time, complex reasoning, multiple sources, and real-world application. Students design, connect, synthesize, and apply.';

    return `You are an expert educator creating a ${dokDescription} project based on this YouTube video.

VIDEO INFORMATION:
- Title: ${this.videoTitle}
- Duration: ${this.duration}
- Video ID: ${this.videoId}

TRANSCRIPT:
${this.transcript.substring(0, 8000)}

PROJECT PARAMETERS:
- DOK Level: ${dokLevel}
- Project Type: ${projectType}
- Duration: ${duration}
- Grade Level: ${gradeLevel}
- Subject: ${subject}

TASK: Create an extended project that requires students to:

${dokLevel === 3 ? `
DOK 3 REQUIREMENTS (Strategic Thinking):
- Analyze complex information from the video
- Develop logical arguments using evidence
- Draw conclusions based on reasoning
- Solve non-routine problems
- Explain thinking and reasoning
- Cite evidence to support conclusions
- Make connections across concepts
- Use abstract thinking
` : `
DOK 4 REQUIREMENTS (Extended Thinking):
- Conduct extended research beyond the video (multiple sources)
- Synthesize information from diverse sources
- Apply knowledge to real-world situations
- Design solutions to complex problems
- Develop original work (research paper, presentation, product)
- Critique and evaluate multiple perspectives
- Connect across disciplines
- Demonstrate metacognitive thinking
- Work extended over time (multiple sessions)
`}

PROJECT COMPONENTS:

1. DRIVING QUESTION
   - Central question that requires ${dokLevel === 3 ? 'strategic thinking' : 'extended investigation'}
   - Open-ended, no single right answer
   - Grounded in video content but extends beyond it

2. LEARNING OBJECTIVES
   - What students will understand deeply
   - What skills they will develop
   - What they will be able to do at the end

3. PROJECT OVERVIEW
   - Clear description of the project
   - Connection to video content
   - Why this matters (real-world relevance)
   - ${dokLevel === 4 ? 'Timeline breakdown (week-by-week)' : 'Multi-day sequence'}

4. REQUIRED TASKS
   - ${dokLevel === 3 ? '5-7 strategic thinking tasks' : '8-10 extended thinking tasks'}
   - Each task must require ${dokLevel === 3 ? 'reasoning and evidence' : 'research, synthesis, and application'}
   - Mix of individual and collaborative work
   - Scaffolded progression (build complexity)

5. DELIVERABLES
   - What students will create/produce
   - Format options (research paper, presentation, product, performance, etc.)
   - Quality criteria for each deliverable

6. ASSESSMENT RUBRIC
   - DOK ${dokLevel} criteria
   - Evidence of strategic/extended thinking
   - Quality of reasoning and evidence
   - Depth of analysis
   - Real-world application
   - 4-point scale (Exemplary, Proficient, Developing, Beginning)

7. RESOURCES & MATERIALS
   - Starting point: This video
   - Additional resources students should explore
   - Tools/technology needed
   - Community resources (if applicable)

8. DIFFERENTIATION
   - Scaffolds for struggling learners
   - Extensions for advanced learners
   - Multiple means of expression
   - Choice in topic/format where appropriate

9. CONNECTION TO STANDARDS
   - Which academic standards this addresses
   - Cross-curricular connections

10. REFLECTION PROMPTS
    - Metacognitive questions for students
    - Process reflection (what worked, what was challenging)
    - Learning growth documentation

RESPONSE FORMAT: Return as structured JSON with all components above.`;
  }
```

---

## 4. getDOKGuidance()

**File:** `video-content-tools.js` lines 1029-1048

```js
getDOKGuidance(level) {
    const dokDescriptions = {
      1: `DOK 1 (Recall & Reproduction): Questions should require students to recall facts, definitions, or simple procedures. Focus on what students can remember or recognize directly from the video.`,
      2: `DOK 2 (Skills & Concepts): Questions should require students to make decisions, organize information, compare/contrast, or apply concepts. Go beyond simple recall to basic application.`,
      3: `DOK 3 (Strategic Thinking): Questions should require reasoning, planning, using evidence, and abstract thinking. Students must justify answers, cite evidence, analyze complex relationships, and draw conclusions.`,
      4: `DOK 4 (Extended Thinking): Questions should require investigation over time, synthesis of multiple sources, real-world application, and original thought. These are project-based, requiring extended work beyond this single video.`
    };

    return `DEPTH OF KNOWLEDGE (DOK) FRAMEWORK - TARGET LEVEL ${level}:

${dokDescriptions[level]}

IMPORTANT: All questions should be at DOK Level ${level}. Ensure questions require this level of cognitive demand.

DOK Level Indicators:
- DOK 1: Define, list, identify, recall, recognize, tell, who/what/when/where
- DOK 2: Compare, contrast, classify, organize, estimate, summarize, interpret
- DOK 3: Analyze, explain why, draw conclusions, support with evidence, hypothesize, investigate
- DOK 4: Design, connect across disciplines, synthesize, apply to real world, critique, create original work
`;
  }
```

---

## 5. Discussion Questions (Client-Side Prompt)

**File:** `video-content-tools.js` lines 614-664

```js
async generateDiscussionQuestions(options = {}) {
    const {
      numPerLevel = 3,
      includeSocratic = true,
      includeDebate = true
    } = options;

    const prompt = `Generate thought-provoking discussion questions from this video, organized by Bloom's Taxonomy levels.

VIDEO: ${this.videoTitle}
TRANSCRIPT: ${this.transcript.substring(0, 8000)}

Create ${numPerLevel} questions at each level:
1. Remember/Recall
2. Understand/Comprehension
3. Apply/Application
4. Analyze/Analysis
5. Evaluate/Evaluation
6. Create/Synthesis

${includeSocratic ? 'Include Socratic questioning techniques (probing assumptions, exploring implications).' : ''}
${includeDebate ? 'Include 2-3 debate-worthy questions with no clear right answer.' : ''}

Return as JSON with structure for each question: question, level, purpose, follow-ups.`;
    // ...calls /api/video-discussion
}
```

---

## 6. api/video-quiz.js — Full API Route

**File:** `api/video-quiz.js` (114 lines)

```js
import Anthropic from '@anthropic-ai/sdk';
import { withCors, withAuth, sendError, sendSuccess } from './_shared.js';

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (withCors(req, res)) return;
  const user = await withAuth(req, res);
  if (!user) return;

  if (req.method !== 'POST') {
    return sendError(res, 405, 'Method not allowed');
  }

  try {
    const { videoId, videoTitle, transcript, options = {} } = req.body;

    if (!videoId || !transcript) {
      return sendError(res, 400, 'Missing required fields: videoId, transcript');
    }

    console.log('🎯 Generating quiz for video:', videoId);

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    const numMC = options.numMultipleChoice || 5;
    const numSA = options.numShortAnswer || 3;
    const numTF = options.numTrueFalse || 5;
    const numFIB = options.numFillInBlank || 5;

    const userPrompt = `Create a comprehensive quiz based on this video content.

**VIDEO:** ${videoTitle}

**CONTENT:**
${transcript}

Create a quiz with:
- ${numMC} Multiple Choice questions (4 options each, mark correct answer)
- ${numTF} True/False questions
- ${numFIB} Fill-in-the-Blank questions (use _____ for blanks)
- ${numSA} Short Answer questions

Format your response as clean markdown:

# Quiz: ${videoTitle}

## Multiple Choice

**1. [Question text]**
- A) [Option]
- B) [Option]
- C) [Option]
- D) [Option]

*Correct Answer: [Letter]*

(Repeat for all multiple choice)

## True or False

**1. [Statement]**
*Answer: True/False*

(Repeat for all T/F)

## Fill in the Blank

**1. [Sentence with _____ for the blank]**
*Answer: [correct word/phrase]*

(Repeat for all fill-in-blank)

## Short Answer

**1. [Question requiring a brief explanation]**
*Sample Answer: [2-3 sentence answer]*

(Repeat for all short answer)

---
## Answer Key
(List all answers in order for easy grading)`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      temperature: 0.7,
      messages: [{ role: 'user', content: userPrompt }]
    });

    const markdown = message.content[0].text;
    console.log('✅ Quiz generated successfully');

    return sendSuccess(res, {
      markdown,
      videoId,
      videoTitle
    });

  } catch (error) {
    console.error('❌ Error generating quiz:', error);
    return sendError(res, 500, 'Failed to generate quiz', error.message);
  }
}
```

---

## 7. api/video-lesson-plan.js — Full API Route

**File:** `api/video-lesson-plan.js` (143 lines)

The API route prompt (server-side, used when the client sends a summary instead of the buildLessonPlanPrompt):

```js
// The lesson plan route receives the prompt from the client side (buildLessonPlanPrompt)
// OR generates its own markdown-format prompt. The server-side fallback prompt format:

`Create a comprehensive lesson plan for a ${gradeLevel} ${subject} class using this video.

**VIDEO:** ${videoTitle}
**DURATION:** ${duration}

**CONTENT:**
${transcript}

Format as clean markdown:

# Lesson Plan: ${videoTitle}

## Learning Objectives
1. Students will be able to [objective 1]
2. Students will be able to [objective 2]
3. Students will be able to [objective 3]

## Materials Needed
- [Materials list]

## Lesson Sequence

### 🎬 Opening (10 minutes)
[Hook activity to engage students and activate prior knowledge]

### 📺 Video Viewing (${duration})
**Pre-viewing:**
- [Pre-viewing questions or focus areas]

**During viewing:**
- [Note-taking instructions]

**After viewing:**
- [Reflection prompt]

### 📝 Guided Practice (10-15 minutes)
[Activity where teacher guides students through applying concepts]

### 🎓 Independent Practice (10 minutes)
[Activity students complete on their own]

### 🔄 Closure (5 minutes)
[Summarization activity, exit ticket, or reflection]

## Assessment
**Formative:**
- [How you'll check understanding during the lesson]

**Summative:**
- [End-of-lesson assessment]

## Differentiation

### For Struggling Learners:
- [Accommodations and supports]

### For Advanced Learners:
- [Extensions and challenges]

### For English Language Learners:
- [Language supports]

## Extension Activities
1. [Optional follow-up activity]
2. [Optional homework]

---
*Lesson plan generated from video content*`
```

**Claude settings:** `model: 'claude-sonnet-4-6', max_tokens: 4000, temperature: 0.7`

---

## 8. api/video-discussion.js — Full API Route (Bloom's Format)

**File:** `api/video-discussion.js` (117 lines)

```js
import Anthropic from '@anthropic-ai/sdk';
import { withCors, withAuth, sendError, sendSuccess } from './_shared.js';

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (withCors(req, res)) return;
  const user = await withAuth(req, res);
  if (!user) return;

  if (req.method !== 'POST') {
    return sendError(res, 405, 'Method not allowed');
  }

  try {
    const { videoId, videoTitle, transcript, prompt, options, format } = req.body;

    if (!videoId || !transcript) {
      return sendError(res, 400, 'Missing required fields: videoId, transcript');
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    // Handle 'blooms' format (merged from video-discussion-questions.js)
    if (format === 'blooms') {
      const opts = options || {};
      const numPerLevel = opts.numPerLevel || 3;
      const includeSocratic = opts.includeSocratic !== false;
      const includeDebate = opts.includeDebate !== false;

      const bloomsPrompt = `Create comprehensive discussion questions based on this video content.

**VIDEO:** ${videoTitle}

**CONTENT:**
${transcript}

Generate discussion questions organized by Bloom's Taxonomy levels. For each level, create ${numPerLevel} thought-provoking questions.

Format your response as clean markdown with these sections:
- 🧠 Remember (Recall Facts)
- 📖 Understand (Comprehension)
- 🔧 Apply (Use Knowledge)
- 🔍 Analyze (Break Down)
- ⚖️ Evaluate (Judge/Justify)
- 💡 Create (Synthesize New Ideas)
${includeSocratic ? '- 🏛️ Socratic Questions (3 deep probing questions that challenge assumptions)' : ''}
${includeDebate ? '- 🎭 Debate Topics (2 debatable topics with context for both sides)' : ''}

Number all questions within each section. End with a note about progression from basic recall to higher-order thinking.`;

      const bloomsMsg = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4000,
        temperature: 0.8,
        messages: [{ role: 'user', content: bloomsPrompt }]
      });

      const markdown = bloomsMsg.content[0].text;
      return sendSuccess(res, { markdown, videoId, videoTitle });
    }

    // Default JSON format (original endpoint)
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 16000,
      temperature: 0.8,
      system: `You are an expert educator specializing in Socratic questioning and facilitating meaningful classroom discussions. You create questions that:
- Progress through Bloom's Taxonomy (remember → understand → apply → analyze → evaluate → create)
- Encourage critical thinking and deeper understanding
- Connect to students' lives and experiences
- Promote respectful debate and multiple perspectives
- Support classical education's emphasis on dialectic (logic) stage
- Foster intellectual curiosity

Return your response ONLY as valid JSON matching the requested structure. Do not include markdown formatting or code blocks.`,
      messages: [{ role: 'user', content: prompt }]
    });

    const responseText = message.content[0].text;
    let questions;
    try {
      questions = JSON.parse(responseText);
    } catch (e) {
      const jsonMatch = responseText.match(/```json\n([\s\S]+?)\n```/) || 
                       responseText.match(/```\n([\s\S]+?)\n```/);
      if (jsonMatch) {
        questions = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Failed to parse JSON from response');
      }
    }
    return sendSuccess(res, questions);

  } catch (error) {
    console.error('❌ Error generating discussion questions:', error);
    return sendError(res, 500, 'Failed to generate discussion questions', error.message);
  }
}
```

---

## 9. api/video-discussion-questions.js — Full API Route (Bloom's Markdown)

**File:** `api/video-discussion-questions.js` (134 lines)

```js
import Anthropic from '@anthropic-ai/sdk';
import { withCors, withAuth, sendError, sendSuccess } from './_shared.js';

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (withCors(req, res)) return;
  const user = await withAuth(req, res);
  if (!user) return;

  if (req.method !== 'POST') {
    return sendError(res, 405, 'Method not allowed');
  }

  try {
    const { videoId, videoTitle, transcript, options = {} } = req.body;

    if (!videoId || !transcript) {
      return sendError(res, 400, 'Missing required fields: videoId, transcript');
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    const numPerLevel = options.numPerLevel || 3;
    const includeSocratic = options.includeSocratic !== false;
    const includeDebate = options.includeDebate !== false;

    const userPrompt = `Create comprehensive discussion questions based on this video content.

**VIDEO:** ${videoTitle}

**CONTENT:**
${transcript}

Generate discussion questions organized by Bloom's Taxonomy levels. For each level, create ${numPerLevel} thought-provoking questions.

Format your response as clean markdown:

# Discussion Questions: ${videoTitle}

## 🧠 Remember (Recall Facts)
Questions that ask students to recall specific information from the video.

**1.** [Question]
**2.** [Question]
**3.** [Question]

## 📖 Understand (Comprehension)
Questions that check if students grasp the main concepts and can explain them.

**1.** [Question]
**2.** [Question]
**3.** [Question]

## 🔧 Apply (Use Knowledge)
Questions that ask students to apply what they learned to new situations.

**1.** [Question]
**2.** [Question]
**3.** [Question]

## 🔍 Analyze (Break Down)
Questions that require students to examine relationships, compare/contrast, or identify patterns.

**1.** [Question]
**2.** [Question]
**3.** [Question]

## ⚖️ Evaluate (Judge/Justify)
Questions that ask students to make judgments, defend positions, or assess value.

**1.** [Question]
**2.** [Question]
**3.** [Question]

## 💡 Create (Synthesize New Ideas)
Questions that challenge students to propose solutions, design something new, or imagine alternatives.

**1.** [Question]
**2.** [Question]
**3.** [Question]

${includeSocratic ? `
## 🏛️ Socratic Questions
Deep, probing questions that challenge assumptions and encourage philosophical thinking.

**1.** [Question that challenges a key assumption]
**2.** [Question that explores implications]
**3.** [Question that considers alternative perspectives]
` : ''}

${includeDebate ? `
## 🎭 Debate Topics
Controversial or debatable topics from the video that students can argue multiple sides.

**1.** [Debate topic with brief context for both sides]
**2.** [Debate topic with brief context for both sides]
` : ''}

---
*These questions progress from basic recall to higher-order thinking.*`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      temperature: 0.8,
      messages: [{ role: 'user', content: userPrompt }]
    });

    const markdown = message.content[0].text;
    return sendSuccess(res, { markdown, videoId, videoTitle });

  } catch (error) {
    console.error('❌ Error generating discussion questions:', error);
    return sendError(res, 500, 'Failed to generate discussion questions', error.message);
  }
}
```

---

## 10. api/video-guided-notes.js — Full API Route (427 lines)

**File:** `api/video-guided-notes.js`

### Handler (lines 0-77)

```js
import Anthropic from '@anthropic-ai/sdk';
import { withCors, withAuth, sendError, sendSuccess } from './_shared.js';

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (withCors(req, res)) return;
  const user = await withAuth(req, res);
  if (!user) return;

  if (req.method !== 'POST') {
    return sendError(res, 405, 'Method not allowed');
  }

  try {
    const { videoData, transcript, noteStyle, gradeLevel, includeReading, includeExitTicket } = req.body;

    if (!transcript || !videoData) {
      return sendError(res, 400, 'Missing required fields: videoData and transcript');
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    const style = noteStyle || 'cornell';
    const grade = gradeLevel || 'middle school';
    const videoTitle = videoData.title || 'Video';

    console.log(`📝 Generating ${style} notes for ${grade}...`);
    console.log(`📝 Transcript length: ${transcript.length} chars`);
    if (includeReading) console.log('📖 Including reading passage');
    if (includeExitTicket) console.log('🎫 Including exit ticket');

    // Build the combined prompt - use full transcript
    let fullPrompt = getStylePrompt(style, videoTitle, grade, transcript);
    
    // Add reading passage request if enabled
    if (includeReading) {
      fullPrompt += getReadingPassagePrompt(videoTitle, grade);
    }
    
    // Add exit ticket request if enabled
    if (includeExitTicket) {
      fullPrompt += getExitTicketPrompt(videoTitle, grade);
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      temperature: 0.7,
      messages: [{ role: 'user', content: fullPrompt }]
    });

    const markdown = message.content[0].text;
    console.log('✅ Guided notes generated');

    return sendSuccess(res, {
      markdown,
      videoTitle,
      noteStyle: style,
      includesReading: includeReading,
      includesExitTicket: includeExitTicket
    });

  } catch (error) {
    console.error('❌ Error generating guided notes:', error);
    return sendError(res, 500, 'Failed to generate guided notes', error.message);
  }
}
```

### getReadingPassagePrompt() (lines 84-131)

```js
function getReadingPassagePrompt(videoTitle, grade) {
  return `

---

## ADDITIONAL REQUEST: INFORMATIONAL READING PASSAGE

After the notes above, create a **3-paragraph informational reading passage** based on the same video content.

**CRITICAL READING LEVEL REQUIREMENTS:**
This reading is for 7th grade students who read BELOW grade level. Write at a 5th-6th grade reading level (Lexile 700-900).

**Readability Guidelines - YOU MUST FOLLOW:**
- Use SHORT sentences (10-15 words average)
- Use SIMPLE, common vocabulary (avoid jargon, define any necessary terms)
- Use HIGH-FREQUENCY words that struggling readers recognize
- Keep paragraphs to 4-6 sentences each
- Use clear topic sentences that state the main idea directly
- Use concrete examples instead of abstract concepts
- Avoid complex sentence structures (no multiple embedded clauses)

**Structure:**
- **Paragraph 1:** Introduction - Hook the reader and introduce the main topic
- **Paragraph 2:** Body - Explain the key concepts, events, or information
- **Paragraph 3:** Conclusion - Summarize the main ideas and their significance

**Formatting:**

---

# 📖 Reading Passage: ${videoTitle}

[Paragraph 1 - Introduction]

[Paragraph 2 - Body with key information]

[Paragraph 3 - Conclusion and significance]

---

Make it engaging, clear, and accessible for ${grade} students who may struggle with grade-level text.`;
}
```

### getExitTicketPrompt() (lines 131-198)

```js
function getExitTicketPrompt(videoTitle, grade) {
  return `

---

## ADDITIONAL REQUEST: DOK 3 EXIT TICKET

After everything above, create **2 DOK Level 3 (Strategic Thinking) exit ticket questions** based on the reading passage.

**WHAT IS DOK 3?**
DOK 3 questions require:
- Reasoning and planning
- Explaining WHY or HOW (not just WHAT)
- Using evidence to support thinking
- Making connections or comparisons
- Drawing conclusions based on multiple pieces of information
- Solving non-routine problems

**DOK 3 is NOT:**
- Simple recall (DOK 1): "What is the capital of Russia?"
- Basic comprehension (DOK 2): "Describe two features of Siberia"

**DOK 3 Examples:**
- "Based on what you read, why might [X] lead to [Y]? Use evidence from the passage."
- "How does [concept A] connect to [concept B]? Explain your reasoning."
- "If [situation changed], how would that affect [outcome]? Support your answer."

**READING LEVEL REQUIREMENTS:**
Write questions at 5th-6th grade reading level:
- Use simple, clear language
- Avoid complex vocabulary in the question itself
- Provide sentence starters to scaffold responses

Format as:

---

# 🎫 Exit Ticket: ${videoTitle}

**Directions:** Answer BOTH questions in complete sentences. Use evidence from the reading to support your answers.

---

**Question 1:** [DOK 3 question requiring reasoning and evidence]

*Sentence starter:* Based on the reading, I think... because...

**Your answer:** _________________________________________________

_________________________________________________

_________________________________________________

---

**Question 2:** [DOK 3 question requiring connections or conclusions]

*Sentence starter:* This connects to... because the passage shows that...

**Your answer:** _________________________________________________

_________________________________________________

_________________________________________________

---

*Remember: Strong answers explain your thinking AND include evidence from the reading!*`;
}
```

### getStylePrompt() — All 4 Styles (lines 204-427)

```js
function getStylePrompt(style, videoTitle, grade, transcript) {
  const prompts = {
    cornell: `Create Cornell Notes for this video. Use ACTUAL markdown tables.

**VIDEO:** ${videoTitle}
**GRADE:** ${grade}

**TRANSCRIPT:**
${transcript}

**OUTPUT FORMAT - Use this EXACT structure:**

# Cornell Notes: ${videoTitle}

## Section 1: [Topic]

| Questions | Notes |
|-----------|-------|
| What is...? | Main point here |
| Why does...? | Explanation here |
| How does...? | Details here |

**Key Terms:** term1 - definition; term2 - definition

---

## Section 2: [Topic]

| Questions | Notes |
|-----------|-------|
| Question? | Notes |
| Question? | Notes |

**Key Terms:** term - definition

---

(Create 4-6 sections total)

## Summary
[2-3 sentences summarizing main ideas]

IMPORTANT: Use | Question | Notes | tables for each section. Not bullet lists.`,

    outline: `Create a Hierarchical Outline based on this video content.

**VIDEO:** ${videoTitle}
**GRADE LEVEL:** ${grade}

**CONTENT:**
${transcript}

Format as a clean markdown outline:

# Outline: ${videoTitle}

## I. [First Main Topic]
   A. [Subtopic]
      1. [Detail]
      2. [Detail]
   B. [Subtopic]
      1. [Detail]
         a. [Sub-detail]
         b. [Sub-detail]
      2. [Detail]

## II. [Second Main Topic]
   A. [Subtopic]
      1. [Detail]
      2. [Detail]
   B. [Subtopic]

## III. [Third Main Topic]
   A. [Subtopic]
   B. [Subtopic]

(Continue with all major topics from the video)

---

### 📌 Key Takeaways
1. [Most important point]
2. [Second most important point]
3. [Third most important point]

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
*Guided questions help you actively engage with video content.*`
  };

  return prompts[style] || prompts.cornell;
}
```

---

## 11. api/video-graphic-organizer.js — Full API Route (310 lines)

**File:** `api/video-graphic-organizer.js`

### Handler (lines 0-101)

```js
import Anthropic from '@anthropic-ai/sdk';
import { withCors, withAuth, sendError, sendSuccess } from './_shared.js';

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (withCors(req, res)) return;
  const user = await withAuth(req, res);
  if (!user) return;

  if (req.method !== 'POST') {
    return sendError(res, 405, 'Method not allowed');
  }

  try {
    const { videoId, videoTitle, videoData, transcript, organizerType, gradeLevel, includeReading, includeExitTicket } = req.body;

    const title = videoTitle || videoData?.title || 'Video';
    const id = videoId || videoData?.videoId || 'unknown';
    const type = organizerType || 'Concept Map';
    const grade = gradeLevel || 'middle school';

    console.log('[Graphic Organizer] Request received:', { type, grade, title });
    if (includeReading) console.log('📖 Including reading passage');
    if (includeExitTicket) console.log('🎫 Including exit ticket');

    if (!transcript || transcript.length === 0) {
      return sendError(res, 400, 'Transcript is required');
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    });

    // Prepare transcript text
    let transcriptText;
    if (Array.isArray(transcript)) {
      transcriptText = transcript.map(t => `[${t.timestamp}] ${t.text}`).join('\n');
    } else if (typeof transcript === 'string') {
      transcriptText = transcript;
    } else {
      return sendError(res, 400, 'Invalid transcript format');
    }

    // Build the combined prompt
    let userPrompt = `Create a ${type} graphic organizer based on this video content.

**VIDEO:** ${title}
**GRADE LEVEL:** ${grade}
**ORGANIZER TYPE:** ${type}

**CONTENT:**
${transcriptText}

Create a detailed ${type} in markdown format that helps students visualize the key concepts and relationships.

${getOrganizerInstructions(type)}

Format your response as clean, printable markdown that teachers can use directly.`;

    // Add reading passage request if enabled
    if (includeReading) {
      userPrompt += getReadingPassagePrompt(title, grade);
    }
    
    // Add exit ticket request if enabled
    if (includeExitTicket) {
      userPrompt += getExitTicketPrompt(title, grade);
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 6000,
      temperature: 0.7,
      messages: [{ role: 'user', content: userPrompt }]
    });

    const markdown = message.content[0].text;
    console.log('✅ Graphic organizer generated');

    return sendSuccess(res, {
      markdown,
      videoId: id,
      videoTitle: title,
      organizerType: type,
      includesReading: includeReading,
      includesExitTicket: includeExitTicket
    });

  } catch (error) {
    console.error('❌ Error generating graphic organizer:', error);
    return sendError(res, 500, 'Failed to generate graphic organizer', error.message);
  }
}
```

### getReadingPassagePrompt() — Graphic Organizer version (lines 103-139)

```js
function getReadingPassagePrompt(videoTitle, grade) {
  return `

---

## ADDITIONAL REQUEST: INFORMATIONAL READING PASSAGE

After the graphic organizer above, create a **3-paragraph informational reading passage** based on the same video content.

**Requirements:**
- Write at an accessible reading level (approximately 5th-6th grade Lexile level)
- Designed for struggling readers who need scaffolded text
- **Paragraph 1:** Introduction - Hook the reader and introduce the main topic
- **Paragraph 2:** Body - Explain the key concepts, events, or information
- **Paragraph 3:** Conclusion - Summarize the main ideas and their significance

**Formatting:**
\`\`\`
---

# 📖 Reading Passage: ${videoTitle}

[Paragraph 1 - Introduction]

[Paragraph 2 - Body with key information]

[Paragraph 3 - Conclusion and significance]

---
\`\`\`

Make it engaging, clear, and accessible for ${grade} students who may struggle with grade-level text.`;
}
```

### getExitTicketPrompt() — Graphic Organizer version (lines 144-181)

```js
function getExitTicketPrompt(videoTitle, grade) {
  return `

---

## ADDITIONAL REQUEST: DOK 3 EXIT TICKET

After everything above, create **2 DOK Level 3 (Strategic Thinking) exit ticket questions** based on the reading passage.

**DOK Level 3 Requirements:**
- Require reasoning, planning, or using evidence
- Ask students to justify, compare, analyze, or evaluate
- Cannot be answered with simple recall - require thinking

**Format:**
\`\`\`
---

# 🎫 Exit Ticket: ${videoTitle}

## Question 1 (DOK 3 - Strategic Thinking)
[Open-ended question requiring analysis or evaluation]

**What to look for in student responses:**
[Brief rubric guidance for teachers]

---

## Question 2 (DOK 3 - Strategic Thinking)  
[Open-ended question requiring comparison, justification, or synthesis]

**What to look for in student responses:**
[Brief rubric guidance for teachers]

---
\`\`\`

Make questions appropriate for ${grade} level while maintaining DOK 3 rigor.`;
}
```

### getOrganizerInstructions() — All 6 Types (lines 184-310)

```js
function getOrganizerInstructions(type) {
  const instructions = {
    'Concept Map': `
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

    'Timeline': `
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

    'Venn Diagram': `
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

    'Cause and Effect': `
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

    'KWL Chart': `
# KWL Chart: [Title]

## 🤔 K - What I KNOW
(Prior knowledge about the topic)
- [Known fact 1]
- [Known fact 2]
- [Known fact 3]

## ❓ W - What I WANT to Know
(Questions to explore)
- [Question 1]
- [Question 2]
- [Question 3]

## 📚 L - What I LEARNED
(Key takeaways from the video)
- [Learned fact 1]
- [Learned fact 2]
- [Learned fact 3]`,

    'Mind Map': `
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

(Continue for all major branches)`
  };

  return instructions[type] || instructions['Concept Map'];
}
```

---

## 12. api/video-dok-project.js — Full API Route

**File:** `api/video-dok-project.js` (147 lines)

```js
import Anthropic from '@anthropic-ai/sdk';
import { withCors, withAuth, sendError, sendSuccess } from './_shared.js';

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  // ... auth + validation ...
  
  const { videoId, videoTitle, transcript, options = {} } = req.body;
  const dokLevel = options.dokLevel || 3;
  const projectType = options.projectType || 'research';
  const duration = options.duration || '2-3 weeks';
  const gradeLevel = options.gradeLevel || '9-12';
  
  const dokDescription = dokLevel === 4
    ? 'Extended Thinking - requires investigation, synthesis, real-world application'
    : 'Strategic Thinking - requires reasoning, planning, evidence use, and abstract thinking';

  const userPrompt = `Create a rigorous DOK ${dokLevel} (${dokDescription}) ${projectType} project based on this video content.

**VIDEO:** ${videoTitle}
**DOK LEVEL:** ${dokLevel}
**PROJECT TYPE:** ${projectType}
**DURATION:** ${duration}
**GRADE LEVEL:** ${gradeLevel}

**CONTENT:**
${transcript}

Create a comprehensive project in markdown format:

# DOK ${dokLevel} Project: [Creative Project Title]

## 📋 Project Overview
| | |
|---|---|
| **DOK Level** | ${dokLevel} - ${dokLevel === 4 ? 'Extended Thinking' : 'Strategic Thinking'} |
| **Type** | ${projectType.charAt(0).toUpperCase() + projectType.slice(1)} |
| **Duration** | ${duration} |
| **Grade Level** | ${gradeLevel} |

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

(... continues with rubric, resources, differentiation, reflection ...)`;

  // Claude settings: model: 'claude-sonnet-4-6', max_tokens: 4000, temperature: 0.7
}
```

---

## 13. content-tools-ui.js — UI Selection Logic

**File:** `content-tools-ui.js`

### Grade Level Selection (4 bands — used across all tools)

```js
const gradeLevels = {
  '1': 'elementary school',
  '2': 'middle school',
  '3': 'high school',
  '4': 'college'
};

const gradeChoice = prompt('Select Grade Level:\n1. Elementary School (K-5)\n2. Middle School (6-8)\n3. High School (9-12)\n4. College\n\nEnter number (1-4):', '2');
const gradeLevel = gradeLevels[gradeChoice] || 'middle school';
```

### Note Style Selection (4 styles)

```js
const noteStyles = { '1': 'cornell', '2': 'outline', '3': 'fillinblank', '4': 'guided' };

const styleChoice = prompt('Select Note Style:\n1. Cornell Notes (questions + notes + summary)\n2. Outline (hierarchical structure)\n3. Fill-in-the-Blank (worksheets)\n4. Guided Questions (content + questions)\n\nEnter number (1-4):', '1');
const noteStyle = noteStyles[styleChoice] || 'cornell';
```

### Graphic Organizer Type Selection (6 types)

```js
const organizerTypes = {
  '1': 'Concept Map',
  '2': 'Timeline',
  '3': 'Venn Diagram',
  '4': 'Cause and Effect',
  '5': 'KWL Chart',
  '6': 'Mind Map'
};

const typeChoice = prompt('Select Graphic Organizer Type:\n1. Concept Map (central idea with connections)\n2. Timeline (chronological events)\n3. Venn Diagram (compare/contrast)\n4. Cause and Effect (relationships)\n5. KWL Chart (Know, Want, Learned)\n6. Mind Map (branching topics)\n\nEnter number (1-6):', '1');
const organizerType = organizerTypes[typeChoice] || 'Concept Map';
```

### Reading Passage Toggle

```js
const includeReadingChoice = prompt('Include a 3-paragraph reading passage?\n(Written at accessible reading level for struggling readers)\n\n1. Yes\n2. No\n\nEnter 1 or 2:', '1');
const includeReading = includeReadingChoice === '1';
```

### Exit Ticket Toggle

```js
const includeExitTicketChoice = prompt('Include 2 DOK-3 Exit Ticket questions?\n(Strategic thinking questions based on the content)\n\n1. Yes\n2. No\n\nEnter 1 or 2:', '1');
const includeExitTicket = includeExitTicketChoice === '1';
```

### DOK Level Selection

```js
const dokLevel = prompt('Enter DOK Level (3 for Strategic Thinking, 4 for Extended Thinking):', '3');
```

### DOK Project Type Selection

```js
const projectTypes = {
  '1': 'research',
  '2': 'design',
  '3': 'investigation',
  '4': 'synthesis'
};

const projectTypeChoice = prompt('Select Project Type:\n1. Research\n2. Design\n3. Investigation\n4. Synthesis\n\nEnter number (1-4):', '1');
const projectType = projectTypes[projectTypeChoice] || 'research';
```

### Quiz Default Options (from content-tools-ui.js)

```js
// Default quiz options sent to /api/video-quiz
const options = {
  numMultipleChoice: 5,
  numShortAnswer: 3,
  numTrueFalse: 5,
  numFillInBlank: 5,
  difficulty: 'mixed',
  includeTimestamps: true
};
```

### Discussion Questions Default Options

```js
// Sent to /api/video-discussion with format: 'blooms'
const options = {
  numPerLevel: 3,
  includeSocratic: true,
  includeDebate: true
};
```

### Vocabulary Default Options

```js
// Sent to /api/video-vocabulary
const options = {
  gradeLevel: gradeLevel,  // from grade level selector
  numTerms: 15
};
```

---

## Claude Model Settings Summary

| Endpoint | Model | Max Tokens | Temperature |
|----------|-------|-----------|-------------|
| video-quiz | claude-sonnet-4-6 | 4000 | 0.7 |
| video-lesson-plan | claude-sonnet-4-6 | 4000 | 0.7 |
| video-discussion | claude-sonnet-4-6 | 16000 (JSON) / 4000 (blooms) | 0.8 |
| video-discussion-questions | claude-sonnet-4-6 | 4000 | 0.8 |
| video-guided-notes | claude-sonnet-4-6 | 4000 | 0.7 |
| video-graphic-organizer | claude-sonnet-4-6 | 6000 | 0.7 |
| video-dok-project | claude-sonnet-4-6 | 4000 | 0.7 |

---

*End of extraction. All prompts are exact text from the codebase as of March 16, 2026.*
