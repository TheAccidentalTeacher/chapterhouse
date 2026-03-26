import Anthropic from "@anthropic-ai/sdk";

// ── Types ──────────────────────────────────────────────────────────────────────

export interface CharacterRef {
  slug: string;
  name: string;
  physical_description: string;
  art_style: string;
  negative_prompt: string;
  reference_images: string[];
  trigger_word?: string | null; // Leonardo LoRA trigger word — prepended to prompt to activate the Element
}

export interface EnhancedPrompt {
  enhanced: string;         // Full enhanced prompt ready to send to image API
  negative: string;         // Negative prompt (character's + any additions)
  notes: string;            // What was changed / why (for debugging)
  original: string;         // Original raw prompt (preserved for DB storage)
}

// ── Prompt Enhancer ────────────────────────────────────────────────────────────

export async function enhancePrompt(
  rawPrompt: string,
  character?: CharacterRef,
  context?: string,            // Optional: e.g. "explaining photosynthesis to 2nd graders"
): Promise<EnhancedPrompt> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // Graceful fallback: return raw prompt unchanged if Anthropic not configured
    return {
      enhanced: rawPrompt,
      negative: character?.negative_prompt ?? "",
      notes: "No ANTHROPIC_API_KEY — prompt returned as-is",
      original: rawPrompt,
    };
  }

  const client = new Anthropic({ apiKey });

  const systemPrompt = character
    ? `You are a professional prompt engineer specializing in consistent character illustration for children's educational content.

CHARACTER: ${character.name}
PHYSICAL DESCRIPTION: ${character.physical_description}
ART STYLE: ${character.art_style}

CRITICAL RULES FOR CHARACTER CONSISTENCY:
1. START your prompt with the COMPLETE physical description verbatim — do not paraphrase it
2. Then describe the scene the user requested
3. Repeat the most visually distinctive features (fur markings, eye color, expression) at least twice
4. Lock the art style explicitly in every sentence — never let the scene override the art style
5. Keep it under 220 words
6. Output ONLY the enhanced prompt text, nothing else

FORMAT: [full physical description], [art style], [scene description with character doing the action], [reinforce key visual features], [art style reinforcement]`
    : `You are a professional prompt engineer specializing in educational content for children.

Your job:
1. Take the user's scene description and expand it into a detailed, vivid image generation prompt
2. Add appropriate atmosphere, lighting, and style details
3. Make it child-friendly and appropriate for educational use
4. Keep it concise — under 200 words
5. Output ONLY the enhanced prompt text, nothing else`;

  const userMessage = context
    ? `Scene: ${rawPrompt}\nContext: ${context}`
    : rawPrompt;

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 300,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });

    const enhanced =
      response.content[0].type === "text"
        ? response.content[0].text.trim()
        : rawPrompt;

    // Build notes by comparing length/content
    const notes =
      enhanced.length > rawPrompt.length * 1.5
        ? `Expanded prompt with character details and art style (${rawPrompt.length} → ${enhanced.length} chars)`
        : `Minor refinements applied (${rawPrompt.length} → ${enhanced.length} chars)`;

    // Prepend Leonardo LoRA trigger word when present.
    // A Leonardo Element (fine-tuned LoRA) only activates when its trigger word appears
    // in the generation prompt. Without it, the Element UUID in elements[] does nothing.
    const triggerWord = character?.trigger_word;
    const finalEnhanced = triggerWord ? `${triggerWord}, ${enhanced}` : enhanced;
    const triggerNote = triggerWord ? ` Trigger word '${triggerWord}' prepended for LoRA activation.` : "";

    return {
      enhanced: finalEnhanced,
      negative: character?.negative_prompt ?? "",
      notes: notes + triggerNote,
      original: rawPrompt,
    };
  } catch (err) {
    // Non-fatal: fallback to raw prompt on any API error
    console.error("[prompt-enhancer] Claude Haiku failed, using raw prompt:", err);
    // Still prepend trigger word even on fallback — it must be in the prompt
    const triggerWord = character?.trigger_word;
    const fallbackPrompt = triggerWord ? `${triggerWord}, ${rawPrompt}` : rawPrompt;
    return {
      enhanced: fallbackPrompt,
      negative: character?.negative_prompt ?? "",
      notes: `Enhancement failed: ${err instanceof Error ? err.message : "unknown error"}${triggerWord ? ` Trigger word '${triggerWord}' prepended.` : ""}`,
      original: rawPrompt,
    };
  }
}
