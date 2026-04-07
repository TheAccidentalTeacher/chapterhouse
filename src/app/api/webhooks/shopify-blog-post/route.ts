import crypto from "crypto";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";
import { Client } from "@upstash/qstash";

export async function POST(req: Request) {
  // Verify Shopify webhook signature — same pattern as shopify-product webhook
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

  const blogPost = JSON.parse(rawBody) as {
    id?: number;
    title?: string;
    body_html?: string;
    published_at?: string | null;
  };

  // Ignore unpublished posts (drafts and unpublish events)
  if (!blogPost.published_at) {
    return new Response("Skipped: not published", { status: 200 });
  }

  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) return new Response("DB unavailable", { status: 503 });

  const title = blogPost.title ?? "New blog post";
  const bodyHtml = blogPost.body_html ?? "";
  const blogPostId = blogPost.id ?? 0;

  const qstashToken = process.env.QSTASH_TOKEN;
  const workerUrl = process.env.RAILWAY_WORKER_URL;
  const qstash = qstashToken ? new Client({ token: qstashToken }) : null;

  // Job 1: social_batch — generate social posts promoting the new blog article
  const { data: socialJob, error: socialErr } = await supabase
    .from("jobs")
    .insert({
      type: "social_batch",
      label: `Blog post launch: "${title}"`,
      input_payload: {
        trigger: "shopify_blog_post",
        brands: ["ncho"],
        platforms: ["facebook", "instagram"],
        count_per_combo: 2,
        topic_seed: `New NCHO blog post: ${title}`,
      },
      status: "queued",
    })
    .select()
    .single();

  if (!socialErr && socialJob && qstash && workerUrl) {
    await qstash.publishJSON({
      url: `${workerUrl}/process-job`,
      body: { jobId: socialJob.id, type: "social_batch", payload: socialJob.input_payload },
      retries: 3,
    });
  }

  // Job 2: newsletter_draft — draft a Brevo email campaign from the blog post
  const { data: nlJob, error: nlErr } = await supabase
    .from("jobs")
    .insert({
      type: "newsletter_draft",
      label: `Newsletter draft: "${title}"`,
      input_payload: {
        blog_post_id: blogPostId,
        title,
        body_html: bodyHtml,
      },
      status: "queued",
    })
    .select()
    .single();

  if (!nlErr && nlJob && qstash && workerUrl) {
    await qstash.publishJSON({
      url: `${workerUrl}/process-job`,
      body: { jobId: nlJob.id, type: "newsletter_draft", payload: nlJob.input_payload },
      retries: 3,
    });
  }

  const created = [socialJob?.id, nlJob?.id].filter(Boolean);
  return new Response(JSON.stringify({ ok: true, jobs: created }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
