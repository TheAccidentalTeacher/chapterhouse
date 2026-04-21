/**
 * Intent Detection — regex + keyword classifier for chat-invocable features.
 *
 * v1 is deterministic (regex). Confidence score is heuristic. The chat route
 * only invokes a tool if confidence >= 0.7. Everything below that falls
 * through to the standard AI chat response.
 *
 * v2 candidate: Haiku-classifier for ambiguous cases — run only when
 * regex confidence is between 0.4 and 0.7.
 */

export type IntentType =
  | "deep_research"
  | "council_quick"
  | "doc_generate"
  | "social_generate"
  | "image_generate"
  | "voice_synth"
  | "intel_fetch";

export type Intent = {
  type: IntentType;
  confidence: number;
  params: Record<string, string | number | undefined>;
  rawMessage: string;
};

type IntentPattern = {
  type: IntentType;
  triggers: RegExp[];
  // If the message needs an object/subject clause, this extracts it
  subjectExtractor?: (msg: string) => string | undefined;
  // Additional params beyond subject
  paramExtractor?: (msg: string) => Record<string, string | number>;
  // Base confidence when any trigger matches
  baseConfidence: number;
  // Bonus confidence when subject extraction succeeds
  subjectBonus: number;
};

// Subject extractors — pull the object of the user's command
function extractAfterVerb(msg: string, verbPattern: RegExp): string | undefined {
  const match = msg.match(verbPattern);
  if (!match) return undefined;
  const after = msg.slice(match.index! + match[0].length).trim();
  if (after.length < 2) return undefined;
  // Strip leading connectors
  return after.replace(/^(about|on|for|into|regarding|re:)\s+/i, "").trim();
}

