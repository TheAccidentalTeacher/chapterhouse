/**
 * IMAP email client utilities for the Chapterhouse inbox.
 * Supports multiple accounts: NCHO (Mailcow), Gmail personal, Gmail NCHO.
 *
 * Server-side only — never import into client components.
 * Uses imapflow for IMAP and mailparser for RFC822/MIME body parsing.
 *
 * Required env vars per account:
 *   NCHO:           NCHO_EMAIL_HOST, NCHO_EMAIL_USER, NCHO_EMAIL_PASSWORD
 *   Gmail personal: GMAIL_PERSONAL_USER, GMAIL_PERSONAL_APP_PASSWORD
 *   Gmail NCHO:     GMAIL_NCHO_USER, GMAIL_NCHO_APP_PASSWORD
 *
 * Gmail uses imap.gmail.com:993 with App Passwords (2FA required).
 * App Passwords are revocable per-app — revoking one never affects normal
 * Gmail login on Scott's phone or other browsers.
 */
import { ImapFlow } from "imapflow";
import { simpleParser } from "mailparser";

// ── Types ─────────────────────────────────────────────────────────────────────

export type MessageListItem = {
  uid: number;
  subject: string;
  from: string;        // display name or email
  fromAddress: string; // raw email address
  to: string;          // first To display
  date: string;        // ISO 8601
  isRead: boolean;
  hasAttachment: boolean;
  // Optional: populated when fetched from Supabase (persisted + categorized)
  category?: string;
  ai_summary?: string;
  action_required?: boolean;
  urgency?: number;
  email_account?: string; // 'ncho' | 'gmail_personal' | 'gmail_ncho'
};

export type FullMessage = MessageListItem & {
  toAddress: string;   // raw To email for reply
  text: string | null;
  html: string | null;
  messageId?: string;
  inReplyTo?: string;
  references?: string[];
};

export type InboxResult = {
  messages: MessageListItem[];
  total: number;
  page: number;
  limit: number;
};

// ── Account type & client factory ─────────────────────────────────────────────

export type EmailAccount = 'ncho' | 'gmail_personal' | 'gmail_ncho';

export function getImapClient(
  account: EmailAccount = 'ncho',
  opts?: { socketTimeout?: number }
): ImapFlow | null {
  let host: string | undefined;
  let user: string | undefined;
  let password: string | undefined;

  if (account === 'ncho') {
    host = process.env.NCHO_EMAIL_HOST;
    user = process.env.NCHO_EMAIL_USER;
    password = process.env.NCHO_EMAIL_PASSWORD;
  } else if (account === 'gmail_personal') {
    host = 'imap.gmail.com';
    user = process.env.GMAIL_PERSONAL_USER;
    password = process.env.GMAIL_PERSONAL_APP_PASSWORD;
  } else {
    // gmail_ncho
    host = 'imap.gmail.com';
    user = process.env.GMAIL_NCHO_USER;
    password = process.env.GMAIL_NCHO_APP_PASSWORD;
  }

  if (!host || !user || !password) return null;

  // TLS: Gmail (imap.gmail.com) has a valid Google certificate — always verify.
  // NCHO uses a self-hosted Mailcow server that may carry a self-signed cert.
  // Set NCHO_TLS_SKIP_VERIFY=true in Vercel env to opt out of strict TLS for
  // NCHO only. Gmail verification is never skipped regardless of env vars.
  // For NCHO: rejectUnauthorized=false suppresses CA chain errors, but Node.js
  // still runs checkServerIdentity for hostname verification separately.
  // The Mailcow cert covers nextchapterhomeschool.com but not the
  // mail.nextchapterhomeschool.com subdomain — so we must override both.
  const skipTls = account === "ncho" && process.env.NCHO_TLS_SKIP_VERIFY === "true";

  return new ImapFlow({
    host,
    port: 993,
    secure: true,
    auth: { user, pass: password },
    logger: false,
    tls: skipTls
      ? { rejectUnauthorized: false, checkServerIdentity: () => undefined }
      : { rejectUnauthorized: true },
    socketTimeout: opts?.socketTimeout ?? 8000,  // keep under Vercel's 10s limit
    greetingTimeout: 8000,
  });
}

