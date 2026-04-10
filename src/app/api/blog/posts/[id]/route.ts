import { getSupabaseServerClient } from "@/lib/supabase-server";
import { z } from "zod";

const patchSchema = z.object({
  title: z.string().optional(),
  topic_seed: z.string().optional(),
  target_date: z.string().optional(),
  post_type: z.enum(["sales", "authority", "holiday", "seasonal"]).optional(),
  body: z.string().optional(),
  excerpt: z.string().optional(),
  tags: z.array(z.string()).optional(),
  seo_title: z.string().optional(),
  seo_description: z.string().optional(),
  seo_keywords: z.array(z.string()).optional(),
  product_references: z.array(z.string()).optional(),
  status: z
    .enum(["planned", "drafting", "draft", "review", "published", "rejected"])
    .optional(),
});

export async function GET(
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

  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (error) return Response.json({ error: error.message }, { status: 404 });
  return Response.json(data);
}

export async function PATCH(
  req: Request,
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

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success)
    return Response.json({ error: parsed.error.flatten() }, { status: 400 });

  const updates = {
    ...parsed.data,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("blog_posts")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json(data);
}

export async function DELETE(
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

  const { error } = await supabase
    .from("blog_posts")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ ok: true });
}
