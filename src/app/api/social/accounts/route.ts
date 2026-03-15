import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";
import { z } from "zod";

const accountSchema = z.object({
  brand: z.enum(["ncho", "somersschool", "alana_terry", "scott_personal"]),
  platform: z.enum(["facebook", "instagram", "linkedin", "threads", "tiktok", "youtube", "pinterest"]),
  buffer_profile_id: z.string(),
  display_name: z.string(),
});

export async function GET() {
  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) return Response.json({ error: "DB unavailable" }, { status: 503 });

  const { data, error } = await supabase
    .from("social_accounts")
    .select("*")
    .eq("is_active", true)
    .order("brand")
    .order("platform");

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ accounts: data });
}

export async function POST(req: Request) {
  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) return Response.json({ error: "DB unavailable" }, { status: 503 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = accountSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });

  const { data, error } = await supabase
    .from("social_accounts")
    .upsert(parsed.data, { onConflict: "brand,platform" })
    .select()
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ account: data }, { status: 201 });
}
