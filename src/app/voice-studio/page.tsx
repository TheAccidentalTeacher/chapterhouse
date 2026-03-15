"use client";

import { PageFrame } from "@/components/page-frame";
import VoiceStudio from "@/components/voice-studio";

export default function VoiceStudioPage() {
  return (
    <PageFrame
      eyebrow="Production"
      title="Voice Studio"
      description="Text-to-speech synthesis with ElevenLabs and Azure Speech. Speech-to-text transcription for content workflows."
    >
      <VoiceStudio />
    </PageFrame>
  );
}
