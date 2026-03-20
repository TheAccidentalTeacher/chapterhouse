import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { getPublicSupabaseEnv } from "@/lib/env";

/**
 * Returns the authenticated user's ID from the current request session.
 * Throws if no authenticated user exists.
 *
 * Used by API routes that need to scope Supabase queries to a specific user
 * (Phase 0 multi-tenant foundation).
 */
export async function getAuthenticatedUserId(): Promise<string> {
  const env = getPublicSupabaseEnv();
  if (!env) throw new Error("Supabase environment not configured");

  const cookieStore = await cookies();
  const supabase = createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthenticated");
  return user.id;
}
