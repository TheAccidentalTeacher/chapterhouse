"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { PageFrame } from "@/components/page-frame";
import { BookOpen, RefreshCw, Play, Loader2, CheckCircle2, XCircle, AlertCircle } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface BundleRow {
  id: string;
  subject: string;
  subject_code: string;
  grade: number;
  unit: number;
  lesson: number;
  bundle_number: number;
  title: string;
  slides_count: number;
  slides_generated: number;
  audio_generated: boolean;
  audio_url: string | null;
  videos_count: number;
  videos_generated: number;
  worksheet_present: boolean;
}

interface JobState {
  jobId: string;
  progress: number;
  message: string;
  status: string;
}

// ── Status dot ───────────────────────────────────────────────────────────────

type DotColor = "green" | "amber" | "red" | "gray";

function StatusDot({
  color,
  title,
}: {
  color: DotColor;
  title: string;
}) {
  const colorMap: Record<DotColor, string> = {
    green: "bg-green-500",
    amber: "bg-amber-400",
    red: "bg-red-500",
    gray: "bg-zinc-600",
  };
  return (
    <span
      title={title}
      className={`inline-block w-3 h-3 rounded-full ${colorMap[color]}`}
    />
  );
}

function slideDotColor(generated: number, total: number): DotColor {
  if (total === 0) return "gray";
  if (generated === 0) return "red";
  if (generated < total) return "amber";
  return "green";
}

function boolDotColor(val: boolean): DotColor {
  return val ? "green" : "red";
}

// ── Aggregate progress bar ───────────────────────────────────────────────────

function AggregateProgressBar({ bundles }: { bundles: BundleRow[] }) {
  const totalExpected = bundles.reduce((s, b) => s + b.slides_count, 0);
  const totalDone = bundles.reduce((s, b) => s + b.slides_generated, 0);
  const pct = totalExpected > 0 ? Math.round((totalDone / totalExpected) * 100) : 0;

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-zinc-400 w-16 shrink-0">Slides</span>
      <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-amber-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-sm text-zinc-300 w-20 text-right shrink-0">
        {totalDone}/{totalExpected} ({pct}%)
      </span>
    </div>
  );
}

// ── Course / grade selectors ─────────────────────────────────────────────────

const COURSES = [
  { label: "Science", value: "sci" },
  { label: "Language Arts", value: "ela" },
  { label: "Mathematics", value: "mth" },
  { label: "Social Studies", value: "hst" },
];

const GRADES = Array.from({ length: 12 }, (_, i) => i + 1);

// ── Main page ────────────────────────────────────────────────────────────────

