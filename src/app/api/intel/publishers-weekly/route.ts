import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";
import { processIntelUrls, type IntelOutput, type ProposedSeed } from "@/app/api/intel/route";

/**
 * POST /api/intel/publishers-weekly
 *
 * Accepts raw pasted text from Publishers Weekly (or any long-form text source)
 * and runs it through the Intel analysis pipeline.
 * Replaces the manual emit/intel Python pipeline.
 *
 * Body: { content: string, session_label?: string }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const content: string = body.content?.trim();
    const session_label: string = body.session_label?.trim() || `PW Report — ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}`;

    if (!content) return Response.json({ error: "content is required" }, { status: 400 });
    if (content.length < 100) return Response.json({ error: "Content too short — paste the full report" }, { status: 400 });

    const supabase = getSupabaseServiceRoleClient();
    if (!supabase) return Response.json({ error: "Database not available" }, { status: 503 });

    const { data: usersData } = await supabase.auth.admin.listUsers();
    const userId = usersData?.users?.[0]?.id;
    if (!userId) return Response.json({ error: "No user found" }, { status: 500 });

    // Create session with source_type: publishers_weekly
    const { data: session, error: insertError } = await supabase
      .from("intel_sessions")
      .insert({
        user_id: userId,
        urls: [],
        source_type: "publishers_weekly",
        session_label,
        status: "pending",
      })
      .select()
      .single();

    if (insertError) return Response.json({ error: insertError.message }, { status: 500 });

    // Process with pasted content as extra_content (no URLs to fetch)
    const output = await processIntelUrls(session.id, [], content);

    let seedsExtracted = 0;
    if (output.proposed_seeds?.length > 0) {
      const seedRows = output.proposed_seeds.map((seed: ProposedSeed) => ({
        user_id: userId,
        text: seed.text,
        notes: `Rationale: ${seed.rationale}\nSource: ${seed.source_headline}`,
        status: "seed",
        category: seed.category ?? "general",
        priority_score: 55,
        source_type: "intel",
        source_label: `PW Intel — ${session_label}`,
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
      .eq("id", session.id);

    return Response.json(
      { session: { ...session, status: "complete", processed_output: finalOutput, seeds_extracted: seedsExtracted } },
      { status: 201 }
    );
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
