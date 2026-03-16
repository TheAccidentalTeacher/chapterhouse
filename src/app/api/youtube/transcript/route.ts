import { YoutubeTranscript } from "youtube-transcript";
import { Client as QStashClient } from "@upstash/qstash";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";
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
    console.warn("[transcript] Caption fetch failed:", error instanceof Error ? error.message : error);
    return null;
  }
}

/** Fallback 1: YouTube's innertube API directly — more reliable from cloud IPs */
async function fetchInnertubeTranscript(
  videoId: string,
): Promise<{ segments: { start: number; text: string }[]; text: string } | null> {
  try {
    // Hit YouTube's innertube player endpoint directly with WEB client
    const playerRes = await fetch(
      "https://www.youtube.com/youtubei/v1/player?prettyPrint=false",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        },
        body: JSON.stringify({
          context: {
            client: {
              clientName: "WEB",
              clientVersion: "2.20260301.00.00",
            },
          },
          videoId,
        }),
        signal: AbortSignal.timeout(15_000),
      },
    );

    if (!playerRes.ok) {
      console.warn("[transcript] Innertube player failed:", playerRes.status);
      return null;
    }

    const playerData = await playerRes.json();
    const captionTracks =
      playerData?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

    if (!Array.isArray(captionTracks) || captionTracks.length === 0) {
      console.warn("[transcript] No caption tracks found in innertube response");
      return null;
    }

    // Pick the best track: prefer English, then first available
    const track =
      captionTracks.find(
        (t: { languageCode: string }) => t.languageCode === "en",
      ) ??
      captionTracks.find(
        (t: { languageCode: string }) => t.languageCode?.startsWith("en"),
      ) ??
      captionTracks[0];

    const trackUrl = track.baseUrl;
    if (!trackUrl) return null;

    // Validate URL is from YouTube
    try {
      const parsed = new URL(trackUrl);
      if (!parsed.hostname.endsWith(".youtube.com")) {
        console.warn("[transcript] Caption track URL not from YouTube");
        return null;
      }
    } catch {
      return null;
    }

    const captionRes = await fetch(trackUrl, {
      signal: AbortSignal.timeout(10_000),
    });
    if (!captionRes.ok) return null;

    const xml = await captionRes.text();

    // Parse XML transcript — handles both <text> and <p> formats
    const segments: { start: number; text: string }[] = [];

    // Try <p t="offset" d="duration"> format first (newer)
    const pRegex = /<p\s+t="(\d+)"\s+d="(\d+)"[^>]*>([\s\S]*?)<\/p>/g;
    let match;
    while ((match = pRegex.exec(xml)) !== null) {
      const offset = parseInt(match[1], 10);
      let segText = match[3];
      // Extract text from <s> tags if present
      const sRegex = /<s[^>]*>([^<]*)<\/s>/g;
      let sMatch;
      let combined = "";
      while ((sMatch = sRegex.exec(segText)) !== null) {
        combined += sMatch[1];
      }
      if (combined) segText = combined;
      else segText = segText.replace(/<[^>]+>/g, "");
      segText = decodeXmlEntities(segText).trim();
      if (segText) {
        segments.push({ start: offset / 1000, text: segText });
      }
    }

    // Fallback to <text start="X" dur="Y"> format (older)
    if (segments.length === 0) {
      const textRegex = /<text start="([^"]*)" dur="([^"]*)">([^<]*)<\/text>/g;
      while ((match = textRegex.exec(xml)) !== null) {
        const start = parseFloat(match[1]);
        const text = decodeXmlEntities(match[3]).trim();
        if (text) segments.push({ start, text });
      }
    }

    if (segments.length === 0) return null;

    return {
      segments,
      text: segments.map((s) => s.text).join(" "),
    };
  } catch (error) {
    console.warn("[transcript] Innertube fallback failed:", error instanceof Error ? error.message : error);
    return null;
  }
}

function decodeXmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) =>
      String.fromCodePoint(parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, dec) =>
      String.fromCodePoint(parseInt(dec, 10)),
    );
}

