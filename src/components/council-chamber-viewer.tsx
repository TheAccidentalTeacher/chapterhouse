"use client";

import { useEffect, useRef } from "react";
import { type Job } from "@/hooks/use-jobs-realtime";
import { Download, Copy } from "lucide-react";

// Council member color scheme
const AGENT_STYLES: Record<string, { border: string; label: string; dot: string }> = {
  Gandalf:  { border: "border-l-zinc-400",    label: "text-zinc-500",    dot: "bg-zinc-400" },
  Data:     { border: "border-l-green-500",   label: "text-green-600",   dot: "bg-green-500" },
  Polgara:  { border: "border-l-fuchsia-500", label: "text-fuchsia-600", dot: "bg-fuchsia-500" },
  Earl:     { border: "border-l-amber-500",   label: "text-amber-600",   dot: "bg-amber-500" },
  "Beavis & Butthead": { border: "border-l-purple-500",  label: "text-purple-600",  dot: "bg-purple-500" },
};

function detectAgent(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("gandalf")) return "Gandalf";
  if (lower.includes("data") || lower.includes("lt. commander")) return "Data";
  if (lower.includes("polgara")) return "Polgara";
  if (lower.includes("earl") || lower.includes("harbinger")) return "Earl";
  if (lower.includes("beavis") || lower.includes("butthead") || lower.includes("butt-head")) return "Beavis & Butthead";
  return "Council";
}

function MessageBubble({ text }: { text: string }) {
  const agent = detectAgent(text);
  const style = AGENT_STYLES[agent] ?? { border: "border-l-zinc-300", label: "text-zinc-400", dot: "bg-zinc-300" };

  return (
    <div className={`border-l-2 pl-3 py-1 ${style.border}`}>
      <span className={`text-xs font-semibold uppercase tracking-wide ${style.label}`}>{agent}</span>
      <p className="mt-0.5 text-sm text-[var(--foreground)] whitespace-pre-wrap leading-relaxed">{text}</p>
    </div>
  );
}

function AgentLegend() {
  return (
    <div className="flex flex-wrap gap-3 text-xs">
      {Object.entries(AGENT_STYLES).map(([name, { dot, label }]) => (
        <span key={name} className={`flex items-center gap-1.5 font-medium ${label}`}>
          <span className={`inline-block w-2 h-2 rounded-full ${dot}`} />
          {name}
        </span>
      ))}
    </div>
  );
}

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function copyToClipboard(text: string) {
  await navigator.clipboard.writeText(text);
}

interface CouncilOutput {
  subject?: string;
  gradeLevel?: number;
  duration?: string;
  finalScopeAndSequence?: string;
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
  const output = job.output as CouncilOutput | null;

  // Auto-scroll council log as messages arrive
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [job.progress_message]);

  const isRunning = job.status === "running";
  const isComplete = job.status === "completed";
  const isFailed = job.status === "failed";

  // Parse council log messages — split on agent name prefixes
  const logMessages: string[] = job.progress_message
    ? [job.progress_message]
    : [];

  if (output?.councilLog) {
    const rawLines = output.councilLog.split("\n").filter((l) => l.trim());
    logMessages.push(...rawLines);
  }

  return (
    <div className="space-y-6">
      {/* Header status */}
      <div className="flex items-center justify-between">
        <AgentLegend />
        {output?.subject && (
          <p className="text-xs text-[var(--muted)]">
            {output.subject} — Grade {output.gradeLevel} — {output.duration}
          </p>
        )}
      </div>

      {/* Live council log */}
      <div className="bg-zinc-950 rounded-xl p-4 space-y-3 max-h-80 overflow-y-auto border border-zinc-800">
        <p className="text-xs text-zinc-500 uppercase tracking-wide font-medium">Council Session Log</p>
        {logMessages.length === 0 ? (
          <p className="text-xs text-zinc-600 italic">Waiting for the Council to convene…</p>
        ) : (
          logMessages.map((msg, i) => (
            <MessageBubble key={i} text={msg} />
          ))
        )}
        {isRunning && (
          <div className="flex items-center gap-2 pt-1">
            <div className="flex gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
            <span className="text-xs text-zinc-500">Council is deliberating…</span>
          </div>
        )}
        <div ref={logEndRef} />
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-[var(--muted)] mb-1">
          <span>{job.progress_message ?? "Queued"}</span>
          <span>{job.progress}%</span>
        </div>
        <div className="w-full bg-[var(--muted-surface)] rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-700 ${
              isComplete ? "bg-green-500" : isFailed ? "bg-red-500" : "bg-blue-500"
            }`}
            style={{ width: `${job.progress}%` }}
          />
        </div>
      </div>

      {/* Final output — only when complete */}
      {isComplete && output && (
        <div className="space-y-4">
          {/* Earl's operational assessment */}
          {output.operationalAssessment && (
            <div
              className={`rounded-xl p-4 border bg-amber-50 border-amber-200`}
            >
              <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide mb-1">
                Earl&apos;s Operational Assessment
              </p>
              <p className="text-sm font-medium text-[var(--foreground)]">{output.operationalAssessment}</p>
            </div>
          )}

          {/* Final scope & sequence */}
          {output.finalScopeAndSequence && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-[var(--muted)] uppercase tracking-wide">
                  Final Scope &amp; Sequence
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => copyToClipboard(output.finalScopeAndSequence!)}
                    className="inline-flex items-center gap-1 text-xs text-[var(--muted)] hover:text-[var(--foreground)] transition-colors"
                  >
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                  <button
                    onClick={() =>
                      downloadText(
                        `${output.subject ?? "curriculum"}-grade${output.gradeLevel}-scope.md`,
                        output.finalScopeAndSequence!
                      )
                    }
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

          {/* Earl's operational assessment (detail) */}
          {output.operationalAssessment && (
            <details className="group">
              <summary className="cursor-pointer text-xs font-semibold text-[var(--muted)] uppercase tracking-wide list-none flex items-center gap-1.5 hover:text-[var(--foreground)] transition-colors">
                <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
                Earl&apos;s Operational Assessment
              </summary>
              <pre className="mt-2 bg-amber-50 border border-amber-100 rounded-xl p-4 text-xs leading-relaxed overflow-auto max-h-64 whitespace-pre-wrap">
                {output.operationalAssessment}
              </pre>
            </details>
          )}

          {/* Beavis & Butthead's engagement report */}
          {output.engagementReport && (
            <details className="group">
              <summary className="cursor-pointer text-xs font-semibold text-[var(--muted)] uppercase tracking-wide list-none flex items-center gap-1.5 hover:text-[var(--foreground)] transition-colors">
                <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
                Beavis &amp; Butthead&apos;s Engagement Report
              </summary>
              <pre className="mt-2 bg-purple-50 border border-purple-100 rounded-xl p-4 text-xs leading-relaxed overflow-auto max-h-64 whitespace-pre-wrap">
                {output.engagementReport}
              </pre>
            </details>
          )}

          {/* Download full session */}
          <button
            onClick={() => {
              const full = [
                `# Council Session: ${output.subject} — Grade ${output.gradeLevel}`,
                `Generated: ${output.generatedAt ?? ""}`,
                `\n## Final Scope & Sequence\n${output.finalScopeAndSequence ?? ""}`,
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
