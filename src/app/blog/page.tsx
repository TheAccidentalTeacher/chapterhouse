"use client";
import { useState, useEffect, useCallback } from "react";
import { PageFrame } from "@/components/page-frame";
import { logEvent } from "@/lib/debug-log";
import {
  CalendarDays,
  List,
  Loader2,
  Sparkles,
  Save,
  Send,
  FileText,
  Trash2,
  ChevronDown,
  ChevronUp,
  Tag,
  ExternalLink,
  RefreshCw,
} from "lucide-react";

/* ──────────────────────────── Types ────────────────────────────── */

type CalendarEntry = {
  target_date: string;
  post_type: "sales" | "authority" | "holiday" | "seasonal";
  topic_seed: string;
  title: string;
  seo_keywords: string[];
  product_references: string[];
};

type BlogPost = {
  id: string;
  target_date: string;
  post_type: string;
  topic_seed: string;
  title: string | null;
  slug: string | null;
  body: string | null;
  excerpt: string | null;
  tags: string[] | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string[] | null;
  product_references: string[] | null;
  status: string;
  shopify_article_id: string | null;
  shopify_article_url: string | null;
  published_at: string | null;
  calendar_month: string | null;
  created_at: string;
  updated_at: string;
};

/* ──────────────────────────── Helpers ───────────────────────────── */

const TYPE_COLORS: Record<string, string> = {
  sales: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  authority: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  holiday: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  seasonal: "bg-purple-500/20 text-purple-400 border-purple-500/30",
};

const STATUS_COLORS: Record<string, string> = {
  planned: "bg-zinc-600/30 text-zinc-400",
  drafting: "bg-yellow-500/20 text-yellow-400",
  draft: "bg-blue-500/20 text-blue-400",
  review: "bg-orange-500/20 text-orange-400",
  published: "bg-emerald-500/20 text-emerald-400",
  rejected: "bg-red-500/20 text-red-400",
};

