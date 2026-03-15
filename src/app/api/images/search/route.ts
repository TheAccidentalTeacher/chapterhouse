// ── Stock Image Search — Pexels + Pixabay + Unsplash ────────────────────────

interface StockImage {
  id: string;
  source: "pexels" | "pixabay" | "unsplash";
  url: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  description: string;
  photographer: string;
  downloadUrl: string;
  license: string;
}

async function searchPexels(
  query: string,
  perPage: number,
): Promise<StockImage[]> {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return [];

  const res = await fetch(
    `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${perPage}`,
    { headers: { Authorization: key } },
  );
  if (!res.ok) return [];

  const data = await res.json();
  return (data.photos || []).map(
    (p: {
      id: number;
      src: { original: string; medium: string };
      width: number;
      height: number;
      alt: string;
      photographer: string;
    }) => ({
      id: `pexels-${p.id}`,
      source: "pexels" as const,
      url: p.src.original,
      thumbnailUrl: p.src.medium,
      width: p.width,
      height: p.height,
      description: p.alt || query,
      photographer: p.photographer,
      downloadUrl: p.src.original,
      license: "Pexels License (free)",
    }),
  );
}

async function searchPixabay(
  query: string,
  perPage: number,
): Promise<StockImage[]> {
  const key = process.env.PIXABAY_API_KEY;
  if (!key) return [];

  const res = await fetch(
    `https://pixabay.com/api/?key=${key}&q=${encodeURIComponent(query)}&per_page=${perPage}&image_type=photo`,
  );
  if (!res.ok) return [];

  const data = await res.json();
  return (data.hits || []).map(
    (h: {
      id: number;
      largeImageURL: string;
      previewURL: string;
      imageWidth: number;
      imageHeight: number;
      tags: string;
      user: string;
    }) => ({
      id: `pixabay-${h.id}`,
      source: "pixabay" as const,
      url: h.largeImageURL,
      thumbnailUrl: h.previewURL,
      width: h.imageWidth,
      height: h.imageHeight,
      description: h.tags,
      photographer: h.user,
      downloadUrl: h.largeImageURL,
      license: "Pixabay License (free)",
    }),
  );
}

async function searchUnsplash(
  query: string,
  perPage: number,
): Promise<StockImage[]> {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) return [];

  const res = await fetch(
    `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}`,
    { headers: { Authorization: `Client-ID ${key}` } },
  );
  if (!res.ok) return [];

  const data = await res.json();
  return (data.results || []).map(
    (r: {
      id: string;
      urls: { regular: string; thumb: string; full: string };
      width: number;
      height: number;
      description: string | null;
      alt_description: string | null;
      user: { name: string };
    }) => ({
      id: `unsplash-${r.id}`,
      source: "unsplash" as const,
      url: r.urls.regular,
      thumbnailUrl: r.urls.thumb,
      width: r.width,
      height: r.height,
      description: r.description || r.alt_description || query,
      photographer: r.user.name,
      downloadUrl: r.urls.full,
      license: "Unsplash License (free)",
    }),
  );
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");
    const perPage = Math.min(
      Math.max(parseInt(searchParams.get("perPage") || "10"), 1),
      30,
    );

    if (!query || query.length < 2) {
      return Response.json(
        { error: "Query must be at least 2 characters" },
        { status: 400 },
      );
    }

    const results = await Promise.allSettled([
      searchPexels(query, perPage),
      searchPixabay(query, perPage),
      searchUnsplash(query, perPage),
    ]);

    const images: StockImage[] = results.flatMap((r) =>
      r.status === "fulfilled" ? r.value : [],
    );

    return Response.json({
      query,
      total: images.length,
      images,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Search failed";
    console.error("[images/search]", message);
    return Response.json({ error: message }, { status: 500 });
  }
}
