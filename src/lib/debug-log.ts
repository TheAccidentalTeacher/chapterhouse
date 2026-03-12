/**
 * debug-log.ts
 * Singleton client-side event log. Any component can call logEvent() and
 * the DebugPanel will update in real time. Works in production.
 */

export type LogLevel = "info" | "success" | "error" | "api" | "brain" | "click";

export type LogEntry = {
  id: string;
  ts: number;
  level: LogLevel;
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  detail?: any;
};

const MAX_ENTRIES = 300;
const entries: LogEntry[] = [];
const listeners = new Set<() => void>();

export function logEvent(level: LogLevel, label: string, detail?: unknown): void {
  entries.unshift({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    ts: Date.now(),
    level,
    label,
    detail,
  });
  if (entries.length > MAX_ENTRIES) entries.splice(MAX_ENTRIES);
  listeners.forEach((fn) => fn());
}

export function getEntries(): LogEntry[] {
  return [...entries];
}

export function clearLog(): void {
  entries.splice(0);
  listeners.forEach((fn) => fn());
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/**
 * Wraps a fetch call with automatic request/response logging.
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
      resBody
    );

    return res;
  } catch (e) {
    logEvent("error", `✗ ${tag} — network error`, String(e));
    throw e;
  }
}
