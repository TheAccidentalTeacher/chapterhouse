import { z } from "zod";
import { handleRouteError } from "@/lib/route-helpers";

const costQuerySchema = z.object({
  period: z.enum(["today", "week", "month"]).default("today"),
});

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const { period } = costQuerySchema.parse({
      period: searchParams.get("period") || "today",
    });

    // Langfuse REST API for trace listing
    const secretKey = process.env.LANGFUSE_SECRET_KEY;
    const publicKey = process.env.LANGFUSE_PUBLIC_KEY;
    const baseUrl =
      process.env.LANGFUSE_HOST || "https://us.cloud.langfuse.com";

    if (!secretKey || !publicKey) {
      return Response.json(
        {
          total_cost_usd: 0,
          by_model: {},
          by_route: {},
          traces: [],
          error: "Langfuse not configured",
        },
        { status: 200 }
      );
    }

    // Calculate date range
    const now = new Date();
    const fromDate = new Date();
    if (period === "today") {
      fromDate.setHours(0, 0, 0, 0);
    } else if (period === "week") {
      fromDate.setDate(now.getDate() - 7);
    } else {
      fromDate.setDate(now.getDate() - 30);
    }

    // Fetch generations from Langfuse REST API
    const auth = Buffer.from(`${publicKey}:${secretKey}`).toString("base64");
    const apiUrl = `${baseUrl}/api/public/generations?fromTimestamp=${fromDate.toISOString()}&limit=500`;

    const response = await fetch(apiUrl, {
      headers: { Authorization: `Basic ${auth}` },
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`[Costs] Langfuse API error: ${response.status}`, errText);
      return Response.json(
        {
          total_cost_usd: 0,
          by_model: {},
          by_route: {},
          traces: [],
          error: `Langfuse API returned ${response.status}`,
        },
        { status: 200 }
      );
    }

    const data = await response.json();
    const generations = data.data || [];

    // Aggregate
    let totalCost = 0;
    const byModel: Record<string, number> = {};
    const byRoute: Record<string, number> = {};
    const traces: Array<{
      trace_id: string;
      name: string;
      model: string;
      input_tokens: number;
      output_tokens: number;
      cost_usd: number;
      timestamp: string;
    }> = [];

    for (const gen of generations) {
      const cost = gen.calculatedTotalCost ?? gen.totalCost ?? 0;
      const model = gen.model || "unknown";
      const route =
        gen.metadata?.route || gen.name || "unknown";
      const inputTokens = gen.usage?.input ?? gen.promptTokens ?? 0;
      const outputTokens = gen.usage?.output ?? gen.completionTokens ?? 0;

      totalCost += cost;
      byModel[model] = (byModel[model] || 0) + cost;
      byRoute[route] = (byRoute[route] || 0) + cost;

      traces.push({
        trace_id: gen.traceId || gen.id,
        name: gen.name || "",
        model,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        cost_usd: cost,
        timestamp: gen.startTime || gen.createdAt || "",
      });
    }

    return Response.json({
      total_cost_usd: Math.round(totalCost * 10000) / 10000,
      by_model: Object.fromEntries(
        Object.entries(byModel).map(([k, v]) => [
          k,
          Math.round(v * 10000) / 10000,
        ])
      ),
      by_route: Object.fromEntries(
        Object.entries(byRoute).map(([k, v]) => [
          k,
          Math.round(v * 10000) / 10000,
        ])
      ),
      traces: traces.slice(0, 100), // Cap at 100 for response size
      period,
      generation_count: generations.length,
    });
  } catch (error) {
    return handleRouteError(error);
  }
}
