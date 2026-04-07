"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Check,
  CircleDot,
  Loader2,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";

type FocusItem = {
  id: string;
  content: string;
  completed: boolean;
  sort_order: number;
  source: string;
  created_at: string;
};

const SOURCE_COLORS: Record<string, string> = {
  folio: "#D4A80E",
  brief: "#3B82F6",
  dream: "#22C55E",
  manual: "#71717A",
};

const SOURCE_LABELS: Record<string, string> = {
  folio: "Folio",
  brief: "Brief",
  dream: "Dream",
  manual: "Manual",
};

export function FocusBoardPanel() {
  const [items, setItems] = useState<FocusItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [populating, setPopulating] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newInput, setNewInput] = useState("");
  const [error, setError] = useState("");

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch("/api/focus-items");
      if (!res.ok) throw new Error("Failed to load");
      const data = await res.json();
      setItems(data);
    } catch {
      setError("Failed to load items");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Auto-populate on first load if board is empty
  useEffect(() => {
    if (!loading && items.length === 0) {
      handlePopulate();
    }
    // Only run once when initial load completes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  const handlePopulate = async () => {
    setPopulating(true);
    setError("");
    try {
      const res = await fetch("/api/focus-items/populate", { method: "POST" });
      if (!res.ok) throw new Error("Populate failed");
      await fetchItems();
    } catch {
      setError("AI populate failed");
    } finally {
      setPopulating(false);
    }
  };

  const handleToggle = async (item: FocusItem) => {
    // Optimistic update
    setItems((prev) =>
      prev.map((i) =>
        i.id === item.id ? { ...i, completed: !i.completed } : i
      )
    );
    const res = await fetch(`/api/focus-items/${item.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed: !item.completed }),
    });
    if (!res.ok) {
      // Revert on failure
      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, completed: item.completed } : i
        )
      );
    }
  };

  const handleDelete = async (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await fetch(`/api/focus-items/${id}`, { method: "DELETE" });
  };

  const handleAdd = async () => {
    const content = newInput.trim();
    if (!content) return;
    if (items.length >= 10) {
      setError("Board full — complete or remove an item first");
      return;
    }
    setAdding(true);
    setError("");
    try {
      const res = await fetch("/api/focus-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, source: "manual" }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to add");
        return;
      }
      setNewInput("");
      await fetchItems();
    } catch {
      setError("Failed to add");
    } finally {
      setAdding(false);
    }
  };

  const count = items.length;
  const countColor =
    count >= 10 ? "text-red-400" : count >= 8 ? "text-amber-400" : "text-muted";

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <div className="flex items-center gap-2">
          <CircleDot className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-semibold tracking-tight">Focus Board</h3>
          <span className={`text-xs font-mono ${countColor}`}>
            {count}/10
          </span>
        </div>
        <button
          onClick={handlePopulate}
          disabled={populating}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-muted transition hover:bg-accent/10 hover:text-accent disabled:opacity-50"
          title="AI refresh — fill empty slots from today's context"
        >
          {populating ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            <Sparkles className="h-3 w-3" />
          )}
          AI Fill
        </button>
      </div>

      {/* Items list */}
      <div className="flex-1 overflow-y-auto py-2">
        {items.length === 0 && !populating && (
          <p className="py-8 text-center text-xs text-muted/60">
            No items yet. Click &quot;AI Fill&quot; or add manually.
          </p>
        )}
        {populating && items.length === 0 && (
          <div className="flex flex-col items-center gap-2 py-8">
            <Loader2 className="h-5 w-5 animate-spin text-accent" />
            <p className="text-xs text-muted">Reading today&apos;s context…</p>
          </div>
        )}
        <ul className="space-y-0.5">
          {items.map((item) => (
            <li
              key={item.id}
              className={`group flex items-start gap-2 rounded-lg px-2 py-1.5 transition hover:bg-card/60 ${
                item.completed ? "opacity-50" : ""
              }`}
            >
              {/* Checkbox */}
              <button
                onClick={() => handleToggle(item)}
                className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition ${
                  item.completed
                    ? "border-accent bg-accent text-accent-foreground"
                    : "border-border hover:border-accent/60"
                }`}
              >
                {item.completed && <Check className="h-3 w-3" />}
              </button>

              {/* Content + source dot */}
              <div className="flex-1 min-w-0">
                <span
                  className={`text-sm leading-snug ${
                    item.completed ? "line-through text-muted/60" : ""
                  }`}
                >
                  {item.content}
                </span>
              </div>

              {/* Source dot */}
              <span
                className="mt-1.5 h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: SOURCE_COLORS[item.source] ?? SOURCE_COLORS.manual }}
                title={SOURCE_LABELS[item.source] ?? "Manual"}
              />

              {/* Delete */}
              <button
                onClick={() => handleDelete(item.id)}
                className="mt-0.5 hidden shrink-0 text-muted/40 transition hover:text-red-400 group-hover:block"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Add input */}
      <div className="border-t border-border/40 pt-2">
        {error && (
          <p className="mb-1.5 text-xs text-red-400">{error}</p>
        )}
        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={newInput}
            onChange={(e) => setNewInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleAdd();
              }
            }}
            placeholder="Add item…"
            className="flex-1 rounded-lg border border-border/40 bg-transparent px-2.5 py-1.5 text-sm placeholder:text-muted/40 focus:border-accent/40 focus:outline-none"
            maxLength={200}
          />
          <button
            onClick={handleAdd}
            disabled={adding || !newInput.trim()}
            className="flex items-center justify-center rounded-lg bg-accent/10 px-2 py-1.5 text-accent transition hover:bg-accent/20 disabled:opacity-40"
          >
            {adding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
