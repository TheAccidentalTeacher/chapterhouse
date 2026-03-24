import Anthropic from "@anthropic-ai/sdk";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";
import { z } from "zod";

const generateSchema = z.object({
  brands: z.array(z.enum(["ncho", "somersschool", "alana_terry", "scott_personal"])).min(1),
  platforms: z.array(z.enum(["facebook", "instagram", "linkedin"])).min(1),
  count_per_combo: z.number().int().min(1).max(7).default(3),
  topic_seed: z.string().optional(),
  job_id: z.string().uuid().optional(),
});

// Hardcoded safety net — never remove. Used when DB is unavailable.
const BRAND_VOICE_FALLBACK = `
You are a social media content generator for three brands owned by Scott and Anna Somers.
Return ONLY valid JSON — no markdown, no explanation, no preamble.

BRAND RULES:

ncho (Next Chapter Homeschool Outpost — Shopify homeschool store):
- Audience: homeschool moms 30-45, faith-adjacent, overwhelmed by curriculum choices.
- Always say "your child" — never "your student."
- Core message emotional layer: "For the child who doesn't fit in a box."
- Core message practical layer: "Your one-stop homeschool shop."
- Convicted, not curious. She's already decided to homeschool. Write to conviction.
- Voice: warm, specific, teacher's-eye-view. Not corporate. Not cheerful filler.
- Never use: explore, journey, spiritually curious, leverage, synergy, student.
- Facebook: 2-4 sentences. Hook → child → product → CTA. Max 400 chars.
- Instagram: first line is the hook (must work as standalone). 3-5 sentences total. 3-5 hashtags.

somersschool (secular homeschool SaaS course platform):
- ALL SECULAR. Zero faith language, ever. Alaska Statute 14.03.320 compliance.
- Visible progress is the product. Lead with what the child gets to SHOW.
- Voice: confident teacher who knows his craft. Specific over general.
- LinkedIn: counterintuitive first line, 3 short paragraphs, light CTA.
- Instagram: lesson preview or win showcase. Bold and clean.
- Never use: spiritual, faith, Christian, explore your beliefs, student (use "child").

alana_terry (Anna Somers — Christian fiction author + "Praying Christian Women" podcast):
- Write as a woman (Anna's voice, not Scott's).
- Personal, vulnerable. Story-forward. Faith is assumed, never preachy.
- Community: readers and listeners are friends, not audiences.
- Facebook/Instagram only. LinkedIn does not apply.
- Book posts: question readers are asking → character/theme connection → CTA.
- Podcast posts: episode's most arresting insight → 2 sentences context → "new episode live."

PLATFORM FORMAT RULES:
- facebook: conversational, 2-4 sentences, CTA at end, no hashtags
- instagram: punchy, first 125 chars must stand alone, 3-5 hashtags on separate line
- linkedin: professional, first 210 chars is the hook, white space between paragraphs, no hashtags

OUTPUT FORMAT — return a JSON array of post objects:
[
  {
    "brand": "ncho",
    "platform": "facebook",
    "post_text": "...",
    "hashtags": [],
    "image_brief": "What the image should show, color palette, dimensions needed"
  }
]
`.trim();

const PLATFORM_RULES = `
PLATFORM FORMAT RULES:
- facebook: conversational, 2-4 sentences, CTA at end, no hashtags
- instagram: punchy, first 125 chars must stand alone, 3-5 hashtags on separate line
- linkedin: professional, first 210 chars is the hook, white space between paragraphs, no hashtags

OUTPUT FORMAT — return a JSON array of post objects:
[
  {
    "brand": "ncho",
    "platform": "facebook",
    "post_text": "...",
    "hashtags": [],
    "image_brief": "What the image should show, color palette, dimensions needed"
  }
]`;

async function getBrandVoiceSystem(brands: string[]): Promise<string> {
  try {
    const supabase = getSupabaseServiceRoleClient();
    if (!supabase) return BRAND_VOICE_FALLBACK;

    const { data, error } = await supabase
      .from("brand_voices")
      .select("brand, full_voice_prompt")
      .in("brand", brands)
      .eq("is_active", true);

    if (error || !data?.length) return BRAND_VOICE_FALLBACK;

    const voiceBlocks = data.map((v) => v.full_voice_prompt).join("\n\n");
    return `You are a social media content generator for three brands owned by Scott and Anna Somers.
Return ONLY valid JSON — no markdown, no explanation, no preamble.

BRAND RULES:

${voiceBlocks}
${PLATFORM_RULES}`.trim();
  } catch {
    return BRAND_VOICE_FALLBACK;
  }
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

  const parsed = generateSchema.safeParse(body);
  if (!parsed.success) return Response.json({ error: parsed.error.flatten() }, { status: 400 });

  const { brands, platforms, count_per_combo, topic_seed, job_id } = parsed.data;

  const userPrompt = `Generate ${count_per_combo} social media post(s) for each of these brand+platform combinations:
${brands.flatMap((b) => platforms.map((p) => `- brand: ${b}, platform: ${p}`)).join("\n")}
${topic_seed ? `\nContent seed / topic: ${topic_seed}` : ""}

Return a flat JSON array. One object per brand+platform combination per post.
Total objects expected: ${brands.length * platforms.length * count_per_combo}`;

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  let posts: Array<{
    brand: string;
    platform: string;
    post_text: string;
    hashtags: string[];
    image_brief?: string;
  }>;

  try {
    const brandVoiceSystem = await getBrandVoiceSystem(brands);
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: brandVoiceSystem,
      messages: [{ role: "user", content: userPrompt }],
    });

    const rawText = response.content[0].type === "text" ? response.content[0].text : "";
    const clean = rawText.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
    posts = JSON.parse(clean);

    if (!Array.isArray(posts)) throw new Error("Response was not an array");
  } catch (err) {
    console.error("[social/generate] Claude error:", err);
    return Response.json({ error: "Generation failed", detail: String(err) }, { status: 500 });
  }

  const rows = posts.map((p) => ({
    brand: p.brand,
    platform: p.platform,
    post_text: p.post_text,
    hashtags: p.hashtags ?? [],
    image_brief: p.image_brief ?? null,
    generation_prompt: userPrompt,
    job_id: job_id ?? null,
    status: "pending_review" as const,
  }));

  const { data, error } = await supabase.from("social_posts").insert(rows).select();

  if (error) {
    console.error("[social/generate] DB insert error:", error);
    return Response.json({ error: "Failed to save posts" }, { status: 500 });
  }

  return Response.json({ posts: data, count: data.length }, { status: 201 });
}
