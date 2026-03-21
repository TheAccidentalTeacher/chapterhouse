import { z } from "zod";

const environmentSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  OPENAI_API_KEY: z.string().min(1).optional(),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  // Phase 1 — Job Runner
  QSTASH_TOKEN: z.string().min(1).optional(),
  QSTASH_CURRENT_SIGNING_KEY: z.string().min(1).optional(),
  QSTASH_NEXT_SIGNING_KEY: z.string().min(1).optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
  RAILWAY_WORKER_URL: z.string().url().optional(),
  COUNCIL_WORKER_URL: z.string().url().optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  ALERT_EMAIL_TO: z.string().email().optional(),
  // Phase 3 — n8n Control Panel
  N8N_BASE_URL: z.string().url().optional(),
  N8N_API_KEY: z.string().min(1).optional(),
  // Research
  TAVILY_API_KEY: z.string().min(1).optional(),
  // Deep Research (M2)
  SERPAPI_API_KEY: z.string().min(1).optional(),
  REDDIT_CLIENT_ID: z.string().min(1).optional(),
  REDDIT_CLIENT_SECRET: z.string().min(1).optional(),
  // YouTube Intelligence
  YOUTUBE_API_KEY: z.string().min(1).optional(),
  GEMINI_API_KEY: z.string().min(1).optional(),
  // Document Processing (M3)
  AZURE_AI_FOUNDRY_KEY: z.string().min(1).optional(),
  AZURE_AI_FOUNDRY_ENDPOINT: z.string().url().optional(),
  // Image Generation (M4)
  STABILITY_AI_KEY: z.string().min(1).optional(),
  REPLICATE_TOKEN: z.string().min(1).optional(),
  LEONARDO_API_KEY: z.string().min(1).optional(),
  PEXELS_API_KEY: z.string().min(1).optional(),
  PIXABAY_API_KEY: z.string().min(1).optional(),
  UNSPLASH_ACCESS_KEY: z.string().min(1).optional(),
  CLOUDINARY_URL: z.string().min(1).optional(),
  // Voice Engine (M5)
  ELEVENLABS_CURRICULUM_KEY: z.string().min(1).optional(),
  ELEVENLABS_GENERAL_KEY: z.string().min(1).optional(),
  AZURE_SPEECH_KEY: z.string().min(1).optional(),
  AZURE_SPEECH_REGION: z.string().min(1).optional(),
  // Sound Browser (M7)
  FREESOUND_API_KEY: z.string().min(1).optional(),
  // Translation (M8)
  AZURE_TRANSLATOR_KEY: z.string().min(1).optional(),
  AZURE_TRANSLATOR_REGION: z.string().min(1).optional(),
  // Video Generation (M9)
  HEYGEN_API_KEY: z.string().min(1).optional(),
});

