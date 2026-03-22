/**
 * POST /api/email/draft-reply
 *
 * Generates a draft reply for a specific email using Claude Haiku 4.5.
 * Caches the draft on the email row so it doesn't need to be regenerated.
 *
 * Input: { emailId: string }
 * Output: { draft: string, emailId: string, cached: boolean }
 *
 * Model: Haiku 4.5 — drafts are low-stakes, editable, and speed matters.
 * Cost: ~$0.001 per draft (~500 tokens context)
 */

import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";
import { requireEmailAuth } from "@/lib/email-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 15;

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

const DRAFT_SYSTEM_PROMPT = `You are drafting a reply for Scott Somers (scott@nextchapterhomeschool.com).

Scott runs:
- NCHO (Next Chapter Homeschool Outpost) — Shopify homeschool curriculum store, launching now
- SomersSchool — Secular homeschool SaaS course platform
- BibleSaaS — AI Bible study app (personal/beta)

He is a middle school teacher in Glennallen, Alaska. Professional, warm, direct.

Guidelines:
- Match the email's formality level
- If it's a sales inquiry: express interest, ask clarifying questions
- If it's a customer question: be helpful, specific, empathetic
- If it's a vendor/partner: be professional, direct
- If it's media/press: be enthusiastic but measured
- If it's internal/personal: be casual and warm
- Keep replies concise — 2-4 paragraphs max
- Use "your child" not "your student" when addressing homeschool parents

Output ONLY the reply body text. Start with "Hi [Name]," (use first name from the sender). No subject line, no extra formatting.`;

interface EmailForDraft {
  id: string;
  subject: string;
  from_name: string | null;
  from_address: string;
  text_body: string | null;
  snippet: string | null;
  category: string | null;
  ai_summary: string | null;
  draft_reply: string | null;
  draft_generated_at: string | null;
}

export async function POST(req: Request): Promise<NextResponse> {
  const emailAuth = await requireEmailAuth(req);
  if (!emailAuth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: { emailId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const emailId = body.emailId;
  if (!emailId || typeof emailId !== "string") {
    return NextResponse.json({ error: "emailId is required" }, { status: 400 });
  }

  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database not available" }, { status: 503 });
  }

  // Fetch the email
  const { data: email, error: fetchErr } = await supabase
    .from("emails")
    .select("id, subject, from_name, from_address, text_body, snippet, category, ai_summary, draft_reply, draft_generated_at")
    .eq("id", emailId)
    .single() as { data: EmailForDraft | null; error: { message: string } | null };

  if (fetchErr || !email) {
    return NextResponse.json({ error: "Email not found" }, { status: 404 });
  }

  // Return cached draft if it exists and is less than 24 hours old
  if (email.draft_reply && email.draft_generated_at) {
    const age = Date.now() - new Date(email.draft_generated_at).getTime();
    if (age < 24 * 60 * 60 * 1000) {
      return NextResponse.json({ draft: email.draft_reply, emailId, cached: true });
    }
  }

  // Generate new draft via Haiku
  const anthropic = getAnthropic();
  const emailBody = email.text_body || email.snippet || email.ai_summary || "(no content available)";
  // Limit context to prevent token waste
  const truncatedBody = emailBody.slice(0, 2000);

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 512,
      system: DRAFT_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Draft a reply to this email:\n\nFrom: ${email.from_name || "Unknown"} <${email.from_address}>\nSubject: ${email.subject}\nCategory: ${email.category || "unknown"}\nAI Summary: ${email.ai_summary || "none"}\n\nBody:\n${truncatedBody}`,
        },
      ],
    });

    const draft = response.content[0].type === "text" ? response.content[0].text : "";

    if (draft) {
      // Cache the draft on the email row
      await supabase
        .from("emails")
        .update({
          draft_reply: draft,
          draft_generated_at: new Date().toISOString(),
        })
        .eq("id", emailId);
    }

    return NextResponse.json({ draft, emailId, cached: false });
  } catch (err) {
    console.error("[email/draft-reply] Haiku generation failed:", err);
    return NextResponse.json({ error: "Draft generation failed" }, { status: 500 });
  }
}
