import { getSupabaseServerClient } from "@/lib/supabase-server";
import { fetchProducts } from "@/lib/shopify";
import Anthropic from "@anthropic-ai/sdk";

export const maxDuration = 60;

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

  // Fetch the blog post plan
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
      { error: "Cannot re-draft a published post" },
      { status: 400 },
    );

  // Mark as drafting
  await supabase
    .from("blog_posts")
    .update({ status: "drafting", updated_at: new Date().toISOString() })
    .eq("id", id);

  // Build product context for sales posts
  let productContext = "";
  if (
    post.post_type === "sales" &&
    post.product_references?.length > 0
  ) {
    try {
      const products = await fetchProducts();
      const referenced = products.filter((p) =>
        post.product_references.some(
          (ref: string) =>
            p.handle === ref ||
            p.title.toLowerCase().includes(ref.toLowerCase()),
        ),
      );
      productContext = referenced
        .map(
          (p) =>
            `Product: "${p.title}" by ${p.vendor}\nHandle: ${p.handle}\nPrice: $${p.variants.edges[0]?.node.price || "N/A"}\nTags: ${p.tags.join(", ")}\nDescription: ${p.descriptionHtml?.replace(/<[^>]*>/g, "").slice(0, 200) || "N/A"}`,
        )
        .join("\n\n");
    } catch {
      productContext = "(Products unavailable)";
    }
  }

  const anthropic = new Anthropic();

  const systemPrompt = `You are Scott Somers, a middle school teacher at a Title 1 school in Glennallen, Alaska. You write blog posts for Next Chapter Homeschool Outpost (NCHO), a curated homeschool curriculum store.

YOUR VOICE:
- Warm, specific, teacher's-eye-view. You write like someone who has actually watched a child struggle with bad curriculum and knows the difference.
- You are convicted about homeschooling — not selling it. Your reader already chose to homeschool. You're helping her do it better.
- You reference real classroom experience. You teach 65% Alaska Native students. You've seen what works and what doesn't.
- You say "your child" — never "your student."
- You are practical, not preachy. No fluff. No inspirational-calendar-quote energy.
- Never use: explore, journey, leverage, synergy, student, spiritually curious

SEO REQUIREMENTS:
- Title must be under 60 characters and include the primary keyword
- Meta description must be 150-160 characters
- Use the primary keyword in the first paragraph
- Use H2 and H3 subheadings that include secondary keywords
- Internal natural language — write for humans, optimize for Google

OUTPUT FORMAT — Return valid JSON with these exact fields:
{
  "title": "SEO-optimized title (under 60 chars)",
  "body": "Full HTML blog post body (1000-1500 words). Use <h2>, <h3>, <p>, <ul>, <li>, <strong>, <em> tags. No <h1>. No inline styles.",
  "excerpt": "2-3 sentence summary for the blog listing page",
  "seo_title": "Title tag for the page (can differ slightly from post title, under 60 chars)",
  "seo_description": "Meta description, 150-160 characters, includes primary keyword",
  "tags": ["tag1", "tag2", "tag3"]
}`;

  const userPrompt = `Write a blog post for NCHO.

POST TYPE: ${post.post_type}
TOPIC: ${post.topic_seed}
${post.title ? `WORKING TITLE: ${post.title}` : ""}
TARGET SEO KEYWORDS: ${(post.seo_keywords || []).join(", ") || "Choose appropriate ones"}
${productContext ? `\nREFERENCED PRODUCTS (weave naturally into the post — soft CTA, not hard sell):\n${productContext}` : ""}

${post.post_type === "sales" ? "Include a natural mention of the product(s) with a soft CTA like 'Find it at nextchapterhomeschool.com' — never a hard sell." : ""}
${post.post_type === "authority" ? "Position Scott/NCHO as the expert. Include specific, actionable advice. Reference real classroom experience where relevant." : ""}
${post.post_type === "holiday" ? "Connect the holiday to homeschooling in a way that feels genuine, not forced. Include practical activity ideas." : ""}

Return ONLY the JSON object. No markdown fences. No other text.`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  let draft;
  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found");
    draft = JSON.parse(jsonMatch[0]);
  } catch {
    // Revert status on parse failure
    await supabase
      .from("blog_posts")
      .update({ status: "planned", updated_at: new Date().toISOString() })
      .eq("id", id);
    return Response.json(
      { error: "Failed to parse draft", raw: text },
      { status: 500 },
    );
  }

  // Update post with generated content
  const { data: updated, error: updateError } = await supabase
    .from("blog_posts")
    .update({
      title: draft.title,
      slug: slugify(draft.title),
      body: draft.body,
      excerpt: draft.excerpt,
      tags: draft.tags || [],
      seo_title: draft.seo_title,
      seo_description: draft.seo_description,
      generation_prompt: userPrompt,
      status: "draft",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (updateError)
    return Response.json({ error: updateError.message }, { status: 500 });

  return Response.json(updated);
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}
