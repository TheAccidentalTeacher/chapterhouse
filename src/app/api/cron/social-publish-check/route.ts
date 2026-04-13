import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

/**
 * Cron: Check scheduled posts for publication status.
 * Runs every 15 minutes. Transitions scheduled posts with past due dates
 * to "published" status by checking Buffer API.
 *
 * Schedule: "* /15 * * * *" (every 15 min) — configured in vercel.json
 */

const GET_POST_QUERY = `
  query GetPost($id: PostId!) {
    post(input: { id: $id }) {
      __typename
      ... on Post {
        id
        status
        sentAt
      }
      ... on PostNotFound {
        message
      }
    }
  }
`;

export async function GET(req: Request) {
  // Verify cron secret
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) return Response.json({ error: "DB unavailable" }, { status: 503 });

  const bufferToken = process.env.BUFFER_ACCESS_TOKEN;
  if (!bufferToken) {
    return Response.json({ error: "Buffer not configured" }, { status: 503 });
  }

  // Find posts that are scheduled and past their due date
  const { data: posts, error: fetchErr } = await supabase
    .from("social_posts")
    .select("id, buffer_update_id, scheduled_for")
    .eq("status", "scheduled")
    .not("buffer_update_id", "is", null)
    .lte("scheduled_for", new Date().toISOString())
    .limit(50);

  if (fetchErr) {
    console.error("[publish-check] Fetch error:", fetchErr.message);
    return Response.json({ error: fetchErr.message }, { status: 500 });
  }

  if (!posts || posts.length === 0) {
    return Response.json({ checked: 0, published: 0 });
  }

  let published = 0;
  let failed = 0;

  for (const post of posts) {
    try {
      const res = await fetch("https://api.buffer.com", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${bufferToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: GET_POST_QUERY,
          variables: { id: post.buffer_update_id },
        }),
      });

      if (!res.ok) {
        console.error(`[publish-check] Buffer API error for post ${post.id}:`, res.status);
        failed++;
        continue;
      }

      const bufferData = (await res.json()) as {
        data?: {
          post?: {
            __typename?: string;
            status?: string;
            sentAt?: string;
            message?: string;
          };
        };
      };

      const bufferPost = bufferData.data?.post;

      if (bufferPost?.__typename === "PostNotFound") {
        // Post was deleted from Buffer — mark as failed
        await supabase
          .from("social_posts")
          .update({ status: "failed" })
          .eq("id", post.id);
        failed++;
        continue;
      }

      // Buffer uses "sent" status for published posts
      if (bufferPost?.status === "sent") {
        await supabase
          .from("social_posts")
          .update({
            status: "published",
            published_at: bufferPost.sentAt ?? new Date().toISOString(),
          })
          .eq("id", post.id);
        published++;
      }
    } catch (err) {
      console.error(`[publish-check] Error checking post ${post.id}:`, err);
      failed++;
    }
  }

  return Response.json({ checked: posts.length, published, failed });
}
