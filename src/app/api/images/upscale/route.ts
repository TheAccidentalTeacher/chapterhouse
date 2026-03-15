export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { imageUrl, scale, faceRestore } = body as {
      imageUrl?: string;
      scale?: number;
      faceRestore?: boolean;
    };

    if (!imageUrl) {
      return Response.json({ error: "imageUrl is required" }, { status: 400 });
    }

    const token = process.env.REPLICATE_TOKEN;
    if (!token) {
      return Response.json(
        { error: "REPLICATE_TOKEN not configured" },
        { status: 500 },
      );
    }

    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "nightmareai/real-esrgan",
        input: {
          image: imageUrl,
          scale: scale || 4,
          face_enhance: faceRestore || false,
        },
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Replicate upscale error: ${err}`);
    }

    const prediction = await response.json();
    const getUrl = prediction.urls?.get;
    if (!getUrl) throw new Error("No polling URL from Replicate");

    // Poll for result
    for (let i = 0; i < 90; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const poll = await fetch(getUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await poll.json();

      if (result.status === "succeeded") {
        const outputUrl = Array.isArray(result.output)
          ? result.output[0]
          : result.output;
        return Response.json({
          url: outputUrl,
          scale: scale || 4,
          faceRestore: faceRestore || false,
        });
      }
      if (result.status === "failed") {
        throw new Error(result.error || "Upscale failed");
      }
    }

    throw new Error("Upscale timed out");
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upscale failed";
    console.error("[images/upscale]", message);
    return Response.json({ error: message }, { status: 500 });
  }
}
