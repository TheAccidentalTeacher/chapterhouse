import crypto from "crypto";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";
import { Client } from "@upstash/qstash";

export async function POST(req: Request) {
  // Verify Shopify webhook signature
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret) return new Response("Webhook secret not configured", { status: 503 });

  const rawBody = await req.text();
  const hmac = req.headers.get("x-shopify-hmac-sha256");
  const expectedHmac = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("base64");

  if (hmac !== expectedHmac) {
    return new Response("Unauthorized", { status: 401 });
  }

  const product = JSON.parse(rawBody) as { title?: string; product_type?: string };
  const productTitle = product.title ?? "New product";
  const productType = product.product_type ?? "";

  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) return new Response("DB unavailable", { status: 503 });

  const { data: job, error } = await supabase
    .from("jobs")
    .insert({
      type: "social_batch",
      label: `NCHO product launch: "${productTitle}"`,
      input_payload: {
        trigger: "shopify_new_product",
        brands: ["ncho"],
        platforms: ["facebook", "instagram", "pinterest"],
        count_per_combo: 3,
        topic_seed: `New NCHO product: ${productTitle}${productType ? ` (${productType})` : ""}`,
      },
      status: "queued",
    })
    .select()
    .single();

  if (error || !job) return new Response("Failed to create job", { status: 500 });

  const qstashToken = process.env.QSTASH_TOKEN;
  const workerUrl = process.env.RAILWAY_WORKER_URL;
  if (qstashToken && workerUrl) {
    const qstash = new Client({ token: qstashToken });
    await qstash.publishJSON({
      url: `${workerUrl}/process-job`,
      body: { jobId: job.id, type: "social_batch", payload: job.input_payload },
      retries: 3,
    });
  }

  return new Response("OK", { status: 200 });
}
