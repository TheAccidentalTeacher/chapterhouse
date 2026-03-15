"use client";

import { useState } from "react";
import { Youtube } from "lucide-react";
import YoutubeInput from "@/components/youtube-input";
import type { VideoMeta } from "@/components/youtube-input";
import YoutubeTranscriptViewer from "@/components/youtube-transcript-viewer";
import YoutubeCurriculumTools from "@/components/youtube-curriculum-tools";
import YoutubeBatchSidebar from "@/components/youtube-batch-sidebar";

export default function YoutubePage() {
  const [video, setVideo] = useState<VideoMeta | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [savingToResearch, setSavingToResearch] = useState(false);

  async function handleSaveToResearch() {
    if (!video) return;
    setSavingToResearch(true);
    try {
      await fetch("/api/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: `https://www.youtube.com/watch?v=${video.videoId}`,
          title: video.title,
          content: video.transcript,
          tags: ["youtube"],
          source_type: "youtube",
          youtube_metadata: {
            videoId: video.videoId,
            channelName: video.channelName,
            duration: video.duration,
            viewCount: video.metadata?.viewCount ?? 0,
            thumbnailUrl: video.metadata?.thumbnailUrl ?? "",
            transcriptSource: video.source,
          },
        }),
      });
    } catch {
      // Silent fail — research save is non-critical
    } finally {
      setSavingToResearch(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="rounded-3xl border border-border bg-card/80 p-6 shadow-sm shadow-black/5 backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-danger/10 p-2">
            <Youtube className="h-6 w-6 text-danger" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-muted">
              Intelligence
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              YouTube Intelligence
            </h1>
          </div>
        </div>
        <p className="mt-3 text-sm leading-7 text-muted sm:text-base">
          Paste any YouTube URL → get a transcript → generate quizzes, lesson
          plans, vocabulary, discussion questions, and more. Batch multiple
          videos for cross-video materials.
        </p>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        {/* Main column */}
        <div className="space-y-6">
          {/* Input */}
          <YoutubeInput
            onVideoLoaded={setVideo}
            isLoading={isLoading}
            setIsLoading={setIsLoading}
          />

          {/* Transcript viewer */}
          {video && (
            <YoutubeTranscriptViewer
              video={video}
              onSaveToResearch={handleSaveToResearch}
              savingToResearch={savingToResearch}
            />
          )}

          {/* Curriculum tools */}
          {video && (
            <div>
              <h2 className="mb-3 text-lg font-semibold text-foreground">
                Curriculum Tools
              </h2>
              <YoutubeCurriculumTools
                videoId={video.videoId}
                videoTitle={video.title}
                transcript={video.transcript}
              />
            </div>
          )}
        </div>

        {/* Batch sidebar */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <YoutubeBatchSidebar currentVideo={video} />
        </div>
      </div>
    </div>
  );
}
