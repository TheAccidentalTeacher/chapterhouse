import Parser from "rss-parser";

export type RssItem = {
  title: string;
  url: string;
  summary: string;
  publishedAt: string | null;
  category: string;
  feedName: string;
};

type FeedDefinition = {
  name: string;
  url: string;
  category: string;
  maxItems?: number;
};

const FEEDS: FeedDefinition[] = [
  // AI & Dev Tools
  {
    name: "MIT Technology Review AI",
    url: "https://www.technologyreview.com/topic/artificial-intelligence/feed/",
    category: "AI & Dev Tools",
    maxItems: 5,
  },
  {
    name: "OpenAI Blog",
    url: "https://openai.com/blog/rss.xml",
    category: "AI & Dev Tools",
    maxItems: 5,
  },
  {
    name: "GitHub Changelog",
    url: "https://github.blog/changelog/feed/",
    category: "AI & Dev Tools",
    maxItems: 5,
  },
  {
    name: "Vercel Blog",
    url: "https://vercel.com/atom",
    category: "AI & Dev Tools",
    maxItems: 5,
  },
  {
    name: "Hacker News Top",
    url: "https://hnrss.org/frontpage?count=10",
    category: "AI & Dev Tools",
    maxItems: 10,
  },
  // Homeschool Market
  {
    name: "The Homeschool Mom",
    url: "https://www.thehomeschoolmom.com/feed/",
    category: "Homeschool Market",
    maxItems: 5,
  },
  // Shopify / Ecommerce
  {
    name: "Shopify News",
    url: "https://news.shopify.com/feed",
    category: "Shopify & Ecommerce",
    maxItems: 5,
  },
  // Faith / Publishing
  {
    name: "The Gospel Coalition",
    url: "https://www.thegospelcoalition.org/feed/",
    category: "Faith & Publishing",
    maxItems: 5,
  },
  // Education Policy
  {
    name: "Hechinger Report",
    url: "https://hechingerreport.org/feed/",
    category: "Education Policy",
    maxItems: 5,
  },
];

const parser = new Parser({
  timeout: 10000,
  headers: {
    "User-Agent": "Chapterhouse/1.0 (RSS reader for internal use)",
    Accept: "application/rss+xml, application/xml, text/xml, */*",
  },
});

async function fetchFeed(feed: FeedDefinition): Promise<RssItem[]> {
  try {
    const parsed = await parser.parseURL(feed.url);
    const items = (parsed.items ?? []).slice(0, feed.maxItems ?? 5);

    return items.map((item) => ({
      title: item.title ?? "(no title)",
      url: item.link ?? item.guid ?? "",
      summary: item.contentSnippet ?? item.summary ?? item.content ?? "",
      publishedAt: item.pubDate ?? item.isoDate ?? null,
      category: feed.category,
      feedName: feed.name,
    }));
  } catch {
    // Silently skip failed feeds — don't let one bad URL break the whole brief
    return [];
  }
}

export type RssFetchResult = {
  items: RssItem[];
  feedsAttempted: number;
  feedsSucceeded: number;
  feedsFailed: number;
  scannedCount: number;
};

export async function fetchAllRssFeeds(): Promise<RssFetchResult> {
  const results = await Promise.allSettled(FEEDS.map(fetchFeed));

  let succeeded = 0;
  let failed = 0;
  const items: RssItem[] = [];

  for (const result of results) {
    if (result.status === "fulfilled") {
      if (result.value.length > 0) succeeded++;
      else failed++;
      items.push(...result.value);
    } else {
      failed++;
    }
  }

  return {
    items,
    feedsAttempted: FEEDS.length,
    feedsSucceeded: succeeded,
    feedsFailed: failed,
    scannedCount: items.length,
  };
}

export function formatRssItemsForPrompt(items: RssItem[]): string {
  const byCategory = new Map<string, RssItem[]>();

  for (const item of items) {
    const bucket = byCategory.get(item.category) ?? [];
    bucket.push(item);
    byCategory.set(item.category, bucket);
  }

  const lines: string[] = [];

  for (const [category, catItems] of byCategory) {
    lines.push(`\n## ${category}`);
    for (const item of catItems) {
      const pub = item.publishedAt ? ` (${item.publishedAt})` : "";
      lines.push(`- [${item.feedName}]${pub} **${item.title}**`);
      if (item.summary) {
        const snippet = item.summary.slice(0, 200).replace(/\n/g, " ");
        lines.push(`  ${snippet}`);
      }
    }
  }

  return lines.join("\n");
}
