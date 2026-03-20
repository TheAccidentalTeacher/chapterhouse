import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";
import { processIntelUrls, type IntelOutput, type ProposedSeed } from "@/app/api/intel/route";

/**
 * GET /api/cron/intel-fetch
 *
 * Daily cron job — runs at 04:00 UTC (8:00 PM Alaska / midnight EST).
 * Collects intelligence from configured RSS feeds and creates an Intel session automatically.
 * Scheduled in vercel.json.
 *
 * Protected by CRON_SECRET bearer token.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) return Response.json({ error: "Database not available" }, { status: 503 });

  const { data: usersData } = await supabase.auth.admin.listUsers();
  const userId = usersData?.users?.[0]?.id;
  if (!userId) return Response.json({ error: "No user found" }, { status: 500 });

  // Curated Intel watch list — URLs worth checking daily
  // These are high-signal sources for NCHO, SomersSchool, and Chapterhouse business context
  const INTEL_WATCH_URLS = [
    "https://www.publishersweekly.com/pw/by-topic/industry-news/religion/index.html",
    "https://www.publishersweekly.com/pw/by-topic/childrens/childrens-industry-news/index.html",
    "https://homeschoolbase.com/news/",
    "https://www.hslda.org/news",
    "https://techcrunch.com/category/artificial-intelligence/",
  ];

  const today = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  const session_label = `Daily Intel — ${today}`;

  // Check if we already ran today
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const { data: existing } = await supabase
    .from("intel_sessions")
    .select("id")
    .eq("source_type", "cron")
    .gte("created_at", startOfDay.toISOString())
    .limit(1);

  if (existing && existing.length > 0) {
    return Response.json({ message: "Daily Intel already ran today", session_id: existing[0].id });
  }

  // Create session
  const { data: session, error: insertError } = await supabase
    .from("intel_sessions")
    .insert({
      user_id: userId,
      urls: INTEL_WATCH_URLS,
      source_type: "cron",
      session_label,
      status: "pending",
    })
    .select()
    .single();

  if (insertError) {
    return Response.json({ error: insertError.message }, { status: 500 });
  }

  // Process
  try {
    const output = await processIntelUrls(session.id, INTEL_WATCH_URLS);

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
        source_label: `Cron Intel — ${today}`,
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

    console.log(`[cron/intel-fetch] Complete — ${seedsExtracted} seeds extracted from ${INTEL_WATCH_URLS.length} sources`);
    return Response.json({ ok: true, session_id: session.id, seeds_extracted: seedsExtracted });
  } catch (e) {
    await supabase.from("intel_sessions").update({ status: "failed", error: String(e) }).eq("id", session.id);
    return Response.json({ error: String(e), session_id: session.id }, { status: 500 });
  }
}