export default function CourseAssetsPage() {
  const [course, setCourse] = useState("sci");
  const [grade, setGrade] = useState(1);
  const [bundles, setBundles] = useState<BundleRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Map of bundleId → active job state
  const [jobs, setJobs] = useState<Record<string, JobState>>({});
  const [generating, setGenerating] = useState<Record<string, boolean>>({});
  const [generateAllRunning, setGenerateAllRunning] = useState(false);

  // ── Fetch bundles ──────────────────────────────────────────────────────────

  const fetchBundles = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/course-assets/status?course=${course}&grade=${grade}`
      );
      const data = await res.json() as { bundles?: BundleRow[]; error?: string };
      if (!res.ok) {
        setError(data.error ?? "Failed to load bundles");
      } else {
        setBundles(data.bundles ?? []);
      }
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [course, grade]);

  useEffect(() => {
    void fetchBundles();
  }, [fetchBundles]);

  // ── Supabase Realtime — watch course_slide_images jobs ────────────────────

  useEffect(() => {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;

    const channel = supabase.channel("course-asset-jobs")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "jobs",
          filter: "type=eq.course_slide_images",
        },
        (payload: { new: Record<string, unknown> }) => {
          const job = payload.new as {
            id?: string;
            input_payload?: { bundleId?: string };
            progress?: number;
            progress_message?: string;
            status?: string;
          };
          const bundleId = job?.input_payload?.bundleId;
          if (!bundleId || !job.id) return;

          setJobs((prev) => ({
            ...prev,
            [bundleId]: {
              jobId: job.id!,
              progress: job.progress ?? 0,
              message: job.progress_message ?? "",
              status: job.status ?? "running",
            },
          }));

          // If job completed, refresh bundles to pick up new slides_generated counts
          if (job.status === "completed" || job.status === "failed") {
            setGenerating((prev) => {
              const next = { ...prev };
              delete next[bundleId];
              return next;
            });
            void fetchBundles();
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [fetchBundles]);

  // ── Generate slides for one bundle ────────────────────────────────────────

  const generateSlides = useCallback(async (bundleId: string) => {
    setGenerating((prev) => ({ ...prev, [bundleId]: true }));
    try {
      const res = await fetch("/api/course-assets/generate-slides", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bundleId }),
      });
      const data = await res.json() as { jobId?: string; error?: string };
      if (!res.ok || !data.jobId) {
        console.error("[course-assets] generate-slides error:", data.error);
        setGenerating((prev) => {
          const next = { ...prev };
          delete next[bundleId];
          return next;
        });
      } else {
        // Job is queued — Realtime will drive the rest
        setJobs((prev) => ({
          ...prev,
          [bundleId]: {
            jobId: data.jobId!,
            progress: 0,
            message: "Queued...",
            status: "queued",
          },
        }));
      }
    } catch (e) {
      console.error("[course-assets] generate-slides:", e);
      setGenerating((prev) => {
        const next = { ...prev };
        delete next[bundleId];
        return next;
      });
    }
  }, []);

  // ── Generate All Missing ───────────────────────────────────────────────────

  const generateAllMissing = useCallback(async () => {
    const missing = bundles.filter(
      (b) => b.slides_generated < b.slides_count && !generating[b.id]
    );
    if (missing.length === 0) return;

    setGenerateAllRunning(true);
    for (const bundle of missing) {
      await generateSlides(bundle.id);
      // Brief pause between job submissions to avoid overwhelming QStash
      await new Promise((r) => setTimeout(r, 300));
    }
    setGenerateAllRunning(false);
  }, [bundles, generating, generateSlides]);

  // ── Counts ────────────────────────────────────────────────────────────────

  const missingSlidesCount = bundles.filter(
    (b) => b.slides_generated < b.slides_count
  ).length;

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <PageFrame
      eyebrow="Course Assets"
      title="Slide Images · Audio · Video"
      description="Generate and track lesson slide images, audio, and video for all SomersSchool courses."
    >
      {/* ── Selectors ── */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select
          value={course}
          onChange={(e) => setCourse(e.target.value)}
          className="bg-zinc-900 border border-zinc-700 text-zinc-200 text-sm rounded px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
        >
          {COURSES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>

        <select
          value={grade}
          onChange={(e) => setGrade(Number(e.target.value))}
          className="bg-zinc-900 border border-zinc-700 text-zinc-200 text-sm rounded px-3 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-500"
        >
          {GRADES.map((g) => (
            <option key={g} value={g}>
              Grade {g}
            </option>
          ))}
        </select>

        <button
          onClick={() => void fetchBundles()}
          disabled={loading}
          className="flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200 border border-zinc-700 rounded px-3 py-1.5 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>

        <div className="flex-1" />

        {missingSlidesCount > 0 && (
          <button
            onClick={() => void generateAllMissing()}
            disabled={generateAllRunning}
            className="flex items-center gap-1.5 text-sm bg-amber-600 hover:bg-amber-500 text-zinc-900 font-medium rounded px-4 py-1.5 transition-colors disabled:opacity-50"
          >
            {generateAllRunning ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            Generate All Missing ({missingSlidesCount})
          </button>
        )}
      </div>

      {/* ── Aggregate progress ── */}
      {bundles.length > 0 && (
        <div className="mb-6 p-4 bg-zinc-900 rounded-lg border border-zinc-800">
          <AggregateProgressBar bundles={bundles} />
        </div>
      )}

      {/* ── Dot legend ── */}
      <div className="flex items-center gap-5 text-xs text-zinc-500 mb-3 pl-1">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500" />
          Complete
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400" />
          Partial
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500" />
          Missing
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-zinc-600" />
          N/A
        </span>
        <span className="ml-4 text-zinc-600">
          Dots: Bundle · Slides · Audio · Video · Worksheet
        </span>
      </div>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center gap-2 text-red-400 text-sm mb-4 p-3 bg-red-900/20 rounded border border-red-800">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      {/* ── Loading ── */}
      {loading && bundles.length === 0 && (
        <div className="flex items-center gap-2 text-zinc-500 text-sm py-8 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading bundles...
        </div>
      )}

      {/* ── Empty state ── */}
      {!loading && bundles.length === 0 && !error && (
        <div className="text-zinc-600 text-sm py-8 text-center">
          No bundles found for {COURSES.find((c) => c.value === course)?.label} Grade {grade}
        </div>
      )}

      {/* ── Bundle table ── */}
      {bundles.length > 0 && (
        <div className="rounded-lg border border-zinc-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/60">
                <th className="text-left text-xs text-zinc-500 font-medium px-4 py-2 w-10">#</th>
                <th className="text-left text-xs text-zinc-500 font-medium px-4 py-2">Title</th>
                <th className="text-left text-xs text-zinc-500 font-medium px-4 py-2">ID</th>
                <th className="text-left text-xs text-zinc-500 font-medium px-4 py-2 w-32">Status</th>
                <th className="text-left text-xs text-zinc-500 font-medium px-4 py-2 w-32">Slides</th>
                <th className="text-left text-xs text-zinc-500 font-medium px-4 py-2 w-36">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bundles.map((bundle) => {
                const activeJob = jobs[bundle.id];
                const isGenerating = !!generating[bundle.id] || (activeJob?.status === "running" || activeJob?.status === "queued");
                const jobComplete = activeJob?.status === "completed";
                const jobFailed = activeJob?.status === "failed";

                return (
                  <tr
                    key={bundle.id}
                    className="border-b border-zinc-800/60 hover:bg-zinc-900/40 transition-colors group"
                  >
                    {/* # */}
                    <td className="px-4 py-2.5 text-zinc-600 tabular-nums">
                      {bundle.bundle_number}
                    </td>

                    {/* Title */}
                    <td className="px-4 py-2.5 text-zinc-200 font-medium">
                      {bundle.title}
                      {(isGenerating || jobComplete || jobFailed) && activeJob && (
                        <div className="mt-1">
                          {isGenerating && (
                            <div className="flex items-center gap-2 mb-0.5">
                              <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-amber-500 transition-all duration-300"
                                  style={{ width: `${activeJob.progress}%` }}
                                />
                              </div>
                              <span className="text-xs text-zinc-500 tabular-nums shrink-0">
                                {activeJob.progress}%
                              </span>
                            </div>
                          )}
                          <p className={`text-xs mt-0.5 truncate max-w-xs ${
                            jobFailed ? "text-red-400" : jobComplete ? "text-green-400" : "text-zinc-500"
                          }`}>
                            {activeJob.message}
                          </p>
                        </div>
                      )}
                    </td>

                    {/* ID */}
                    <td className="px-4 py-2.5 text-zinc-500 font-mono text-xs">
                      {bundle.id}
                    </td>

                    {/* 5 status dots */}
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5">
                        {/* Dot 1: Bundle present */}
                        <StatusDot color="green" title="Bundle present" />

                        {/* Dot 2: Slides / images */}
                        <StatusDot
                          color={slideDotColor(bundle.slides_generated, bundle.slides_count)}
                          title={`Slides: ${bundle.slides_generated}/${bundle.slides_count}`}
                        />

                        {/* Dot 3: Audio */}
                        <StatusDot
                          color={boolDotColor(bundle.audio_generated)}
                          title={bundle.audio_generated ? "Audio: done" : "Audio: missing"}
                        />

                        {/* Dot 4: Video */}
                        <StatusDot
                          color={slideDotColor(bundle.videos_generated, bundle.videos_count)}
                          title={`Video: ${bundle.videos_generated}/${bundle.videos_count}`}
                        />

                        {/* Dot 5: Worksheet */}
                        <StatusDot
                          color={bundle.worksheet_present ? "green" : "gray"}
                          title={bundle.worksheet_present ? "Worksheet: present" : "Worksheet: none"}
                        />
                      </div>
                    </td>

                    {/* Slides count */}
                    <td className="px-4 py-2.5 tabular-nums text-zinc-400 text-xs">
                      {bundle.slides_generated}/{bundle.slides_count}
                      {jobComplete && (
                        <CheckCircle2 className="inline ml-1.5 w-3.5 h-3.5 text-green-500" />
                      )}
                      {jobFailed && (
                        <XCircle className="inline ml-1.5 w-3.5 h-3.5 text-red-500" />
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-2.5">
                      <div className="flex flex-col gap-1">
                        {isGenerating ? (
                          <span className="flex items-center gap-1.5 text-xs text-amber-400">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Generating...
                          </span>
                        ) : bundle.slides_generated < bundle.slides_count ? (
                          <button
                            onClick={() => void generateSlides(bundle.id)}
                            className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Play className="w-3 h-3" />
                            Generate Slides
                          </button>
                        ) : (
                          <span className="text-xs text-zinc-600 opacity-0 group-hover:opacity-100">
                            All slides done
                          </span>
                        )}
                        {activeJob && (
                          <a
                            href={`/jobs?highlight=${activeJob.jobId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            View job →
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </PageFrame>
  );
}
