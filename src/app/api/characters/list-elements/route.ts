import { NextResponse } from "next/server";

// One-time utility: fetch all Leonardo Elements from the API so you can
// copy an Element UUID into characters.lora_model_id via Supabase SQL.
// Visit: /api/characters/list-elements
export async function GET() {
  const key = process.env.LEONARDO_API_KEY ?? process.env.LEONARDO_AI_API_KEY;
  if (!key) return NextResponse.json({ error: "LEONARDO_API_KEY not configured" }, { status: 500 });

  const res = await fetch("https://cloud.leonardo.ai/api/rest/v1/elements", {
    headers: { Authorization: `Bearer ${key}` },
  });

  if (!res.ok) {
    const err = await res.text();
    return NextResponse.json({ error: err }, { status: res.status });
  }

  const data = await res.json();
  // Return just the fields needed to identify each Element
  const elements = (data.loras ?? []).map((e: Record<string, unknown>) => ({
    id: e.id,
    name: e.name,
    description: e.description,
    instancePrompt: e.instancePrompt,
    baseModel: e.baseModel,
    status: e.status,
  }));

  return NextResponse.json({ elements, sql_template: `UPDATE characters SET lora_model_id = '{PASTE_ID_HERE}' WHERE slug = 'gimli';` });
}
