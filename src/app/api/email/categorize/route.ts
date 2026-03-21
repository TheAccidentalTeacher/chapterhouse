/**
 * POST /api/email/categorize
 *
 * Runs Claude Haiku on uncategorized emails in the Supabase `emails` table.
 * Processes up to 30 emails per call to stay within Haiku's context window.
 * Each email gets: category, ai_summary, action_required, urgency.
 *
 * Claude Haiku is the right model here:
 *   - Fast (< 2s per batch of 10)
 *   - Cheap ($0.25/MTok input, $1.25/MTok output)
 *   - Pattern recognition (is this spam?) is exactly what Haiku excels at
 *   - No high-stakes reasoning needed here — categorization is low-risk
 *
 * Returns: { processed: number, failed: number }
 *
 * Called by:
 *   - /api/cron/email-digest (daily cron, after sync)
 *   - Email inbox UI "Sync & Categorize" button (manual)
 */

import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

const CATEGORIZE_SYSTEM_PROMPT = `You are an email classifier for Chapterhouse, Scott Somers' private ops system.

Scott runs these businesses:
- NCHO (Next Chapter Homeschool Outpost) — Shopify homeschool store, newly launching
- SomersSchool — Homeschool SaaS course platform
- BibleSaaS — AI Bible study app (personal/beta)

Scott's email accounts:
  - NCHO: scott@nextchapterhomeschool.com (Mailcow self-hosted)
  - Personal Gmail: scosom@gmail.com
  - Gmail NCHO: additional Google Workspace account

Email from any of Scott's own addresses = internal. Email sent TO these addresses from others follows normal categorization.

CATEGORIES (use exactly one of these strings):
  spam           — unsolicited, promotional junk you didn't ask for, phishing
  newsletter     — email lists Scott subscribed to: news digests, Substack, blogs
  notification   — automated system notifications: GitHub alerts, Vercel deploys, Supabase, Stripe events, app pings
  vendor         — supplier/service provider communications: Ingram Spark, Shopify partner, tech vendors, invoices
  sales_inquiry  — someone wants to buy from Scott or partner with his businesses — HIGH PRIORITY
  customer       — existing customer question, feedback, support request — HIGH PRIORITY
  order          — e-commerce order confirmations, Shopify order notifications, Stripe payment confirmations
  media          — press, podcast invitations, blogger outreach, review requests
  internal       — from Scott himself, Anna, family, or close collaborators
  other          — doesn't fit any category above

URGENCY (0–5 integer):
  0 — no action: spam, newsletters, routine notifications
  1 — low: vendor update, FYI emails
  2 — medium: vendor invoice, partner inquiry
  3 — high: customer question needing reply within 24h
  4 — very high: sales inquiry, media opportunity with deadline
  5 — critical: legal, payment failure, urgent customer issue

For each email, return JSON in this exact format — output ONLY a JSON array, nothing else:

[
  {
    "uid": 12345,
    "category": "notification",
    "ai_summary": "GitHub Actions workflow failed on CoursePlatform main branch.",
    "action_required": false,
    "urgency": 0
  }
]

Rules:
- action_required = true only when Scott needs to DO something (reply, call, pay, fix)
- Keep ai_summary to 1 sentence max. Be specific — name the actual product/person/issue.
- If subject/snippet is empty, use from_address to infer category.
- Never expose personally identifiable information in ai_summary beyond what's already in the email.`;

interface EmailRow {
  id: string;
  uid: number;
  subject: string;
  from_name: string | null;
  from_address: string;
  snippet: string | null;
}

interface HaikuResult {
  uid: number;
  category: string;
  ai_summary: string;
  action_required: boolean;
  urgency: number;
}

const VALID_CATEGORIES = new Set([
  "spam", "vendor", "sales_inquiry", "customer", "newsletter",
  "notification", "internal", "order", "media", "other",
]);

export async function POST(): Promise<NextResponse> {
  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database not available" }, { status: 503 });
  }

  const { data: usersData } = await supabase.auth.admin.listUsers();
  const userId = usersData?.users?.[0]?.id;
  if (!userId) {
    return NextResponse.json({ error: "No user found" }, { status: 500 });
  }

  // Fetch emails that haven't been categorized yet
  const { data: emails, error: fetchError } = (await supabase
    .from("emails")
    .select("id, uid, subject, from_name, from_address, snippet")
    .eq("user_id", userId)
    .is("ai_processed_at", null)
    .order("received_at", { ascending: false })
    .limit(30)) as { data: EmailRow[] | null; error: { message: string } | null };

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }
  if (!emails || emails.length === 0) {
    return NextResponse.json({ processed: 0, failed: 0 });
  }

  const anthropic = getAnthropic();
  let processed = 0;
  let failed = 0;

  // Process in batches of 10 to keep Haiku prompts short and fast
  const batchSize = 10;
  for (let i = 0; i < emails.length; i += batchSize) {
    const batch = emails.slice(i, i + batchSize);

    const emailsText = batch
      .map((email) =>
        `UID: ${email.uid}\n` +
        `From: ${email.from_name ? `${email.from_name} <${email.from_address}>` : email.from_address}\n` +
        `Subject: ${email.subject}\n` +
        `Snippet: ${email.snippet ?? "(no body)"}`
      )
      .join("\n\n---\n\n");

    try {
      const response = await anthropic.messages.create({
        model: "claude-haiku-4-5",
        max_tokens: 1024,
        system: CATEGORIZE_SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: `Classify these ${batch.length} emails:\n\n${emailsText}`,
          },
        ],
      });

      const raw = response.content[0].type === "text" ? response.content[0].text : "";

      let results: HaikuResult[];
      try {
        // Haiku sometimes wraps in a code fence — strip it
        const cleaned = raw.replace(/```json?\n?/gi, "").replace(/```/g, "").trim();
        results = JSON.parse(cleaned) as HaikuResult[];
      } catch {
        // Try to extract array from response
        const match = raw.match(/\[[\s\S]*\]/);
        if (!match) {
          console.warn("[email/categorize] Haiku returned invalid JSON for batch, skipping");
          failed += batch.length;
          continue;
        }
        results = JSON.parse(match[0]) as HaikuResult[];
      }

      // Build update rows
      const now = new Date().toISOString();
      for (const result of results) {
        const email = batch.find((e) => e.uid === result.uid);
        if (!email) continue;

        const category = VALID_CATEGORIES.has(result.category) ? result.category : "other";

        const { error: updateErr } = await supabase
          .from("emails")
          .update({
            category,
            ai_summary: (result.ai_summary ?? "").slice(0, 300),
            action_required: !!result.action_required,
            urgency: Math.min(5, Math.max(0, Math.round(result.urgency ?? 0))),
            ai_processed_at: now,
          })
          .eq("id", email.id);

        if (updateErr) {
          console.warn(`[email/categorize] Update failed for uid ${result.uid}:`, updateErr);
          failed++;
        } else {
          processed++;
        }
      }
    } catch (batchErr) {
      console.error("[email/categorize] Haiku batch failed:", batchErr);
      failed += batch.length;
    }
  }

  return NextResponse.json({ processed, failed });
}
