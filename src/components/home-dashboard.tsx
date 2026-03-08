import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { PageFrame } from "@/components/page-frame";

const readySections = [
  {
    label: "Daily Brief",
    href: "/daily-brief",
    description: "Morning intelligence pulled from Supabase. The first live data slice.",
    live: true,
  },
  {
    label: "Research",
    href: "/research",
    description: "Source ingestion and signal scoring. Coming next.",
    live: false,
  },
  {
    label: "Documents",
    href: "/documents",
    description: "Brand memory and operating references. Coming next.",
    live: false,
  },
];

export function HomeDashboard() {
  return (
    <PageFrame
      eyebrow="Chapterhouse"
      title="Good morning, Scott."
      description="Your internal operating system for Next Chapter. One real slice is live — the Daily Brief reads from the database. Everything else comes next."
    >
      <div className="space-y-4">
        {readySections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="group flex items-center justify-between rounded-3xl border border-border bg-card/80 px-6 py-5 transition hover:border-accent/40 hover:bg-card"
          >
            <div className="flex items-center gap-4">
              <div className={`flex h-10 w-10 items-center justify-center rounded-2xl ${
                section.live ? "bg-accent text-accent-foreground shadow-lg shadow-accent/25" : "bg-muted-surface text-muted"
              }`}>
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <p className="font-semibold">{section.label}</p>
                  {section.live ? (
                    <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-semibold text-accent">
                      Live
                    </span>
                  ) : (
                    <span className="rounded-full bg-muted-surface px-2.5 py-0.5 text-xs font-medium text-muted">
                      Coming next
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-muted">{section.description}</p>
              </div>
            </div>
            <ArrowRight className="h-4 w-4 text-muted transition group-hover:text-accent" />
          </Link>
        ))}
      </div>
    </PageFrame>
  );
}