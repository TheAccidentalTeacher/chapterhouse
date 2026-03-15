import { YoutubeTranscript } from "youtube-transcript";
import { z } from "zod";

// --- Zod schema ---
const transcriptSchema = z.object({
  videoUrl: z.string().min(1),
  language: z.string().default("en"),
  fallbackToAI: z.boolean().default(true),
});

// --- Helpers ---

/** Extract video ID from various YouTube URL formats */
function extractVideoId(input: string): string | null {
  // Already a raw video ID (11 chars, alphanumeric + - _)
  if (/^[a-zA-Z0-9_-]{11}$/.test(input.trim())) return input.trim();

  try {
    const url = new URL(input);
    const hostname = url.hostname.replace("www.", "");

    if (hostname === "youtube.com" || hostname === "m.youtube.com") {
      // /watch?v=ID or /shorts/ID or /embed/ID or /v/ID
      if (url.searchParams.has("v")) return url.searchParams.get("v");
      const pathMatch = url.pathname.match(
        /\/(shorts|embed|v)\/([a-zA-Z0-9_-]{11})/,
      );
      if (pathMatch) return pathMatch[2];
    }

    if (hostname === "youtu.be") {
      const id = url.pathname.slice(1);
      if (/^[a-zA-Z0-9_-]{11}$/.test(id)) return id;
    }

    // music.youtube.com
    if (hostname === "music.youtube.com" && url.searchParams.has("v")) {
      return url.searchParams.get("v");
    }
  } catch {
    // Not a URL
  }

  return null;
}

/** Fetch video metadata from YouTube Data API v3 */
async function fetchVideoMetadata(videoId: string) {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return null;

  const params = new URLSearchParams({
    part: "snippet,contentDetails,statistics",
    id: videoId,
    key: apiKey,
  });

  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/videos?${params}`,
    { signal: AbortSignal.timeout(10_000) },
  );

  if (!res.ok) {
    console.error("YouTube Data API error:", res.status, await res.text());
    return null;
  }

  const data = await res.json();
  const item = data.items?.[0];
  if (!item) return null;

  return {
    title: item.snippet?.title ?? "",
    channelName: item.snippet?.channelTitle ?? "",
    description: item.snippet?.description ?? "",
    publishedAt: item.snippet?.publishedAt ?? "",
    thumbnailUrl:
      item.snippet?.thumbnails?.high?.url ??
      item.snippet?.thumbnails?.default?.url ??
      "",
    duration: item.contentDetails?.duration ?? "",
    viewCount: Number(item.statistics?.viewCount ?? 0),
  };
}

/** Primary: fetch transcript via youtube-transcript npm */
async function fetchCaptions(
  videoId: string,
  language: string,
): Promise<{ segments: { start: number; text: string }[]; text: string } | null> {
  try {
    const segments = await YoutubeTranscript.fetchTranscript(videoId, {
      lang: language,
    });

    if (!segments || segments.length === 0) return null;

    const mapped = segments.map((s) => ({
      start: s.offset / 1000, // ms → seconds
      text: s.text,
    }));

    const text = mapped.map((s) => s.text).join(" ");
    return { segments: mapped, text };
  } catch (error) {
    console.warn("Caption fetch failed:", error);
    return null;
  }
}

/** Fallback 1: Google Gemini 2.0 Flash — send video URL for AI transcript */
async function fetchGeminiTranscript(
  videoId: string,
): Promise<{ segments: { start: number; text: string }[]; text: string } | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Watch this YouTube video and produce a complete, accurate transcript of everything said. Include timestamps in [MM:SS] format at the start of each paragraph. Be thorough — capture every word spoken. Video URL: https://www.youtube.com/watch?v=${videoId}`,
                },
              ],
            },
          ],
          generationConfig: {
            maxOutputTokens: 8192,
            temperature: 0.1,
          },
        }),
        signal: AbortSignal.timeout(60_000),
      },
    );

    if (!res.ok) {
      console.warn("Gemini transcript failed:", res.status);
      return null;
    }

    const data = await res.json();
    const text =
      data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    if (!text || text.length < 50) return null;

    // Parse timestamps from Gemini output [MM:SS] → seconds
    const segments: { start: number; text: string }[] = [];
    const chunks = text.split(/\[(\d{1,2}:\d{2})\]/);

    for (let i = 1; i < chunks.length; i += 2) {
      const timeParts = chunks[i].split(":");
      const seconds =
        parseInt(timeParts[0], 10) * 60 + parseInt(timeParts[1], 10);
      const segText = chunks[i + 1]?.trim();
      if (segText) {
        segments.push({ start: seconds, text: segText });
      }
    }

    // If parsing failed, return as single segment
    if (segments.length === 0) {
      segments.push({ start: 0, text });
    }

    return { segments, text: segments.map((s) => s.text).join(" ") };
  } catch (error) {
    console.warn("Gemini transcript error:", error);
    return null;
  }
}

