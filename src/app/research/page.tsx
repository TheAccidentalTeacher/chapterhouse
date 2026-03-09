"use client";

import { useEffect, useState } from "react";
import { ArrowUp, ExternalLink, Loader2, Tag, PenLine, X, Link2, ClipboardPaste, StickyNote } from "lucide-react";

type InputTab = "url" | "paste" | "note";

type ResearchItem = {
  id: string;
  url: string;
  title: string | null;
  summary: string | null;
  verdict: string | null;
  tags: string[];
  status: string;
  created_at: string;
};

export default function ResearchPage() {
  const [items, setItems] = useState<ResearchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<InputTab>("url");

  // URL tab
  const [url, setUrl] = useState("");
  const [ingesting, setIngesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Manual fallback (when URL fetch is blocked)
  const [manualUrl, setManualUrl] = useState("");
  const [manualTitle, setManualTitle] = useState("");
  const [manualSummary, setManualSummary] = useState("");
  const [manualVerdict, setManualVerdict] = useState("");
  const [showManual, setShowManual] = useState(false);
  const [savingManual, setSavingManual] = useState(false);

  // Paste tab
  const [pasteText, setPasteText] = useState("");
  const [pasteLabel, setPasteLabel] = useState("");
  const [savingPaste, setSavingPaste] = useState(false);
  const [pasteError, setPasteError] = useState<string | null>(null);

  // Quick note tab
  const [noteTitle, setNoteTitle] = useState("");
  const [noteText, setNoteText] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/research")
      .then((r) => r.json())
      .then((data) => setItems(data.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  async function handleIngest(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed || ingesting) return;

    setIngesting(true);
    setError(null);
    setShowManual(false);
    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.fetchFailed) {
          // Site blocked the fetch — offer manual entry
          setManualUrl(trimmed);
          setManualTitle("");
          setManualSummary("");
          setManualVerdict("");
          setShowManual(true);
          setError(null);
        } else {
          throw new Error(data.error || res.statusText);
        }
        return;
      }
      setItems((prev) => [data.item, ...prev]);
      setUrl("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIngesting(false);
    }
  }

  async function handleManualSave(e: React.FormEvent) {
    e.preventDefault();
    setSavingManual(true);
    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: manualUrl,
          manual: true,
          title: manualTitle,
          summary: manualSummary,
          verdict: manualVerdict,
          tags: ["competitor"],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);
      setItems((prev) => [data.item, ...prev]);
      setShowManual(false);
      setUrl("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSavingManual(false);
    }
  }

  async function handlePaste(e: React.FormEvent) {
    e.preventDefault();
    if (!pasteText.trim() || savingPaste) return;
    setSavingPaste(true);
    setPasteError(null);
    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pasteText, sourceLabel: pasteLabel || "Pasted content" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);
      setItems((prev) => [data.item, ...prev]);
      setPasteText("");
      setPasteLabel("");
    } catch (e) {
      setPasteError(e instanceof Error ? e.message : String(e));
    } finally {
      setSavingPaste(false);
    }
  }

  async function handleNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteText.trim() || savingNote) return;
    setSavingNote(true);
    setNoteError(null);
    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pasteText: noteText,
          sourceLabel: noteTitle || "Quick note",
          title: noteTitle || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);
      setItems((prev) => [data.item, ...prev]);
      setNoteTitle("");
      setNoteText("");
    } catch (e) {
      setNoteError(e instanceof Error ? e.message : String(e));
    } finally {
      setSavingNote(false);
    }
  }

  return (
    <div className="p-6 sm:p-8 lg:p-10">
      <div className="mx-auto max-w-4xl space-y-8">

        {/* Header */}
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Research</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Sources turned into signal.</h1>
          <p className="mt-2 text-sm text-muted">
            Paste any URL. Chapterhouse fetches it, reads it, and tells you whether it matters — and why.
            Saved items feed directly into the chat system prompt.
          </p>
        </div>

        {/* Tabbed input panel */}
        <div className="glass-panel rounded-3xl p-5 space-y-4">
          {/* Tab switcher */}
          <div className="flex gap-1 rounded-xl bg-muted-surface p-1">
            {([
              { id: "url", label: "URL", Icon: Link2 },
              { id: "paste", label: "Paste text", Icon: ClipboardPaste },
              { id: "note", label: "Quick note", Icon: StickyNote },
            ] as { id: InputTab; label: string; Icon: React.ElementType }[]).map(({ id, label, Icon }) => (
              <button
                key={id}
                onClick={() => { setTab(id); setError(null); setPasteError(null); setNoteError(null); setShowManual(false); }}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition ${
                  tab === id ? "bg-background text-foreground shadow-sm" : "text-muted hover:text-foreground"
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* URL tab */}
          {tab === "url" && (
            <form onSubmit={handleIngest} className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                Add a source
              </label>
              <div className="flex gap-3">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://..."
                  required
                  disabled={ingesting}
                  className="flex-1 rounded-2xl border border-border/70 bg-muted-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-accent/40 focus:outline-none disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!url.trim() || ingesting}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground shadow shadow-accent/25 transition hover:opacity-90 disabled:opacity-40"
                >
                  {ingesting ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
                </button>
              </div>
              {ingesting && <p className="text-xs text-muted animate-pulse">Fetching and analyzing… ~10 seconds.</p>}
              {error && <p className="text-xs text-red-400">{error}</p>}
            </form>
          )}

          {/* Paste text tab */}
          {tab === "paste" && (
            <form onSubmit={handlePaste} className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                Paste anything — email body, article, Instagram caption
              </label>
              <input
                value={pasteLabel}
                onChange={(e) => setPasteLabel(e.target.value)}
                placeholder="Where is this from? (optional — e.g. 'AI newsletter from Monday')"
                className="w-full rounded-xl border border-border/70 bg-muted-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent/40 focus:outline-none"
              />
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                rows={6}
                placeholder="Paste the text here. Chapterhouse will read it, summarize it through the Next Chapter lens, and add it to the brain."
                required
                className="w-full rounded-xl border border-border/70 bg-muted-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent/40 focus:outline-none resize-y"
              />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted">{pasteText.length} chars</span>
                <button
                  type="submit"
                  disabled={!pasteText.trim() || savingPaste}
                  className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground shadow shadow-accent/25 transition hover:opacity-90 disabled:opacity-40"
                >
                  {savingPaste ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ClipboardPaste className="h-3.5 w-3.5" />}
                  {savingPaste ? "Analyzing…" : "Add to brain"}
                </button>
              </div>
              {pasteError && <p className="text-xs text-red-400">{pasteError}</p>}
            </form>
          )}

          {/* Quick note tab */}
          {tab === "note" && (
            <form onSubmit={handleNote} className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                Something you noticed — write it down, AI will contextualize it
              </label>
              <input
                value={noteTitle}
                onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="Title (optional — e.g. 'Idea from Instagram scroll')"
                className="w-full rounded-xl border border-border/70 bg-muted-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent/40 focus:outline-none"
              />
              <textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={4}
                placeholder="e.g. 'Saw a homeschool store on Instagram doing a book-of-the-month subscription for $29. Seemed to be getting a ton of engagement in the comments.'"
                required
                className="w-full rounded-xl border border-border/70 bg-muted-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent/40 focus:outline-none resize-y"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!noteText.trim() || savingNote}
                  className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground shadow shadow-accent/25 transition hover:opacity-90 disabled:opacity-40"
                >
                  {savingNote ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <StickyNote className="h-3.5 w-3.5" />}
                  {savingNote ? "Saving…" : "Save note"}
                </button>
              </div>
              {noteError && <p className="text-xs text-red-400">{noteError}</p>}
            </form>
          )}
        </div>

        {/* Manual fallback form */}
        {showManual && (
          <form onSubmit={handleManualSave} className="glass-panel rounded-3xl p-5 space-y-4 border border-amber-500/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PenLine className="h-4 w-4 text-amber-400" />
                <span className="text-xs font-semibold uppercase tracking-[0.12em] text-amber-400">Site blocked auto-fetch — save manually</span>
              </div>
              <button type="button" onClick={() => setShowManual(false)} className="text-muted hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs text-muted">URL</label>
                <input value={manualUrl} readOnly className="w-full rounded-xl border border-border/70 bg-muted-surface px-3 py-2 text-xs text-muted" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted">Title</label>
                <input
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="e.g. Sonlight Curriculum — homepage"
                  required
                  className="w-full rounded-xl border border-border/70 bg-muted-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent/40 focus:outline-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted">Summary (optional)</label>
                <textarea
                  value={manualSummary}
                  onChange={(e) => setManualSummary(e.target.value)}
                  rows={2}
                  placeholder="What is this site about?"
                  className="w-full rounded-xl border border-border/70 bg-muted-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent/40 focus:outline-none resize-none"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted">Verdict (optional)</label>
                <input
                  value={manualVerdict}
                  onChange={(e) => setManualVerdict(e.target.value)}
                  placeholder="Is this relevant to Next Chapter? Why?"
                  className="w-full rounded-xl border border-border/70 bg-muted-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent/40 focus:outline-none"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={!manualTitle.trim() || savingManual}
              className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground shadow shadow-accent/25 transition hover:opacity-90 disabled:opacity-40"
            >
              {savingManual ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PenLine className="h-3.5 w-3.5" />}
              Save manually
            </button>
          </form>
        )}

        {/* Results */}
        {loading ? (
          <div className="flex items-center gap-3 text-sm text-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading saved research…
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-3xl border border-border/40 bg-muted-surface/50 px-8 py-12 text-center">
            <p className="text-sm text-muted">No research saved yet. Paste a URL above to get started.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs text-muted">{items.length} source{items.length === 1 ? "" : "s"} saved</p>
            {items.map((item) => (
              <article key={item.id} className="glass-panel rounded-3xl p-5 space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-medium leading-snug">{item.title || item.url}</h2>
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted hover:text-accent"
                    >
                      {item.url.replace(/^https?:\/\//, "").split("/")[0]}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                  <span className="shrink-0 text-xs text-muted">
                    {new Date(item.created_at).toLocaleDateString()}
                  </span>
                </div>

                {item.summary && (
                  <p className="text-sm leading-6 text-muted">{item.summary}</p>
                )}

                {item.verdict && (
                  <div className="rounded-xl border border-border/70 bg-muted-surface px-4 py-2.5 text-sm">
                    <span className="font-medium">Verdict: </span>
                    <span className="text-muted">{item.verdict}</span>
                  </div>
                )}

                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Tag className="h-3 w-3 text-muted shrink-0" />
                    {item.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-border/70 bg-muted-surface px-2.5 py-0.5 text-xs text-muted"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}