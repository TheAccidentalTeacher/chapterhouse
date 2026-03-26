import { NextResponse } from "next/server";

// One-time utility: find YOUR trained Gimli Element UUID from Leonardo.
// Visit: /api/characters/list-elements
export async function GET() {
  try {
    const key = process.env.LEONARDO_API_KEY ?? process.env.LEONARDO_AI_API_KEY;
    if (!key) return NextResponse.json({ error: "LEONARDO_API_KEY not configured" }, { status: 500 });

    const headers: Record<string, string> = {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    };

    // Step 1: get user ID from /me
    let userId: string | null = null;
    let meData: unknown = null;
    try {
      const meRes = await fetch("https://cloud.leonardo.ai/api/rest/v1/me", { headers });
      meData = await meRes.json();
      const d = meData as Record<string, unknown>;
      userId =
        (d?.user_details as Array<{user: {id: string}}>)?.[0]?.user?.id ??
        (d?.id as string) ??
        null;
    } catch (e) {
      meData = { error: String(e) };
    }

    // Step 2: fire all candidate REST endpoints in parallel
    const endpoints: string[] = [
      `https://cloud.leonardo.ai/api/rest/v1/elements`,
      ...(userId ? [
        `https://cloud.leonardo.ai/api/rest/v1/elements?userId=${userId}`,
        `https://cloud.leonardo.ai/api/rest/v1/user/${userId}/elements`,
        `https://cloud.leonardo.ai/api/rest/v1/models?userId=${userId}`,
      ] : []),
    ];

    const restResults = await Promise.allSettled(
      endpoints.map(async (url) => {
        const res = await fetch(url, { headers });
        const body = await res.json().catch(() => "(non-JSON)");
        return { url, status: res.status, body };
      })
    );

    // Step 3: GraphQL query for user loras
    let gqlData: unknown = null;
    try {
      const gqlRes = await fetch("https://cloud.leonardo.ai/api/graphql", {
        method: "POST",
        headers,
        body: JSON.stringify({
          query: `{
            get_user_loras(limit: 20) {
              id akUUID name instancePrompt baseModel status
            }
          }`,
        }),
      });
      gqlData = await gqlRes.json();
    } catch (e) {
      gqlData = { error: String(e) };
    }

    const restFormatted: Record<string, unknown> = {};
    for (const r of restResults) {
      if (r.status === "fulfilled") {
        restFormatted[r.value.url] = { status: r.value.status, body: r.value.body };
      } else {
        restFormatted[String(r.reason)] = { error: String(r.reason) };
      }
    }

    return NextResponse.json({ userId, me: meData, rest: restFormatted, graphql: gqlData });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
