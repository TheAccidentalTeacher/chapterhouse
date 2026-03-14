"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { X, ChevronUp, ChevronDown, Trash2, RefreshCw, Bug, Download, MessageSquare, Search, Activity } from "lucide-react";
import { getEntries, clearLog, subscribe, sessionStats, type LogEntry, type LogLevel } from "@/lib/debug-log";

function exportLog(entries: LogEntry[]) {
  const text = entries.map(e =>
    `[${new Date(e.ts).toISOString()}] [${e.level.toUpperCase()}] ${e.label}${e.durationMs !== undefined ? ` (${e.durationMs}ms)` : ""}${e.detail !== undefined ? "\n" + JSON.stringify(e.detail, null, 2) : ""}`
  ).join("\n\n");
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `chapterhouse-debug-${new Date().toISOString().slice(0,19).replace(/:/g,"-")}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

function sendToChat(entries: LogEntry[]) {
  const recent = entries.slice(-50);
  const formatted = recent.map(e =>
    `[${e.level.toUpperCase()}] ${e.label}${e.durationMs !== undefined ? ` (${e.durationMs}ms)` : ""}${e.detail !== undefined ? " → " + JSON.stringify(e.detail) : ""}`
  ).join("\n");
  const text = `Here is my Chapterhouse debug log (last ${recent.length} events). Can you help me understand what happened or diagnose any issues?\n\n\`\`\`\n${formatted}\n\`\`\``;
  window.dispatchEvent(new CustomEvent("chapterhouse:prefill", { detail: text }));
}

