"use client";

import { useEffect, useState, useCallback } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

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
      setJobs(data.jobs ?? []);
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
            // Only show top-level jobs in main list
            if (!newJob.parent_job_id) {
              setJobs((prev) => [newJob, ...prev]);
            }
          } else if (payload.eventType === "UPDATE") {
            setJobs((prev) =>
              prev.map((j) =>
                j.id === (payload.new as Job).id ? (payload.new as Job) : j
              )
            );
          } else if (payload.eventType === "DELETE") {
            setJobs((prev) =>
              prev.filter((j) => j.id !== (payload.old as Job).id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  }, [fetchJobs]);

  return { jobs, loading, refetch: fetchJobs };
}
