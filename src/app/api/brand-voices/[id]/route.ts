import { getSupabaseServerClient } from '@/lib/supabase-server'
import { z } from 'zod'

const patchSchema = z.object({
  display_name: z.string().min(1).max(100).optional(),
  audience: z.string().optional(),
  tone: z.string().optional(),
  rules: z.string().optional(),
  forbidden_words: z.array(z.string()).optional(),
  platform_hints: z.record(z.string(), z.string()).optional(),
  full_voice_prompt: z.string().min(1).optional(),
  is_active: z.boolean().optional(),
})

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await getSupabaseServerClient()
  if (!supabase) return Response.json({ error: 'DB not configured' }, { status: 503 })
  const { data, error } = await supabase
    .from('brand_voices')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return Response.json({ error: error.message }, { status: 404 })
  return Response.json(data)
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: parsed.error }, { status: 400 })

  const supabase = await getSupabaseServerClient()
  if (!supabase) return Response.json({ error: 'DB not configured' }, { status: 503 })

  // Fetch current version to increment it
  const { data: current, error: fetchErr } = await supabase
    .from('brand_voices')
    .select('version')
    .eq('id', id)
    .single()
  if (fetchErr) return Response.json({ error: fetchErr.message }, { status: 404 })

  const { data, error } = await supabase
    .from('brand_voices')
    .update({ ...parsed.data, version: current.version + 1 })
    .eq('id', id)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await getSupabaseServerClient()
  if (!supabase) return Response.json({ error: 'DB not configured' }, { status: 503 })

  // Soft delete — mark inactive rather than hard delete
  const { error } = await supabase
    .from('brand_voices')
    .update({ is_active: false })
    .eq('id', id)

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return new Response(null, { status: 204 })
}