function formatUptime(startMs: number): string {
  const s = Math.floor((Date.now() - startMs) / 1000);
  if (s < 60) return `${s}s`;
  if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function ts(entry: LogEntry) {
  return new Date(entry.ts).toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit", fractionalSecondDigits: 2 });
}

const ALL_LEVELS: LogLevel[] = ["click", "api", "success", "error", "brain", "info", "perf", "nav", "realtime"];

const LEVEL_STYLES: Record<LogLevel, string> = {
  click:    "text-sky-400",
  api:      "text-violet-400",
  success:  "text-emerald-400",
  error:    "text-red-400",
  brain:    "text-amber-400",
  info:     "text-muted",
  perf:     "text-orange-400",
  nav:      "text-cyan-400",
  realtime: "text-teal-400",
};

const LEVEL_BADGE: Record<LogLevel, string> = {
  click:    "bg-sky-500/20 text-sky-300 border-sky-500/30",
  api:      "bg-violet-500/20 text-violet-300 border-violet-500/30",
  success:  "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  error:    "bg-red-500/20 text-red-300 border-red-500/30",
  brain:    "bg-amber-500/20 text-amber-300 border-amber-500/30",
  info:     "bg-muted/20 text-muted border-border/30",
  perf:     "bg-orange-500/20 text-orange-300 border-orange-500/30",
  nav:      "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
  realtime: "bg-teal-500/20 text-teal-300 border-teal-500/30",
};

function JsonTree({ data, depth = 0 }: { data: unknown; depth?: number }) {
  const [open, setOpen] = useState(depth < 2);
  if (data === null || data === undefined) return <span className="text-muted/60">null</span>;
  if (typeof data === "boolean") return <span className="text-sky-400">{String(data)}</span>;
  if (typeof data === "number") return <span className="text-amber-400">{data}</span>;
  if (typeof data === "string") {
    const short = data.length > 200 ? data.slice(0, 200) + "…" : data;
    return <span className="text-emerald-300 whitespace-pre-wrap break-all">&quot;{short}&quot;</span>;
  }
  if (Array.isArray(data)) {
    if (data.length === 0) return <span className="text-muted/60">[]</span>;
    return (
      <span>
        <button onClick={() => setOpen(!open)} className="text-muted/60 hover:text-foreground">
          [{open ? "▾" : "▸"} {data.length}]
        </button>
        {open && (
          <div className="ml-4 border-l border-border/30 pl-2 space-y-0.5">
            {data.map((item, i) => (
              <div key={i} className="flex gap-1">
                <span className="text-muted/40 shrink-0">{i}:</span>
                <JsonTree data={item} depth={depth + 1} />
              </div>
            ))}
          </div>
        )}
      </span>
    );
  }
  if (typeof data === "object") {
    const keys = Object.keys(data as object);
    if (keys.length === 0) return <span className="text-muted/60">{"{}"}</span>;
    return (
      <span>
        <button onClick={() => setOpen(!open)} className="text-muted/60 hover:text-foreground">
          {"{"}{ open ? "▾" : "▸"} {keys.length} keys{"}"}
        </button>
        {open && (
          <div className="ml-4 border-l border-border/30 pl-2 space-y-0.5">
            {keys.map((k) => (
              <div key={k} className="flex gap-1 flex-wrap">
                <span className="text-violet-300 shrink-0">{k}:</span>
                <JsonTree data={(data as Record<string, unknown>)[k]} depth={depth + 1} />
              </div>
            ))}
          </div>
        )}
      </span>
    );
  }
  return <span>{String(data)}</span>;
}

// ── Performance Tab ────────────────────────────────────────────────────────────

function PerfTab({ entries }: { entries: LogEntry[] }) {
  const perfEntries = entries.filter(e => e.durationMs !== undefined).sort((a, b) => (b.durationMs ?? 0) - (a.durationMs ?? 0));
  const apiEntries = perfEntries.filter(e => e.level === "api" || e.level === "success" || e.level === "error");
  const avgMs = apiEntries.length > 0 ? Math.round(apiEntries.reduce((s, e) => s + (e.durationMs ?? 0), 0) / apiEntries.length) : 0;
  const slowest = apiEntries[0];

  return (
    <div className="space-y-3">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-lg border border-border/30 bg-muted-surface/40 p-2 text-center">
          <div className="text-lg font-bold text-violet-400">{sessionStats.apiCalls}</div>
          <div className="text-[10px] text-muted">API Calls</div>
        </div>
        <div className="rounded-lg border border-border/30 bg-muted-surface/40 p-2 text-center">
          <div className="text-lg font-bold text-orange-400">{avgMs}ms</div>
          <div className="text-[10px] text-muted">Avg Response</div>
        </div>
        <div className="rounded-lg border border-border/30 bg-muted-surface/40 p-2 text-center">
          <div className="text-lg font-bold text-red-400">{sessionStats.errors}</div>
          <div className="text-[10px] text-muted">Errors</div>
        </div>
      </div>

      {/* Slowest Call */}
      {slowest && (
        <div className="rounded-lg border border-orange-500/30 bg-orange-500/5 p-2">
          <div className="text-[10px] text-orange-400 font-semibold mb-0.5">Slowest Call</div>
          <div className="text-xs text-foreground truncate">{slowest.label}</div>
          <div className="text-[10px] text-muted">{slowest.durationMs}ms</div>
        </div>
      )}

      {/* Timing Waterfall */}
      <div className="space-y-1">
        <div className="text-[10px] text-muted font-semibold uppercase tracking-wider">Timing Waterfall</div>
        {perfEntries.length === 0 && (
          <p className="text-xs text-muted/60 py-2 text-center">No timed entries yet.</p>
        )}
        {perfEntries.slice(0, 30).map((entry) => {
          const maxMs = perfEntries[0]?.durationMs ?? 1;
          const pct = Math.min(100, ((entry.durationMs ?? 0) / maxMs) * 100);
          const barColor = (entry.durationMs ?? 0) < 500 ? "bg-emerald-500/50" : (entry.durationMs ?? 0) < 2000 ? "bg-amber-500/50" : "bg-red-500/50";
          return (
            <div key={entry.id} className="flex items-center gap-2 text-[11px]">
              <span className="w-12 shrink-0 text-right text-muted font-mono">{entry.durationMs}ms</span>
              <div className="flex-1 h-3 rounded-full bg-muted-surface/40 overflow-hidden">
                <div className={`h-full rounded-full ${barColor} transition-all`} style={{ width: `${pct}%` }} />
              </div>
              <span className="flex-1 truncate text-muted">{entry.label.replace(/^[←→✗⏱]\s*/, "")}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Brain Context Tab ──────────────────────────────────────────────────────────

function BrainTab() {
  const [context, setContext] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/debug/context");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setContext(await res.json());
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted">What the AI brain currently knows — injected into every chat.</p>
        <button onClick={load} disabled={loading} className="flex items-center gap-1 rounded-lg border border-border/50 px-2 py-1 text-xs text-muted hover:text-foreground transition disabled:opacity-40">
          <RefreshCw className={`h-3 w-3 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {context && (
        <div className="text-xs font-mono">
          <JsonTree data={context} depth={0} />
        </div>
      )}
    </div>
  );
}

// ── Main Panel ─────────────────────────────────────────────────────────────────

type Tab = "log" | "perf" | "brain";

export function DebugPanel() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [tab, setTab] = useState<Tab>("log");
  const [entries, setEntries] = useState<LogEntry[]>(() => getEntries());
  const [filter, setFilter] = useState<LogLevel | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(() => setEntries(getEntries()), []);

  useEffect(() => subscribe(refresh), [refresh]);

  const errorCount = entries.filter(e => e.level === "error").length;

  const filtered = entries
    .filter(e => filter === "all" || e.level === filter)
    .filter(e => !searchQuery || e.label.toLowerCase().includes(searchQuery.toLowerCase()));

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        title="Open debug panel"
        className="fixed bottom-24 right-4 z-50 flex items-center gap-1.5 rounded-full border border-accent/50 bg-accent/20 px-3 py-2 text-xs font-semibold text-accent shadow-xl backdrop-blur hover:bg-accent/30 transition"
      >
        <Bug className="h-3.5 w-3.5" />
        Debug
        <span className="text-[10px] text-muted font-mono">{formatUptime(sessionStats.startedAt)}</span>
        {sessionStats.apiCalls > 0 && (
          <span className="rounded-full bg-violet-500/20 border border-violet-500/30 px-1.5 py-0.5 text-[10px] text-violet-300 font-bold leading-none">
            {sessionStats.apiCalls}
          </span>
        )}
        {errorCount > 0 && (
          <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] text-white font-bold leading-none">
            {errorCount}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-24 right-4 z-50 flex flex-col rounded-2xl border border-border/60 bg-background/95 shadow-2xl backdrop-blur"
      style={{ width: "520px", maxHeight: minimized ? "auto" : "75vh" }}>

      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-border/40 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Bug className="h-3.5 w-3.5 text-accent" />
          <span className="text-xs font-semibold">Chapterhouse Debug</span>
          <span className="text-[10px] text-muted font-mono">{formatUptime(sessionStats.startedAt)}</span>
          {errorCount > 0 && (
            <span className="rounded-full bg-red-500/20 border border-red-500/30 px-1.5 py-0.5 text-[10px] text-red-400 font-bold leading-none">
              {errorCount} errors
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setMinimized(!minimized)} className="rounded p-1 text-muted hover:text-foreground">
            {minimized ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
          <button onClick={() => setOpen(false)} className="rounded p-1 text-muted hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {!minimized && (
        <>
          {/* Tabs */}
          <div className="flex gap-1 border-b border-border/40 px-3 pt-2">
            {([
              { key: "log" as Tab, label: `Event Log (${entries.length})` },
              { key: "perf" as Tab, label: "Performance" },
              { key: "brain" as Tab, label: "Brain Context" },
            ]).map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-t transition ${tab === t.key ? "bg-muted-surface text-foreground" : "text-muted hover:text-foreground"}`}
              >
                {t.key === "perf" && <Activity className="h-3 w-3" />}
                {t.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-3 py-3 min-h-0" ref={logRef}>
            {tab === "log" && (
              <div className="space-y-2">
                {/* Search + Controls */}
                <div className="space-y-1.5">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted/50" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search events..."
                      className="w-full rounded-lg border border-border/40 bg-muted-surface/30 pl-7 pr-3 py-1.5 text-[11px] text-foreground placeholder:text-muted/40 focus:outline-none focus:border-accent/50"
                    />
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap pb-1">
                    {(["all", ...ALL_LEVELS] as const).map((f) => (
                      <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`rounded-full border px-2 py-0.5 text-[11px] transition ${filter === f ? "border-accent/60 bg-accent/15 text-accent" : "border-border/40 text-muted hover:text-foreground"}`}
                      >
                        {f}
                      </button>
                    ))}
                    <div className="ml-auto flex items-center gap-1">
                      <button
                        onClick={() => exportLog(entries)}
                        title="Download log as text file"
                        className="flex items-center gap-1 rounded-full border border-border/40 px-2 py-0.5 text-[11px] text-muted hover:text-foreground transition"
                      >
                        <Download className="h-2.5 w-2.5" /> Export
                      </button>
                      <button
                        onClick={() => { sendToChat(entries); setOpen(false); }}
                        title="Send log to chat for AI analysis"
                        className="flex items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-2 py-0.5 text-[11px] text-accent hover:bg-accent/20 transition"
                      >
                        <MessageSquare className="h-2.5 w-2.5" /> Ask AI
                      </button>
                      <button
                        onClick={() => { clearLog(); setExpandedId(null); setSearchQuery(""); }}
                        className="flex items-center gap-1 rounded-full border border-border/40 px-2 py-0.5 text-[11px] text-muted hover:text-red-400 transition"
                      >
                        <Trash2 className="h-2.5 w-2.5" /> Clear
                      </button>
                    </div>
                  </div>
                </div>

                {filtered.length === 0 && (
                  <p className="text-xs text-muted/60 py-4 text-center">
                    {searchQuery ? "No matching events." : "No events yet. Click something."}
                  </p>
                )}

                {filtered.map((entry) => (
                  <div key={entry.id} className="rounded-xl border border-border/30 bg-muted-surface/40 overflow-hidden">
                    <button
                      className="w-full flex items-start gap-2 px-3 py-2 text-left hover:bg-muted-surface/80 transition"
                      onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                    >
                      <span className={`shrink-0 rounded border px-1.5 py-0.5 text-[10px] font-bold uppercase leading-none mt-0.5 ${LEVEL_BADGE[entry.level]}`}>
                        {entry.level}
                      </span>
                      <span className={`flex-1 text-xs leading-snug ${LEVEL_STYLES[entry.level]}`}>
                        {entry.label}
                      </span>
                      {entry.durationMs !== undefined && (
                        <span className={`shrink-0 text-[10px] font-mono mt-0.5 ${entry.durationMs < 500 ? "text-emerald-400" : entry.durationMs < 2000 ? "text-amber-400" : "text-red-400"}`}>
                          {entry.durationMs}ms
                        </span>
                      )}
                      <span className="shrink-0 text-[10px] text-muted/50 font-mono mt-0.5">{ts(entry)}</span>
                    </button>
                    {expandedId === entry.id && entry.detail !== undefined && (
                      <div className="border-t border-border/30 px-3 py-2 text-xs font-mono bg-background/40 max-h-64 overflow-y-auto">
                        <JsonTree data={entry.detail} depth={0} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {tab === "perf" && <PerfTab entries={entries} />}

            {tab === "brain" && <BrainTab />}
          </div>
        </>
      )}
    </div>
  );
}
