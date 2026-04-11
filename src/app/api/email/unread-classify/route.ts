/**
 * POST /api/email/unread-classify
 *
 * Reads UNSEEN emails directly from IMAP (no prior sync required),
 * runs Claude Haiku on each batch of 25 to classify importance,
 * returns a sorted list the UI uses for the unread-triage page.
 *
 * Classification values:
 *   important — needs Scott's attention (sales, customers, media, legal, etc.)
 *   routine   — automated notifications, newsletters, vendor updates
 *   skip      — spam or noise he doesn't need to think about
 *
 * Designed for ~500 unread emails. With 20 batches of 25 at ~1.5–2s each,
 * expect 35–45s total. maxDuration = 120s covers worst case.
 *
 * Returns: { total: number, emails: ClassifiedEmail[], byAccount: Record<string, number> }
 */

import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getImapClient, getConfiguredAccounts } from "@/lib/email-client";
import { requireEmailAuth } from "@/lib/email-auth";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

const UNREAD_CLASSIFY_SYSTEM_PROMPT = `You classify unread emails for Scott Somers. He runs:
- NCHO (Next Chapter Homeschool Outpost) — Shopify homeschool store
- SomersSchool — Homeschool SaaS course platform
- BibleSaaS — AI Bible study app (personal)
- Anna's books (Alana Terry Christian fiction brand)

Classify each email as one of three values:
  important — real people, real business: customers, sales inquiries, partners, media, legal, payment issues, anything that needs a human response
  routine   — automated or low-priority: newsletters, GitHub alerts, Vercel deploys, Stripe receipts, app notifications, vendor updates, order confirmations
  skip      — spam, phishing, cold outreach Scott clearly doesn't want, mass promotional email

Give a one-sentence "reason" that Scott can read at a glance to understand why you classified it this way.
Be direct. "Stripe webhook failure on CoursePlatform." beats "This appears to be a notification."

Return ONLY a JSON array — no other text, no markdown, no explanation:
[
  {
    "uid": 12345,
    "classification": "important",
    "reason": "Customer asking about Alaska allotment eligibility for SomersSchool."
  }
]

Rules:
- Match the uid values exactly from the input — don't change them.
- Every input email must have exactly one output entry.
- "classification" must be exactly one of: important, routine, skip
- If subject is empty, use from_address to infer.`;

export interface ClassifiedEmail {
  uid: number;
  account: string;
  subject: string;
  from: string;
  fromAddress: string;
  date: string;
  classification: "important" | "routine" | "skip";
  reason: string;
}

interface RawEmail {
  uid: number;
  account: string;
  subject: string;
  from: string;
  fromAddress: string;
  date: string;
}

interface HaikuClassifyResult {
  uid: number;
  classification: string;
  reason: string;
}

const VALID_CLASSIFICATIONS = new Set(["important", "routine", "skip"]);
const BATCH_SIZE = 25;
// Process at most this many unread emails per run (most recent by UID).
// Keeps IMAP + Haiku within the Vercel timeout. Run again to process older batches.
const MAX_EMAILS_PER_RUN = 75;

