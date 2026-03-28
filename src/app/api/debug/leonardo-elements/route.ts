// GET /api/debug/leonardo-elements
// Finds all user-trained Elements (LoRAs/custom models) in the Leonardo account.
// One-time diagnostic — grab the id/akUUID from the result to set characters.leonardo_element_id.
//
// API paths tried:
//   GET /v1/me                           — get userId + full user profile
//   GET /v1/models/user/{userId}          — list custom models by user (correct path)
//   GET /v1/me with full body             — sometimes includes model refs

export async function GET() {
  const key = process.env.LEONARDO_API_KEY ?? process.env.LEONARDO_AI_API_KEY;
  if (!key) return Response.json({ error: "LEONARDO_API_KEY not set" }, { status: 503 });

  const headers = { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };
  const BASE = "https://cloud.leonardo.ai/api/rest/v1";

  // Step 1: get user ID
  const meRes = await fetch(`${BASE}/me`, { headers });
  const meData = await meRes.json();
  const userId: string | undefined = meData?.user_details?.[0]?.user?.id;

  if (!userId) {
    return Response.json({ error: "Could not retrieve user ID", meStatus: meRes.status, meData });
  }

  // Step 2: GET /v1/models/user/{userId} — the correct list endpoint for custom models
  const userModelsRes = await fetch(`${BASE}/models/user/${userId}`, { headers });
  const userModelsData = await userModelsRes.json();

  // Step 3: also dump full /v1/me response — sometimes contains custom model refs
  // (already have meData above)

  return Response.json({
    userId,
    // Your trained Elements/LoRAs should be in userModels:
    userModelsStatus: userModelsRes.status,
    userModels: userModelsData,
    // Full /v1/me in case it contains model references:
    meData,
  });
}
