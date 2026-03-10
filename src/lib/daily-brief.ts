import { dailyBriefSections as fallbackSections } from "@/lib/mock-data";
import {
  getSupabaseServerClient,
  getSupabaseServiceRoleClient,
} from "@/lib/supabase-server";

type PersistedBriefItem = {
  headline: string;
  whyItMatters: string;
  score: string;
  sources: number;
};

type PersistedBriefSection = {
  title: string;
  items: PersistedBriefItem[];
};

type PersistedBriefRow = {
  id: string;
  brief_date: string;
  title: string;
  summary: string | null;
  sections: unknown;
  source_count: number;
  status: string;
};

export type LatestDailyBrief = {
  source: "supabase" | "mock";
  asOf: string | null;
  title: string;
  summary: string | null;
  sections: PersistedBriefSection[];
  sourceCount: number;
};

function normalizeSections(input: unknown): PersistedBriefSection[] {
  if (!Array.isArray(input)) {
    return fallbackSections;
  }

  const normalized = input
    .map((section): PersistedBriefSection | null => {
      if (!section || typeof section !== "object") {
        return null;
      }

      const candidate = section as {
        title?: unknown;
        items?: unknown;
      };

      if (typeof candidate.title !== "string" || !Array.isArray(candidate.items)) {
        return null;
      }

      const items = candidate.items
        .map((item): PersistedBriefItem | null => {
          if (!item || typeof item !== "object") {
            return null;
          }

          const value = item as {
            headline?: unknown;
            whyItMatters?: unknown;
            score?: unknown;
            sources?: unknown;
          };

          if (
            typeof value.headline !== "string" ||
            typeof value.whyItMatters !== "string" ||
            typeof value.score !== "string"
          ) {
            return null;
          }

          const sourceCount =
            typeof value.sources === "number" && Number.isFinite(value.sources)
              ? value.sources
              : 0;

          return {
            headline: value.headline,
            whyItMatters: value.whyItMatters,
            score: value.score,
            sources: sourceCount,
          };
        })
        .filter((item): item is PersistedBriefItem => item !== null);

      if (items.length === 0) {
        return null;
      }

      return {
        title: candidate.title,
        items,
      };
    })
    .filter((section): section is PersistedBriefSection => section !== null);

  return normalized.length > 0 ? normalized : fallbackSections;
}

export async function getLatestDailyBrief(): Promise<LatestDailyBrief> {
  const supabase =
    getSupabaseServiceRoleClient() || (await getSupabaseServerClient());

  if (!supabase) {
    return {
      source: "mock",
      asOf: null,
      title: "Daily Brief",
      summary: "Supabase is not mapped yet for this app runtime.",
      sections: fallbackSections,
      sourceCount: 0,
    };
  }

  const { data, error } = await supabase
    .from("briefs")
    .select("id, brief_date, title, summary, sections, source_count, status")
    .eq("status", "published")
    .order("brief_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle<PersistedBriefRow>();

  if (error || !data) {
    return {
      source: "mock",
      asOf: null,
      title: "Daily Brief",
      summary: "No published brief record found yet, showing seeded fallback data.",
      sections: fallbackSections,
      sourceCount: 0,
    };
  }

  return {
    source: "supabase",
    asOf: data.brief_date,
    title: data.title,
    summary: data.summary,
    sections: normalizeSections(data.sections),
    sourceCount: data.source_count,
  };
}