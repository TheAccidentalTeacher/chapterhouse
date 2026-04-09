"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Check,
  CircleDot,
  GripVertical,
  Loader2,
  Sparkles,
  X,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

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

/* ── Sortable row ────────────────────────────────────────────────── */
function SortableItem({
  item,
  onArchive,
  onDelete,
}: {
  item: FocusItem;
  onArchive: (item: FocusItem) => void;
  onDelete: (id: string) => void;
}) {
  const [fading, setFading] = useState(false);
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : fading ? 0 : 1,
  };

  const handleCheck = () => {
    setFading(true);
    setTimeout(() => onArchive(item), 400);
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="group flex items-center gap-1 rounded px-1 py-0.5 transition-opacity duration-300 hover:bg-card/60"
    >
      {/* Drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="shrink-0 cursor-grab touch-none text-muted/30 hover:text-muted/60 active:cursor-grabbing"
        tabIndex={-1}
      >
        <GripVertical className="h-3 w-3" />
      </button>

      {/* Checkbox */}
      <button
        onClick={handleCheck}
        className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border border-border transition hover:border-accent/60"
      >
        {fading && <Check className="h-2.5 w-2.5 text-accent" />}
      </button>

      {/* Source dot */}
      <span
        className="h-1.5 w-1.5 shrink-0 rounded-full"
        style={{
          backgroundColor:
            SOURCE_COLORS[item.source] ?? SOURCE_COLORS.manual,
        }}
        title={SOURCE_LABELS[item.source] ?? "Manual"}
      />

      {/* Content */}
      <span className="flex-1 truncate text-xs leading-tight">
        {item.content}
      </span>

      {/* Delete */}
      <button
        onClick={() => onDelete(item.id)}
        className="shrink-0 text-muted/20 opacity-0 transition hover:text-red-400 group-hover:opacity-100"
      >
        <X className="h-3 w-3" />
      </button>
    </li>
  );
}

/* ── Panel ───────────────────────────────────────────────────────── */
export function FocusBoardPanel() {
  const [items, setItems] = useState<FocusItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [populating, setPopulating] = useState(false);
  const [newInput, setNewInput] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  const handleArchive = async (item: FocusItem) => {
    setItems((prev) => prev.filter((i) => i.id !== item.id));
    await fetch(`/api/focus-items/${item.id}`, { method: "DELETE" });
  };

  const handleDelete = async (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
    await fetch(`/api/focus-items/${id}`, { method: "DELETE" });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);
    setItems(reordered);

    // Persist new sort orders
    await Promise.all(
      reordered.map((item, idx) =>
        fetch(`/api/focus-items/${item.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sort_order: idx }),
        })
      )
    );
  };

  const handleAdd = async () => {
    const content = newInput.trim();
    if (!content) return;
    if (items.length >= 10) {
      setError("Full — check off or remove an item first");
      return;
    }
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
    }
  };

  const count = items.length;
  const countColor =
    count >= 10
      ? "text-red-400"
      : count >= 8
        ? "text-amber-400"
        : "text-muted/60";

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-4 w-4 animate-spin text-muted" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-1.5">
        <div className="flex items-center gap-1.5">
          <CircleDot className="h-3.5 w-3.5 text-accent" />
          <h3 className="text-xs font-semibold tracking-tight">Focus Board</h3>
          <span className={`text-[10px] font-mono ${countColor}`}>
            {count}/10
          </span>
        </div>
        <button
          onClick={handlePopulate}
          disabled={populating}
          className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-muted transition hover:bg-accent/10 hover:text-accent disabled:opacity-50"
          title="AI refresh — fill empty slots from today's context"
        >
          {populating ? (
            <Loader2 className="h-2.5 w-2.5 animate-spin" />
          ) : (
            <Sparkles className="h-2.5 w-2.5" />
          )}
          AI Fill
        </button>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto">
        {items.length === 0 && !populating && (
          <p className="py-4 text-center text-[10px] text-muted/50">
            Empty. Click AI Fill or type below.
          </p>
        )}
        {populating && items.length === 0 && (
          <div className="flex items-center justify-center gap-2 py-4">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-accent" />
            <span className="text-[10px] text-muted">Reading context…</span>
          </div>
        )}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={items.map((i) => i.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul>
              {items.map((item) => (
                <SortableItem
                  key={item.id}
                  item={item}
                  onArchive={handleArchive}
                  onDelete={handleDelete}
                />
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      </div>

      {/* Add input */}
      <div className="pt-1">
        {error && (
          <p className="mb-1 text-[10px] text-red-400">{error}</p>
        )}
        <input
          ref={inputRef}
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
          className="w-full rounded border border-border/30 bg-transparent px-2 py-1 text-xs placeholder:text-muted/40 focus:border-accent/40 focus:outline-none"
          maxLength={200}
        />
      </div>
    </div>
  );
}
