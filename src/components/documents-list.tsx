"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, FileText, Search } from "lucide-react";

type DocFile = {
  slug: string;
  title: string;
  preview: string;
  content: string;
  size: number;
};

export function DocumentsList({ docs, initialQuery = "" }: { docs: DocFile[]; initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = docs.filter(
    (d) =>
      d.title.toLowerCase().includes(query.toLowerCase()) ||
      d.preview.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="space-y-5">
      {/* Search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search documents…"
          className="w-full rounded-2xl border border-border/70 bg-muted-surface py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted focus:border-accent/40 focus:outline-none"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted">No documents match &quot;{query}&quot;</p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((doc) => {
            const isOpen = expanded === doc.slug;
            return (
              <article
                key={doc.slug}
                className={`glass-panel rounded-3xl transition-all ${isOpen ? "md:col-span-2 xl:col-span-3" : ""}`}
              >
                <button
                  className="flex w-full items-start gap-4 p-5 text-left"
                  onClick={() => setExpanded(isOpen ? null : doc.slug)}
                >
                  <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-muted-surface text-muted">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-medium leading-snug">{doc.title}</h2>
                    <p className="mt-1 text-xs text-muted line-clamp-2">{doc.preview}</p>
                    <p className="mt-2 text-xs text-muted/50">{doc.slug} · {Math.round(doc.size / 1024)}KB</p>
                  </div>
                  <div className="shrink-0 text-muted mt-1">
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-border/70 px-5 pb-5 pt-4">
                    <pre className="max-h-[60vh] overflow-y-auto whitespace-pre-wrap break-words font-sans text-xs leading-6 text-muted">
                      {doc.content}
                    </pre>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
