"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Check,
  CheckSquare,
  ChevronRight,
  CircleDot,
  ExternalLink,
  GripVertical,
  Loader2,
  Plus,
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

type Task = {
  id: string;
  title: string;
  description: string | null;
  source_type: string | null;
  status: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
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

const ACTIVE_STATUSES = ["open", "in-progress", "blocked"];

const STATUS_DOT: Record<string, string> = {
  "in-progress": "bg-amber-400/80",
  blocked: "bg-red-400/80",
};

const TASK_SOURCE_COLOR: Record<string, string> = {
  brief: "#3B82F6",
  research: "#22C55E",
  opportunity: "#A855F7",
  manual: "#71717A",
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
      className="group flex min-w-0 items-start gap-1 rounded px-1 py-0.5 transition-opacity duration-300 hover:bg-card/60"
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
      <span className="min-w-0 flex-1 break-words text-xs leading-snug">
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

/* ── Sub-task row ───────────────────────────────────────────────── */
function SubTaskItem({
  task,
  onDone,
}: {
  task: Task;
  onDone: (id: string) => void;
}) {
  return (
    <li className="flex items-center gap-1.5 py-0.5 pl-5">
      <button
        onClick={() => onDone(task.id)}
        className="flex h-3 w-3 shrink-0 items-center justify-center rounded-sm border border-border/50 transition hover:border-accent/60"
      >
        {task.status === "done" && (
          <Check className="h-2 w-2 text-accent" />
        )}
      </button>
      <span className="min-w-0 flex-1 break-words text-[10px] text-muted/70">{task.title}</span>
    </li>
  );
}

/* ── Task row ───────────────────────────────────────────────────── */
function TaskRow({
  task,
  subTasks,
  onDone,
  onAddSub,
}: {
  task: Task;
  subTasks: Task[];
  onDone: (id: string) => void;
  onAddSub: (parentId: string, title: string) => Promise<void>;
}) {
  const childTasks = subTasks;
  const [expanded, setExpanded] = useState(false);
  const [addingChild, setAddingChild] = useState(false);
  const [childInput, setChildInput] = useState("");
  const childRef = useRef<HTMLInputElement>(null);

  const handleAddSub = async () => {
    const t = childInput.trim();
    if (!t) return;
    await onAddSub(task.id, t);
    setChildInput("");
    setAddingChild(false);
  };

  return (
    <li>
      <div className="group flex min-w-0 items-start gap-1.5 rounded px-1 py-0.5 hover:bg-card/60">
        {/* Expand / add-sub toggle */}
        <button
          onClick={() => {
            if (childTasks.length > 0) {
              setExpanded((v) => !v);
            } else {
              setAddingChild((v) => !v);
              setTimeout(() => childRef.current?.focus(), 50);
            }
          }}
          className="shrink-0 text-muted/30 transition hover:text-muted/60"
        >
          {childTasks.length > 0 ? (
            <ChevronRight
              className={`h-3 w-3 transition-transform ${expanded ? "rotate-90" : ""}`}
            />
          ) : (
            <Plus className="h-3 w-3" />
          )}
        </button>

        {/* Checkbox */}
        <button
          onClick={() => onDone(task.id)}
          className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border border-border transition hover:border-accent/60"
        />

        {/* Source dot */}
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full"
          style={{
            backgroundColor:
              TASK_SOURCE_COLOR[task.source_type ?? "manual"] ??
              TASK_SOURCE_COLOR.manual,
          }}
        />

        {/* Title */}
        <span className="min-w-0 flex-1 break-words text-xs">{task.title}</span>

        {/* Status dot */}
        {STATUS_DOT[task.status] && (
          <span
            className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOT[task.status]}`}
          />
        )}

        {/* Sub-task count badge */}
        {childTasks.length > 0 && (
          <span className="rounded-full bg-muted/10 px-1 py-0.5 text-[9px] text-muted/50">
            {childTasks.length}
          </span>
        )}
      </div>

      {/* Sub-tasks */}
      {expanded && childTasks.length > 0 && (
        <ul>
          {childTasks.map((c) => (
            <SubTaskItem key={c.id} task={c} onDone={onDone} />
          ))}
        </ul>
      )}

      {/* Inline sub-task input */}
      {addingChild && (
        <div className="flex items-center gap-1 py-0.5 pl-5">
          <input
            ref={childRef}
            type="text"
            value={childInput}
            onChange={(e) => setChildInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") { e.preventDefault(); handleAddSub(); }
              if (e.key === "Escape") { setAddingChild(false); setChildInput(""); }
            }}
            placeholder="Sub-task…"
            className="flex-1 rounded border border-border/30 bg-transparent px-1.5 py-0.5 text-[10px] placeholder:text-muted/40 focus:border-accent/40 focus:outline-none"
          />
        </div>
      )}
    </li>
  );
}

/* ── Panel ───────────────────────────────────────────────────────── */
export function FocusBoardPanel() {
  // ── Focus items state ──
  const [items, setItems] = useState<FocusItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [populating, setPopulating] = useState(false);
  const [newInput, setNewInput] = useState("");
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Tasks state ──
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const taskInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // ── Fetch focus items ──
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

  // ── Fetch tasks ──
  const fetchTasks = useCallback(async () => {
    try {
      const res = await fetch("/api/tasks");
      if (!res.ok) throw new Error("Failed to load tasks");
      const data = await res.json();
      const active = (data.tasks as Task[]).filter((t) =>
        ACTIVE_STATUSES.includes(t.status)
      );
      setTasks(active);
    } catch {
      // silent — tasks are supplementary
    } finally {
      setLoadingTasks(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
    fetchTasks();
  }, [fetchItems, fetchTasks]);

  // Auto-populate on first load if board is empty
  useEffect(() => {
    if (!loading && items.length === 0) {
      handlePopulate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // ── Derived task state ──
  const topLevel = tasks.filter((t) => !t.parent_id);
  const childrenMap: Record<string, Task[]> = {};
  tasks.forEach((t) => {
    if (t.parent_id) {
      childrenMap[t.parent_id] = childrenMap[t.parent_id] ?? [];
      childrenMap[t.parent_id].push(t);
    }
  });

  // ── Handlers ──
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

  const markDone = async (id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "done" }),
    });
  };

  const addSub = async (parentId: string, title: string) => {
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, parent_id: parentId }),
    });
    await fetchTasks();
  };

  const VISIBLE_COUNT = 10;
  const visibleItems = items.slice(0, VISIBLE_COUNT);
  const hiddenCount = Math.max(0, items.length - VISIBLE_COUNT);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = visibleItems.findIndex((i) => i.id === active.id);
    const newIndex = visibleItems.findIndex((i) => i.id === over.id);
    const reordered = arrayMove(visibleItems, oldIndex, newIndex);
    setItems([...reordered, ...items.slice(VISIBLE_COUNT)]);

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

  const handleAddTask = async () => {
    const title = newTitle.trim();
    if (!title) return;
    try {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      setNewTitle("");
      await fetchTasks();
    } catch {
      // silent
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-4 w-4 animate-spin text-muted" />
      </div>
    );
  }

  return (
    <div className="flex h-full min-w-0 flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between pb-1.5">
        <div className="flex items-center gap-1.5">
          <CircleDot className="h-3.5 w-3.5 text-accent" />
          <h3 className="text-xs font-semibold tracking-tight">Focus Board</h3>
          <span className="text-[10px] font-mono text-muted/60">
            {items.length + topLevel.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
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
          <Link
            href="/tasks"
            className="flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] text-muted transition hover:bg-accent/10 hover:text-accent"
          >
            All Tasks
            <ExternalLink className="h-2.5 w-2.5" />
          </Link>
        </div>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto">
        {/* ── Today's Focus ── */}
        <p className="mb-1 text-[9px] font-semibold uppercase tracking-widest text-muted/40">
          Today&apos;s Focus
        </p>
        {items.length === 0 && !populating && (
          <p className="py-2 text-center text-[10px] text-muted/50">
            Empty. Click AI Fill or type below.
          </p>
        )}
        {populating && items.length === 0 && (
          <div className="flex items-center justify-center gap-2 py-2">
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
            items={visibleItems.map((i) => i.id)}
            strategy={verticalListSortingStrategy}
          >
            <ul>
              {visibleItems.map((item) => (
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
        {hiddenCount > 0 && (
          <p className="mt-1 text-center text-[10px] text-muted/40">
            +{hiddenCount} more · check off items to surface them
          </p>
        )}

        {/* ── Tasks ── */}
        <p className="mb-1 mt-3 text-[9px] font-semibold uppercase tracking-widest text-muted/40">
          Tasks
        </p>
        {loadingTasks ? (
          <div className="flex items-center gap-1.5 py-2">
            <Loader2 className="h-3 w-3 animate-spin text-muted/40" />
            <span className="text-[10px] text-muted/40">Loading…</span>
          </div>
        ) : topLevel.length === 0 ? (
          <p className="py-2 text-center text-[10px] text-muted/50">
            No active tasks. Add one below.
          </p>
        ) : (
          <ul className="space-y-0.5">
            {topLevel.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                subTasks={childrenMap[task.id] ?? []}
                onDone={markDone}
                onAddSub={addSub}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Add inputs */}
      <div className="flex flex-col gap-1 pt-1.5">
        {error && (
          <p className="text-[10px] text-red-400">{error}</p>
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
          placeholder="Add focus item…"
          className="w-full rounded border border-border/30 bg-transparent px-2 py-1 text-xs placeholder:text-muted/40 focus:border-accent/40 focus:outline-none"
          maxLength={200}
        />
        <div className="flex gap-1">
          <input
            ref={taskInputRef}
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleAddTask();
              }
            }}
            placeholder="Add task…"
            className="flex-1 rounded border border-border/30 bg-transparent px-2 py-1 text-xs placeholder:text-muted/40 focus:border-accent/40 focus:outline-none"
            maxLength={200}
          />
          <button
            onClick={handleAddTask}
            className="rounded border border-border/30 px-2 py-1 text-muted transition hover:border-accent/40 hover:text-accent"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
