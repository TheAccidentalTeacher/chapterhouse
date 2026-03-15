"use client";

import { useState, useEffect } from "react";
import { useJobsRealtime, type Job } from "@/hooks/use-jobs-realtime";
import { JobDetailDrawer } from "./job-detail-drawer";
import { formatDistanceToNow } from "date-fns";
import { logEvent } from "@/lib/debug-log";

const STATUS_STYLES: Record<Job["status"], string> = {
  queued: "bg-zinc-800 text-zinc-400",
  running: "bg-blue-900/60 text-blue-300 animate-pulse",
  completed: "bg-green-900/60 text-green-300",
  failed: "bg-red-900/60 text-red-300",
  cancelled: "bg-zinc-800 text-zinc-500",
};

const TYPE_LABELS: Record<Job["type"], string> = {
  curriculum_factory: "Curriculum",
  research_batch: "Research",
  council_session: "Council",
};

function ProgressBar({ progress, status }: { progress: number; status: Job["status"] }) {
  const color =
    status === "completed" ? "bg-green-500" :
    status === "failed" ? "bg-red-500" :
    status === "cancelled" ? "bg-zinc-600" :
    "bg-blue-500";

  return (
    <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-1">
      <div
        className={`h-1.5 rounded-full transition-all duration-500 ${color}`}
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

function JobRow({ job, onClick }: { job: Job; onClick: (job: Job) => void }) {
  return (
    <button
      onClick={() => onClick(job)}
      className="w-full text-left px-4 py-3 hover:bg-zinc-800/60 border-b border-zinc-800 transition-colors group"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-zinc-100 truncate">{job.label}</span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400">
              {TYPE_LABELS[job.type]}
            </span>
          </div>
          {job.progress_message && job.status === "running" && (
            <p className="text-xs text-zinc-500 mt-0.5 truncate">{job.progress_message}</p>
          )}
          {job.status === "failed" && job.error && (
            <p className="text-xs text-red-400 mt-0.5 truncate">{job.error}</p>
          )}
          <ProgressBar progress={job.progress} status={job.status} />
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[job.status]}`}>
            {job.status}
          </span>
          <span className="text-xs text-zinc-600">
            {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}
          </span>
        </div>
      </div>
    </button>
  );
}

export function JobsDashboard() {
  const { jobs, loading } = useJobsRealtime();
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  // Auto-open job from URL highlight param
  useEffect(() => {
    if (jobs.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const highlightId = params.get("highlight");
    if (highlightId && !selectedJob) {
      const job = jobs.find((j) => j.id === highlightId);
      if (job) {
        setSelectedJob(job);
        logEvent("info", `Auto-opened job: ${job.label}`);
      }
    }
  }, [jobs, selectedJob]);

  // Keep selected job synced with realtime updates
  useEffect(() => {
    if (!selectedJob) return;
    const updated = jobs.find((j) => j.id === selectedJob.id);
    if (updated && updated.updated_at !== selectedJob.updated_at) {
      setSelectedJob(updated);
    }
  }, [jobs, selectedJob]);

  const handleSelectJob = (job: Job) => {
    logEvent("click", `Opened job: ${job.label}`, { id: job.id.slice(0, 8), status: job.status });
    setSelectedJob(job);
  };

  const running = jobs.filter((j) => j.status === "running");
  const queued = jobs.filter((j) => j.status === "queued");
  const done = jobs.filter((j) => j.status === "completed" || j.status === "failed" || j.status === "cancelled");

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 text-zinc-500 text-sm">
        Loading jobs...
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-zinc-500 gap-3">
        <span className="text-4xl">⚙️</span>
        <p className="text-sm">No jobs yet. Fire one from the Curriculum Factory.</p>
      </div>
    );
  }

  const Section = ({ title, items }: { title: string; items: Job[] }) =>
    items.length > 0 ? (
      <div className="mb-6">
        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider px-4 py-2">
          {title} ({items.length})
        </h3>
        <div className="border border-zinc-800 rounded-lg overflow-hidden">
          {items.map((job) => (
            <JobRow key={job.id} job={job} onClick={handleSelectJob} />
          ))}
        </div>
      </div>
    ) : null;

  return (
    <>
      <Section title="Running" items={running} />
      <Section title="Queued" items={queued} />
      <Section title="Complete" items={done} />

      <JobDetailDrawer
        job={selectedJob}
        onClose={() => setSelectedJob(null)}
      />
    </>
  );
}
