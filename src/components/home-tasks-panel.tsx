"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Check,
  CheckSquare,
  ChevronRight,
  ExternalLink,
  Loader2,
  Plus,
} from "lucide-react";
import Link from "next/link";

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

const ACTIVE_STATUSES = ["open", "in-progress", "blocked"];

/* ── Sub-task row ────────────────────────────────────────────────── */
function SubTaskItem({
  task,
  onDone,
}: {
  task: Task;
  onDone: (id: string) => void;
}) {
  const [checking, setChecking] = useState(false);

  const handleCheck = async () => {
    setChecking(true);
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "done" }),
    });
    onDone(task.id);
  };

  return (
    <li className="flex items-center gap-1.5 py-0.5 pl-6">
      <button
        onClick={handleCheck}
        disabled={checking}
        className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border border-border/50 transition hover:border-accent/60"
      >
        {checking && <Check className="h-2.5 w-2.5 text-accent" />}
      </button>
      <span className="truncate text-[11px] text-muted/70">{task.title}</span>
    </li>
  );
}

/* ── Top-level task row ──────────────────────────────────────────── */
function TaskRow({
  task,
  subtasks,
  onDone,
  onSubDone,
}: {
  task: Task;
  subtasks: Task[];
  onDone: (id: string) => void;
  onSubDone: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [checking, setChecking] = useState(false);

  const activeSubtasks = subtasks.filter((s) =>
    ACTIVE_STATUSES.includes(s.status)
  );

  const handleCheck = async () => {
    setChecking(true);
    await fetch(`/api/tasks/${task.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "done" }),
    });
    onDone(task.id);
  };

  return (
    <li className="group">
      <div className="flex items-center gap-1.5 rounded px-1 py-0.5 hover:bg-card/60">
        {/* Expand chevron — only shown when sub-tasks exist */}
        {activeSubtasks.length > 0 ? (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex h-3.5 w-3.5 shrink-0 items-center justify-center text-muted/40 transition hover:text-muted"
          >
            <ChevronRight
              className={`h-3 w-3 transition-transform ${expanded ? "rotate-90" : ""}`}
            />
          </button>
        ) : (
          <span className="w-3.5 shrink-0" />
        )}

        {/* Checkbox */}
        <button
          onClick={handleCheck}
          disabled={checking}
          className="flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border border-border transition hover:border-accent/60"
        >
          {checking && <Check className="h-2.5 w-2.5 text-accent" />}
        </button>

        {/* Title */}
        <span className="flex-1 truncate text-xs leading-tight">
          {task.title}
        </span>

        {/* Status indicators */}
        {task.status === "in-progress" && (
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400/70" title="In progress" />
        )}
        {task.status === "blocked" && (
          <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-400/70" title="Blocked" />
        )}

        {/* Sub-task count */}
        {activeSubtasks.length > 0 && (
          <span className="text-[10px] text-muted/50">
            {activeSubtasks.length}
          </span>
        )}
      </div>

      {/* Sub-tasks */}
      {expanded && activeSubtasks.length > 0 && (
        <ul className="pb-0.5">
          {activeSubtasks.map((s) => (
            <SubTaskItem key={s.id} task={s} onDone={onSubDone} />
          ))}
        </ul>
      )}
    </li>
  );
}

/* ── Panel ───────────────────────────────────────────────────────── */
export function HomeTasksPanel() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchTasks = useCallback(async () => {
    const res = await fetch("/api/tasks");
    if (res.ok) {
      const data = await res.json();
      setTasks(data.tasks ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Derived state
  const topLevel = tasks.filter(
    (t) => t.parent_id === null && ACTIVE_STATUSES.includes(t.status)
  );
  const childrenMap = tasks
    .filter((t) => t.parent_id !== null)
    .reduce<Record<string, Task[]>>((acc, t) => {
      acc[t.parent_id!] = [...(acc[t.parent_id!] ?? []), t];
      return acc;
    }, {});

  const markDone = (id: string) =>
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "done" } : t))
    );

  const handleAdd = async () => {
    const title = newTitle.trim();
    if (!title) return;
    setAdding(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
      if (res.ok) {
        const data = await res.json();
        setTasks((prev) => [data.task, ...prev]);
        setNewTitle("");
      }
    } finally {
      setAdding(false);
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
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-1.5">
        <div className="flex items-center gap-1.5">
          <CheckSquare className="h-3.5 w-3.5 text-accent" />
          <h3 className="text-xs font-semibold tracking-tight">Tasks</h3>
          <span className="text-[10px] font-mono text-muted/60">
            {topLevel.length}
          </span>
        </div>
        <Link
          href="/tasks"
          className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-muted transition hover:bg-accent/10 hover:text-accent"
        >
          <ExternalLink className="h-2.5 w-2.5" />
          All tasks
        </Link>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto">
        {topLevel.length === 0 ? (
          <p className="py-4 text-center text-[10px] text-muted/50">
            No active tasks. Add one below.
          </p>
        ) : (
          <ul>
            {topLevel.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                subtasks={childrenMap[task.id] ?? []}
                onDone={markDone}
                onSubDone={markDone}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Add task input */}
      <div className="pt-1">
        <div className="flex items-center gap-1">
          <input
            ref={inputRef}
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleAdd();
              }
            }}
            placeholder="Add task…"
            className="flex-1 rounded border border-border/30 bg-transparent px-2 py-1 text-xs placeholder:text-muted/40 focus:border-accent/40 focus:outline-none"
            maxLength={200}
          />
          <button
            onClick={handleAdd}
            disabled={adding || !newTitle.trim()}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-border/30 text-muted/60 transition hover:border-accent/40 hover:text-accent disabled:opacity-30"
          >
            {adding ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Plus className="h-3 w-3" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
