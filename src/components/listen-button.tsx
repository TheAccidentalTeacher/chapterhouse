"use client";

import { useState, useRef, useCallback } from "react";
import { Volume2, Loader2, Pause, Play } from "lucide-react";

const MAX_CHARS = 5000;

interface ListenButtonProps {
  text: string;
  audioUrl?: string;
  className?: string;
}

export function ListenButton({ text, audioUrl, className = "" }: ListenButtonProps) {
  const [loading, setLoading] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [url, setUrl] = useState<string | null>(audioUrl ?? null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleClick = useCallback(async () => {
    // If already have audio, toggle play/pause
    if (url && audioRef.current) {
      if (playing) {
        audioRef.current.pause();
        setPlaying(false);
      } else {
        audioRef.current.play();
        setPlaying(true);
      }
      return;
    }

    // Generate audio
    setLoading(true);
    try {
      const truncated = text.slice(0, MAX_CHARS);
      const res = await fetch("/api/audio/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: truncated }),
      });

      if (!res.ok) throw new Error("Audio generation failed");

      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      setUrl(blobUrl);

      // Auto-play
      const audio = new Audio(blobUrl);
      audioRef.current = audio;
      audio.onended = () => setPlaying(false);
      audio.play();
      setPlaying(true);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [text, url, playing]);

  const truncated = text.length > MAX_CHARS;

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-amber-300 transition-colors disabled:opacity-50 ${className}`}
      title={truncated ? `Audio covers first ~${MAX_CHARS} characters` : "Listen to this content"}
    >
      {loading ? (
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
      ) : playing ? (
        <Pause className="w-3.5 h-3.5" />
      ) : url ? (
        <Play className="w-3.5 h-3.5" />
      ) : (
        <Volume2 className="w-3.5 h-3.5" />
      )}
      {loading ? "Generating…" : playing ? "Pause" : "Listen"}
    </button>
  );
}
