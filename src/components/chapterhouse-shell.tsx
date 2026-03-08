"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Search, Settings2, Sparkles } from "lucide-react";
import { navigationItems } from "@/lib/navigation";

type ChapterhouseShellProps = {
  children: React.ReactNode;
};

export function ChapterhouseShell({ children }: ChapterhouseShellProps) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background">
      <div className="grid min-h-screen lg:grid-cols-[280px_minmax(0,1fr)_320px]">
        <aside className="border-b border-border bg-sidebar/90 px-4 py-6 lg:border-b-0 lg:border-r lg:px-5">
          <div className="mx-auto flex h-full max-w-sm flex-col gap-6">
            <div className="rounded-3xl border border-border bg-card/80 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent text-accent-foreground shadow-lg shadow-accent/25">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted">
                    Chapterhouse
                  </p>
                  <h1 className="text-lg font-semibold">Internal operating system</h1>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-muted">
                Research, briefs, documents, and decisions in one place.
              </p>
            </div>

            <nav className="space-y-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block rounded-2xl border px-4 py-3 transition ${
                      isActive
                        ? "border-accent/35 bg-accent/12 text-foreground shadow-sm"
                        : "border-transparent bg-transparent text-muted hover:border-border hover:bg-card/75 hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={`mt-0.5 h-4 w-4 ${isActive ? "text-accent" : "text-muted"}`} />
                      <div>
                        <p className="font-medium">{item.label}</p>
                        <p className="mt-1 text-xs leading-5 text-muted">{item.description}</p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto space-y-3 rounded-3xl border border-border bg-card/80 p-5 text-sm text-muted">
              <div className="flex items-center justify-between">
                <span>Workspace</span>
                <span className="rounded-full bg-muted-surface px-2.5 py-1 text-xs font-medium text-foreground">
                  Somers Family
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>Sync status</span>
                <span className="inline-flex items-center gap-2 text-foreground">
                  <span className="status-dot bg-success" />
                  Local shell ready
                </span>
              </div>
            </div>
          </div>
        </aside>

        <main className="min-w-0 border-b border-border/70 bg-background lg:border-b-0 lg:border-r">
          <div className="sticky top-0 z-10 border-b border-border/70 bg-background/80 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center gap-3 rounded-full border border-border bg-card/80 px-4 py-3 text-sm text-muted">
                <Search className="h-4 w-4" />
                Search docs, sources, tasks, opportunities, and chats
              </div>
              <div className="flex items-center gap-3 text-sm">
                <button className="rounded-full border border-border bg-card px-3 py-2 text-muted transition hover:bg-muted-surface hover:text-foreground">
                  <Bell className="h-4 w-4" />
                </button>
                <button className="rounded-full border border-border bg-card px-3 py-2 text-muted transition hover:bg-muted-surface hover:text-foreground">
                  <Settings2 className="h-4 w-4" />
                </button>
                <div className="rounded-full border border-border bg-card px-4 py-2 text-muted">
                  Scott · internal alpha
                </div>
              </div>
            </div>
          </div>
          {children}
        </main>

        <aside className="hidden bg-rail/70 px-5 py-6 lg:block">
          <div className="sticky top-6 space-y-4">
            <div className="glass-panel rounded-3xl p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Build status</p>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-muted-surface px-4 py-3">
                  <span className="status-dot bg-success shrink-0" />
                  <span className="text-muted">Daily Brief — live</span>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-muted-surface px-4 py-3">
                  <span className="status-dot bg-muted shrink-0" />
                  <span className="text-muted">Auth — not yet</span>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-muted-surface px-4 py-3">
                  <span className="status-dot bg-muted shrink-0" />
                  <span className="text-muted">Research — not yet</span>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-muted-surface px-4 py-3">
                  <span className="status-dot bg-muted shrink-0" />
                  <span className="text-muted">Documents — not yet</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}