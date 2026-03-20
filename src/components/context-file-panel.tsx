"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BookOpen, Download, Loader2, Save, Upload } from "lucide-react";

type ContextFile = {
  id: string;
  name: string;
  description: string | null;
  content: string;
  updated_at: string;
  last_exported_at: string | null;
};

function wordCount(text: string): number {
  return text.trim() === "" ? 0 : text.trim().split(/\s+/).length;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ContextFilePanel() {
  const [contextFile, setContextFile] = useState<ContextFile | null>(null);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/context")
      .then((r) => r.json())
      .then((d) => {
        const cf: ContextFile | null = d.contextFile ?? null;
        setContextFile(cf);
        setContent(cf?.content ?? "");
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setContent(e.target.value);
    setIsDirty(true);
    setSuccessMsg(null);
  }

  async function handleSave() {
    if (!content.trim() || saving) return;
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);
      setContextFile(data.contextFile);
      setIsDirty(false);
      setSuccessMsg("Saved. Every new chat session now loads this context.");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  function handleExport() {
    window.open("/api/context/export", "_blank");
  }

  const handleImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text === "string") {
        setContent(text);
        setIsDirty(true);
        setSuccessMsg(null);
        setError(null);
      }
    };
    reader.readAsText(file);
    // Reset so the same file can be re-imported
    e.target.value = "";
  }, []);

  const words = wordCount(content);
  const chars = content.length;
  const isEmpty = content.trim() === "";

  return (
    <section className="glass-panel rounded-3xl p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400">
            <BookOpen className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Context File</h2>
            <p className="text-xs text-muted">
              The brain behind every chat session. Your full{" "}
              <code className="rounded bg-muted-surface px-1 py-0.5 text-xs">copilot-instructions.md</code>{" "}
              lives here — editable, exportable, always live.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-xl border border-border/70 bg-muted-surface px-3 py-1.5 text-xs font-semibold text-muted hover:text-foreground transition-colors"
          >
            <Upload className="h-3 w-3" />
            Import .md
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.txt"
            className="hidden"
            onChange={handleImport}
          />
          {contextFile && (
            <button
              type="button"
              onClick={handleExport}
              className="flex items-center gap-1.5 rounded-xl border border-border/70 bg-muted-surface px-3 py-1.5 text-xs font-semibold text-muted hover:text-foreground transition-colors"
            >
              <Download className="h-3 w-3" />
              Export
            </button>
          )}
        </div>
      </div>

      {/* Meta bar */}
      {!loading && (
        <div className="flex items-center gap-4 text-xs text-muted">
          <span className="font-mono">{words.toLocaleString()} words</span>
          <span className="font-mono">{chars.toLocaleString()} chars</span>
          {contextFile?.updated_at && (
            <span>Last saved: {formatDate(contextFile.updated_at)}</span>
          )}
          {contextFile?.last_exported_at && (
            <span>Last exported: {formatDate(contextFile.last_exported_at)}</span>
          )}
        </div>
      )}

      {/* Empty state prompt */}
      {!loading && isEmpty && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/8 p-4 text-sm text-amber-300">
          <p className="font-semibold mb-1">Context file is empty.</p>
          <p className="text-amber-400/80">
            Paste your <code className="text-amber-300">copilot-instructions.md</code> below, or use{" "}
            <strong>Import .md</strong> to load the file directly. Every chat will load it as the base system prompt.
          </p>
        </div>
      )}

      {/* Textarea */}
      {loading ? (
        <div className="flex items-center gap-2 py-12 text-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Loading context file…</span>
        </div>
      ) : (
        <textarea
          value={content}
          onChange={handleChange}
          rows={30}
          spellCheck={false}
          className="w-full rounded-2xl border border-border/70 bg-muted-surface px-4 py-3 font-mono text-xs leading-relaxed text-foreground placeholder:text-muted/50 focus:border-amber-500/60 focus:outline-none focus:ring-1 focus:ring-amber-500/30 resize-y transition-colors"
          placeholder="Paste your full copilot-instructions.md here…"
        />
      )}

      {/* Footer: messages + save */}
      <div className="flex items-center justify-between gap-4">
        <div className="min-h-5 text-sm">
          {error && <p className="text-destructive">{error}</p>}
          {successMsg && <p className="text-emerald-400">{successMsg}</p>}
          {isDirty && !successMsg && (
            <p className="text-amber-400/80 text-xs">Unsaved changes — hit Save to make this live.</p>
          )}
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || isEmpty || !isDirty}
          className="flex items-center gap-1.5 rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-black hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {saving ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Save className="h-3.5 w-3.5" />
          )}
          {saving ? "Saving…" : "Save Context"}
        </button>
      </div>
    </section>
  );
}
