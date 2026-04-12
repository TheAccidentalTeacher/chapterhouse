import Anthropic from "@anthropic-ai/sdk";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

const VALID_ANALYSIS_TYPES = [
  "summary",
  "key-findings",
  "curriculum-map",
  "chapter-outline",
  "vocabulary",
  "discussion-guide",
  "critique",
  "full-analysis",
  "custom",
] as const;

type AnalysisType = (typeof VALID_ANALYSIS_TYPES)[number];

/**
 * POST /api/documents/analyze
 *
 * Given a document ID or raw text, perform AI analysis.
 * Uses Claude with full-context approach (no chunking needed for most docs).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const documentId = body.documentId;
    let text = typeof body.text === "string" ? body.text : "";
    const analysisType: AnalysisType = VALID_ANALYSIS_TYPES.includes(body.analysisType)
      ? body.analysisType
      : "summary";
    const gradeLevel = typeof body.gradeLevel === "number" ? body.gradeLevel : undefined;
    const subject = typeof body.subject === "string" ? body.subject : undefined;
    const maxLength = body.maxLength || "standard";
    const customPrompt = typeof body.customPrompt === "string" ? body.customPrompt.trim() : "";

    // Fetch text from DB if documentId provided
    if (documentId && !text) {
      const supabase = getSupabaseServiceRoleClient();
      if (!supabase) {
        return Response.json({ error: "Database not available" }, { status: 503 });
      }
      const { data, error } = await supabase
        .from("documents")
        .select("extracted_text, file_name")
        .eq("id", documentId)
        .single();

      if (error || !data) {
        return Response.json({ error: "Document not found" }, { status: 404 });
      }
      text = data.extracted_text || "";
    }

    if (!text || text.length < 50) {
      return Response.json(
        { error: "Document text is too short for analysis (min 50 characters)" },
        { status: 400 }
      );
    }

    if (analysisType === "custom" && !customPrompt) {
      return Response.json(
        { error: "A custom prompt is required when using 'Ask Anything' mode" },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return Response.json({ error: "ANTHROPIC_API_KEY not configured" }, { status: 503 });
    }

    const { prompt, model, maxTokens } = buildAnalysisPrompt(
      analysisType,
      gradeLevel,
      subject,
      maxLength,
      customPrompt
    );

    const anthropic = getAnthropic();
    const response = await anthropic.messages.create({
      model,
      max_tokens: maxTokens,
      system: prompt,
      messages: [
        {
          role: "user",
          content: analysisType === "custom"
            ? `${customPrompt}\n\nDocument:\n\n${text.slice(0, 800_000)}`
            : `Analyze the following document:\n\n${text.slice(0, 800_000)}`,
        },
      ],
    });

    const analysis =
      response.content[0]?.type === "text"
        ? response.content[0].text
        : "Analysis failed — no text returned.";

    return Response.json({
      analysisType,
      analysis,
      documentId: documentId || null,
      metadata: {
        inputTokens: response.usage?.input_tokens || 0,
        outputTokens: response.usage?.output_tokens || 0,
        model,
        textLength: text.length,
      },
    });
  } catch (error) {
    console.error("[documents/analyze] Error:", error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}

function buildAnalysisPrompt(
  type: AnalysisType,
  gradeLevel?: number,
  subject?: string,
  maxLength?: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _customPrompt?: string
): { prompt: string; model: string; maxTokens: number } {
  const gradeContext = gradeLevel
    ? ` The target audience is grade ${gradeLevel} students.`
    : "";
  const subjectContext = subject
    ? ` The subject area is ${subject}.`
    : "";
  const lengthMap: Record<string, string> = {
    brief: "Keep your response concise — under 500 words.",
    standard: "Provide a thorough but focused response — 800-1500 words.",
    detailed: "Provide a comprehensive, detailed response — up to 3000 words.",
  };
  const lengthInstruction = lengthMap[maxLength || "standard"] || lengthMap.standard;

  const prompts: Record<AnalysisType, { text: string; model: string; maxTokens: number }> = {
    summary: {
      text: `You are a document analyst. Write an executive summary of the following document.${gradeContext}${subjectContext} ${lengthInstruction} Include the main thesis, key arguments, and conclusions.`,
      model: "claude-haiku-4-20250514",
      maxTokens: 2048,
    },
    "key-findings": {
      text: `You are a document analyst. Extract the key findings from the following document as clear, organized bullet points.${gradeContext}${subjectContext} ${lengthInstruction} Group findings by theme if appropriate.`,
      model: "claude-haiku-4-20250514",
      maxTokens: 2048,
    },
    "curriculum-map": {
      text: `You are an expert curriculum designer. Map the content of this document to curriculum standards.${gradeContext}${subjectContext} ${lengthInstruction}

Identify:
- What concepts/skills this document teaches
- Which standards it aligns to (CCSS-ELA, CCSS-M, NGSS, or C3 as appropriate)
- Suggested grade level range
- How this content could be integrated into a lesson sequence
- Prerequisite knowledge needed`,
      model: "claude-sonnet-4-6",
      maxTokens: 4096,
    },
    "chapter-outline": {
      text: `You are a document analyst. Create a detailed chapter-by-chapter (or section-by-section) outline of this document.${gradeContext}${subjectContext} ${lengthInstruction}

For each chapter/section include:
- Title and page/section number if available
- Key points and arguments
- Important terms introduced
- Notable quotes or data points`,
      model: "claude-sonnet-4-6",
      maxTokens: 4096,
    },
    vocabulary: {
      text: `You are a vocabulary extraction specialist. Extract all key terms and vocabulary from this document.${gradeContext}${subjectContext} ${lengthInstruction}

For each term provide:
- The term
- A clear definition in context
- How it's used in the document
- Grade-level appropriateness if relevant`,
      model: "claude-sonnet-4-6",
      maxTokens: 4096,
    },
    "discussion-guide": {
      text: `You are an expert educator. Create a discussion guide for this document.${gradeContext}${subjectContext} ${lengthInstruction}

Include:
- Pre-reading questions to activate prior knowledge
- During-reading focus questions by chapter/section
- Post-reading discussion questions (mix of literal, inferential, and evaluative)
- Extension activities or writing prompts
- Connections to real-world applications`,
      model: "claude-sonnet-4-6",
      maxTokens: 4096,
    },
    critique: {
      text: `You are an academic reviewer. Write a critical analysis of this document.${gradeContext}${subjectContext} ${lengthInstruction}

Cover:
- Strengths (argumentation, evidence, clarity, originality)
- Weaknesses (gaps, unsupported claims, bias, missing perspectives)
- Quality of evidence and sourcing
- Writing quality and accessibility
- Overall assessment and recommendations`,
      model: "claude-sonnet-4-6",
      maxTokens: 4096,
    },
    "full-analysis": {
      text: `You are a comprehensive document analyst. Provide a full analysis of this document.${gradeContext}${subjectContext}

Structure your response as:

## Executive Summary
2-3 paragraph overview.

## Key Findings
Organized bullet points by theme.

## Chapter/Section Outline
Key points per section.

## Vocabulary
Important terms with definitions.

## Critical Assessment
Strengths, weaknesses, gaps.

## Curriculum Potential
How this content could be used in education.

## Recommendations
Next steps, related resources, follow-up research.

Be thorough and detailed.`,
      model: "claude-sonnet-4-6",
      maxTokens: 8192,
    },
    custom: {
      text: `You are an expert AI assistant with deep knowledge across theology, education, curriculum design, history, and academic research. The user has provided specific instructions about what to create from this document. Execute those instructions precisely and thoroughly. Use markdown formatting with clear headings and structure. Produce a complete, polished, publication-ready output.`,
      model: "claude-sonnet-4-6",
      maxTokens: 8192,
    },
  };

  const config = prompts[type];
  return { prompt: config.text, model: config.model, maxTokens: config.maxTokens };
}
