import { z } from "zod";

const searchSchema = z.object({
  q: z.string().min(1).max(200),
  maxResults: z.coerce.number().min(1).max(25).default(10),
});

export async function GET(req: Request) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "YOUTUBE_API_KEY not configured" },
      { status: 503 },
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const parsed = searchSchema.safeParse({
      q: searchParams.get("q"),
      maxResults: searchParams.get("maxResults") ?? "10",
    });

    if (!parsed.success) {
      return Response.json(
        { error: "Invalid search parameters", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { q, maxResults } = parsed.data;

    // Step 1: Search for videos
    const searchUrl = new URLSearchParams({
      part: "snippet",
      type: "video",
      q,
      maxResults: String(maxResults),
      key: apiKey,
    });

    const searchRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?${searchUrl}`,
      { signal: AbortSignal.timeout(10_000) },
    );

    if (!searchRes.ok) {
      const errText = await searchRes.text();
      console.error("YouTube search API error:", searchRes.status, errText);
      return Response.json(
        { error: "YouTube search failed" },
        { status: searchRes.status },
      );
    }

    const searchData = await searchRes.json();
    const videoIds = (searchData.items ?? [])
      .map((item: { id?: { videoId?: string } }) => item.id?.videoId)
      .filter(Boolean) as string[];

    if (videoIds.length === 0) {
      return Response.json({ results: [] });
    }

    // Step 2: Fetch full metadata for all videos in one call
    const videosUrl = new URLSearchParams({
      part: "snippet,contentDetails,statistics",
      id: videoIds.join(","),
      key: apiKey,
    });

    const videosRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?${videosUrl}`,
      { signal: AbortSignal.timeout(10_000) },
    );

    if (!videosRes.ok) {
      // Fallback: return search results without full metadata
      const results = (searchData.items ?? []).map(
        (item: {
          id?: { videoId?: string };
          snippet?: {
            title?: string;
            channelTitle?: string;
            thumbnails?: { high?: { url?: string }; default?: { url?: string } };
            publishedAt?: string;
          };
        }) => ({
          videoId: item.id?.videoId ?? "",
          title: item.snippet?.title ?? "",
          channelName: item.snippet?.channelTitle ?? "",
          thumbnailUrl:
            item.snippet?.thumbnails?.high?.url ??
            item.snippet?.thumbnails?.default?.url ??
            "",
          duration: "",
          viewCount: 0,
          publishedAt: item.snippet?.publishedAt ?? "",
        }),
      );
      return Response.json({ results });
    }

    const videosData = await videosRes.json();
    const results = (videosData.items ?? []).map(
      (item: {
        id?: string;
        snippet?: {
          title?: string;
          channelTitle?: string;
          thumbnails?: { high?: { url?: string }; default?: { url?: string } };
          publishedAt?: string;
        };
        contentDetails?: { duration?: string };
        statistics?: { viewCount?: string };
      }) => ({
        videoId: item.id ?? "",
        title: item.snippet?.title ?? "",
        channelName: item.snippet?.channelTitle ?? "",
        thumbnailUrl:
          item.snippet?.thumbnails?.high?.url ??
          item.snippet?.thumbnails?.default?.url ??
          "",
        duration: item.contentDetails?.duration ?? "",
        viewCount: Number(item.statistics?.viewCount ?? 0),
        publishedAt: item.snippet?.publishedAt ?? "",
      }),
    );

    return Response.json({ results });
  } catch (error) {
    console.error("YouTube search error:", error);
    return Response.json(
      { error: "Internal server error during search" },
      { status: 500 },
    );
  }
}
