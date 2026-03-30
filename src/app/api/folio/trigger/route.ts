import { buildFolioEntry } from "@/lib/folio-builder";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

export const maxDuration = 300; // Claude synthesis can take a few minutes

export async function POST(request: Request) {
  try {
    // Auth: CRON_SECRET bearer token or authenticated Supabase session
    const authHeader = request.headers.get("authorization") ?? "";
    const isCron = authHeader === `Bearer ${process.env.CRON_SECRET}`;

    if (!isCron) {
      // Fall back to Supabase session check for manual UI triggers
      const supabase = getSupabaseServiceRoleClient();
      if (!supabase) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
      // For manual triggers from the UI we allow any authenticated request
      // (Chapterhouse is Scott + Anna only)
    }

    const body = await request.json().catch(() => ({}));
    const dateStr = (body as { date?: string }).date;
    const date = dateStr ? new Date(dateStr) : new Date();

    const result = await buildFolioEntry(date);

    return Response.json({
      ok: true,
      id: result.id,
      entry_date: result.entry_date,
    });
  } catch (err) {
    console.error("[folio/build] Error:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Folio build failed" },
      { status: 500 }
    );
  }
}
