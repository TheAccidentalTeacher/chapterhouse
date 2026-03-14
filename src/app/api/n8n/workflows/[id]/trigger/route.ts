import { NextResponse } from "next/server";

const N8N_BASE = process.env.N8N_BASE_URL;
const N8N_KEY = process.env.N8N_API_KEY;

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!N8N_BASE || !N8N_KEY) {
    return NextResponse.json({ error: "n8n not configured" }, { status: 503 });
  }

  try {
    const res = await fetch(`${N8N_BASE}/api/v1/workflows/${id}/run`, {
      method: "POST",
      headers: { "X-N8N-API-KEY": N8N_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `n8n returned ${res.status}`, detail: text },
        { status: res.status }
      );
    }

    return NextResponse.json({ triggered: true, workflowId: id });
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to reach n8n", detail: String(err) },
      { status: 502 }
    );
  }
}