function formatDate(d: string) {
  return new Date(d + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function monthLabel(m: string) {
  const [y, mo] = m.split("-");
  const d = new Date(Number(y), Number(mo) - 1);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

/* ──────────────────────────── Tabs ──────────────────────────────── */

const TABS = [
  { id: "calendar", label: "Calendar", icon: CalendarDays },
  { id: "posts", label: "Posts", icon: List },
] as const;

type TabId = (typeof TABS)[number]["id"];

/* ──────────────────────────── Main Page ─────────────────────────── */

export default function BlogPage() {
  const [activeTab, setActiveTab] = useState<TabId>("calendar");

  useEffect(() => {
    logEvent("nav", "Blog · Page loaded");
  }, []);

  return (
    <PageFrame
      title="Blog Pipeline"
      description="Plan, draft, and publish blog posts to the NCHO Shopify store."
    >
      {/* Tab bar */}
      <div className="flex gap-1 border-b border-border/50 mb-6">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-md transition
              ${
                activeTab === tab.id
                  ? "bg-accent/10 text-foreground border-b-2 border-accent"
                  : "text-muted-foreground hover:text-foreground"
              }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "calendar" && <CalendarTab />}
      {activeTab === "posts" && <PostsTab />}
    </PageFrame>
  );
}

/* ──────────────────────── Calendar Tab ──────────────────────────── */

function CalendarTab() {
  const [month, setMonth] = useState(currentMonth);
  const [entries, setEntries] = useState<CalendarEntry[]>([]);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productCount, setProductCount] = useState<number | null>(null);

  async function generateCalendar() {
    setGenerating(true);
    setError(null);
    setEntries([]);
    setSaved(false);
    try {
      const res = await fetch("/api/blog/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ month }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Calendar generation failed (${res.status})`);
      }
      const data = await res.json();
      setEntries(data.entries ?? []);
      setProductCount(data.productCount ?? null);
      logEvent("info", "Calendar generated", { month, count: data.entries?.length });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setGenerating(false);
    }
  }

  async function saveCalendar() {
    if (!entries.length) return;
    setSaving(true);
    setError(null);
    try {
      const payload = entries.map((e) => ({
        target_date: e.target_date,
        post_type: e.post_type,
        topic_seed: e.topic_seed,
        title: e.title,
        seo_keywords: e.seo_keywords,
        product_references: e.product_references,
        calendar_month: month,
      }));
      const res = await fetch("/api/blog/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: payload }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Save failed (${res.status})`);
      }
      setSaved(true);
      logEvent("info", "Calendar saved", { month, count: entries.length });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  function removeEntry(idx: number) {
    setEntries((prev) => prev.filter((_, i) => i !== idx));
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            Month
          </label>
          <input
            type="month"
            value={month}
            onChange={(e) => {
              setMonth(e.target.value);
              setEntries([]);
              setSaved(false);
            }}
            className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-foreground"
          />
        </div>
        <button
          onClick={generateCalendar}
          disabled={generating}
          className="flex items-center gap-2 rounded-md bg-amber-600 px-4 py-1.5 text-sm font-medium text-zinc-900 hover:bg-amber-500 transition disabled:opacity-50"
        >
          {generating ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Sparkles size={14} />
          )}
          {generating ? "Generating…" : "Generate Calendar"}
        </button>

        {entries.length > 0 && !saved && (
          <button
            onClick={saveCalendar}
            disabled={saving}
            className="flex items-center gap-2 rounded-md bg-emerald-600 px-4 py-1.5 text-sm font-medium text-zinc-900 hover:bg-emerald-500 transition disabled:opacity-50"
          >
            {saving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} />
            )}
            {saving ? "Saving…" : "Save Calendar"}
          </button>
        )}
        {saved && (
          <span className="text-sm text-emerald-400">
            ✓ Saved {entries.length} posts as planned
          </span>
        )}
      </div>

      {productCount !== null && (
        <p className="text-xs text-muted-foreground">
          {productCount} active NCHO products available for sales posts
        </p>
      )}

      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Calendar entries */}
      {entries.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {monthLabel(month)} — {entries.length} posts planned
          </h3>
          <div className="grid gap-3">
            {entries.map((entry, idx) => (
              <div
                key={idx}
                className="flex items-start gap-4 rounded-lg border border-zinc-800 bg-zinc-900/60 p-4"
              >
                <div className="min-w-[80px] text-sm text-muted-foreground">
                  {formatDate(entry.target_date)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase ${TYPE_COLORS[entry.post_type] || TYPE_COLORS.authority}`}
                    >
                      {entry.post_type}
                    </span>
                    <span className="text-sm font-medium text-foreground">
                      {entry.title}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{entry.topic_seed}</p>
                  {entry.seo_keywords?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {entry.seo_keywords.map((kw) => (
                        <span
                          key={kw}
                          className="rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => removeEntry(idx)}
                  className="text-zinc-500 hover:text-red-400 transition"
                  title="Remove from calendar"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ──────────────────────── Posts Tab ─────────────────────────────── */

function PostsTab() {
  const [month, setMonth] = useState(currentMonth);
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, string>>({});

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/blog/posts?month=${month}`);
      if (!res.ok) throw new Error(`Failed to load posts (${res.status})`);
      const data = await res.json();
      setPosts(data.posts ?? []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  async function generateDraft(id: string) {
    setActionLoading((p) => ({ ...p, [id]: "drafting" }));
    try {
      const res = await fetch(`/api/blog/draft/${id}`, { method: "POST" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Draft generation failed (${res.status})`);
      }
      logEvent("info", "Draft generated", { postId: id });
      await fetchPosts();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setActionLoading((p) => {
        const next = { ...p };
        delete next[id];
        return next;
      });
    }
  }

  async function publishPost(id: string) {
    if (!confirm("Publish this post to the NCHO Shopify blog?")) return;
    setActionLoading((p) => ({ ...p, [id]: "publishing" }));
    try {
      const res = await fetch(`/api/blog/publish/${id}`, { method: "POST" });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || `Publish failed (${res.status})`);
      }
      logEvent("info", "Post published to Shopify", { postId: id });
      await fetchPosts();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setActionLoading((p) => {
        const next = { ...p };
        delete next[id];
        return next;
      });
    }
  }

  async function deletePost(id: string) {
    if (!confirm("Delete this post? This cannot be undone.")) return;
    setActionLoading((p) => ({ ...p, [id]: "deleting" }));
    try {
      const res = await fetch(`/api/blog/posts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Delete failed (${res.status})`);
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setActionLoading((p) => {
        const next = { ...p };
        delete next[id];
        return next;
      });
    }
  }

  const statusCounts = posts.reduce<Record<string, number>>((acc, p) => {
    acc[p.status] = (acc[p.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">
            Month
          </label>
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-foreground"
          />
        </div>
        <button
          onClick={fetchPosts}
          disabled={loading}
          className="flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* Stats bar */}
      {posts.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {Object.entries(statusCounts).map(([status, count]) => (
            <span
              key={status}
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[status] || STATUS_COLORS.planned}`}
            >
              {count} {status}
            </span>
          ))}
          <span className="text-xs text-muted-foreground self-center">
            {posts.length} total
          </span>
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {loading && !posts.length && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
          <Loader2 size={16} className="animate-spin" />
          Loading posts…
        </div>
      )}

      {!loading && posts.length === 0 && (
        <div className="text-center py-12 text-muted-foreground text-sm">
          No posts for {monthLabel(month)}. Generate a calendar first.
        </div>
      )}

      {/* Post list */}
      <div className="space-y-2">
        {posts.map((post) => {
          const isExpanded = expandedId === post.id;
          const action = actionLoading[post.id];

          return (
            <div
              key={post.id}
              className="rounded-lg border border-zinc-800 bg-zinc-900/60 overflow-hidden"
            >
              {/* Row header */}
              <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-zinc-800/40 transition"
                onClick={() => setExpandedId(isExpanded ? null : post.id)}
              >
                <div className="min-w-[80px] text-sm text-muted-foreground">
                  {formatDate(post.target_date)}
                </div>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase shrink-0 ${TYPE_COLORS[post.post_type] || TYPE_COLORS.authority}`}
                >
                  {post.post_type}
                </span>
                <span className="text-sm font-medium text-foreground truncate flex-1">
                  {post.title || post.topic_seed}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_COLORS[post.status] || STATUS_COLORS.planned}`}
                >
                  {action === "drafting" ? (
                    <span className="flex items-center gap-1">
                      <Loader2 size={10} className="animate-spin" /> drafting
                    </span>
                  ) : action === "publishing" ? (
                    <span className="flex items-center gap-1">
                      <Loader2 size={10} className="animate-spin" /> publishing
                    </span>
                  ) : (
                    post.status
                  )}
                </span>
                {isExpanded ? (
                  <ChevronUp size={14} className="text-zinc-500" />
                ) : (
                  <ChevronDown size={14} className="text-zinc-500" />
                )}
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="border-t border-zinc-800 px-4 py-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-xs text-muted-foreground uppercase tracking-wider">
                        Topic Seed
                      </span>
                      <p className="text-foreground mt-0.5">{post.topic_seed}</p>
                    </div>
                    {post.seo_description && (
                      <div>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">
                          SEO Description
                        </span>
                        <p className="text-foreground mt-0.5">{post.seo_description}</p>
                      </div>
                    )}
                    {post.tags && post.tags.length > 0 && (
                      <div>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">
                          Tags
                        </span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {post.tags.map((t) => (
                            <span
                              key={t}
                              className="flex items-center gap-1 rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] text-zinc-400"
                            >
                              <Tag size={8} /> {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {post.shopify_article_url && (
                      <div>
                        <span className="text-xs text-muted-foreground uppercase tracking-wider">
                          Shopify
                        </span>
                        <a
                          href={post.shopify_article_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-amber-400 hover:text-amber-300 mt-0.5"
                        >
                          <ExternalLink size={12} />
                          View on store
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Body preview */}
                  {post.body && (
                    <div>
                      <span className="text-xs text-muted-foreground uppercase tracking-wider">
                        Content Preview
                      </span>
                      <div
                        className="mt-2 rounded-md border border-zinc-800 bg-zinc-950 p-4 prose prose-sm prose-invert max-h-64 overflow-y-auto"
                        dangerouslySetInnerHTML={{ __html: post.body }}
                      />
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    {(post.status === "planned" || post.status === "rejected") && (
                      <button
                        onClick={() => generateDraft(post.id)}
                        disabled={!!action}
                        className="flex items-center gap-1.5 rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-zinc-900 hover:bg-amber-500 transition disabled:opacity-50"
                      >
                        <FileText size={12} />
                        Generate Draft
                      </button>
                    )}
                    {(post.status === "draft" || post.status === "review") && (
                      <button
                        onClick={() => publishPost(post.id)}
                        disabled={!!action}
                        className="flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-zinc-900 hover:bg-emerald-500 transition disabled:opacity-50"
                      >
                        <Send size={12} />
                        Publish to Shopify
                      </button>
                    )}
                    {post.status !== "published" && (
                      <button
                        onClick={() => deletePost(post.id)}
                        disabled={!!action}
                        className="flex items-center gap-1.5 rounded-md border border-zinc-700 px-3 py-1.5 text-xs text-zinc-400 hover:text-red-400 hover:border-red-500/30 transition disabled:opacity-50"
                      >
                        <Trash2 size={12} />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
