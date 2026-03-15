import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { imageUrl, publicId } = body as {
      imageUrl?: string;
      publicId?: string;
    };

    if (!imageUrl) {
      return Response.json({ error: "imageUrl is required" }, { status: 400 });
    }

    const cloudinaryUrl = process.env.CLOUDINARY_URL;
    if (!cloudinaryUrl) {
      return Response.json(
        { error: "CLOUDINARY_URL not configured" },
        { status: 500 },
      );
    }

    // Parse cloudinary URL: cloudinary://API_KEY:API_SECRET@CLOUD_NAME
    const match = cloudinaryUrl.match(
      /cloudinary:\/\/(\d+):([^@]+)@(.+)/,
    );
    if (!match) {
      return Response.json(
        { error: "Invalid CLOUDINARY_URL format" },
        { status: 500 },
      );
    }

    const [, apiKey, apiSecret, cloudName] = match;

    // Generate signature for upload
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = "chapterhouse";
    const paramsToSign = publicId
      ? `folder=${folder}&public_id=${publicId}&timestamp=${timestamp}`
      : `folder=${folder}&timestamp=${timestamp}`;

    // Create SHA1 signature using Web Crypto API
    const encoder = new TextEncoder();
    const data = encoder.encode(paramsToSign + apiSecret);
    const hashBuffer = await crypto.subtle.digest("SHA-1", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const signature = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Upload to Cloudinary
    const formData = new FormData();
    formData.append("file", imageUrl);
    formData.append("api_key", apiKey);
    formData.append("timestamp", timestamp.toString());
    formData.append("signature", signature);
    formData.append("folder", folder);
    if (publicId) formData.append("public_id", publicId);

    const uploadRes = await fetch(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      { method: "POST", body: formData },
    );

    if (!uploadRes.ok) {
      const err = await uploadRes.text();
      throw new Error(`Cloudinary upload error: ${err}`);
    }

    const result = await uploadRes.json();

    // Update database record if we have one
    const supabase = getSupabaseServiceRoleClient();
    if (supabase && imageUrl.startsWith("http")) {
      await supabase
        .from("generated_images")
        .update({ cloudinary_url: result.secure_url })
        .eq("image_url", imageUrl);
    }

    return Response.json({
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Cloudinary upload failed";
    console.error("[images/save]", message);
    return Response.json({ error: message }, { status: 500 });
  }
}
