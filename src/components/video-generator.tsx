"use client";

import { useState, useEffect, useRef } from "react";
import { Loader2, Play, Download, RefreshCw, Video } from "lucide-react";

type VideoJob = {
  videoId: string;
  status: "processing" | "completed" | "failed" | "unknown";
  videoUrl: string | null;
  thumbnailUrl: string | null;
  script: string;
  createdAt: string;
};

const DIMENSION_PRESETS = [
  { label: "Landscape (1280×720)", width: 1280, height: 720 },
  { label: "Portrait (720×1280)", width: 720, height: 1280 },
  { label: "Square (1024×1024)", width: 1024, height: 1024 },
];

export default function VideoGenerator() {
  const [script, setScript] = useState("");
  const [avatarId, setAvatarId] = useState("");
  const [voiceId, setVoiceId] = useState("");
  const [dimensionPreset, setDimensionPreset] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [jobs, setJobs] = useState<VideoJob[]>([]);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Poll processing jobs
  useEffect(() => {
    const processingJobs = jobs.filter((j) => j.status === "processing");
    if (processingJobs.length === 0) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }

    pollRef.current = setInterval(async () => {
      for (const job of processingJobs) {
        const res = await fetch(`/api/video/status?videoId=${job.videoId}`);
        if (!res.ok) continue;
        const data = await res.json();
        if (data.status !== "processing") {
          setJobs((prev) =>
            prev.map((j) =>
              j.videoId === job.videoId
                ? { ...j, status: data.status, videoUrl: data.videoUrl, thumbnailUrl: data.thumbnailUrl }
                : j
            )
          );
        }
      }
    }, 10000);

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [jobs]);

  async function handleGenerate() {
    if (!script.trim() || !avatarId.trim()) return;
    setGenerating(true);

    const preset = DIMENSION_PRESETS[dimensionPreset];
    const res = await fetch("/api/video/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        script: script.trim(),
        avatarId: avatarId.trim(),
        voiceId: voiceId.trim() || undefined,
        dimensions: { width: preset.width, height: preset.height },
      }),
    });

    const data = await res.json();
    setGenerating(false);

    if (data.videoId) {
      setJobs((prev) => [
        {
          videoId: data.videoId,
          status: "processing",
          videoUrl: null,
          thumbnailUrl: null,
          script: script.trim(),
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      setScript("");
    }
  }

  return (
    <div className="space-y-6">
      {/* Generation form */}
      <div className="glass-panel rounded-3xl p-6 space-y-4">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
          HeyGen Avatar Video
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-muted">Avatar ID *</label>
            <input
              value={avatarId}
              onChange={(e) => setAvatarId(e.target.value)}
              placeholder="Scott's HeyGen avatar ID"
              className="w-full rounded-xl border border-border/60 bg-muted-surface px-4 py-2.5 text-sm placeholder:text-muted focus:border-accent/50 focus:outline-none"
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-muted">Voice ID (optional)</label>
            <input
              value={voiceId}
              onChange={(e) => setVoiceId(e.target.value)}
              placeholder="HeyGen voice ID (uses avatar default if blank)"
              className="w-full rounded-xl border border-border/60 bg-muted-surface px-4 py-2.5 text-sm placeholder:text-muted focus:border-accent/50 focus:outline-none"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-muted">Dimensions</label>
          <div className="flex gap-2">
            {DIMENSION_PRESETS.map((preset, i) => (
              <button
                key={i}
                onClick={() => setDimensionPreset(i)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  dimensionPreset === i
                    ? "border-accent/40 bg-accent/10 text-accent"
                    : "border-border/70 text-muted hover:text-foreground"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-muted">
            Script * ({script.length}/5000)
          </label>
          <textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            placeholder="Enter the script for your avatar video. This is what the avatar will say on screen..."
            rows={6}
            maxLength={5000}
            className="w-full rounded-xl border border-border/60 bg-muted-surface px-4 py-2.5 text-sm placeholder:text-muted focus:border-accent/50 focus:outline-none resize-none"
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={generating || !script.trim() || !avatarId.trim()}
          className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-2.5 text-sm font-medium text-white transition hover:bg-accent/80 disabled:opacity-50"
        >
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
            </>
          ) : (
            <>
              <Video className="h-4 w-4" /> Generate Video
            </>
          )}
        </button>
      </div>

      {/* Job history */}
      {jobs.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Video Jobs
          </h3>
          {jobs.map((job) => (
            <div
              key={job.videoId}
              className="glass-panel rounded-2xl p-4 space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground line-clamp-2">
                    {job.script}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {new Date(job.createdAt).toLocaleString()}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    job.status === "completed"
                      ? "bg-green-500/10 text-green-400"
                      : job.status === "failed"
                      ? "bg-red-500/10 text-red-400"
                      : "bg-amber-500/10 text-amber-400"
                  }`}
                >
                  {job.status === "processing" && (
                    <RefreshCw className="inline h-3 w-3 animate-spin mr-1" />
                  )}
                  {job.status}
                </span>
              </div>

              {job.status === "completed" && job.videoUrl && (
                <div className="space-y-2">
                  <video
                    src={job.videoUrl}
                    controls
                    className="w-full max-w-lg rounded-xl"
                    poster={job.thumbnailUrl ?? undefined}
                  />
                  <div className="flex gap-2">
                    <a
                      href={job.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-border/70 px-3 py-1 text-xs text-muted hover:text-accent hover:border-accent/40 transition"
                    >
                      <Play className="h-3 w-3" /> Open
                    </a>
                    <a
                      href={job.videoUrl}
                      download
                      className="inline-flex items-center gap-1.5 rounded-full border border-border/70 px-3 py-1 text-xs text-muted hover:text-accent hover:border-accent/40 transition"
                    >
                      <Download className="h-3 w-3" /> Download
                    </a>
                  </div>
                </div>
              )}

              {job.status === "failed" && (
                <p className="text-xs text-red-400">
                  Video generation failed. Check HeyGen dashboard for details.
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
