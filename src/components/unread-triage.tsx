"use client";

import { useState, useMemo } from "react";
import { CheckCheck, MailOpen, Loader2, AlertCircle, RefreshCw, BookOpen } from "lucide-react";
import type { ClassifiedEmail } from "@/app/api/email/unread-classify/route";

// ── Types ────────────────────────────────────────────────────────────────────

type Classification = "important" | "routine" | "skip";

interface TriageState {
  status: "idle" | "loading" | "ready" | "marking" | "done";
  emails: ClassifiedEmail[];
  byAccount: Record<string, number>;
  total: number;
  total_unseen: number;
  error: string | null;
  markedCount: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

const ACCOUNT_COLORS: Record<string, string> = {
  ncho: "bg-emerald-900/40 text-emerald-300 border-emerald-700",
  gmail_personal: "bg-blue-900/40 text-blue-300 border-blue-700",
  gmail_ncho: "bg-sky-900/40 text-sky-300 border-sky-700",
};

const SECTION_CONFIG: Record<
  Classification,
  { label: string; emoji: string; defaultChecked: boolean; border: string; bg: string; dot: string }
> = {
  important: {
    label: "Important",
    emoji: "🔴",
    defaultChecked: false, // keep unread by default — don't mark as read
    border: "border-red-700/40",
    bg: "bg-red-900/10",
    dot: "bg-red-500",
  },
  routine: {
    label: "Routine",
    emoji: "🟡",
    defaultChecked: true, // mark as read by default
    border: "border-amber-700/40",
    bg: "bg-amber-900/10",
    dot: "bg-amber-500",
  },
  skip: {
    label: "Skip",
    emoji: "⚫",
    defaultChecked: true, // mark as read by default
    border: "border-zinc-700/40",
    bg: "bg-zinc-900/10",
    dot: "bg-zinc-600",
  },
};

function accountBadge(account: string) {
  const cls =
    ACCOUNT_COLORS[account] ?? "bg-zinc-800 text-zinc-400 border-zinc-600";
  const label = account.replace(/_/g, " ");
  return (
    <span
      className={`inline-block text-[10px] px-1.5 py-0.5 rounded border font-mono ${cls}`}
    >
      {label}
    </span>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  if (isToday) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

// ── Row component ────────────────────────────────────────────────────────────

function EmailRow({
  email,
  checked,
  onChange,
  onExtract,
  extracting,
  extracted,
}: {
  email: ClassifiedEmail;
  checked: boolean;
  onChange: (uid: number, account: string, checked: boolean) => void;
  onExtract?: (email: ClassifiedEmail) => void;
  extracting?: boolean;
  extracted?: boolean;
}) {
  const id = `triage-${email.account}-${email.uid}`;
  return (
    <label
      htmlFor={id}
      className={`flex items-start gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
        checked
          ? "bg-zinc-700/30 hover:bg-zinc-700/40"
          : "bg-zinc-800/40 hover:bg-zinc-800/60"
      }`}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(email.uid, email.account, e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-zinc-600 bg-zinc-800 text-amber-500 accent-amber-500 flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-zinc-100 font-medium truncate max-w-[220px]">
            {email.from || email.fromAddress || "(unknown sender)"}
          </span>
          {accountBadge(email.account)}
          <span className="text-xs text-zinc-500 ml-auto flex-shrink-0">
            {formatDate(email.date)}
          </span>
        </div>
        <p className="text-sm text-zinc-300 truncate mt-0.5">
          {email.subject || "(no subject)"}
        </p>
        <p className="text-xs text-zinc-500 mt-0.5 line-clamp-1">{email.reason}</p>
      </div>
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); onExtract?.(email); }}
        disabled={extracting || extracted}
        className="flex-shrink-0 p-1.5 rounded text-zinc-500 hover:text-amber-400 disabled:opacity-40 transition-colors"
        title={extracted ? "Extracted" : "Extract to Knowledge"}
      >
        {extracting ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <BookOpen className={`h-3.5 w-3.5 ${extracted ? "text-emerald-400" : ""}`} />
        )}
      </button>
    </label>
  );
}

