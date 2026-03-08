"use client";

import { useEffect, useState } from "react";
import { ArrowUp, ExternalLink, Loader2, Tag } from "lucide-react";

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
  const [url, setUrl] = useState("");
  const [ingesting, setIngesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);
      setItems((prev) => [data.item, ...prev]);
      setUrl("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setIngesting(false);
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

        {/* Ingest form */}
        <form onSubmit={handleIngest} className="glass-panel rounded-3xl p-5">
          <label className="mb-3 block text-xs font-semibold uppercase tracking-[0.12em] text-muted">
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
              {ingesting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowUp className="h-4 w-4" />
              )}
            </button>
          </div>
          {ingesting && (
            <p className="mt-2 text-xs text-muted animate-pulse">Fetching and analyzing… this takes ~10 seconds.</p>
          )}
          {error && (
            <p className="mt-2 text-xs text-red-400">{error}</p>
          )}
        </form>

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