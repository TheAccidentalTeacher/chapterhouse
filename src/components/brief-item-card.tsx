"use client";

import { useState } from "react";
import { BookOpen, CheckCircle2, ClipboardList, Loader2 } from "lucide-react";

type BriefItem = {
  headline: string;
  whyItMatters: string;
  score: string;
  sources: number;
};

type ActionState = "idle" | "loading" | "done" | "error";

export function BriefItemCard({
  item,
  sectionTitle,
}: {
  item: BriefItem;
  sectionTitle: string;
}) {
  const [taskState, setTaskState] = useState<ActionState>("idle");
  const [reviewState, setReviewState] = useState<ActionState>("idle");

  async function convertToTask() {
    setTaskState("loading");
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: item.headline,
          description: item.whyItMatters,
          source_type: "brief",
          source_title: sectionTitle,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setTaskState("done");
    } catch {
      setTaskState("error");
    }
  }

  async function sendToReview() {
    setReviewState("loading");
    try {
      const res = await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          briefItem: true,
          title: item.headline,
          summary: item.whyItMatters,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setReviewState("done");
    } catch {
      setReviewState("error");
    }
  }

  return (
    <article className="rounded-2xl border border-border/70 bg-muted-surface p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-medium text-balance">{item.headline}</h3>
        <span className="rounded-full bg-background/80 px-2.5 py-1 text-xs font-semibold text-muted">
          {item.score}
        </span>
      </div>
      <p className="mt-2 text-sm leading-6 text-muted">{item.whyItMatters}</p>
      <div className="mt-4 flex flex-wrap gap-2 text-xs">
        <span className="rounded-full border border-border/70 px-2.5 py-1 text-muted">
          {item.sources} source{item.sources === 1 ? "" : "s"}
        </span>

        <button
          onClick={convertToTask}
          disabled={taskState !== "idle"}
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 transition disabled:cursor-default ${
            taskState === "done"
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
              : taskState === "error"
              ? "border-red-500/40 text-red-400"
              : "border-border/70 text-muted hover:border-accent/40 hover:text-foreground"
          }`}
        >
          {taskState === "loading" ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : taskState === "done" ? (
            <CheckCircle2 className="h-3 w-3" />
          ) : (
            <ClipboardList className="h-3 w-3" />
          )}
          {taskState === "done"
            ? "Added to tasks"
            : taskState === "error"
            ? "Failed — retry"
            : "Convert to task"}
        </button>

        <button
          onClick={sendToReview}
          disabled={reviewState !== "idle"}
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 transition disabled:cursor-default ${
            reviewState === "done"
              ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
              : reviewState === "error"
              ? "border-red-500/40 text-red-400"
              : "border-border/70 text-muted hover:border-accent/40 hover:text-foreground"
          }`}
        >
          {reviewState === "loading" ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : reviewState === "done" ? (
            <CheckCircle2 className="h-3 w-3" />
          ) : (
            <BookOpen className="h-3 w-3" />
          )}
          {reviewState === "done"
            ? "Sent to review"
            : reviewState === "error"
            ? "Failed — retry"
            : "Send to review"}
        </button>
      </div>
    </article>
  );
}