// ── Section component ────────────────────────────────────────────────────────

function TriageSection({
  classification,
  emails,
  checkedSet,
  onToggle,
  onSelectAll,
  onExtract,
  extractingSet,
  extractedSet,
}: {
  classification: Classification;
  emails: ClassifiedEmail[];
  checkedSet: Set<string>;
  onToggle: (uid: number, account: string, checked: boolean) => void;
  onSelectAll: (classification: Classification, checked: boolean) => void;
  onExtract?: (email: ClassifiedEmail) => void;
  extractingSet?: Set<string>;
  extractedSet?: Set<string>;
}) {
  const cfg = SECTION_CONFIG[classification];
  if (emails.length === 0) return null;

  const allChecked = emails.every((e) => checkedSet.has(`${e.account}:${e.uid}`));
  const noneChecked = emails.every((e) => !checkedSet.has(`${e.account}:${e.uid}`));
  const checkedCount = emails.filter((e) =>
    checkedSet.has(`${e.account}:${e.uid}`)
  ).length;

  return (
    <div className={`rounded-xl border ${cfg.border} ${cfg.bg} p-4`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-base">{cfg.emoji}</span>
          <h3 className="text-sm font-semibold text-zinc-100">
            {cfg.label}{" "}
            <span className="text-zinc-400 font-normal">({emails.length})</span>
          </h3>
        </div>
        <div className="flex gap-2">
          {!allChecked && (
            <button
              onClick={() => onSelectAll(classification, true)}
              className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              All
            </button>
          )}
          {!noneChecked && (
            <button
              onClick={() => onSelectAll(classification, false)}
              className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              None
            </button>
          )}
          {checkedCount > 0 && (
            <span className="text-xs text-amber-400">{checkedCount} to mark</span>
          )}
        </div>
      </div>
      <div className="space-y-1">
        {emails.map((e) => (
          <EmailRow
            key={`${e.account}-${e.uid}`}
            email={e}
            checked={checkedSet.has(`${e.account}:${e.uid}`)}
            onChange={onToggle}
            onExtract={onExtract}
            extracting={extractingSet?.has(`${e.account}:${e.uid}`)}
            extracted={extractedSet?.has(`${e.account}:${e.uid}`)}
          />
        ))}
      </div>
    </div>
  );
}

// ── Main component ───────────────────────────────────────────────────────────

export function UnreadTriage() {
  const [state, setState] = useState<TriageState>({
    status: "idle",
    emails: [],
    byAccount: {},
    total: 0,
    total_unseen: 0,
    error: null,
    markedCount: 0,
  });

  // checked = "will be marked as read"
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [extracting, setExtracting] = useState<Set<string>>(new Set());
  const [extracted, setExtracted] = useState<Set<string>>(new Set());

  const handleExtract = async (email: ClassifiedEmail) => {
    const key = `${email.account}:${email.uid}`;
    setExtracting((prev) => new Set([...prev, key]));
    try {
      await fetch("/api/email/extract-to-knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          uid: email.uid,
          account: email.account,
          subject: email.subject,
          from: email.from,
          fromAddress: email.fromAddress,
          date: email.date,
          reason: email.reason,
        }),
      });
      setExtracted((prev) => new Set([...prev, key]));
    } catch {
      // extract failed silently
    } finally {
      setExtracting((prev) => { const s = new Set(prev); s.delete(key); return s; });
    }
  };

  // ── Classify ───────────────────────────────────────────────────────────────

  async function runClassify() {
    setState((s) => ({ ...s, status: "loading", error: null }));
    try {
      const res = await fetch("/api/email/unread-classify", { method: "POST" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`);
      }
      const data = await res.json() as {
        total: number;
        total_unseen: number;
        emails: ClassifiedEmail[];
        byAccount: Record<string, number>;
      };

      // Pre-check based on default: routine + skip auto-checked (will be marked read)
      const initialChecked = new Set<string>();
      for (const e of data.emails) {
        const key = `${e.account}:${e.uid}`;
        if (SECTION_CONFIG[e.classification].defaultChecked) {
          initialChecked.add(key);
        }
      }
      setChecked(initialChecked);

      setState((s) => ({
        ...s,
        status: "ready",
        emails: data.emails,
        byAccount: data.byAccount,
        total: data.total,
        total_unseen: data.total_unseen ?? data.total,
      }));
    } catch (err) {
      setState((s) => ({
        ...s,
        status: "idle",
        error: (err as Error).message ?? "Classification failed.",
      }));
    }
  }

  // ── Toggle ─────────────────────────────────────────────────────────────────

  function handleToggle(uid: number, account: string, isChecked: boolean) {
    const key = `${account}:${uid}`;
    setChecked((prev) => {
      const next = new Set(prev);
      if (isChecked) next.add(key);
      else next.delete(key);
      return next;
    });
  }

  function handleSelectAll(classification: Classification, isChecked: boolean) {
    const targets = state.emails.filter(
      (e) => e.classification === classification
    );
    setChecked((prev) => {
      const next = new Set(prev);
      for (const e of targets) {
        const key = `${e.account}:${e.uid}`;
        if (isChecked) next.add(key);
        else next.delete(key);
      }
      return next;
    });
  }

  // ── Mark as read ───────────────────────────────────────────────────────────

  async function markAsRead() {
    if (checked.size === 0) return;
    setState((s) => ({ ...s, status: "marking", error: null }));

    const toMark = state.emails
      .filter((e) => checked.has(`${e.account}:${e.uid}`))
      .map((e) => ({ uid: e.uid, account: e.account }));

    try {
      const res = await fetch("/api/email/mark-read-bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emails: toMark }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: string }).error ?? `HTTP ${res.status}`);
      }
      const data = await res.json() as { marked: number; failed: number };
      setState((s) => ({
        ...s,
        status: "done",
        markedCount: data.marked,
        error: data.failed > 0 ? `${data.failed} emails failed to mark.` : null,
      }));
    } catch (err) {
      setState((s) => ({
        ...s,
        status: "ready",
        error: (err as Error).message ?? "Mark-read failed.",
      }));
    }
  }

  // ── Derived ────────────────────────────────────────────────────────────────

  const byClassification = useMemo(() => {
    const map: Record<Classification, ClassifiedEmail[]> = {
      important: [],
      routine: [],
      skip: [],
    };
    for (const e of state.emails) {
      map[e.classification].push(e);
    }
    return map;
  }, [state.emails]);

  const checkedCount = checked.size;

  // ── Render ─────────────────────────────────────────────────────────────────

  if (state.status === "idle") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-6">
        <div className="text-center space-y-2">
          <MailOpen className="h-12 w-12 text-zinc-600 mx-auto" />
          <h2 className="text-xl font-semibold text-zinc-100">Unread Email Triage</h2>
          <p className="text-zinc-400 text-sm max-w-md">
            Haiku will scan all your unread emails and sort them into three
            buckets: Important, Routine, and Skip. Check the ones you want
            marked as read, then apply in one shot.
          </p>
          {state.error && (
            <p className="text-red-400 text-sm flex items-center gap-1 justify-center">
              <AlertCircle className="h-4 w-4" />
              {state.error}
            </p>
          )}
        </div>
        <button
          onClick={runClassify}
          className="flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-900 rounded-lg font-semibold text-sm transition-colors"
        >
          <MailOpen className="h-4 w-4" />
          Classify Unread Emails
        </button>
      </div>
    );
  }

  if (state.status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <Loader2 className="h-10 w-10 text-amber-400 animate-spin" />
        <p className="text-zinc-300 text-sm">
          Classifying your most recent unread emails with Haiku…
        </p>
        <p className="text-zinc-500 text-xs">
          Takes ~20 s. Hang tight.
        </p>
      </div>
    );
  }

  if (state.status === "done") {
    const kept = state.total - state.markedCount;
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-6">
        <div className="text-center space-y-2">
          <CheckCheck className="h-12 w-12 text-emerald-400 mx-auto" />
          <h2 className="text-xl font-semibold text-zinc-100">Done</h2>
          <p className="text-zinc-300 text-sm">
            Marked <span className="text-amber-400 font-semibold">{state.markedCount}</span> emails as
            read.{" "}
            <span className="text-zinc-400">
              {kept} {kept === 1 ? "stays" : "stay"} unread.
            </span>
          </p>
          {state.error && (
            <p className="text-amber-400 text-xs">{state.error}</p>
          )}
        </div>
        <button
          onClick={() => {
            setState({
              status: "idle",
              emails: [],
              byAccount: {},
              total: 0,
              total_unseen: 0,
              error: null,
              markedCount: 0,
            });
            setChecked(new Set());
          }}
          className="flex items-center gap-2 px-5 py-2 bg-zinc-700 hover:bg-zinc-600 text-zinc-100 rounded-lg text-sm font-medium transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Run Again
        </button>

      </div>
    );
  }

  // ── Ready (and marking) ────────────────────────────────────────────────────

  const isMarking = state.status === "marking";

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center justify-between flex-wrap gap-3 bg-zinc-800/60 rounded-xl px-4 py-3 border border-zinc-700">
        <div className="flex items-center gap-4 text-sm flex-wrap">
          <span className="text-zinc-100 font-semibold">
            {state.total_unseen > state.total
              ? `${state.total} of ${state.total_unseen} most recent unread`
              : `${state.total} unread`}
          </span>
          {Object.entries(state.byAccount).map(([acct, n]) => (
            <span key={acct} className="flex items-center gap-1">
              {accountBadge(acct)}
              <span className="text-zinc-400">{n}</span>
            </span>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {checkedCount > 0 && (
            <span className="text-sm text-amber-400">
              {checkedCount} to mark as read
            </span>
          )}
          <button
            onClick={markAsRead}
            disabled={checkedCount === 0 || isMarking}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
              checkedCount === 0
                ? "bg-zinc-700 text-zinc-500 cursor-not-allowed"
                : "bg-amber-500 hover:bg-amber-400 text-zinc-900"
            }`}
          >
            {isMarking ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Marking…
              </>
            ) : (
              <>
                <CheckCheck className="h-4 w-4" />
                Mark {checkedCount} as Read
              </>
            )}
          </button>
        </div>
      </div>

      {state.error && (
        <p className="text-red-400 text-sm flex items-center gap-1">
          <AlertCircle className="h-4 w-4" />
          {state.error}
        </p>
      )}

      {/* Sections */}
      <TriageSection
        classification="important"
        emails={byClassification.important}
        checkedSet={checked}
        onToggle={handleToggle}
        onSelectAll={handleSelectAll}
        onExtract={handleExtract}
        extractingSet={extracting}
        extractedSet={extracted}
      />
      <TriageSection
        classification="routine"
        emails={byClassification.routine}
        checkedSet={checked}
        onToggle={handleToggle}
        onSelectAll={handleSelectAll}
        onExtract={handleExtract}
        extractingSet={extracting}
        extractedSet={extracted}
      />
      <TriageSection
        classification="skip"
        emails={byClassification.skip}
        checkedSet={checked}
        onToggle={handleToggle}
        onSelectAll={handleSelectAll}
        onExtract={handleExtract}
        extractingSet={extracting}
        extractedSet={extracted}
      />

      {/* Floating re-run button */}
      <div className="flex justify-end pt-2">
        <button
          onClick={() => {
            setState({
              status: "idle",
              emails: [],
              byAccount: {},
              total: 0,
              total_unseen: 0,
              error: null,
              markedCount: 0,
            });
            setChecked(new Set());
          }}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Start over
        </button>
      </div>
    </div>
  );
}
