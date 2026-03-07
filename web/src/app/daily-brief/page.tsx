import { PageFrame } from "@/components/page-frame";
import { dailyBriefSections } from "@/lib/mock-data";

export default function DailyBriefPage() {
  return (
    <PageFrame
      eyebrow="Daily Brief"
      title="Morning intelligence, ready for action."
      description="This is the first vertical slice target. It will become the place where Chapterhouse assembles fresh signals, ranks what matters, and routes action without making you swim through raw internet sludge."
      actions={
        <>
          <button className="rounded-full border border-border bg-card px-4 py-2 text-sm font-medium transition hover:bg-muted-surface">
            Regenerate brief
          </button>
          <button className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition hover:opacity-90">
            Review actions
          </button>
        </>
      }
    >
      <div className="grid gap-4 xl:grid-cols-[1.45fr_0.9fr]">
        <div className="space-y-4">
          {dailyBriefSections.map((section) => (
            <section key={section.title} className="glass-panel rounded-3xl p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">{section.title}</h2>
                <span className="rounded-full bg-muted-surface px-3 py-1 text-xs font-medium text-muted">
                  {section.items.length} item{section.items.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {section.items.map((item) => (
                  <article key={item.headline} className="rounded-2xl border border-border/70 bg-muted-surface p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h3 className="font-medium text-balance">{item.headline}</h3>
                      <span className="rounded-full bg-background/80 px-2.5 py-1 text-xs font-semibold text-muted">
                        {item.score}
                      </span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted">{item.whyItMatters}</p>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted">
                      <span className="rounded-full border border-border/70 px-2.5 py-1">
                        {item.sources} sources
                      </span>
                      <span className="rounded-full border border-border/70 px-2.5 py-1">
                        Convert to task
                      </span>
                      <span className="rounded-full border border-border/70 px-2.5 py-1">
                        Send to review
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="space-y-4">
          <div className="glass-panel rounded-3xl p-6">
            <h2 className="text-lg font-semibold">Today&apos;s action posture</h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-muted">
              <li className="rounded-2xl border border-border/70 bg-muted-surface px-4 py-3">
                Review store-facing opportunities before adding more ingestion feeds.
              </li>
              <li className="rounded-2xl border border-border/70 bg-muted-surface px-4 py-3">
                Validate source quality before automating any downstream actions.
              </li>
              <li className="rounded-2xl border border-border/70 bg-muted-surface px-4 py-3">
                Keep the brief opinionated, not encyclopedic.
              </li>
            </ul>
          </div>
          <div className="glass-panel rounded-3xl p-6">
            <h2 className="text-lg font-semibold">Citation rail preview</h2>
            <p className="mt-4 text-sm leading-7 text-muted">
              This area will show source cards, confidence notes, and linked opportunities once retrieval and persistence are wired in.
            </p>
          </div>
        </div>
      </div>
    </PageFrame>
  );
}