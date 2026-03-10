"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown, ChevronUp, Loader2, Plus, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";

type GenerateMeta = {
  rssFeeds: number;
  rssFailed: number;
  githubRepos: number;
  totalScanned: number;
};

export function NewBriefPanel() {
  const router = useRouter();

  // Generate state
  const [context, setContext] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [lastMeta, setLastMeta] = useState<GenerateMeta | null>(null);

  // Manual write toggle
  const [manualOpen, setManualOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [briefDate, setBriefDate] = useState(new Date().toISOString().split("T")[0]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleGenerate() {
    setGenerating(true);
    setGenerateError(null);
    setLastMeta(null);
    try {
      const res = await fetch("/api/briefs/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ context }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || res.statusText);
      }
      const data = await res.json();
      if (data.meta) setLastMeta(data.meta as GenerateMeta);
      setContext("");
      router.refresh();
    } catch (e) {
      setGenerateError(e instanceof Error ? e.message : String(e));
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch("/api/briefs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, summary, brief_date: briefDate }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || res.statusText);
      }
      setManualOpen(false);
      setTitle("");
      setSummary("");
      router.refresh();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mb-6 space-y-3">
      {/* ── Always-visible generate row ── */}
      <div className="glass-panel rounded-3xl p-5">
        <div className="flex flex-wrap items-start gap-4">
          <div className="flex-1 min-w-0">
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted">
              Generate with AI
            </label>
            <textarea
              value={context}
              onChange={(e) => setContext(e.target.value)}
              placeholder="Optional focus area — e.g. 'Shopify launch blockers and BibleSaaS Phase 27 status' — or leave blank for a full scan."
              rows={2}
              className="w-full resize-none rounded-2xl border border-border/70 bg-muted-surface px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-accent/40 focus:outline-none"
            />
          </div>
          <div className="flex flex-col items-end gap-2 pt-5 shrink-0">
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-2.5 text-sm font-medium text-accent-foreground shadow shadow-accent/25 transition hover:opacity-90 disabled:opacity-50"
            >
              {generating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {generating ? "Scanning & generating…" : "Generate Brief"}
            </button>
            <button
              onClick={() => setManualOpen((o) => !o)}
              className="inline-flex items-center gap-1.5 text-xs text-muted transition hover:text-foreground"
            >
              <Plus className="h-3 w-3" />
              Write manually
              {manualOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          </div>
        </div>

        {/* ── Error state ── */}
        {generateError && (
          <div className="mt-3 flex items-start gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-xs text-red-400">
            <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span className="font-mono">{generateError}</span>
          </div>
        )}

        {/* ── Debug strip — shows after successful generation ── */}
        {lastMeta && !generateError && (
          <div className="mt-3 flex flex-wrap items-center gap-3 rounded-2xl border border-border/70 bg-muted-surface px-4 py-2.5 text-xs text-muted">
            <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-400" />
            <span className="font-semibold text-foreground">Ingestion complete</span>
            <span className="rounded-full border border-border/50 px-2.5 py-1">
              RSS: {lastMeta.rssFeeds} feeds OK
              {lastMeta.rssFailed > 0 && (
                <span className="ml-1 text-yellow-400">{lastMeta.rssFailed} failed</span>
              )}
            </span>
            <span className="rounded-full border border-border/50 px-2.5 py-1">
              GitHub: {lastMeta.githubRepos} repos checked
            </span>
            <span className="rounded-full border border-border/50 px-2.5 py-1 font-semibold text-foreground">
              {lastMeta.totalScanned} items scanned → Claude
            </span>
          </div>
        )}
      </div>

      {/* ── Manual write (collapsible) ── */}
      {manualOpen && (
        <div className="rounded-3xl border border-border bg-card/60 p-5 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted">Write manually</p>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief title…"
              className="rounded-2xl border border-border/70 bg-muted-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-accent/40 focus:outline-none"
            />
            <input
              type="date"
              value={briefDate}
              onChange={(e) => setBriefDate(e.target.value)}
              className="rounded-2xl border border-border/70 bg-muted-surface px-4 py-2.5 text-sm text-foreground focus:border-accent/40 focus:outline-none"
            />
          </div>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Summary — what do Scott and Anna need to know and do today?"
            rows={4}
            className="w-full resize-none rounded-2xl border border-border/70 bg-muted-surface px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-accent/40 focus:outline-none"
          />
          {saveError && <p className="text-xs text-red-400">{saveError}</p>}
          <button
            onClick={handleSave}
            disabled={saving || !summary.trim()}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-medium text-accent-foreground shadow shadow-accent/25 transition hover:opacity-90 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            {saving ? "Saving…" : "Save Brief"}
          </button>
        </div>
      )}
    </div>
  );
}

// ── OLD COMPONENT BELOW (replaced above) ── removed
