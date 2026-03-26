import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";
import { z } from "zod";

const createCharacterSchema = z.object({
  slug: z.string().min(1).max(80).regex(/^[a-z0-9-]+$/, "slug must be lowercase with hyphens only"),
  name: z.string().min(1).max(100),
  description: z.string().max(500).default(""),
  physical_description: z.string().max(2000).default(""),
  art_style: z.string().max(1000).default(""),
  negative_prompt: z.string().max(1000).default(""),
  reference_images: z.array(z.string().url()).max(10).default([]),
  hero_image_url: z.string().url().nullable().optional(),
  preferred_provider: z.enum(["openai", "stability", "replicate", "leonardo"]).default("replicate"),
  trigger_word: z.string().max(100).nullable().optional(),
});

export async function GET() {
  try {
    const supabase = getSupabaseServiceRoleClient();
    if (!supabase) {
      return Response.json({ error: "Database not configured" }, { status: 500 });
    }

    const { data, error } = await supabase
      .from("characters")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (error) throw error;

    return Response.json({ characters: data ?? [] });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to fetch characters";
    console.error("[characters] GET error:", message);
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = createCharacterSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const supabase = getSupabaseServiceRoleClient();
    if (!supabase) {
      return Response.json({ error: "Database not configured" }, { status: 500 });
    }

    const { data, error } = await supabase
      .from("characters")
      .insert(parsed.data)
      .select()
      .single();

    if (error) throw error;

    return Response.json({ character: data }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create character";
    console.error("[characters] POST error:", message);
    return Response.json({ error: message }, { status: 500 });
  }
}
