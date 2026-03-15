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
    await updateProgress(jobId, 5, "Pass 1/5: Gandalf drafting scope and sequence...");
    const gandalfDraft = await callCouncilMember(
      "gandalf",
      `Create a comprehensive scope and sequence for:\n\n${context}`
    );

    // Pass 2: Data audits
    await updateProgress(jobId, 22, "Pass 2/5: Data auditing for structural flaws...");
    const dataCritique = await callCouncilMember(
      "data",
      `Review and critique this scope and sequence:\n\n${gandalfDraft}`
    );

    // Pass 3: Polgara finalizes
    await updateProgress(jobId, 45, "Pass 3/5: Polgara finalizing for the child...");
    const polgaraFinal = await callCouncilMember(
      "polgara",
      `Gandalf's original draft:\n\n${gandalfDraft}\n\n---\n\nData's critique:\n\n${dataCritique}\n\n---\n\nFinalize this scope and sequence. This ships after you.`
    );

    // Pass 4: Earl operational assessment
    await updateProgress(jobId, 65, "Pass 4/5: Earl assessing operational viability...");
    const earlReport = await callCouncilMember(
      "earl",
      `Review this finalized scope and sequence from an operational standpoint:\n\n${polgaraFinal}`
    );

    // Pass 5: Beavis & Butthead engagement test
    await updateProgress(jobId, 82, "Pass 5/5: Beavis & Butthead engagement stress test...");
    const beavisReport = await callCouncilMember(
      "beavis",
      `Stress test this finalized scope and sequence for student engagement:\n\n${polgaraFinal}`
    );

    const finalOutput = {
      subject,
      gradeLevel,
      duration,
      standards: standards ?? null,
      finalScopeAndSequence: polgaraFinal,
      operationalAssessment: earlReport,
      engagementReport: beavisReport,
      draftsRetained: {
        gandalfInitialDraft: gandalfDraft,
        dataCritique: dataCritique,
      },
      generatedAt: new Date().toISOString(),
    };

    await updateProgress(jobId, 100, "Complete — all 5 passes done.", "completed", finalOutput);
    await notifyJobComplete(jobId, `${subject} Grade ${gradeLevel}`, "completed");

    console.log(`[curriculum-factory] Job ${jobId} completed — ${subject} Grade ${gradeLevel}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error(`[curriculum-factory] Job ${jobId} failed:`, message);
    await updateProgress(jobId, 0, "Failed", "failed", undefined, message);
    await notifyJobComplete(jobId, `${subject} Grade ${gradeLevel}`, "failed", message);
  }
}
