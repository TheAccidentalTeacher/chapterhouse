import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

// --- Zod schema ---
const batchSchema = z.object({
  videos: z
    .array(
      z.object({
        videoId: z.string().min(1),
        videoTitle: z.string().min(1),
        transcript: z.string().min(50),
      }),
    )
    .min(2)
    .max(20),
  outputType: z.enum([
    "combined-quiz",
    "master-vocabulary",
    "unit-study-guide",
    "weekly-summary",
    "batch-summary",
  ]),
  options: z
    .object({
      gradeLevel: z.number().min(1).max(12).optional(),
      unitTitle: z.string().optional(),
    })
    .optional(),
});

// --- SDK factory ---
function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

// --- Prompt builders ---

const GRADE_LABEL = (g?: number) =>
  g ? `Grade ${g} (age ${g + 5}–${g + 6})` : "middle school (grades 6–8)";

function buildVideoBlock(
  videos: { videoId: string; videoTitle: string; transcript: string }[],
): string {
  return videos
    .map(
      (v, i) =>
        `--- VIDEO ${i + 1}: "${v.videoTitle}" (ID: ${v.videoId}) ---\n${v.transcript}`,
    )
    .join("\n\n");
}

function buildBatchPrompt(
  outputType: string,
  videos: { videoId: string; videoTitle: string; transcript: string }[],
  options?: z.infer<typeof batchSchema>["options"],
): string {
  const grade = GRADE_LABEL(options?.gradeLevel);
  const unitTitle = options?.unitTitle ?? "this unit";
  const videoBlock = buildVideoBlock(videos);
  const videoCount = videos.length;

  const prompts: Record<string, string> = {
    "combined-quiz": `You are an expert test creator for ${grade} students.

Create a comprehensive combined quiz that spans ALL ${videoCount} videos below. The quiz should test understanding across the full body of content, not just individual videos.

Include:
- 15 multiple choice questions (4 options each, mark correct answer)
  - At least 3 questions should require synthesizing information from 2+ videos
- 8 short answer questions (reference which video(s) each relates to)
- 3 extended response / essay questions that require cross-video analysis
- Answer key at the end

Questions should progress from recall → understanding → application → analysis (Bloom's taxonomy).

Label each question with which video(s) it draws from.

VIDEOS:
${videoBlock}`,

    "master-vocabulary": `You are a vocabulary specialist for ${grade}.

Review ALL ${videoCount} video transcripts below and create a MASTER VOCABULARY LIST for ${unitTitle}:

1. Extract all key academic and content-specific terms from ALL videos
2. **Deduplicate** — if the same term appears in multiple videos, merge into one entry and note all source videos
3. For each term provide:
   - **Term**
   - **Definition** (grade-appropriate)
   - **Part of Speech**
   - **Source Video(s)** — which video(s) use this term
   - **Context** — best example sentence from the transcripts
   - **Related Terms** from the same collection

4. Organize alphabetically
5. At the end, include:
   - "Flashcard Format" section (TERM | DEFINITION)
   - "Word Web" showing which terms connect across videos
   - Count of unique terms

VIDEOS:
${videoBlock}`,

    "unit-study-guide": `You are an experienced curriculum designer creating a complete unit study guide for ${grade}.

Unit Title: "${unitTitle}"

Using ALL ${videoCount} video transcripts below, create a comprehensive study guide:

**1. Unit Overview**
- Big Ideas / Essential Questions (3–5)
- Learning objectives for the full unit
- How the videos connect to each other (conceptual thread)

**2. Video-by-Video Summary**
- For each video: title, 3–5 key takeaways, connection to unit themes

**3. Key Concepts**
- Major concepts across all videos, organized thematically (not by video)
- Definitions and explanations

**4. Timeline / Sequence** (if applicable)
- Chronological or logical sequence of events/concepts across all videos

**5. Vocabulary** (top 20 terms across all videos, deduplicated)

**6. Review Questions**
- 10 questions that require cross-video understanding
- Include answers

**7. Study Tips**
- Suggested study sequence
- What to review first vs last
- Common misconceptions to watch for

VIDEOS:
${videoBlock}`,

    "weekly-summary": `You are a teacher creating a weekly synthesis for ${grade} students.

Summarize the week's ${videoCount} videos into a student-facing weekly summary for ${unitTitle}:

**1. This Week's Big Picture**
- 2–3 paragraph narrative connecting all videos (written FOR students, not about them)

**2. What We Learned** (bullet points, 3–5 per video)

**3. Connections**
- How do these videos relate to each other?
- What patterns or themes emerged across the week?

**4. What's Still Unclear?**
- 3 questions students might still have after watching all videos
- Suggested ways to find answers

**5. Quick Check** (5 questions — one per video minimum)

**6. Looking Ahead**
- How this week's content connects to what comes next

Write in second person ("you learned," "you saw") — student-facing, warm, encouraging.

VIDEOS:
${videoBlock}`,

    "batch-summary": `You are an educational analyst creating a master synthesis document for ${grade}.

Analyze ALL ${videoCount} video transcripts and produce a comprehensive synthesis:

**1. Executive Summary**
- 1 paragraph capturing the full scope of content across all videos

**2. Content Map**
- What each video contributes to the overall picture
- Overlaps and unique contributions per video
- Gaps — what's NOT covered that you'd expect

**3. Thematic Analysis**
- Major themes that emerge across the collection
- Supporting evidence from specific videos

**4. Teaching Sequence Recommendation**
- Optimal order to show these videos (may differ from provided order)
- Justification for the sequence
- Estimated total viewing time

**5. Cross-Video Assessment**
- 10 assessment questions that REQUIRE watching multiple videos to answer
- Mix of recall, analysis, and synthesis

**6. Supplementary Resources Needed**
- What gaps exist? What other content would round out this collection?
- Suggested topics for additional videos or readings

**7. Quality Rating**
- Rate each video individually (A–F) for educational value
- Rate the collection as a whole
- Verdict: "Use as-is" / "Supplement needed" / "Reorganize sequence"

VIDEOS:
${videoBlock}`,
  };

  return prompts[outputType] ?? prompts["batch-summary"];
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
    const parsed = batchSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { videos, outputType, options } = parsed.data;
    const prompt = buildBatchPrompt(outputType, videos, options);

    // Batch always uses Sonnet — needs cross-document reasoning
    const response = await getAnthropic().messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 8192,
      messages: [{ role: "user", content: prompt }],
    });

    const result = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n\n");

    return Response.json({
      videoIds: videos.map((v) => v.videoId),
      videoTitles: videos.map((v) => v.videoTitle),
      outputType,
      content: result,
      model: "claude-sonnet-4-20250514",
      videoCount: videos.length,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("YouTube batch error:", error);
    return Response.json(
      { error: "Failed to generate batch content" },
      { status: 500 },
    );
  }
}
