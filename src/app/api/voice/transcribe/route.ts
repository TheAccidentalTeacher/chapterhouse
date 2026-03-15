// ── Speech-to-Text — Azure Speech STT ───────────────────────────────────────

import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const key = process.env.AZURE_SPEECH_KEY;
    const region = process.env.AZURE_SPEECH_REGION || "westus";

    if (!key) {
      return NextResponse.json(
        { error: "AZURE_SPEECH_KEY not configured" },
        { status: 500 },
      );
    }

    const contentType = req.headers.get("content-type") || "";

    let audioBuffer: ArrayBuffer;
    let audioContentType: string;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("audio") as File | null;
      if (!file) {
        return NextResponse.json(
          { error: "No audio file provided" },
          { status: 400 },
        );
      }
      // Limit to 25MB
      if (file.size > 25 * 1024 * 1024) {
        return NextResponse.json(
          { error: "Audio file too large (max 25MB)" },
          { status: 400 },
        );
      }
      audioBuffer = await file.arrayBuffer();
      audioContentType = file.type || "audio/wav";
    } else {
      // Raw audio body
      audioBuffer = await req.arrayBuffer();
      audioContentType = contentType || "audio/wav";
    }

    const language =
      new URL(req.url).searchParams.get("language") || "en-US";

    const response = await fetch(
      `https://${region}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${language}`,
      {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": key,
          "Content-Type": audioContentType,
        },
        body: audioBuffer,
      },
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Azure Speech STT error: ${err}`);
    }

    const result = await response.json();

    return NextResponse.json({
      text: result.DisplayText || "",
      status: result.RecognitionStatus,
      duration: result.Duration,
      offset: result.Offset,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Transcription failed";
    console.error("[voice/transcribe]", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
