"use client";

import { useState, useRef } from "react";
import {
  Search,
  Play,
  Pause,
  Download,
  Loader2,
  Music,
  ExternalLink,
} from "lucide-react";

type SoundResult = {
  id: number;
  name: string;
  description: string;
  duration: number;
  url: string;
  previewUrl: string;
  tags: string[];
  license: string;
};

type LicenseFilter = "all" | "cc0" | "cc-by";

export default function SoundBrowser() {
  const [query, setQuery] = useState("");
  const [license, setLicense] = useState<LicenseFilter>("all");
  const [durationMin, setDurationMin] = useState("");
  const [durationMax, setDurationMax] = useState("");
  const [results, setResults] = useState<SoundResult[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [playingId, setPlayingId] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ q: query.trim() });
      if (license !== "all") params.set("license", license);
      if (durationMin) params.set("duration_min", durationMin);
      if (durationMax) params.set("duration_max", durationMax);

      const res = await fetch(`/api/sounds/search?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");
      setResults(data.results || []);
      setTotalCount(data.count || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  function togglePlay(sound: SoundResult) {
    if (playingId === sound.id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(sound.previewUrl);
    audio.onended = () => setPlayingId(null);
    audio.play();
    audioRef.current = audio;
    setPlayingId(sound.id);
  }

  function formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return m > 0 ? `${m}:${s.toString().padStart(2, "0")}` : `${s}s`;
  }

  return (
    <div className="space-y-6">
      {/* Search Controls */}
      <div className="glass-panel rounded-3xl p-6 space-y-4">
        <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
          <Music className="h-4 w-4 text-accent" />
          Freesound Search
        </h3>

        <div className="flex gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search for sounds (e.g., medieval tavern, ocean waves, classroom bell)..."
            className="flex-1 rounded-xl bg-surface border border-border/70 px-3 py-2 text-sm text-foreground placeholder-muted focus:outline-none focus:border-accent/50"
          />
          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-accent/20 text-accent px-5 py-2 font-medium transition hover:bg-accent/30 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            Search
          </button>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div>
            <label className="text-xs text-muted uppercase tracking-wider">
              License
            </label>
            <select
              value={license}
              onChange={(e) => setLicense(e.target.value as LicenseFilter)}
              className="ml-2 rounded-lg bg-surface border border-border/70 px-2 py-1 text-xs text-foreground"
            >
              <option value="all">All</option>
              <option value="cc0">CC0 (Public Domain)</option>
              <option value="cc-by">CC-BY (Attribution)</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-muted uppercase tracking-wider">
              Duration
            </label>
            <input
              type="number"
              placeholder="Min (s)"
              value={durationMin}
              onChange={(e) => setDurationMin(e.target.value)}
              className="ml-2 w-20 rounded-lg bg-surface border border-border/70 px-2 py-1 text-xs text-foreground"
            />
            <span className="mx-1 text-xs text-muted">–</span>
            <input
              type="number"
              placeholder="Max (s)"
              value={durationMax}
              onChange={(e) => setDurationMax(e.target.value)}
              className="w-20 rounded-lg bg-surface border border-border/70 px-2 py-1 text-xs text-foreground"
            />
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-muted">
            {totalCount.toLocaleString()} results found
          </p>
          {results.map((sound) => (
            <div
              key={sound.id}
              className="glass-panel rounded-2xl p-4 flex items-start gap-4"
            >
              <button
                onClick={() => togglePlay(sound)}
                disabled={!sound.previewUrl}
                className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent/20 text-accent transition hover:bg-accent/30 disabled:opacity-30"
              >
                {playingId === sound.id ? (
                  <Pause className="h-4 w-4" />
                ) : (
                  <Play className="h-4 w-4 ml-0.5" />
                )}
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-medium text-foreground truncate">
                    {sound.name}
                  </h4>
                  <span className="shrink-0 text-xs text-muted">
                    {formatDuration(sound.duration)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted line-clamp-2">
                  {sound.description}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {sound.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-surface px-2 py-0.5 text-[10px] text-muted"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="rounded-full border border-border/50 px-2 py-0.5 text-[10px] text-muted">
                    {sound.license.includes("0")
                      ? "CC0"
                      : sound.license.includes("Attribution")
                        ? "CC-BY"
                        : "License"}
                  </span>
                  <a
                    href={sound.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[10px] text-accent hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" /> Freesound
                  </a>
                  {sound.previewUrl && (
                    <a
                      href={sound.previewUrl}
                      download
                      className="inline-flex items-center gap-1 rounded-full border border-border/50 px-2 py-0.5 text-[10px] text-muted hover:text-accent hover:border-accent/40 transition"
                    >
                      <Download className="h-3 w-3" /> Download
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Suno Workflow Guide */}
      <div className="glass-panel rounded-3xl p-6 space-y-3">
        <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
          <Music className="h-4 w-4 text-accent" />
          Suno AI Workflow (Manual)
        </h3>
        <p className="text-xs text-muted">
          Suno generates full songs from text prompts. No API — manual workflow only.
        </p>
        <ol className="space-y-2 text-sm text-foreground">
          <li className="flex gap-2">
            <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-accent/20 text-accent text-xs font-medium">
              1
            </span>
            <span>
              Log into{" "}
              <a
                href="https://suno.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                suno.com
              </a>{" "}
              (Pro plan for commercial use)
            </span>
          </li>
          <li className="flex gap-2">
            <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-accent/20 text-accent text-xs font-medium">
              2
            </span>
            <span>
              Enter prompt: &quot;Make a silly song that teaches the water cycle to 2nd graders&quot;
            </span>
          </li>
          <li className="flex gap-2">
            <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-accent/20 text-accent text-xs font-medium">
              3
            </span>
            <span>Download MP3 from Suno</span>
          </li>
          <li className="flex gap-2">
            <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-accent/20 text-accent text-xs font-medium">
              4
            </span>
            <span>
              Upload to Cloudinary via Creative Studio &rarr; Images &rarr; Save to CDN
            </span>
          </li>
          <li className="flex gap-2">
            <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-accent/20 text-accent text-xs font-medium">
              5
            </span>
            <span>Copy CDN URL &rarr; embed in lesson</span>
          </li>
        </ol>
      </div>
    </div>
  );
}
