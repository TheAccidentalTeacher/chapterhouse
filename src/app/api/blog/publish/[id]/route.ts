import { getSupabaseServerClient } from "@/lib/supabase-server";
import { createArticle } from "@/lib/shopify";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await getSupabaseServerClient();
  if (!supabase)
    return Response.json({ error: "Database not available" }, { status: 503 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  // Fetch the blog post
  const { data: post, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error || !post)
    return Response.json({ error: "Post not found" }, { status: 404 });

  if (post.status === "published")
    return Response.json(
      { error: "Post is already published" },
      { status: 400 },
    );

  if (!post.body || !post.title)
    return Response.json(
      { error: "Post must have a title and body before publishing. Generate a draft first." },
      { status: 400 },
    );

  // Only allow publishing from 'draft' or 'review' status
  if (!["draft", "review"].includes(post.status))
    return Response.json(
      { error: `Cannot publish a post with status "${post.status}". Must be draft or review.` },
      { status: 400 },
    );

  // Publish to Shopify
  let result;
  try {
    result = await createArticle({
      title: post.title,
      body: post.body,
      summary: post.excerpt || undefined,
      tags: post.tags || undefined,
      seoTitle: post.seo_title || undefined,
      seoDescription: post.seo_description || undefined,
      isPublished: true,
    });
  } catch (err) {
    return Response.json(
      { error: `Shopify publish failed: ${err instanceof Error ? err.message : "Unknown error"}` },
      { status: 502 },
    );
  }

  // Update blog_posts row with Shopify references
  const now = new Date().toISOString();
  const { data: updated, error: updateError } = await supabase
    .from("blog_posts")
    .update({
      status: "published",
      shopify_article_id: result.articleId,
      shopify_article_url: result.url,
      published_at: now,
      updated_at: now,
    })
    .eq("id", id)
    .select()
    .single();

  if (updateError)
    return Response.json({ error: updateError.message }, { status: 500 });

  return Response.json(updated);
}
