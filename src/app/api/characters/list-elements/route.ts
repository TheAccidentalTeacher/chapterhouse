import { NextResponse } from "next/server";

// One-time utility: fetch YOUR custom trained Leonardo Elements (user LoRAs).
// Tries /custom-models first (documented endpoint), then /user-loras as fallback.
// Visit: /api/characters/list-elements
export async function GET() {
  const key = process.env.LEONARDO_API_KEY ?? process.env.LEONARDO_AI_API_KEY;
  if (!key) return NextResponse.json({ error: "LEONARDO_API_KEY not configured" }, { status: 500 });

  const headers = { Authorization: `Bearer ${key}` };

  // Try the two most likely endpoints for user-trained Elements
  const endpoints = [
    "https://cloud.leonardo.ai/api/rest/v1/custom-models",
    "https://cloud.leonardo.ai/api/rest/v1/user-loras",
    "https://cloud.leonardo.ai/api/rest/v1/elements?userId=me",
  ];

  const results: Record<string, unknown> = {};

  for (const url of endpoints) {
    try {
      const res = await fetch(url, { headers });
      const text = await res.text();
      let parsed: unknown;
      try { parsed = JSON.parse(text); } catch { parsed = text; }
      results[url] = { status: res.status, body: parsed };
    } catch (e) {
      results[url] = { error: String(e) };
    }
  }

  return NextResponse.json({
    note: "Raw responses from all candidate endpoints — find your Gimli UUID here. Alternatively: in Leonardo UI click the Gimli card and copy the UUID from the URL bar.",
    results,
    sql_template: `UPDATE characters SET lora_model_id = 'PASTE-UUID-HERE', trigger_word = 'foil', preferred_provider = 'leonardo' WHERE slug = 'gimli';`,
  });
}
