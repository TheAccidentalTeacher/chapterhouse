import { getSupabaseServerClient } from "@/lib/supabase-server";
import { z } from "zod";

const createSchema = z.object({
  entries: z.array(
    z.object({
      target_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      post_type: z.enum(["sales", "authority", "holiday", "seasonal"]),
      topic_seed: z.string().min(1),
      title: z.string().optional(),
      seo_keywords: z.array(z.string()).optional(),
      product_references: z.array(z.string()).optional(),
      calendar_month: z.string().regex(/^\d{4}-\d{2}$/),
    }),
  ),
});

export async function GET(req: Request) {
  const supabase = await getSupabaseServerClient();
  if (!supabase)
    return Response.json({ error: "Database not available" }, { status: 503 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month");
  const status = searchParams.get("status");

  let query = supabase
    .from("blog_posts")
    .select("*")
    .eq("user_id", user.id)
    .order("target_date", { ascending: true });

  if (month) query = query.eq("calendar_month", month);
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ posts: data });
}

// Bulk-insert planned posts from calendar generation
export async function POST(req: Request) {
  const supabase = await getSupabaseServerClient();
  if (!supabase)
    return Response.json({ error: "Database not available" }, { status: 503 });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success)
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });

  const rows = parsed.data.entries.map((entry) => ({
    user_id: user.id,
    target_date: entry.target_date,
    post_type: entry.post_type,
    topic_seed: entry.topic_seed,
    title: entry.title || null,
    seo_keywords: entry.seo_keywords || [],
    product_references: entry.product_references || [],
    calendar_month: entry.calendar_month,
    status: "planned",
  }));

  const { data, error } = await supabase.from("blog_posts").insert(rows).select();
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ inserted: data?.length || 0, posts: data });
}
