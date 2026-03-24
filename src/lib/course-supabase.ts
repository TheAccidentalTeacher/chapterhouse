import { createClient, SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

/**
 * Singleton Supabase admin client for the CoursePlatform database.
 * Uses COURSE_SUPABASE_URL + COURSE_SUPABASE_SERVICE_ROLE_KEY.
 * Server-side only — never call this from a client component.
 */
export function createCourseAdmin(): SupabaseClient {
  if (!client) {
    const url = process.env.COURSE_SUPABASE_URL;
    const key = process.env.COURSE_SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error(
        "COURSE_SUPABASE_URL / COURSE_SUPABASE_SERVICE_ROLE_KEY not configured"
      );
    }
    client = createClient(url, key);
  }
  return client;
}
