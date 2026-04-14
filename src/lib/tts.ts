/**
 * src/lib/tts.ts — ElevenLabs TTS wrapper
 *
 * Phase 24A: Lightweight TTS path separate from Voice Studio.
 * 5000 char hard limit (locked decision). Returns raw audio buffer.
 */

const ELEVENLABS_BASE = "https://api.elevenlabs.io/v1";
const MAX_CHARS = 5000;

export async function textToSpeech(
  text: string,
  voiceId?: string
): Promise<Buffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error("ELEVENLABS_API_KEY not configured");

  if (text.length > MAX_CHARS) {
    throw new Error(
      `Text exceeds ${MAX_CHARS} character limit (got ${text.length}). Split into smaller chunks.`
    );
  }

  const voice =
    voiceId ||
    process.env.ELEVENLABS_DEFAULT_VOICE_ID ||
    "JBFqnCBsd6RMkjVDRZzb"; // George default

  const response = await fetch(
    `${ELEVENLABS_BASE}/text-to-speech/${voice}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: { stability: 0.5, similarity_boost: 0.75 },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`ElevenLabs API error: ${response.status} ${error}`);
  }

  return Buffer.from(await response.arrayBuffer());
}
