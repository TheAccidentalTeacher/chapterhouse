/**
 * GET /api/email/accounts
 *
 * Returns the list of email accounts that are configured in the environment.
 * Used by the inbox to show per-account tabs.
 * Reads env vars server-side — never exposes keys, only email addresses.
 */

import { NextResponse } from "next/server";
import { getConfiguredAccounts } from "@/lib/email-client";

export const dynamic = "force-dynamic";

const ACCOUNT_META: Record<string, { label: string; emailEnv: string }> = {
  ncho:            { label: "NCHO",    emailEnv: "NCHO_EMAIL_USER" },
  gmail_personal:  { label: "Gmail",   emailEnv: "GMAIL_PERSONAL_USER" },
  gmail_ncho:      { label: "G·NCHO",  emailEnv: "GMAIL_NCHO_USER" },
};

export async function GET(): Promise<NextResponse> {
  const keys = getConfiguredAccounts();
  const accounts = keys.map((key) => ({
    key,
    label: ACCOUNT_META[key]?.label ?? key,
    email: process.env[ACCOUNT_META[key]?.emailEnv ?? ""] ?? "",
  }));
  return NextResponse.json({ accounts });
}
