import { NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { sendEmail } from "@/lib/smtp";

export const dynamic = "force-dynamic";

const sendSchema = z.object({
  to: z.string().email(),
  subject: z.string().min(1).max(500),
  text: z.string().optional(),
  html: z.string().optional(),
  // Reply threading headers
  inReplyTo: z.string().optional(),
  references: z.array(z.string()).optional(),
});

export async function POST(req: Request) {
  const supabase = await getSupabaseServerClient();
  const { data: { user } } = await supabase!.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const parsed = sendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { to, subject, text, html, inReplyTo, references } = parsed.data;

  // Build reply threading headers
  const headers: Record<string, string> = {};
  if (inReplyTo) headers["In-Reply-To"] = inReplyTo;
  if (references && references.length > 0) {
    headers["References"] = [...(inReplyTo ? [inReplyTo] : []), ...references].join(" ");
  }

  const result = await sendEmail({
    to,
    subject,
    html: html ?? `<pre style="font-family:sans-serif;white-space:pre-wrap">${text ?? ""}</pre>`,
    text: text ?? "",
    headers: Object.keys(headers).length > 0 ? headers : undefined,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error ?? "Send failed" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