/** Returns all accounts that have credentials set in env vars. */
export function getConfiguredAccounts(): EmailAccount[] {
  const accounts: EmailAccount[] = [];
  if (process.env.NCHO_EMAIL_HOST && process.env.NCHO_EMAIL_USER && process.env.NCHO_EMAIL_PASSWORD) {
    accounts.push('ncho');
  }
  if (process.env.GMAIL_PERSONAL_USER && process.env.GMAIL_PERSONAL_APP_PASSWORD) {
    accounts.push('gmail_personal');
  }
  if (process.env.GMAIL_NCHO_USER && process.env.GMAIL_NCHO_APP_PASSWORD) {
    accounts.push('gmail_ncho');
  }
  return accounts;
}

// ── List messages (envelope only — fast) ─────────────────────────────────────

export async function listMessages(
  page = 1,
  limit = 30
): Promise<InboxResult> {
  const client = getImapClient();
  if (!client) return { messages: [], total: 0, page, limit };

  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");

    try {
      // Get all UIDs (returns false on empty mailbox)
      const searchResult = await client.search({ all: true }, { uid: true });
      if (!searchResult || searchResult.length === 0) {
        return { messages: [], total: 0, page, limit };
      }

      // Sort descending — highest UID = most recent
      const allUids = [...searchResult].sort((a, b) => b - a);
      const total = allUids.length;
      const pageUids = allUids.slice((page - 1) * limit, page * limit);
      if (pageUids.length === 0) return { messages: [], total, page, limit };

      const messages: MessageListItem[] = [];

      for await (const msg of client.fetch(
        pageUids,
        { envelope: true, uid: true, flags: true, bodyStructure: true },
        { uid: true }
      )) {
        const env = msg.envelope;
        const fromEntry = env?.from?.[0];
        const toEntry = env?.to?.[0];

        messages.push({
          uid: msg.uid,
          subject: env?.subject ?? "(no subject)",
          from: fromEntry?.name || fromEntry?.address || "Unknown",
          fromAddress: fromEntry?.address || "",
          to: toEntry?.name || toEntry?.address || "",
          date: env?.date?.toISOString() ?? new Date().toISOString(),
          isRead: msg.flags?.has("\\Seen") ?? false,
          hasAttachment: hasAttachmentInStructure(msg.bodyStructure),
        });
      }

      // Re-sort newest first (fetch order may vary)
      messages.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );

      return { messages, total, page, limit };
    } finally {
      lock.release();
    }
  } catch (err) {
    console.error("[email-client] listMessages error:", err);
    return { messages: [], total: 0, page, limit };
  } finally {
    await client.logout().catch(() => {});
  }
}

// ── Full message (with body) ──────────────────────────────────────────────────

export async function getMessage(uid: number): Promise<FullMessage | null> {
  const client = getImapClient();
  if (!client) return null;

  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");

    try {
      // Fetch raw RFC822 source for mailparser
      const msg = await client.fetchOne(
        String(uid),
        { uid: true, source: true },
        { uid: true }
      );
      if (!msg || !msg.source) return null;

      // Mark as read
      await client.messageFlagsAdd([uid], ["\\Seen"], { uid: true });

      // Parse with mailparser
      const parsed = await simpleParser(msg.source as Buffer);

      const fromEntry = parsed.from?.value?.[0];
      const toField = parsed.to;
      const toObj = Array.isArray(toField) ? toField[0] : toField;
      const toEntry = toObj?.value?.[0];

      return {
        uid: msg.uid,
        subject: parsed.subject ?? "(no subject)",
        from: fromEntry?.name || fromEntry?.address || "Unknown",
        fromAddress: fromEntry?.address || "",
        to: toEntry?.name || toEntry?.address || "",
        toAddress: toEntry?.address || "",
        date: parsed.date?.toISOString() ?? new Date().toISOString(),
        isRead: true,
        hasAttachment: (parsed.attachments?.length ?? 0) > 0,
        text: parsed.text ?? null,
        html: parsed.html || null,
        messageId: parsed.messageId ?? undefined,
        inReplyTo: parsed.inReplyTo ?? undefined,
        references: Array.isArray(parsed.references)
          ? parsed.references
          : typeof parsed.references === "string"
          ? [parsed.references]
          : undefined,
      };
    } finally {
      lock.release();
    }
  } catch (err) {
    console.error("[email-client] getMessage error:", err);
    return null;
  } finally {
    await client.logout().catch(() => {});
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function hasAttachmentInStructure(structure: any): boolean {
  if (!structure) return false;
  if (
    structure.disposition === "attachment" ||
    (structure.type !== "text" && structure.type !== "multipart")
  ) {
    return false; // don't flag inline parts as attachments
  }
  if (structure.childNodes) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return structure.childNodes.some((child: any) =>
      hasAttachmentInStructure(child)
    );
  }
  return false;
}
