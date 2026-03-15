"use client";

import { useState } from "react";
import {
  Plus,
  X,
  Loader2,
  Copy,
  Check,
  Download,
  ListVideo,
} from "lucide-react";
import type { VideoMeta } from "./youtube-input";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type BatchVideo = {
  videoId: string;
  videoTitle: string;
  transcript: string;
};

const BATCH_TYPES = [
  { id: "combined-quiz", label: "Combined Quiz" },
  { id: "master-vocabulary", label: "Master Vocabulary" },
  { id: "unit-study-guide", label: "Unit Study Guide" },
  { id: "weekly-summary", label: "Weekly Summary" },
  { id: "batch-summary", label: "Batch Summary" },
] as const;

type Props = {
  currentVideo: VideoMeta | null;
};

export default function YoutubeBatchSidebar({ currentVideo }: Props) {
  const [batchVideos, setBatchVideos] = useState<BatchVideo[]>([]);
  const [outputType, setOutputType] = useState<string>("combined-quiz");
  const [gradeLevel, setGradeLevel] = useState<number | undefined>(7);
  const [unitTitle, setUnitTitle] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  function addCurrent() {
    if (!currentVideo) return;
    if (batchVideos.some((v) => v.videoId === currentVideo.videoId)) return;
    if (batchVideos.length >= 20) return;

    setBatchVideos((prev) => [
      ...prev,
      {
        videoId: currentVideo.videoId,
        videoTitle: currentVideo.title,
        transcript: currentVideo.transcript,
      },
    ]);
  }

  function removeVideo(videoId: string) {
    setBatchVideos((prev) => prev.filter((v) => v.videoId !== videoId));
    if (batchVideos.length <= 2) setResult(null);
  }

  async function handleGenerate() {
    if (batchVideos.length < 2) return;
    setError("");
    setGenerating(true);
    setResult(null);
    try {
      const res = await fetch("/api/youtube/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videos: batchVideos,
          outputType,
          options: {
            ...(gradeLevel ? { gradeLevel } : {}),
            ...(unitTitle.trim() ? { unitTitle: unitTitle.trim() } : {}),
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Batch generation failed");
        return;
      }
      setResult(data.content);
    } catch {
      setError("Network error during batch generation");
    } finally {
      setGenerating(false);
    }
  }

  async function handleCopy() {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    if (!result) return;
    const blob = new Blob([result], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `batch-${outputType}-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const alreadyAdded = currentVideo
    ? batchVideos.some((v) => v.videoId === currentVideo.videoId)
    : false;

  return (
    <div className="glass-panel rounded-3xl p-5 space-y-4">
      <div className="flex items-center gap-2">
        <ListVideo className="h-5 w-5 text-accent" />
        <h3 className="text-sm font-semibold text-foreground">
          Batch Mode
        </h3>
        <span className="ml-auto rounded-full bg-accent/15 px-2 py-0.5 text-xs font-medium text-accent">
          {batchVideos.length}/20
        </span>
      </div>

      {/* Add current video */}
      {currentVideo && (
        <button
          onClick={addCurrent}
          disabled={alreadyAdded || batchVideos.length >= 20}
          className="flex w-full items-center gap-2 rounded-xl border border-dashed border-border/70 px-3 py-2 text-xs font-medium text-muted transition hover:border-accent/40 hover:text-foreground disabled:opacity-40"
        >
          <Plus className="h-3.5 w-3.5" />
          {alreadyAdded ? "Already added" : "Add current video to batch"}
        </button>
      )}

      {/* Queued videos */}
      {batchVideos.length > 0 && (
        <div className="max-h-48 space-y-1.5 overflow-y-auto">
          {batchVideos.map((v, i) => (
            <div
              key={v.videoId}
              className="flex items-center gap-2 rounded-xl bg-muted-surface/50 px-3 py-2"
            >
              <span className="flex-shrink-0 text-xs font-medium text-muted">
                {i + 1}.
              </span>
              <span className="min-w-0 flex-1 truncate text-xs text-foreground">
                {v.videoTitle}
              </span>
              <button
                onClick={() => removeVideo(v.videoId)}
                className="flex-shrink-0 text-muted transition hover:text-danger"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Batch options */}
      {batchVideos.length >= 2 && (
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted">
              Output Type
            </label>
            <select
              value={outputType}
              onChange={(e) => setOutputType(e.target.value)}
              className="w-full rounded-xl border border-border/70 bg-muted-surface px-3 py-1.5 text-sm text-foreground focus:border-accent/40 focus:outline-none"
            >
              {BATCH_TYPES.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted">
              Grade Level
            </label>
            <select
              value={gradeLevel ?? ""}
              onChange={(e) =>
                setGradeLevel(
                  e.target.value ? Number(e.target.value) : undefined,
                )
              }
              className="w-full rounded-xl border border-border/70 bg-muted-surface px-3 py-1.5 text-sm text-foreground focus:border-accent/40 focus:outline-none"
            >
              <option value="">Auto-detect</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((g) => (
                <option key={g} value={g}>
                  Grade {g}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-muted">
              Unit Title (optional)
            </label>
            <input
              type="text"
              value={unitTitle}
              onChange={(e) => setUnitTitle(e.target.value)}
              placeholder="e.g., Ancient Civilizations"
              className="w-full rounded-xl border border-border/70 bg-muted-surface px-3 py-1.5 text-sm text-foreground placeholder:text-muted focus:border-accent/40 focus:outline-none"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-accent-foreground shadow shadow-accent/25 transition hover:opacity-90 disabled:opacity-40"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating…
              </>
            ) : (
              "Generate Batch"
            )}
          </button>

          {error && <p className="text-xs text-danger">{error}</p>}
        </div>
      )}

      {/* Batch result */}
      {result && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 rounded-xl border border-border/70 px-3 py-1.5 text-xs font-medium text-muted transition hover:text-foreground"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              {copied ? "Copied" : "Copy"}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 rounded-xl border border-border/70 px-3 py-1.5 text-xs font-medium text-muted transition hover:text-foreground"
            >
              <Download className="h-3.5 w-3.5" />
              Download
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto rounded-2xl border border-border/50 bg-muted-surface/50 p-4 scroll-fade prose prose-sm prose-invert max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {result}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {batchVideos.length === 0 && (
        <p className="text-center text-xs text-muted">
          Load videos and add them to batch for cross-video analysis
        </p>
      )}
    </div>
  );
}
