import nodemailer from "nodemailer";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

function getSmtpTransporter() {
  const host = process.env.NCHO_EMAIL_HOST;
  const user = process.env.NCHO_EMAIL_USER;
  const password = process.env.NCHO_EMAIL_PASSWORD;
  if (!host || !user || !password) return null;
  return nodemailer.createTransport({
    host,
    port: 465,
    secure: true,
    auth: { user, pass: password },
    connectionTimeout: 8000,
    greetingTimeout: 5000,
  });
}

const ALERT_EMAIL = "scott@nextchapterhomeschool.com";

export async function notifyJobComplete(
  jobId: string,
  label: string,
  status: "completed" | "failed",
  error?: string
) {
  const isSuccess = status === "completed";
  const subject = isSuccess
    ? `✓ Job complete: ${label}`
    : `✗ Job failed: ${label}`;

  const body = isSuccess
    ? `<h2>Job Complete</h2><p><strong>${label}</strong> finished successfully.</p><p>Job ID: <code>${jobId}</code></p><p>View the output in <a href="https://chapterhouse.vercel.app/jobs">Chapterhouse Jobs</a>.</p>`
    : `<h2>Job Failed</h2><p><strong>${label}</strong> failed.</p><p>Error: <code>${error ?? "Unknown"}</code></p><p>Job ID: <code>${jobId}</code></p><p>Check details in <a href="https://chapterhouse.vercel.app/jobs">Chapterhouse Jobs</a>.</p>`;

  // Try SMTP first — sends from scott@nextchapterhomeschool.com
  const smtpTransporter = getSmtpTransporter();
  if (smtpTransporter) {
    try {
      await smtpTransporter.sendMail({
        from: `Chapterhouse <${process.env.NCHO_EMAIL_USER}>`,
        to: ALERT_EMAIL,
        subject,
        html: body,
      });
      console.log(`[notify] SMTP email sent for job ${jobId} — ${status}`);
      return;
    } catch (err) {
      console.error(`[notify] SMTP failed for job ${jobId}, falling back to Resend:`, err);
    }
  }

  // Fallback: Resend
  if (!resend) {
    console.warn("[notify] No email provider configured — skipping notification");
    return;
  }
  try {
    await resend.emails.send({
      from: "Chapterhouse <noreply@buttercup.cfd>",
      to: ALERT_EMAIL,
      subject,
      html: body,
    });
    console.log(`[notify] Resend email sent for job ${jobId} — ${status}`);
  } catch (err) {
    console.error(`[notify] All email providers failed for job ${jobId}:`, err);
  }
}

