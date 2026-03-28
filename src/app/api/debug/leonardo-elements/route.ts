// GET /api/debug/leonardo-elements
// Lists all user-trained models (Elements/LoRAs) in the Leonardo account.
// The /v1/elements endpoint only returns platform elements — user-trained LoRAs
// live under /v1/models filtered by userId. This route:
//   1. Calls /v1/me to get the authenticated user's ID
//   2. Calls /v1/models?userId={id} to list all user models including trained Elements
// One-time diagnostic — grab the akUUID from the result to set characters.leonardo_element_id.

export async function GET() {
  const key = process.env.LEONARDO_API_KEY ?? process.env.LEONARDO_AI_API_KEY;
  if (!key) return Response.json({ error: "LEONARDO_API_KEY not set" }, { status: 503 });

  const headers = { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };

  // Step 1: get current user ID
  const meRes = await fetch("https://cloud.leonardo.ai/api/rest/v1/me", { headers });
  const meData = await meRes.json();
  const userId: string | undefined = meData?.user_details?.[0]?.user?.id;

  if (!userId) {
    return Response.json({ error: "Could not retrieve user ID", meStatus: meRes.status, meData });
  }

  // Step 2: list all models for this user (includes user-trained Elements/LoRAs)
  const modelsRes = await fetch(
    `https://cloud.leonardo.ai/api/rest/v1/models?userId=${userId}`,
    { headers }
  );
  const modelsData = await modelsRes.json();

  // Also try the user-scoped elements endpoint
  const userElementsRes = await fetch(
    `https://cloud.leonardo.ai/api/rest/v1/elements?userId=${userId}`,
    { headers }
  );
  const userElementsData = await userElementsRes.json();

  return Response.json({
    userId,
    modelsStatus: modelsRes.status,
    models: modelsData,
    userElementsStatus: userElementsRes.status,
    userElements: userElementsData,
  });
}
