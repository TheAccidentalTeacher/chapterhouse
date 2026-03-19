/**
 * SMTP email sender via NCHO mail server.
 * Sends from scott@nextchapterhomeschool.com using SSL (port 465).
 *
 * Required env vars (server-side only — never expose to client):
 *   NCHO_EMAIL_HOST      mail.nextchapterhomeschool.com
 *   NCHO_EMAIL_USER      scott@nextchapterhomeschool.com
 *   NCHO_EMAIL_PASSWORD  <mailbox password — never commit>
 *
 * Falls back gracefully if credentials are not set.
 */
import nodemailer from "nodemailer";

function getTransporter() {
  const host = process.env.NCHO_EMAIL_HOST;
  const user = process.env.NCHO_EMAIL_USER;
  const password = process.env.NCHO_EMAIL_PASSWORD;

  if (!host || !user || !password) return null;

  return nodemailer.createTransport({
    host,
    port: 465,
    secure: true, // SSL — matches SiteGround SMTP port 465
    auth: { user, pass: password },
    connectionTimeout: 8000,
    greetingTimeout: 5000,
  });
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  headers?: Record<string, string>;
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
  from,
  headers,
}: SendEmailOptions): Promise<{ success: boolean; error?: string }> {
  const transporter = getTransporter();

  if (!transporter) {
    console.warn("[smtp] NCHO_EMAIL credentials not set — skipping email");
    return { success: false, error: "credentials_not_set" };
  }

  const fromAddress =
    from ??
    `Chapterhouse <${process.env.NCHO_EMAIL_USER ?? "scott@nextchapterhomeschool.com"}>`;

  try {
    await transporter.sendMail({ from: fromAddress, to, subject, html, text, headers });
    const recipient = Array.isArray(to) ? to.join(", ") : to;
    console.log(`[smtp] Email sent → ${recipient}: ${subject}`);
    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[smtp] Failed to send email:`, message);
    return { success: false, error: message };
  }
}
