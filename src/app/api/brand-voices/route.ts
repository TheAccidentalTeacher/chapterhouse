import { getSupabaseServerClient } from '@/lib/supabase-server'
import { z } from 'zod'

const createSchema = z.object({
  brand: z.enum(['ncho', 'somersschool', 'alana_terry', 'scott_personal']),
  display_name: z.string().min(1).max(100),
  audience: z.string().default(''),
  tone: z.string().default(''),
  rules: z.string().default(''),
  forbidden_words: z.array(z.string()).default([]),
  platform_hints: z.record(z.string(), z.string()).default({}),
  full_voice_prompt: z.string().min(1),
})

export async function GET() {
  const supabase = await getSupabaseServerClient()
  if (!supabase) return Response.json({ error: 'DB not configured' }, { status: 503 })
  const { data, error } = await supabase
    .from('brand_voices')
    .select('*')
    .order('brand')

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data)
}

export async function POST(req: Request) {
  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return Response.json({ error: parsed.error }, { status: 400 })

  const supabase = await getSupabaseServerClient()
  if (!supabase) return Response.json({ error: 'DB not configured' }, { status: 503 })
  const { data, error } = await supabase
    .from('brand_voices')
    .insert(parsed.data)
    .select()
    .single()

  if (error) return Response.json({ error: error.message }, { status: 500 })
  return Response.json(data, { status: 201 })
}
