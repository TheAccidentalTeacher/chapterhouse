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
    // Gemini 2.0 Flash supports YouTube URLs as fileData content parts
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
            maxOutputTokens: 8192,
            temperature: 0.1,
          },
        }),
        signal: AbortSignal.timeout(60_000),
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

/** Fallback 3: OpenAI Whisper — download audio, transcribe via STT */
async function fetchWhisperTranscript(
  videoId: string,
): Promise<{ segments: { start: number; text: string }[]; text: string } | null> {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    console.warn("[transcript] OPENAI_API_KEY not set — skipping Whisper fallback");
    return null;
  }

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
      console.warn("[transcript] No audio format found for Whisper fallback");
      return null;
    }

    // Validate the audio URL is from a known Google/YouTube CDN
    try {
      const audioUrlParsed = new URL(audioFormat.url);
      const allowedHosts = [".googlevideo.com", ".youtube.com", ".ytimg.com"];
      if (!allowedHosts.some((h) => audioUrlParsed.hostname.endsWith(h))) {
        console.warn("[transcript] Audio URL not from Google CDN");
        return null;
      }
    } catch {
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
      console.warn("[transcript] Whisper API error:", whisperRes.status);
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
    console.warn("[transcript] Whisper error:", error instanceof Error ? error.message : error);
    return null;
  }
}

/** Fallback 4: Gemini Video Analysis — asks for educational content analysis, not verbatim transcript */
async function fetchGeminiVideoAnalysis(
  videoId: string,
  metadata: { title: string; channelName: string; description: string; duration: string } | null,
): Promise<{ segments: { start: number; text: string }[]; text: string } | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn("[transcript] GEMINI_API_KEY not set — skipping Gemini video analysis");
    return null;
  }

  const metadataContext = metadata
    ? `\n\nVideo context — Title: ${metadata.title} | Channel: ${metadata.channelName} | Duration: ${metadata.duration}`
    : "";

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
                  fileData: {
                    fileUri: `https://www.youtube.com/watch?v=${videoId}`,
                    mimeType: "video/*",
                  },
                },
                {
                  text: `Provide a comprehensive educational analysis of this video. Include ALL of the following sections:

## CONTENT SUMMARY
A detailed summary of everything covered in the video (at least 500 words). Capture the main narrative, key arguments, and all facts presented.

## KEY TOPICS
List every major topic and subtopic discussed, in order of appearance.

## KEY VOCABULARY
Important terms, names, places, and concepts with brief definitions as used in the video.

## LEARNING OBJECTIVES
What a student would learn from watching this video. List 5-8 specific, measurable objectives.

## VISUAL ELEMENTS
Describe any maps, diagrams, charts, demonstrations, images, or visual aids shown.

## SPEAKER NOTES
Summarize the key points, arguments, and conclusions made by the speaker(s).

## TIMELINE
Break the video into logical sections with approximate timestamps.

Be thorough and detailed. This analysis will be used to generate quizzes, lesson plans, vocabulary lists, and other curriculum materials.${metadataContext}`,
                },
              ],
            },
          ],
          generationConfig: {
            maxOutputTokens: 8192,
            temperature: 0.2,
          },
        }),
        signal: AbortSignal.timeout(90_000),
      },
    );

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      console.warn("[transcript] Gemini video analysis failed:", res.status, errBody.slice(0, 300));
      return null;
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    if (!text || text.length < 100) return null;

    return {
      segments: [{ start: 0, text }],
      text,
    };
  } catch (error) {
    console.warn("[transcript] Gemini video analysis error:", error instanceof Error ? error.message : error);
    return null;
  }
}

/** Fallback 5: Metadata Synthesis — Claude Haiku generates educational content from title + description */
async function synthesizeFromMetadata(
  metadata: { title: string; channelName: string; description: string; duration: string },
): Promise<{ segments: { start: number; text: string }[]; text: string } | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.warn("[transcript] ANTHROPIC_API_KEY not set — skipping metadata synthesis");
    return null;
  }
  if (!metadata.description || metadata.description.length < 20) {
    console.warn("[transcript] Description too short for useful synthesis");
    return null;
  }

  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey });

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20250901",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: `You are an educational content analyst. A YouTube video could not be transcribed, but we have its metadata. Generate a comprehensive educational analysis that can be used to create curriculum materials (quizzes, lesson plans, vocabulary lists, etc.).

