/**
 * Shared authentication helper for all email API routes.
 *
 * Email routes that use the Supabase service-role key internally (to bypass
 * RLS for cross-account operations) still need to verify the CALLER is
 * authorized. This helper enforces one of two auth paths:
 *
 *   (a) Supabase session cookie — valid for all browser UI calls
 *   (b) Authorization: Bearer <CRON_SECRET> — trusted internal calls
 *       (Vercel cron, QStash, daily email-digest pipeline)
 *
 * Returns { userId } if authorized, null if not.
 * Callers must return HTTP 401 when null is returned.
 *
 * Why not middleware? The email routes use service-role internally, so global
 * middleware cannot gate them on session alone. This helper checks both paths
 * and is the single source of auth truth for the email subsystem.
 */
import {
  getSupabaseServerClient,
  getSupabaseServiceRoleClient,
} from "./supabase-server";

export async function requireEmailAuth(
  req: Request
): Promise<{ userId: string } | null> {
  // ── Path 1: Trusted internal call via CRON_SECRET ─────────────────────────
  // Used by Vercel cron jobs and the email-digest pipeline.
  // CRON_SECRET is a randomly-generated secret known only to Vercel and Railway.
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = req.headers.get("authorization");
    if (authHeader === `Bearer ${cronSecret}`) {
      // Resolve the single Chapterhouse user ID via the service-role admin API.
      const serviceClient = getSupabaseServiceRoleClient();
      if (!serviceClient) return null;
      const { data } = await serviceClient.auth.admin.listUsers();
      const userId = data?.users?.[0]?.id;
      return userId ? { userId } : null;
    }
  }

  // ── Path 2: Browser session cookie ────────────────────────────────────────
  // Standard Supabase SSR auth — cookie set on login at /login.
  const client = await getSupabaseServerClient();
  if (!client) return null;
  const {
    data: { user },
  } = await client.auth.getUser();
  return user ? { userId: user.id } : null;
}
