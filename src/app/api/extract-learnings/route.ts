import OpenAI from "openai";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// POST /api/extract-learnings
// Called silently after each AI response. Reads the recent conversation,
// extracts any new facts worth remembering, and saves them to founder_notes.
export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    if (!messages || messages.length < 2) {
      return Response.json({ extracted: [] });
    }

    // Only look at the last 6 messages (3 exchanges) for efficiency
    const recent = messages.slice(-6);
    const conversationText = recent
      .filter((m: { role: string; content: string }) => m.role !== "system")
      .map((m: { role: string; content: string }) =>
        `${m.role === "user" ? "Scott" : "Chapterhouse"}: ${m.content}`
      )
      .join("\n\n");

    const prompt = `You are reviewing a conversation between Scott Somers (a homeschool entrepreneur) and Chapterhouse (his internal AI operating system) to extract any new facts worth remembering permanently.

Extract ONLY facts that are genuinely new and useful to remember long-term:
- Preferences Scott or Anna expressed ("I want X", "I hate Y", "we decided Z")
- Business decisions made
- Personal context revealed (goals, constraints, timelines, feelings about something)
- Things about Scott or Anna's character, taste, or working style
- Specific product, content, or strategy directions confirmed

Do NOT extract:
- General knowledge or facts about the market/competitors (that's Research, not Memory)
- Things already obviously known from context
- Vague or generic statements
- Questions without answers

Conversation:
${conversationText}

Respond with ONLY a valid JSON array. Each item has:
{
  "content": "the fact, written as a clear declarative statement",
  "category": one of: "scott" | "anna" | "business" | "preference" | "decision" | "general"
}

If there is nothing worth remembering, return an empty array: []
No markdown. No explanation. Just the JSON array.`;

    const aiResponse = await openai.responses.create({
      model: "gpt-5.4",
      instructions: "You output only valid JSON arrays. No markdown fences. No explanation.",
      input: prompt,
      max_output_tokens: 512,
    });

    const rawText = aiResponse.output
      .filter((block) => block.type === "message")
      .flatMap((block) =>
        (block as { type: "message"; content: Array<{ type: string; text: string }> }).content
      )
      .filter((part) => part.type === "output_text")
      .map((part) => part.text)
      .join("");

    let extracted: Array<{ content: string; category: string }> = [];
    try {
      const parsed = JSON.parse(rawText.trim());
      extracted = Array.isArray(parsed) ? parsed : [];
    } catch {
      const match = rawText.match(/```(?:json)?\s*([\s\S]+?)```/);
      if (match) {
        try { extracted = JSON.parse(match[1]); } catch { extracted = []; }
      }
    }

    if (extracted.length === 0) {
      return Response.json({ extracted: [] });
    }

    // Save to founder_notes
    const supabase = getSupabaseServiceRoleClient();
    if (!supabase) return Response.json({ extracted: [] });

    const rows = extracted
      .filter((e) => e.content && e.content.trim().length > 5)
      .map((e) => ({
        content: e.content.trim(),
        category: e.category || "general",
        source: "auto",
      }));

    if (rows.length > 0) {
      await supabase.from("founder_notes").insert(rows);
    }

    return Response.json({ extracted: rows });
  } catch (e) {
    // Silent failure — this is a background enhancement, never block the user
    console.error("extract-learnings error:", e);
    return Response.json({ extracted: [] });
  }
}
