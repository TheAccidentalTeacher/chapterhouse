import { NextRequest, NextResponse } from "next/server";

const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;

export async function GET(req: NextRequest) {
  if (!HEYGEN_API_KEY) {
    return NextResponse.json(
      { error: "HeyGen API key not configured" },
      { status: 500 }
    );
  }

  const videoId = req.nextUrl.searchParams.get("videoId");
  if (!videoId) {
    return NextResponse.json(
      { error: "videoId query parameter is required" },
      { status: 400 }
    );
  }

  const response = await fetch(
    `https://api.heygen.com/v1/video_status.get?video_id=${encodeURIComponent(videoId)}`,
    {
      headers: {
        "X-Api-Key": HEYGEN_API_KEY,
      },
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    return NextResponse.json(
      { error: `HeyGen status check failed: ${response.status}`, details: errText },
      { status: 502 }
    );
  }

  const data = await response.json();
  const status = data?.data?.status;
  const videoUrl = data?.data?.video_url;
  const thumbnailUrl = data?.data?.thumbnail_url;

  return NextResponse.json({
    videoId,
    status: status ?? "unknown",
    videoUrl: videoUrl ?? null,
    thumbnailUrl: thumbnailUrl ?? null,
  });
}
