"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Loader2, PauseCircle, Plus, ExternalLink } from "lucide-react";
import { PageFrame } from "@/components/page-frame";

// ── Types ──────────────────────────────────────────────────────────────────────

type Task = {
  id: string;
  title: string;
  description: string | null;
  source_type: string | null;
  source_id: string | null;
  source_title: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

type StatusKey = "open" | "in-progress" | "blocked" | "done" | "canceled";

const STATUS_META: Record<StatusKey, { label: string; color: string }> = {
  "open":       { label: "Open",        color: "bg-accent/10 text-accent" },
  "in-progress":{ label: "In progress", color: "bg-blue-500/10 text-blue-400" },
  "blocked":    { label: "Blocked",     color: "bg-orange-500/10 text-orange-400" },
  "done":       { label: "Done",        color: "bg-emerald-500/10 text-emerald-400" },
  "canceled":   { label: "Canceled",    color: "bg-muted/10 text-muted" },
};

const ACTIVE_STATUSES: StatusKey[] = ["open", "in-progress", "blocked"];
const CLOSED_STATUSES: StatusKey[] = ["done", "canceled"];

// ── Task Card ─────────────────────────────────────────────────────────────────

function TaskCard({
  task,
  onChange,
  onDelete,
}: {
  task: Task;
  onChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const meta = STATUS_META[task.status as StatusKey] ?? STATUS_META["open"];

  async function setStatus(status: string) {
    setSaving(true);
    try {
      await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      onChange(task.id, status);
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    setDeleting(true);
    try {
      await fetch(`/api/tasks/${task.id}`, { method: "DELETE" });
      onDelete(task.id);
    } finally {
      setDeleting(false);
    }
  }

  const busy = saving || deleting;

  return (
    <article className="glass-panel rounded-3xl p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.color}`}>
              {meta.label}
            </span>
            {task.source_type && (
              <span className="rounded-full border border-border/60 bg-muted-surface px-2.5 py-0.5 text-xs text-muted capitalize">
                from {task.source_type}
              </span>
            )}
          </div>
          <h2 className="font-semibold leading-snug">{task.title}</h2>
          {task.description && (
            <p className="mt-1 text-sm text-muted leading-6">{task.description}</p>
          )}
          {task.source_title && task.source_title !== task.title && (
            <p className="mt-1 text-xs text-muted/60 flex items-center gap-1">
              <ExternalLink className="h-3 w-3" />
              {task.source_title}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/40">
        {task.status !== "in-progress" && task.status !== "done" && task.status !== "canceled" && (
          <button
            onClick={() => setStatus("in-progress")}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/40 bg-blue-500/10 px-3 py-1 text-xs font-medium text-blue-400 transition hover:bg-blue-500/20 disabled:opacity-40"
          >
            Start
          </button>
        )}
        {task.status === "in-progress" && (
          <button
            onClick={() => setStatus("blocked")}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-full border border-orange-500/40 bg-orange-500/10 px-3 py-1 text-xs font-medium text-orange-400 transition hover:bg-orange-500/20 disabled:opacity-40"
          >
            <PauseCircle className="h-3 w-3" />
            Blocked
          </button>
        )}
        {task.status !== "done" && task.status !== "canceled" && (
          <button
            onClick={() => setStatus("done")}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 transition hover:bg-emerald-500/20 disabled:opacity-40"
          >
            <CheckCircle className="h-3 w-3" />
            Done
          </button>
        )}
        {task.status !== "canceled" && task.status !== "done" && (
          <button
            onClick={() => setStatus("canceled")}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-full border border-border/70 px-3 py-1 text-xs font-medium text-muted transition hover:border-red-500/40 hover:text-red-400 disabled:opacity-40"
          >
            <XCircle className="h-3 w-3" />
            Cancel
          </button>
        )}
        {(task.status === "done" || task.status === "canceled") && (
          <button
            onClick={remove}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-full border border-border/70 px-3 py-1 text-xs font-medium text-muted transition hover:border-red-500/40 hover:text-red-400 disabled:opacity-40"
          >
            {deleting ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
            Remove
          </button>
        )}
        {busy && !deleting && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted" />}
      </div>
    </article>
  );
}

// ── Add Task Form ──────────────────────────────────────────────────────────────

function AddTaskForm({ onAdd }: { onAdd: (task: Task) => void }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), description: description.trim() || null, source_type: "manual" }),
      });
      const data = await res.json();
      if (data.task) {
        onAdd(data.task);
        setTitle("");
        setDescription("");
        setOpen(false);
      }
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-full border border-border/70 px-4 py-1.5 text-sm text-muted transition hover:border-accent/40 hover:text-foreground"
      >
        <Plus className="h-3.5 w-3.5" />
        Add task
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="glass-panel rounded-3xl p-5 space-y-3">
      <input
        autoFocus
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title"
        className="w-full rounded-xl border border-border/60 bg-muted-surface px-4 py-2 text-sm placeholder:text-muted focus:border-accent/50 focus:outline-none"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)"
        rows={2}
        className="w-full rounded-xl border border-border/60 bg-muted-surface px-4 py-2 text-sm placeholder:text-muted focus:border-accent/50 focus:outline-none resize-none"
      />
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving || !title.trim()}
          className="inline-flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-4 py-1.5 text-xs font-medium text-accent transition hover:bg-accent/20 disabled:opacity-40"
        >
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
          Add
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="inline-flex items-center gap-1.5 rounded-full border border-border/70 px-4 py-1.5 text-xs font-medium text-muted transition hover:text-foreground"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showClosed, setShowClosed] = useState(false);

  useEffect(() => {
    fetch("/api/tasks")
      .then((r) => r.json())
      .then((data) => setTasks(data.tasks ?? []))
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  function updateTask(id: string, status: string) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
  }

  function removeTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  function addTask(task: Task) {
    setTasks((prev) => [task, ...prev]);
  }

  const active = tasks.filter((t) => ACTIVE_STATUSES.includes(t.status as StatusKey));
  const closed = tasks.filter((t) => CLOSED_STATUSES.includes(t.status as StatusKey));

  return (
    <PageFrame
      eyebrow="Tasks"
      title="Turn decisions into execution."
      description="Tasks come from approved opportunities and review queue items, or you can add them manually."
    >
      {loading && (
        <div className="flex items-center justify-center py-20 text-muted">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          Loading tasks…
        </div>
      )}

      {error && (
        <div className="glass-panel rounded-3xl p-6 text-sm text-red-400">
          Failed to load tasks: {error}
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-6">
          <AddTaskForm onAdd={addTask} />

          {active.length === 0 && closed.length === 0 && (
            <div className="glass-panel rounded-3xl p-12 text-center space-y-2">
              <p className="text-2xl">📋</p>
              <p className="font-semibold">No tasks yet.</p>
              <p className="text-sm text-muted">
                Approve an opportunity in the Review Queue to create tasks automatically, or add one manually above.
              </p>
            </div>
          )}

          {active.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted px-1">
                Active — {active.length}
              </h2>
              {active.map((task) => (
                <TaskCard key={task.id} task={task} onChange={updateTask} onDelete={removeTask} />
              ))}
            </section>
          )}

          {closed.length > 0 && (
            <section className="space-y-3">
              <button
                onClick={() => setShowClosed((s) => !s)}
                className="w-full text-left text-xs font-semibold uppercase tracking-[0.12em] text-muted px-1 hover:text-foreground transition"
              >
                {showClosed ? "▾" : "▸"} Closed — {closed.length}
              </button>
              {showClosed && closed.map((task) => (
                <TaskCard key={task.id} task={task} onChange={updateTask} onDelete={removeTask} />
              ))}
            </section>
          )}
        </div>
      )}
    </PageFrame>
  );
}