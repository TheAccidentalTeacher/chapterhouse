import { getSupabaseServerClient, getSupabaseServiceRoleClient } from "@/lib/supabase-server";
import { fetchProducts } from "@/lib/shopify";
import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

const inputSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, "Format: YYYY-MM"),
});

// US holidays + homeschool-relevant dates
const HOLIDAY_CALENDAR: Record<string, Array<{ date: string; name: string }>> = {
  "01": [
    { date: "01-01", name: "New Year's Day" },
    { date: "01-20", name: "Martin Luther King Jr. Day" },
  ],
  "02": [
    { date: "02-14", name: "Valentine's Day" },
    { date: "02-17", name: "Presidents' Day" },
  ],
  "03": [
    { date: "03-02", name: "Read Across America / Dr. Seuss Day" },
    { date: "03-17", name: "St. Patrick's Day" },
    { date: "03-20", name: "First Day of Spring" },
  ],
  "04": [
    { date: "04-15", name: "Tax Day" },
    { date: "04-22", name: "Earth Day" },
  ],
  "05": [
    { date: "05-05", name: "Cinco de Mayo" },
    { date: "05-11", name: "Mother's Day" },
    { date: "05-26", name: "Memorial Day" },
  ],
  "06": [
    { date: "06-15", name: "Father's Day" },
    { date: "06-19", name: "Juneteenth" },
    { date: "06-20", name: "Summer Solstice" },
  ],
  "07": [{ date: "07-04", name: "Independence Day" }],
  "08": [{ date: "08-01", name: "Back to School Season" }],
  "09": [
    { date: "09-01", name: "Labor Day" },
    { date: "09-22", name: "First Day of Fall" },
  ],
  "10": [
    { date: "10-31", name: "Halloween" },
    { date: "10-06", name: "National Homeschool Day" },
  ],
  "11": [
    { date: "11-11", name: "Veterans Day" },
    { date: "11-27", name: "Thanksgiving" },
  ],
  "12": [
    { date: "12-21", name: "Winter Solstice" },
    { date: "12-25", name: "Christmas" },
    { date: "12-31", name: "New Year's Eve" },
  ],
};

export async function POST(req: Request) {
  const supabase = await getSupabaseServerClient();
  if (!supabase)
    return Response.json({ error: "Database not available" }, { status: 503 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = inputSchema.safeParse(body);
  if (!parsed.success)
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });

  const { month } = parsed.data;
  const [year, mm] = month.split("-");
  const monthHolidays = HOLIDAY_CALENDAR[mm] || [];

  // Fetch NCHO product catalog for sales post ideas
  let productContext = "";
  try {
    const products = await fetchProducts();
    const activeProducts = products.filter((p) => p.status === "ACTIVE").slice(0, 40);
    productContext = activeProducts
      .map(
        (p) =>
          `- "${p.title}" (${p.vendor}) — ${p.tags.slice(0, 5).join(", ")} — $${p.variants.edges[0]?.node.price || "N/A"}`,
      )
      .join("\n");
  } catch {
    productContext = "(Product catalog unavailable — generate sales topics generically)";
  }

  // Check existing posts for this month to avoid duplicates
  const serviceClient = getSupabaseServiceRoleClient();
  let existingPosts: string[] = [];
  if (serviceClient) {
    const { data } = await serviceClient
      .from("blog_posts")
      .select("topic_seed, title")
      .eq("calendar_month", month);
    existingPosts = (data || []).map(
      (p: { topic_seed: string; title: string | null }) => p.topic_seed || p.title || "",
    );
  }

  const anthropic = new Anthropic();

  const systemPrompt = `You are a blog content calendar planner for Next Chapter Homeschool Outpost (NCHO), a curated homeschool curriculum store.

BRAND VOICE — NCHO:
- Audience: homeschool moms 30-45, faith-adjacent but not exclusively Christian, overwhelmed by curriculum choices
- Always say "your child" — never "your student"
- Voice: warm, specific, teacher's-eye-view. Not corporate. Not cheerful filler.
- Convicted, not curious. She's already decided to homeschool. Write to the conviction.
- Core message emotional: "For the child who doesn't fit in a box"
- Core message practical: "Your one-stop homeschool shop"
- Never use: explore, journey, spiritually curious, leverage, synergy, student

AUTHOR: Scott Somers — middle school teacher at a Title 1 school in Glennallen, Alaska. Real classroom experience. Teaches 65% Alaska Native students. This is his credibility.

TWO CONTENT LANES:
1. SALES posts — Reference specific NCHO products. Soft CTA: "Find it at nextchapterhomeschool.com". Never hard-sell.
2. AUTHORITY posts — position Scott/NCHO as the expert. Topics: AI in education, child data privacy, dangers of school-purchased curriculum (i-Ready etc.), homeschool curriculum selection, secular education, Alaska allotment eligibility.

TARGET: 2 posts per week + holiday/seasonal posts = roughly 8-10 posts per month.
Schedule posts on Tuesdays and Thursdays (optimal for homeschool parent engagement).`;

  const userPrompt = `Generate a blog content calendar for ${month} (${new Date(`${year}-${mm}-01`).toLocaleString("en-US", { month: "long" })} ${year}).

HOLIDAYS THIS MONTH:
${monthHolidays.length > 0 ? monthHolidays.map((h) => `- ${h.date}: ${h.name}`).join("\n") : "None"}

NCHO PRODUCT CATALOG (use for sales posts):
${productContext}

${existingPosts.length > 0 ? `ALREADY PLANNED (do not duplicate):\n${existingPosts.map((t) => `- ${t}`).join("\n")}` : ""}

Return a JSON array of blog post plans. Each entry:
{
  "target_date": "YYYY-MM-DD",
  "post_type": "sales" | "authority" | "holiday" | "seasonal",
  "topic_seed": "Brief description of the topic (1-2 sentences)",
  "suggested_title": "A working title for the post",
  "seo_keywords": ["keyword1", "keyword2", "keyword3"],
  "product_handles": ["handle1"] // only for sales posts, empty array otherwise
  "reasoning": "Why this topic on this date (1 sentence)"
}

Rules:
- Tuesdays and Thursdays preferred. Holidays on or near their actual date.
- Mix of sales and authority posts (roughly 40/60 split favoring authority)
- Sales posts MUST reference actual products from the catalog above
- Authority posts should be evergreen SEO content a homeschool parent would Google
- Every post needs 3+ SEO keywords a parent would actually search for
- No fluff. No "10 tips" listicles unless the tips are genuinely useful.
- Return ONLY the JSON array, no other text.`;

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: userPrompt }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";

  // Extract JSON from response
  let calendarEntries;
  try {
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (!jsonMatch) throw new Error("No JSON array found in response");
    calendarEntries = JSON.parse(jsonMatch[0]);
  } catch {
    return Response.json(
      { error: "Failed to parse calendar response", raw: text },
      { status: 500 },
    );
  }

  return Response.json({
    month,
    entries: calendarEntries,
    productCount: productContext.split("\n").length,
    existingCount: existingPosts.length,
  });
}
