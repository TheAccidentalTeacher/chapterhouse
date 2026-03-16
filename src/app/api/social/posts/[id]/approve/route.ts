import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";
import { z } from "zod";

const approveSchema = z.object({
  scheduled_for: z.string(),
  buffer_profile_id: z.string(),
});

const CREATE_POST_MUTATION = `
  mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      __typename
      ... on PostActionSuccess {
        post {
          id
          text
        }
      }
      ... on MutationError {
        message
      }
    }
  }
`;

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) return Response.json({ error: "DB unavailable" }, { status: 503 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = approveSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });

  const { scheduled_for, buffer_profile_id } = parsed.data;

  const { data: post, error: fetchErr } = await supabase
    .from("social_posts")
    .select("post_text, hashtags")
    .eq("id", id)
    .single();

  if (fetchErr || !post) return Response.json({ error: "Post not found" }, { status: 404 });

  // Build full post text with hashtags
  const hashtags: string[] = Array.isArray(post.hashtags) ? post.hashtags : [];
  const fullText = hashtags.length
    ? `${post.post_text}\n\n${hashtags.join(" ")}`
    : post.post_text;

  // Push to Buffer GraphQL API
  const bufferToken = process.env.BUFFER_ACCESS_TOKEN;
  if (!bufferToken) return Response.json({ error: "Buffer not configured" }, { status: 503 });

  const bufferRes = await fetch("https://api.buffer.com", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${bufferToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query: CREATE_POST_MUTATION,
      variables: {
        input: {
          text: fullText,
          channelId: buffer_profile_id,
          schedulingType: "automatic",
          mode: "customSchedule",
          dueAt: new Date(scheduled_for).toISOString(),
        },
      },
    }),
  });

  if (!bufferRes.ok) {
    const detail = await bufferRes.text();
    console.error("[social/approve] Buffer error:", detail);
    return Response.json({ error: "Buffer publish failed", detail }, { status: 502 });
  }

  const bufferData = await bufferRes.json() as {
    data?: {
      createPost?: {
        __typename?: string;
        message?: string;
        post?: { id?: string; text?: string };
      };
    };
    errors?: Array<{ message: string }>;
  };

  const createPost = bufferData.data?.createPost;
  if (!createPost) {
    const detail = bufferData.errors?.map((error) => error.message).join("; ") ?? "Unknown Buffer error";
    return Response.json({ error: "Buffer publish failed", detail }, { status: 502 });
  }

  if (createPost.__typename === "MutationError") {
    return Response.json({ error: "Buffer publish failed", detail: createPost.message ?? "MutationError" }, { status: 502 });
  }

  const buffer_update_id = createPost.post?.id ?? null;

  const { data, error } = await supabase
    .from("social_posts")
    .update({
      status: "scheduled",
      scheduled_for,
      buffer_profile_id,
      buffer_update_id,
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ post: data });
}
