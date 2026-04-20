"use client";

import { useEffect, useState } from "react";

export type TraceStepType =
  | "decompose"
  | "search"
  | "read"
  | "cross-reference"
  | "synthesize"
  | "compose";

export type TraceStep = {
  step_type: TraceStepType;
  label: string;
  detail?: string;
  status: "active" | "complete";
  timestamp?: number;
};

type Props = {
  steps: TraceStep[];
  streaming: boolean;
  collapsed?: boolean;
  className?: string;
};

const STEP_ICONS: Record<TraceStepType, string> = {
  decompose: "◆",
  search: "◈",
  read: "◇",
  "cross-reference": "⇄",
  synthesize: "✦",
  compose: "◎",
};

const STEP_LABELS: Record<TraceStepType, string> = {
  decompose: "parse",
  search: "search",
  read: "read",
  "cross-reference": "compare",
  synthesize: "synthesize",
  compose: "compose",
};

export function ReasoningTrace({ steps, streaming, collapsed = false, className = "" }: Props) {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    if (steps.length <= visibleCount) return;
    const timeout = setTimeout(() => setVisibleCount(steps.length), 50);
    return () => clearTimeout(timeout);
  }, [steps.length, visibleCount]);

  if (steps.length === 0 && !streaming) return null;

  const progressPct = streaming
    ? Math.min(90, steps.length * 12 + (steps.some((s) => s.status === "active") ? 6 : 0))
    : 100;

  return (
    <div
      className={`relative rounded-xl border border-accent/10 bg-[#161208] transition-opacity duration-500 ${
        collapsed ? "opacity-40" : "opacity-100"
      } ${className}`}
    >
      <div className="p-5 pb-6 space-y-3">
        {steps.map((step, idx) => {
          const isVisible = idx < visibleCount;
          const isActive = step.status === "active";
          const isComplete = step.status === "complete";
          return (
            <div
              key={`${idx}-${step.label}`}
              className={`flex items-start gap-3 transition-all duration-400 ${
                isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
              }`}
              style={{ transitionDelay: isVisible ? `${Math.min(idx * 40, 240)}ms` : "0ms" }}
            >
              <span
                className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center text-xs font-normal ${
                  isActive ? "text-accent animate-pulse" : isComplete ? "text-accent/60" : "text-foreground/30"
                }`}
              >
                {STEP_ICONS[step.step_type]}
              </span>
              <div className="flex-1 min-w-0">
                <div
                  className={`font-mono text-[12px] leading-relaxed ${
                    isActive ? "text-foreground/85" : isComplete ? "text-foreground/50" : "text-foreground/35"
                  }`}
                >
                  <span className="inline-block rounded bg-accent/5 px-1.5 py-0.5 mr-2 text-[10px] uppercase tracking-wider text-accent/60">
                    {STEP_LABELS[step.step_type]}
                  </span>
                  {step.label}
                </div>
                {step.detail && (
                  <div className="mt-0.5 font-mono text-[11px] text-accent/40">{step.detail}</div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent/5 rounded-b-xl overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-accent to-accent/30 transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>
    </div>
  );
}
