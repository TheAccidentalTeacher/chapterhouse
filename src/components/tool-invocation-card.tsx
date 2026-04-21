"use client";

import { CheckCircle2, AlertCircle, Loader2, Search, Users, FileText, Megaphone, ImageIcon, Volume2, Globe } from "lucide-react";
import { ReasoningTrace, type TraceStep } from "@/components/reasoning-trace";
import { INTENT_LABELS, type IntentType } from "@/lib/intent-detection";

type Status = "detected" | "running" | "complete" | "error";

type Props = {
  intentType: IntentType;
  subject?: string;
  status: Status;
  trace: TraceStep[];
  resultSummary?: string;
  resultLink?: string;
  error?: string;
};

const INTENT_ICONS: Record<IntentType, React.ComponentType<{ className?: string }>> = {
  deep_research: Search,
  council_quick: Users,
  doc_generate: FileText,
  social_generate: Megaphone,
  image_generate: ImageIcon,
  voice_synth: Volume2,
  intel_fetch: Globe,
};

export function ToolInvocationCard({
  intentType,
  subject,
  status,
  trace,
  resultSummary,
  resultLink,
  error,
}: Props) {
  const Icon = INTENT_ICONS[intentType];

  return (
    <div className="rounded-2xl border border-accent/20 bg-card/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border/30 bg-accent/5 px-4 py-3">
        <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-accent/15 text-accent">
          <Icon className="h-4 w-4" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="text-[11px] uppercase tracking-wider text-accent/70">
            {INTENT_LABELS[intentType]}
          </span>
          {subject && (
            <span className="truncate text-sm text-foreground/85">{subject}</span>
          )}
        </div>
        <div className="flex-shrink-0">
          {status === "detected" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-accent/70">
              Preparing
            </span>
          )}
          {status === "running" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-accent">
              <Loader2 className="h-3 w-3 animate-spin" />
              Running
            </span>
          )}
          {status === "complete" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-emerald-400">
              <CheckCircle2 className="h-3 w-3" />
              Complete
            </span>
          )}
          {status === "error" && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-red-400">
              <AlertCircle className="h-3 w-3" />
              Error
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-4 space-y-3">
        {/* Reasoning trace during running/complete */}
        {(status === "running" || status === "complete") && trace.length > 0 && (
          <ReasoningTrace steps={trace} streaming={status === "running"} collapsed={status === "complete"} />
        )}

        {/* Result summary */}
        {status === "complete" && resultSummary && (
          <div className="rounded-lg border border-border/30 bg-background/40 px-4 py-3">
            <div className="mb-1 text-[10px] uppercase tracking-wider text-muted/60">Result</div>
            <div className="text-sm text-foreground/85 leading-relaxed whitespace-pre-wrap">
              {resultSummary}
            </div>
            {resultLink && (
              <a
                href={resultLink}
                className="mt-2 inline-flex items-center gap-1.5 text-xs text-accent hover:underline"
              >
                Open full result →
              </a>
            )}
          </div>
        )}

        {/* Error */}
        {status === "error" && error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}
