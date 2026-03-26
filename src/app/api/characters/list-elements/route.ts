import { NextResponse } from "next/server";

// One-time utility: find YOUR trained Gimli Element UUID from Leonardo.
// Visit: /api/characters/list-elements
export async function GET() {
  const key = process.env.LEONARDO_API_KEY ?? process.env.LEONARDO_AI_API_KEY;
  if (!key) return NextResponse.json({ error: "LEONARDO_API_KEY not configured" }, { status: 500 });

  const headers = { Authorization: `Bearer ${key}`, "Content-Type": "application/json" };

  // Step 1: get the user's ID
  const meRes = await fetch("https://cloud.leonardo.ai/api/rest/v1/me", { headers });
  const meData = await meRes.json();
  const userId = meData?.user_details?.[0]?.user?.id ?? meData?.id ?? null;

  // Step 2: try every plausible endpoint for user-trained Elements/LoRAs
  const endpoints: string[] = [
    `https://cloud.leonardo.ai/api/rest/v1/elements?userId=${userId}`,
    `https://cloud.leonardo.ai/api/rest/v1/user/${userId}/elements`,
    `https://cloud.leonardo.ai/api/rest/v1/models?userId=${userId}`,
    `https://cloud.leonardo.ai/api/rest/v1/dataset`,
    `https://cloud.leonardo.ai/api/rest/v1/training`,
  ];

  // Step 3: also try GraphQL — most reliable way to get user elements
  const gqlRes = await fetch("https://cloud.leonardo.ai/api/graphql", {
    method: "POST",
    headers,
    body: JSON.stringify({
      query: `{
        get_user_loras(where: {userId: {_eq: "${userId}"}}, limit: 10) {
          id akUUID name instancePrompt baseModel status
        }
      }`,
    }),
  });
  const gqlData = await gqlRes.json();

  const results: Record<string, unknown> = { me: { status: meRes.status, userId, raw: meData } };
  for (const url of endpoints) {
    if (!userId && url.includes("undefined")) continue;
    try {
      const res = await fetch(url, { headers });
      const body = await res.json();
      results[url] = { status: res.status, body };
    } catch (e) {
      results[url] = { error: String(e) };
    }
  }
  results["graphql_user_loras"] = { status: gqlRes.status, body: gqlData };

  return NextResponse.json({ userId, results });
}
