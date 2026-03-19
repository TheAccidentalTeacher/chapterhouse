import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getMessage } from "@/lib/email-client";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ uid: string }> }
) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase!.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { uid: uidParam } = await params;
  const uid = parseInt(uidParam, 10);
  if (isNaN(uid) || uid <= 0) {
    return NextResponse.json({ error: "Invalid UID" }, { status: 400 });
  }

  const message = await getMessage(uid);
  if (!message) {
    return NextResponse.json({ error: "Message not found" }, { status: 404 });
  }

  return NextResponse.json(message);
}
