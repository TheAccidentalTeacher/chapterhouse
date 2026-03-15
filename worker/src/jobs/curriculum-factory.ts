import Anthropic from "@anthropic-ai/sdk";
import { updateProgress } from "../lib/progress";
import { notifyJobComplete } from "../lib/notify";
import { COUNCIL_PROMPTS, type CouncilMember } from "../lib/council-prompts";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Subject code & grade band mappings (match scope-sequence-handoff.md) ──────

const SUBJECT_CODES: Record<string, string> = {
  science: "sci", biology: "sci", chemistry: "sci", physics: "sci", "earth science": "sci",
  math: "mth", mathematics: "mth", algebra: "mth", geometry: "mth",
  "language arts": "ela", ela: "ela", english: "ela", reading: "ela", writing: "ela",
  history: "hst", "social studies": "hst", geography: "hst", civics: "hst",
  economics: "hst", "us history": "hst", "world history": "hst",
  bible: "bib", art: "art", music: "mus", pe: "pe",
};

const STANDARDS_FRAMEWORK_SHORT: Record<string, string> = {
  science: "NGSS", biology: "NGSS", chemistry: "NGSS", physics: "NGSS", "earth science": "NGSS",
  math: "CCSS-Math", mathematics: "CCSS-Math", algebra: "CCSS-Math", geometry: "CCSS-Math",
  "language arts": "CCSS-ELA", ela: "CCSS-ELA", english: "CCSS-ELA", reading: "CCSS-ELA", writing: "CCSS-ELA",
  history: "C3", "social studies": "C3", geography: "C3", civics: "C3",
  economics: "C3", "us history": "C3", "world history": "C3",
  bible: "internal", art: "internal", music: "internal", pe: "internal",
};

function getSubjectCode(subject: string): string {
  const lower = subject.toLowerCase().trim();
  if (SUBJECT_CODES[lower]) return SUBJECT_CODES[lower];
  for (const [key, code] of Object.entries(SUBJECT_CODES)) {
    if (lower.includes(key)) return code;
  }
  return lower.slice(0, 3);
}

function getStandardsFrameworkShort(subject: string): string {
  const lower = subject.toLowerCase().trim();
  if (STANDARDS_FRAMEWORK_SHORT[lower]) return STANDARDS_FRAMEWORK_SHORT[lower];
  for (const [key, fw] of Object.entries(STANDARDS_FRAMEWORK_SHORT)) {
    if (lower.includes(key)) return fw;
  }
  return "internal";
}

function getGradeBand(grade: number): string {
  if (grade <= 2) return "early_elementary";
  if (grade <= 5) return "upper_elementary";
  if (grade <= 8) return "middle";
  return "high";
}

async function callCouncilMember(
  member: CouncilMember,
  userMessage: string
): Promise<string> {
  const msg = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: COUNCIL_PROMPTS[member],
    messages: [{ role: "user", content: userMessage }],
  });

  const block = msg.content[0];
  return block.type === "text" ? block.text : "";
}

// National standards framework mapping — auto-detected from subject
const NATIONAL_STANDARDS: Record<string, string> = {
  ela: "Common Core State Standards for English Language Arts (CCSS-ELA)",
  english: "Common Core State Standards for English Language Arts (CCSS-ELA)",
  reading: "Common Core State Standards for English Language Arts (CCSS-ELA)",
  writing: "Common Core State Standards for English Language Arts (CCSS-ELA)",
  "language arts": "Common Core State Standards for English Language Arts (CCSS-ELA)",
  math: "Common Core State Standards for Mathematics (CCSS-M)",
  mathematics: "Common Core State Standards for Mathematics (CCSS-M)",
  algebra: "Common Core State Standards for Mathematics (CCSS-M)",
  geometry: "Common Core State Standards for Mathematics (CCSS-M)",
  science: "Next Generation Science Standards (NGSS)",
  biology: "Next Generation Science Standards (NGSS)",
  chemistry: "Next Generation Science Standards (NGSS)",
  physics: "Next Generation Science Standards (NGSS)",
  "earth science": "Next Generation Science Standards (NGSS)",
  "social studies": "College, Career, and Civic Life (C3) Framework for Social Studies",
  history: "College, Career, and Civic Life (C3) Framework for Social Studies",
  geography: "College, Career, and Civic Life (C3) Framework for Social Studies",
  civics: "College, Career, and Civic Life (C3) Framework for Social Studies",
  economics: "College, Career, and Civic Life (C3) Framework for Social Studies",
  "us history": "College, Career, and Civic Life (C3) Framework for Social Studies",
  "world history": "College, Career, and Civic Life (C3) Framework for Social Studies",
};

