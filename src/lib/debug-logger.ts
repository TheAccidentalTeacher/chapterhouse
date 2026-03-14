/**
 * Chapterhouse Debug Logger
 * All logs are grouped under "🏠 Chapterhouse" in the F12 console.
 * Enable/disable by setting localStorage.setItem('chapterhouse_debug', 'true')
 * It is always on in development. In production it reads localStorage.
 */

const IS_DEV = process.env.NODE_ENV === "development";

function isEnabled(): boolean {
  if (IS_DEV) return true;
  try {
    return localStorage.getItem("chapterhouse_debug") === "true";
  } catch {
    return false;
  }
}

const STYLES = {
  header:   "background:#6d28d9;color:#fff;padding:2px 8px;border-radius:4px;font-weight:bold",
  info:     "color:#a78bfa;font-weight:600",
  success:  "color:#34d399;font-weight:600",
  warn:     "color:#fbbf24;font-weight:600",
  error:    "color:#f87171;font-weight:bold",
  muted:    "color:#6b7280",
  data:     "color:#93c5fd",
};

export const log = {
  group(label: string) {
    if (!isEnabled()) return;
    console.groupCollapsed(`%c🏠 Chapterhouse %c${label}`, STYLES.header, STYLES.info);
  },

  groupEnd() {
    if (!isEnabled()) return;
    console.groupEnd();
  },

  info(msg: string, data?: unknown) {
    if (!isEnabled()) return;
    if (data !== undefined) {
      console.log(`%c  ℹ ${msg}`, STYLES.info, data);
    } else {
      console.log(`%c  ℹ ${msg}`, STYLES.info);
    }
  },

  success(msg: string, data?: unknown) {
    if (!isEnabled()) return;
    if (data !== undefined) {
      console.log(`%c  ✓ ${msg}`, STYLES.success, data);
    } else {
      console.log(`%c  ✓ ${msg}`, STYLES.success);
    }
  },

  warn(msg: string, data?: unknown) {
    if (!isEnabled()) return;
    if (data !== undefined) {
      console.warn(`%c  ⚠ ${msg}`, STYLES.warn, data);
    } else {
      console.warn(`%c  ⚠ ${msg}`, STYLES.warn);
    }
  },

  error(msg: string, data?: unknown) {
    if (!isEnabled()) return;
    if (data !== undefined) {
      console.error(`%c  ✗ ${msg}`, STYLES.error, data);
    } else {
      console.error(`%c  ✗ ${msg}`, STYLES.error);
    }
  },

  data(label: string, value: unknown) {
    if (!isEnabled()) return;
    console.log(`%c  → ${label}:`, STYLES.muted, value);
  },

  timing(label: string, ms: number) {
    if (!isEnabled()) return;
    const color = ms < 500 ? STYLES.success : ms < 2000 ? STYLES.warn : STYLES.error;
    console.log(`%c  ⏱ ${label}: ${ms}ms`, color);
  },

  // Called once on app mount - prints full system status
  systemStatus(status: SystemStatus) {
    if (!isEnabled()) return;
    console.groupCollapsed("%c🏠 Chapterhouse %cSystem Status", STYLES.header, STYLES.info);

    console.log("%c  Environment", STYLES.info);
    console.log(`%c    NODE_ENV: ${status.env}`, STYLES.muted);
    console.log(`%c    Build:`, STYLES.muted, status.buildTime ?? "unknown");

    console.log("%c  Services", STYLES.info);
    _statusLine("OpenAI",    status.openai);
    _statusLine("Anthropic", status.anthropic);
    _statusLine("Supabase",  status.supabase);

    console.log("%c  Models available", STYLES.info);
    status.models.forEach((m) => console.log(`%c    • ${m}`, STYLES.muted));

    if (status.errors?.length) {
      console.log("%c  Errors", STYLES.error);
      status.errors.forEach((e) => console.error(`%c    ✗ ${e}`, STYLES.error));
    }

    console.log(
      "%c  💡 Tip: run %cchapterhouseDebug.help()%c in the console for runtime tools",
      STYLES.muted, "color:#c4b5fd;font-family:monospace", STYLES.muted
    );

    console.groupEnd();
  },
};

function _statusLine(name: string, ok: boolean | "unknown") {
  if (ok === true)        console.log(`%c    ✓ ${name} — connected`, STYLES.success);
  else if (ok === false)  console.error(`%c    ✗ ${name} — NOT configured`, STYLES.error);
  else                    console.warn(`%c    ? ${name} — unknown`, STYLES.warn);
}

export type SystemStatus = {
  env: string;
  buildTime?: string;
  openai: boolean | "unknown";
  anthropic: boolean | "unknown";
  supabase: boolean | "unknown";
  models: string[];
  errors?: string[];
};

