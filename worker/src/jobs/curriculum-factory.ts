import Anthropic from "@anthropic-ai/sdk";
import { updateProgress } from "../lib/progress";
import { notifyJobComplete } from "../lib/notify";
import { COUNCIL_PROMPTS, type CouncilMember } from "../lib/council-prompts";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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

export interface CurriculumJobPayload {
  subject: string;
  gradeLevel: number;
  duration: string;
  standards?: string;
  additionalContext?: string;
}

export async function runCurriculumFactory(
  jobId: string,
  payload: CurriculumJobPayload
) {
  const { subject, gradeLevel, duration, standards, additionalContext } = payload;

  const context = [
    `Subject: ${subject}`,
    `Grade Level: ${gradeLevel}`,
    `Duration: ${duration}`,
    standards ? `Standards: ${standards}` : null,
    additionalContext ? `Additional Context: ${additionalContext}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    // Pass 1: Gandalf drafts
    await updateProgress(jobId, 5, "Pass 1/4: Gandalf drafting scope and sequence...");
    const gandalfDraft = await callCouncilMember(
      "gandalf",
      `Create a comprehensive scope and sequence for:\n\n${context}`
    );

    // Pass 2: Legolas critiques
    await updateProgress(jobId, 30, "Pass 2/4: Legolas reviewing for gaps and errors...");
    const legolasCritique = await callCouncilMember(
      "legolas",
      `Review and critique this scope and sequence:\n\n${gandalfDraft}`
    );

    // Pass 3: Aragorn finalizes
    await updateProgress(jobId, 60, "Pass 3/4: Aragorn finalizing...");
    const aragonFinal = await callCouncilMember(
      "aragorn",
      `Gandalf's original draft:\n\n${gandalfDraft}\n\n---\n\nLegolas's critique:\n\n${legolasCritique}\n\n---\n\nFinalize this scope and sequence. This ships after you.`
    );

    // Pass 4: Gimli stress tests
    await updateProgress(jobId, 82, "Pass 4/4: Gimli stress-testing for classroom viability...");
    const gimliReport = await callCouncilMember(
      "gimli",
      `Stress test this finalized scope and sequence:\n\n${aragonFinal}`
    );

    const finalOutput = {
      subject,
      gradeLevel,
      duration,
      standards: standards ?? null,
      finalScopeAndSequence: aragonFinal,
      classroomViabilityReport: gimliReport,
      draftsRetained: {
        gandalfInitialDraft: gandalfDraft,
        legolasCritique: legolasCritique,
      },
      generatedAt: new Date().toISOString(),
    };

    await updateProgress(jobId, 100, "Complete — all 4 passes done.", "completed", finalOutput);
    await notifyJobComplete(jobId, `${subject} Grade ${gradeLevel}`, "completed");

    console.log(`[curriculum-factory] Job ${jobId} completed — ${subject} Grade ${gradeLevel}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[curriculum-factory] Job ${jobId} failed:`, message);
    await updateProgress(jobId, 0, "Failed", "failed", undefined, message);
    await notifyJobComplete(jobId, `${subject} Grade ${gradeLevel}`, "failed", message);
  }
}
