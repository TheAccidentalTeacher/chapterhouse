"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Users } from "lucide-react";
import { CouncilSessionForm } from "@/components/council-session-form";
import { CouncilChamberViewer } from "@/components/council-chamber-viewer";
import { type Job } from "@/hooks/use-jobs-realtime";
import { getSupabaseBrowserClient } from "@/lib/supabase";

function CouncilContent() {
  const searchParams = useSearchParams();
  const jobId = searchParams.get("jobId");
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(!!jobId);

  useEffect(() => {
    if (!jobId) return;

    // Initial fetch
    fetch(`/api/jobs/${jobId}`)
      .then((r) => r.json())
      .then((data) => {
        setJob(data.job ?? null);
        setLoading(false);
      });

    // Realtime subscription
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const channel = supabase
      .channel(`council-job-${jobId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "jobs", filter: `id=eq.${jobId}` },
        (payload) => setJob(payload.new as Job)
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [jobId]);

  if (!jobId) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-[var(--foreground)]">New Session</h2>
          <CouncilSessionForm />
        </div>

        {/* What this is */}
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-[var(--foreground)]">How It Works</h2>
          <div className="space-y-3">
            {[
              {
                agent: "Gandalf",
                color: "bg-zinc-200 text-zinc-700",
                time: "~3 min",
                desc: "Drafts a full scope & sequence with curriculum_context tool, Alaska GLEs, and your existing briefs.",
              },
              {
                agent: "Legolas",
                color: "bg-green-100 text-green-700",
                time: "~2 min",
                desc: "Line-by-line audit. Finds every gap, missequence, and missing scaffold. No softening.",
              },
              {
                agent: "Aragorn",
                color: "bg-blue-100 text-blue-700",
                time: "~2 min",
                desc: "Makes every call Legolas raised. Produces the final, production-ready markdown document.",
              },
              {
                agent: "Gimli",
                color: "bg-orange-100 text-orange-700",
                time: "~2 min",
                desc: "10-criteria classroom stress test. Glennallen reality check. PASS/FAIL/CONCERN per criterion.",
              },
              {
                agent: "Frodo",
                color: "bg-yellow-100 text-yellow-700",
                time: "~30 sec",
                desc: "APPROVED or SEND BACK with exactly one request. The document that passes goes straight to course builders.",
              },
            ].map((step) => (
              <div key={step.agent} className="flex gap-3">
                <span className={`inline-flex items-center justify-center w-16 h-6 text-xs font-semibold rounded-full flex-shrink-0 ${step.color}`}>
                  {step.agent}
                </span>
                <div>
                  <p className="text-sm text-[var(--foreground)]">{step.desc}</p>
                  <p className="text-xs text-[var(--muted)] mt-0.5">{step.time}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-[var(--muted)] pt-2 border-t border-[var(--border)]">
            Total: ~10 min. You can close this tab — the session runs in the background and results appear in Job Runner.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-3 py-8 text-sm text-[var(--muted)]">
        <div className="w-4 h-4 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
        Loading session…
      </div>
    );
  }

  if (!job) {
    return <p className="text-sm text-[var(--danger)] py-4">Session not found.</p>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-[var(--foreground)]">{job.label}</p>
        <a href="/council" className="text-xs text-[var(--accent)] hover:opacity-75 transition-opacity">
          ← New session
        </a>
      </div>
      <CouncilChamberViewer job={job} />
    </div>
  );
}

export default function CouncilPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-[var(--accent)]" />
          <h1 className="text-xl font-semibold text-[var(--foreground)]">Council Chamber</h1>
        </div>
        <p className="text-sm text-[var(--muted)]">
          Five agents. One curriculum. Gandalf drafts, Legolas critiques, Aragorn finalizes,
          Gimli stress-tests, Frodo signs off. Runs autonomously while you do something else.
        </p>
      </div>

      <Suspense fallback={<div className="text-sm text-[var(--muted)]">Loading…</div>}>
        <CouncilContent />
      </Suspense>
    </div>
  );
}