// Attach runtime helpers to window so you can call them in the console
export function mountConsoleHelpers(models: { id: string; label: string }[]) {
  if (typeof window === "undefined") return;

  const helpers = {
    help() {
      console.group("%c🏠 Chapterhouse Console Helpers", STYLES.header);
      console.log("%c  chapterhouseDebug.status()         ", STYLES.info, "— re-fetch system status");
      console.log("%c  chapterhouseDebug.enable()         ", STYLES.info, "— enable debug logs in production");
      console.log("%c  chapterhouseDebug.disable()        ", STYLES.info, "— disable debug logs");
      console.log("%c  chapterhouseDebug.models()         ", STYLES.info, "— list available models");
      console.log("%c  chapterhouseDebug.testChat(prompt) ", STYLES.info, "— fire a raw chat API call");
      console.log("%c  chapterhouseDebug.perf()           ", STYLES.info, "— show performance summary from debug log");
      console.log("%c  chapterhouseDebug.errors()         ", STYLES.info, "— show all error entries from debug log");
      console.groupEnd();
    },

    async status() {
      const res = await fetch("/api/debug");
      const data = await res.json();
      console.log("%c🏠 Chapterhouse Status", STYLES.header, data);
      return data;
    },

    enable() {
      localStorage.setItem("chapterhouse_debug", "true");
      console.log("%c🏠 Chapterhouse debug logging ENABLED (reload to see full startup log)", STYLES.success);
    },

    disable() {
      localStorage.removeItem("chapterhouse_debug");
      console.log("%c🏠 Chapterhouse debug logging DISABLED", STYLES.warn);
    },

    models() {
      console.group("%c🏠 Available Models", STYLES.header);
      models.forEach((m) => console.log(`%c  • ${m.id} (${m.label})`, STYLES.muted));
      console.groupEnd();
    },

    perf() {
      const { getEntries, sessionStats: stats } = require("@/lib/debug-log");
      const entries = getEntries();
      const timed = entries.filter((e: { durationMs?: number }) => e.durationMs !== undefined);
      console.group("%c🏠 Performance Summary", STYLES.header);
      console.log(`%c  API calls: ${stats.apiCalls}`, STYLES.info);
      console.log(`%c  Errors: ${stats.errors}`, stats.errors > 0 ? STYLES.error : STYLES.success);
      console.log(`%c  Timed entries: ${timed.length}`, STYLES.info);
      if (timed.length > 0) {
        const sorted = [...timed].sort((a: { durationMs?: number }, b: { durationMs?: number }) => (b.durationMs ?? 0) - (a.durationMs ?? 0));
        console.log("%c  Top 5 slowest:", STYLES.warn);
        sorted.slice(0, 5).forEach((e: { label: string; durationMs?: number }) => {
          console.log(`%c    ${e.durationMs}ms — ${e.label}`, e.durationMs! < 500 ? STYLES.success : e.durationMs! < 2000 ? STYLES.warn : STYLES.error);
        });
      }
      console.groupEnd();
    },

    errors() {
      const { getEntries } = require("@/lib/debug-log");
      const errorEntries = getEntries().filter((e: { level: string }) => e.level === "error");
      console.group(`%c🏠 Errors (${errorEntries.length})`, STYLES.header);
      if (errorEntries.length === 0) {
        console.log("%c  No errors 🎉", STYLES.success);
      } else {
        errorEntries.forEach((e: { label: string; ts: number; detail?: unknown }) => {
          console.log(`%c  ✗ ${e.label}`, STYLES.error, e.detail ?? "");
          console.log(`%c    at ${new Date(e.ts).toLocaleTimeString()}`, STYLES.muted);
        });
      }
      console.groupEnd();
    },

    async testChat(prompt = "Say 'Chapterhouse debug test OK' and nothing else.") {
      console.group("%c🏠 Chapterhouse Test Chat", STYLES.header);
      console.log(`%c  Prompt: "${prompt}"`, STYLES.info);
      const t0 = Date.now();
      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: [{ role: "user", content: prompt }], model: "gpt-5.4" }),
        });
        console.log(`%c  Status: ${res.status} ${res.statusText}`, res.ok ? STYLES.success : STYLES.error);
        if (res.body) {
          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let text = "";
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            text += decoder.decode(value, { stream: true });
          }
          console.log(`%c  Response: "${text}"`, STYLES.data);
          console.log(`%c  ⏱ Total: ${Date.now() - t0}ms`, STYLES.success);
        }
      } catch (e) {
        console.error(`%c  ✗ Error`, STYLES.error, e);
      }
      console.groupEnd();
    },
  };

  // @ts-expect-error intentional global
  window.chapterhouseDebug = helpers;
}
