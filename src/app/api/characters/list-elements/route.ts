import { NextResponse } from "next/server";

// One-time utility: fetch YOUR custom trained Leonardo Elements (user LoRAs).
// /elements = platform library (not yours). /user-loras = your trained models.
// Visit: /api/characters/list-elements
export async function GET() {
  const key = process.env.LEONARDO_API_KEY ?? process.env.LEONARDO_AI_API_KEY;
  if (!key) return NextResponse.json({ error: "LEONARDO_API_KEY not configured" }, { status: 500 });

  const res = await fetch("https://cloud.leonardo.ai/api/rest/v1/user-loras", {
    headers: { Authorization: `Bearer ${key}` },
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: err }, { status: res.status });
  }

  const data = await res.json();
  // user-loras returns an array directly under data.user_loras or similar
  const raw = data.user_loras ?? data.loras ?? data ?? [];
  const elements = (Array.isArray(raw) ? raw : []).map((e: Record<string, unknown>) => ({
    id: e.id ?? e.akUUID,
    akUUID: e.akUUID ?? e.id,
    name: e.name,
    description: e.description,
    instancePrompt: e.instancePrompt ?? e.triggerWord,
    baseModel: e.baseModel,
    status: e.status,
    trainingStrength: e.trainingStrength,
  }));

  return NextResponse.json({
    elements,
    raw_keys: Object.keys(data), // shows shape of API response for debugging
    sql_template: `UPDATE characters SET lora_model_id = '{PASTE_ID_HERE}', trigger_word = '{PASTE_TRIGGER_WORD}', preferred_provider = 'leonardo' WHERE slug = 'gimli';`,
  });
}
