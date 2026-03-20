"use client";

import { useEffect, useRef, useState } from "react";
import { type Job } from "@/hooks/use-jobs-realtime";
import { Download, Copy, Check, ChevronRight } from "lucide-react";

// ─── 6-pass pipeline definition ─────────────────────────────────────────────
const PASSES = [
  { id: "gandalf", label: "Gandalf",          sub: "Draft",       minProgress: 5,  dot: "bg-zinc-400",    ring: "ring-zinc-400",    text: "text-zinc-500",    active: "text-zinc-700" },
  { id: "data",    label: "Data",              sub: "Audit",       minProgress: 18, dot: "bg-green-500",   ring: "ring-green-400",   text: "text-green-600",  active: "text-green-700" },
  { id: "polgara", label: "Polgara",           sub: "Finalize",    minProgress: 35, dot: "bg-fuchsia-500", ring: "ring-fuchsia-400", text: "text-fuchsia-600",active: "text-fuchsia-700" },
  { id: "earl",    label: "Earl",              sub: "Assess",      minProgress: 52, dot: "bg-amber-500",   ring: "ring-amber-400",   text: "text-amber-600",  active: "text-amber-700" },
  { id: "beavis",  label: "B & B",             sub: "Stress-test", minProgress: 75, dot: "bg-purple-500",  ring: "ring-purple-400",  text: "text-purple-600", active: "text-purple-700" },
  { id: "extract", label: "Extract",           sub: "Build JSON",  minProgress: 88, dot: "bg-emerald-500", ring: "ring-emerald-400", text: "text-emerald-600",active: "text-emerald-700" },
] as const;

function getStepIndex(progress: number): number {
  if (progress >= 100) return PASSES.length; // all done
  for (let i = PASSES.length - 1; i >= 0; i--) {
    if (progress >= PASSES[i].minProgress) return i;
  }
  return -1; // queued
}

