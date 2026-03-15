"use client";

import { useEffect, useState, useCallback } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { logEvent } from "@/lib/debug-log";

export type Job = {
  id: string;
  created_at: string;
  updated_at: string;
  type: "curriculum_factory" | "research_batch" | "council_session";
  label: string;
  status: "queued" | "running" | "completed" | "failed" | "cancelled";
  progress: number;
  progress_message: string | null;
  input_payload: Record<string, unknown>;
  output: Record<string, unknown> | null;
  error: string | null;
  started_at: string | null;
  completed_at: string | null;
  worker_id: string | null;
  parent_job_id: string | null;
};

export function useJobsRealtime() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchJobs = useCallback(async () => {
    const res = await fetch("/api/jobs");
    if (res.ok) {
      const data = await res.json();
      const jobList = data.jobs ?? [];
      setJobs(jobList);
      logEvent("api", `Jobs loaded: ${jobList.length} jobs`, {
        running: jobList.filter((j: Job) => j.status === "running").length,
        queued: jobList.filter((j: Job) => j.status === "queued").length,
        completed: jobList.filter((j: Job) => j.status === "completed").length,
      });
    } else {
      logEvent("error", `Failed to load jobs: HTTP ${res.status}`);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchJobs();

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const channel = supabase
      .channel("jobs-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "jobs" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newJob = payload.new as Job;
            logEvent("realtime", `Job created: ${newJob.label}`, {
              id: newJob.id.slice(0, 8),
              type: newJob.type,
              status: newJob.status,
            });
            // Only show top-level jobs in main list
            if (!newJob.parent_job_id) {
              setJobs((prev) => [newJob, ...prev]);
            }
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as Job;
            logEvent("realtime", `Job ${updated.status}: ${updated.label} [${updated.progress}%]`, {
              id: updated.id.slice(0, 8),
              status: updated.status,
              progress: updated.progress,
              message: updated.progress_message,
            });
            setJobs((prev) =>
              prev.map((j) =>
                j.id === updated.id ? updated : j
              )
            );
          } else if (payload.eventType === "DELETE") {
            logEvent("realtime", "Job deleted", { id: (payload.old as Job).id?.slice(0, 8) });
            setJobs((prev) =>
              prev.filter((j) => j.id !== (payload.old as Job).id)
            );
          }
        }
      )
      .subscribe((status) => {
        logEvent("realtime", `Jobs channel: ${status}`);
      });

    return () => {
      logEvent("realtime", "Jobs channel disconnected");
      supabase?.removeChannel(channel);
    };
  }, [fetchJobs]);

  return { jobs, loading, refetch: fetchJobs };
}
