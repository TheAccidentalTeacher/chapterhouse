/**
 * POST /api/workflows/run
 *
 * Phase 28B: Execute a workflow — iterate steps sequentially, pass outputs
 * between steps via context map, halt on first failure.
 *
 * Body: { workflow_id: uuid }
 */

import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { handleRouteError } from "@/lib/route-helpers";
import { getAuthenticatedUserId } from "@/lib/auth-context";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

const runSchema = z.object({
  workflow_id: z.string().uuid(),
});

interface WorkflowStep {
  id: string;
  step_type: string;
  params: Record<string, unknown>;
  output_key: string;
}

interface StepLog {
  step_id: string;
  step_type: string;
  status: "ok" | "failed" | "skipped";
  duration_ms: number;
  output_preview?: string;
  error?: string;
}

// Sanitize template variables: replace {{key}} with context map values
// Never eval — only string replacement
function interpolateParams(
  params: Record<string, unknown>,
  context: Record<string, string>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") {
      let interpolated = value;
      for (const [ctxKey, ctxVal] of Object.entries(context)) {
        // Sanitize: strip HTML tags from context values to prevent injection
        const sanitized = ctxVal.replace(/<[^>]*>/g, "");
        interpolated = interpolated.replace(new RegExp(`\\{\\{${ctxKey}\\}\\}`, "g"), sanitized);
      }
      result[key] = interpolated;
    } else {
      result[key] = value;
    }
  }
  return result;
}

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
}

async function executeStep(
  step: WorkflowStep,
  context: Record<string, string>,
  userId: string
): Promise<{ output: string; error?: string }> {
  const params = interpolateParams(step.params, context);
  const supabase = getSupabaseServiceRoleClient();

  switch (step.step_type) {
    case "council_query": {
      const anthropic = getAnthropic();
      const question = (params.question as string) || "No question provided";
      const response = await anthropic.messages.create({
        model: "claude-sonnet-4-5-20250514",
        max_tokens: 1024,
        system: "You are Gandalf from the Council of the Unserious. Answer concisely.",
        messages: [{ role: "user", content: question }],
      });
      return { output: response.content[0].type === "text" ? response.content[0].text : "" };
    }

    case "doc_generate": {
      const docType = (params.doc_type as string) || "report";
      const inputs = (params.inputs as Record<string, string>) || {};
      // Call the documents generate route internally
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const res = await fetch(`${baseUrl}/api/documents/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Cookie: `sb-access-token=${userId}` },
        body: JSON.stringify({ doc_type: docType, inputs, save: true }),
      });
      const text = await res.text();
      return { output: text.slice(0, 2000) };
    }

    case "social_generate": {
      if (!supabase) return { output: "", error: "DB unavailable" };
      const brand = (params.brand as string) || "ncho";
      const platform = (params.platform as string) || "facebook";
      const topicSeed = (params.topic_seed as string) || "";
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const res = await fetch(`${baseUrl}/api/social/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brands: [brand], platforms: [platform], count_per_combo: 2, topic_seed: topicSeed }),
      });
      const data = await res.json();
      return { output: JSON.stringify(data).slice(0, 2000) };
    }

    case "intel_fetch": {
      const urls = (params.urls as string[]) || [];
      if (urls.length === 0) return { output: "", error: "No URLs provided" };
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const res = await fetch(`${baseUrl}/api/intel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls }),
      });
      const data = await res.json();
      return { output: JSON.stringify(data).slice(0, 2000) };
    }

    case "enrich": {
      const table = (params.table as string) || "dreams";
      const ids = (params.ids as string[]) || [];
      if (ids.length === 0) return { output: "", error: "No IDs provided" };
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const res = await fetch(`${baseUrl}/api/enrich/${table}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      const data = await res.json();
      return { output: JSON.stringify(data).slice(0, 2000) };
    }

    case "schedule_buffer": {
      // Placeholder — would approve top N posts
      return { output: "schedule_buffer: placeholder — manual approval required" };
    }

    default:
      return { output: "", error: `Unknown step type: ${step.step_type}` };
  }
}

export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUserId().catch(() => null);
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const body = await request.json();
    const parsed = runSchema.parse(body);

    const supabase = getSupabaseServiceRoleClient();
    if (!supabase) return Response.json({ error: "DB unavailable" }, { status: 500 });

    // Fetch workflow
    const { data: workflow, error: fetchErr } = await supabase
      .from("workflows")
      .select("*")
      .eq("id", parsed.workflow_id)
      .eq("user_id", userId)
      .single();

    if (fetchErr || !workflow) {
      return Response.json({ error: "Workflow not found" }, { status: 404 });
    }

    const steps = workflow.steps as WorkflowStep[];
    if (!Array.isArray(steps) || steps.length === 0) {
      return Response.json({ error: "Workflow has no steps" }, { status: 400 });
    }

    // Execute steps sequentially
    const context: Record<string, string> = {};
    const logs: StepLog[] = [];
    let finalStatus: "success" | "failed" | "partial" = "success";

    for (const step of steps) {
      const start = Date.now();
      try {
        const { output, error } = await executeStep(step, context, userId);
        const duration = Date.now() - start;

        if (error) {
          logs.push({ step_id: step.id, step_type: step.step_type, status: "failed", duration_ms: duration, error });
          finalStatus = "failed";
          break; // Halt on first failure
        }

        context[step.output_key] = output;
        logs.push({
          step_id: step.id,
          step_type: step.step_type,
          status: "ok",
          duration_ms: duration,
          output_preview: output.slice(0, 200),
        });
      } catch (err) {
        const duration = Date.now() - start;
        logs.push({ step_id: step.id, step_type: step.step_type, status: "failed", duration_ms: duration, error: String(err) });
        finalStatus = "failed";
        break;
      }
    }

    // If some passed and some didn't run, mark partial
    if (finalStatus === "failed" && logs.some((l) => l.status === "ok")) {
      finalStatus = "partial";
    }

    // Update workflow run stats
    await supabase
      .from("workflows")
      .update({
        run_count: (workflow.run_count ?? 0) + 1,
        last_run_at: new Date().toISOString(),
        last_run_status: finalStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", parsed.workflow_id);

    return Response.json({
      workflow_id: parsed.workflow_id,
      status: finalStatus,
      steps_executed: logs.length,
      steps_total: steps.length,
      logs,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