function PassStepper({ progress, isComplete, isFailed }: { progress: number; isComplete: boolean; isFailed: boolean }) {
  const activeIdx = isComplete ? PASSES.length : getStepIndex(progress);

  return (
    <div className="w-full overflow-x-auto pb-1">
      <div className="flex items-start min-w-max">
        {PASSES.map((pass, i) => {
          const done    = i < activeIdx;
          const active  = i === activeIdx && !isFailed;
          const pending = i > activeIdx || isFailed;
          return (
            <div key={pass.id} className="flex items-start">
              <div className="flex flex-col items-center gap-1.5 w-[4.5rem]">
                {/* Dot */}
                <div className={[
                  "flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-all duration-500",
                  done    ? `${pass.dot} text-white` : "",
                  active  ? `${pass.dot} text-white ring-2 ${pass.ring} ring-offset-2 ring-offset-[var(--card)] animate-pulse` : "",
                  pending ? "bg-[var(--muted-surface)] text-[var(--muted)]" : "",
                ].join(" ")}>
                  {done ? <Check className="w-3.5 h-3.5" /> : <span>{i + 1}</span>}
                </div>
                {/* Labels */}
                <div className="text-center">
                  <p className={`text-[10px] font-semibold leading-tight ${
                    active ? pass.active : done ? pass.text : "text-[var(--muted)] opacity-60"
                  }`}>
                    {pass.label}
                  </p>
                  <p className={`text-[9px] leading-tight ${
                    pending && !active ? "text-[var(--muted)] opacity-40" : "text-[var(--muted)]"
                  }`}>
                    {pass.sub}
                  </p>
                </div>
              </div>
              {/* Connector */}
              {i < PASSES.length - 1 && (
                <div className={`w-6 h-0.5 mt-3.5 shrink-0 transition-colors duration-500 ${
                  i < activeIdx ? pass.dot : "bg-[var(--muted-surface)]"
                }`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="inline-flex items-center gap-1 text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? "Copied" : label}
    </button>
  );
}

// Turbopack re-derives property types through `as` casts, tracing back to the
// source type and ignoring cast annotations. A function call is an opaque type
// boundary — Turbopack must accept the declared return type without tracing.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseOutput(raw: unknown): CouncilOutput | null {
  if (raw == null || typeof raw !== "object") return null;
  const o = raw as any; // `any` inside this function only — contained here
  return {
    subject: o.subject,
    gradeLevel: o.gradeLevel,
    duration: o.duration,
    finalScopeAndSequence: o.finalScopeAndSequence,
    structuredOutput: o.structuredOutput,
    operationalAssessment: o.operationalAssessment,
    engagementReport: o.engagementReport,
    councilLog: o.councilLog,
    draftsRetained: o.draftsRetained,
    generatedAt: o.generatedAt,
  };
}

interface CouncilOutput {
  subject?: string;
  gradeLevel?: number;
  duration?: string;
  finalScopeAndSequence?: string;
  structuredOutput?: unknown;
  operationalAssessment?: string;
  engagementReport?: string;
  councilLog?: string;
  draftsRetained?: {
    gandalfInitialDraft?: string;
    dataCritique?: string;
  };
  generatedAt?: string;
}

interface Props {
  job: Job;
}

export function CouncilChamberViewer({ job }: Props) {
  const logEndRef = useRef<HTMLDivElement>(null);
  const [showStructured, setShowStructured] = useState(false);
  const [sessionLog, setSessionLog] = useState<string[]>([]);
  const output = parseOutput(job.output);

  // Accumulate progress messages — Realtime only gives the current row, so we
  // append each new distinct message ourselves to build a running history.
  useEffect(() => {
    if (job.progress_message) {
      setSessionLog((prev) => {
        if (prev[prev.length - 1] === job.progress_message) return prev;
        return [...prev, job.progress_message!];
      });
    }
  }, [job.progress_message]);

  // Auto-scroll session log
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [sessionLog]);

  const isRunning = job.status === "running";
  const isComplete = job.status === "completed";
  const isFailed = job.status === "failed";

  const activeIdx = isComplete ? PASSES.length : getStepIndex(job.progress);
  const activePassLabel = activeIdx >= 0 && activeIdx < PASSES.length ? PASSES[activeIdx].label : null;

  return (
    <div className="space-y-6">
      {/* Job meta */}
      {output?.subject && (
        <p className="text-xs text-[var(--muted)]">
          {output.subject} — Grade {output.gradeLevel} — {output.duration}
        </p>
      )}

      {/* ── 6-pass stepper ──────────────────────────────────────────────── */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] px-4 pt-4 pb-3">
        <PassStepper progress={job.progress} isComplete={isComplete} isFailed={isFailed} />
        <div className="mt-3 flex items-center justify-between text-xs text-[var(--muted)]">
          <span>
            {isComplete
              ? "All 6 passes complete ✓"
              : isFailed
              ? "Session failed"
              : isRunning && activePassLabel
              ? `Running: ${activePassLabel}…`
              : "Queued — waiting for Railway worker"}
          </span>
          <span className="font-mono tabular-nums">{job.progress}%</span>
        </div>
      </div>

      {/* ── Session log (accumulates as each pass fires) ──────────────── */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 space-y-1.5 max-h-44 overflow-y-auto">
        <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-semibold pb-1">Session Log</p>
        {sessionLog.length === 0 ? (
          <p className="text-xs text-zinc-600 italic">Waiting for the Council to convene…</p>
        ) : (
          sessionLog.map((msg, i) => (
            <div key={i} className="flex items-start gap-2">
              <ChevronRight className="w-3 h-3 text-zinc-600 mt-0.5 shrink-0" />
              <p className="text-xs text-zinc-400 leading-snug">{msg}</p>
            </div>
          ))
        )}
        {isRunning && (
          <div className="flex items-center gap-1.5 pt-1">
            {[0, 1, 2].map((i) => (
              <span key={i} className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.15}s` }} />
            ))}
          </div>
        )}
        <div ref={logEndRef} />
      </div>

      {/* ── Output — only when complete ──────────────────────────────────── */}
      {isComplete && output && (
        <div className="space-y-4">

          {/* 1. Final Scope & Sequence ─ Polgara's deliverable */}
          {!!output.finalScopeAndSequence && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">
                  Final Scope &amp; Sequence
                </p>
                <div className="flex gap-3">
                  <CopyButton text={output.finalScopeAndSequence} />
                  <button
                    onClick={() => downloadText(
                      `${output.subject ?? "curriculum"}-grade${output.gradeLevel}-scope.md`,
                      output.finalScopeAndSequence!
                    )}
                    className="inline-flex items-center gap-1 text-xs text-[var(--accent)] hover:opacity-75 transition-opacity"
                  >
                    <Download className="w-3 h-3" /> Download .md
                  </button>
                </div>
              </div>
              <pre className="bg-[var(--muted-surface)] rounded-xl p-4 text-xs leading-relaxed overflow-auto max-h-96 whitespace-pre-wrap">
                {output.finalScopeAndSequence}
              </pre>
            </div>
          )}

          {/* 2. Pipeline Handoff JSON ─ structured extraction output */}
          {!!output.structuredOutput && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
                    Pipeline Handoff JSON
                  </p>
                  <p className="text-[11px] text-emerald-600/70 mt-0.5">
                    Drop into <code className="font-mono">scope-sequence/</code> — SomersSchool-ready
                  </p>
                </div>
                <div className="flex gap-3">
                  <CopyButton text={JSON.stringify(output.structuredOutput, null, 2)} />
                  <button
                    onClick={() => {
                      const s = output.structuredOutput as Record<string, unknown>;
                      downloadJson(`${(s?.id as string) ?? `${output.subject ?? "curriculum"}-g${output.gradeLevel}`}.json`, s);
                    }}
                    className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:opacity-75 transition-opacity"
                  >
                    <Download className="w-3 h-3" /> Download .json
                  </button>
                  <button
                    onClick={() => setShowStructured((v) => !v)}
                    className="text-xs text-emerald-600 hover:text-emerald-800 transition-colors"
                  >
                    {showStructured ? "▲ Hide" : "▼ Preview"}
                  </button>
                </div>
              </div>
              {showStructured && (
                <pre className="bg-white/60 rounded-lg border border-emerald-200 p-3 text-xs leading-relaxed overflow-auto max-h-64 whitespace-pre-wrap text-emerald-800">
                  {JSON.stringify(output.structuredOutput, null, 2)}
                </pre>
              )}
            </div>
          )}

          {/* 3. Earl's Operational Assessment ─ open by default */}
          {!!output.operationalAssessment && (
            <details className="group" open>
              <summary className="cursor-pointer list-none flex items-center gap-2 hover:opacity-80 transition-opacity select-none">
                <span className="group-open:rotate-90 transition-transform inline-block text-amber-500 text-xs">▶</span>
                <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                  Earl&apos;s Operational Assessment
                </span>
              </summary>
              <pre className="mt-2 bg-amber-50 border border-amber-100 rounded-xl p-4 text-xs leading-relaxed overflow-auto max-h-72 whitespace-pre-wrap">
                {output.operationalAssessment}
              </pre>
            </details>
          )}

          {/* 4. Beavis & Butthead's Engagement Report */}
          {!!output.engagementReport && (
            <details className="group">
              <summary className="cursor-pointer list-none flex items-center gap-2 hover:opacity-80 transition-opacity select-none">
                <span className="group-open:rotate-90 transition-transform inline-block text-amber-500 text-xs">▶</span>
                <span className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                  Beavis &amp; Butthead&apos;s Engagement Report
                </span>
              </summary>
              <pre className="mt-2 bg-amber-50 border border-amber-100 rounded-xl p-4 text-xs leading-relaxed overflow-auto max-h-64 whitespace-pre-wrap">
                {output.engagementReport}
              </pre>
            </details>
          )}

          {/* 5. Working Papers ─ Gandalf's draft + Data's critique (closed by default) */}
          {!!(output.draftsRetained?.gandalfInitialDraft || output.draftsRetained?.dataCritique) && (
            <details className="group">
              <summary className="cursor-pointer list-none flex items-center gap-2 hover:opacity-80 transition-opacity select-none">
                <span className="group-open:rotate-90 transition-transform inline-block text-zinc-400 text-xs">▶</span>
                <span className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">
                  Working Papers — Gandalf&apos;s Draft &amp; Data&apos;s Critique
                </span>
              </summary>
              <div className="mt-2 space-y-3">
                {output.draftsRetained?.gandalfInitialDraft && (
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wide font-semibold mb-1 pl-1">Gandalf&apos;s Initial Draft</p>
                    <pre className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 text-xs leading-relaxed overflow-auto max-h-64 whitespace-pre-wrap">
                      {output.draftsRetained.gandalfInitialDraft}
                    </pre>
                  </div>
                )}
                {output.draftsRetained?.dataCritique && (
                  <div>
                    <p className="text-[10px] text-green-600 uppercase tracking-wide font-semibold mb-1 pl-1">Data&apos;s Critique</p>
                    <pre className="bg-green-50 border border-green-100 rounded-xl p-4 text-xs leading-relaxed overflow-auto max-h-64 whitespace-pre-wrap">
                      {output.draftsRetained.dataCritique}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}

          {/* 6. Download full session ─ includes JSON block */}
          <button
            onClick={() => {
              const jsonBlock = output.structuredOutput
                ? `\n## Pipeline Handoff JSON\n\`\`\`json\n${JSON.stringify(output.structuredOutput, null, 2)}\n\`\`\``
                : "";
              const full = [
                `# Council Session: ${output.subject} — Grade ${output.gradeLevel}`,
                `Generated: ${output.generatedAt ?? ""}`,
                `\n## Final Scope & Sequence\n${output.finalScopeAndSequence ?? ""}`,
                jsonBlock,
                `\n## Earl's Operational Assessment\n${output.operationalAssessment ?? ""}`,
                `\n## Beavis & Butthead's Engagement Report\n${output.engagementReport ?? ""}`,
                `\n## Gandalf's Initial Draft\n${output.draftsRetained?.gandalfInitialDraft ?? ""}`,
                `\n## Data's Critique\n${output.draftsRetained?.dataCritique ?? ""}`,
              ].join("\n\n");
              downloadText(
                `council-session-${output.subject?.toLowerCase().replace(/\s+/g, "-")}-grade${output.gradeLevel}.md`,
                full
              );
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 border border-[var(--border)] rounded-xl text-sm text-[var(--muted)] hover:bg-[var(--muted-surface)] transition-colors"
          >
            <Download className="w-4 h-4" />
            Download Full Session Transcript
          </button>
        </div>
      )}

      {isFailed && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          Session failed. {job.error ?? "Check Railway logs for details."}
        </div>
      )}
    </div>
  );
}
