import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { z } from "zod";

// --- Zod schema ---
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
      gradeLevel: z.number().min(1).max(12).optional(),
      dokLevel: z.number().min(1).max(4).optional(),
      organizerType: z
        .enum(["timeline", "cause-effect", "venn", "concept-map", "kwl"])
        .optional(),
      duration: z.string().optional(),
    })
    .optional(),
});

// --- SDK factories ---
function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// --- Prompt builders ---

const GRADE_LABEL = (g?: number) =>
  g ? `Grade ${g} (age ${g + 5}–${g + 6})` : "middle school (grades 6–8)";

function buildPrompt(
  outputType: string,
  videoTitle: string,
  transcript: string,
  options?: z.infer<typeof analyzeSchema>["options"],
): string {
  const grade = GRADE_LABEL(options?.gradeLevel);

  const prompts: Record<string, string> = {
    quiz: `You are an expert test creator for ${grade} students.

Given this video transcript, create a comprehensive quiz with:
- 10 multiple choice questions (4 options each, mark the correct answer)
- 5 short answer questions
- 2 extended response questions

Include an answer key at the end. Questions should progress from recall → understanding → application (Bloom's taxonomy).

Video: "${videoTitle}"

TRANSCRIPT:
${transcript}`,

    "lesson-plan": `You are an experienced curriculum designer creating a lesson plan for ${grade}.

Create a complete lesson plan based on this video with:
- **Lesson Title** and **Subject Area**
- **Learning Objectives** (3–5 measurable objectives using Bloom's verbs)
- **Standards Alignment** (reference relevant Common Core / NGSS / C3 standards)
- **Materials Needed**
- **Duration:** ${options?.duration ?? "45 minutes"}
- **Warm-Up / Hook** (5 minutes)
- **Direct Instruction** — key concepts from the video (10–15 minutes)
- **Guided Practice** — structured activity (10 minutes)
- **Independent Practice** — student work (10 minutes)
- **Closure / Exit Ticket** (5 minutes)
- **Differentiation** — modifications for advanced, on-level, and struggling learners
- **Assessment** — formative and summative options

Video: "${videoTitle}"

TRANSCRIPT:
${transcript}`,

    vocabulary: `You are a vocabulary specialist for ${grade}.

From this video transcript, extract 15–20 key academic and content-specific vocabulary terms. For each term provide:
1. **Term**
2. **Definition** (grade-appropriate, clear)
3. **Part of Speech**
4. **Context from Video** (quote or paraphrase where it appears)
5. **Student-Friendly Sentence** (using the word naturally)
6. **Related Words / Word Family**

Organize terms alphabetically. At the end, include a "Flashcard Format" section with just TERM | DEFINITION for easy copying.

Video: "${videoTitle}"

TRANSCRIPT:
${transcript}`,

    discussion: `You are a Socratic seminar facilitator for ${grade}.

Create discussion questions based on this video, organized by Bloom's taxonomy level:

**Level 1 — Remember** (3 questions): Basic recall of facts from the video
**Level 2 — Understand** (3 questions): Explain concepts in own words
**Level 3 — Apply** (3 questions): Connect concepts to real-world situations
**Level 4 — Analyze** (3 questions): Break down arguments, compare perspectives
**Level 5 — Evaluate** (2 questions): Judge, critique, defend positions
**Level 6 — Create** (2 questions): Propose solutions, design alternatives

Include follow-up probes for each question. End with 3 "Would You Rather" debate prompts related to the content.

Video: "${videoTitle}"

TRANSCRIPT:
${transcript}`,

    "dok-project": `You are a project-based learning designer for ${grade}. Target DOK Level: ${options?.dokLevel ?? 3}–4.

Design 3 extended projects based on this video content. Each project should:
- Require ${options?.dokLevel && options.dokLevel >= 3 ? "strategic thinking and extended reasoning" : "skill/concept application"}
- Take 3–5 class periods to complete
- Include clear deliverables and success criteria
- Have a real-world connection
- Include a rubric (4-point scale: Exceeds / Meets / Approaching / Beginning)

For each project provide:
1. **Project Title**
2. **Essential Question**
3. **DOK Level Justification**
4. **Task Description** (detailed student-facing instructions)
5. **Required Resources**
6. **Timeline** (day-by-day breakdown)
7. **Rubric**
8. **Extension / Challenge** for advanced students

Video: "${videoTitle}"

TRANSCRIPT:
${transcript}`,

    "graphic-organizer": `You are an instructional designer for ${grade}.

Create ${options?.organizerType ? `a ${options.organizerType.replace("-", "/")}` : "multiple types of"} graphic organizer(s) based on this video content.

${
  options?.organizerType
    ? ""
    : `Include ALL of these types:
1. **Timeline** — key events/concepts in chronological or logical order
2. **Cause & Effect** — identify 3–5 cause/effect relationships from the content
3. **Concept Map** — central concept with branching sub-concepts and connections
4. **KWL Chart** — What I Know, What I Want to Know, What I Learned`
}

For each organizer:
- Provide the structure in text/markdown format (ASCII tables or structured lists)
- Include 2–3 filled-in examples as models
- Leave remaining spaces blank for students to complete
- Add teacher notes on how to use it

Video: "${videoTitle}"

TRANSCRIPT:
${transcript}`,

    "guided-notes": `You are a study skills specialist for ${grade}.

Create comprehensive guided notes for this video. Include:

**1. Cornell Notes Template**
- Left column: Cue questions (10–12 questions that guide attention)
- Right column: Key notes with blanks for students to fill during viewing
- Bottom: Summary space with sentence starters

**2. Structured Outline**
- Main topics with Roman numerals
- Sub-points with letters
- Key details with numbers
- Fill-in-the-blank format (remove 1–2 key words per point)

**3. Timestamp Reference Guide**
- [MM:SS] markers for where key concepts appear in the video
- Students can rewind to these points for review

**4. Quick Review**
- 5 "True or False" statements (with answers)
- 3 "Fill in the Blank" sentences

Video: "${videoTitle}"

TRANSCRIPT:
${transcript}`,

    "full-analysis": `You are a panel of education experts analyzing this video for curriculum use at ${grade} level.

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
${transcript}`,
  };

  return prompts[outputType] ?? prompts["full-analysis"];
}

