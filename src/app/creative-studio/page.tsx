"use client";

import { useState } from "react";
import { PageFrame } from "@/components/page-frame";
import ImageGenerationStudio from "@/components/image-generation-studio";
import SoundBrowser from "@/components/sound-browser";
import VideoGenerator from "@/components/video-generator";

const TABS = [
  { id: "images", label: "Images" },
  { id: "sounds", label: "Sounds" },
  { id: "video", label: "Video" },
] as const;

type Tab = (typeof TABS)[number]["id"];

export default function CreativeStudioPage() {
  const [activeTab, setActiveTab] = useState<Tab>("images");

  return (
    <PageFrame
      title="Creative Studio"
      description="AI image generation, stock media search, sound effects, video generation, and music workflows."
    >
      <div className="space-y-6">
        <div className="flex gap-1 rounded-2xl bg-surface/50 p-1 w-fit">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                activeTab === tab.id
                  ? "bg-accent/20 text-accent"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "images" && <ImageGenerationStudio />}
        {activeTab === "sounds" && <SoundBrowser />}
        {activeTab === "video" && <VideoGenerator />}
      </div>
    </PageFrame>
  );
}
