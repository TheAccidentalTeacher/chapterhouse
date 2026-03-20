import { getSupabaseServerClient, getSupabaseServiceRoleClient } from "@/lib/supabase-server";
import { processIntelUrls, type ProposedSeed } from "@/app/api/intel/route";

/**
 * POST /api/intel/run-fetch
 *
 * Manual trigger for the daily auto-fetch — same 5 watch URLs as the cron job.
 * Authenticated via Supabase session (no CRON_SECRET needed).
 * Bypasses the "already ran today" duplicate check so Scott can run it any time.
 */

const INTEL_WATCH_URLS = [
  "https://www.publishersweekly.com/pw/by-topic/industry-news/religion/index.html",
  "https://www.publishersweekly.com/pw/by-topic/childrens/childrens-industry-news/index.html",
  "https://homeschoolbase.com/news/",
  "https://www.hslda.org/news",
  "https://techcrunch.com/category/artificial-intelligence/",
];

export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) return Response.json({ error: "Database not available" }, { status: 503 });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const serviceSupabase = getSupabaseServiceRoleClient();
  if (!serviceSupabase) return Response.json({ error: "Database not available" }, { status: 503 });

  const now = new Date();
  const session_label = `Auto-Fetch — ${now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}`;

  const { data: session, error: insertError } = await serviceSupabase
    .from("intel_sessions")
    .insert({
      user_id: user.id,
      urls: INTEL_WATCH_URLS,
      source_type: "cron",
      session_label,
      status: "pending",
    })
    .select()
    .single();

  if (insertError) return Response.json({ error: insertError.message }, { status: 500 });

  // Process inline (maxDuration: 60 covers 5 URLs)
  try {
    const output = await processIntelUrls(session.id, INTEL_WATCH_URLS);

    let seedsExtracted = 0;
    if (output.proposed_seeds?.length > 0) {
      const seedRows = output.proposed_seeds.map((seed: ProposedSeed) => ({
        user_id: user.id,
        text: seed.text,
        notes: `Rationale: ${seed.rationale}\nSource: ${seed.source_headline}`,
        category: seed.category ?? "intel",
        source_type: "intel",
        source_label: session_label,
        status: "seed",
      }));
      const { data: inserted } = await serviceSupabase.from("dreams").insert(seedRows).select("id");
      seedsExtracted = inserted?.length ?? 0;
    }

    await serviceSupabase
      .from("intel_sessions")
      .update({ seeds_extracted: seedsExtracted })
      .eq("id", session.id);

    return Response.json({ session_id: session.id, seeds_extracted: seedsExtracted });
  } catch (err) {
    await serviceSupabase
      .from("intel_sessions")
      .update({ status: "failed", error: String(err) })
      .eq("id", session.id);
    return Response.json({ error: String(err) }, { status: 500 });
  }
}
