/**
 * SMTP + IMAP connectivity test endpoint.
 * Verifies credentials are loaded and connection succeeds.
 * Auth-gated — Chapterhouse users only.
 *
 * GET /api/email/test
 * Returns: { smtp, imap, config } — never exposes the password.
 */
import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import nodemailer from "nodemailer";
import { ImapFlow } from "imapflow";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase!.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const host = process.env.NCHO_EMAIL_HOST || null;
  const emailUser = process.env.NCHO_EMAIL_USER || null;
  const password = process.env.NCHO_EMAIL_PASSWORD || null;

  const config = {
    host,
    user: emailUser,
    passwordSet: !!password,
    passwordLength: password?.length ?? 0,
    // Show first+last char to catch copy/paste issues without exposing the password
    passwordHint: password
      ? `${password[0]}${"*".repeat(Math.max(0, password.length - 2))}${password[password.length - 1]}`
      : null,
  };

  if (!host || !emailUser || !password) {
    return NextResponse.json({
      config,
      smtp: { ok: false, error: "Missing env vars" },
      imap: { ok: false, error: "Missing env vars" },
    });
  }

  // ── SMTP test ──────────────────────────────────────────────────────────────
  let smtpResult: { ok: boolean; error?: string } = { ok: false };
  try {
    const transporter = nodemailer.createTransport({
      host,
      port: 465,
      secure: true,
      auth: { user: emailUser, pass: password },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 8000,
      greetingTimeout: 5000,
    });
    await transporter.verify();
    smtpResult = { ok: true };
  } catch (err) {
    smtpResult = {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  // ── IMAP test ──────────────────────────────────────────────────────────────
  let imapResult: { ok: boolean; messageCount?: number; error?: string } = {
    ok: false,
  };
  const imapClient = new ImapFlow({
    host,
    port: 993,
    secure: true,
    auth: { user: emailUser, pass: password },
    logger: false,
    socketTimeout: 10000,
    greetingTimeout: 6000,
  });
  try {
    await imapClient.connect();
    const lock = await imapClient.getMailboxLock("INBOX");
    try {
      const status = await imapClient.status("INBOX", { messages: true });
      imapResult = { ok: true, messageCount: status.messages };
    } finally {
      lock.release();
    }
  } catch (err) {
    imapResult = {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    };
  } finally {
    await imapClient.logout().catch(() => {});
  }

  return NextResponse.json({ config, smtp: smtpResult, imap: imapResult });
}
