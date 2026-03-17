import { updateProgress } from "../lib/progress";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import sdk from "microsoft-cognitiveservices-speech-sdk";

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
type AttemptRecord = { tier: string; result: string; detail?: string };

const execFileAsync = promisify(execFile);

function buildOutput(
  videoId: string,
  result: TranscriptResult,
  source: string,
  metadata: YoutubeTranscriptPayload["metadata"],
  transcriptError?: string,
  attempts?: AttemptRecord[]
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
    ...(attempts ? { attempts } : {}),
    ...(transcriptError && { transcriptError }),
  };
}

function getYoutubeUrl(videoId: string) {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

async function withTempDir<T>(prefix: string, work: (dir: string) => Promise<T>) {
  const dir = await mkdtemp(path.join(os.tmpdir(), prefix));
  try {
    return await work(dir);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

async function runCommand(command: string, args: string[], timeoutMs: number) {
  return execFileAsync(command, args, {
    timeout: timeoutMs,
    maxBuffer: 16 * 1024 * 1024,
  });
}

function normalizeTranscriptText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

async function extractSubtitleFiles(videoId: string, tempDir: string) {
  const url = getYoutubeUrl(videoId);
  await runCommand(
    "yt-dlp",
    [
      "--no-warnings",
      "--no-playlist",
      "--skip-download",
      "--write-subs",
      "--write-auto-subs",
      "--sub-langs",
      "en.*,en",
      "--sub-format",
      "json3",
      "-P",
      tempDir,
      "-o",
      "%(id)s.%(ext)s",
      url,
    ],
    60_000
  );

  const files = await readdir(tempDir);
  return files
    .filter((file) => file.endsWith(".json3"))
    .map((file) => path.join(tempDir, file));
}

function parseJson3Transcript(raw: string): TranscriptResult | null {
  try {
    const parsed = JSON.parse(raw) as {
      events?: Array<{
        tStartMs?: number;
        segs?: Array<{ utf8?: string }>;
      }>;
    };

    const segments = (parsed.events ?? [])
      .map((event) => {
        const text = normalizeTranscriptText(
          (event.segs ?? []).map((seg) => seg.utf8 ?? "").join("")
        );
        return {
          start: Math.round((event.tStartMs ?? 0) / 1000),
          text,
        };
      })
      .filter((segment) => Boolean(segment.text));

    if (segments.length === 0) return null;

    return {
      segments,
      text: segments.map((segment) => segment.text).join(" "),
    };
  } catch {
    return null;
  }
}

async function fetchYtDlpTranscript(videoId: string): Promise<TranscriptResult | null> {
  try {
    return await withTempDir("yt-subs-", async (tempDir) => {
      const subtitleFiles = await extractSubtitleFiles(videoId, tempDir);
      for (const subtitleFile of subtitleFiles) {
        const raw = await readFile(subtitleFile, "utf8");
        const parsed = parseJson3Transcript(raw);
        if (parsed) {
          return parsed;
        }
      }

      return null;
    });
  } catch (error) {
    console.warn("[youtube-transcript] yt-dlp subtitle extraction failed:", error instanceof Error ? error.message : error);
    return null;
  }
}

async function downloadAudioAsWav(videoId: string): Promise<{ wavPath: string | null; error?: string }> {
  try {
    return await withTempDir("yt-audio-", async (tempDir) => {
      const url = getYoutubeUrl(videoId);
      await runCommand(
        "yt-dlp",
        [
          "--no-warnings",
          "--no-playlist",
          "-f",
          "bestaudio[ext=m4a]/bestaudio",
          "-P",
          tempDir,
          "-o",
          "audio.%(ext)s",
          url,
        ],
        180_000
      );

      const files = await readdir(tempDir);
      const sourceAudio = files
        .filter((file) => file.startsWith("audio."))
        .map((file) => path.join(tempDir, file))[0];

      if (!sourceAudio) return { wavPath: null, error: "yt-dlp did not produce an audio file" };

      const wavPath = path.join(tempDir, "audio.wav");
      await runCommand(
        "ffmpeg",
        [
          "-y",
          "-i",
          sourceAudio,
          "-ac",
          "1",
          "-ar",
          "16000",
          "-vn",
          wavPath,
        ],
        180_000
      );

      const wavBuffer = await readFile(wavPath);
      const finalPath = path.join(os.tmpdir(), `chapterhouse-${videoId}-${Date.now()}.wav`);
      await writeFile(finalPath, wavBuffer);
      return { wavPath: finalPath };
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn("[youtube-transcript] audio download/conversion failed:", message);
    return { wavPath: null, error: message };
  }
}

async function cleanupFile(filePath: string | null) {
  if (!filePath) return;
  await rm(filePath, { force: true }).catch(() => undefined);
}

async function transcribeWithAzureSpeech(audioPath: string): Promise<TranscriptResult | null> {
  const key = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION;
  if (!key || !region) return null;

  const audioBuffer = await readFile(audioPath);
  const speechConfig = sdk.SpeechConfig.fromSubscription(key, region);
  speechConfig.speechRecognitionLanguage = "en-US";
  speechConfig.outputFormat = sdk.OutputFormat.Detailed;

  const pushStream = sdk.AudioInputStream.createPushStream();
  const audioArrayBuffer = audioBuffer.buffer.slice(
    audioBuffer.byteOffset,
    audioBuffer.byteOffset + audioBuffer.byteLength
  );
  pushStream.write(audioArrayBuffer);
  pushStream.close();

  const audioConfig = sdk.AudioConfig.fromStreamInput(pushStream);
  const recognizer = new sdk.SpeechRecognizer(speechConfig, audioConfig);

  return new Promise((resolve) => {
    const segments: { start: number; text: string }[] = [];
    let settled = false;

    const finish = (result: TranscriptResult | null) => {
      if (settled) return;
      settled = true;
      recognizer.close();
      resolve(result);
    };

    recognizer.recognized = (_sender, event) => {
      if (event.result.reason !== sdk.ResultReason.RecognizedSpeech) return;
      const text = normalizeTranscriptText(event.result.text ?? "");
      if (!text) return;
      segments.push({
        start: Math.round(event.result.offset / 10_000_000),
        text,
      });
    };

    recognizer.canceled = (_sender, event) => {
      console.warn("[youtube-transcript] Azure Speech canceled:", event.errorDetails || event.reason);
      finish(null);
    };

    recognizer.sessionStopped = () => {
      if (segments.length === 0) {
        finish(null);
        return;
      }

      finish({
        segments,
        text: segments.map((segment) => segment.text).join(" "),
      });
    };

    recognizer.startContinuousRecognitionAsync(
      () => undefined,
      (error) => {
        console.warn("[youtube-transcript] Azure Speech start failed:", error);
        finish(null);
      }
    );
  });
}

async function transcribeWithOpenAI(audioPath: string): Promise<TranscriptResult | null> {
  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) return null;

  try {
    const audioBuffer = await readFile(audioPath);
    if (audioBuffer.byteLength > 24 * 1024 * 1024) {
      console.warn("[youtube-transcript] OpenAI transcription skipped: audio exceeds 24 MB");
      return null;
    }

    const formData = new FormData();
    formData.append("file", new Blob([audioBuffer], { type: "audio/wav" }), "audio.wav");
    formData.append("model", "whisper-1");
    formData.append("response_format", "verbose_json");
    formData.append("timestamp_granularities[]", "segment");

    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${openaiKey}` },
      body: formData,
      signal: AbortSignal.timeout(180_000),
    });

    if (!res.ok) {
      console.warn("[youtube-transcript] OpenAI transcription failed:", res.status, await res.text().catch(() => ""));
      return null;
    }

    const parsed = (await res.json()) as {
      text?: string;
      segments?: Array<{ start: number; text: string }>;
    };

    const segments = (parsed.segments ?? [])
      .map((segment) => ({
        start: Math.round(segment.start),
        text: normalizeTranscriptText(segment.text),
      }))
      .filter((segment) => Boolean(segment.text));

    if (segments.length === 0 && !parsed.text) return null;

    return {
      segments,
      text: parsed.text ?? segments.map((segment) => segment.text).join(" "),
    };
  } catch (error) {
    console.warn("[youtube-transcript] OpenAI transcription error:", error instanceof Error ? error.message : error);
    return null;
  }
}

/** Tier 6: Gemini 2.5 Flash — direct video analysis as a last multimodal fallback */
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
        signal: AbortSignal.timeout(180_000),
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
  } catch (error) {
    console.warn("[youtube-transcript] Gemini transcript failed:", error instanceof Error ? error.message : error);
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

/** Main runner — receives job from QStash→Railway, runs tiers in order:
 * 1. yt-dlp subtitles (fast, may be blocked from cloud IPs)
 * 2. Gemini verbatim transcript (Google→Google, most reliable from servers)
 * 3. Audio download + Azure Speech / OpenAI Whisper (often blocked by YouTube bot-check)
 * 4. Gemini educational analysis (structured analysis, last resort)
 */
export async function runYoutubeTranscript(jobId: string, payload: YoutubeTranscriptPayload) {
  const { videoId, metadata } = payload;

  // Guard: if the Vercel route couldn't verify this video via YouTube Data API,
  // the video likely doesn't exist or is private. Proceeding would cause Gemini
  // to hallucinate a fake transcript — dangerous for educational content.
  if (!metadata) {
    await updateProgress(
      jobId, 100,
      "Video could not be verified — may not exist or may be private",
      "completed",
      buildOutput(
        videoId, { segments: [], text: "" }, "none", null,
        "Video metadata could not be retrieved from YouTube. The video may not exist, be private, or the URL may be incorrect.",
        [{ tier: "validation", result: "failed", detail: "No metadata — video unverifiable" }]
      )
    );
    return;
  }

  let wavPath: string | null = null;
  const attempts: AttemptRecord[] = [];

  try {
    // Tier 1: yt-dlp subtitle extraction
    await updateProgress(jobId, 10, "Extracting subtitles from YouTube...", "running");
    const subtitleResult = await fetchYtDlpTranscript(videoId);
    if (subtitleResult) {
      attempts.push({ tier: "yt-dlp-subtitles", result: "success" });
      await updateProgress(
        jobId, 100, "Transcript extracted from YouTube subtitles", "completed",
        buildOutput(videoId, subtitleResult, "captions", metadata, undefined, attempts)
      );
      return;
    }
    attempts.push({ tier: "yt-dlp-subtitles", result: "failed" });

    // Tier 2: Gemini verbatim transcript (Google→Google, no bot check)
    await updateProgress(jobId, 25, "Gemini is watching the video and transcribing...", "running");
    const geminiTranscript = await fetchGeminiTranscript(videoId);
    if (geminiTranscript) {
      attempts.push({ tier: "gemini-transcript", result: "success" });
      await updateProgress(
        jobId, 100, "Transcript produced by Gemini from actual video", "completed",
        buildOutput(videoId, geminiTranscript, "gemini", metadata, undefined, attempts)
      );
      return;
    }
    attempts.push({ tier: "gemini-transcript", result: "failed" });

    // Tier 3: Download audio + transcribe with Azure Speech or OpenAI Whisper
    await updateProgress(jobId, 45, "Downloading video audio for transcription...", "running");
    const audioDownload = await downloadAudioAsWav(videoId);
    wavPath = audioDownload.wavPath;

    if (wavPath) {
      attempts.push({ tier: "audio-download", result: "success" });

      await updateProgress(jobId, 60, "Azure Speech transcribing audio...", "running");
      const azureResult = await transcribeWithAzureSpeech(wavPath);
      if (azureResult) {
        attempts.push({ tier: "azure-speech", result: "success" });
        await updateProgress(
          jobId, 100, "Transcript extracted from audio via Azure Speech", "completed",
          buildOutput(videoId, azureResult, "azure-speech", metadata, undefined, attempts)
        );
        return;
      }
      attempts.push({ tier: "azure-speech", result: "failed" });

      await updateProgress(jobId, 75, "OpenAI Whisper transcribing audio...", "running");
      const openAiResult = await transcribeWithOpenAI(wavPath);
      if (openAiResult) {
        attempts.push({ tier: "openai-audio", result: "success" });
        await updateProgress(
          jobId, 100, "Transcript extracted from audio via OpenAI Whisper", "completed",
          buildOutput(videoId, openAiResult, "openai-audio", metadata, undefined, attempts)
        );
        return;
      }
      attempts.push({ tier: "openai-audio", result: "failed" });
    } else {
      attempts.push({ tier: "audio-download", result: "failed", detail: audioDownload.error });
    }

    // Tier 4: Gemini educational analysis (structured, not verbatim)
    await updateProgress(jobId, 90, "Gemini analyzing video content...", "running");
    const analysisResult = await fetchGeminiVideoAnalysis(videoId, metadata);
    if (analysisResult) {
      attempts.push({ tier: "gemini-analysis", result: "success" });
      await updateProgress(
        jobId, 100, "Educational analysis produced from video", "completed",
        buildOutput(videoId, analysisResult, "gemini-analysis", metadata, undefined, attempts)
      );
      return;
    }
    attempts.push({ tier: "gemini-analysis", result: "failed" });

    // All tiers exhausted
    await updateProgress(
      jobId, 100, "No transcript available for this video", "completed",
      buildOutput(
        videoId, { segments: [], text: "" }, "none", metadata,
        "All transcript methods failed. No subtitles, Gemini transcript, audio transcription, or video analysis succeeded.",
        attempts
      )
    );
  } finally {
    await cleanupFile(wavPath);
  }
}