function getStandardsFramework(subject: string): string {
  const lower = subject.toLowerCase().trim();
  // Direct match first
  if (NATIONAL_STANDARDS[lower]) return NATIONAL_STANDARDS[lower];
  // Partial match — check if any key is contained in the subject
  for (const [key, framework] of Object.entries(NATIONAL_STANDARDS)) {
    if (lower.includes(key)) return framework;
  }
  return "National content standards for the subject area";
}

export interface CurriculumJobPayload {
  subject: string;
  gradeLevel: number;
  duration: string;
  standards?: string;
  additionalContext?: string;
}

// ── Structured extraction — converts Polgara's markdown to handoff JSON ──────

interface ExtractionMeta {
  subject: string;
  subjectCode: string;
  gradeLevel: number;
  gradeBand: string;
  frameworkShort: string;
  courseId: string;
}

async function extractStructuredOutput(
  polgaraMarkdown: string,
  meta: ExtractionMeta
): Promise<Record<string, unknown> | null> {
  const extractionPrompt = `You are a precise data extraction engine. Convert the following curriculum scope & sequence document into a structured JSON object.

DESIGN PRINCIPLE: NO COOKIE CUTTERS. Every unit can have a different number of lessons, different styles, and different energy levels. Structure serves learning — learning does not serve structure.

REQUIRED OUTPUT FORMAT (respond with ONLY valid JSON — no markdown fences, no commentary):

{
  "id": "${meta.courseId}",
  "schema_version": "1.0",
  "subject": "${meta.subject}",
  "subject_code": "${meta.subjectCode}",
  "grade": ${meta.gradeLevel},
  "grade_band": "${meta.gradeBand}",
  "title": "Grade ${meta.gradeLevel} ${meta.subject}",
  "subtitle": "<descriptive subtitle extracted from the document>",
  "faith_integration": false,
  "theology_profile": "none",
  "standards_framework": "${meta.frameworkShort}",
  "units": [
    {
      "unit_number": 1,
      "title": "<unit title>",
      "description": "<1-3 sentence description>",
      "pacing": "<N+1 pattern, e.g. 5+1, 4+1, 3+1, 6+1, 7+1>",
      "lessons": [
        {
          "lesson_number": 1,
          "title": "<lesson title>",
          "big_idea": "<one sentence core takeaway>",
          "standards": ["<real standard codes from ${meta.frameworkShort}>"],
          "key_concepts": ["<2-5 short phrases>"],
          "style": "<exploration|deep_dive|hands_on|story_driven|challenge|creative|review_game|field_journal|debate|lab>",
          "energy": "<high|medium|low>"
        },
        {
          "lesson_number": "<last>",
          "title": "<Unit N Review: ...>",
          "big_idea": "<cumulative review sentence>",
          "standards": ["<all major standards from this unit>"],
          "key_concepts": ["<cumulative takeaways>"],
          "is_review": true,
          "style": "review_game",
          "energy": "high"
        }
      ]
    }
  ],
  "meta": {
    "generated_at": "<ISO 8601 timestamp>",
    "generated_by": "chapterhouse-curriculum-factory",
    "total_units": "<number>",
    "total_lessons": "<actual sum of all lessons across all units>"
  }
}

STRUCTURAL RULES:
- Each unit has 3-8 lessons. Different units CAN have different lesson counts.
- The pacing field = "N+1" where N = teaching lessons, 1 = review. E.g. 5 teaching + 1 review = "5+1" (6 total lessons).
- The LAST lesson in every unit is ALWAYS a review with "is_review": true.
- total_lessons in meta = the actual SUM of all lessons across all units (not a formula).

LESSON VARIETY RULES:
- Every lesson MUST have a "style" hint from: exploration, deep_dive, hands_on, story_driven, challenge, creative, review_game, field_journal, debate, lab.
- Every lesson MUST have an "energy" level: high, medium, or low.
- Vary styles and energy levels WITHIN each unit — do not repeat the same style or energy consecutively.
- Review lessons should use style "review_game" and energy "high".
- A well-designed unit alternates energy: high → medium → low → high → medium → review.

CONTENT RULES:
- Standards codes must be real codes from ${meta.frameworkShort} appropriate for grade ${meta.gradeLevel}.
- key_concepts: 2-5 short phrases per lesson.
- big_idea: one clear sentence per lesson, written at the target grade's reading level.
- All content secular (Alaska Statute 14.03.320).
- Output ONLY the JSON object. No explanation, no markdown fences.

SOURCE DOCUMENT:
${polgaraMarkdown}`;

  try {
    const msg = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 8192,
      system: "You output only valid JSON. No markdown fences, no commentary, no explanation.",
      messages: [{ role: "user", content: extractionPrompt }],
    });

    const block = msg.content[0];
    const raw = block.type === "text" ? block.text : "";

    // Try parsing directly
    try {
      return JSON.parse(raw);
    } catch {
      // Try extracting JSON from markdown fences if the model wrapped it
      const match = raw.match(/```(?:json)?\s*([\s\S]+?)```/);
      if (match) return JSON.parse(match[1]);
      return null;
    }
  } catch (err) {
    console.error("[curriculum-factory] Structured extraction failed:", err);
    return null;
  }
}

