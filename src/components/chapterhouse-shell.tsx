"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Bell, ChevronDown, HelpCircle, LogOut, Search, Settings2, Sparkles, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { navigationGroups } from "@/lib/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase";
import { DebugPanel } from "@/components/debug-panel";
import { installDebugInterceptors } from "@/lib/debug-interceptor";

type ChapterhouseShellProps = {
  children: React.ReactNode;
};

export function ChapterhouseShell({ children }: ChapterhouseShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const [searchResults, setSearchResults] = useState<Array<{ id: string; type: string; title: string; snippet: string; status?: string; date: string }> | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchDropdownRef = useRef<HTMLDivElement>(null);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    navigationGroups.forEach((g) => { initial[g.id] = g.defaultOpen ?? false; });
    return initial;
  });
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [tooltipRect, setTooltipRect] = useState<DOMRect | null>(null);
  const [mounted, setMounted] = useState(false);
  const [statusCollapsed, setStatusCollapsed] = useState(true);

  useEffect(() => {
    setMounted(true);
    installDebugInterceptors();
  }, []);

  // Auto-open group containing the active route
  useEffect(() => {
    for (const group of navigationGroups) {
      if (group.items.some((item) => item.href === pathname)) {
        setOpenGroups((prev) => ({ ...prev, [group.id]: true }));
        break;
      }
    }
  }, [pathname]);

  function toggleGroup(id: string) {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    setSearchLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((data) => setSearchResults(data.results ?? []))
      .catch(() => setSearchResults([]))
      .finally(() => setSearchLoading(false));
  }

  function clearSearch() {
    setSearchQuery("");
    setSearchResults(null);
    searchRef.current?.blur();
  }

  // Close search dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (searchDropdownRef.current && !searchDropdownRef.current.contains(e.target as Node) &&
          searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchResults(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const typeRoutes: Record<string, string> = {
    task: "/tasks",
    research: "/research",
    opportunity: "/product-intelligence",
    thread: "/",
    brief: "/daily-brief",
  };

  const typeLabels: Record<string, string> = {
    task: "Task",
    research: "Research",
    opportunity: "Opportunity",
    thread: "Chat",
    brief: "Brief",
  };

  const typeColors: Record<string, string> = {
    task: "bg-sky-500/20 text-sky-400",
    research: "bg-emerald-500/20 text-emerald-400",
    opportunity: "bg-amber-500/20 text-amber-400",
    thread: "bg-purple-500/20 text-purple-400",
    brief: "bg-cyan-500/20 text-cyan-400",
  };

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
      <div className="grid h-full lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="overflow-y-auto border-b border-border bg-sidebar/90 px-4 py-6 lg:border-b-0 lg:border-r lg:px-5">
          <div className="mx-auto flex h-full max-w-sm flex-col gap-6">
            <div className="rounded-3xl border border-border bg-card/80 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl metallic-accent text-accent-foreground shadow-lg shadow-accent/30">
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

            <nav className="space-y-3">
              {navigationGroups.map((group) => {
                const isOpen = openGroups[group.id] ?? false;
                const hasActiveItem = group.items.some((item) => item.href === pathname);

                return (
                  <div key={group.id}>
                    <button
                      onClick={() => toggleGroup(group.id)}
                      className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition ${
                        hasActiveItem ? "text-accent" : "text-muted hover:text-foreground"
                      }`}
                    >
                      {group.label}
                      <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? "rotate-0" : "-rotate-90"}`} />
                    </button>

                    {isOpen && (
                      <div className="mt-1 space-y-0.5">
                        {group.items.map((item) => {
                          const Icon = item.icon;
                          const isActive = pathname === item.href;
                          const isHovered = hoveredItem === item.href;

                          return (
                            <div key={item.href} className="relative">
                              <Link
                                href={item.href}
                                onMouseEnter={(e) => {
                                  setHoveredItem(item.href);
                                  setTooltipRect(e.currentTarget.getBoundingClientRect());
                                }}
                                onMouseLeave={() => {
                                  setHoveredItem(null);
                                  setTooltipRect(null);
                                }}
                                className={`block rounded-2xl border px-4 py-2.5 transition ${
                                  isActive
                                    ? "border-accent/35 bg-accent/12 text-foreground shadow-sm"
                                    : "border-transparent bg-transparent text-muted hover:border-border hover:bg-card/75 hover:text-foreground"
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${isActive ? "text-accent" : "text-muted"}`} />
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p className="font-medium text-sm">{item.label}</p>
                                      {item.status === "partial" && (
                                        <span className="rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-medium text-amber-400">
                                          beta
                                        </span>
                                      )}
                                      {item.status === "planned" && (
                                        <span className="rounded-full bg-sky-500/15 px-1.5 py-0.5 text-[10px] font-medium text-sky-400">
                                          soon
                                        </span>
                                      )}
                                    </div>
                                    <p className="mt-0.5 text-xs leading-5 text-muted truncate">{item.description}</p>
                                  </div>
                                </div>
                              </Link>

                              {/* Tooltip renders via portal below */}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
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

            {/* System Status — collapsible at bottom of sidebar */}
            <div className="rounded-2xl border border-border/50 bg-card/60 overflow-hidden">
              <button
                onClick={() => setStatusCollapsed((prev) => !prev)}
                className="flex w-full items-center justify-between px-4 py-3 text-xs font-semibold uppercase tracking-[0.15em] text-muted hover:text-foreground transition-colors"
              >
                <span>System Status</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${statusCollapsed ? "" : "rotate-180"}`} />
              </button>
              {!statusCollapsed && (
                <div className="px-3 pb-3 space-y-1">
                  {navigationGroups.flatMap((g) => g.items).map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-xs text-muted hover:text-foreground transition-colors"
                    >
                      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                        item.status === "live" ? "bg-success" : item.status === "partial" ? "bg-amber-400" : "bg-sky-400"
                      }`} />
                      <span className="truncate flex-1">{item.label}</span>
                      {item.status !== "live" && (
                        <span className={`text-[10px] font-medium ${
                          item.status === "partial" ? "text-amber-400" : "text-sky-400"
                        }`}>{item.status}</span>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div
              className="mt-auto space-y-3 rounded-3xl border border-border bg-card/80 p-5 text-sm text-muted"
              title="Your Chapterhouse workspace identity and connection status. Green dot = Supabase connected and ready."
            >
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
              <div className="relative flex-1 xl:max-w-md">
                <form onSubmit={handleSearch}>
                  <div className="flex items-center gap-3 rounded-full border border-border bg-card/80 px-4 py-3 text-sm text-muted focus-within:border-accent/40 focus-within:text-foreground">
                    <Search className="h-4 w-4 shrink-0" />
                    <input
                      ref={searchRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search everything…"
                      className="flex-1 bg-transparent text-foreground placeholder:text-muted focus:outline-none"
                    />
                    {searchQuery && (
                      <button type="button" onClick={clearSearch} className="text-muted hover:text-foreground">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </form>
                {searchResults !== null && (
                  <div ref={searchDropdownRef} className="absolute left-0 right-0 top-full z-50 mt-2 max-h-80 overflow-y-auto rounded-lg border border-border bg-card shadow-xl">
                    {searchLoading ? (
                      <div className="px-4 py-3 text-sm text-muted">Searching…</div>
                    ) : searchResults.length === 0 ? (
                      <div className="px-4 py-3 text-sm text-muted">No results found</div>
                    ) : (
                      searchResults.map((r) => (
                        <button
                          key={`${r.type}-${r.id}`}
                          onClick={() => { router.push(typeRoutes[r.type] ?? "/"); clearSearch(); }}
                          className="flex w-full items-start gap-3 border-b border-border/50 px-4 py-3 text-left transition last:border-0 hover:bg-muted-surface"
                        >
                          <span className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${typeColors[r.type] ?? "bg-zinc-500/20 text-zinc-400"}`}>
                            {typeLabels[r.type] ?? r.type}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-medium text-foreground">{r.title}</div>
                            {r.snippet && <div className="mt-0.5 truncate text-xs text-muted">{r.snippet}</div>}
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
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


      </div>

      {/* Tooltip portal — renders outside sidebar overflow context */}
      {mounted && hoveredItem && tooltipRect && (() => {
        const item = navigationGroups.flatMap(g => g.items).find(i => i.href === hoveredItem);
        if (!item?.tooltip) return null;
        return createPortal(
          <div
            className="pointer-events-none fixed z-[9999] w-80 rounded-2xl border border-border bg-card p-4 text-xs leading-5 text-muted shadow-xl shadow-black/30"
            style={{
              top: tooltipRect.top,
              left: tooltipRect.right + 12,
            }}
          >
            <p className="mb-2 font-semibold text-foreground">{item.label}</p>
            <p className="mb-3 leading-relaxed">{item.tooltip.summary}</p>
            {item.tooltip.features.length > 0 && (
              <>
                <p className="mb-1 font-semibold text-foreground/80 text-[10px] uppercase tracking-wider">What it does</p>
                <ul className="mb-3 space-y-0.5">
                  {item.tooltip.features.map((f, i) => (
                    <li key={i} className="flex gap-1.5">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent/60" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
            {item.tooltip.tips.length > 0 && (
              <>
                <p className="mb-1 font-semibold text-amber-400/80 text-[10px] uppercase tracking-wider">Testing tips</p>
                <ul className="space-y-0.5">
                  {item.tooltip.tips.map((t, i) => (
                    <li key={i} className="flex gap-1.5">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-amber-400/60" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>,
          document.body
        );
      })()}



      <DebugPanel />
    </div>
  );
}