/**
 * GET /api/cron/email-digest
 *
 * Daily cron job — runs at 00:30 UTC (4:30 PM Alaska / 8:30 PM EST).
 * Runs BEFORE the daily brief (3:00 UTC) so email context is ready when the brief generates.
 *
 * Pipeline:
 *   1. Sync new emails from IMAP → Supabase `emails` table
 *   2. Categorize uncategorized emails via Claude Haiku
 *   3. Generate a daily markdown digest via Claude Sonnet
 *   4. Deactivate old email_daily context_files records
 *   5. Insert the new digest as context_files (document_type='email_daily', inject_order=5)
 *
 * The context_files record flows automatically into getSystemPrompt(),
 * which means EVERY chat call gets today's email digest as system context.
 *
 * Protected by CRON_SECRET bearer token.
 */

import Anthropic from "@anthropic-ai/sdk";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

const DIGEST_SYSTEM_PROMPT = `You are writing the daily email digest for Scott Somers' private ops system (Chapterhouse).

Scott runs:
- NCHO — Shopify homeschool store (launching now — CONTRACT ENDS MAY 24, 2026)
- SomersSchool — Secular homeschool SaaS (first revenue before August 2026)
- BibleSaaS — AI Bible study app (personal/beta)
- Email: scott@nextchapterhomeschool.com

Write a clean markdown digest of today's emails.

FORMAT:
# Email Digest — [today's date]

## ⚡ Action Required ([N] items)
- **[Category]** [From]: [What they want / the issue] — [urgency level]

## 📬 Today's Summary
[2-3 sentence plain-English summary of what hit the inbox today. Lead with revenue signals.]

## 📰 TLDR Intelligence (if newsletter content provided)
[Numbered bullet points — one per key insight relevant to Scott's products. Focus on: AI tools/models, EdTech developments, homeschool market signals, publishing industry moves, SaaS growth tactics. Skip pure consumer news. 5-8 bullets max. Format: "1. [topic]: [insight in one sentence]."]

## By Category

### Sales & Customer ([N] emails)
[Brief summaries of sales inquiries and customer emails]

### Orders ([N] emails)  
[Shopify/Stripe order notifications]

### Vendors & Media ([N] emails)
[Supplier, press, and partner emails]

### Newsletters & Notifications ([N] emails skimmed)
[High-signal items only — skip low-value newsletters entirely]

### Spam ([N] filtered)
[Just the count — no details]

## Full Log
[Compact list: one line per email, format: "- [ACCOUNT] [CATEGORY] from_name: subject — ai_summary"]

RULES:
- If Action Required is empty, omit that section.
- If no TLDR newsletter content was provided, omit the TLDR Intelligence section entirely.
- Be specific in summaries — name the actual person/company/product.
- Flag any potential revenue signals or time-sensitive items with ⚡.
- Keep the full digest under 2000 tokens.`;

