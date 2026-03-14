/**
 * debug-log.ts
 * Singleton client-side event log. Any component can call logEvent() and
 * the DebugPanel will update in real time. Works in production.
 */

export type LogLevel = "info" | "success" | "error" | "api" | "brain" | "click" | "perf" | "nav" | "realtime";

export type LogEntry = {
  id: string;
  ts: number;
  level: LogLevel;
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  detail?: any;
  /** Duration in ms, for perf entries */
  durationMs?: number;
};

const MAX_ENTRIES = 500;
const entries: LogEntry[] = [];
const listeners = new Set<() => void>();

/** Session stats — lightweight counters for the debug pill */
export const sessionStats = {
  apiCalls: 0,
  errors: 0,
  aiTokensEstimated: 0,
  startedAt: Date.now(),
};

export function logEvent(level: LogLevel, label: string, detail?: unknown, durationMs?: number): void {
  entries.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    ts: Date.now(),
    level,
    label,
    detail,
    durationMs,
  });
  if (level === "api") sessionStats.apiCalls++;
  if (level === "error") sessionStats.errors++;
  if (entries.length > MAX_ENTRIES) entries.splice(MAX_ENTRIES);
  listeners.forEach((fn) => fn());
}

export function getEntries(): LogEntry[] {
  return [...entries];
}

export function clearLog(): void {
  entries.splice(0);
  sessionStats.apiCalls = 0;
  sessionStats.errors = 0;
  sessionStats.aiTokensEstimated = 0;
  listeners.forEach((fn) => fn());
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/**
 * Wraps a fetch call with automatic request/response logging + performance timing.
 * Usage: loggedFetch("/api/summarize", { method: "POST" }, "Condense knowledge")
 */
export async function loggedFetch(
  url: string,
  init: RequestInit = {},
  label?: string
): Promise<Response> {
  const tag = label ?? `${init.method ?? "GET"} ${url}`;
  const reqBody = init.body ? (() => { try { return JSON.parse(init.body as string); } catch { return init.body; } })() : undefined;

  logEvent("api", `→ ${tag}`, reqBody !== undefined ? { request: reqBody } : undefined);

  const start = Date.now();
  try {
    const res = await fetch(url, init);
    const elapsed = Date.now() - start;

    // Clone so caller can still read the body
    const clone = res.clone();
    let resBody: unknown;
    try { resBody = await clone.json(); } catch { resBody = "(non-JSON body)"; }

    logEvent(
      res.ok ? "success" : "error",
      `← ${tag} [${res.status}] ${elapsed}ms`,
      resBody,
      elapsed
    );

    return res;
  } catch (e) {
    const elapsed = Date.now() - start;
    logEvent("error", `✗ ${tag} — network error`, String(e), elapsed);
    throw e;
  }
}

/**
 * Log a navigation event (page change).
 */
export function logNavigation(from: string, to: string): void {
  logEvent("nav", `${from} → ${to}`);
}

/**
 * Measure and log a performance-sensitive operation.
 * Usage: const end = startPerfTimer("Council SSE parse"); ... end();
 */
export function startPerfTimer(label: string): () => void {
  const start = Date.now();
  return () => {
    const elapsed = Date.now() - start;
    logEvent("perf", `⏱ ${label}: ${elapsed}ms`, { durationMs: elapsed }, elapsed);
  };
}
