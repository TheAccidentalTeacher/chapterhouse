"use client";

import { useState, useRef } from "react";
import {
  Loader2,
  Play,
  Download,
  Mic,
  MicOff,
  Volume2,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

type Engine = "elevenlabs" | "azure";

// ── Constants ──────────────────────────────────────────────────────────────────

const AZURE_VOICES = [
  { id: "en-US-AriaNeural", label: "Aria (Female, US)" },
  { id: "en-US-GuyNeural", label: "Guy (Male, US)" },
  { id: "en-US-JennyNeural", label: "Jenny (Female, US)" },
  { id: "en-US-DavisNeural", label: "Davis (Male, US)" },
  { id: "en-GB-SoniaNeural", label: "Sonia (Female, UK)" },
  { id: "en-GB-RyanNeural", label: "Ryan (Male, UK)" },
  { id: "en-AU-NatashaNeural", label: "Natasha (Female, AU)" },
  { id: "es-MX-DaliaNeural", label: "Dalia (Female, Spanish MX)" },
  { id: "fr-FR-DeniseNeural", label: "Denise (Female, French)" },
  { id: "de-DE-KatjaNeural", label: "Katja (Female, German)" },
];

const ELEVENLABS_VOICES = [
  { id: "21m00Tcm4TlvDq8ikWAM", label: "Rachel (Narrative)" },
  { id: "EXAVITQu4vr4xnSDxMaL", label: "Bella (Soft)" },
  { id: "IKne3meq5aSn9XLyUdCD", label: "Charlie (Conversational)" },
  { id: "pNInz6obpgDQGcFmaJgB", label: "Adam (Narration)" },
  { id: "yoZ06aMxZJJ28mfd3POQ", label: "Sam (Raspy)" },
];

// ── Main Component ─────────────────────────────────────────────────────────────

export default function VoiceStudio() {
  // ── TTS state ──────────────────────────────────────────────────────────────
  const [text, setText] = useState("");
  const [engine, setEngine] = useState<Engine>("azure");
  const [voice, setVoice] = useState("en-US-AriaNeural");
  const [speed, setSpeed] = useState(1.0);
  const [synthesizing, setSynthesizing] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [ttsError, setTtsError] = useState("");

  // ── STT state ──────────────────────────────────────────────────────────────
  const [recording, setRecording] = useState(false);
  const [transcribedText, setTranscribedText] = useState("");
  const [sttError, setSttError] = useState("");
  const [transcribing, setTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const voices = engine === "elevenlabs" ? ELEVENLABS_VOICES : AZURE_VOICES;

  // ── Synthesize ─────────────────────────────────────────────────────────────
  async function handleSynthesize() {
    if (!text.trim()) return;
    setSynthesizing(true);
    setTtsError("");
    setAudioUrl(null);
    try {
      const res = await fetch("/api/voice/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: text.trim(),
          engine,
          voice,
          speed,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Synthesis failed");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
    } catch (err) {
      setTtsError(err instanceof Error ? err.message : "Synthesis failed");
    } finally {
      setSynthesizing(false);
    }
  }

  // ── Record Audio ───────────────────────────────────────────────────────────
  async function startRecording() {
    setSttError("");
    setTranscribedText("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        await transcribeAudio(blob);
      };

      mediaRecorder.start();
      setRecording(true);
    } catch {
      setSttError("Microphone access denied");
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  }

  async function transcribeAudio(blob: Blob) {
    setTranscribing(true);
    try {
      const formData = new FormData();
      formData.append("audio", blob, "recording.webm");

      const res = await fetch("/api/voice/transcribe", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Transcription failed");

      setTranscribedText(data.text || "(No speech detected)");
    } catch (err) {
      setSttError(
        err instanceof Error ? err.message : "Transcription failed",
      );
    } finally {
      setTranscribing(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Text-to-Speech ──────────────────────────────────────────────── */}
      <div className="glass-panel rounded-3xl p-6 space-y-4">
        <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
          <Volume2 className="h-4 w-4 text-accent" />
          Text-to-Speech
        </h3>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Enter text to convert to speech..."
          rows={4}
          className="w-full rounded-xl bg-surface border border-border/70 p-3 text-sm text-foreground placeholder-muted resize-none focus:outline-none focus:border-accent/50"
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Engine */}
          <div>
            <label className="text-xs font-medium text-muted uppercase tracking-wider">
              Engine
            </label>
            <select
              value={engine}
              onChange={(e) => {
                const eng = e.target.value as Engine;
                setEngine(eng);
                setVoice(
                  eng === "elevenlabs"
                    ? ELEVENLABS_VOICES[0].id
                    : AZURE_VOICES[0].id,
                );
              }}
              className="w-full mt-1 rounded-xl bg-surface border border-border/70 p-2 text-sm text-foreground"
            >
              <option value="azure">Azure Speech (Free Tier)</option>
              <option value="elevenlabs">ElevenLabs (Premium)</option>
            </select>
          </div>

          {/* Voice */}
          <div>
            <label className="text-xs font-medium text-muted uppercase tracking-wider">
              Voice
            </label>
            <select
              value={voice}
              onChange={(e) => setVoice(e.target.value)}
              className="w-full mt-1 rounded-xl bg-surface border border-border/70 p-2 text-sm text-foreground"
            >
              {voices.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.label}
                </option>
              ))}
            </select>
          </div>

          {/* Speed */}
          <div>
            <label className="text-xs font-medium text-muted uppercase tracking-wider">
              Speed: {speed.toFixed(1)}×
            </label>
            <input
              type="range"
              min={0.5}
              max={2.0}
              step={0.1}
              value={speed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              className="w-full mt-3"
            />
          </div>
        </div>

        <button
          onClick={handleSynthesize}
          disabled={synthesizing || !text.trim()}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-accent/20 text-accent font-medium py-3 transition hover:bg-accent/30 disabled:opacity-50"
        >
          {synthesizing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Synthesizing…
            </>
          ) : (
            <>
              <Play className="h-4 w-4" /> Generate Audio
            </>
          )}
        </button>

        {ttsError && <p className="text-sm text-red-400">{ttsError}</p>}

        {audioUrl && (
          <div className="flex items-center gap-3 glass-panel rounded-xl p-3">
            <audio controls src={audioUrl} className="flex-1" />
            <a
              href={audioUrl}
              download="voice-output.mp3"
              className="inline-flex items-center gap-1 rounded-full border border-border/70 px-3 py-1 text-xs text-muted hover:text-accent hover:border-accent/40 transition"
            >
              <Download className="h-3 w-3" /> Download
            </a>
          </div>
        )}
      </div>

      {/* ── Speech-to-Text ──────────────────────────────────────────────── */}
      <div className="glass-panel rounded-3xl p-6 space-y-4">
        <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
          <Mic className="h-4 w-4 text-accent" />
          Speech-to-Text
        </h3>

        <div className="flex gap-3 items-center">
          <button
            onClick={recording ? stopRecording : startRecording}
            disabled={transcribing}
            className={`flex items-center gap-2 rounded-xl px-5 py-3 font-medium transition ${
              recording
                ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                : "bg-accent/20 text-accent hover:bg-accent/30"
            } disabled:opacity-50`}
          >
            {transcribing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Transcribing…
              </>
            ) : recording ? (
              <>
                <MicOff className="h-4 w-4" /> Stop Recording
              </>
            ) : (
              <>
                <Mic className="h-4 w-4" /> Start Recording
              </>
            )}
          </button>

          {recording && (
            <span className="flex items-center gap-1.5 text-sm text-red-400">
              <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
              Recording…
            </span>
          )}
        </div>

        {sttError && <p className="text-sm text-red-400">{sttError}</p>}

        {transcribedText && (
          <div className="glass-panel rounded-xl p-4 space-y-2">
            <label className="text-xs font-medium text-muted uppercase tracking-wider">
              Transcription
            </label>
            <p className="text-sm text-foreground whitespace-pre-wrap">
              {transcribedText}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(transcribedText);
                }}
                className="inline-flex items-center gap-1 rounded-full border border-border/70 px-3 py-1 text-xs text-muted hover:text-accent hover:border-accent/40 transition"
              >
                Copy
              </button>
              <button
                onClick={() => setText(transcribedText)}
                className="inline-flex items-center gap-1 rounded-full border border-border/70 px-3 py-1 text-xs text-muted hover:text-accent hover:border-accent/40 transition"
              >
                Use as TTS Input
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
