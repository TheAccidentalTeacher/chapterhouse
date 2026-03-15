import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const apiKey = process.env.FREESOUND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "FREESOUND_API_KEY not configured" },
      { status: 503 },
    );
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  if (!query || query.length < 2) {
    return NextResponse.json(
      { error: "Query parameter 'q' required (min 2 chars)" },
      { status: 400 },
    );
  }

  const license = searchParams.get("license") || "all"; // cc0, cc-by, all
  const durationMin = searchParams.get("duration_min");
  const durationMax = searchParams.get("duration_max");
  const page = searchParams.get("page") || "1";
  const pageSize = "20";

  // Build filter string
  const filters: string[] = [];
  if (license === "cc0") {
    filters.push('license:"Creative Commons 0"');
  } else if (license === "cc-by") {
    filters.push('license:"Attribution"');
  }
  if (durationMin) filters.push(`duration:[${durationMin} TO *]`);
  if (durationMax) filters.push(`duration:[* TO ${durationMax}]`);

  const filterStr = filters.length > 0 ? `&filter=${encodeURIComponent(filters.join(" "))}` : "";

  try {
    const url =
      `https://freesound.org/apiv2/search/text/` +
      `?query=${encodeURIComponent(query)}` +
      `&fields=id,name,description,duration,url,previews,tags,license` +
      `&page=${page}` +
      `&page_size=${pageSize}` +
      `&sort=rating_desc` +
      filterStr +
      `&token=${apiKey}`;

    const res = await fetch(url, {
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `Freesound API error: ${res.status}`, detail: text },
        { status: res.status },
      );
    }

    const data = await res.json();

    const results = (data.results || []).map(
      (item: {
        id: number;
        name: string;
        description: string;
        duration: number;
        url: string;
        previews: Record<string, string>;
        tags: string[];
        license: string;
      }) => ({
        id: item.id,
        name: item.name,
        description: (item.description || "").slice(0, 200),
        duration: Math.round(item.duration * 10) / 10,
        url: item.url,
        previewUrl:
          item.previews?.["preview-hq-mp3"] ||
          item.previews?.["preview-lq-mp3"] ||
          "",
        tags: (item.tags || []).slice(0, 8),
        license: item.license,
      }),
    );

    return NextResponse.json({
      results,
      count: data.count || 0,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: "Freesound search failed",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
