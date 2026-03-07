import { z } from "zod";

const environmentSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  OPENAI_API_KEY: z.string().min(1).optional(),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
});

const envSource = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
};

export function getEnvironmentStatus() {
  const result = environmentSchema.safeParse(envSource);

  return {
    isValid: result.success,
    fields: Object.entries(envSource).map(([key, value]) => ({
      key,
      present: Boolean(value),
    })),
  };
}

export function hasSupabasePublicEnv() {
  return Boolean(
    envSource.NEXT_PUBLIC_SUPABASE_URL && envSource.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function getPublicSupabaseEnv() {
  if (!hasSupabasePublicEnv()) {
    return null;
  }

  return {
    url: envSource.NEXT_PUBLIC_SUPABASE_URL as string,
    anonKey: envSource.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
  };
}