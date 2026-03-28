// GET /api/debug/leonardo-elements
// Lists all trained Elements (LoRAs) in the Leonardo account with their akUUID.
// One-time diagnostic — use the UUID to set characters.leonardo_element_id.

export async function GET() {
  const key = process.env.LEONARDO_API_KEY ?? process.env.LEONARDO_AI_API_KEY;
  if (!key) return Response.json({ error: "LEONARDO_API_KEY not set" }, { status: 503 });

  const res = await fetch("https://cloud.leonardo.ai/api/rest/v1/elements", {
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
  });

  const data = await res.json();
  return Response.json({ status: res.status, data });
}