VIDEO TITLE: ${metadata.title}
CHANNEL: ${metadata.channelName}
DURATION: ${metadata.duration}

VIDEO DESCRIPTION:
${metadata.description.slice(0, 4000)}

Generate the following sections based on available information:

## CONTENT SUMMARY
What this video covers based on the title, description, and any chapter markers. Be thorough.

## KEY TOPICS
Main subjects and subtopics likely discussed.

## KEY VOCABULARY
Important terms and concepts related to the topic.

## LEARNING OBJECTIVES
What students would learn from this video (5-8 specific objectives).

## EDUCATIONAL CONTEXT
How this content fits into standard curriculum areas (Common Core, NGSS, C3, etc.).

Note: This analysis is based on video metadata, not the actual video content. It provides a strong foundation for curriculum tool generation but may not capture every detail discussed in the video.`,
        },
      ],
    });

    const text =
      response.content[0]?.type === "text" ? response.content[0].text : "";
    if (!text || text.length < 100) return null;

    return {
      segments: [{ start: 0, text }],
      text,
    };
  } catch (error) {
    console.warn(
      "[transcript] Metadata synthesis error:",
      error instanceof Error ? error.message : error,
    );
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

    // Fallback chain (only if enabled)
    if (fallbackToAI) {
      // Fallback 2: Gemini (YouTube URL via fileData)
      console.log("[transcript] Innertube failed, trying Gemini...");
      t = Date.now();
      const geminiResult = await fetchGeminiTranscript(videoId);
      if (geminiResult) {
        attempts.push({ tier: "gemini-transcript", result: "success", ms: Date.now() - t });
        return Response.json({ ...buildResponse(geminiResult, "gemini"), attempts });
      }
      attempts.push({ tier: "gemini-transcript", result: process.env.GEMINI_API_KEY ? "api-call-failed" : "no-api-key", ms: Date.now() - t });

      // Fallback 3: Whisper (download + STT — fragile on serverless)
      console.log("[transcript] Gemini failed, trying Whisper...");
      t = Date.now();
      const whisperResult = await fetchWhisperTranscript(videoId);
      if (whisperResult) {
        attempts.push({ tier: "whisper", result: "success", ms: Date.now() - t });
        return Response.json({ ...buildResponse(whisperResult, "whisper"), attempts });
      }
      attempts.push({ tier: "whisper", result: process.env.OPENAI_API_KEY ? "api-call-failed" : "no-api-key", ms: Date.now() - t });

      // Fallback 4: Gemini Video Analysis (educational analysis, not verbatim transcript)
      console.log("[transcript] Whisper failed, trying Gemini video analysis...");
      t = Date.now();
      const analysisResult = await fetchGeminiVideoAnalysis(videoId, metadata);
      if (analysisResult) {
        attempts.push({ tier: "gemini-analysis", result: "success", ms: Date.now() - t });
        return Response.json({ ...buildResponse(analysisResult, "gemini-analysis"), attempts });
      }
      attempts.push({ tier: "gemini-analysis", result: process.env.GEMINI_API_KEY ? "api-call-failed" : "no-api-key", ms: Date.now() - t });

      // Fallback 5: Metadata Synthesis via Claude (uses title + description)
      if (metadata) {
        console.log("[transcript] Gemini analysis failed, trying metadata synthesis...");
        t = Date.now();
        const synthesisResult = await synthesizeFromMetadata(metadata);
        if (synthesisResult) {
          attempts.push({ tier: "metadata-synthesis", result: "success", ms: Date.now() - t });
          return Response.json({ ...buildResponse(synthesisResult, "metadata-synthesis"), attempts });
        }
        attempts.push({ tier: "metadata-synthesis", result: process.env.ANTHROPIC_API_KEY ? "api-call-failed" : "no-api-key", ms: Date.now() - t });
      } else {
        attempts.push({ tier: "metadata-synthesis", result: "no-metadata-available" });
      }
    } else {
      attempts.push({ tier: "ai-fallbacks", result: "disabled" });
    }

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
