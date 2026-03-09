"use client";

import { useEffect, useState } from "react";
import { Brain, Loader2, Plus, Trash2 } from "lucide-react";

type FounderNote = {
  id: string;
  content: string;
  category: string;
  source: string;
  created_at: string;
};

const CATEGORIES = ["general", "scott", "anna", "business", "preference", "decision"];

export function FounderMemoryPanel() {
  const [notes, setNotes] = useState<FounderNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("general");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/founder-notes")
      .then((r) => r.json())
      .then((d) => setNotes(d.notes ?? []))
      .catch(() => setNotes([]))
      .finally(() => setLoading(false));
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/founder-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: content.trim(), category }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);
      setNotes((prev) => [data.note, ...prev]);
      setContent("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    setNotes((prev) => prev.filter((n) => n.id !== id));
    await fetch("/api/founder-notes", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    }).catch(() => null);
  }

  const byCategory = CATEGORIES.filter((c) => notes.some((n) => n.category === c));

  return (
    <section className="glass-panel rounded-3xl p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-accent/15 text-accent">
          <Brain className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-lg font-semibold">Founder Memory</h2>
          <p className="text-xs text-muted">Everything saved here goes into every chat. These are ground truths the brain always knows.</p>
        </div>
      </div>

      {/* Add form */}
      <form onSubmit={handleAdd} className="space-y-3 rounded-2xl border border-border/70 bg-muted-surface p-4">
        <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-muted">Add a fact</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={2}
          placeholder={`e.g. "Scott hates cluttered sidebars" or "Anna wants the store to feel like Powell's Books"`}
          required
          className="w-full resize-none rounded-xl border border-border/70 bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent/40 focus:outline-none"
        />
        <div className="flex items-center gap-3">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-xl border border-border/70 bg-background px-3 py-2 text-xs text-foreground focus:border-accent/40 focus:outline-none"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button
            type="submit"
            disabled={!content.trim() || saving}
            className="ml-auto flex items-center gap-2 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-accent-foreground shadow shadow-accent/25 transition hover:opacity-90 disabled:opacity-40"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
            Save
          </button>
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
        <p className="text-xs text-muted">Or type <span className="font-mono">/remember [fact]</span> in any chat conversation.</p>
      </form>

      {/* Notes list */}
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-muted">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading…
        </div>
      ) : notes.length === 0 ? (
        <p className="text-sm text-muted">Nothing saved yet. Add the first fact about you and Anna — the more you add, the smarter every conversation gets.</p>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-muted">{notes.length} fact{notes.length === 1 ? "" : "s"} in memory</p>
          {(byCategory.length > 0 ? byCategory : ["general"]).map((cat) => {
            const catNotes = notes.filter((n) => n.category === cat);
            if (catNotes.length === 0) return null;
            return (
              <div key={cat}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted">{cat}</p>
                <div className="space-y-2">
                  {catNotes.map((note) => (
                    <div key={note.id} className="group flex items-start justify-between gap-3 rounded-2xl border border-border/70 bg-muted-surface px-4 py-3">
                      <p className="text-sm leading-6">{note.content}</p>
                      <div className="flex shrink-0 items-center gap-2">
                        {note.source === "chat" && (
                          <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">chat</span>
                        )}
                        <button
                          onClick={() => handleDelete(note.id)}
                          className="opacity-0 group-hover:opacity-100 transition text-muted hover:text-red-400"
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
