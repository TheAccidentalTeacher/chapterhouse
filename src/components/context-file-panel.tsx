"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BookOpen, Download, Loader2, Plus, Save, Upload } from "lucide-react";

type DocType = "copilot_instructions" | "dreamer" | "extended_context" | "intel" | "custom";

interface DocMeta {
  label: string;
  description: string;
  placeholder: string;
  emptyHint: string;
  color: string;           // Tailwind color key for accent
}

const DOC_TYPES: { type: DocType; meta: DocMeta }[] = [
  {
    type: "copilot_instructions",
    meta: {
      label: "Copilot Instructions",
      description: "Your full copilot-instructions.md — identity, rules, stack, decisions.",
      placeholder: "Paste your copilot-instructions.md here…",
      emptyHint: "Paste your copilot-instructions.md, or use Import .md to load it.",
      color: "amber",
    },
  },
  {
    type: "dreamer",
    meta: {
      label: "Dreamer",
      description: "Your living dream document — repo registry, collision dreams, seed ideas.",
      placeholder: "Paste your dreamer.md here…",
      emptyHint: "Paste your dreamer.md, or use Import .md. The AI can read and update it live.",
      color: "violet",
    },
  },
  {
    type: "extended_context",
    meta: {
      label: "Extended Context",
      description: "Deep strategic reference — COPILOT-EXTENDED-CONTEXT equivalent.",
      placeholder: "Paste your extended context file here…",
      emptyHint: "Optional deep reference doc. Assembled after Copilot Instructions.",
      color: "sky",
    },
  },
  {
    type: "intel",
    meta: {
      label: "Intel",
      description: "Latest research sweep — auto-updated by the email workspace agent.",
      placeholder: "Paste latest intel sweep here…",
      emptyHint: "Latest intel pushed from your email workspace or pasted manually.",
      color: "emerald",
    },
  },
];

