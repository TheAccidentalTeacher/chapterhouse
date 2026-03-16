import { updateProgress } from "../lib/progress";
import Anthropic from "@anthropic-ai/sdk";

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

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
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

    const whisperData = await whisperRes.json();
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

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
    if (!text || text.length < 100) return null;

    return { segments: [{ start: 0, text }], text };
  } catch {
    return null;
  }
}

/** Tier 6: Claude Haiku — synthesize educational content from title + description */
async function synthesizeFromMetadata(
  metadata: NonNullable<YoutubeTranscriptPayload["metadata"]>
): Promise<TranscriptResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || !metadata.description || metadata.description.length < 20) return null;

  try {
    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: "claude-haiku-4-5",
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

    const text = response.content[0]?.type === "text" ? response.content[0].text : "";
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

  // Tier 6: Claude metadata synthesis
  await updateProgress(jobId, 80, "Tier 6 of 6 — Generating from video metadata...", "running");
  if (metadata) {
    const synthesisResult = await synthesizeFromMetadata(metadata);
    if (synthesisResult) {
      await updateProgress(
        jobId, 100, "✓ Content synthesized from metadata", "completed",
        buildOutput(videoId, synthesisResult, "metadata-synthesis", metadata)
      );
      return;
    }
  }

  // All fallbacks exhausted — still mark completed so UI can show the video
  await updateProgress(
    jobId, 100, "No transcript available for this video", "completed",
    buildOutput(
      videoId, { segments: [], text: "" }, "none", metadata,
      "All transcript methods failed. No captions available and AI fallbacks exhausted."
    )
  );
}
