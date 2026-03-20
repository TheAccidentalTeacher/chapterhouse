"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Globe,
  Plus,
  Newspaper,
  Loader2,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Trash2,
  RefreshCw,
  X,
} from "lucide-react";
import { PageFrame } from "@/components/page-frame";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase";

// ── Types ──────────────────────────────────────────────────────────────────────

interface IntelItem {
  headline: string;
  detail: string;
  source_url: string;
  source_title?: string;
  impact_score: string;
  affected_repos: string[];
  repo_reasoning: Record<string, string>;
  verified: boolean;
}

interface IntelSection {
  category_name: string;
  emoji: string;
  items: IntelItem[];
}

interface ProposedSeed {
  text: string;
  category: string;
  rationale: string;
  source_headline: string;
  dismissed?: boolean;
  added?: boolean;
}

interface VerificationWarning {
  claim: string;
  source_url: string;
  warning: string;
}

interface IntelOutput {
  session_date: string;
  summary: string;
  sections: IntelSection[];
  proposed_seeds: ProposedSeed[];
  verification_warnings: VerificationWarning[];
}

interface IntelSession {
  id: string;
  created_at: string;
  updated_at: string;
  urls: string[];
  status: "pending" | "fetching" | "processing" | "complete" | "failed";
  error?: string;
  seeds_extracted: number;
  source_type: "manual" | "cron" | "publishers_weekly";
  session_label: string;
  processed_output?: IntelOutput;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const IMPACT_COLORS: Record<string, string> = {
  "A+": "bg-red-600 text-white",
  "A":  "bg-red-500 text-white",
  "A-": "bg-orange-500 text-white",
  "B+": "bg-amber-500 text-white",
  "B":  "bg-yellow-500 text-zinc-900",
  "B-": "bg-yellow-400 text-zinc-900",
  "C":  "bg-zinc-400 text-white",
};

const CATEGORY_COLORS: Record<string, string> = {
  "🔴 Direct Impact":     "border-red-500/40 bg-red-500/5",
  "🟡 Ecosystem Signal":  "border-yellow-500/40 bg-yellow-500/5",
  "🟠 Community Signal":  "border-orange-500/40 bg-orange-500/5",
  "🔵 Background":        "border-blue-500/40 bg-blue-500/5",
};

const REPO_BADGE: Record<string, string> = {
  "NCHO":         "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  "SomersSchool": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  "BibleSaaS":    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300",
  "Chapterhouse": "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
};

const SOURCE_BADGE: Record<string, string> = {
  manual:            "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
  cron:              "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  publishers_weekly: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function totalItems(output: IntelOutput): number {
  return output.sections.reduce((sum, s) => sum + s.items.length, 0);
}

// ── Session list item ──────────────────────────────────────────────────────────

function SessionCard({
  session,
  selected,
  onClick,
  onDelete,
}: {
  session: IntelSession;
  selected: boolean;
  onClick: () => void;
  onDelete: (id: string) => void;
}) {
  const isProcessing = ["pending", "fetching", "processing"].includes(session.status);
  const output = session.processed_output;

  return (
    <div
      onClick={onClick}
      className={`group relative p-3 rounded-lg border cursor-pointer transition-all ${
        selected
          ? "border-blue-500 bg-blue-500/10"
          : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"
      }`}
    >
      <div className="flex items-start gap-2">
        <div className="mt-0.5 text-lg leading-none">{session.source_type === "publishers_weekly" ? "📰" : session.source_type === "cron" ? "⏰" : "🔍"}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-zinc-100 truncate">{session.session_label}</p>
          <p className="text-xs text-zinc-500 mt-0.5">{formatDate(session.created_at)}</p>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {isProcessing ? (
              <span className="flex items-center gap-1 text-xs text-amber-400">
                <Loader2 className="w-3 h-3 animate-spin" />
                {session.status === "fetching" ? "Fetching…" : session.status === "processing" ? "Analyzing…" : "Pending…"}
              </span>
            ) : session.status === "failed" ? (
              <span className="text-xs text-red-400">Failed</span>
            ) : output ? (
              <>
                <span className="text-xs text-zinc-400">{totalItems(output)} items</span>
                {session.seeds_extracted > 0 && (
                  <span className="text-xs text-emerald-400">+{session.seeds_extracted} seeds</span>
                )}
              </>
            ) : null}
            <span className={`text-xs px-1.5 py-0.5 rounded ${SOURCE_BADGE[session.source_type]}`}>
              {session.source_type === "publishers_weekly" ? "PW" : session.source_type === "cron" ? "auto" : "manual"}
            </span>
          </div>
        </div>
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(session.id); }}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded text-zinc-500 hover:text-red-400"
        title="Delete session"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
}