type ContextFile = {
  id: string;
  name: string;
  description: string | null;
  content: string;
  document_type: string;
  inject_order: number;
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
  const [activeType, setActiveType] = useState<DocType>("copilot_instructions");
  // Map of document_type → ContextFile (the active version from DB)
  const [docs, setDocs] = useState<Record<string, ContextFile>>({});
  // Map of document_type → current textarea content (may be dirty)
  const [contents, setContents] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load all active context documents on mount
  useEffect(() => {
    fetch("/api/context")
      .then((r) => r.json())
      .then((d: { contextFiles?: ContextFile[] }) => {
        const map: Record<string, ContextFile> = {};
        const contentMap: Record<string, string> = {};
        for (const cf of d.contextFiles ?? []) {
          map[cf.document_type] = cf;
          contentMap[cf.document_type] = cf.content;
        }
        setDocs(map);
        setContents(contentMap);
      })
      .catch(() => null)
      .finally(() => setLoading(false));
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value;
    setContents((prev) => ({ ...prev, [activeType]: val }));
    setDirty((prev) => ({ ...prev, [activeType]: true }));
    setSuccessMsg(null);
  }

  function switchType(type: DocType) {
    setActiveType(type);
    setError(null);
    setSuccessMsg(null);
  }

  async function handleSave() {
    const content = contents[activeType] ?? "";
    if (!content.trim() || saving) return;
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await fetch("/api/context", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim(), document_type: activeType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);
      setDocs((prev) => ({ ...prev, [activeType]: data.contextFile }));
      setDirty((prev) => ({ ...prev, [activeType]: false }));
      setSuccessMsg("Saved. Every new chat now includes this document.");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  function handleExport() {
    window.open(`/api/context/export?type=${activeType}`, "_blank");
  }

  const handleImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result;
      if (typeof text === "string") {
        setContents((prev) => ({ ...prev, [activeType]: text }));
        setDirty((prev) => ({ ...prev, [activeType]: true }));
        setSuccessMsg(null);
        setError(null);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }, [activeType]);

  const activeMeta = DOC_TYPES.find((d) => d.type === activeType)?.meta;
  const content = contents[activeType] ?? "";
  const currentDoc = docs[activeType] ?? null;
  const isDirty = dirty[activeType] ?? false;
  const isEmpty = content.trim() === "";
  const words = wordCount(content);
  const chars = content.length;

  // Summary counts for the header
  const activeDocCount = Object.keys(docs).length;
  const totalWords = Object.values(contents).reduce((sum, c) => sum + wordCount(c), 0);

  return (
    <section className="glass-panel rounded-3xl p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400">
            <BookOpen className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Context Brain</h2>
            <p className="text-xs text-muted">
              Multiple named documents assembled in order into every chat.{" "}
              {!loading && activeDocCount > 0 && (
                <span className="text-amber-400/80">
                  {activeDocCount} document{activeDocCount !== 1 ? "s" : ""} active · {totalWords.toLocaleString()} total words
                </span>
              )}
            </p>
          </div>
        </div>
        {/* Import / Export controls */}
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
          {currentDoc && (
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

      {/* Document type pill selector */}
      <div className="flex flex-wrap gap-2">
        {DOC_TYPES.map(({ type, meta }) => {
          const hasContent = !!(contents[type]?.trim());
          const isActive = type === activeType;
          return (
            <button
              key={type}
              type="button"
              onClick={() => switchType(type)}
              className={[
                "flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                isActive
                  ? "bg-amber-500 text-black"
                  : "border border-border/70 bg-muted-surface text-muted hover:text-foreground",
              ].join(" ")}
            >
              {meta.label}
              {hasContent && (
                <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-black/40" : "bg-emerald-400"}`} />
              )}
              {dirty[type] && (
                <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-black/60" : "bg-amber-400"}`} />
              )}
            </button>
          );
        })}
        <button
          type="button"
          className="flex items-center gap-1 rounded-full border border-dashed border-border/50 px-3 py-1 text-xs text-muted/60 hover:text-muted transition-colors"
          title="Custom document types coming soon"
          disabled
        >
          <Plus className="h-3 w-3" />
          Add
        </button>
      </div>

      {/* Active document description + meta */}
      {!loading && activeMeta && (
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <p className="text-xs text-muted">{activeMeta.description}</p>
          <div className="flex items-center gap-4 text-xs text-muted shrink-0">
            <span className="font-mono">{words.toLocaleString()} words</span>
            <span className="font-mono">{chars.toLocaleString()} chars</span>
            {currentDoc?.updated_at && (
              <span>Saved: {formatDate(currentDoc.updated_at)}</span>
            )}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && isEmpty && activeMeta && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/8 p-4 text-sm text-amber-300">
          <p className="font-semibold mb-1">{activeMeta.label} is empty.</p>
          <p className="text-amber-400/80">{activeMeta.emptyHint}</p>
        </div>
      )}

      {/* Textarea */}
      {loading ? (
        <div className="flex items-center gap-2 py-12 text-muted">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Loading context documents…</span>
        </div>
      ) : (
        <textarea
          value={content}
          onChange={handleChange}
          rows={30}
          spellCheck={false}
          className="w-full rounded-2xl border border-border/70 bg-muted-surface px-4 py-3 font-mono text-xs leading-relaxed text-foreground placeholder:text-muted/50 focus:border-amber-500/60 focus:outline-none focus:ring-1 focus:ring-amber-500/30 resize-y transition-colors"
          placeholder={activeMeta?.placeholder ?? "Paste content here…"}
        />
      )}

      {/* Footer: messages + save */}
      <div className="flex items-center justify-between gap-4">
        <div className="min-h-5 text-sm">
          {error && <p className="text-destructive">{error}</p>}
          {successMsg && <p className="text-emerald-400">{successMsg}</p>}
          {isDirty && !successMsg && (
            <p className="text-amber-400/80 text-xs">Unsaved changes in {activeMeta?.label} — hit Save to make it live.</p>
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
          {saving ? "Saving…" : `Save ${activeMeta?.label ?? "Document"}`}
        </button>
      </div>

      {/* Push API info box */}
      <details className="group rounded-2xl border border-border/40 bg-muted-surface/50">
        <summary className="cursor-pointer list-none px-4 py-3 text-xs text-muted hover:text-foreground transition-colors select-none">
          <span className="font-semibold">Push API</span>
          <span className="ml-2 opacity-60">— update any document from another VS Code workspace</span>
        </summary>
        <div className="px-4 pb-4 pt-2 space-y-2 text-xs text-muted/80 font-mono">
          <p className="text-muted/60 font-sans not-italic">
            Set <code className="text-amber-400">CHAPTERHOUSE_PUSH_KEY</code> in Vercel + in your other workspace&#39;s{" "}
            <code className="text-amber-400">.env.master</code>. Then push any document:
          </p>
          <pre className="overflow-x-auto rounded-xl bg-background/60 p-3 text-[10px] leading-relaxed whitespace-pre-wrap">{`POST https://chapterhouse.vercel.app/api/context/push
Authorization: Bearer <CHAPTERHOUSE_PUSH_KEY>
Content-Type: application/json

{
  "document_type": "dreamer",
  "action": "replace",
  "content": "<full dreamer.md content>"
}`}</pre>
          <p className="font-sans not-italic text-muted/60">
            Actions: <code>replace</code> · <code>append</code> · <code>insert_seed</code>. Every push creates a new version (old one deactivated, history preserved).
          </p>
        </div>
      </details>
    </section>
  );
}
