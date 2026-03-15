// ── Voice Synthesis — ElevenLabs + Azure Speech TTS ─────────────────────────

import { NextResponse } from "next/server";

interface SynthesizeRequest {
  text: string;
  engine: "elevenlabs" | "azure";
  voice?: string;
  language?: string;
  speed?: number;
}

// ── ElevenLabs ─────────────────────────────────────────────────────────────────

async function synthesizeElevenLabs(
  text: string,
  voiceId: string,
  speed: number,
): Promise<ArrayBuffer> {
  const key =
    process.env.ELEVENLABS_CURRICULUM_KEY ||
    process.env.ELEVENLABS_GENERAL_KEY;
  if (!key) throw new Error("No ElevenLabs API key configured");

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": key,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_turbo_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          speed,
        },
      }),
    },
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`ElevenLabs error: ${err}`);
  }

  return response.arrayBuffer();
}

// ── Azure Speech ───────────────────────────────────────────────────────────────

async function synthesizeAzure(
  text: string,
  voice: string,
  language: string,
  speed: number,
): Promise<ArrayBuffer> {
  const key = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION || "westus";
  if (!key) throw new Error("AZURE_SPEECH_KEY not configured");

  // Escape XML special chars in text
  const escaped = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  const ssml = `<speak version='1.0' xml:lang='${language}'>
    <voice name='${voice}'><prosody rate='${speed}'>${escaped}</prosody></voice>
  </speak>`;

  const response = await fetch(
    `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`,
    {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": key,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": "audio-24khz-160kbitrate-mono-mp3",
      },
      body: ssml,
    },
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Azure Speech error: ${err}`);
  }

  return response.arrayBuffer();
}

// ── Route Handler ──────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as SynthesizeRequest;

    if (!body.text || body.text.length < 1 || body.text.length > 50000) {
      return NextResponse.json(
        { error: "Text must be 1-50000 characters" },
        { status: 400 },
      );
    }

    const engine = body.engine || "azure";
    const speed = Math.min(Math.max(body.speed || 1.0, 0.5), 2.0);

    let audioBuffer: ArrayBuffer;

    if (engine === "elevenlabs") {
      const voiceId = body.voice || "21m00Tcm4TlvDq8ikWAM"; // Default: Rachel
      audioBuffer = await synthesizeElevenLabs(body.text, voiceId, speed);
    } else {
      const voice = body.voice || "en-US-AriaNeural";
      const language = body.language || "en-US";
      audioBuffer = await synthesizeAzure(body.text, voice, language, speed);
    }

    return new NextResponse(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Synthesis failed";
    console.error("[voice/synthesize]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
