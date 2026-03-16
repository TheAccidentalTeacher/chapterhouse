import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

// Buffer GraphQL query to fetch post analytics by post ID
const GET_POST_QUERY = `
  query GetPost($postId: PostId!) {
    post(input: { id: $postId }) {
      id
      text
      statistics {
        reach
        clicks
        likes
        comments
        shares
      }
    }
  }
`;

// Fallback: query posts from a channel and match by ID
const GET_CHANNEL_POSTS_QUERY = `
  query GetChannelPosts($channelId: ChannelId!) {
    posts(input: { channelId: $channelId, status: sent, limit: 100 }) {
      id
      text
      statistics {
        reach
        clicks
        likes
        comments
        shares
      }
    }
  }
`;

interface BufferStatistics {
  reach?: number;
  clicks?: number;
  likes?: number;
  comments?: number;
  shares?: number;
}

interface BufferPostResponse {
  data?: {
    post?: {
      id: string;
      statistics?: BufferStatistics;
    };
  };
  errors?: Array<{ message: string }>;
}

interface BufferChannelPostsResponse {
  data?: {
    posts?: Array<{
      id: string;
      statistics?: BufferStatistics;
    }>;
  };
  errors?: Array<{ message: string }>;
}

async function fetchPostStats(
  bufferToken: string,
  postId: string
): Promise<BufferStatistics | null> {
  // Try direct post lookup first
  try {
    const res = await fetch("https://api.buffer.com", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${bufferToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: GET_POST_QUERY,
        variables: { postId },
      }),
    });

    if (res.ok) {
      const data = (await res.json()) as BufferPostResponse;
      if (data.data?.post?.statistics) return data.data.post.statistics;
    }
  } catch {
    // Fall through — direct lookup not available on all Buffer tiers
  }

  return null;
}

export async function POST() {
  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) return Response.json({ error: "DB unavailable" }, { status: 503 });

  const bufferToken = process.env.BUFFER_ACCESS_TOKEN;
  if (!bufferToken) return Response.json({ error: "Buffer not configured" }, { status: 503 });

  // Fetch published posts that have a Buffer ID and either no stats or stale stats
  const { data: published, error } = await supabase
    .from("social_posts")
    .select("id, buffer_update_id, buffer_profile_id")
    .eq("status", "published")
    .not("buffer_update_id", "is", null);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  if (!published || published.length === 0) return Response.json({ updated: 0 });

  let updated = 0;
  const errors: string[] = [];

  for (const post of published) {
    try {
      const stats = await fetchPostStats(bufferToken, post.buffer_update_id);
      if (!stats) continue;

      await supabase
        .from("social_posts")
        .update({ buffer_stats: stats, published_at: new Date().toISOString() })
        .eq("id", post.id);
      updated++;
    } catch (err) {
      const msg = `Post ${post.buffer_update_id}: ${err instanceof Error ? err.message : String(err)}`;
      console.error("[social/analytics]", msg);
      errors.push(msg);
    }
  }

  return Response.json({ updated, total: published.length, errors: errors.length ? errors : undefined });
}