async function classifyBatch(
  anthropic: Anthropic,
  batch: RawEmail[]
): Promise<HaikuClassifyResult[]> {
  const emailsText = batch
    .map(
      (e) =>
        `uid: ${e.uid}\nfrom: ${e.from} <${e.fromAddress}>\nsubject: ${e.subject || "(no subject)"}\ndate: ${e.date}`
    )
    .join("\n\n---\n\n");

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 2048,
    system: UNREAD_CLASSIFY_SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Classify these ${batch.length} unread emails:\n\n${emailsText}`,
      },
    ],
  });

  const raw =
    response.content[0].type === "text" ? response.content[0].text.trim() : "";

  // Strip markdown code fences if present
  const stripped = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");

  let parsed: HaikuClassifyResult[];
  try {
    parsed = JSON.parse(stripped);
  } catch {
    console.error("[unread-classify] Haiku returned non-JSON:", raw.slice(0, 200));
    // Fallback: mark all as routine so the batch doesn't break the whole run
    return batch.map((e) => ({
      uid: e.uid,
      classification: "routine",
      reason: "Classification failed — defaulted to routine.",
    }));
  }

  if (!Array.isArray(parsed)) {
    return batch.map((e) => ({
      uid: e.uid,
      classification: "routine",
      reason: "Classification failed — defaulted to routine.",
    }));
  }

  return parsed;
}

export async function POST(req: Request): Promise<NextResponse> {
  const emailAuth = await requireEmailAuth(req);
  if (!emailAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const accounts = getConfiguredAccounts();
  if (accounts.length === 0) {
    return NextResponse.json(
      { error: "No email accounts configured" },
      { status: 503 }
    );
  }

  const rawEmails: RawEmail[] = [];
  const byAccount: Record<string, number> = {};

  // ── Step 1: Fetch UNSEEN envelopes from all IMAP accounts ───────────────────
  for (const account of accounts) {
    const client = getImapClient(account, { socketTimeout: 20000 });
    if (!client) continue;

    try {
      await client.connect();
      await client.mailboxOpen("INBOX");

      // Search for all UNSEEN messages, return UIDs
      const unseenUids = await client.search({ seen: false }, { uid: true });

      if (!unseenUids || unseenUids.length === 0) {
        byAccount[account] = 0;
        continue;
      }

      // Cap to most recent N UIDs (highest UIDs = most recent in standard IMAP)
      const uidsToFetch = unseenUids.length > MAX_EMAILS_PER_RUN
        ? unseenUids.slice(-MAX_EMAILS_PER_RUN)
        : unseenUids;

      // Fetch envelopes only (no body — fast)
      for await (const msg of client.fetch(
        uidsToFetch.join(","),
        { envelope: true, uid: true },
        { uid: true }
      )) {
        const env = msg.envelope;
        const fromPerson = env?.from?.[0];
        rawEmails.push({
          uid: msg.uid,
          account,
          subject: env?.subject ?? "",
          from: fromPerson?.name ?? fromPerson?.address ?? "",
          fromAddress: fromPerson?.address ?? "",
          date: env?.date ? env.date.toISOString() : new Date().toISOString(),
        });
      }

      // Store total unseen count (may be > what we fetched)
      byAccount[account] = unseenUids.length;
    } catch (err) {
      console.error(`[unread-classify] IMAP error on ${account}:`, err);
      byAccount[account] = 0;
    } finally {
      try {
        await client.logout();
      } catch {
        // ignore logout errors
      }
    }
  }

  if (rawEmails.length === 0) {
    return NextResponse.json({
      total: 0,
      emails: [],
      byAccount,
    });
  }

  // Sort newest first for display
  rawEmails.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // ── Step 2: Classify — build batches, run all in parallel ────────────────
  const anthropic = getAnthropic();
  const classificationMap = new Map<number, HaikuClassifyResult>();

  // Build batch array first
  const batches: RawEmail[][] = [];
  for (let i = 0; i < rawEmails.length; i += BATCH_SIZE) {
    batches.push(rawEmails.slice(i, i + BATCH_SIZE));
  }

  // Run all batches in parallel — 3 concurrent Haiku calls × ~2s = ~6s total vs ~50s sequential
  const batchResults = await Promise.allSettled(
    batches.map((batch) => classifyBatch(anthropic, batch))
  );

  batchResults.forEach((result, idx) => {
    if (result.status === "fulfilled") {
      for (const r of result.value) {
        if (VALID_CLASSIFICATIONS.has(r.classification)) {
          classificationMap.set(r.uid, r);
        } else {
          classificationMap.set(r.uid, {
            uid: r.uid,
            classification: "routine",
            reason: r.reason ?? "Unknown classification — defaulted to routine.",
          });
        }
      }
    } else {
      console.error(`[unread-classify] Batch ${idx + 1} failed:`, result.reason);
      for (const e of batches[idx]) {
        classificationMap.set(e.uid, {
          uid: e.uid,
          classification: "routine",
          reason: "Batch classification error — defaulted to routine.",
        });
      }
    }
  });

  // ── Step 3: Merge classifications back onto raw emails ─────────────────────
  const classified: ClassifiedEmail[] = rawEmails.map((e) => {
    const result = classificationMap.get(e.uid);
    return {
      uid: e.uid,
      account: e.account,
      subject: e.subject,
      from: e.from,
      fromAddress: e.fromAddress,
      date: e.date,
      classification: (result?.classification ?? "routine") as
        | "important"
        | "routine"
        | "skip",
      reason: result?.reason ?? "",
    };
  });

  const total_unseen = Object.values(byAccount).reduce((a, b) => a + b, 0);

  return NextResponse.json({
    total: classified.length,
    total_unseen,
    emails: classified,
    byAccount,
  });
}
