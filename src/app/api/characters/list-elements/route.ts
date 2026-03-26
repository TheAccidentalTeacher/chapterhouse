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
      // POST-only endpoints — try as GET to see what we get
      `https://cloud.leonardo.ai/api/rest/v1/loras`,
      `https://cloud.leonardo.ai/api/rest/v1/user-elements`,
      `https://cloud.leonardo.ai/api/rest/v1/me/loras`,
      `https://cloud.leonardo.ai/api/rest/v1/trainings`,
      ...(userId ? [
        `https://cloud.leonardo.ai/api/rest/v1/user/${userId}/loras`,
        `https://cloud.leonardo.ai/api/rest/v1/user/${userId}/models`,
        `https://cloud.leonardo.ai/api/rest/v1/user/${userId}/trainings`,
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
      // Try both known GraphQL endpoints  
      const gqlUrls = [
        "https://app.leonardo.ai/api/graphql",
        "https://api.leonardo.ai/graphql",
      ];
      for (const gqlUrl of gqlUrls) {
        const gqlRes = await fetch(gqlUrl, {
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
        const text = await gqlRes.text();
        try { gqlData = { url: gqlUrl, status: gqlRes.status, body: JSON.parse(text) }; }
        catch { gqlData = { url: gqlUrl, status: gqlRes.status, body: text.slice(0, 300) }; }
        if (gqlRes.status === 200) break;
      }
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