// --- Model selection ---

type ModelConfig = {
  provider: "anthropic" | "openai";
  model: string;
  maxTokens: number;
};

function getModelForType(outputType: string): ModelConfig {
  switch (outputType) {
    case "quiz":
    case "vocabulary":
    case "guided-notes":
      return { provider: "anthropic", model: "claude-haiku-4-5-20250901", maxTokens: 4096 };
    case "lesson-plan":
    case "discussion":
    case "dok-project":
    case "graphic-organizer":
    case "full-analysis":
      return { provider: "anthropic", model: "claude-sonnet-4-20250514", maxTokens: 8192 };
    default:
      return { provider: "anthropic", model: "claude-sonnet-4-20250514", maxTokens: 8192 };
  }
}

// --- Route handler ---

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
    const modelConfig = getModelForType(outputType);

    let result: string;

    if (modelConfig.provider === "anthropic") {
      const response = await getAnthropic().messages.create({
        model: modelConfig.model,
        max_tokens: modelConfig.maxTokens,
        messages: [{ role: "user", content: prompt }],
      });

      result = response.content
        .filter((block): block is Anthropic.TextBlock => block.type === "text")
        .map((block) => block.text)
        .join("\n\n");
    } else {
      const response = await getOpenAI().responses.create({
        model: modelConfig.model,
        input: prompt,
        max_output_tokens: modelConfig.maxTokens,
      });

      result = response.output_text ?? "";
    }

    return Response.json({
      videoId,
      videoTitle,
      outputType,
      content: result,
      model: modelConfig.model,
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
