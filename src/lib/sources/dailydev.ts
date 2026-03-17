/**
 * daily.dev Public API source for Chapterhouse brief generation.
 * Fetches posts from the For You feed, popular feed, and targeted tag feeds.
 * Requires DAILYDEV_TOKEN env var (Plus subscription token).
 *
 * API base: https://api.daily.dev/public/v1
 * Rate limits: 300 req/min (IP), 60 req/min (user)
 */

const DAILY_DEV_BASE = "https://api.daily.dev/public/v1";

// Tags that directly map to Scott's tech stack and business interests
const STACK_TAGS = ["nextjs", "typescript", "supabase", "vercel", "stripe"];
const SIGNAL_TAGS = ["anthropic", "openai", "ai", "security", "privacy"];

export type DailyDevPost = {
  id: string;
  title: string;
  url: string;
  summary: string | null;
  source: string;
  tags: string[];
  numUpvotes: number;
  numComments: number;
  publishedAt: string | null;
  feedName: string;
};

type RawPost = {
  id?: string;
  title?: string;
  url?: string;
  summary?: string;
  source?: { name?: string };
  tags?: string[];
  numUpvotes?: number;
  numComments?: number;
  publishedAt?: string;
};

type FeedResponse = {
  data?: RawPost[];
  pagination?: { hasNextPage: boolean; endCursor: string | null };
};

async function fetchFeed(
  path: string,
  token: string,
  feedName: string
): Promise<DailyDevPost[]> {
  try {
    const res = await fetch(`${DAILY_DEV_BASE}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const json = (await res.json()) as FeedResponse;
    return (json.data ?? []).map((p) => ({
      id: p.id ?? "",
      title: p.title ?? "",
      url: p.url ?? "",
      summary: p.summary ?? null,
      source: p.source?.name ?? "",
      tags: p.tags ?? [],
      numUpvotes: p.numUpvotes ?? 0,
      numComments: p.numComments ?? 0,
      publishedAt: p.publishedAt ?? null,
      feedName,
    }));
  } catch {
    return [];
  }
}

export type DailyDevResult = {
  posts: DailyDevPost[];
  feedsSucceeded: number;
  feedsFailed: number;
  scannedCount: number;
};

export async function fetchDailyDevPosts(): Promise<DailyDevResult> {
  const token = process.env.DAILYDEV_TOKEN;
  if (!token) {
    return { posts: [], feedsSucceeded: 0, feedsFailed: 0, scannedCount: 0 };
  }

  // Fetch For You + Popular in parallel, then a few high-signal tag feeds
  const [forYou, popular, anthropicFeed, securityFeed, nextjsFeed] =
    await Promise.all([
      fetchFeed("/feeds/foryou", token, "daily.dev — For You"),
      fetchFeed("/feeds/popular", token, "daily.dev — Popular"),
      fetchFeed("/feeds/tag/anthropic", token, "daily.dev — Anthropic"),
      fetchFeed("/feeds/tag/security", token, "daily.dev — Security"),
      fetchFeed("/feeds/tag/nextjs", token, "daily.dev — Next.js"),
    ]);

  const allFeeds = [forYou, popular, anthropicFeed, securityFeed, nextjsFeed];
  const feedsSucceeded = allFeeds.filter((f) => f.length > 0).length;
  const feedsFailed = allFeeds.length - feedsSucceeded;

  // Deduplicate by post ID, prefer the entry with the richer summary
  const seen = new Map<string, DailyDevPost>();
  for (const feed of allFeeds) {
    for (const post of feed) {
      if (!post.id || !post.title) continue;
      const existing = seen.get(post.id);
      if (!existing || (!existing.summary && post.summary)) {
        seen.set(post.id, post);
      }
    }
  }

  const posts = Array.from(seen.values())
    // Sort: upvotes desc, then numComments desc — most engaged content first
    .sort((a, b) => b.numUpvotes - a.numUpvotes || b.numComments - a.numComments)
    // Cap at 30 posts so we don't blow the prompt budget
    .slice(0, 30);

  return {
    posts,
    feedsSucceeded,
    feedsFailed,
    scannedCount: seen.size,
  };
}

export function formatDailyDevForPrompt(result: DailyDevResult): string {
  if (result.posts.length === 0) return "(daily.dev returned no posts)";

  const lines = result.posts.map((post) => {
    const meta = [
      post.source && `[${post.source}]`,
      post.numUpvotes > 0 && `${post.numUpvotes} upvotes`,
      post.numComments > 0 && `${post.numComments} comments`,
    ]
      .filter(Boolean)
      .join(", ");

    const tags =
      post.tags.length > 0 ? `  tags: ${post.tags.slice(0, 5).join(", ")}` : "";
    const summary = post.summary
      ? `\n  summary: ${post.summary.slice(0, 300)}${post.summary.length > 300 ? "..." : ""}`
      : "";

    return `- ${post.title}${meta ? ` (${meta})` : ""}\n  url: ${post.url}${tags}${summary}`;
  });

  return lines.join("\n\n");
}

export { STACK_TAGS, SIGNAL_TAGS };
