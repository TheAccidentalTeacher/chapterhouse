"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown, ChevronUp, Loader2, Plus, Sparkles } from "lucide-react";

export function NewBriefPanel() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"generate" | "manual">("generate");

  // Generate state
  const [context, setContext] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Manual state
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [briefDate, setBriefDate] = useState(new Date().toISOString().split("T")[0]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleGenerate() {
    setGenerating(true);
    setGenerateError(null);
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
      setOpen(false);
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
      setOpen(false);
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
    <div className="mb-4">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-4 py-2 text-sm text-muted transition hover:border-accent/40 hover:text-foreground"
      >
        <Plus className="h-3.5 w-3.5" />
        New Brief
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>

      {open && (
        <div className="mt-3 rounded-3xl border border-border bg-card/60 p-5">
          {/* Tab bar */}
          <div className="mb-4 flex gap-1 rounded-xl border border-border/70 bg-muted-surface p-1 w-fit">
            <button
              onClick={() => setTab("generate")}
              className={`rounded-lg px-4 py-1.5 text-xs font-medium transition ${tab === "generate" ? "bg-accent text-accent-foreground shadow" : "text-muted hover:text-foreground"}`}
            >
              <Sparkles className="mr-1.5 inline h-3 w-3" />
              Generate with AI
            </button>
            <button
              onClick={() => setTab("manual")}
              className={`rounded-lg px-4 py-1.5 text-xs font-medium transition ${tab === "manual" ? "bg-accent text-accent-foreground shadow" : "text-muted hover:text-foreground"}`}
            >
              Write manually
            </button>
          </div>

          {tab === "generate" ? (
            <div className="space-y-3">
              <textarea
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="Optional: tell the AI what to focus on today (e.g. 'Focus on Shopify launch progress and competitive gaps')..."
                rows={3}
                className="w-full resize-none rounded-2xl border border-border/70 bg-muted-surface px-4 py-3 text-sm text-foreground placeholder:text-muted focus:border-accent/40 focus:outline-none"
              />
              {generateError && (
                <p className="text-xs text-red-400">{generateError}</p>
              )}
              <button
                onClick={handleGenerate}
                disabled={generating}
                className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-medium text-accent-foreground shadow shadow-accent/25 transition hover:opacity-90 disabled:opacity-50"
              >
                {generating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                {generating ? "Generating…" : "Generate & Save Brief"}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
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
              {saveError && (
                <p className="text-xs text-red-400">{saveError}</p>
              )}
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
      )}
    </div>
  );
}
