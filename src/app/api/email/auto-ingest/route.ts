/**
 * POST /api/email/auto-ingest
 *
 * Scans freshly categorized emails and auto-routes them:
 *   - newsletter / media → research_items (for the research library)
 *   - sales_inquiry / customer → opportunities (for the pipeline)
 *
 * Uses existing ai_summary from Haiku categorization — NO additional AI call.
 * Dedup via ingested_to_research / ingested_to_opportunity boolean flags.
 *
 * Called by:
 *   - /api/email/categorize (fire-and-forget at end of categorization)
 *   - Can also be called manually from the inbox UI
 */

import { NextResponse } from "next/server";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";
import { requireEmailAuth } from "@/lib/email-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 15;

export async function POST(req: Request): Promise<NextResponse> {
  const emailAuth = await requireEmailAuth(req);
  if (!emailAuth) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { userId } = emailAuth;

  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database not available" }, { status: 503 });
  }

  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  let researchIngested = 0;
  let opportunitiesCreated = 0;

  // ── Pass 1: Newsletter / Media → research_items ────────────────────────────
  try {
    const { data: newsletterEmails } = await supabase
      .from("emails")
      .select("id, subject, ai_summary, category, email_account, from_address, from_name")
      .eq("user_id", userId)
      .gte("ai_processed_at", oneHourAgo)
      .in("category", ["newsletter", "media"])
      .eq("ingested_to_research", false)
      .gte("urgency", 1)
      .order("received_at", { ascending: false })
      .limit(10);

    if (newsletterEmails && newsletterEmails.length > 0) {
      for (const email of newsletterEmails) {
        // Dedup check: does a research_item already exist with this email URL?
        const emailUrl = `email://${email.id}`;
        const { data: existing } = await supabase
          .from("research_items")
          .select("id")
          .eq("url", emailUrl)
          .limit(1);

        if (existing && existing.length > 0) {
          // Already ingested — just mark the flag
          await supabase
            .from("emails")
            .update({ ingested_to_research: true })
            .eq("id", email.id);
          continue;
        }

        const { error: insertErr } = await supabase
          .from("research_items")
          .insert({
            user_id: userId,
            url: emailUrl,
            title: email.subject || "(no subject)",
            summary: email.ai_summary || `Email from ${email.from_name || email.from_address}`,
            verdict: null,
            tags: [email.category, email.email_account || "unknown"].filter(Boolean),
            status: "review",
          });

        if (!insertErr) {
          await supabase
            .from("emails")
            .update({ ingested_to_research: true })
            .eq("id", email.id);
          researchIngested++;
        } else {
          console.warn(`[email/auto-ingest] research insert failed for ${email.id}:`, insertErr);
        }
      }
    }
  } catch (err) {
    console.error("[email/auto-ingest] Pass 1 (research) error:", err);
  }

  // ── Pass 2: Sales / Customer → opportunities ──────────────────────────────
  try {
    const { data: bizEmails } = await supabase
      .from("emails")
      .select("id, subject, ai_summary, category, from_name, from_address, email_account")
      .eq("user_id", userId)
      .gte("ai_processed_at", oneHourAgo)
      .in("category", ["sales_inquiry", "customer"])
      .eq("ingested_to_opportunity", false)
      .order("received_at", { ascending: false })
      .limit(10);

    if (bizEmails && bizEmails.length > 0) {
      for (const email of bizEmails) {
        // Dedup: check if an opportunity with this source_email_id already exists
        const { data: existing } = await supabase
          .from("opportunities")
          .select("id")
          .eq("source_email_id", email.id)
          .limit(1);

        if (existing && existing.length > 0) {
          await supabase
            .from("emails")
            .update({ ingested_to_opportunity: true })
            .eq("id", email.id);
          continue;
        }

        const oppCategory = email.category === "sales_inquiry" ? "inbound_lead" : "customer_signal";
        const { error: insertErr } = await supabase
          .from("opportunities")
          .insert({
            user_id: userId,
            title: email.subject || `${email.category} from ${email.from_name || email.from_address}`,
            description: email.ai_summary || `${email.category} email from ${email.from_name || email.from_address}`,
            category: oppCategory,
            store_score: 0,
            curriculum_score: 0,
            content_score: 0,
            status: "open",
            action: "Reply needed",
            source_email_id: email.id,
          });

        if (!insertErr) {
          await supabase
            .from("emails")
            .update({ ingested_to_opportunity: true })
            .eq("id", email.id);
          opportunitiesCreated++;
        } else {
          console.warn(`[email/auto-ingest] opportunity insert failed for ${email.id}:`, insertErr);
        }
      }
    }
  } catch (err) {
    console.error("[email/auto-ingest] Pass 2 (opportunities) error:", err);
  }

  console.log(`[email/auto-ingest] Done: ${researchIngested} → research, ${opportunitiesCreated} → opportunities`);

  return NextResponse.json({
    researchIngested,
    opportunitiesCreated,
  });
}
