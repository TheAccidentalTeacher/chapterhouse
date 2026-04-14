/**
 * POST /api/audio/generate
 *
 * Text-to-speech via ElevenLabs. Returns audio as MP3 binary or Cloudinary URL.
 * Hard limit: 5000 characters (locked decision).
 *
 * Phase 24A: ElevenLabs TTS Wiring
 */

import { z } from "zod";
import { handleRouteError } from "@/lib/route-helpers";
import { getAuthenticatedUserId } from "@/lib/auth-context";
import { textToSpeech } from "@/lib/tts";

const audioSchema = z.object({
  text: z.string().min(1).max(5000),
  voice_id: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const userId = await getAuthenticatedUserId().catch(() => null);
    if (!userId) return new Response("Unauthorized", { status: 401 });

    const body = await request.json();
    const parsed = audioSchema.parse(body);

    const audioBuffer = await textToSpeech(parsed.text, parsed.voice_id);

    // Return audio directly as MP3
    const uint8 = new Uint8Array(audioBuffer);
    return new Response(uint8 as unknown as BodyInit, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(audioBuffer.length),
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
