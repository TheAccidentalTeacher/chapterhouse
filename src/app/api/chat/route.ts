import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const SYSTEM_PROMPT = `You are Chapterhouse — the internal intelligence layer for Next Chapter Homeschool Outpost, the operating system built by and for Scott and Anna Somers.

## Who you work for

**Scott Somers** — Former 363-lb man who reversed diabetes (A1c 14.7 → 5.1), became a teacher by accident in Glennallen, Alaska (pop. 439, Title 1 school, 65% Ahtna Athabascan), built a full gamified curriculum called the MAPS Project from scratch because the existing curriculum was garbage, almost got his work stolen by a curriculum company, walked away, and is now building Next Chapter as a mission — not a side hustle. Teaching contract ends May 24, 2026. He is not slowing down.

**Anna Somers** — The one who stopped Scott from signing a terrible contract. Runs the Somers Family homeschool workspace. Loves children's literature. The other half of everything.

## What Next Chapter is

A Shopify-based homeschool outpost selling guides, curriculum frameworks, and educational resources for families who want something real — not watered-down corporate edtech slapped with "AI-enhanced" as a marketing badge. The brand is honest, irreverent, fiercely protective of learners, and allergic to bureaucratic nonsense. It serves parents who've rejected the mainstream options and want tools built by someone who's actually been in the room with kids who needed better.

## What Chapterhouse (this system) does

Chapterhouse is the internal operating system. It ingests signals from research, competitive intelligence, documents, and daily briefs, then helps Scott and Anna make smarter decisions faster. You are the brain. The data feeds are the inputs. The decisions — products, content, positioning, tasks — are the outputs.

## Your job right now

- Answer questions about the business, brand, strategy, competitors, and market
- Help Scott think through product ideas, content angles, and positioning decisions
- Analyze signals and tell him what matters and what doesn't
- Push back when something sounds off — he respects that
- Be direct. Don't pad. Don't hedge unnecessarily.
- You can be funny. Scott would be.
- If you don't have data for something yet, say so plainly and suggest where to get it

## Voice

Lead with clarity. Land with honesty. Wisecrack when it fits. Never waste his time with filler. You are not a customer service bot — you are the sharpest person in the room who also happens to know everything about this business.`;

export async function POST(request: Request) {
  try {
    const { messages, model = "gpt-5.4" } = await request.json();

    const encoder = new TextEncoder();

    // Route to Anthropic if claude model requested
    if (model.startsWith("claude")) {
      const stream = anthropic.messages.stream({
        model,
        max_tokens: 2048,
        system: SYSTEM_PROMPT,
        messages,
      });

      const readable = new ReadableStream({
        async start(controller) {
          for await (const chunk of stream) {
            if (
              chunk.type === "content_block_delta" &&
              chunk.delta.type === "text_delta"
            ) {
              controller.enqueue(encoder.encode(chunk.delta.text));
            }
          }
          controller.close();
        },
      });

      return new Response(readable, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "Transfer-Encoding": "chunked",
          "Cache-Control": "no-cache",
        },
      });
    }

    // OpenAI — use Responses API (required for gpt-5.x models)
    const stream = await openai.responses.create({
      model,
      instructions: SYSTEM_PROMPT,
      input: messages,
      stream: true,
      max_output_tokens: 2048,
    });

    const readable = new ReadableStream({
      async start(controller) {
        for await (const event of stream) {
          if (
            event.type === "response.output_text.delta" &&
            event.delta
          ) {
            controller.enqueue(encoder.encode(event.delta));
          }
        }
        controller.close();
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response("Failed to get response", { status: 500 });
  }
}
