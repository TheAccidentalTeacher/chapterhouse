/**
 * Email connectivity test endpoint — tests ALL configured accounts.
 * Auth-gated (session cookie or CRON_SECRET). Never exposes passwords.
 *
 * GET /api/email/test
 * Returns: {
 *   accounts: {
 *     [accountKey]: {
 *       configured: boolean,
 *       email: string,
 *       passwordHint: string,   // first+last char only — catches copy/paste issues
 *       imap: { ok, messageCount?, error? },
 *       smtp?: { ok, error? }   // NCHO only (outbound email via Mailcow SMTP)
 *     }
 *   },
 *   summary: { total, passing, failing }
 * }
 *
 * Use this from the browser: GET /api/email/test
 * Use from debug panel: the test button calls this endpoint.
 */
import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { getImapClient, getConfiguredAccounts } from "@/lib/email-client";
import nodemailer from "nodemailer";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

function passwordHint(pw: string): string {
  if (pw.length < 2) return "**";
  return `${pw[0]}${"*".repeat(Math.max(0, pw.length - 2))}${pw[pw.length - 1]}`;
}

export async function GET(req: Request) {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase!.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const configured = getConfiguredAccounts();

  // Account metadata: env var names for display/hint purposes
  const accountEnvMap: Record<string, { userEnv: string; passEnv: string; hostEnv?: string }> = {
    ncho:           { userEnv: "NCHO_EMAIL_USER",              passEnv: "NCHO_EMAIL_PASSWORD",        hostEnv: "NCHO_EMAIL_HOST" },
    gmail_personal: { userEnv: "GMAIL_PERSONAL_USER",          passEnv: "GMAIL_PERSONAL_APP_PASSWORD" },
    gmail_ncho:     { userEnv: "GMAIL_NCHO_USER",              passEnv: "GMAIL_NCHO_APP_PASSWORD" },
  };

  type AccountResult = {
    configured: boolean;
    email: string;
    passwordHint: string;
    host?: string;
    imap: { ok: boolean; messageCount?: number; error?: string };
    smtp?: { ok: boolean; error?: string };
  };

  const results: Record<string, AccountResult> = {};

  for (const account of configured) {
    const meta = accountEnvMap[account];
    const email = process.env[meta.userEnv] ?? "";
    const password = process.env[meta.passEnv] ?? "";
    const host = meta.hostEnv ? (process.env[meta.hostEnv] ?? "") : "imap.gmail.com";

    const accountResult: AccountResult = {
      configured: true,
      email,
      passwordHint: password ? passwordHint(password) : "(not set)",
      host,
      imap: { ok: false },
    };

    // ── IMAP connectivity test ───────────────────────────────────────────────
    const imapClient = getImapClient(account, { socketTimeout: 12000 });
    if (!imapClient) {
      accountResult.imap = { ok: false, error: "Missing credentials in env" };
    } else {
      try {
        await imapClient.connect();
        const lock = await imapClient.getMailboxLock("INBOX");
        try {
          const status = await imapClient.status("INBOX", { messages: true });
          accountResult.imap = { ok: true, messageCount: status.messages };
        } finally {
          lock.release();
        }
      } catch (err) {
        accountResult.imap = {
          ok: false,
          error: err instanceof Error ? err.message : String(err),
        };
      } finally {
        await imapClient.logout().catch(() => {});
      }
    }

    // ── SMTP test — NCHO only (outbound via Mailcow SMTP) ───────────────────
    if (account === "ncho") {
      const smtpHost = process.env.NCHO_EMAIL_HOST ?? null;
      const smtpUser = process.env.NCHO_EMAIL_USER ?? null;
      const smtpPass = process.env.NCHO_EMAIL_PASSWORD ?? null;

      if (!smtpHost || !smtpUser || !smtpPass) {
        accountResult.smtp = { ok: false, error: "Missing NCHO SMTP env vars" };
      } else {
        try {
          const transporter = nodemailer.createTransport({
            host: smtpHost,
            port: 465,
            secure: true,
            auth: { user: smtpUser, pass: smtpPass },
            // NCHO Mailcow may have a self-signed cert; respect the same env var
            tls: { rejectUnauthorized: process.env.NCHO_TLS_SKIP_VERIFY !== "true" },
            connectionTimeout: 8000,
            greetingTimeout: 5000,
          });
          await transporter.verify();
          accountResult.smtp = { ok: true };
        } catch (err) {
          accountResult.smtp = {
            ok: false,
            error: err instanceof Error ? err.message : String(err),
          };
        }
      }
    }

    results[account] = accountResult;
  }

  const accountValues = Object.values(results);
  const passing = accountValues.filter(
    (a) => a.imap.ok && (a.smtp === undefined || a.smtp.ok)
  ).length;

  return NextResponse.json({
    accounts: results,
    summary: {
      total: accountValues.length,
      passing,
      failing: accountValues.length - passing,
    },
  });
}