/** Fallback 2: Google Gemini 2.0 Flash — process YouTube video via fileData */
async function fetchGeminiTranscript(
  videoId: string,
): Promise<{ segments: { start: number; text: string }[]; text: string } | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("[transcript] GEMINI_API_KEY not set — skipping Gemini fallback");
    return null;
  }

  try {
    // Gemini 2.5 Flash supports YouTube URLs as fileData content parts
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  fileData: {
                    fileUri: `https://www.youtube.com/watch?v=${videoId}`,
                    mimeType: "video/*",
                  },
                },
                {
                  text: "Produce a complete, accurate transcript of everything said in this video. Include timestamps in [MM:SS] format at the start of each paragraph. Be thorough — capture every word spoken.",
                },
              ],
            },
          ],
          generationConfig: {
            maxOutputTokens: 16384,
            temperature: 0.1,
          },
        }),
        signal: AbortSignal.timeout(90_000),
      },
    );

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      console.warn("[transcript] Gemini failed:", res.status, errBody.slice(0, 200));
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
    console.warn("[transcript] Gemini error:", error instanceof Error ? error.message : error);
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

    // Track which tiers were attempted for debugging
    const attempts: { tier: string; result: string; ms?: number }[] = [];
    const timerStart = Date.now();

    // Helper to build the response shape
    const buildResponse = (
      transcript: { segments: { start: number; text: string }[]; text: string },
      source: string,
    ) => ({
      videoId,
      title: metadata?.title ?? "",
      channelName: metadata?.channelName ?? "",
      duration: metadata?.duration ?? "",
      transcript: transcript.text,
      segments: transcript.segments,
      source,
      metadata: metadata
        ? {
            viewCount: metadata.viewCount,
            publishedAt: metadata.publishedAt,
            thumbnailUrl: metadata.thumbnailUrl,
            description: metadata.description,
          }
        : null,
    });

    // Try primary captions (youtube-transcript npm)
    if (captionResult) {
      attempts.push({ tier: "captions", result: "success", ms: Date.now() - timerStart });
      return Response.json({ ...buildResponse(captionResult, "captions"), attempts });
    }
    attempts.push({ tier: "captions", result: "no captions available", ms: Date.now() - timerStart });

    // Fallback 1: Direct innertube API (more reliable from cloud IPs)
    console.log("[transcript] Captions failed, trying innertube...");
    let t = Date.now();
    const innertubeResult = await fetchInnertubeTranscript(videoId);
    if (innertubeResult) {
      attempts.push({ tier: "innertube", result: "success", ms: Date.now() - t });
      return Response.json({ ...buildResponse(innertubeResult, "innertube"), attempts });
    }
    attempts.push({ tier: "innertube", result: "failed", ms: Date.now() - t });

    // Fallback 2: Gemini 2.5 Flash — Google→Google, no bot check, works from cloud IPs
    if (fallbackToAI) {
      console.log("[transcript] Innertube failed, trying Gemini transcription...");
      t = Date.now();
      const geminiResult = await fetchGeminiTranscript(videoId);
      if (geminiResult) {
        attempts.push({ tier: "gemini", result: "success", ms: Date.now() - t });
        return Response.json({ ...buildResponse(geminiResult, "gemini"), attempts });
      }
      attempts.push({ tier: "gemini", result: "failed", ms: Date.now() - t });
    }

    // All Vercel-side tiers exhausted — hand off to Railway worker for audio-based fallbacks
    if (fallbackToAI && process.env.QSTASH_TOKEN && process.env.RAILWAY_WORKER_URL) {
      try {
        const supabase = getSupabaseServiceRoleClient();
        if (!supabase) throw new Error("Supabase service client unavailable");
        const { data: job, error: jobError } = await supabase
          .from("jobs")
          .insert({
            type: "youtube_transcript",
            label: metadata?.title ? `YouTube: ${metadata.title.slice(0, 80)}` : `YouTube: ${videoId}`,
            input_payload: { videoId, metadata },
            status: "queued",
          })
          .select()
          .single();

        if (!jobError && job) {
          const qstash = new QStashClient({ token: process.env.QSTASH_TOKEN });
          await qstash.publishJSON({
            url: `${process.env.RAILWAY_WORKER_URL}/process-job`,
            body: { jobId: job.id, type: "youtube_transcript", payload: { videoId, metadata } },
            retries: 3,
          });

          return Response.json({
            jobId: job.id,
            pending: true,
            videoId,
            title: metadata?.title ?? "",
            channelName: metadata?.channelName ?? "",
            duration: metadata?.duration ?? "",
            transcript: "",
            segments: [],
            source: "none" as const,
            metadata: metadata
              ? {
                  viewCount: metadata.viewCount,
                  publishedAt: metadata.publishedAt,
                  thumbnailUrl: metadata.thumbnailUrl,
                  description: metadata.description,
                }
              : null,
            attempts,
          });
        }
      } catch (jobErr) {
        console.warn("[transcript] Failed to create background job:", jobErr);
        // Fall through to the empty-transcript response below
      }
    }

    // QStash not configured or job creation failed — return empty transcript with metadata
    attempts.push({ tier: "ai-fallbacks", result: fallbackToAI ? "qstash-unavailable" : "disabled" });

    // ALL transcript methods failed — still return metadata so the UI can show the video
    console.warn("[transcript] All methods failed for video:", videoId, JSON.stringify(attempts));
    return Response.json({
      videoId,
      title: metadata?.title ?? "",
      channelName: metadata?.channelName ?? "",
      duration: metadata?.duration ?? "",
      transcript: "",
      segments: [],
      source: "none",
      metadata: metadata
        ? {
            viewCount: metadata.viewCount,
            publishedAt: metadata.publishedAt,
            thumbnailUrl: metadata.thumbnailUrl,
            description: metadata.description,
          }
        : null,
      transcriptError:
        "Could not retrieve transcript. No captions available and AI fallbacks failed or are disabled.",
      attempts,
    });
  } catch (error) {
    console.error("YouTube transcript error:", error);
    return Response.json(
      { error: "Internal server error processing transcript request" },
      { status: 500 },
    );
  }
}