export async function GET(request: Request): Promise<Response> {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) return Response.json({ error: "Database not available" }, { status: 503 });

  const origin =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  const cronHeaders: HeadersInit = {
    "Content-Type": "application/json",
    ...(cronSecret ? { authorization: `Bearer ${cronSecret}` } : {}),
  };

  // ── Step 1: Sync new emails from IMAP ─────────────────────────────────────
  let syncResult = { inserted: 0, skipped: 0, total: 0 };
  try {
    const syncRes = await fetch(`${origin}/api/email/sync`, {
      method: "POST",
      headers: cronHeaders,
    });
    if (syncRes.ok) {
      syncResult = await syncRes.json() as typeof syncResult;
      console.log(`[email-digest] Sync: ${syncResult.inserted} new, ${syncResult.skipped} skipped`);
    }
  } catch (e) {
    console.warn("[email-digest] Sync failed (non-fatal):", e);
  }

  // ── Step 2: Categorize uncategorized emails ────────────────────────────────
  let categorizeResult = { processed: 0, failed: 0 };
  try {
    const catRes = await fetch(`${origin}/api/email/categorize`, {
      method: "POST",
      headers: cronHeaders,
    });
    if (catRes.ok) {
      categorizeResult = await catRes.json() as typeof categorizeResult;
      console.log(`[email-digest] Categorized: ${categorizeResult.processed} emails`);
    }
  } catch (e) {
    console.warn("[email-digest] Categorize failed (non-fatal):", e);
  }

  // ── Step 3: Load today's emails from Supabase for the digest ──────────────
  const { data: usersData } = await supabase.auth.admin.listUsers();
  const userId = usersData?.users?.[0]?.id;
  if (!userId) return Response.json({ error: "No user found" }, { status: 500 });

  // Get all emails from the last 24 hours
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: todayEmails } = await supabase
    .from("emails")
    .select("uid, subject, from_name, from_address, received_at, category, ai_summary, action_required, urgency")
    .eq("user_id", userId)
    .gte("received_at", since24h)
    .order("urgency", { ascending: false })
    .order("received_at", { ascending: false })
    .limit(100);

  if (!todayEmails || todayEmails.length === 0) {
    console.log("[email-digest] No emails found for today — skipping digest generation");
    return Response.json({ ok: true, emails: 0, digestGenerated: false });
  }

  // ── Step 3.5: Fetch newsletter body content (last 48h) ──────────────────────
  // Expanded beyond TLDR to capture all high-signal newsletters.
  const since48h = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  const { data: newsletterEmails } = await supabase
    .from("emails")
    .select("id, subject, from_name, from_address, received_at, text_body, urgency")
    .eq("user_id", userId)
    .gte("received_at", since48h)
    .or("from_address.ilike.%tldr%,from_address.ilike.%substack%,from_address.ilike.%morning brew%,from_address.ilike.%daily.dev%,from_address.ilike.%the hustle%,from_address.ilike.%pragmatic%,category.eq.newsletter")
    .not("text_body", "is", null)
    .order("received_at", { ascending: false })
    .limit(5);

  type NewsletterRow = {
    id: string; subject: string; from_name: string | null;
    from_address: string; received_at: string; text_body: string | null; urgency: number | null;
  };

  const tldrContent = newsletterEmails && newsletterEmails.length > 0
    ? (newsletterEmails as NewsletterRow[])
        .map((e) =>
          `### ${e.subject} (${new Date(e.received_at).toLocaleDateString()})
${(e.text_body ?? "").slice(0, 3000)}`
        )
        .join("\n\n---\n\n")
    : null;

  // ── Step 4: Generate the digest with Claude Sonnet ────────────────────────
  // Group by category for the prompt
  type EmailDigestRow = {
    uid: number;
    subject: string;
    from_name: string | null;
    from_address: string;
    received_at: string;
    category: string | null;
    ai_summary: string | null;
    action_required: boolean | null;
    urgency: number | null;
  };

  const grouped: Record<string, EmailDigestRow[]> = {};
  for (const email of todayEmails as EmailDigestRow[]) {
    const cat = email.category ?? "other";
    (grouped[cat] ??= []).push(email);
  }

  const emailSummaryText = Object.entries(grouped)
    .map(([cat, emails]) =>
      `## ${cat.toUpperCase()} (${emails.length})\n` +
      emails.map((e) =>
        `- UID ${e.uid} | From: ${e.from_name ? `${e.from_name} <${e.from_address}>` : e.from_address}\n` +
        `  Subject: ${e.subject}\n` +
        `  Summary: ${e.ai_summary ?? "(not categorized)"}\n` +
        `  Action: ${e.action_required ? "YES" : "no"} | Urgency: ${e.urgency ?? 0}/5`
      ).join("\n\n")
    )
    .join("\n\n---\n\n");

  const anthropic = getAnthropic();
  let digestMarkdown = "";

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2000,
      system: DIGEST_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Today is ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}.\n\nHere are today's ${todayEmails.length} emails:\n\n${emailSummaryText}${tldrContent ? `\n\n---\n\n## TLDR NEWSLETTER RAW CONTENT (extract key intelligence for the TLDR Intelligence section):\n\n${tldrContent}` : ""}`,
        },
      ],
    });

    digestMarkdown = response.content[0].type === "text" ? response.content[0].text : "";
  } catch (genErr) {
    console.error("[email-digest] Claude Sonnet generation failed:", genErr);
    // Fall back to a simple auto-digest if Claude fails
    const actionItems = (todayEmails as EmailDigestRow[]).filter((e) => e.action_required);
    digestMarkdown = [
      `# Email Digest — ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`,
      "",
      `## Summary\n${todayEmails.length} emails received. ${actionItems.length} require action.`,
      "",
      actionItems.length > 0
        ? `## Action Required\n${actionItems.map((e) => `- **${e.category ?? "other"}** from ${e.from_address}: ${e.subject}`).join("\n")}`
        : "",
      "",
      `## Full Log\n${(todayEmails as EmailDigestRow[]).map((e) => `- [${e.category ?? "other"}] ${e.from_name || e.from_address}: ${e.subject} — ${e.ai_summary ?? "(uncategorized)"}`).join("\n")}`,
    ].filter(Boolean).join("\n");
  }

  if (!digestMarkdown) {
    return Response.json({ ok: true, emails: todayEmails.length, digestGenerated: false });
  }

  // ── Step 4.5A: Generate draft replies for action-required emails (max 5) ──
  const actionEmails = (todayEmails as EmailDigestRow[])
    .filter((e) => e.action_required)
    .slice(0, 5);

  if (actionEmails.length > 0) {
    const draftLines: string[] = [];
    for (const email of actionEmails) {
      try {
        // Look up the Supabase row ID for this email
        const { data: row } = await supabase
          .from("emails")
          .select("id")
          .eq("user_id", userId)
          .eq("uid", email.uid)
          .single();

        if (row?.id) {
          const draftRes = await fetch(`${origin}/api/email/draft-reply`, {
            method: "POST",
            headers: cronHeaders,
            body: JSON.stringify({ emailId: row.id }),
          });
          if (draftRes.ok) {
            const draftData = (await draftRes.json()) as { draft: string };
            draftLines.push(
              `- **${email.category ?? "other"}** ${email.from_name || email.from_address}: ${email.subject}\n  > **Suggested reply:** ${draftData.draft.slice(0, 300)}${draftData.draft.length > 300 ? "…" : ""}`
            );
          }
        }
      } catch {
        // Non-fatal — if one draft fails, continue
      }
    }

    if (draftLines.length > 0) {
      digestMarkdown += `\n\n## 📝 Draft Replies\n${draftLines.join("\n\n")}`;
    }
  }

  // ── Step 4.5B: Extract newsletter URLs → research pipeline ────────────────
  // Parse URLs from newsletter bodies and auto-ingest via existing research route.
  let urlsIngested = 0;
  if (newsletterEmails && newsletterEmails.length > 0) {
    const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/g;
    const trackingPatterns = /unsubscribe|click\.|track\.|list-manage|mailchimp|email\.mg\.|sendgrid|mailgun|utm_source.*utm_medium/i;
    const allUrls = new Set<string>();

    for (const nl of newsletterEmails as NewsletterRow[]) {
      if (!nl.text_body || (nl.urgency ?? 0) < 1) continue;
      const matches = nl.text_body.match(urlRegex) ?? [];
      for (const url of matches) {
        if (!trackingPatterns.test(url) && allUrls.size < 10) {
          allUrls.add(url);
        }
      }
    }

    for (const url of allUrls) {
      try {
        // Dedup: check if URL already exists in research_items
        const { data: existing } = await supabase
          .from("research_items")
          .select("id")
          .eq("url", url)
          .limit(1);

        if (existing && existing.length > 0) continue;

        await fetch(`${origin}/api/research`, {
          method: "POST",
          headers: cronHeaders,
          body: JSON.stringify({ url }),
        });
        urlsIngested++;
        // Rate limit: 1s delay between URL ingestions
        await new Promise((r) => setTimeout(r, 1000));
      } catch {
        // Non-fatal — if one URL fails, continue
      }
    }

    if (urlsIngested > 0) {
      console.log(`[email-digest] Ingested ${urlsIngested} newsletter URLs to research`);
    }
  }

  // ── Step 5: Save digest to context_files (inject_order=5) ─────────────────
  // Deactivate any prior email_daily records first
  await supabase
    .from("context_files")
    .update({ is_active: false })
    .eq("user_id", userId)
    .eq("document_type", "email_daily");

  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).replace(/\//g, "-");

  const { error: insertError } = await supabase
    .from("context_files")
    .insert({
      user_id: userId,
      document_type: "email_daily",
      inject_order: 5,
      is_active: true,
      content: digestMarkdown,
      name: `Email Digest — ${today}`,
    });

  if (insertError) {
    console.error("[email-digest] Failed to save to context_files:", insertError);
    return Response.json(
      { ok: false, error: insertError.message, emails: todayEmails.length },
      { status: 500 }
    );
  }

  console.log(`[email-digest] Digest saved. ${todayEmails.length} emails, ${syncResult.inserted} new, ${urlsIngested} URLs ingested.`);

  return Response.json({
    ok: true,
    emails: todayEmails.length,
    newToday: syncResult.inserted,
    categorized: categorizeResult.processed,
    digestGenerated: true,
    digestLength: digestMarkdown.length,
    urlsIngested,
    draftReplies: actionEmails.length,
  });
}