const PATTERNS: IntentPattern[] = [
  {
    type: "deep_research",
    triggers: [
      /\b(research|investigate|deep.?dive|look(\s+deeply)?\s+into|find\s+out\s+about|dig\s+into)\b/i,
    ],
    subjectExtractor: (msg) =>
      extractAfterVerb(msg, /\b(research|investigate|deep.?dive|look\s+deeply\s+into|look\s+into|find\s+out\s+about|dig\s+into)\b/i),
    baseConfidence: 0.55,
    subjectBonus: 0.2,
  },
  {
    type: "council_quick",
    triggers: [
      /\b(ask\s+the\s+council|get\s+the\s+council|council['']s\s+take|what\s+does\s+the\s+council\s+think|convene\s+the\s+council)\b/i,
    ],
    subjectExtractor: (msg) =>
      extractAfterVerb(msg, /\b(ask\s+the\s+council|get\s+the\s+council|council['']s\s+take\s+on|what\s+does\s+the\s+council\s+think\s+about|convene\s+the\s+council\s+on)\b/i),
    baseConfidence: 0.7,
    subjectBonus: 0.2,
  },
  {
    type: "doc_generate",
    triggers: [
      /\b(write|draft|generate|create)\s+(a|an|the)\s+(prd|adr|spec|blog\s+post|landing|campaign\s+brief|positioning|launch\s+checklist|market\s+sizing|session\s+close|feedback\s+synthesis|study\s+guide|report|brainstorm|academic\s+paper|campaign\s+plan|email\s+sequence|seo\s+audit|competitive\s+brief|status\s+report|feature\s+spec|doc|document)\b/i,
    ],
    subjectExtractor: (msg) => {
      const m = msg.match(/\b(write|draft|generate|create)\s+(a|an|the)\s+([a-z\s-]+?)\s+(about|on|for|regarding)\s+(.+)$/i);
      if (m) return m[5].trim();
      return extractAfterVerb(msg, /\b(write|draft|generate|create)\s+(a|an|the)\s+[a-z-]+\s+/i);
    },
    paramExtractor: (msg) => {
      const typeMatch = msg.match(/\b(prd|adr|spec|blog\s+post|landing|campaign\s+brief|positioning|launch\s+checklist|market\s+sizing|session\s+close|feedback\s+synthesis|study\s+guide|report|brainstorm|academic\s+paper|campaign\s+plan|email\s+sequence|seo\s+audit|competitive\s+brief|status\s+report|feature\s+spec)\b/i);
      if (typeMatch) return { doc_type: typeMatch[1].toLowerCase().replace(/\s+/g, "_") };
      return {};
    },
    baseConfidence: 0.6,
    subjectBonus: 0.2,
  },
  {
    type: "social_generate",
    triggers: [
      /\b(social\s+post|instagram\s+post|facebook\s+post|write\s+a\s+post|generate\s+a\s+post|social\s+content)\b/i,
    ],
    subjectExtractor: (msg) =>
      extractAfterVerb(msg, /\b(social\s+post|instagram\s+post|facebook\s+post|write\s+a\s+post|generate\s+a\s+post|social\s+content)\s+(about|on|for)\s*/i),
    paramExtractor: (msg) => {
      const params: Record<string, string> = {};
      if (/\bncho\b|next\s+chapter/i.test(msg)) params.brand = "ncho";
      else if (/\bsomerschool|somers\s*school/i.test(msg)) params.brand = "somersschool";
      else if (/\balana|terry/i.test(msg)) params.brand = "alana_terry";
      if (/\binstagram\b/i.test(msg)) params.platform = "instagram";
      else if (/\bfacebook\b/i.test(msg)) params.platform = "facebook";
      else if (/\bpinterest\b/i.test(msg)) params.platform = "pinterest";
      return params;
    },
    baseConfidence: 0.65,
    subjectBonus: 0.15,
  },
  {
    type: "image_generate",
    triggers: [
      /\b(generate|create|make)\s+(an?\s+)?(image|picture|illustration|graphic)\b/i,
      /\b(image|picture|illustration|graphic)\s+of\s+(.+)/i,
    ],
    subjectExtractor: (msg) => {
      const m = msg.match(/\b(image|picture|illustration|graphic)\s+of\s+(.+)$/i);
      if (m) return m[2].trim();
      return extractAfterVerb(msg, /\b(generate|create|make)\s+(an?\s+)?(image|picture|illustration|graphic)\s+of\s*/i);
    },
    baseConfidence: 0.6,
    subjectBonus: 0.2,
  },
  {
    type: "voice_synth",
    triggers: [
      /\b(text.?to.?speech|tts|read\s+this\s+aloud|speak\s+this|narrate|voice\s+(this|that))\b/i,
    ],
    baseConfidence: 0.7,
    subjectBonus: 0.0,
  },
  {
    type: "intel_fetch",
    triggers: [
      /\b(run\s+intel|gather\s+intel|intel\s+on|intelligence\s+(on|about)|scan\s+for)\b/i,
    ],
    subjectExtractor: (msg) =>
      extractAfterVerb(msg, /\b(run\s+intel\s+on|gather\s+intel\s+on|intel\s+on|intelligence\s+on|intelligence\s+about|scan\s+for)\s*/i),
    baseConfidence: 0.65,
    subjectBonus: 0.2,
  },
];

/**
 * Detect the most likely tool invocation intent in a user message.
 * Returns null if no intent reaches minimum confidence.
 */
export function detectIntent(userMessage: string): Intent | null {
  if (!userMessage || userMessage.length < 3) return null;

  const candidates: Intent[] = [];

  for (const pattern of PATTERNS) {
    const matched = pattern.triggers.some((re) => re.test(userMessage));
    if (!matched) continue;

    let confidence = pattern.baseConfidence;
    const params: Record<string, string | number | undefined> = {};

    const subject = pattern.subjectExtractor?.(userMessage);
    if (subject) {
      params.subject = subject;
      confidence += pattern.subjectBonus;
    }

    if (pattern.paramExtractor) {
      Object.assign(params, pattern.paramExtractor(userMessage));
    }

    candidates.push({
      type: pattern.type,
      confidence: Math.min(confidence, 1),
      params,
      rawMessage: userMessage,
    });
  }

  if (candidates.length === 0) return null;

  // Return highest confidence candidate
  candidates.sort((a, b) => b.confidence - a.confidence);
  return candidates[0];
}

/**
 * Minimum confidence for auto-invocation. Below this, fall back to chat.
 */
export const INTENT_INVOKE_THRESHOLD = 0.7;

/**
 * Human-readable label for each intent type, for UI display.
 */
export const INTENT_LABELS: Record<IntentType, string> = {
  deep_research: "Deep Research",
  council_quick: "Council Quick Consult",
  doc_generate: "Generate Document",
  social_generate: "Social Post Generation",
  image_generate: "Image Generation",
  voice_synth: "Voice Synthesis",
  intel_fetch: "Intel Fetch",
};
