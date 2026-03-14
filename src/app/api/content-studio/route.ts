import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

function getAnthropic() { return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }); }

const BRAND_VOICE = `
Brand voice: Honest, direct, earned authority. Irreverent toward corporate edtech and bureaucratic nonsense. Fiercely protective of learners. Allergic to empty hype. Written for parents who've opted out of mainstream options and want tools built by someone who's actually been in the room with kids.

The operation: Next Chapter Homeschool Outpost — a Shopify store selling books, curriculum frameworks, and guides for homeschool families. Founded by Scott Somers (former classroom teacher, curriculum builder) and Anna Somers (USA Today bestselling author and podcaster).

Rules: No filler phrases like "In today's world" or "As we navigate." No bullet-point fluff. No corporate hedging. Write like a person with strong opinions who has done the work.
`.trim();

function buildNewsletterPrompt(
  topic: string,
  notes: string,
  format: string
): string {
  return `${BRAND_VOICE}

You are writing ${format === "newsletter" ? "an email newsletter" : "a marketing campaign brief"} for Next Chapter Homeschool Outpost.

Topic: ${topic}
${notes ? `Additional context: ${notes}` : ""}

${
  format === "newsletter"
    ? `Write a complete newsletter email. Include:
- Subject line (punchy, no clickbait)
- Preview text (1 sentence)
- Body (conversational, 250–400 words, grounded in the topic)
- A clear CTA`
    : `Write a campaign brief. Include:
- Campaign angle / hook
- 3 channels (email, social, store banner) with a distinct message for each
- Key message in one sentence
- Suggested CTA`
}`;
}

function buildCurriculumGuidePrompt(
  title: string,
  author: string,
  gradeRange: string,
  guideType: string
): string {
  const typeInstructions: Record<string, string> = {
    discussion: `Write a set of 10 discussion questions organized into three tiers:
- Comprehension (3 questions — what happened)
- Analysis (4 questions — why it matters, author's choices)
- Extension (3 questions — connect to real life, broader ideas)
Each question should be open-ended and push past surface recall.`,
    unit: `Write a complete unit study outline. Include:
- Unit overview (2–3 sentences)
- Learning objectives (5–7, grade-appropriate)
- Week-by-week reading schedule (4 weeks)
- One hands-on project per week
- Vocabulary list (10 words with brief definitions)
- Final project / assessment options (3 choices)`,
    activities: `Write an activity set with 6 hands-on activities for this book. For each:
- Activity name
- Time estimate
- Materials needed
- Instructions (3–5 steps)
- How it connects to the text`,
  };

  return `${BRAND_VOICE}

You are writing a curriculum companion guide for Next Chapter Homeschool Outpost.

Book: "${title}" by ${author}
Grade range: ${gradeRange}
Guide type: ${guideType}

Legal note: This guide is original educational content created to accompany the book, not reproduce it. It follows the legal "companion guide" model — referencing the book's title, author, characters, and events to support learning. This is the same model used by teachers' guides, SparkNotes, and published study guides.

${typeInstructions[guideType] ?? typeInstructions.discussion}

End with a one-line SEO-friendly product description (under 150 characters) that could be used as the Shopify product subtitle.`;
}

function buildProductDescriptionPrompt(
  productName: string,
  productType: string,
  notes: string,
  gradeRange: string
): string {
  return `${BRAND_VOICE}

You are writing a Shopify product description for Next Chapter Homeschool Outpost.

Product: ${productName}
Type: ${productType}
Grade range: ${gradeRange}
${notes ? `Notes: ${notes}` : ""}

Write a complete Shopify product description. Include:
1. **Headline** — one punchy sentence that sells the transformation, not the features (under 12 words)
2. **Body** — 3–4 sentences. What it is, who it's for, why it works. No fluff.
3. **What's included** — bullet list (4–6 items, specific and concrete)
4. **Who this is for** — 2 sentences. Name the parent/student this is built for.
5. **SEO meta description** — 150 characters, keyword-rich, for the search snippet.

Format the output clearly with each section labeled. Do not add any other sections.`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { mode } = body;

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: "Anthropic API key not configured" }, { status: 500 });
    }

    let prompt = "";

    if (mode === "newsletter") {
      const { topic, notes, format } = body;
      if (!topic) return NextResponse.json({ error: "topic required" }, { status: 400 });
      prompt = buildNewsletterPrompt(topic, notes ?? "", format ?? "newsletter");
    } else if (mode === "curriculum-guide") {
      const { title, author, gradeRange, guideType } = body;
      if (!title || !author) return NextResponse.json({ error: "title and author required" }, { status: 400 });
      prompt = buildCurriculumGuidePrompt(
        title,
        author,
        gradeRange ?? "General",
        guideType ?? "discussion"
      );
    } else if (mode === "product-description") {
      const { productName, productType, notes, gradeRange } = body;
      if (!productName) return NextResponse.json({ error: "productName required" }, { status: 400 });
      prompt = buildProductDescriptionPrompt(
        productName,
        productType ?? "Physical book",
        notes ?? "",
        gradeRange ?? "General"
      );
    } else {
      return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
    }

    const message = await getAnthropic().messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });

    const text =
      message.content[0]?.type === "text" ? message.content[0].text : "";

    return NextResponse.json({ text });
  } catch (err) {
    console.error("[content-studio]", err);
    return NextResponse.json({ error: "Generation failed" }, { status: 500 });
  }
}