const envSource = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  // Phase 1 — Job Runner
  QSTASH_TOKEN: process.env.QSTASH_TOKEN,
  QSTASH_CURRENT_SIGNING_KEY: process.env.QSTASH_CURRENT_SIGNING_KEY,
  QSTASH_NEXT_SIGNING_KEY: process.env.QSTASH_NEXT_SIGNING_KEY,
  UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
  UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
  RAILWAY_WORKER_URL: process.env.RAILWAY_WORKER_URL,
  COUNCIL_WORKER_URL: process.env.COUNCIL_WORKER_URL,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  ALERT_EMAIL_TO: process.env.ALERT_EMAIL_TO,
  // Phase 3 — n8n Control Panel
  N8N_BASE_URL: process.env.N8N_BASE_URL,
  N8N_API_KEY: process.env.N8N_API_KEY,
  // Research
  TAVILY_API_KEY: process.env.TAVILY_API_KEY,
  // Deep Research (M2)
  SERPAPI_API_KEY: process.env.SERPAPI_API_KEY,
  REDDIT_CLIENT_ID: process.env.REDDIT_CLIENT_ID,
  REDDIT_CLIENT_SECRET: process.env.REDDIT_CLIENT_SECRET,
  // YouTube Intelligence
  YOUTUBE_API_KEY: process.env.YOUTUBE_API_KEY,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  // Document Processing (M3)
  AZURE_AI_FOUNDRY_KEY: process.env.AZURE_AI_FOUNDRY_KEY,
  AZURE_AI_FOUNDRY_ENDPOINT: process.env.AZURE_AI_FOUNDRY_ENDPOINT,
  // Image Generation (M4)
  STABILITY_AI_KEY: process.env.STABILITY_AI_KEY,
  REPLICATE_TOKEN: process.env.REPLICATE_TOKEN,
  LEONARDO_API_KEY: process.env.LEONARDO_API_KEY,
  PEXELS_API_KEY: process.env.PEXELS_API_KEY,
  PIXABAY_API_KEY: process.env.PIXABAY_API_KEY,
  UNSPLASH_ACCESS_KEY: process.env.UNSPLASH_ACCESS_KEY,
  CLOUDINARY_URL: process.env.CLOUDINARY_URL,
  // Voice Engine (M5)
  ELEVENLABS_CURRICULUM_KEY: process.env.ELEVENLABS_CURRICULUM_KEY,
  ELEVENLABS_GENERAL_KEY: process.env.ELEVENLABS_GENERAL_KEY,
  AZURE_SPEECH_KEY: process.env.AZURE_SPEECH_KEY,
  AZURE_SPEECH_REGION: process.env.AZURE_SPEECH_REGION,
  // Sound Browser (M7)
  FREESOUND_API_KEY: process.env.FREESOUND_API_KEY,
  // Translation (M8)
  AZURE_TRANSLATOR_KEY: process.env.AZURE_TRANSLATOR_KEY,
  AZURE_TRANSLATOR_REGION: process.env.AZURE_TRANSLATOR_REGION,
  // Video Generation (M9)
  HEYGEN_API_KEY: process.env.HEYGEN_API_KEY,
};

export function getEnvironmentStatus() {
  const result = environmentSchema.safeParse(envSource);

  return {
    isValid: result.success,
    fields: Object.entries(envSource).map(([key, value]) => ({
      key,
      present: Boolean(value),
      group: key.startsWith("NEXT_PUBLIC_SUPABASE") || key === "SUPABASE_SERVICE_ROLE_KEY"
        ? "supabase"
        : key.startsWith("QSTASH") || key.startsWith("UPSTASH") || key === "RAILWAY_WORKER_URL" || key === "COUNCIL_WORKER_URL"
        ? "jobs"
        : key === "RESEND_API_KEY" || key === "ALERT_EMAIL_TO"
        ? "email"
        : key === "N8N_BASE_URL" || key === "N8N_API_KEY"
        ? "n8n"
        : key === "TAVILY_API_KEY" || key === "SERPAPI_API_KEY" || key === "REDDIT_CLIENT_ID" || key === "REDDIT_CLIENT_SECRET"
        ? "research"
        : key === "YOUTUBE_API_KEY" || key === "GEMINI_API_KEY"
        ? "youtube"
        : key === "AZURE_AI_FOUNDRY_KEY" || key === "AZURE_AI_FOUNDRY_ENDPOINT"
        ? "documents"
        : key === "STABILITY_AI_KEY" || key === "REPLICATE_TOKEN" || key === "LEONARDO_API_KEY" || key === "PEXELS_API_KEY" || key === "PIXABAY_API_KEY" || key === "UNSPLASH_ACCESS_KEY" || key === "CLOUDINARY_URL"
        ? "images"
        : key === "ELEVENLABS_CURRICULUM_KEY" || key === "ELEVENLABS_GENERAL_KEY" || key === "AZURE_SPEECH_KEY" || key === "AZURE_SPEECH_REGION"
        ? "voice"
        : key === "FREESOUND_API_KEY"
        ? "sounds"
        : key === "AZURE_TRANSLATOR_KEY" || key === "AZURE_TRANSLATOR_REGION"
        ? "translation"
        : key === "HEYGEN_API_KEY"
        ? "video"
        : "ai",
    })),
  };
}

export function hasSupabasePublicEnv() {
  return Boolean(
    envSource.NEXT_PUBLIC_SUPABASE_URL &&
      (envSource.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
        envSource.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY),
  );
}

export function getPublicSupabaseEnv() {
  if (!hasSupabasePublicEnv()) {
    return null;
  }

  return {
    url: envSource.NEXT_PUBLIC_SUPABASE_URL as string,
    anonKey: (envSource.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      envSource.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) as string,
  };
}
