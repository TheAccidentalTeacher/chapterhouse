/**
 * POST /api/enrich/[table]
 *
 * Phase 28A: AI Columns / Row-Level Enrichment.
 * Accepts table name + row IDs → Haiku 4.5 enriches each row → merges into enrichment_data JSONB.
 * Batch Size Law: max 10 IDs per request.
 *
 * Supported tables:
 *   dreams → priority_score (0-100) + effort_tag (low/medium/high/unknown)
 *   intel_sessions → business_track (operations/marketing/product/finance/other)
 *   social_posts → tone_tag + alt_text (gated on predicted_score existing)
 */

import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { handleRouteError } from "@/lib/route-helpers";
import { getAuthenticatedUserId } from "@/lib/auth-context";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

const ALLOWED_TABLES = ["dreams", "intel_sessions", "social_posts"] as const;
type AllowedTable = (typeof ALLOWED_TABLES)[number];

const enrichSchema = z.object({
  ids: z.array(z.string().uuid()).min(1).max(10),
});

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
}

interface EnrichResult {
  id: string;
  status: "ok" | "failed";
  error?: string;
}

async function enrichDream(
  anthropic: Anthropic,
  row: { id: string; text?: string; title?: string; notes?: string; status?: string }
): Promise<Record<string, unknown>> {
  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    system: "You score dream/project ideas. Return ONLY valid JSON.",
    messages: [{
      role: "user",
      content: `Score this dream seed for urgency × impact. Consider: revenue potential, time sensitivity, complexity.

Title: ${row.title || row.text || "Untitled"}
Notes: ${row.notes || "None"}
Status: ${row.status || "seed"}

Return JSON: {"priority_score": <0-100>, "effort_tag": "<low|medium|high|unknown>"}`,
    }],
  });
  const text = response.content[0].type === "text" ? response.content[0].text : "{}";
  try { return JSON.parse(text); } catch { return JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? "{}"); }
}

async function enrichIntelSession(
  anthropic: Anthropic,
  row: { id: string; session_label?: string; processed_output?: Record<string, unknown> }
): Promise<Record<string, unknown>> {
  const summary = (row.processed_output as { summary?: string })?.summary ?? row.session_label ?? "";
  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 128,
    system: "Classify intel findings into a primary business track. Return ONLY valid JSON.",
    messages: [{
      role: "user",
      content: `Classify this Intel session's primary business track.

Label: ${row.session_label || "Unlabeled"}
Summary: ${summary}

Return JSON: {"business_track": "<operations|marketing|product|finance|other>"}`,
    }],
  });
  const text = response.content[0].type === "text" ? response.content[0].text : "{}";
  try { return JSON.parse(text); } catch { return JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? "{}"); }
}

async function enrichSocialPost(
  anthropic: Anthropic,
  row: { id: string; post_text?: string; brand?: string; platform?: string }
): Promise<Record<string, unknown>> {
  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 256,
    system: "Tag social posts and generate alt text. Return ONLY valid JSON.",
    messages: [{
      role: "user",
      content: `Tag this social post's tone and generate alt text for accessibility.

Brand: ${row.brand || "unknown"}
Platform: ${row.platform || "unknown"}
Text: ${row.post_text || ""}

Return JSON: {"tone_tag": "<educational|promotional|personal|community>", "alt_text": "<accessibility description of the post content, max 125 chars>"}`,
    }],
  });
  const text = response.content[0].type === "text" ? response.content[0].text : "{}";
  try { return JSON.parse(text); } catch { return JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? "{}"); }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ table: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId().catch(() => null);
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const { table } = await params;

    if (!ALLOWED_TABLES.includes(table as AllowedTable)) {
      return Response.json(
        { error: `Invalid table. Allowed: ${ALLOWED_TABLES.join(", ")}` },
        { status: 400 }
      );
    }

    const body = await request.json();
    const parsed = enrichSchema.parse(body);

    const supabase = getSupabaseServiceRoleClient();
    if (!supabase) return Response.json({ error: "DB unavailable" }, { status: 500 });

    const anthropic = getAnthropic();
    const results: EnrichResult[] = [];

    // Fetch all rows in one query
    const selectColumns: Record<AllowedTable, string> = {
      dreams: "id, text, title, notes, status",
      intel_sessions: "id, session_label, processed_output",
      social_posts: "id, post_text, brand, platform, predicted_score",
    };

    const { data: rows, error: fetchErr } = await supabase
      .from(table)
      .select(selectColumns[table as AllowedTable])
      .in("id", parsed.ids);

    if (fetchErr || !rows) {
      return Response.json({ error: fetchErr?.message || "Failed to fetch rows" }, { status: 500 });
    }

    // Process each row
    for (const row of rows) {
      const r = row as unknown as Record<string, unknown>;
      const rowId = r.id as string;
      try {
        let enrichmentData: Record<string, unknown> = {};

        if (table === "dreams") {
          enrichmentData = await enrichDream(anthropic, r as unknown as { id: string; text?: string; title?: string; notes?: string; status?: string });
        } else if (table === "intel_sessions") {
          enrichmentData = await enrichIntelSession(anthropic, r as unknown as { id: string; session_label?: string; processed_output?: Record<string, unknown> });
        } else if (table === "social_posts") {
          enrichmentData = await enrichSocialPost(anthropic, r as unknown as { id: string; post_text?: string; brand?: string; platform?: string });
        }

        // Merge into existing enrichment_data (preserves unrelated keys)
        const existingData = (r.enrichment_data ?? {}) as Record<string, unknown>;
        const merged = { ...existingData, ...enrichmentData, enriched_at: new Date().toISOString() };

        await supabase
          .from(table)
          .update({ enrichment_data: merged })
          .eq("id", rowId);

        results.push({ id: rowId, status: "ok" });
      } catch (err) {
        results.push({ id: rowId, status: "failed", error: String(err) });
      }
    }

    return Response.json({
      enriched: results.filter((r) => r.status === "ok").length,
      failed: results.filter((r) => r.status === "failed").length,
      results,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
