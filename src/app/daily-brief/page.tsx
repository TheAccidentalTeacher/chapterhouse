import { PageFrame } from "@/components/page-frame";
import { NewBriefPanel } from "@/components/new-brief-panel";
import { BriefItemCard } from "@/components/brief-item-card";
import { getLatestDailyBrief } from "@/lib/daily-brief";

const RSS_FEEDS = [
  "Anthropic Blog",
  "OpenAI Blog",
  "GitHub Changelog",
  "Vercel Blog",
  "Hacker News Top 10",
  "The Homeschool Mom",
  "Shopify News",
  "The Gospel Coalition",
  "Hechinger Report",
];

const GITHUB_REPOS = [
  "roleplaying",
  "chapterhouse",
  "NextChapterHomeschool",
  "agentsvercel",
  "arms-of-deliverance",
  "BibleSAAS",
  "talesofoldendays",
  "1stgradescienceexample",
  "FoodHistory",
  "mythology",
  "2026worksheets",
];

export default async function DailyBriefPage() {
  const brief = await getLatestDailyBrief();

  return (
    <PageFrame
      eyebrow="Daily Brief"
      title="Morning intelligence, ready for action."
      description="Latest brief from Supabase. Use Generate to create a new one with AI, or write one manually."
      actions={
        <>
          <span className="rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            Source: {brief.source === "supabase" ? "Supabase" : "Mock fallback"}
          </span>
          {brief.asOf ? (
            <span className="rounded-full bg-accent px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-accent-foreground">
              As of {brief.asOf}
            </span>
          ) : null}
          {brief.sourceCount > 0 ? (
            <span className="rounded-full border border-border bg-card px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted">
              {brief.sourceCount} items scanned
            </span>
          ) : null}
        </>
      }
    >
      <NewBriefPanel />
      <div className="grid gap-4 xl:grid-cols-[1.45fr_0.9fr]">
        <div className="space-y-4">
          {brief.summary ? (
            <section className="glass-panel rounded-3xl p-6">
              <h2 className="text-lg font-semibold">Summary</h2>
              <p className="mt-3 text-sm leading-7 text-muted">{brief.summary}</p>
            </section>
          ) : null}

          {brief.sections.map((section) => (
            <section key={section.title} className="glass-panel rounded-3xl p-6">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">{section.title}</h2>
                <span className="rounded-full bg-muted-surface px-3 py-1 text-xs font-medium text-muted">
                  {section.items.length} item{section.items.length === 1 ? "" : "s"}
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {section.items.map((item) => (
                  <BriefItemCard
                    key={item.headline}
                    item={item}
                    sectionTitle={section.title}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* ── Right sidebar ── */}
        <div className="space-y-4">
          {/* Ingestion status — shows what the pipeline monitors */}
          <div className="glass-panel rounded-3xl p-6">
            <div className="flex items-center justify-between gap-2 mb-4">
              <h2 className="text-lg font-semibold">Ingestion pipeline</h2>
              <span className="rounded-full bg-green-500/15 px-2.5 py-1 text-xs font-semibold text-green-400">
                active
              </span>
            </div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted">
              RSS feeds ({RSS_FEEDS.length})
            </p>
            <ul className="mb-4 space-y-1">
              {RSS_FEEDS.map((feed) => (
                <li key={feed} className="flex items-center gap-2 text-xs text-muted">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-surface border border-border/70 shrink-0" />
                  {feed}
                </li>
              ))}
            </ul>
            <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted">
              GitHub repos ({GITHUB_REPOS.length})
            </p>
            <ul className="space-y-1">
              {GITHUB_REPOS.map((repo) => (
                <li key={repo} className="flex items-center gap-2 text-xs text-muted font-mono">
                  <span className="h-1.5 w-1.5 rounded-full bg-muted-surface border border-border/70 shrink-0" />
                  {repo}
                </li>
              ))}
            </ul>
          </div>

          {/* Last brief stats */}
          <div className="glass-panel rounded-3xl p-6">
            <h2 className="mb-4 text-lg font-semibold">Last brief stats</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Source</dt>
                <dd className="font-medium">{brief.source === "supabase" ? "Supabase ✓" : "Mock fallback"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Date</dt>
                <dd className="font-medium">{brief.asOf ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Items scanned</dt>
                <dd className="font-medium">{brief.sourceCount > 0 ? brief.sourceCount : "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Sections</dt>
                <dd className="font-medium">{brief.sections.length}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Total items</dt>
                <dd className="font-medium">{brief.sections.reduce((n, s) => n + s.items.length, 0)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Cron schedule</dt>
                <dd className="font-medium font-mono text-xs">0 15 * * * UTC</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">= Alaska time</dt>
                <dd className="font-medium">7:00am AKST</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Model</dt>
                <dd className="font-medium text-xs">claude-sonnet-4-6</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </PageFrame>
  );
}
