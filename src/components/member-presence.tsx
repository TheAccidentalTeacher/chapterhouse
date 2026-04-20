"use client";

import { Check } from "lucide-react";

export type MemberInfo = {
  name: string;
  role: string;
  color: string;
};

export type MemberState = "idle" | "thinking" | "speaking" | "done";

type Props = {
  members: MemberInfo[];
  currentSpeaker: string | null;
  completedMembers: Set<string>;
  phase?: "opening" | "rebuttal" | null;
};

function getState(
  memberName: string,
  currentSpeaker: string | null,
  completedMembers: Set<string>,
): MemberState {
  if (currentSpeaker === memberName) return "speaking";
  if (completedMembers.has(memberName)) return "done";
  if (currentSpeaker && !completedMembers.has(memberName)) return "thinking";
  return "idle";
}

export function MemberPresence({ members, currentSpeaker, completedMembers, phase }: Props) {
  if (members.length === 0) return null;

  return (
    <div className="rounded-2xl border border-border/40 bg-card/60 px-4 py-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-[11px] uppercase tracking-wider text-muted/70">
          {phase === "rebuttal" ? "Rebuttal Round" : "Council Convened"}
        </span>
        {currentSpeaker && (
          <span className="font-mono text-[11px] text-muted/60">
            {completedMembers.size} / {members.length} spoken
          </span>
        )}
      </div>
      <div className="flex items-stretch gap-3 overflow-x-auto">
        {members.map((m) => {
          const state = getState(m.name, currentSpeaker, completedMembers);
          return (
            <div
              key={m.name}
              className={`group flex min-w-0 flex-1 items-center gap-2.5 rounded-xl border px-3 py-2 transition-all duration-300 ${
                state === "speaking"
                  ? "border-transparent"
                  : state === "thinking"
                  ? "border-border/40 bg-card/40"
                  : state === "done"
                  ? "border-border/20 bg-card/30"
                  : "border-border/20 bg-card/20"
              }`}
              style={
                state === "speaking"
                  ? { borderColor: m.color + "66", backgroundColor: m.color + "12" }
                  : {}
              }
            >
              {/* Sigil */}
              <div
                className={`relative flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg font-mono text-sm font-semibold transition-all duration-300 ${
                  state === "idle" ? "opacity-35" : state === "done" ? "opacity-55" : "opacity-100"
                }`}
                style={{
                  backgroundColor: m.color + (state === "speaking" ? "22" : "12"),
                  color: m.color,
                }}
              >
                {m.name[0]}
                {state === "thinking" && (
                  <span
                    className="absolute inset-0 rounded-lg animate-ping"
                    style={{ backgroundColor: m.color + "33" }}
                  />
                )}
                {state === "done" && (
                  <span
                    className="absolute -bottom-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-background"
                    style={{ color: m.color }}
                  >
                    <Check className="h-2.5 w-2.5" strokeWidth={3} />
                  </span>
                )}
              </div>

              {/* Name + state */}
              <div className="flex min-w-0 flex-1 flex-col">
                <span
                  className={`truncate text-xs font-medium transition-all ${
                    state === "idle" ? "text-muted/60" : state === "done" ? "text-muted/80" : "text-foreground"
                  }`}
                  style={state === "speaking" ? { color: m.color } : {}}
                >
                  {m.name}
                </span>
                <span className="truncate font-mono text-[10px] text-muted/50">
                  {state === "speaking" ? (
                    <span className="inline-flex items-center gap-1" style={{ color: m.color + "CC" }}>
                      <span className="flex h-1 w-1 rounded-full animate-pulse" style={{ backgroundColor: m.color }} />
                      speaking
                    </span>
                  ) : state === "thinking" ? (
                    "thinking…"
                  ) : state === "done" ? (
                    "done"
                  ) : (
                    "idle"
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
