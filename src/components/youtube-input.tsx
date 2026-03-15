"use client";

import { useState } from "react";
import {
  Search,
  Link,
  Loader2,
  Play,
  Eye,
  Clock,
  Calendar,
} from "lucide-react";

export type VideoMeta = {
  videoId: string;
  title: string;
  channelName: string;
  duration: string;
  transcript: string;
  segments: { start: number; text: string }[];
  source: "captions" | "gemini" | "whisper";
  metadata: {
    viewCount: number;
    publishedAt: string;
    thumbnailUrl: string;
    description: string;
  } | null;
};

type SearchResult = {
  videoId: string;
  title: string;
  channelName: string;
  thumbnailUrl: string;
  duration: string;
  viewCount: number;
  publishedAt: string;
};

/** Format ISO 8601 duration (PT1H2M3S) to human-readable */
function formatDuration(iso: string): string {
  if (!iso) return "";
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return iso;
  const h = match[1] ? `${match[1]}:` : "";
  const m = match[2] ?? "0";
  const s = match[3]?.padStart(2, "0") ?? "00";
  return `${h}${h ? m.padStart(2, "0") : m}:${s}`;
}

function formatViewCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

type YoutubeInputProps = {
  onVideoLoaded: (video: VideoMeta) => void;
  isLoading: boolean;
  setIsLoading: (v: boolean) => void;
};

export default function YoutubeInput({
  onVideoLoaded,
  isLoading,
  setIsLoading,
}: YoutubeInputProps) {
  const [tab, setTab] = useState<"url" | "search">("url");
  const [url, setUrl] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");

  async function handleFetchTranscript(videoUrl: string) {
    setError("");
    setIsLoading(true);
    try {
      const res = await fetch("/api/youtube/transcript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to fetch transcript");
        return;
      }
      onVideoLoaded(data as VideoMeta);
    } catch {
      setError("Network error fetching transcript");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setSearching(true);
    setError("");
    setSearchResults([]);
    try {
      const params = new URLSearchParams({
        q: searchQuery.trim(),
        maxResults: "8",
      });
      const res = await fetch(`/api/youtube/search?${params}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Search failed");
        return;
      }
      setSearchResults(data.results ?? []);
    } catch {
      setError("Network error during search");
    } finally {
      setSearching(false);
    }
  }

  const tabs = [
    { id: "url" as const, label: "Paste URL", icon: Link },
    { id: "search" as const, label: "Search YouTube", icon: Search },
  ];

  return (
    <div className="glass-panel rounded-3xl p-5">
      {/* Tab switcher */}
      <div className="mb-4 flex gap-1 rounded-2xl bg-muted-surface p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition ${
              tab === t.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted hover:text-foreground"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* URL input */}
      {tab === "url" && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (url.trim()) handleFetchTranscript(url.trim());
          }}
          className="flex gap-3"
        >
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste a YouTube URL or video ID…"
            className="flex-1 rounded-2xl border border-border/70 bg-muted-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-accent/40 focus:outline-none"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !url.trim()}
            className="flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground shadow shadow-accent/25 transition hover:opacity-90 disabled:opacity-40"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            Fetch Transcript
          </button>
        </form>
      )}

      {/* Search input */}
      {tab === "search" && (
        <div className="space-y-3">
          <form onSubmit={handleSearch} className="flex gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search YouTube for videos…"
              className="flex-1 rounded-2xl border border-border/70 bg-muted-surface px-4 py-2.5 text-sm text-foreground placeholder:text-muted focus:border-accent/40 focus:outline-none"
              disabled={searching}
            />
            <button
              type="submit"
              disabled={searching || !searchQuery.trim()}
              className="flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground shadow shadow-accent/25 transition hover:opacity-90 disabled:opacity-40"
            >
              {searching ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              Search
            </button>
          </form>

          {/* Search results */}
          {searchResults.length > 0 && (
            <div className="max-h-80 space-y-2 overflow-y-auto">
              {searchResults.map((r) => (
                <button
                  key={r.videoId}
                  onClick={() =>
                    handleFetchTranscript(
                      `https://www.youtube.com/watch?v=${r.videoId}`,
                    )
                  }
                  disabled={isLoading}
                  className="flex w-full items-start gap-3 rounded-2xl border border-border/50 bg-muted-surface/50 p-3 text-left transition hover:border-accent/40 hover:bg-muted-surface disabled:opacity-50"
                >
                  {r.thumbnailUrl && (
                    <img
                      src={r.thumbnailUrl}
                      alt=""
                      className="h-16 w-28 flex-shrink-0 rounded-xl object-cover"
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug text-foreground line-clamp-2">
                      {r.title}
                    </p>
                    <p className="mt-1 text-xs text-muted">{r.channelName}</p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted">
                      {r.duration && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDuration(r.duration)}
                        </span>
                      )}
                      {r.viewCount > 0 && (
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {formatViewCount(r.viewCount)}
                        </span>
                      )}
                      {r.publishedAt && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(r.publishedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <p className="mt-3 text-sm text-danger">{error}</p>
      )}
    </div>
  );
}
