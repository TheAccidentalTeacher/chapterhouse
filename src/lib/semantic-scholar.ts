export interface CitationResult {
  title: string;
  authors: string;
  year: number | null;
  abstract: string;
  doi: string | null;
}

export async function searchSemanticScholar(query: string): Promise<CitationResult[]> {
  try {
    const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&fields=title,authors,year,abstract,externalIds&limit=12`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Chapterhouse/1.0 (scholarly research tool)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    const json = (await res.json()) as {
      data?: Array<{
        title?: string;
        authors?: Array<{ name: string }>;
        year?: number;
        abstract?: string;
        externalIds?: { DOI?: string };
      }>;
    };
    return (json.data ?? []).map((p) => ({
      title: p.title ?? "Untitled",
      authors: (p.authors ?? []).map((a) => a.name).join(", ") || "Unknown",
      year: p.year ?? null,
      abstract: (p.abstract ?? "").slice(0, 400),
      doi: p.externalIds?.DOI ?? null,
    }));
  } catch {
    return [];
  }
}
