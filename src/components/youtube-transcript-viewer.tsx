"use client";

import { useState } from "react";
import {
  Clock,
  Eye,
  Calendar,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  BookmarkPlus,
} from "lucide-react";
import type { VideoMeta } from "./youtube-input";

type Props = {
  video: VideoMeta;
  onSaveToResearch?: () => void;
  savingToResearch?: boolean;
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
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M views`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K views`;
  return `${n} views`;
}

/** Format seconds to MM:SS or H:MM:SS */
function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

const SOURCE_BADGES: Record<string, { label: string; color: string }> = {
  captions: { label: "Captions", color: "bg-success/15 text-success" },
  innertube: { label: "Innertube", color: "bg-success/15 text-success" },
  gemini: { label: "Gemini AI", color: "bg-warning/15 text-warning" },
  whisper: { label: "Whisper STT", color: "bg-accent/15 text-accent" },
  "gemini-analysis": { label: "Video Analysis", color: "bg-accent/15 text-accent" },
  "metadata-synthesis": { label: "AI Summary", color: "bg-warning/15 text-warning" },
  none: { label: "No Transcript", color: "bg-danger/15 text-danger" },
};

const ANALYSIS_SOURCES = new Set(["gemini-analysis", "metadata-synthesis"]);

export default function YoutubeTranscriptViewer({
  video,
  onSaveToResearch,
  savingToResearch,
}: Props) {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const hasTranscript = video.transcript && video.transcript.length > 0;
  const isAnalysis = ANALYSIS_SOURCES.has(video.source);
  const contentLabel = isAnalysis ? "Analysis" : "Transcript";
  const wordCount = hasTranscript ? video.transcript.split(/\s+/).length : 0;
  const readTimeMin = Math.ceil(wordCount / 200);
  const badge = SOURCE_BADGES[video.source] ?? SOURCE_BADGES.captions;

  async function handleCopy() {
    await navigator.clipboard.writeText(video.transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="glass-panel rounded-3xl p-5 space-y-4">
      {/* Video metadata card */}
      <div className="flex items-start gap-4">
        {video.metadata?.thumbnailUrl && (
          <a
            href={`https://www.youtube.com/watch?v=${video.videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0"
          >
            <img
              src={video.metadata.thumbnailUrl}
              alt=""
              className="h-24 w-40 rounded-2xl object-cover shadow"
            />
          </a>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-semibold leading-snug text-foreground line-clamp-2">
            {video.title}
          </h3>
          <p className="mt-1 text-sm text-muted">{video.channelName}</p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted">
            {video.duration && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDuration(video.duration)}
              </span>
            )}
            {video.metadata && video.metadata.viewCount > 0 && (
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {formatViewCount(video.metadata.viewCount)}
              </span>
            )}
            {video.metadata?.publishedAt && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(video.metadata.publishedAt).toLocaleDateString()}
              </span>
            )}
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badge.color}`}>
              {badge.label}
            </span>
            {hasTranscript && (
              <span className="text-muted">
                {wordCount.toLocaleString()} words · ~{readTimeMin} min read
              </span>
            )}
          </div>
        </div>
      </div>

      {/* No content warning */}
      {!hasTranscript && (
        <div className="rounded-2xl border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">
          No transcript or analysis available for this video. You can still watch it on YouTube and use the description for context.
        </div>
      )}

      {/* Analysis source info banner */}
      {hasTranscript && isAnalysis && (
        <div className="rounded-2xl border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-accent">
          {video.source === "gemini-analysis"
            ? "No captions were available \u2014 this content was generated by AI video analysis. Curriculum tools are available but results are based on AI interpretation."
            : "No captions or video analysis available \u2014 this summary was generated from the video\u2019s title and description. Curriculum tools will work but may be less detailed."}
        </div>
      )}

      {/* Action bar */}
      <div className="flex items-center gap-2">
        {hasTranscript && (
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-xl border border-border/70 px-3 py-1.5 text-xs font-medium text-muted transition hover:text-foreground"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            {copied ? "Copied" : `Copy ${contentLabel}`}
          </button>
        )}
        <a
          href={`https://www.youtube.com/watch?v=${video.videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-xl border border-border/70 px-3 py-1.5 text-xs font-medium text-muted transition hover:text-foreground"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Open on YouTube
        </a>
        {onSaveToResearch && (
          <button
            onClick={onSaveToResearch}
            disabled={savingToResearch}
            className="flex items-center gap-1.5 rounded-xl bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground shadow shadow-accent/25 transition hover:opacity-90 disabled:opacity-40"
          >
            <BookmarkPlus className="h-3.5 w-3.5" />
            {savingToResearch ? "Saving…" : "Save to Research"}
          </button>
        )}
      </div>

      {/* Transcript body */}
      {hasTranscript && (
      <div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-2 text-sm font-medium text-muted transition hover:text-foreground"
        >
          {expanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
          {expanded ? `Hide ${contentLabel}` : `Show ${contentLabel}`}
        </button>

        {expanded && (
          <div className="mt-3 max-h-96 overflow-y-auto rounded-2xl border border-border/50 bg-muted-surface/50 p-4 scroll-fade">
            {video.segments.length > 1 ? (
              <div className="space-y-2">
                {video.segments.map((seg, i) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <a
                      href={`https://www.youtube.com/watch?v=${video.videoId}&t=${Math.floor(seg.start)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-shrink-0 font-mono text-xs text-accent hover:underline"
                      style={{ minWidth: "3.5rem" }}
                    >
                      {formatTimestamp(seg.start)}
                    </a>
                    <p className="text-foreground/90 leading-relaxed">
                      {seg.text}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                {video.transcript}
              </p>
            )}
          </div>
        )}
      </div>
      )}
    </div>
  );
}
