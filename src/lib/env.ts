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
        : key === "TAVILY_API_KEY"
        ? "research"
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