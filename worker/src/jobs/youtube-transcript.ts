import { updateProgress } from "../lib/progress";

export interface YoutubeTranscriptPayload {
  videoId: string;
  metadata: {
    title: string;
    channelName: string;
    description: string;
    duration: string;
    viewCount: number;
    publishedAt: string;
    thumbnailUrl: string;
  } | null;
}

type TranscriptResult = { segments: { start: number; text: string }[]; text: string };

function buildOutput(
  videoId: string,
  result: TranscriptResult,
  source: string,
  metadata: YoutubeTranscriptPayload["metadata"],
  transcriptError?: string
) {
  return {
    videoId,
    title: metadata?.title ?? "",
    channelName: metadata?.channelName ?? "",
    duration: metadata?.duration ?? "",
    transcript: result.text,
    segments: result.segments,
    source,
    metadata: metadata
      ? {
          viewCount: metadata.viewCount,
          publishedAt: metadata.publishedAt,
          thumbnailUrl: metadata.thumbnailUrl,
          description: metadata.description,
        }
      : null,
    ...(transcriptError && { transcriptError }),
  };
}

/** Tier 3: Gemini 2.5 Flash — verbatim transcript via YouTube fileData */
async function fetchGeminiTranscript(videoId: string): Promise<TranscriptResult | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  try {
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
                  text: `Transcribe this video verbatim. Output ONLY the transcript text, with timestamps in [MM:SS] format at the start of each paragraph or speaker turn.

Format:
[00:00] <text>
[01:30] <text>

No headers, no summaries, no additional commentary. Just the raw transcript with timestamps.`,
                },
              ],
            },
          ],
          generationConfig: {
            maxOutputTokens: 16384,
            temperature: 0.1,
          },
        }),
        signal: AbortSignal.timeout(60_000),
      }
    );

    if (!res.ok) return null;

    const data = (await res.json()) as Record<string, unknown>;
    const text = (data.candidates as Array<{content:{parts:Array<{text:string}>}}>)?.[0]?.content?.parts?.[0]?.text ?? "";
    if (!text || text.length < 50) return null;

    // Parse [MM:SS] timestamps into segments
    const segments: { start: number; text: string }[] = [];
    const lines = text.split("\n").filter((l: string) => l.trim());
    for (const line of lines) {
      const match = line.match(/^\[(\d+):(\d+)\]\s*(.*)/);
      if (match) {
        const start = parseInt(match[1]) * 60 + parseInt(match[2]);
        segments.push({ start, text: match[3] });
      }
    }

    return segments.length > 0
      ? { segments, text }
      : { segments: [{ start: 0, text }], text };
  } catch {
    return null;
  }
}

/** Tier 4: Whisper — download audio via ytdl-core, transcribe via OpenAI */
async function fetchWhisperTranscript(videoId: string): Promise<TranscriptResult | null> {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) return null;

  try {
    const ytdl = await import("@distube/ytdl-core");
    const url = `https://www.youtube.com/watch?v=${videoId}`;

    const info = await ytdl.default.getInfo(url);
    const audioFormat = ytdl.default.chooseFormat(info.formats, {
      quality: "lowestaudio",
      filter: "audioonly",
    });

    if (!audioFormat?.url) return null;

    // Validate audio URL is from Google CDN (SSRF protection)
    const audioUrlParsed = new URL(audioFormat.url);
    const allowedHosts = [".googlevideo.com", ".youtube.com", ".ytimg.com"];
    if (!allowedHosts.some((h) => audioUrlParsed.hostname.endsWith(h))) return null;

    const audioRes = await fetch(audioFormat.url, { signal: AbortSignal.timeout(120_000) });
    if (!audioRes.ok) return null;

    const audioBuffer = await audioRes.arrayBuffer();

    const formData = new FormData();
    formData.append("file", new Blob([audioBuffer], { type: "audio/mp4" }), "audio.mp4");
    formData.append("model", "whisper-1");
    formData.append("response_format", "verbose_json");
    formData.append("timestamp_granularities[]", "segment");

    const whisperRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${openaiKey}` },
      body: formData,
      signal: AbortSignal.timeout(120_000),
    });

    if (!whisperRes.ok) return null;

    const whisperData = (await whisperRes.json()) as { text?: string; segments?: Array<{ start: number; text: string }> };
    const segments = (whisperData.segments ?? []).map(
      (s: { start: number; text: string }) => ({ start: Math.round(s.start), text: s.text.trim() })
    );

    return {
      segments,
      text: whisperData.text ?? segments.map((s: { text: string }) => s.text).join(" "),
    };
  } catch {
    return null;
  }
}

/** Tier 5: Gemini Video Analysis — educational content analysis, not verbatim */
async function fetchGeminiVideoAnalysis(
  videoId: string,
  metadata: YoutubeTranscriptPayload["metadata"]
): Promise<TranscriptResult | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  const metadataContext = metadata
    ? `\n\nVideo context — Title: ${metadata.title} | Channel: ${metadata.channelName} | Duration: ${metadata.duration}`
    : "";

  try {
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
      }
    );

    if (!res.ok) return null;

    const data = (await res.json()) as Record<string, unknown>;
    const text = (data.candidates as Array<{content:{parts:Array<{text:string}>}}>)?.[0]?.content?.parts?.[0]?.text ?? "";
    if (!text || text.length < 100) return null;

    return { segments: [{ start: 0, text }], text };
  } catch {
    return null;
  }
}

/** Main runner — receives job from QStash→Railway, runs tiers 3-6 */
export async function runYoutubeTranscript(jobId: string, payload: YoutubeTranscriptPayload) {
  const { videoId, metadata } = payload;

  // Tier 3: Gemini verbatim transcript
  await updateProgress(jobId, 15, "Tier 3 of 6 — Gemini transcript extraction...", "running");
  const geminiResult = await fetchGeminiTranscript(videoId);
  if (geminiResult) {
    await updateProgress(
      jobId, 100, "✓ Transcript extracted via Gemini", "completed",
      buildOutput(videoId, geminiResult, "gemini", metadata)
    );
    return;
  }

  // Tier 4: Whisper (audio download + STT)
  await updateProgress(jobId, 35, "Tier 4 of 6 — Whisper audio transcription...", "running");
  const whisperResult = await fetchWhisperTranscript(videoId);
  if (whisperResult) {
    await updateProgress(
      jobId, 100, "✓ Transcript extracted via Whisper", "completed",
      buildOutput(videoId, whisperResult, "whisper", metadata)
    );
    return;
  }

  // Tier 5: Gemini educational analysis
  await updateProgress(jobId, 60, "Tier 5 of 6 — Gemini educational analysis...", "running");
  const analysisResult = await fetchGeminiVideoAnalysis(videoId, metadata);
  if (analysisResult) {
    await updateProgress(
      jobId, 100, "✓ Educational analysis complete", "completed",
      buildOutput(videoId, analysisResult, "gemini-analysis", metadata)
    );
    return;
  }

  // Tier 6: final exhaustion state — do not synthesize fake content from metadata.
  await updateProgress(jobId, 80, "Tier 6 of 6 — No usable transcript or analysis found...", "running");

  // All fallbacks exhausted — still mark completed so UI can show the video
  await updateProgress(
    jobId, 100, "No transcript available for this video", "completed",
    buildOutput(
      videoId, { segments: [], text: "" }, "none", metadata,
      "All transcript methods failed. No captions available and AI fallbacks exhausted."
    )
  );
}
