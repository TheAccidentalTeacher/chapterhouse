import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const ALERT_EMAIL = process.env.ALERT_EMAIL_TO ?? "scott@nextchapterhomeschool.com";

export async function notifyJobComplete(
  jobId: string,
  label: string,
  status: "completed" | "failed",
  error?: string
) {
  if (!resend) {
    console.warn("[notify] RESEND_API_KEY not set — skipping email");
    return;
  }

  const isSuccess = status === "completed";
  const subject = isSuccess
    ? `✓ Job complete: ${label}`
    : `✗ Job failed: ${label}`;

  const body = isSuccess
    ? `<h2>Job Complete</h2><p><strong>${label}</strong> finished successfully.</p><p>Job ID: <code>${jobId}</code></p><p>View the output in <a href="https://chapterhouse.vercel.app/jobs">Chapterhouse Jobs</a>.</p>`
    : `<h2>Job Failed</h2><p><strong>${label}</strong> failed.</p><p>Error: <code>${error ?? "Unknown"}</code></p><p>Job ID: <code>${jobId}</code></p><p>Check details in <a href="https://chapterhouse.vercel.app/jobs">Chapterhouse Jobs</a>.</p>`;

  try {
    await resend.emails.send({
      from: "Chapterhouse <noreply@buttercup.cfd>",
      to: ALERT_EMAIL,
      subject,
      html: body,
    });
    console.log(`[notify] Email sent for job ${jobId} — ${status}`);
  } catch (err) {
    console.error(`[notify] Failed to send email for job ${jobId}:`, err);
  }
}