// ── Intel item card ────────────────────────────────────────────────────────────

function IntelItemCard({ item }: { item: IntelItem }) {
  const [expanded, setExpanded] = useState(false);
  const impactColor = IMPACT_COLORS[item.impact_score] ?? "bg-zinc-400 text-white";
  const hasReasoning = Object.keys(item.repo_reasoning ?? {}).length > 0;

  return (
    <div className={`p-3 rounded-lg border ${item.verified ? "border-zinc-700" : "border-amber-500/30"} bg-zinc-900/50`}>
      <div className="flex items-start gap-2">
        {!item.verified && (
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" aria-label="Unverified claim" />
        )}
        {item.verified && (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${impactColor}`}>{item.impact_score}</span>
            {item.affected_repos?.map((repo) => (
              <span key={repo} className={`text-[10px] px-1.5 py-0.5 rounded ${REPO_BADGE[repo] ?? "bg-zinc-700 text-zinc-300"}`}>{repo}</span>
            ))}
          </div>
          <p className="text-sm font-medium text-zinc-100 mt-1">{item.headline}</p>
          <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{item.detail}</p>

          <div className="flex items-center gap-3 mt-2">
            {item.source_url && (
              <a
                href={item.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                <ExternalLink className="w-3 h-3" />
                {item.source_title ?? new URL(item.source_url).hostname}
              </a>
            )}
            {hasReasoning && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-[10px] text-zinc-500 hover:text-zinc-300 flex items-center gap-1"
              >
                {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                Reasoning
              </button>
            )}
          </div>

          {expanded && hasReasoning && (
            <div className="mt-2 space-y-1 border-t border-zinc-700 pt-2">
              {Object.entries(item.repo_reasoning).map(([repo, reason]) => (
                <p key={repo} className="text-[10px] text-zinc-400">
                  <span className="text-zinc-300 font-medium">{repo}:</span> {reason}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Report viewer ──────────────────────────────────────────────────────────────

function IntelReportViewer({
  session,
  onSeedAction,
}: {
  session: IntelSession;
  onSeedAction: (sessionId: string, seedIndex: number, action: "add" | "dismiss") => void;
}) {
  const output = session.processed_output;
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});

  if (!output) {
    if (session.status === "failed") {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <AlertTriangle className="w-8 h-8 text-red-400 mb-3" />
          <p className="text-sm font-medium text-zinc-200">Processing Failed</p>
          <p className="text-xs text-zinc-400 mt-1 max-w-xs">{session.error ?? "Unknown error."}</p>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="w-6 h-6 text-blue-400 animate-spin mb-3" />
        <p className="text-sm text-zinc-400">
          {session.status === "fetching" ? "Fetching URLs…" : session.status === "processing" ? "Analyzing content…" : "Waiting…"}
        </p>
      </div>
    );
  }

  const toggleSection = (name: string) => {
    setExpandedSections((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const unverifiedCount = output.sections.flatMap((s) => s.items).filter((i) => !i.verified).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Globe className="w-4 h-4 text-blue-400" />
          <h2 className="text-base font-semibold text-zinc-100">{session.session_label}</h2>
          <span className="text-xs text-zinc-500">{formatDate(session.created_at)}</span>
        </div>
        <p className="text-sm text-zinc-300 leading-relaxed bg-zinc-800/50 rounded-lg p-3 border border-zinc-700">
          {output.summary}
        </p>
        <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
          <span>{totalItems(output)} items</span>
          {unverifiedCount > 0 && (
            <span className="text-amber-400 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> {unverifiedCount} unverified
            </span>
          )}
          {session.seeds_extracted > 0 && (
            <span className="text-emerald-400">+{session.seeds_extracted} seeds added to Dreamer</span>
          )}
        </div>
      </div>

      {/* Sections */}
      {output.sections.map((section) => {
        const isOpen = expandedSections[section.category_name] !== false; // default open
        const colorClass = CATEGORY_COLORS[section.category_name] ?? "border-zinc-700 bg-zinc-800/30";
        return (
          <div key={section.category_name} className={`rounded-lg border ${colorClass}`}>
            <button
              onClick={() => toggleSection(section.category_name)}
              className="w-full flex items-center justify-between px-4 py-3"
            >
              <div className="flex items-center gap-2">
                <span className="text-base">{section.emoji}</span>
                <span className="text-sm font-semibold text-zinc-100">{section.category_name.replace(/^[^ ]+ /, "")}</span>
                <span className="text-xs text-zinc-400">({section.items.length})</span>
              </div>
              {isOpen ? <ChevronDown className="w-4 h-4 text-zinc-500" /> : <ChevronRight className="w-4 h-4 text-zinc-500" />}
            </button>
            {isOpen && (
              <div className="px-4 pb-4 space-y-2">
                {section.items.map((item, i) => (
                  <IntelItemCard key={i} item={item} />
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Proposed seeds */}
      {output.proposed_seeds?.length > 0 && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5">
          <div className="px-4 py-3 border-b border-emerald-500/20">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-sm font-semibold text-zinc-100">Proposed Seeds</span>
              <span className="text-xs text-zinc-400">({output.proposed_seeds.length})</span>
            </div>
          </div>
          <div className="px-4 py-3 space-y-3">
            {output.proposed_seeds.map((seed, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg border transition-opacity ${
                  seed.dismissed ? "opacity-40 border-zinc-700" : "border-zinc-700 bg-zinc-900/50"
                }`}
              >
                <p className="text-sm text-zinc-100">{seed.text}</p>
                <p className="text-xs text-zinc-500 mt-1">
                  <span className="text-zinc-400">Rationale:</span> {seed.rationale}
                </p>
                <p className="text-xs text-zinc-500">
                  <span className="text-zinc-400">From:</span> {seed.source_headline}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-700 text-zinc-300">{seed.category}</span>
                  {!seed.added && !seed.dismissed && (
                    <>
                      <button
                        onClick={() => onSeedAction(session.id, i, "add")}
                        className="text-xs text-emerald-400 hover:text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/30 hover:bg-emerald-500/10 transition-colors"
                      >
                        + Add to Dreamer
                      </button>
                      <button
                        onClick={() => onSeedAction(session.id, i, "dismiss")}
                        className="text-xs text-zinc-500 hover:text-zinc-300"
                      >
                        Dismiss
                      </button>
                    </>
                  )}
                  {seed.added && <span className="text-xs text-emerald-400">✓ In Dreamer</span>}
                  {seed.dismissed && <span className="text-xs text-zinc-500">Dismissed</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Verification warnings */}
      {output.verification_warnings?.length > 0 && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-semibold text-amber-300">Verification Warnings</span>
          </div>
          <div className="space-y-2">
            {output.verification_warnings.map((w, i) => (
              <div key={i} className="text-xs text-zinc-400">
                <span className="text-zinc-300 font-medium">{w.claim}</span>
                {w.source_url && <span className="text-zinc-500"> ({w.source_url})</span>}
                <p className="text-amber-400 mt-0.5">{w.warning}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── New Session Modal ──────────────────────────────────────────────────────────

function NewSessionModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (session: IntelSession) => void;
}) {
  const [urlsText, setUrlsText] = useState("");
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    const urls = urlsText
      .split("\n")
      .map((u) => u.trim())
      .filter((u) => u.startsWith("http"));
    if (urls.length === 0) { setError("Paste at least one https:// URL"); return; }
    if (urls.length > 20) { setError("Maximum 20 URLs"); return; }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/intel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls, session_label: label.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed"); return; }
      onCreated(data.session);
      onClose();
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg bg-zinc-900 rounded-xl border border-zinc-700 shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-700">
          <h3 className="text-sm font-semibold text-zinc-100">New Intel Session</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs text-zinc-400 block mb-1.5">Session label (optional)</label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g., PW 0319 — March 19"
              className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400 block mb-1.5">URLs to analyze — one per line (1–20)</label>
            <textarea
              value={urlsText}
              onChange={(e) => setUrlsText(e.target.value)}
              rows={6}
              placeholder={"https://www.publishersweekly.com/...\nhttps://techcrunch.com/..."}
              className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-blue-500 font-mono resize-none"
            />
            <p className="text-xs text-zinc-500 mt-1">
              {urlsText.split("\n").filter((l) => l.trim().startsWith("http")).length} URL(s) detected
            </p>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-zinc-700">
          <button onClick={onClose} className="text-sm text-zinc-400 hover:text-zinc-200 px-4 py-2">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
            {loading ? "Processing…" : "Analyze"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── PW Report Modal ────────────────────────────────────────────────────────────

function PWReportModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (session: IntelSession) => void;
}) {
  const [content, setContent] = useState("");
  const [label, setLabel] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (content.length < 100) { setError("Paste the full PW report text"); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/intel/publishers-weekly", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, session_label: label.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed"); return; }
      onCreated(data.session);
      onClose();
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-lg bg-zinc-900 rounded-xl border border-zinc-700 shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-700">
          <h3 className="text-sm font-semibold text-zinc-100">📰 Publishers Weekly Report</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs text-zinc-400 block mb-1.5">Label (optional)</label>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g., PW 0316 — March 16 2026"
              className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-500"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-400 block mb-1.5">Paste PW report text</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={8}
              placeholder="Paste the full Publishers Weekly report here…"
              className="w-full bg-zinc-800 border border-zinc-600 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-500 resize-none"
            />
            <p className="text-xs text-zinc-500 mt-1">{content.length.toLocaleString()} chars</p>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-zinc-700">
          <button onClick={onClose} className="text-sm text-zinc-400 hover:text-zinc-200 px-4 py-2">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg font-medium transition-colors"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Newspaper className="w-4 h-4" />}
            {loading ? "Analyzing…" : "Run Intel"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function IntelPage() {
  const [sessions, setSessions] = useState<IntelSession[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewModal, setShowNewModal] = useState(false);
  const [showPWModal, setShowPWModal] = useState(false);

  const supabase = getSupabaseBrowserClient();

  const loadSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/intel");
      const data = await res.json();
      if (data.sessions) {
        setSessions(data.sessions);
        if (!selectedId && data.sessions.length > 0) {
          setSelectedId(data.sessions[0].id);
        }
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [selectedId]);

  useEffect(() => {
    loadSessions();
  }, []);

  // Supabase Realtime — watch intel_sessions for live status updates
  useEffect(() => {
    if (!supabase) return;
    const channel = supabase
      .channel("intel-sessions-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "intel_sessions" },
        (payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          setSessions((prev) => {
            if (payload.eventType === "INSERT") {
              return [payload.new as unknown as IntelSession, ...prev];
            }
            if (payload.eventType === "UPDATE") {
              const updated = payload.new as unknown as IntelSession;
              return prev.map((s) => (s.id === updated.id ? updated : s));
            }
            if (payload.eventType === "DELETE") {
              const deleted = payload.old as { id?: string };
              return prev.filter((s) => s.id !== deleted.id);
            }
            return prev;
          });
        }
      )
      .subscribe();

    return () => { supabase?.removeChannel(channel); };
  }, [supabase]);

  const selectedSession = sessions.find((s) => s.id === selectedId) ?? null;

  const handleSessionCreated = (session: IntelSession) => {
    setSessions((prev) => [session, ...prev]);
    setSelectedId(session.id);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this Intel session?")) return;
    await fetch(`/api/intel/${id}`, { method: "DELETE" });
    setSessions((prev) => prev.filter((s) => s.id !== id));
    if (selectedId === id) setSelectedId(sessions[1]?.id ?? null);
  };

  const handleSeedAction = async (sessionId: string, seedIndex: number, action: "add" | "dismiss") => {
    const session = sessions.find((s) => s.id === sessionId);
    if (!session?.processed_output) return;

    const updatedSeeds = session.processed_output.proposed_seeds.map((seed, i) => {
      if (i !== seedIndex) return seed;
      return action === "add"
        ? { ...seed, added: true }
        : { ...seed, dismissed: true };
    });

    // If adding, create a dream entry
    if (action === "add") {
      const seed = session.processed_output.proposed_seeds[seedIndex];
      await fetch("/api/dreams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: seed.text,
          notes: `Rationale: ${seed.rationale}\nSource: ${seed.source_headline}`,
          category: seed.category ?? "general",
          source_type: "intel",
          source_label: `Intel — ${session.session_label}`,
        }),
      });
    }

    const updatedOutput = { ...session.processed_output, proposed_seeds: updatedSeeds };
    await fetch(`/api/intel/${sessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ processed_output: updatedOutput }),
    });

    setSessions((prev) =>
      prev.map((s) => (s.id === sessionId ? { ...s, processed_output: updatedOutput } : s))
    );
  };

  return (
    <PageFrame
      title="Intel"
      description="Structured intelligence analysis from curated sources."
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={loadSessions}
            className="p-1.5 text-zinc-500 hover:text-zinc-300 rounded"
            aria-label="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowPWModal(true)}
            className="flex items-center gap-1.5 text-sm text-zinc-300 hover:text-zinc-100 bg-zinc-800 hover:bg-zinc-700 border border-zinc-600 rounded-lg px-3 py-1.5 transition-colors"
          >
            <Newspaper className="w-3.5 h-3.5" />
            PW Report
          </button>
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-1.5 text-sm text-white bg-blue-600 hover:bg-blue-500 rounded-lg px-3 py-1.5 font-medium transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            New Session
          </button>
        </div>
      }
    >
      {/* Session count + processing indicator */}
      <div className="flex items-center gap-2 text-xs text-zinc-500 mb-4">
        <span>{sessions.length} session{sessions.length !== 1 ? "s" : ""}</span>
        {sessions.some((s) => ["pending", "fetching", "processing"].includes(s.status)) && (
          <span className="flex items-center gap-1 text-amber-400">
            <Loader2 className="w-3 h-3 animate-spin" /> Processing…
          </span>
        )}
      </div>

      {/* Split layout */}
      <div className="flex gap-4 h-[calc(100vh-220px)]">
        {/* Session list */}
        <div className="w-64 shrink-0 flex flex-col gap-2 overflow-y-auto pr-1">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="text-center py-12">
              <Globe className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
              <p className="text-sm text-zinc-400">No Intel sessions yet.</p>
              <p className="text-xs text-zinc-500 mt-1">Click "New Session" to analyze URLs.</p>
            </div>
          ) : (
            sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                selected={session.id === selectedId}
                onClick={() => setSelectedId(session.id)}
                onDelete={handleDelete}
              />
            ))
          )}
        </div>

        {/* Report viewer */}
        <div className="flex-1 overflow-y-auto pr-1">
          {!selectedSession ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <Globe className="w-10 h-10 text-zinc-600 mb-3" />
              <p className="text-sm text-zinc-400">Select a session to view the Intel report.</p>
              <p className="text-xs text-zinc-500 mt-1">Or click "New Session" to analyze URLs.</p>
            </div>
          ) : (
            <IntelReportViewer session={selectedSession} onSeedAction={handleSeedAction} />
          )}
        </div>
      </div>

      {/* Modals */}
      {showNewModal && (
        <NewSessionModal onClose={() => setShowNewModal(false)} onCreated={handleSessionCreated} />
      )}
      {showPWModal && (
        <PWReportModal onClose={() => setShowPWModal(false)} onCreated={handleSessionCreated} />
      )}
    </PageFrame>
  );
}
