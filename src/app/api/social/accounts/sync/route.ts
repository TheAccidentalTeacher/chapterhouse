export async function POST() {
  const bufferToken = process.env.BUFFER_ACCESS_TOKEN;
  if (!bufferToken) return Response.json({ error: "Buffer not configured" }, { status: 503 });

  const res = await fetch("https://api.bufferapp.com/1/profiles.json", {
    headers: { Authorization: `Bearer ${bufferToken}` },
  });

  if (!res.ok) {
    const detail = await res.text();
    return Response.json({ error: "Buffer API error", detail }, { status: 502 });
  }

  const profiles = await res.json() as Array<{
    id: string;
    service: string;
    service_username?: string;
    formatted_username?: string;
  }>;

  const simplified = profiles.map((p) => ({
    buffer_profile_id: p.id,
    platform: p.service,
    display_name: p.service_username ?? p.formatted_username ?? p.id,
  }));

  return Response.json({ profiles: simplified });
}
