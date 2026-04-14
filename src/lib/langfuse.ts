// src/lib/langfuse.ts
// Phase 20B — Langfuse LLM observability wrapper
// Non-fatal: if Langfuse is not configured or errors, the AI call still completes.

import { Langfuse } from "langfuse";

let langfuseInstance: Langfuse | null = null;

function getLangfuse(): Langfuse | null {
  if (!process.env.LANGFUSE_PUBLIC_KEY || !process.env.LANGFUSE_SECRET_KEY)
    return null;
  if (!langfuseInstance) {
    langfuseInstance = new Langfuse({
      publicKey: process.env.LANGFUSE_PUBLIC_KEY,
      secretKey: process.env.LANGFUSE_SECRET_KEY,
      baseUrl: process.env.LANGFUSE_HOST || "https://us.cloud.langfuse.com",
    });
  }
  return langfuseInstance;
}

/**
 * Wraps an AI call with Langfuse tracing. Non-fatal — if Langfuse is
 * not configured or errors, the AI call still completes normally.
 *
 * Usage:
 *   const result = await traceAI("chat-response", { model: "claude-sonnet-4-6", route: "/api/chat" }, async () => {
 *     return await anthropic.messages.create({ ... });
 *   });
 */
export async function traceAI<T>(
  name: string,
  metadata: { model: string; route: string; [key: string]: unknown },
  fn: () => Promise<T>
): Promise<T> {
  const lf = getLangfuse();
  if (!lf) return fn();

  const trace = lf.trace({ name, metadata });
  const generation = trace.generation({
    name,
    model: metadata.model,
    metadata: { route: metadata.route },
  });

  try {
    const result = await fn();
    generation.end({ output: "completed" });
    return result;
  } catch (error) {
    generation.end({
      output: "error",
      metadata: { error: String(error) },
    });
    throw error;
  } finally {
    await lf.flushAsync().catch(() => {}); // non-fatal
  }
}

/**
 * Get the Langfuse instance for direct trace queries (used by /api/costs route).
 */
export function getLangfuseClient(): Langfuse | null {
  return getLangfuse();
}
