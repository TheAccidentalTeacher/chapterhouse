"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Zap } from "lucide-react";

const SUBJECTS = [
  "English Language Arts",
  "Mathematics",
  "Science",
  "Social Studies",
  "History",
  "Geography",
  "Literature",
  "Writing",
  "Reading",
  "Algebra",
  "Geometry",
  "Biology",
  "Chemistry",
  "Physics",
  "Earth Science",
  "World History",
  "American History",
  "Civics",
  "Economics",
];

const DURATIONS = [
  { label: "1 week (5 lessons)", value: "1 week" },
  { label: "2 weeks (10 lessons)", value: "2 weeks" },
  { label: "4 weeks (20 lessons)", value: "4 weeks" },
  { label: "6 weeks (30 lessons)", value: "6 weeks" },
  { label: "9 weeks / Quarter", value: "9 weeks" },
  { label: "18 weeks / Semester", value: "18 weeks" },
  { label: "36 weeks / Full Year", value: "36 weeks" },
];

type Mode = "single" | "batch";

interface BatchEntry {
  subject: string;
  gradeLevel: number;
  duration: string;
}

export function CurriculumFactoryForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("single");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Single mode fields
  const [subject, setSubject] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [gradeLevel, setGradeLevel] = useState<number>(6);
  const [duration, setDuration] = useState("9 weeks");
  const [standards, setStandards] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");

  // Batch mode fields
  const [batchSubjects, setBatchSubjects] = useState<string[]>([]);
  const [batchGradeStart, setBatchGradeStart] = useState<number>(5);
  const [batchGradeEnd, setBatchGradeEnd] = useState<number>(8);
  const [batchDuration, setBatchDuration] = useState("9 weeks");

  const effectiveSubject = subject === "__custom__" ? customSubject : subject;

  function toggleBatchSubject(s: string) {
    setBatchSubjects((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  }

  function buildBatchEntries(): BatchEntry[] {
    const entries: BatchEntry[] = [];
    for (let g = batchGradeStart; g <= batchGradeEnd; g++) {
      for (const s of batchSubjects) {
        entries.push({ subject: s, gradeLevel: g, duration: batchDuration });
      }
    }
    return entries;
  }

  async function submitJob(
    payload: object,
    label: string,
    type: string = "curriculum_factory"
  ) {
    const res = await fetch("/api/jobs/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, label, payload }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? `HTTP ${res.status}`);
    }
    return res.json() as Promise<{ jobId: string }>;
  }

  async function handleSingleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!effectiveSubject) { setError("Subject is required."); return; }
    setError(null);
    setSubmitting(true);
    try {
      const { jobId } = await submitJob(
        { subject: effectiveSubject, gradeLevel, duration, standards, additionalContext },
        `${effectiveSubject} — Grade ${gradeLevel} — ${duration}`
      );
      router.push(`/jobs?highlight=${jobId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleBatchSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (batchSubjects.length === 0) { setError("Select at least one subject."); return; }
    if (batchGradeEnd < batchGradeStart) { setError("End grade must be ≥ start grade."); return; }
    setError(null);
    setSubmitting(true);
    try {
      const entries = buildBatchEntries();
      await Promise.all(
        entries.map((entry) =>
          submitJob(
            { subject: entry.subject, gradeLevel: entry.gradeLevel, duration: entry.duration },
            `${entry.subject} — Grade ${entry.gradeLevel} — ${entry.duration}`
          )
        )
      );
      router.push("/jobs");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Mode toggle */}
      <div className="flex gap-2 bg-[var(--muted-surface)] p-1 rounded-lg w-fit">
        <button
          type="button"
          onClick={() => setMode("single")}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            mode === "single"
              ? "bg-white text-[var(--foreground)] shadow-sm"
              : "text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          Single Course
        </button>
        <button
          type="button"
          onClick={() => setMode("batch")}
          className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
            mode === "batch"
              ? "bg-white text-[var(--foreground)] shadow-sm"
              : "text-[var(--muted)] hover:text-[var(--foreground)]"
          }`}
        >
          Batch (Multi-Grade)
        </button>
      </div>

      {mode === "single" ? (
        <form onSubmit={handleSingleSubmit} className="space-y-5">
          {/* Subject */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-[var(--foreground)]">Subject</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-[var(--card)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
              required
            >
              <option value="">— Select a subject —</option>
              {SUBJECTS.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
              <option value="__custom__">Other (type below)</option>
            </select>
            {subject === "__custom__" && (
              <input
                type="text"
                value={customSubject}
                onChange={(e) => setCustomSubject(e.target.value)}
                placeholder="Enter custom subject..."
                className="w-full mt-2 bg-[var(--card)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
              />
            )}
          </div>

          {/* Grade Level */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-[var(--foreground)]">
              Grade Level — <span className="text-[var(--accent)] font-semibold">Grade {gradeLevel}</span>
            </label>
            <input
              type="range"
              min={1}
              max={12}
              value={gradeLevel}
              onChange={(e) => setGradeLevel(Number(e.target.value))}
              className="w-full accent-[var(--accent)]"
            />
            <div className="flex justify-between text-xs text-[var(--muted)]">
              <span>K/1</span><span>3</span><span>5</span><span>7</span><span>9</span><span>11</span><span>12</span>
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-[var(--foreground)]">Duration</label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full bg-[var(--card)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
            >
              {DURATIONS.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>

          {/* Standards (optional) */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-[var(--foreground)]">
              Standards <span className="text-[var(--muted)] font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={standards}
              onChange={(e) => setStandards(e.target.value)}
              placeholder="e.g. Alaska Grade 6 ELA Standards, NGSS MS-LS1..."
              className="w-full bg-[var(--card)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
            />
          </div>

          {/* Additional Context (optional) */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-[var(--foreground)]">
              Additional Context <span className="text-[var(--muted)] font-normal">(optional)</span>
            </label>
            <textarea
              value={additionalContext}
              onChange={(e) => setAdditionalContext(e.target.value)}
              rows={3}
              placeholder="65% Alaska Native students. Remote rural classroom. Emphasis on land and subsistence..."
              className="w-full bg-[var(--card)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40 resize-none"
            />
          </div>

          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 bg-[var(--accent)] text-[var(--accent-foreground)] px-5 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Queuing job…</>
            ) : (
              <><Zap className="w-4 h-4" /> Generate Scope &amp; Sequence</>
            )}
          </button>
        </form>
      ) : (
        /* Batch mode */
        <form onSubmit={handleBatchSubmit} className="space-y-5">
          {/* Subject multi-select */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--foreground)]">
              Subjects <span className="text-[var(--muted)] font-normal">({batchSubjects.length} selected)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {SUBJECTS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggleBatchSubject(s)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                    batchSubjects.includes(s)
                      ? "bg-[var(--accent)] text-[var(--accent-foreground)] border-[var(--accent)]"
                      : "bg-[var(--card)] text-[var(--muted)] border-[var(--border)] hover:border-[var(--accent)]/50"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Grade range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-[var(--foreground)]">From Grade</label>
              <select
                value={batchGradeStart}
                onChange={(e) => setBatchGradeStart(Number(e.target.value))}
                className="w-full bg-[var(--card)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
                  <option key={g} value={g}>Grade {g}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-[var(--foreground)]">To Grade</label>
              <select
                value={batchGradeEnd}
                onChange={(e) => setBatchGradeEnd(Number(e.target.value))}
                className="w-full bg-[var(--card)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
                  <option key={g} value={g}>Grade {g}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Duration */}
          <div className="space-y-1">
            <label className="text-sm font-medium text-[var(--foreground)]">Duration (applied to all)</label>
            <select
              value={batchDuration}
              onChange={(e) => setBatchDuration(e.target.value)}
              className="w-full bg-[var(--card)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
            >
              {DURATIONS.map((d) => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>

          {/* Job count preview */}
          {batchSubjects.length > 0 && batchGradeEnd >= batchGradeStart && (
            <div className="bg-[var(--muted-surface)] rounded-lg px-4 py-3 text-sm text-[var(--muted)]">
              This will queue{" "}
              <span className="font-semibold text-[var(--foreground)]">
                {batchSubjects.length * (batchGradeEnd - batchGradeStart + 1)} jobs
              </span>{" "}
              ({batchSubjects.length} subject{batchSubjects.length > 1 ? "s" : ""} ×{" "}
              {batchGradeEnd - batchGradeStart + 1} grade{batchGradeEnd - batchGradeStart + 1 > 1 ? "s" : ""})
            </div>
          )}

          {error && <p className="text-sm text-[var(--danger)]">{error}</p>}

          <button
            type="submit"
            disabled={submitting || batchSubjects.length === 0}
            className="flex items-center gap-2 bg-[var(--accent)] text-[var(--accent-foreground)] px-5 py-2.5 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Queuing {batchSubjects.length * Math.max(1, batchGradeEnd - batchGradeStart + 1)} jobs…</>
            ) : (
              <><Zap className="w-4 h-4" /> Queue Batch</>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
