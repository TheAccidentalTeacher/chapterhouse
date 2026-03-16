"use client";

/**
 * debug-interceptor.ts
 *
 * Global interceptors that feed EVERYTHING into the debug event bus.
 * Import once in the shell → every fetch, navigation, and button click
 * is automatically logged to the Debug Panel with zero per-component changes.
 *
 * What it intercepts:
 * 1. window.fetch — every API call with request body, response status, timing
 * 2. Next.js route changes — pathname transitions
 * 3. Button / link clicks — element text + data attributes
 * 4. Unhandled errors — window.onerror + unhandledrejection
 * 5. Supabase Realtime — channel subscribe/message events (if available)
 */

import { logEvent } from "./debug-log";

let installed = false;

// ── 1. Global Fetch Interceptor ──────────────────────────────────────────────

function installFetchInterceptor() {
  const originalFetch = window.fetch;

  // Expose the original fetch so loggedFetch can bypass the interceptor
  (window as unknown as Record<string, unknown>).__originalFetch = originalFetch;

  window.fetch = async function interceptedFetch(
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url;

    // Skip Next.js internals, static assets, and hot reload
    if (
      url.startsWith("/_next") ||
      url.startsWith("/__nextjs") ||
      url.includes("webpack") ||
      url.includes(".hot-update") ||
      url.includes("on-demand-entries") ||
      url.endsWith(".svg") ||
      url.endsWith(".png") ||
      url.endsWith(".jpg") ||
      url.endsWith(".css")
    ) {
      return originalFetch.call(window, input, init);
    }

    const method = init?.method?.toUpperCase() ?? "GET";
    const shortUrl = url.startsWith("/") ? url.split("?")[0] : url;
    const tag = `${method} ${shortUrl}`;

    // Parse request body for detail (JSON only, skip FormData/blobs)
    let reqBody: unknown;
    if (init?.body && typeof init.body === "string") {
      try {
        reqBody = JSON.parse(init.body);
      } catch {
        reqBody = `(${init.body.length} chars)`;
      }
    } else if (init?.body instanceof FormData) {
      const fields: string[] = [];
      init.body.forEach((_, key) => fields.push(key));
      reqBody = `FormData[${fields.join(", ")}]`;
    }

    // Log the outgoing request
    logEvent("api", `→ ${tag}`, reqBody !== undefined ? { request: reqBody } : undefined);

    const start = performance.now();

    try {
      const res = await originalFetch.call(window, input, init);
      const elapsed = Math.round(performance.now() - start);

      // Clone to read body without consuming the original
      let resBody: unknown;
      const contentType = res.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        try {
          const clone = res.clone();
          resBody = await clone.json();
        } catch {
          resBody = "(JSON parse failed)";
        }
      } else if (contentType.includes("text/event-stream")) {
        resBody = "(SSE stream)";
      } else if (contentType.includes("text/")) {
        try {
          const clone = res.clone();
          const text = await clone.text();
          resBody = text.length > 500 ? `(${text.length} chars)` : text;
        } catch {
          resBody = "(text read failed)";
        }
      } else {
        resBody = `(${contentType || "unknown content-type"})`;
      }

      logEvent(
        res.ok ? "success" : "error",
        `← ${tag} [${res.status}] ${elapsed}ms`,
        { response: resBody, status: res.status },
        elapsed,
      );

      return res;
    } catch (err) {
      const elapsed = Math.round(performance.now() - start);
      logEvent(
        "error",
        `✗ ${tag} — network error ${elapsed}ms`,
        { error: err instanceof Error ? err.message : String(err) },
        elapsed,
      );
      throw err;
    }
  };
}

// ── 2. Navigation Tracker ────────────────────────────────────────────────────

function installNavigationTracker() {
  let currentPath = window.location.pathname;

  // Observe pathname changes via MutationObserver on <title> or polling
  // Next.js App Router uses soft navigation — no popstate fires.
  // We use a periodic check + popstate as backup.
  const checkNavigation = () => {
    const newPath = window.location.pathname;
    if (newPath !== currentPath) {
      logEvent("nav", `${currentPath} → ${newPath}`);
      currentPath = newPath;
    }
  };

  // Patch history.pushState and replaceState
  const originalPushState = history.pushState;
  const originalReplaceState = history.replaceState;

  history.pushState = function (...args) {
    originalPushState.apply(this, args);
    checkNavigation();
  };

  history.replaceState = function (...args) {
    originalReplaceState.apply(this, args);
    checkNavigation();
  };

  window.addEventListener("popstate", checkNavigation);

  // Fallback: check every 500ms for soft navigations
  setInterval(checkNavigation, 500);
}

// ── 3. Click Tracker ─────────────────────────────────────────────────────────

function installClickTracker() {
  document.addEventListener(
    "click",
    (e) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      // Walk up to find the nearest button, link (a), or [role="button"]
      const clickable = target.closest("button, a, [role='button']");
      if (!clickable) return;

      // Skip nav links (already tracked by navigation tracker)
      const href = clickable.getAttribute("href");
      if (href && href.startsWith("/") && !href.startsWith("/api")) return;

      // Build a useful label
      const text =
        clickable.getAttribute("aria-label") ??
        clickable.textContent?.trim().slice(0, 60) ??
        clickable.tagName;

      const detail: Record<string, string> = {};
      if (href) detail.href = href;

      const dataAction = clickable.getAttribute("data-action");
      if (dataAction) detail.action = dataAction;

      const id = clickable.getAttribute("id");
      if (id) detail.id = id;

      // Identify the component if possible
      const section = clickable.closest("[data-section]");
      if (section) detail.section = section.getAttribute("data-section") ?? "";

      logEvent("click", text, Object.keys(detail).length > 0 ? detail : undefined);
    },
    { capture: true },
  );
}

// ── 4. Error Tracker ─────────────────────────────────────────────────────────

function installErrorTracker() {
  window.addEventListener("error", (e) => {
    logEvent("error", `Uncaught: ${e.message}`, {
      filename: e.filename,
      lineno: e.lineno,
      colno: e.colno,
    });
  });

  window.addEventListener("unhandledrejection", (e) => {
    const reason =
      e.reason instanceof Error ? e.reason.message : String(e.reason);
    logEvent("error", `Unhandled promise rejection: ${reason}`);
  });
}

// ── 5. Performance Observer ──────────────────────────────────────────────────

function installPerformanceObserver() {
  if (typeof PerformanceObserver === "undefined") return;

  try {
    // Track long tasks (>50ms)
    const longTaskObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.duration > 100) {
          logEvent("perf", `Long task: ${Math.round(entry.duration)}ms`, {
            name: entry.name,
            duration: Math.round(entry.duration),
          });
        }
      }
    });
    longTaskObserver.observe({ type: "longtask", buffered: false });
  } catch {
    // longtask not supported in all browsers
  }
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Install all debug interceptors. Safe to call multiple times — only installs once.
 * Call this from the shell component's useEffect.
 */
export function installDebugInterceptors(): void {
  if (installed || typeof window === "undefined") return;
  installed = true;

  installFetchInterceptor();
  installNavigationTracker();
  installClickTracker();
  installErrorTracker();
  installPerformanceObserver();

  logEvent("info", "Debug interceptors installed", {
    interceptors: ["fetch", "navigation", "clicks", "errors", "performance"],
    url: window.location.pathname,
    userAgent: navigator.userAgent.slice(0, 80),
  });
}
