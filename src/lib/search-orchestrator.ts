/**
 * Search Orchestrator — Parallel Multi-Source Search
 *
 * Fires searches across Tavily, SerpAPI, Reddit, NewsAPI, and Internet Archive
 * simultaneously, deduplicates results, and returns a unified result set.
 */

import { searchReddit, type RedditResult } from "@/lib/reddit-client";

export type SearchSource = "tavily" | "serpapi" | "reddit" | "newsapi" | "internet-archive";

export interface SearchResult {
  url: string;
  title: string;
  content: string;
  source: SearchSource;
  relevanceScore: number;
  metadata?: Record<string, unknown>;
}

// ─── Individual Source Searchers ──────────────────────────────

async function searchTavily(query: string, limit: number): Promise<SearchResult[]> {
  const key = process.env.TAVILY_API_KEY;
  if (!key) return [];

  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: key,
      query,
      max_results: limit,
      include_raw_content: false,
      search_depth: "advanced",
    }),
    signal: AbortSignal.timeout(20_000),
  });

  if (!res.ok) return [];
  const data = await res.json();

  return (data.results ?? []).map(
    (r: { url: string; title: string; content: string; score?: number }, i: number) => ({
      url: r.url,
      title: r.title,
      content: r.content?.slice(0, 3000) || "",
      source: "tavily" as SearchSource,
      relevanceScore: r.score ?? 1 - i * 0.1,
    })
  );
}

async function searchSerpApi(query: string, limit: number): Promise<SearchResult[]> {
  const key = process.env.SERPAPI_API_KEY;
  if (!key) return [];

  const params = new URLSearchParams({
    q: query,
    api_key: key,
    engine: "google",
    num: String(limit),
  });

  const res = await fetch(`https://serpapi.com/search.json?${params}`, {
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) return [];
  const data = await res.json();

  return (data.organic_results ?? []).map(
    (r: { link: string; title: string; snippet: string; position: number }) => ({
      url: r.link,
      title: r.title,
      content: r.snippet || "",
      source: "serpapi" as SearchSource,
      relevanceScore: 1 - (r.position - 1) * 0.05,
    })
  );
}

async function searchRedditSource(query: string, limit: number): Promise<SearchResult[]> {
  const results: RedditResult[] = await searchReddit(query, limit);
  return results.map((r, i) => ({
    url: r.url,
    title: `[r/${r.subreddit}] ${r.title}`,
    content: r.content || r.title,
    source: "reddit" as SearchSource,
    relevanceScore: 1 - i * 0.1,
    metadata: {
      subreddit: r.subreddit,
      score: r.score,
      commentCount: r.commentCount,
      author: r.author,
    },
  }));
}

async function searchNewsApi(query: string, limit: number): Promise<SearchResult[]> {
  const key = process.env.NEWSAPI_API_KEY;
  if (!key) return [];

  const params = new URLSearchParams({
    q: query,
    apiKey: key,
    pageSize: String(limit),
    sortBy: "relevancy",
    language: "en",
  });

  const res = await fetch(`https://newsapi.org/v2/everything?${params}`, {
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) return [];
  const data = await res.json();

  return (data.articles ?? []).map(
    (a: { url: string; title: string; description: string; content: string }, i: number) => ({
      url: a.url,
      title: a.title,
      content: a.description || a.content?.slice(0, 2000) || "",
      source: "newsapi" as SearchSource,
      relevanceScore: 1 - i * 0.1,
    })
  );
}

async function searchInternetArchive(query: string, limit: number): Promise<SearchResult[]> {
  // Open Library search (books)
  const bookResults: SearchResult[] = [];
  try {
    const bookRes = await fetch(
      `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=${Math.ceil(limit / 2)}`,
      { signal: AbortSignal.timeout(15_000) }
    );
    if (bookRes.ok) {
      const bookData = await bookRes.json();
      for (const doc of (bookData.docs ?? []).slice(0, Math.ceil(limit / 2))) {
        bookResults.push({
          url: `https://openlibrary.org${doc.key}`,
          title: doc.title || "Untitled",
          content: [
            doc.first_sentence?.[0] || "",
            doc.subject?.slice(0, 5).join(", ") || "",
            doc.author_name?.join(", ") || "",
            doc.first_publish_year ? `First published: ${doc.first_publish_year}` : "",
          ]
            .filter(Boolean)
            .join(" — "),
          source: "internet-archive",
          relevanceScore: 0.7,
          metadata: {
            type: "book",
            author: doc.author_name?.[0],
            firstPublishYear: doc.first_publish_year,
          },
        });
      }
    }
  } catch {
    // Silently fail — Internet Archive may be slow
  }

  // Archive.org full-text search
  const archiveResults: SearchResult[] = [];
  try {
    const archiveRes = await fetch(
      `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)}&output=json&rows=${Math.ceil(limit / 2)}&fl[]=identifier&fl[]=title&fl[]=description&fl[]=creator`,
      { signal: AbortSignal.timeout(15_000) }
    );
    if (archiveRes.ok) {
      const archiveData = await archiveRes.json();
      for (const doc of archiveData.response?.docs ?? []) {
        archiveResults.push({
          url: `https://archive.org/details/${doc.identifier}`,
          title: doc.title || doc.identifier,
          content: doc.description?.slice(0, 2000) || doc.title || "",
          source: "internet-archive",
          relevanceScore: 0.6,
          metadata: {
            type: "archive",
            creator: doc.creator,
          },
        });
      }
    }
  } catch {
    // Silently fail
  }

  return [...bookResults, ...archiveResults].slice(0, limit);
}

// ─── Orchestrator ──────────────────────────────────────────

export async function orchestrateSearch(
  query: string,
  sources: SearchSource[] = ["tavily", "serpapi", "reddit", "newsapi", "internet-archive"],
  maxPerSource: number = 5
): Promise<{ results: SearchResult[]; sourcesSearched: string[]; searchDuration: number }> {
  const start = Date.now();

  const searchMap: Record<SearchSource, () => Promise<SearchResult[]>> = {
    tavily: () => searchTavily(query, maxPerSource),
    serpapi: () => searchSerpApi(query, maxPerSource),
    reddit: () => searchRedditSource(query, maxPerSource),
    newsapi: () => searchNewsApi(query, maxPerSource),
    "internet-archive": () => searchInternetArchive(query, maxPerSource),
  };

  // Fire all selected sources in parallel
  const activeSearches = sources.filter((s) => searchMap[s]);
  const settled = await Promise.allSettled(activeSearches.map((s) => searchMap[s]()));

  const allResults: SearchResult[] = [];
  const sourcesSearched: string[] = [];

  settled.forEach((result, i) => {
    if (result.status === "fulfilled" && result.value.length > 0) {
      allResults.push(...result.value);
      sourcesSearched.push(activeSearches[i]);
    }
  });

  // Deduplicate by URL (keep highest relevance score)
  const seen = new Map<string, SearchResult>();
  for (const r of allResults) {
    const normalized = r.url.replace(/\/+$/, "").toLowerCase();
    const existing = seen.get(normalized);
    if (!existing || r.relevanceScore > existing.relevanceScore) {
      seen.set(normalized, r);
    }
  }

  // Sort by relevance score descending
  const deduped = Array.from(seen.values()).sort(
    (a, b) => b.relevanceScore - a.relevanceScore
  );

  return {
    results: deduped,
    sourcesSearched,
    searchDuration: Date.now() - start,
  };
}
