import { ArrowRight, Bot, FileText, Sparkles } from "lucide-react";
import { PageFrame } from "@/components/page-frame";
import {
  activeAlerts,
  pinnedDocs,
  quickActions,
  recentWork,
  todayTasks,
} from "@/lib/mock-data";

export function HomeDashboard() {
  return (
    <PageFrame
      eyebrow="Chapterhouse"
      title="The operating center is live."
      description="This is the first real shell for Chapterhouse: a chat-first home base with room for briefs, documents, research, and execution. The intelligence engine is not wired yet, but the foundation is now real code instead of pure strategy prose."
      actions={
        <>
          <button className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted-surface">
            Open brief
          </button>
          <button className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition hover:opacity-90">
            Start MVP build
          </button>
        </>
      }
    >
      <section className="grid gap-6 xl:grid-cols-[1.45fr_0.9fr]">
        <div className="space-y-6">
          <div className="glass-panel chapterhouse-grid rounded-[2rem] p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-border/80 bg-card px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-muted">
                  <Bot className="h-3.5 w-3.5 text-accent" />
                  Chat-first workspace
                </div>
                <h2 className="max-w-2xl text-3xl font-semibold tracking-tight text-balance">
                  What changed today that matters for Next Chapter?
                </h2>
                <p className="max-w-2xl text-sm leading-7 text-muted sm:text-base">
                  The home screen will become the place where documents, briefs, and recent signals meet. For now, it gives the project a real shell and an honest starting posture.
                </p>
              </div>
              <Sparkles className="hidden h-6 w-6 shrink-0 text-accent sm:block" />
            </div>
            <div className="mt-6 rounded-[1.5rem] border border-border/80 bg-background/70 p-4 shadow-inner shadow-black/5">
              <div className="flex min-h-36 flex-col justify-between gap-4">
                <p className="text-sm leading-7 text-muted">
                  Try prompts like: compare a new source against our brand rules, summarize this week&apos;s ecommerce shifts, or identify the cleanest guide-product opportunity.
                </p>
                <div className="flex flex-wrap gap-2">
                  {quickActions.map((action) => (
                    <button
                      key={action}
                      className="rounded-full border border-border/80 bg-card px-3 py-2 text-sm text-foreground transition hover:border-accent/40 hover:text-accent"
                    >
                      {action}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="glass-panel rounded-3xl p-6">
              <h3 className="text-lg font-semibold">Recent work</h3>
              <ul className="mt-4 space-y-3 text-sm text-muted">
                {recentWork.map((item) => (
                  <li key={item} className="rounded-2xl border border-border/70 bg-muted-surface px-4 py-3">
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="glass-panel rounded-3xl p-6">
              <h3 className="text-lg font-semibold">Today&apos;s tasks</h3>
              <ul className="mt-4 space-y-3 text-sm text-muted">
                {todayTasks.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 rounded-2xl border border-border/70 bg-muted-surface px-4 py-3"
                  >
                    <span className="mt-1 status-dot bg-accent" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="glass-panel rounded-3xl p-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold">Active alerts</h3>
              <span className="rounded-full border border-border/70 bg-muted-surface px-3 py-1 text-xs font-medium text-muted">
                {activeAlerts.length} live
              </span>
            </div>
            <div className="mt-4 space-y-3">
              {activeAlerts.map((alert) => (
                <div key={alert.title} className="rounded-2xl border border-border/70 bg-muted-surface p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium">{alert.title}</p>
                    <span className="rounded-full bg-background/80 px-2.5 py-1 text-xs font-semibold text-muted">
                      {alert.severity}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted">{alert.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel rounded-3xl p-6">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold">Pinned docs</h3>
              <FileText className="h-4 w-4 text-accent" />
            </div>
            <div className="mt-4 space-y-2">
              {pinnedDocs.map((doc) => (
                <div
                  key={doc}
                  className="flex items-center justify-between rounded-2xl border border-border/70 bg-muted-surface px-4 py-3 text-sm"
                >
                  <span>{doc}</span>
                  <ArrowRight className="h-4 w-4 text-muted" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </PageFrame>
  );
}