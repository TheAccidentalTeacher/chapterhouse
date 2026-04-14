/**
 * POST /api/documents/edit
 *
 * Agentic document editing — natural language instructions applied to existing documents.
 * Uses optimistic locking via expected_version to prevent concurrent edit conflicts.
 *
 * Body:
 *   document_id: string (UUID)
 *   instruction: string (1-2000 chars)
 *   expected_version: number (current version the client sees)
 */

import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { handleRouteError } from "@/lib/route-helpers";
import { getAuthenticatedUserId } from "@/lib/auth-context";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

const editSchema = z.object({
  document_id: z.string().uuid(),
  instruction: z.string().min(1).max(2000),
  expected_version: z.number().int().positive(),
});

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
}

export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUserId().catch(() => null);
    if (!userId) {
      return new Response("Unauthorized", { status: 401 });
    }

    const body = await request.json();
    const parsed = editSchema.parse(body);

    const supabase = getSupabaseServiceRoleClient();
    if (!supabase) {
      return Response.json({ error: "Database unavailable" }, { status: 500 });
    }

    // Fetch document and verify ownership
    const { data: doc, error: fetchError } = await supabase
      .from("documents")
      .select("id, content, version, edit_history, user_id, title")
      .eq("id", parsed.document_id)
      .eq("user_id", userId)
      .single();

    if (fetchError || !doc) {
      return Response.json({ error: "Document not found" }, { status: 404 });
    }

    // Optimistic locking
    const currentVersion = doc.version ?? 1;
    if (parsed.expected_version !== currentVersion) {
      return Response.json(
        {
          error: "Document has been modified. Refresh and try again.",
          current_version: currentVersion,
        },
        { status: 409 }
      );
    }

    // Call Claude Sonnet to apply the edit
    const anthropic = getAnthropic();
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250514",
      max_tokens: 8192,
      system: `You are a document editor. Apply the user's edit instruction to the document. Return the COMPLETE edited document — do not summarize, truncate, or add commentary. Return only the document content.`,
      messages: [
        {
          role: "user",
          content: `Here is the document:\n\n${doc.content}\n\n---\n\nEdit instruction: ${parsed.instruction}\n\nReturn the complete edited document.`,
        },
      ],
    });

    const newContent =
      response.content[0].type === "text" ? response.content[0].text : "";

    if (!newContent.trim()) {
      return Response.json(
        { error: "AI returned empty content" },
        { status: 500 }
      );
    }

    // Build edit history entry
    const editEntry = {
      version: currentVersion,
      instruction: parsed.instruction,
      changed_at: new Date().toISOString(),
      previous_content: doc.content,
      model: "claude-sonnet-4-5",
    };

    const existingHistory = Array.isArray(doc.edit_history)
      ? doc.edit_history
      : [];

    // Update document
    const newVersion = currentVersion + 1;
    const { error: updateError } = await supabase
      .from("documents")
      .update({
        content: newContent.trim(),
        version: newVersion,
        edit_history: [...existingHistory, editEntry],
      })
      .eq("id", parsed.document_id)
      .eq("version", currentVersion); // double-check with DB-level optimistic lock

    if (updateError) {
      return Response.json(
        { error: "Failed to save edit" },
        { status: 500 }
      );
    }

    return Response.json({
      content: newContent.trim(),
      version: newVersion,
      edit_count: existingHistory.length + 1,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
