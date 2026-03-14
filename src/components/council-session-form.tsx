"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Users } from "lucide-react";

const SUBJECTS = [
  "English Language Arts",
  "Mathematics",
  "Science",
  "Social Studies",
  "History",
  "Geography",
  "Literature",
  "Writing",
  "Algebra",
  "Biology",
  "Chemistry",
  "Physics",
  "Earth Science",
  "World History",
  "American History",
];

const DURATIONS = [
  { label: "4 weeks (intensive)", value: "4 weeks" },
  { label: "9 weeks / Quarter", value: "9 weeks" },
  { label: "18 weeks / Semester", value: "18 weeks" },
  { label: "36 weeks / Full Year", value: "36 weeks" },
];

export function CouncilSessionForm() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [subject, setSubject] = useState("");
  const [customSubject, setCustomSubject] = useState("");
  const [gradeLevel, setGradeLevel] = useState(6);
  const [duration, setDuration] = useState("9 weeks");
  const [standards, setStandards] = useState("");
  const [additionalContext, setAdditionalContext] = useState("");

  const effectiveSubject = subject === "__custom__" ? customSubject : subject;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!effectiveSubject) { setError("Subject is required."); return; }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/jobs/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "council_session",
          label: `Council: ${effectiveSubject} — Grade ${gradeLevel} — ${duration}`,
          payload: { subject: effectiveSubject, gradeLevel, duration, standards, additionalContext },
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      const { jobId } = await res.json();
      router.push(`/council?jobId=${jobId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-1">
        <label className="text-sm font-medium text-[var(--foreground)]">Subject</label>
        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
          className="w-full bg-[var(--card)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
        >
          <option value="">— Select a subject —</option>
          {SUBJECTS.map((s) => <option key={s} value={s}>{s}</option>)}
          <option value="__custom__">Other (type below)</option>
        </select>
        {subject === "__custom__" && (
          <input
            type="text"
            value={customSubject}
            onChange={(e) => setCustomSubject(e.target.value)}
            placeholder="Enter subject..."
            className="w-full mt-2 bg-[var(--card)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
          />
        )}
      </div>

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
          <span>1</span><span>3</span><span>5</span><span>7</span><span>9</span><span>11</span><span>12</span>
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-[var(--foreground)]">Duration</label>
        <select
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          className="w-full bg-[var(--card)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
        >
          {DURATIONS.map((d) => <option key={d.value} value={d.value}>{d.label}</option>)}
        </select>
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-[var(--foreground)]">
          Standards <span className="text-[var(--muted)] font-normal">(optional)</span>
        </label>
        <input
          type="text"
          value={standards}
          onChange={(e) => setStandards(e.target.value)}
          placeholder="e.g. Alaska Grade 6 ELA Standards..."
          className="w-full bg-[var(--card)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/40"
        />
      </div>

      <div className="space-y-1">
        <label className="text-sm font-medium text-[var(--foreground)]">
          Context for the Council <span className="text-[var(--muted)] font-normal">(optional)</span>
        </label>
        <textarea
          value={additionalContext}
          onChange={(e) => setAdditionalContext(e.target.value)}
          rows={4}
          placeholder="65% Alaska Native students. Rural school. Subsistence culture important. Many students have IEPs. Reading levels range 4-10 within the same class..."
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
          <><Loader2 className="w-4 h-4 animate-spin" /> Summoning the Council…</>
        ) : (
          <><Users className="w-4 h-4" /> Convene the Council</>
        )}
      </button>
    </form>
  );
}
