import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getPublicSupabaseEnv } from "@/lib/env";

export async function getSupabaseServerClient() {
  const env = getPublicSupabaseEnv();

  if (!env) {
    return null;
  }

  const cookieStore = await cookies();

  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookieValues) {
        cookieValues.forEach(({ name, value, options }) => {
          try {
            cookieStore.set(name, value, options);
          } catch {
          }
        });
      },
    },
  });
}