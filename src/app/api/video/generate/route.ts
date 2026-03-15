import { NextRequest, NextResponse } from "next/server";

const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;

export async function POST(req: NextRequest) {
  if (!HEYGEN_API_KEY) {
    return NextResponse.json(
      { error: "HeyGen API key not configured" },
      { status: 500 }
    );
  }

  const body = await req.json();
  const { script, avatarId, voiceId, dimensions } = body;

  if (!script || typeof script !== "string" || script.length < 10) {
    return NextResponse.json(
      { error: "Script must be at least 10 characters" },
      { status: 400 }
    );
  }

  if (script.length > 5000) {
    return NextResponse.json(
      { error: "Script exceeds 5,000 character limit" },
      { status: 400 }
    );
  }

  if (!avatarId) {
    return NextResponse.json(
      { error: "avatarId is required" },
      { status: 400 }
    );
  }

  const width = dimensions?.width ?? 1280;
  const height = dimensions?.height ?? 720;

  const response = await fetch("https://api.heygen.com/v2/video/generate", {
    method: "POST",
    headers: {
      "X-Api-Key": HEYGEN_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      video_inputs: [
        {
          character: { type: "avatar", avatar_id: avatarId },
          voice: {
            type: "text",
            input_text: script,
            ...(voiceId ? { voice_id: voiceId } : {}),
          },
        },
      ],
      dimension: { width, height },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    return NextResponse.json(
      { error: `HeyGen API error: ${response.status}`, details: errText },
      { status: 502 }
    );
  }

  const data = await response.json();
  const videoId = data?.data?.video_id;

  if (!videoId) {
    return NextResponse.json(
      { error: "No video_id returned from HeyGen" },
      { status: 502 }
    );
  }

  return NextResponse.json({
    videoId,
    status: "processing",
    message: "Video generation started. Poll /api/video/status?videoId=... for progress.",
  });
}
