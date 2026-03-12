"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, HelpCircle, LogOut, Search, Settings2, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { navigationItems } from "@/lib/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { DebugPanel } from "@/components/debug-panel";

type ChapterhouseShellProps = {
  children: React.ReactNode;
};

export function ChapterhouseShell({ children }: ChapterhouseShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    router.push(`/documents?q=${encodeURIComponent(q)}`);
    setSearchQuery("");
    searchRef.current?.blur();
  }

  useEffect(() => {
    const client = getSupabaseBrowserClient();
    if (!client) return;
    client.auth.getUser().then(({ data }) => {
      if (data.user?.email) setUserEmail(data.user.email);
    });
  }, []);

  async function handleSignOut() {
    await fetch("/api/auth/signout", { method: "POST" });
    router.push("/login");
  }

  // Auth pages render without the shell
  if (pathname === "/login" || pathname.startsWith("/auth/")) {
    return <>{children}</>;
  }

  return (
    <div className="h-screen overflow-hidden bg-background">
      <div className="grid h-full lg:grid-cols-[280px_minmax(0,1fr)_320px]">
          <aside className="overflow-y-auto border-b border-border bg-sidebar/90 px-4 py-6 lg:border-b-0 lg:border-r lg:px-5">
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

            <Link
              href="/help"
              className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm transition ${
                pathname === "/help"
                  ? "border-accent/35 bg-accent/12 text-foreground shadow-sm"
                  : "border-transparent text-muted hover:border-border hover:bg-card/75 hover:text-foreground"
              }`}
            >
              <HelpCircle className={`h-4 w-4 ${pathname === "/help" ? "text-accent" : "text-muted"}`} />
              <span className="font-medium">Help Guide</span>
            </Link>

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

        <main className="flex min-h-0 min-w-0 flex-col border-b border-border/70 bg-background lg:border-b-0 lg:border-r">
          <div className="sticky top-0 z-10 border-b border-border/70 bg-background/80 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <form onSubmit={handleSearch} className="flex-1 xl:max-w-md">
                <div className="flex items-center gap-3 rounded-full border border-border bg-card/80 px-4 py-3 text-sm text-muted focus-within:border-accent/40 focus-within:text-foreground">
                  <Search className="h-4 w-4 shrink-0" />
                  <input
                    ref={searchRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search documents…"
                    className="flex-1 bg-transparent text-foreground placeholder:text-muted focus:outline-none"
                  />
                </div>
              </form>
              <div className="flex items-center gap-3 text-sm">
                <Link
                  href="/review-queue"
                  title="Review Queue"
                  className="rounded-full border border-border bg-card px-3 py-2 text-muted transition hover:bg-muted-surface hover:text-foreground"
                >
                  <Bell className="h-4 w-4" />
                </Link>
                <Link
                  href="/settings"
                  title="Settings"
                  className="rounded-full border border-border bg-card px-3 py-2 text-muted transition hover:bg-muted-surface hover:text-foreground"
                >
                  <Settings2 className="h-4 w-4" />
                </Link>
                <div className="rounded-full border border-border bg-card px-4 py-2 text-muted text-sm truncate max-w-[200px]">
                  {userEmail ?? "Chapterhouse"}
                </div>
                <button
                  onClick={handleSignOut}
                  title="Sign out"
                  className="rounded-full border border-border bg-card px-3 py-2 text-muted transition hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
        </main>

        <aside className="hidden overflow-y-auto bg-rail/70 px-5 py-6 lg:block">
          <div className="space-y-4">
            <div className="glass-panel rounded-3xl p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted">Build status</p>
              <div className="mt-4 space-y-3 text-sm">
                <Link href="/daily-brief" className="flex items-center gap-3 rounded-2xl border border-border/70 bg-muted-surface px-4 py-3 transition hover:border-accent/40 hover:text-accent">
                  <span className="status-dot bg-success shrink-0" />
                  <span>Daily Brief — live</span>
                </Link>
                <Link href="/research" className="flex items-center gap-3 rounded-2xl border border-border/70 bg-muted-surface px-4 py-3 transition hover:border-accent/40 hover:text-accent">
                  <span className="status-dot bg-success shrink-0" />
                  <span>Research — live</span>
                </Link>
                <Link href="/product-intelligence" className="flex items-center gap-3 rounded-2xl border border-border/70 bg-muted-surface px-4 py-3 transition hover:border-accent/40 hover:text-accent">
                  <span className="status-dot bg-success shrink-0" />
                  <span>Product Intel — live</span>
                </Link>
                <Link href="/documents" className="flex items-center gap-3 rounded-2xl border border-border/70 bg-muted-surface px-4 py-3 transition hover:border-accent/40 hover:text-accent">
                  <span className="status-dot bg-success shrink-0" />
                  <span>Documents — live</span>
                </Link>
                <Link href="/login" className="flex items-center gap-3 rounded-2xl border border-border/70 bg-muted-surface px-4 py-3 transition hover:border-accent/40 hover:text-accent">
                  <span className="status-dot bg-success shrink-0" />
                  <span>Auth — live</span>
                </Link>
              </div>
            </div>
          </div>
        </aside>
      </div>
      <DebugPanel />
    </div>
  );
}