import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { updateProgress } from "../lib/progress";

export interface NewsletterDraftPayload {
  blog_post_id: number;
  title: string;
  body_html: string;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export async function runNewsletterDraft(jobId: string, payload: NewsletterDraftPayload) {
  const { title, body_html, blog_post_id } = payload;
  const plainText = stripHtml(body_html).slice(0, 3000);

  await updateProgress(jobId, 10, "Generating newsletter draft via Claude Haiku...", "running");

  // Step 1: Generate subject line + email HTML via Claude Haiku
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  let subjectLine: string;
  let emailHtml: string;

  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 1500,
      system: `You write email newsletters for Next Chapter Homeschool Outpost (NCHO).
Voice: warm, teacher-curated, convicted. Always "your child" — never "your student".
Lead with the child (emotional), convert with the practical.
Forbidden words: explore, journey, leverage, synergy.
Output ONLY valid JSON: { "subject": "...", "html": "..." }
HTML must be email-safe: inline styles only, no external CSS, no JavaScript.`,
      messages: [
        {
          role: "user",
          content: `Convert this blog post into an NCHO email newsletter draft.

Blog post title: ${title}
Blog post content:
${plainText}

Return JSON with:
- subject: compelling email subject line (max 60 chars, no clickbait)
- html: full newsletter body (warm greeting, 2-3 paragraphs drawn from content, clear CTA to read the full post, warm closing from Scott)`,
        },
      ],
    });

    const raw = response.content[0].type === "text" ? response.content[0].text : "";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON object found in Claude response");
    const parsed = JSON.parse(jsonMatch[0]) as { subject?: string; html?: string };
    subjectLine = parsed.subject ?? `New from NCHO: ${title}`;
    emailHtml = parsed.html ?? `<p>${plainText.slice(0, 500)}</p>`;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await updateProgress(jobId, 0, `Claude generation failed: ${msg}`, "failed", undefined, msg);
    return;
  }

  await updateProgress(jobId, 50, "Saving newsletter to review queue...", "running");

  // Step 2: Save to social_posts as newsletter pending review — NEVER auto-send
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error: insertErr } = await supabase.from("social_posts").insert({
    brand: "ncho",
    platform: "email",
    content_type: "newsletter",
    post_text: subjectLine,
    image_brief: `Newsletter draft for blog post: ${title}`,
    hashtags: [],
    status: "pending_review",
    generation_prompt: `Newsletter draft from blog post ID ${blog_post_id}: ${title}`,
  });

  if (insertErr) {
    await updateProgress(
      jobId,
      0,
      `DB insert failed: ${insertErr.message}`,
      "failed",
      undefined,
      insertErr.message
    );
    return;
  }

  await updateProgress(jobId, 75, "Creating Brevo draft campaign...", "running");

  // Step 3: Create draft campaign in Brevo (no status field = draft, NEVER auto-send)
  const brevoKey = process.env.BREVO_API_KEY;
  let brevoCampaignId: number | null = null;

  if (brevoKey) {
    try {
      const brevoRes = await fetch("https://api.brevo.com/v3/emailCampaigns", {
        method: "POST",
        headers: {
          "api-key": brevoKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: `[DRAFT] ${title} — ${new Date().toISOString().slice(0, 10)}`,
          subject: subjectLine,
          sender: {
            name: "Next Chapter Homeschool",
            email: "scott@nextchapterhomeschool.com",
          },
          type: "classic",
          htmlContent: emailHtml,
          // No 'status' → Brevo creates as draft by default
          // No 'recipients' → cannot be sent without them (safety gate)
        }),
      });

      if (brevoRes.ok) {
        const brevoData = (await brevoRes.json()) as { id?: number };
        brevoCampaignId = brevoData.id ?? null;
      } else {
        const detail = await brevoRes.text();
        console.error("[newsletter-draft] Brevo API error:", detail);
        // Non-fatal — post is already saved to review queue
      }
    } catch (err) {
      console.error("[newsletter-draft] Brevo fetch failed:", err);
      // Non-fatal
    }
  } else {
    console.warn("[newsletter-draft] BREVO_API_KEY not set — skipping Brevo draft creation");
  }

  await updateProgress(
    jobId,
    100,
    `Newsletter draft ready for review${brevoCampaignId ? ` (Brevo ID: ${brevoCampaignId})` : ""}`,
    "completed",
    { blog_post_id, subject: subjectLine, brevo_campaign_id: brevoCampaignId }
  );
}
