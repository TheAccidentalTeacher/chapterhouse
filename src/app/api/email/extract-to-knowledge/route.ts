import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

export const maxDuration = 30;

const client = new Anthropic();

// POST /api/email/extract-to-knowledge
// Body: { uid, account, subject, from, fromAddress, date, reason, folder?, subfolder? }
//
// 1. Fetches persisted email text from Supabase (text_body + ai_summary).
// 2. Calls Claude Haiku to extract a clean, reusable knowledge node.
// 3. Inserts into knowledge_nodes with is_active=false (Scott promotes it manually).

export async function POST(req: NextRequest) {
  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase service role not configured" }, { status: 500 });
  }

  const body = await req.json();

  const { uid, account, subject, from: fromName, fromAddress, date, reason, folder, subfolder } = body;

  if (!uid || !account) {
    return NextResponse.json({ error: "uid and account are required" }, { status: 400 });
  }

  // 1. Fetch persisted email content
  let emailContent = "";
  try {
    const { data: emailRow } = await supabase
      .from("emails")
      .select("text_body, ai_summary, html_body")
      .eq("uid", uid)
      .eq("email_account", account)
      .maybeSingle();

    if (emailRow) {
      // Prefer text_body, fall back to ai_summary, truncate to 8000 chars to stay within Haiku context
      emailContent = (emailRow.text_body as string | null)?.slice(0, 8000)
        ?? (emailRow.ai_summary as string | null)
        ?? "";
    }
  } catch {
    // If emails table doesn't have the row, we still try extraction with metadata only
  }

  // Build extraction prompt
  const metaLine = `Subject: ${subject}\nFrom: ${fromName} <${fromAddress}>\nDate: ${date}${reason ? `\nContext: ${reason}` : ""}`;
  const contentSection = emailContent ? `\n\nEmail content:\n${emailContent}` : "\n\n(No body available — use subject/context only)";

  const prompt = `You are extracting a concise, reusable knowledge node from a newsletter or email.

INPUT:
${metaLine}${contentSection}

OUTPUT (JSON only, no markdown wrapper):
{
  "title": "<short, specific title — 3 to 8 words>",
  "body": "<2 to 5 sentences of distilled, evergreen insight — avoid dates and 'today', write as persistent fact or trend>"
}

Rules:
- title must be specific, not generic ("AI Safety Update" is bad, "LiteLLM supply-chain theft vector via PyPI" is good)
- body must be self-contained — readable without the original email
- strip filler, greetings, footers, and ad copy
- if there is no real signal worth saving, return {"title": "SKIP", "body": ""}`;

  // 2. Call Claude Haiku for extraction
  let title = "";
  let nodeBody = "";
  try {
    const completion = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 400,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = (completion.content[0] as { type: string; text: string }).text.trim();
    // Strip any accidental markdown fences
    const jsonText = raw.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    const parsed = JSON.parse(jsonText) as { title: string; body: string };
    title = parsed.title ?? "";
    nodeBody = parsed.body ?? "";
  } catch {
    return NextResponse.json({ error: "Claude Haiku extraction failed — could not parse JSON response" }, { status: 500 });
  }

  if (!title || title === "SKIP" || !nodeBody) {
    return NextResponse.json({ skipped: true, reason: "No signal worth saving" });
  }

  // 3. Insert knowledge node
  const resolvedFolder = folder?.trim() || "newsletters";
  const resolvedSubfolder = subfolder?.trim() || null;
  const sourceRef = `${fromName || fromAddress} | ${date} | ${account}:${uid}`;

  const { data: node, error } = await supabase
    .from("knowledge_nodes")
    .insert({
      folder: resolvedFolder,
      subfolder: resolvedSubfolder,
      title,
      body: nodeBody,
      source_type: "email_newsletter",
      source_ref: sourceRef,
      is_active: false,
      inject_order: 100,
      tags: [],
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, node });
}
