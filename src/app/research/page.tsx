"use client";

import { useEffect, useState } from "react";
import { ArrowUp, ExternalLink, Loader2, Tag, PenLine, X, Link2, ClipboardPaste, StickyNote, Camera, ImageIcon, Trash2, RotateCcw, Sparkles, ChevronDown, BookOpen, Search, LayoutList, Rows3, Globe, ChevronRight } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { logEvent, loggedFetch } from "@/lib/debug-log";

type InputTab = "url" | "paste" | "note" | "image" | "auto" | "deep";

type KnowledgeSummary = {
  tag: string;
  summary: string;
  item_count: number;
  updated_at: string;
};

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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reanalyzingId, setReanalyzingId] = useState<string | null>(null);
  const [summarizing, setSummarizing] = useState(false);
  const [summarizeResult, setSummarizeResult] = useState<string | null>(null);
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [summaries, setSummaries] = useState<KnowledgeSummary[]>([]);
  const [kbExpanded, setKbExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"flat" | "grouped">("flat");

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

  // Screenshot / image tab
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageLabel, setImageLabel] = useState("");
  const [savingImage, setSavingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageDragOver, setImageDragOver] = useState(false);

  // Auto-research tab
  const [autoTopic, setAutoTopic] = useState("");
  const [autoSearching, setAutoSearching] = useState(false);
  const [autoError, setAutoError] = useState<string | null>(null);
  const [autoResultCount, setAutoResultCount] = useState<number | null>(null);

  // Deep research tab
  const [deepQuery, setDeepQuery] = useState("");
  const [deepSearching, setDeepSearching] = useState(false);
  const [deepError, setDeepError] = useState<string | null>(null);
  const [deepDepth, setDeepDepth] = useState<"quick" | "standard" | "deep">("standard");
  const [deepSources, setDeepSources] = useState<string[]>(["tavily", "serpapi", "reddit", "newsapi", "internet-archive"]);
  const [deepResult, setDeepResult] = useState<{ synthesis: string; sources: { url: string; title: string; source: string; excerpt: string; relevanceScore: number }[]; totalResults: number; savedCount: number; metadata: { searchDuration: number; tokensUsed: number; model: string } } | null>(null);

  useEffect(() => {
    logEvent("info", "Research page loaded — fetching items");
    loggedFetch("/api/research", {}, "Load research items")
      .then((r) => r.json())
      .then((data) => {
        setItems(data.items ?? []);
        logEvent("success", `Loaded ${(data.items ?? []).length} research items`);
      })
      .catch((e) => { setItems([]); logEvent("error", "Failed to load research items", String(e)); })
      .finally(() => setLoading(false));
    // Fetch existing knowledge summaries in parallel
    fetch("/api/summarize")
      .then((r) => r.json())
      .then((data) => setSummaries(data.summaries ?? []))
      .catch(() => { /* table may not exist yet */ });
  }, []);

  async function handleIngest(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed || ingesting) return;
    logEvent("click", `Ingest URL: ${trimmed}`);
    setIngesting(true);
    setError(null);
    setShowManual(false);
    try {
      const res = await loggedFetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      }, "Ingest URL");
      const data = await res.json();
      if (!res.ok) {
        if (data.fetchFailed) {
          logEvent("info", `Site blocked auto-fetch — manual entry triggered for ${trimmed}`);
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
      logEvent("brain", `Item saved to research brain: "${data.item?.title}"`, data.item);
      setUrl("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIngesting(false);
    }
  }

  async function handleManualSave(e: React.FormEvent) {
    e.preventDefault();
    logEvent("click", `Manual save: ${manualTitle || manualUrl}`);
    setSavingManual(true);
    try {
      const res = await loggedFetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: manualUrl, manual: true, title: manualTitle, summary: manualSummary, verdict: manualVerdict, tags: ["competitor"] }),
      }, "Manual save research");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);
      setItems((prev) => [data.item, ...prev]);
      logEvent("brain", `Manual item saved to brain: "${data.item?.title}"`, data.item);
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
    logEvent("click", `Paste text: "${pasteLabel || "Pasted content"}" (${pasteText.length} chars)`);
    setSavingPaste(true);
    setPasteError(null);
    try {
      const res = await loggedFetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pasteText, sourceLabel: pasteLabel || "Pasted content" }),
      }, "Ingest paste text");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);
      setItems((prev) => [data.item, ...prev]);
      logEvent("brain", `Paste item saved to brain: "${data.item?.title}"`, data.item);
      setPasteText("");
      setPasteLabel("");
    } catch (e) {
      setPasteError(e instanceof Error ? e.message : String(e));
    } finally {
      setSavingPaste(false);
    }
  }

  async function handleDelete(id: string) {
    if (deletingId) return;
    logEvent("click", `Delete research item: ${id}`);
    setDeletingId(id);
    try {
      const res = await loggedFetch(`/api/research?id=${id}`, { method: "DELETE" }, "Delete research item");
      if (!res.ok) throw new Error("Delete failed");
      setItems((prev) => prev.filter((i) => i.id !== id));
      logEvent("success", `Deleted research item ${id}`);
    } catch (e) {
      logEvent("error", `Delete failed for ${id}`, String(e));
    } finally {
      setDeletingId(null);
    }
  }

  async function handleReanalyze(item: ResearchItem) {
    if (reanalyzingId) return;
    logEvent("click", `Re-analyze: "${item.title || item.url}"`);
    setReanalyzingId(item.id);
    try {
      await loggedFetch(`/api/research?id=${item.id}`, { method: "DELETE" }, "Delete before re-analyze");
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      const res = await loggedFetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: item.url }),
      }, "Re-analyze URL");
      const data = await res.json();
      if (res.ok) {
        setItems((prev) => [data.item, ...prev]);
        logEvent("brain", `Re-analyzed item saved: "${data.item?.title}"`, data.item);
      }
    } catch (e) {
      logEvent("error", "Re-analyze failed", String(e));
    } finally {
      setReanalyzingId(null);
    }
  }

  function handleImageFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setImageError("Please upload an image file (PNG, JPG, WEBP, etc.)");
      return;
    }
    setImageFile(file);
    setImageError(null);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function handleImage(e: React.FormEvent) {
    e.preventDefault();
    if (!imageFile || savingImage) return;
    logEvent("click", `Analyze image: "${imageLabel || "Screenshot"}" (${imageFile.name})`);
    setSavingImage(true);
    setImageError(null);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const result = ev.target?.result as string;
          resolve(result.split(",")[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
      });
      const res = await loggedFetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64,
          imageType: imageFile.type,
          sourceLabel: imageLabel || "Screenshot",
        }),
      }, "Analyze image");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);
      setItems((prev) => [data.item, ...prev]);
      logEvent("brain", `Image item saved to brain: "${data.item?.title}"`, data.item);
      setImageFile(null);
      setImagePreview(null);
      setImageLabel("");
    } catch (e) {
      setImageError(e instanceof Error ? e.message : String(e));
      logEvent("error", "Image analyze failed", String(e));
    } finally {
      setSavingImage(false);
    }
  }

  async function handleSummarize() {
    if (summarizing) return;
    logEvent("click", `Condense knowledge — ${items.length} items in corpus`);
    setSummarizing(true);
    setSummarizeResult(null);
    try {
      const res = await loggedFetch("/api/summarize", { method: "POST" }, "Condense knowledge");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);
      setSummarizeResult(data.message);
      logEvent("brain", `Knowledge condensed: ${data.message}`, { tags: data.tags, summaries: data.summaries });
      // Refresh the knowledge base panel
      fetch("/api/summarize")
        .then((r) => r.json())
        .then((d) => { setSummaries(d.summaries ?? []); setKbExpanded(true); })
        .catch(() => {});
    } catch (e) {
      const msg = `Failed: ${e instanceof Error ? e.message : String(e)}`;
      setSummarizeResult(msg);
      logEvent("error", "Condense knowledge failed", String(e));
    } finally {
      setSummarizing(false);
    }
  }

  async function handleNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteText.trim() || savingNote) return;
    logEvent("click", `Save note: "${noteTitle || "Quick note"}"`);
    setSavingNote(true);
    setNoteError(null);
    try {
      const res = await loggedFetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pasteText: noteText, sourceLabel: noteTitle || "Quick note", title: noteTitle || undefined }),
      }, "Save quick note");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);
      setItems((prev) => [data.item, ...prev]);
      logEvent("brain", `Note saved to brain: "${data.item?.title}"`, data.item);
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
              { id: "image", label: "Screenshot", Icon: Camera },
              { id: "auto", label: "Auto-research", Icon: Search },
              { id: "deep", label: "Deep Research", Icon: Globe },
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

          {/* Screenshot / image tab */}
          {tab === "image" && (
            <form onSubmit={handleImage} className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                Upload a screenshot — Instagram post, carousel, competitor content, anything visual
              </label>
              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setImageDragOver(true); }}
                onDragLeave={() => setImageDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setImageDragOver(false);
                  const file = e.dataTransfer.files[0];
                  if (file) handleImageFile(file);
                }}
                onClick={() => document.getElementById("image-upload")?.click()}
                className={`relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition ${
                  imageDragOver
                    ? "border-accent/60 bg-accent/5"
                    : imagePreview
                    ? "border-border/40 bg-muted-surface/50"
                    : "border-border/50 bg-muted-surface/30 hover:border-accent/40 hover:bg-accent/5"
                } ${imagePreview ? "min-h-0 p-2" : "min-h-[140px] p-6"}`}
              >
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageFile(f); }}
                />
                {imagePreview ? (
                  <div className="relative w-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imagePreview} alt="Preview" className="max-h-64 w-full rounded-xl object-contain" />
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setImageFile(null); setImagePreview(null); }}
                      className="absolute right-2 top-2 rounded-full bg-background/80 p-1 text-muted hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <>
                    <ImageIcon className="mb-2 h-8 w-8 text-muted/50" />
                    <p className="text-sm text-muted">Drop an image here, or click to choose</p>
                    <p className="mt-1 text-xs text-muted/60">PNG, JPG, WEBP, HEIC — any screenshot works</p>
                  </>
                )}
              </div>
              <input
                value={imageLabel}
                onChange={(e) => setImageLabel(e.target.value)}
                placeholder="What is this? (optional — e.g. 'Rainbow Resource Instagram carousel, March 2026')"
                className="w-full rounded-xl border border-border/70 bg-muted-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent/40 focus:outline-none"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={!imageFile || savingImage}
                  className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground shadow shadow-accent/25 transition hover:opacity-90 disabled:opacity-40"
                >
                  {savingImage ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                  {savingImage ? "Analyzing image…" : "Analyze image"}
                </button>
              </div>
              {imageError && <p className="text-xs text-red-400">{imageError}</p>}
            </form>
          )}

          {/* Auto-research tab */}
          {tab === "auto" && (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const trimmed = autoTopic.trim();
                if (!trimmed || autoSearching) return;
                setAutoSearching(true);
                setAutoError(null);
                setAutoResultCount(null);
                try {
                  const res = await fetch("/api/research/auto", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ topic: trimmed, maxResults: 5 }),
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.error || res.statusText);
                  setAutoResultCount(data.count);
                  setAutoTopic("");
                  // Refresh item list
                  const refreshRes = await fetch("/api/research");
                  const refreshData = await refreshRes.json();
                  setItems(refreshData.items ?? []);
                } catch (err) {
                  setAutoError(String(err instanceof Error ? err.message : err));
                } finally {
                  setAutoSearching(false);
                }
              }}
              className="space-y-3"
            >
              <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                Search a topic — Chapterhouse will find, analyze, and save relevant sources automatically
              </label>
              <div className="flex gap-3">
                <input
                  value={autoTopic}
                  onChange={(e) => setAutoTopic(e.target.value)}
                  placeholder="e.g. homeschool market trends 2026, AI curriculum tools…"
                  required
                  className="flex-1 rounded-xl border border-border/70 bg-muted-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent/40 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={autoSearching || !autoTopic.trim()}
                  className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground shadow shadow-accent/25 transition hover:opacity-90 disabled:opacity-40"
                >
                  {autoSearching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  {autoSearching ? "Researching…" : "Research"}
                </button>
              </div>
              {autoError && <p className="text-xs text-red-400">{autoError}</p>}
              {autoResultCount !== null && (
                <p className="text-xs text-emerald-400">
                  {autoResultCount === 0
                    ? "No new results found (may already be in your library)"
                    : `${autoResultCount} new source${autoResultCount > 1 ? "s" : ""} ingested and queued for review`}
                </p>
              )}
            </form>
          )}

          {/* Deep Research tab */}
          {tab === "deep" && (
            <div className="space-y-4">
              <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                Multi-source parallel deep research — searches Tavily, Google, Reddit, News, and Internet Archive simultaneously
              </label>

              {/* Source toggles */}
              <div className="flex flex-wrap gap-2">
                {([
                  { id: "tavily", label: "Tavily" },
                  { id: "serpapi", label: "Google" },
                  { id: "reddit", label: "Reddit" },
                  { id: "newsapi", label: "News" },
                  { id: "internet-archive", label: "Archive" },
                ] as const).map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() =>
                      setDeepSources((prev) =>
                        prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
                      )
                    }
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                      deepSources.includes(id)
                        ? "bg-accent text-accent-foreground"
                        : "bg-muted-surface text-muted hover:text-foreground"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Depth + query */}
              <div className="flex gap-3">
                <select
                  value={deepDepth}
                  onChange={(e) => setDeepDepth(e.target.value as "quick" | "standard" | "deep")}
                  className="rounded-xl border border-border/70 bg-muted-surface px-3 py-2 text-sm text-foreground focus:border-accent/40 focus:outline-none"
                >
                  <option value="quick">Quick</option>
                  <option value="standard">Standard</option>
                  <option value="deep">Deep</option>
                </select>
                <input
                  value={deepQuery}
                  onChange={(e) => setDeepQuery(e.target.value)}
                  placeholder="e.g. Alaska homeschool allotment regulations 2026…"
                  className="flex-1 rounded-xl border border-border/70 bg-muted-surface px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent/40 focus:outline-none"
                />
                <button
                  type="button"
                  disabled={deepSearching || !deepQuery.trim() || deepSources.length === 0}
                  onClick={async () => {
                    const trimmed = deepQuery.trim();
                    if (!trimmed || deepSearching || deepSources.length === 0) return;
                    setDeepSearching(true);
                    setDeepError(null);
                    setDeepResult(null);
                    try {
                      const res = await fetch("/api/research/deep", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          query: trimmed,
                          sources: deepSources,
                          maxResultsPerSource: 5,
                          analysisDepth: deepDepth,
                        }),
                      });
                      const data = await res.json();
                      if (!res.ok) throw new Error(data.error || res.statusText);
                      setDeepResult(data);
                      // Refresh items list
                      const refreshRes = await fetch("/api/research");
                      const refreshData = await refreshRes.json();
                      setItems(refreshData.items ?? []);
                    } catch (err) {
                      setDeepError(String(err instanceof Error ? err.message : err));
                    } finally {
                      setDeepSearching(false);
                    }
                  }}
                  className="flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground shadow shadow-accent/25 transition hover:opacity-90 disabled:opacity-40"
                >
                  {deepSearching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Globe className="h-3.5 w-3.5" />}
                  {deepSearching ? "Searching…" : "Deep Research"}
                </button>
              </div>

              {deepError && <p className="text-xs text-red-400">{deepError}</p>}

              {/* Deep Research Results */}
              {deepResult && (
                <div className="space-y-4">
                  {/* Metadata bar */}
                  <div className="flex items-center gap-4 text-xs text-muted">
                    <span>{deepResult.totalResults} results from {deepResult.metadata.searchDuration}ms search</span>
                    <span>{deepResult.savedCount} saved to library</span>
                    <span>Model: {deepResult.metadata.model}</span>
                    <span>{deepResult.metadata.tokensUsed.toLocaleString()} tokens</span>
                  </div>

                  {/* Synthesis */}
                  <div className="rounded-2xl border border-border/40 bg-muted-surface/50 p-4">
                    <h4 className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted">AI Synthesis</h4>
                    <div className="prose prose-invert prose-sm max-w-none text-foreground/90">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{deepResult.synthesis}</ReactMarkdown>
                    </div>
                  </div>

                  {/* Source list */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Sources ({deepResult.sources.length})</h4>
                    {deepResult.sources.map((s, i) => (
                      <div key={i} className="flex items-start gap-3 rounded-xl border border-border/30 bg-muted-surface/30 p-3">
                        <span className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                          s.source === "tavily" ? "bg-amber-500/20 text-amber-400" :
                          s.source === "serpapi" ? "bg-green-500/20 text-green-400" :
                          s.source === "reddit" ? "bg-orange-500/20 text-orange-400" :
                          s.source === "newsapi" ? "bg-zinc-500/20 text-zinc-400" :
                          "bg-amber-500/20 text-amber-400"
                        }`}>
                          {s.source === "internet-archive" ? "archive" : s.source}
                        </span>
                        <div className="min-w-0 flex-1">
                          <a
                            href={s.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-medium text-foreground hover:text-accent transition line-clamp-1"
                          >
                            {s.title}
                          </a>
                          <p className="mt-0.5 text-xs text-muted line-clamp-2">{s.excerpt}</p>
                        </div>
                        <span className="shrink-0 text-[10px] text-muted">{(s.relevanceScore * 100).toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
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
            {/* Toolbar: search, view toggle, filter pill, condense */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                {/* Search bar */}
                <div className="relative flex-1 min-w-[180px]">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search sources…"
                    className="w-full rounded-xl border border-border/70 bg-muted-surface pl-8 pr-3 py-1.5 text-sm text-foreground placeholder:text-muted focus:border-accent/40 focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                {/* View mode toggle */}
                <div className="flex gap-0.5 rounded-xl border border-border/70 bg-muted-surface p-0.5">
                  <button
                    onClick={() => setViewMode("flat")}
                    title="Flat view (newest first)"
                    className={`rounded-lg p-1.5 transition ${viewMode === "flat" ? "bg-background text-foreground shadow-sm" : "text-muted hover:text-foreground"}`}
                  >
                    <LayoutList className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setViewMode("grouped")}
                    title="Group by tag"
                    className={`rounded-lg p-1.5 transition ${viewMode === "grouped" ? "bg-background text-foreground shadow-sm" : "text-muted hover:text-foreground"}`}
                  >
                    <Rows3 className="h-3.5 w-3.5" />
                  </button>
                </div>
                {summarizeResult && (
                  <span className="text-xs text-muted">{summarizeResult}</span>
                )}
                <button
                  onClick={handleSummarize}
                  disabled={summarizing || items.length < 2}
                  title="Compress all research into tag-based summaries for use in briefs and chat"
                  className="flex items-center gap-1.5 rounded-xl border border-border/70 bg-muted-surface px-3 py-1.5 text-xs font-medium text-muted transition hover:border-accent/40 hover:text-accent disabled:opacity-40"
                >
                  {summarizing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                  {summarizing ? "Condensing…" : "Condense knowledge"}
                </button>
              </div>
              {/* Active filters row */}
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-xs text-muted">{items.length} source{items.length === 1 ? "" : "s"} saved</p>
                {filterTag && (
                  <button
                    onClick={() => setFilterTag(null)}
                    className="flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-2.5 py-1 text-xs text-accent hover:bg-accent/20 transition"
                  >
                    {filterTag} <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Knowledge Base panel */}
            {summaries.length > 0 && (
              <div className="glass-panel rounded-3xl overflow-hidden">
                <button
                  onClick={() => setKbExpanded((v) => !v)}
                  className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-muted-surface/60"
                >
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-accent" />
                    <span className="text-sm font-medium">Knowledge Base</span>
                    <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                      {summaries.length} categor{summaries.length === 1 ? "y" : "ies"} · {summaries.reduce((a, s) => a + s.item_count, 0)} items
                    </span>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-muted transition-transform ${kbExpanded ? "rotate-180" : ""}`} />
                </button>
                {kbExpanded && (
                  <div className="border-t border-border/40 px-5 pb-5 pt-4 space-y-4">
                    <p className="text-xs text-muted">Condensed by Claude from your saved research. Injected into every chat and daily brief.</p>
                    {summaries.map((s) => (
                      <div key={s.tag} className="rounded-2xl border border-border/50 bg-muted-surface/60 p-4 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <button
                            onClick={() => { setFilterTag(filterTag === s.tag ? null : s.tag); setKbExpanded(false); }}
                            title={`Filter list to "${s.tag}" items`}
                            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold transition hover:ring-1 hover:ring-accent/50 ${
                              filterTag === s.tag ? "bg-accent text-accent-foreground" : "bg-accent/10 text-accent"
                            }`}
                          >
                            {s.tag}
                          </button>
                          <span className="text-xs text-muted">{s.item_count} item{s.item_count === 1 ? "" : "s"} · updated {new Date(s.updated_at).toLocaleDateString()}</span>
                        </div>
                        <div className="text-sm text-foreground/90 leading-6 whitespace-pre-wrap">{s.summary}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            {(() => {
              const filtered = items.filter((item) => {
                const matchesTag = filterTag ? item.tags?.includes(filterTag) : true;
                const q = searchQuery.trim().toLowerCase();
                const matchesSearch = q
                  ? (item.title ?? "").toLowerCase().includes(q) || (item.summary ?? "").toLowerCase().includes(q)
                  : true;
                return matchesTag && matchesSearch;
              });

              const renderItem = (item: ResearchItem) => {
                const isExpanded = expandedId === item.id;
                const isHttp = item.url.startsWith("http");
                const isImage = item.url.startsWith("image://");
                const isPaste = item.url.startsWith("paste://");
                const isBrief = item.url.startsWith("brief://");
                const sourceTypeLabel = isImage ? "Screenshot" : isPaste ? "Pasted text" : isBrief ? "Daily Brief" : null;
                return (
                  <article key={item.id} className="glass-panel rounded-3xl p-5 space-y-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {isHttp ? (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium leading-snug hover:text-accent hover:underline transition cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {item.title || item.url}
                          </a>
                        ) : (
                          <button
                            className="text-left font-medium leading-snug text-foreground hover:text-foreground/80 transition cursor-pointer w-full"
                            onClick={() => setExpandedId(isExpanded ? null : item.id)}
                          >
                            {item.title || item.url}
                          </button>
                        )}
                        {isHttp && (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-0.5 inline-flex items-center gap-1 text-xs text-muted hover:text-accent"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {item.url.replace(/^https?:\/\//, "").split("/")[0]}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        )}
                        {sourceTypeLabel && (
                          <span className="mt-0.5 block text-xs text-muted/60">{sourceTypeLabel}</span>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          onClick={() => setExpandedId(isExpanded ? null : item.id)}
                          title={isExpanded ? "Collapse" : "Expand"}
                          className="rounded-lg p-1.5 text-muted transition hover:text-foreground"
                        >
                          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                        </button>
                        <span className="text-xs text-muted">
                          {new Date(item.created_at).toLocaleDateString()}
                        </span>
                        {isHttp && (
                          <button
                            onClick={() => handleReanalyze(item)}
                            disabled={reanalyzingId === item.id || !!deletingId}
                            title="Re-analyze with current context"
                            className="rounded-lg p-1.5 text-muted transition hover:text-accent disabled:opacity-30"
                          >
                            {reanalyzingId === item.id
                              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              : <RotateCcw className="h-3.5 w-3.5" />}
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(item.id)}
                          disabled={deletingId === item.id || !!reanalyzingId}
                          title="Delete"
                          className="rounded-lg p-1.5 text-muted transition hover:text-red-400 disabled:opacity-30"
                        >
                          {deletingId === item.id
                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            : <Trash2 className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>

                    {item.summary && (
                      <p className={`text-sm leading-6 text-muted ${isExpanded ? "" : "line-clamp-2"}`}>
                        {item.summary}
                      </p>
                    )}

                    {isExpanded && item.verdict && (
                      <div className="rounded-xl border border-border/70 bg-muted-surface px-4 py-2.5 text-sm">
                        <span className="font-medium">Verdict: </span>
                        <span className="text-muted">{item.verdict}</span>
                      </div>
                    )}

                    {isExpanded && isHttp && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-xl border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/20 transition"
                      >
                        Open article <ExternalLink className="h-3 w-3" />
                      </a>
                    )}

                    {item.tags && item.tags.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Tag className="h-3 w-3 text-muted shrink-0" />
                        {item.tags.map((tag) => (
                          <button
                            key={tag}
                            onClick={() => setFilterTag(filterTag === tag ? null : tag)}
                            className={`cursor-pointer rounded-full border px-2.5 py-0.5 text-xs transition ${
                              tag === "vibe-coding"
                                ? "border-accent/40 bg-accent/10 text-accent hover:ring-1 hover:ring-accent/50"
                                : tag === "competitor"
                                ? "border-orange-500/30 bg-orange-500/10 text-orange-400 hover:ring-1 hover:ring-orange-500/40"
                                : "border-border/70 bg-muted-surface text-muted hover:border-border hover:text-foreground"
                            } ${filterTag === tag ? "ring-1 ring-current" : ""}`}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    )}
                  </article>
                );
              };

              if (viewMode === "grouped") {
                const grouped = new Map<string, ResearchItem[]>();
                const untagged: ResearchItem[] = [];
                for (const item of filtered) {
                  if (!item.tags || item.tags.length === 0) {
                    untagged.push(item);
                  } else {
                    const primary = item.tags[0];
                    if (!grouped.has(primary)) grouped.set(primary, []);
                    grouped.get(primary)!.push(item);
                  }
                }
                if (untagged.length > 0) grouped.set("untagged", untagged);

                if (grouped.size === 0) {
                  return <p className="text-sm text-muted">No sources match your search.</p>;
                }

                return Array.from(grouped.entries()).map(([groupTag, groupItems]) => (
                  <div key={groupTag} className="space-y-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setFilterTag(filterTag === groupTag && groupTag !== "untagged" ? null : groupTag === "untagged" ? null : groupTag)}
                        className={`rounded-full px-3 py-1 text-xs font-semibold transition hover:ring-1 hover:ring-accent/50 ${
                          filterTag === groupTag ? "bg-accent text-accent-foreground" : "bg-accent/10 text-accent"
                        }`}
                      >
                        {groupTag}
                      </button>
                      <span className="text-xs text-muted">{groupItems.length} item{groupItems.length === 1 ? "" : "s"}</span>
                    </div>
                    {groupItems.map(renderItem)}
                  </div>
                ));
              }

              if (filtered.length === 0) {
                return <p className="text-sm text-muted">No sources match your search.</p>;
              }

              return filtered.map(renderItem);
            })()}
          </div>
        )}
      </div>
    </div>
  );
}