export async function runCurriculumFactory(
  jobId: string,
  payload: CurriculumJobPayload
) {
  const { subject, gradeLevel, duration, standards, additionalContext } = payload;

  const framework = getStandardsFramework(subject);

  const context = [
    `Subject: ${subject}`,
    `Grade Level: ${gradeLevel}`,
    `Duration: ${duration}`,
    `National Standards Framework: ${framework}`,
    standards ? `Additional Standards: ${standards}` : null,
    additionalContext ? `Additional Context: ${additionalContext}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    // Pass 1: Gandalf drafts
    await updateProgress(jobId, 5, "Pass 1/6: Gandalf drafting scope and sequence...");
    const gandalfDraft = await callCouncilMember(
      "gandalf",
      `Create a comprehensive scope and sequence for:\n\n${context}\n\n` +
      `STRUCTURAL REQUIREMENTS:\n` +
      `- Design units with 3-8 lessons each. Different units SHOULD have different lesson counts.\n` +
      `- Express pacing as "N+1" (e.g., "5+1" = 5 teaching + 1 review = 6 total).\n` +
      `- Last lesson in every unit = review/assessment.\n` +
      `- Every lesson needs: title, big idea, standards codes, key concepts (2-5), style hint, energy level.\n` +
      `- Style options: exploration, deep_dive, hands_on, story_driven, challenge, creative, field_journal, debate, lab, review_game.\n` +
      `- Energy options: high, medium, low. Alternate within each unit — no 3 consecutive same-energy lessons.\n` +
      `- Vary styles within each unit — no consecutive repeats.`
    );

    // Pass 2: Data audits
    await updateProgress(jobId, 18, "Pass 2/6: Data auditing for structural flaws...");
    const dataCritique = await callCouncilMember(
      "data",
      `Audit this scope and sequence against ${framework} for Grade ${gradeLevel}.\n\n` +
      `Check BOTH content quality AND structural integrity:\n` +
      `- Standards: Are codes real? Is every lesson mapped to at least 1 standard? Any missing grade-level standards?\n` +
      `- Pacing math: Does each unit's lesson count match its stated pacing ("N+1" = N+1 lessons)?\n` +
      `- Unit variety: Do units have DIFFERENT lesson counts? Flag if all units are identical size.\n` +
      `- Style variety: Does each unit use 3+ different styles? No consecutive repeats?\n` +
      `- Energy alternation: Do energy levels vary? No 3+ consecutive same-energy lessons?\n` +
      `- Review lessons: Does every unit end with review? Is review the ONLY lesson marked is_review?\n` +
      `- Key concepts: 2-5 per lesson? Specific enough to be useful?\n` +
      `- Pedagogical sequencing: Do prerequisites flow correctly for grade ${gradeLevel}?\n\n` +
      `${gandalfDraft}`
    );

    // Pass 3: Polgara finalizes
    await updateProgress(jobId, 35, "Pass 3/6: Polgara finalizing for the child...");
    const polgaraFinal = await callCouncilMember(
      "polgara",
      `Gandalf's original draft:\n\n${gandalfDraft}\n\n---\n\nData's critique:\n\n${dataCritique}\n\n---\n\n` +
      `Finalize this scope and sequence. This ships after you.\n\n` +
      `PRESERVE these structural elements in your output (the pipeline needs them):\n` +
      `- Unit pacing pattern ("N+1" format)\n` +
      `- Lesson style hint per lesson (exploration, deep_dive, hands_on, etc.)\n` +
      `- Lesson energy level per lesson (high, medium, low)\n` +
      `- Standards codes per lesson\n` +
      `- Key concepts (2-5) per lesson\n` +
      `- is_review flag on the last lesson of each unit\n\n` +
      `You may CHANGE any of these values if they don't serve the child — but you must INCLUDE them all.\n` +
      `If Data flagged monotone styles or flat energy, fix those sequences.`
    );

    // Pass 4: Earl operational assessment
    await updateProgress(jobId, 52, "Pass 4/6: Earl assessing operational viability...");
    const earlReport = await callCouncilMember(
      "earl",
      `Review this finalized scope and sequence from an operational standpoint:\n\n${polgaraFinal}`
    );

    // Pass 5: Beavis & Butthead engagement test
    await updateProgress(jobId, 75, "Pass 5/6: Beavis & Butthead engagement stress test...");
    const beavisReport = await callCouncilMember(
      "beavis",
      `Stress test this finalized scope and sequence for student engagement.\n\n` +
      `For each unit, judge:\n` +
      `- Overall: COOL, SUCKS, or MEH?\n` +
      `- Which specific lessons would a kid actually like vs. zone out on?\n` +
      `- Does the energy flow feel like a roller coaster (good) or a flatline (bad)?\n` +
      `- Is there enough variety in lesson types or does it all feel the same?\n` +
      `- Is the review lesson a game or a boring test?\n\n` +
      `${polgaraFinal}`
    );

    // Pass 6: Structured extraction — convert Polgara's markdown to handoff JSON
    await updateProgress(jobId, 88, "Pass 6/6: Extracting structured handoff JSON...");

    const subjectCode = getSubjectCode(subject);
    const gradeBand = getGradeBand(gradeLevel);
    const frameworkShort = getStandardsFrameworkShort(subject);
    const courseId = `${subjectCode}-g${gradeLevel}`;

    const structuredJson = await extractStructuredOutput(
      polgaraFinal,
      { subject, subjectCode, gradeLevel, gradeBand, frameworkShort, courseId }
    );

    // Post-extraction validation & fixup
    if (structuredJson && Array.isArray(structuredJson.units)) {
      const units = structuredJson.units as Array<{
        pacing?: string;
        lessons?: Array<{ is_review?: boolean; lesson_number?: number }>;
      }>;

      let totalLessons = 0;

      for (const unit of units) {
        if (!Array.isArray(unit.lessons)) continue;
        const lessonCount = unit.lessons.length;
        totalLessons += lessonCount;

        // Validate pacing math: "N+1" should mean N+1 lessons total
        if (unit.pacing) {
          const pacingMatch = unit.pacing.match(/^(\d+)\+1$/);
          if (pacingMatch) {
            const expected = parseInt(pacingMatch[1], 10) + 1;
            if (lessonCount !== expected) {
              // Fix pacing to match actual lesson count
              unit.pacing = `${lessonCount - 1}+1`;
            }
          }
        } else {
          // Add pacing if missing
          unit.pacing = `${lessonCount - 1}+1`;
        }

        // Ensure last lesson has is_review = true
        const lastLesson = unit.lessons[unit.lessons.length - 1];
        if (lastLesson && !lastLesson.is_review) {
          lastLesson.is_review = true;
        }

        // Renumber lessons sequentially
        unit.lessons.forEach((lesson, i) => {
          lesson.lesson_number = i + 1;
        });
      }

      // Compute accurate total_lessons (never trust AI math)
      if (structuredJson.meta && typeof structuredJson.meta === "object") {
        const meta = structuredJson.meta as Record<string, unknown>;
        meta.total_lessons = totalLessons;
        meta.total_units = units.length;
        // Remove legacy field if present
        delete meta.lessons_per_unit;
      }
    }

    const finalOutput = {
      subject,
      gradeLevel,
      duration,
      standards: standards ?? null,
      finalScopeAndSequence: polgaraFinal,
      structuredOutput: structuredJson,
      operationalAssessment: earlReport,
      engagementReport: beavisReport,
      draftsRetained: {
        gandalfInitialDraft: gandalfDraft,
        dataCritique: dataCritique,
      },
      generatedAt: new Date().toISOString(),
    };

    await updateProgress(jobId, 100, "Complete — all 6 passes done.", "completed", finalOutput);
    await notifyJobComplete(jobId, `${subject} Grade ${gradeLevel}`, "completed");

    console.log(`[curriculum-factory] Job ${jobId} completed — ${subject} Grade ${gradeLevel}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[curriculum-factory] Job ${jobId} failed:`, message);
    await updateProgress(jobId, 0, "Failed", "failed", undefined, message);
    await notifyJobComplete(jobId, `${subject} Grade ${gradeLevel}`, "failed", message);
  }
}
