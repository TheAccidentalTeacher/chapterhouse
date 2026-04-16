import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";
import { processIntelUrls, type IntelOutput, type ProposedSeed } from "@/app/api/intel/route";

/**
 * POST /api/intel/process
 *
 * Internal endpoint for processing a pending Intel session.
 * Called by the Railway worker (intel_fetch job type) or for manual re-processing.
 * Protected by CRON_SECRET bearer token.
 *
 * Body: { session_id: string }
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const sessionId: string = body.session_id;
    if (!sessionId) return Response.json({ error: "session_id required" }, { status: 400 });

    const supabase = getSupabaseServiceRoleClient();
    if (!supabase) return Response.json({ error: "Database not available" }, { status: 503 });

    // Fetch the session
    const { data: session, error: fetchError } = await supabase
      .from("intel_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (fetchError || !session) {
      return Response.json({ error: "Session not found" }, { status: 404 });
    }

    if (session.status === "complete") {
      return Response.json({ message: "Already complete", session }, { status: 200 });
    }

    const urls: string[] = session.urls ?? [];

    // Process the session
    const output = await processIntelUrls(sessionId, urls);

    // Extract seeds to dreams table
    let seedsExtracted = 0;
    const { data: usersData } = await supabase.auth.admin.listUsers();
    const userId = usersData?.users?.[0]?.id;

    if (userId && output.proposed_seeds?.length > 0) {
      const seedRows = output.proposed_seeds.map((seed: ProposedSeed) => ({
        user_id: userId,
        text: seed.text,
        notes: `Rationale: ${seed.rationale}\nSource: ${seed.source_headline}`,
        status: "seed",
        category: seed.category ?? "general",
        priority_score: 55,
        source_type: "intel",
        source_label: `Intel session — ${session.session_label ?? sessionId}`,
        sort_order: 0,
      }));
      const { data: insertedSeeds } = await supabase.from("dreams").insert(seedRows).select("id");
      seedsExtracted = insertedSeeds?.length ?? 0;
    }

    const finalOutput: IntelOutput = {
      ...output,
      proposed_seeds: output.proposed_seeds.map((s: ProposedSeed) => ({ ...s, added: true })),
    };

    await supabase
      .from("intel_sessions")
      .update({ status: "complete", processed_output: finalOutput, seeds_extracted: seedsExtracted })
      .eq("id", sessionId);

    return Response.json({ ok: true, seeds_extracted: seedsExtracted });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
