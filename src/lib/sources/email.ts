/**
 * IMAP email source for Chapterhouse brief generation.
 * Fetches emails received in the last 24 hours from the NCHO inbox.
 *
 * Required env vars (server-side only — never expose to client):
 *   NCHO_EMAIL_HOST      mail.nextchapterhomeschool.com
 *   NCHO_EMAIL_USER      scott@nextchapterhomeschool.com
 *   NCHO_EMAIL_PASSWORD  <mailbox password — never commit>
 *
 * Non-fatal — returns empty result if credentials are not set.
 * The IMAP connection is always closed in the finally block.
 */
import { ImapFlow } from "imapflow";

export type EmailMessage = {
  uid: number;
  subject: string;
  from: string;
  snippet: string;
  receivedAt: string;
};

export type EmailSourceResult = {
  messages: EmailMessage[];
  scannedCount: number;
};

export async function fetchInboxMessages(): Promise<EmailSourceResult> {
  const host = process.env.NCHO_EMAIL_HOST;
  const user = process.env.NCHO_EMAIL_USER;
  const password = process.env.NCHO_EMAIL_PASSWORD;

  if (!host || !user || !password) {
    return { messages: [], scannedCount: 0 };
  }

  const client = new ImapFlow({
    host,
    port: 993,
    secure: true, // IMAP SSL — port 993
    auth: { user, pass: password },
    logger: false, // suppress verbose imapflow wire logs
    socketTimeout: 10000,
    greetingTimeout: 5000,
  });

  try {
    await client.connect();

    const lock = await client.getMailboxLock("INBOX");
    try {
      // Messages received in the last 24 hours
      const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const searchResult = await client.search({ since });

      // search() returns false when the mailbox is empty or search fails
      if (!searchResult || searchResult.length === 0) {
        return { messages: [], scannedCount: 0 };
      }
      const seqNums = searchResult;

      // Fetch the most recent 20 (largest sequence numbers = most recent)
      const fetchSeqs = seqNums.slice(-20);
      const messages: EmailMessage[] = [];

      for await (const msg of client.fetch(fetchSeqs, {
        envelope: true,
        uid: true,
        source: true, // raw RFC822 message as Buffer — needed for body snippet
      })) {
        const envelope = msg.envelope;

        // Resolve display name or address from the first From header entry
        const fromEntry = envelope?.from?.[0];
        const from =
          fromEntry?.name ||
          fromEntry?.address ||
          "Unknown";

        const subject = envelope?.subject ?? "(no subject)";
        const receivedAt =
          envelope?.date?.toISOString() ?? new Date().toISOString();

        // Extract a plain-text snippet from the first 3KB of the raw message.
        // We slice the buffer before toString() to avoid loading huge emails.
        const raw =
          (msg.source as Buffer | undefined)
            ?.slice(0, 3000)
            .toString("utf8") ?? "";

        let snippet = "";
        const headerEnd = raw.indexOf("\r\n\r\n");
        if (headerEnd >= 0) {
          snippet = raw
            .slice(headerEnd + 4)
            .replace(/=\r?\n/g, "") // quoted-printable soft line breaks
            .replace(/<[^>]+>/g, " ") // strip HTML tags
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 400);
        }

        messages.push({ uid: msg.uid, subject, from, snippet, receivedAt });
      }

      return { messages, scannedCount: seqNums.length };
    } finally {
      lock.release();
    }
  } catch (err) {
    // Non-fatal — brief generates without inbox data if IMAP is down or slow
    console.error("[email-source] IMAP fetch failed:", err);
    return { messages: [], scannedCount: 0 };
  } finally {
    // Always close the connection — critical in serverless environments
    await client.logout().catch(() => {});
  }
}

export function formatEmailForPrompt(result: EmailSourceResult): string {
  if (result.messages.length === 0) return "";

  return result.messages
    .map(
      (m) =>
        `**From:** ${m.from} | **Subject:** ${m.subject} | **Received:** ${m.receivedAt}\n${m.snippet || "(preview unavailable)"}`
    )
    .join("\n\n");
}