/** Fallback 2: OpenAI Whisper — download audio, transcribe via STT */
async function fetchWhisperTranscript(
  videoId: string,
): Promise<{ segments: { start: number; text: string }[]; text: string } | null> {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) return null;

  try {
    // Dynamic import to avoid bundling ytdl-core on every request
    const ytdl = await import("@distube/ytdl-core");

    const url = `https://www.youtube.com/watch?v=${videoId}`;

    // Get audio-only stream info
    const info = await ytdl.default.getInfo(url);
    const audioFormat = ytdl.default.chooseFormat(info.formats, {
      quality: "lowestaudio",
      filter: "audioonly",
    });

    if (!audioFormat?.url) {
      console.warn("No audio format found for Whisper fallback");
      return null;
    }

    // Download audio into a buffer
    const audioRes = await fetch(audioFormat.url, {
      signal: AbortSignal.timeout(120_000),
    });
    if (!audioRes.ok) return null;

    const audioBuffer = await audioRes.arrayBuffer();

    // Send to Whisper
    const formData = new FormData();
    formData.append(
      "file",
      new Blob([audioBuffer], { type: "audio/mp4" }),
      "audio.mp4",
    );
    formData.append("model", "whisper-1");
    formData.append("response_format", "verbose_json");
    formData.append("timestamp_granularities[]", "segment");

    const whisperRes = await fetch(
      "https://api.openai.com/v1/audio/transcriptions",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${openaiKey}` },
        body: formData,
        signal: AbortSignal.timeout(120_000),
      },
    );

    if (!whisperRes.ok) {
      console.warn("Whisper API error:", whisperRes.status);
      return null;
    }

    const whisperData = await whisperRes.json();
    const segments = (whisperData.segments ?? []).map(
      (s: { start: number; text: string }) => ({
        start: Math.round(s.start),
        text: s.text.trim(),
      }),
    );

    return {
      segments,
      text: whisperData.text ?? segments.map((s: { text: string }) => s.text).join(" "),
    };
  } catch (error) {
    console.warn("Whisper transcript error:", error);
    return null;
  }
}

// --- Route handler ---

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = transcriptSchema.safeParse(body);

    if (!parsed.success) {
      return Response.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { videoUrl, language, fallbackToAI } = parsed.data;
    const videoId = extractVideoId(videoUrl);

    if (!videoId) {
      return Response.json(
        { error: "Could not extract a valid YouTube video ID from the provided URL" },
        { status: 400 },
      );
    }

    // Fetch metadata in parallel with transcript attempt
    const [metadata, captionResult] = await Promise.all([
      fetchVideoMetadata(videoId),
      fetchCaptions(videoId, language),
    ]);

    // Try primary captions
    if (captionResult) {
      return Response.json({
        videoId,
        title: metadata?.title ?? "",
        channelName: metadata?.channelName ?? "",
        duration: metadata?.duration ?? "",
        transcript: captionResult.text,
        segments: captionResult.segments,
        source: "captions" as const,
        metadata: metadata
          ? {
              viewCount: metadata.viewCount,
              publishedAt: metadata.publishedAt,
              thumbnailUrl: metadata.thumbnailUrl,
              description: metadata.description,
            }
          : null,
      });
    }

    // Fallback chain (only if enabled)
    if (fallbackToAI) {
      // Fallback 1: Gemini
      const geminiResult = await fetchGeminiTranscript(videoId);
      if (geminiResult) {
        return Response.json({
          videoId,
          title: metadata?.title ?? "",
          channelName: metadata?.channelName ?? "",
          duration: metadata?.duration ?? "",
          transcript: geminiResult.text,
          segments: geminiResult.segments,
          source: "gemini" as const,
          metadata: metadata
            ? {
                viewCount: metadata.viewCount,
                publishedAt: metadata.publishedAt,
                thumbnailUrl: metadata.thumbnailUrl,
                description: metadata.description,
              }
            : null,
        });
      }

      // Fallback 2: Whisper
      const whisperResult = await fetchWhisperTranscript(videoId);
      if (whisperResult) {
        return Response.json({
          videoId,
          title: metadata?.title ?? "",
          channelName: metadata?.channelName ?? "",
          duration: metadata?.duration ?? "",
          transcript: whisperResult.text,
          segments: whisperResult.segments,
          source: "whisper" as const,
          metadata: metadata
            ? {
                viewCount: metadata.viewCount,
                publishedAt: metadata.publishedAt,
                thumbnailUrl: metadata.thumbnailUrl,
                description: metadata.description,
              }
            : null,
        });
      }
    }

    return Response.json(
      {
        error: "Could not retrieve transcript. No captions available and AI fallbacks failed or are disabled.",
      },
      { status: 404 },
    );
  } catch (error) {
    console.error("YouTube transcript error:", error);
    return Response.json(
      { error: "Internal server error processing transcript request" },
      { status: 500 },
    );
  }
}
