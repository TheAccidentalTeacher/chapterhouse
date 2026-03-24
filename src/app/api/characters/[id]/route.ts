import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";
import { z } from "zod";

const updateCharacterSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  physical_description: z.string().max(2000).optional(),
  art_style: z.string().max(1000).optional(),
  negative_prompt: z.string().max(1000).optional(),
  reference_images: z.array(z.string().url()).max(10).optional(),
  hero_image_url: z.string().url().nullable().optional(),
  preferred_provider: z.enum(["openai", "stability", "replicate", "leonardo"]).optional(),
  lora_model_id: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const parsed = updateCharacterSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const supabase = getSupabaseServiceRoleClient();
    if (!supabase) {
      return Response.json({ error: "Database not configured" }, { status: 500 });
    }

    const { data, error } = await supabase
      .from("characters")
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    if (!data) return Response.json({ error: "Character not found" }, { status: 404 });

    return Response.json({ character: data });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to update character";
    console.error("[characters/[id]] PATCH error:", message);
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;

    const supabase = getSupabaseServiceRoleClient();
    if (!supabase) {
      return Response.json({ error: "Database not configured" }, { status: 500 });
    }

    // Soft delete — set is_active = false
    const { error } = await supabase
      .from("characters")
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;

    return Response.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to delete character";
    console.error("[characters/[id]] DELETE error:", message);
    return Response.json({ error: message }, { status: 500 });
  }
}
