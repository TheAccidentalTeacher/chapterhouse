/**
 * GET /api/cron/daily-brief
 *
 * Called by Vercel Cron at 3:00 UTC daily (7am AKST / 11am AKST daylight).
 * Authenticated via CRON_SECRET header to prevent unauthorized triggers.
 *
 * Also callable manually via the dashboard for on-demand generation.
 */
export async function GET(request: Request) {
  // Verify cron secret — Vercel sends this automatically when configured
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Re-use the existing generate endpoint logic by calling it internally
    const origin =
      process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

    const res = await fetch(`${origin}/api/briefs/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Forward cron secret so generate route can also be protected if needed
        ...(cronSecret ? { authorization: `Bearer ${cronSecret}` } : {}),
      },
      body: JSON.stringify({ context: "This is an automated morning brief. Be comprehensive." }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      console.error("[cron/daily-brief] generate failed:", err);
      return Response.json(
        { error: "Brief generation failed", detail: err },
        { status: res.status }
      );
    }

    const result = await res.json();
    console.log("[cron/daily-brief] Brief generated successfully:", result.brief?.id);

    return Response.json({
      ok: true,
      briefId: result.brief?.id ?? null,
      meta: result.meta ?? null,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[cron/daily-brief] Unexpected error:", error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}
