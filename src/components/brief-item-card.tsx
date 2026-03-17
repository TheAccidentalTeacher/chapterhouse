"use client";

import { useState } from "react";
import { BookOpen, CheckCircle2, ClipboardList, Loader2 } from "lucide-react";
import { logEvent, loggedFetch } from "@/lib/debug-log";

type BriefItem = {
  headline: string;
  whyItMatters: string;
  score: string;
  sources: number;
  track_impacts?: { ncho: number; somersschool: number; biblesaas: number };
  collision_note?: string;
};

function TrackBadge({ label, score }: { label: string; score: number }) {
  if (score === 0) return null;
  const styles = [
    "",
    "border-border/70 text-muted/70",
    "border-blue-500/40 bg-blue-500/10 text-blue-400",
    "border-emerald-500/40 bg-emerald-500/15 text-emerald-300 font-semibold",
  ];
  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs ${styles[score] ?? styles[1]}`}>
      {label} {"●".repeat(score)}
    </span>
  );
}

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
  const [taskError, setTaskError] = useState<string | null>(null);

  async function convertToTask() {
    logEvent("click", `Convert brief item to task: "${item.headline}"`);
    setTaskState("loading");
    setTaskError(null);
    try {
      const res = await loggedFetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: item.headline,
          description: item.whyItMatters,
          source_type: "brief",
          source_title: sectionTitle,
        }),
      }, "Create task from brief");
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }
      logEvent("success", `Brief item converted to task: "${item.headline}"`);
      setTaskState("done");
    } catch (e) {
      setTaskState("error");
      setTaskError(e instanceof Error ? e.message : String(e));
      logEvent("error", `Create task failed: "${item.headline}"`, String(e));
    }
  }

  async function sendToReview() {
    logEvent("click", `Send to review queue: "${item.headline}"`);
    setReviewState("loading");
    try {
      const res = await loggedFetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          briefItem: true,
          title: item.headline,
          summary: item.whyItMatters,
        }),
      }, "Send brief item to review");
      if (!res.ok) throw new Error((await res.json()).error);
      logEvent("success", `Brief item sent to review: "${item.headline}"`);
      setReviewState("done");
    } catch (e) {
      setReviewState("error");
      logEvent("error", `Send to review failed: "${item.headline}"`, String(e));
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
      {item.collision_note ? (
        <div className="mt-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-300">
          <span className="font-semibold">⚡ Collision — </span>{item.collision_note}
        </div>
      ) : null}
      {item.track_impacts ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          <TrackBadge label="NCHO" score={item.track_impacts.ncho} />
          <TrackBadge label="SomersSchool" score={item.track_impacts.somersschool} />
          <TrackBadge label="BibleSaaS" score={item.track_impacts.biblesaas} />
        </div>
      ) : null}
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
        {taskState === "error" && taskError && (
          <span className="w-full text-xs text-red-400/70">{taskError}</span>
        )}

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
