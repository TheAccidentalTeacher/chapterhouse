/**
 * Cloudinary upload helpers for the Railway worker.
 *
 * Supports:
 *  - uploadImageFromUrl  — re-upload an existing image URL into a new public_id
 *  - uploadAudioFile     — upload an MP3 from disk (Cloudinary "video" resource type)
 *  - uploadVideoFile     — upload an MP4 from disk (Cloudinary "video" resource type)
 *  - cloudinaryCloudName — parse cloud name from env for building delivery URLs
 */

import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";

interface CloudinaryParsed {
  apiKey: string;
  apiSecret: string;
  cloudName: string;
}

function parseCloudinaryUrl(): CloudinaryParsed {
  const url = process.env.CLOUDINARY_URL;
  if (!url) throw new Error("CLOUDINARY_URL not configured");
  const match = url.match(/cloudinary:\/\/(\d+):([^@]+)@(.+)/);
  if (!match) throw new Error("Invalid CLOUDINARY_URL format");
  const [, apiKey, apiSecret, cloudName] = match;
  return { apiKey, apiSecret: apiSecret!, cloudName: cloudName! };
}

export function cloudinaryCloudName(): string {
  return parseCloudinaryUrl().cloudName;
}

/** Sign a set of params (sorted, joined) for Cloudinary upload. */
function signParams(params: Record<string, string>, apiSecret: string): string {
  const sorted = Object.keys(params)
    .sort()
    .map((k) => `${k}=${params[k]}`)
    .join("&");
  return createHash("sha1").update(sorted + apiSecret).digest("hex");
}

/**
 * Upload an image via remote URL into Cloudinary.
 * Returns the delivery URL (q_auto/f_webp).
 */
export async function uploadImageFromUrl(
  imageUrl: string,
  publicId: string
): Promise<string> {
  const { apiKey, apiSecret, cloudName } = parseCloudinaryUrl();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = signParams({ public_id: publicId, timestamp }, apiSecret);

  const form = new FormData();
  form.append("file", imageUrl);
  form.append("api_key", apiKey);
  form.append("timestamp", timestamp);
  form.append("signature", signature);
  form.append("public_id", publicId);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
    { method: "POST", body: form }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Cloudinary image upload error (${res.status}): ${err}`);
  }
  const result = (await res.json()) as { public_id?: string };
  const final = result.public_id ?? publicId;
  return `https://res.cloudinary.com/${cloudName}/image/upload/q_auto/f_webp/${final}`;
}

/**
 * Upload an MP3 file from disk to Cloudinary (video resource type).
 * Returns the delivery URL.
 */
export async function uploadAudioFile(
  filePath: string,
  publicId: string
): Promise<string> {
  const { apiKey, apiSecret, cloudName } = parseCloudinaryUrl();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = signParams({ public_id: publicId, timestamp }, apiSecret);

  const audioBuffer = await readFile(filePath);
  const blob = new Blob([audioBuffer], { type: "audio/mpeg" });

  const form = new FormData();
  form.append("file", blob, "audio.mp3");
  form.append("api_key", apiKey);
  form.append("timestamp", timestamp);
  form.append("signature", signature);
  form.append("public_id", publicId);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
    { method: "POST", body: form }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Cloudinary audio upload error (${res.status}): ${err}`);
  }
  const result = (await res.json()) as { public_id?: string };
  const final = result.public_id ?? publicId;
  return `https://res.cloudinary.com/${cloudName}/video/upload/${final}.mp3`;
}

/**
 * Upload an MP4 file from disk to Cloudinary (video resource type).
 * Returns the delivery URL.
 */
export async function uploadVideoFile(
  filePath: string,
  publicId: string
): Promise<string> {
  const { apiKey, apiSecret, cloudName } = parseCloudinaryUrl();
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signature = signParams({ public_id: publicId, timestamp }, apiSecret);

  const videoBuffer = await readFile(filePath);
  const blob = new Blob([videoBuffer], { type: "video/mp4" });

  const form = new FormData();
  form.append("file", blob, "output.mp4");
  form.append("api_key", apiKey);
  form.append("timestamp", timestamp);
  form.append("signature", signature);
  form.append("public_id", publicId);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
    { method: "POST", body: form }
  );
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Cloudinary video upload error (${res.status}): ${err}`);
  }
  const result = (await res.json()) as { public_id?: string };
  const final = result.public_id ?? publicId;
  return `https://res.cloudinary.com/${cloudName}/video/upload/${final}`;
}
