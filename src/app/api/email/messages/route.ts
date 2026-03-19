import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { listMessages } from "@/lib/email-client";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase!.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "30", 10)));

  const result = await listMessages(page, limit);
  return NextResponse.json(result);
}
