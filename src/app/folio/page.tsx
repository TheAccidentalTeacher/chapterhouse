"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ScrollText, RefreshCw, ChevronDown, ChevronRight, Zap, BarChart3 } from "lucide-react";

type FolioEntry = {
  id: string;
  entry_date: string;
  narrative: string | null;
  summary: string | null;
  top_action: string | null;
  track_signals: Record<string, string> | null;
  source_counts: Record<string, number> | null;
  build_duration_ms: number | null;
  tokens_used: number | null;
  created_at: string;
};

type FolioListItem = Omit<FolioEntry, "narrative">;

const TRACK_COLORS: Record<string, string> = {
  ncho: "text-red-400 border-red-800 bg-red-950/40",
  somersschool: "text-amber-400 border-amber-800 bg-amber-950/40",
  biblesaas: "text-sky-400 border-sky-800 bg-sky-950/40",
};

const TRACK_LABELS: Record<string, string> = {
  ncho: "NCHO",
  somersschool: "SomersSchool",
  biblesaas: "BibleSaaS",
};

export default function FolioPage() {
  const [entries, setEntries] = useState<FolioListItem[]>([]);
  const [selected, setSelected] = useState<FolioEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [rebuilding, setRebuilding] = useState(false);
  const [rebuildMsg, setRebuildMsg] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  async function loadEntries() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const { data } = await supabase
      .from("folio_entries")
      .select("id, entry_date, summary, top_action, track_signals, source_counts, build_duration_ms, tokens_used, created_at")
      .order("entry_date", { ascending: false })
      .limit(30);
    setEntries((data as FolioListItem[]) ?? []);
    setLoading(false);
  }

  async function loadEntry(id: string) {
    const res = await fetch(`/api/folio/${id}`);
    if (res.ok) {
      const data = await res.json();
      setSelected(data);
    }
  }

  async function handleSelectEntry(entry: FolioListItem) {
    setSelected(null);
    await loadEntry(entry.id);
  }

  async function handleRebuild() {
    setRebuilding(true);
    setRebuildMsg(null);
    try {
      const res = await fetch("/api/folio/trigger", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok) {
        setRebuildMsg(`Built for ${data.entry_date} — ${data.tokens_used ?? 0} tokens`);
        await loadEntries();
        if (data.id) await loadEntry(data.id);
      } else {
        setRebuildMsg(`Error: ${data.error ?? "Unknown error"}`);
      }
    } catch (err) {
      setRebuildMsg(`Network error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setRebuilding(false);
    }
  }

  useEffect(() => {
    loadEntries();

    // Realtime subscription — update list when Folio cron fires
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const channel = supabase
      .channel("folio-entries-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "folio_entries" },
        async (payload: { eventType: string; new: Record<string, unknown>; old: Record<string, unknown> }) => {
          await loadEntries();
          // If the updated/inserted entry is currently selected, refresh narrative too
          if (payload.eventType !== "DELETE" && selected?.id === (payload.new as FolioListItem).id) {
            await loadEntry((payload.new as FolioListItem).id);
          }
        }
      )
      .subscribe();

    return () => { supabase?.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const latestEntry = entries[0] ?? null;

  return (
    <div className="flex flex-col h-full min-h-0 text-zinc-100">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <ScrollText className="w-5 h-5 text-amber-400" />
          <h1 className="text-lg font-semibold tracking-tight text-amber-300">The Folio</h1>
          <span className="text-xs text-zinc-500 font-normal">Daily synthesized intelligence</span>
        </div>
        <div className="flex items-center gap-3">
          {rebuildMsg && (
            <span className={`text-xs px-2 py-1 rounded ${rebuildMsg.startsWith("Error") ? "bg-red-950 text-red-400" : "bg-emerald-950 text-emerald-400"}`}>
              {rebuildMsg}
            </span>
          )}
          <button
            onClick={handleRebuild}
            disabled={rebuilding}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-amber-900/60 hover:bg-amber-800/70 border border-amber-700/50 rounded-md text-amber-300 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${rebuilding ? "animate-spin" : ""}`} />
            {rebuilding ? "Building..." : "Rebuild Folio"}
          </button>
        </div>
      </div>

      {/* Top Action Banner — from the latest entry */}
      {latestEntry?.top_action && (
        <div className="mx-4 mt-4 px-4 py-3 bg-amber-950/50 border border-amber-700/60 rounded-lg flex items-start gap-3">
          <Zap className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
          <div>
            <span className="text-xs font-semibold text-amber-500 uppercase tracking-wide">Today&apos;s Top Action</span>
            <p className="text-sm text-amber-200 mt-0.5">{latestEntry.top_action}</p>
          </div>
        </div>
      )}

      {/* Track Signals Strip */}
      {latestEntry?.track_signals && Object.keys(latestEntry.track_signals).length > 0 && (
        <div className="mx-4 mt-3 flex gap-2">
          {Object.entries(latestEntry.track_signals).map(([track, signal]) => (
            <div
              key={track}
              className={`flex-1 px-3 py-2 rounded border text-xs ${TRACK_COLORS[track] ?? "text-zinc-400 border-zinc-700 bg-zinc-900"}`}
            >
              <div className="font-semibold mb-0.5">{TRACK_LABELS[track] ?? track}</div>
              <div className="opacity-80 leading-snug">{signal}</div>
            </div>
          ))}
        </div>
      )}

      {/* Main content area */}
      <div className="flex flex-1 min-h-0 mt-4">
        {/* Sidebar — entry list */}
        <div className={`${sidebarOpen ? "w-56" : "w-10"} flex-shrink-0 border-r border-zinc-800 flex flex-col transition-all duration-150`}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-500 hover:text-zinc-300 border-b border-zinc-800"
          >
            {sidebarOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            {sidebarOpen && <span>Past Entries</span>}
          </button>
          {sidebarOpen && (
            <div className="flex-1 overflow-y-auto">
              {loading && (
                <div className="px-3 py-4 text-xs text-zinc-600">Loading...</div>
              )}
              {!loading && entries.length === 0 && (
                <div className="px-3 py-4 text-xs text-zinc-600">
                  No Folio entries yet.<br />Click Rebuild to build the first one.
                </div>
              )}
              {entries.map((entry) => {
                const isActive = selected?.id === entry.id;
                const date = new Date(entry.entry_date + "T00:00:00");
                const label = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
                return (
                  <button
                    key={entry.id}
                    onClick={() => handleSelectEntry(entry)}
                    className={`w-full text-left px-3 py-2.5 border-b border-zinc-800/60 transition-colors ${
                      isActive
                        ? "bg-amber-950/50 text-amber-300"
                        : "hover:bg-zinc-800/50 text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    <div className="text-xs font-semibold">{label}</div>
                    <div className="text-[11px] opacity-60">{dayName}</div>
                    {entry.source_counts && (
                      <div className="flex items-center gap-1 mt-1">
                        <BarChart3 className="w-2.5 h-2.5 opacity-40" />
                        <span className="text-[10px] opacity-40">
                          {Object.values(entry.source_counts).reduce((a, b) => a + b, 0)} items
                        </span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Narrative panel */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {!selected && !loading && entries.length > 0 && (
            <div className="text-sm text-zinc-600 mt-8 text-center">
              Select an entry from the sidebar to read the full narrative.
            </div>
          )}
          {!selected && !loading && entries.length === 0 && (
            <div className="text-sm text-zinc-600 mt-8 text-center">
              The Folio hasn&apos;t been built yet.<br />Click &ldquo;Rebuild Folio&rdquo; above to synthesize your first entry.
            </div>
          )}
          {selected && (
            <div>
              {/* Entry header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-semibold text-amber-300">
                    {new Date(selected.entry_date + "T00:00:00").toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </h2>
                  <div className="flex gap-3 mt-1 text-[11px] text-zinc-600">
                    {selected.tokens_used && <span>{selected.tokens_used.toLocaleString()} tokens</span>}
                    {selected.build_duration_ms && <span>{(selected.build_duration_ms / 1000).toFixed(1)}s build</span>}
                    {selected.source_counts && (
                      <span>
                        {Object.entries(selected.source_counts)
                          .map(([k, v]) => `${v} ${k}`)
                          .join(" · ")}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Top action (selected entry, in case different from latest) */}
              {selected.top_action && selected.id !== latestEntry?.id && (
                <div className="mb-4 px-4 py-3 bg-amber-950/30 border border-amber-800/50 rounded-lg flex items-start gap-3">
                  <Zap className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-amber-300">{selected.top_action}</p>
                </div>
              )}

              {/* Track signals (selected entry) */}
              {selected.track_signals && selected.id !== latestEntry?.id && Object.keys(selected.track_signals).length > 0 && (
                <div className="flex gap-2 mb-4">
                  {Object.entries(selected.track_signals).map(([track, signal]) => (
                    <div
                      key={track}
                      className={`flex-1 px-3 py-2 rounded border text-xs ${TRACK_COLORS[track] ?? "text-zinc-400 border-zinc-700 bg-zinc-900"}`}
                    >
                      <div className="font-semibold mb-0.5">{TRACK_LABELS[track] ?? track}</div>
                      <div className="opacity-80 leading-snug">{signal}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Narrative */}
              {selected.narrative ? (
                <div className="prose prose-invert prose-sm max-w-none
                  prose-headings:text-amber-200 prose-headings:font-semibold
                  prose-h1:text-base prose-h2:text-sm prose-h3:text-sm
                  prose-p:text-zinc-300 prose-p:leading-relaxed
                  prose-li:text-zinc-300
                  prose-strong:text-zinc-100
                  prose-a:text-amber-400 prose-a:no-underline hover:prose-a:underline
                  prose-blockquote:border-amber-700 prose-blockquote:text-zinc-400
                  prose-code:text-amber-300 prose-code:bg-zinc-900 prose-code:px-1 prose-code:rounded
                  prose-hr:border-zinc-800">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {selected.narrative}
                  </ReactMarkdown>
                </div>
              ) : (
                <div className="text-sm text-zinc-600">No narrative available for this entry.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
