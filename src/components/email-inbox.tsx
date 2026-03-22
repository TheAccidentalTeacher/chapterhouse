"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AtSign,
  ChevronLeft,
  Loader2,
  Mail,
  Paperclip,
  PenLine,
  RefreshCw,
  Reply,
  Search,
  Send,
  X,
  Zap,
} from "lucide-react";
import type { FullMessage, MessageListItem } from "@/lib/email-client";

// ── Helpers ───────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatFullDate(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

// ── Compose form state ────────────────────────────────────────────────────────

type ComposeMode = "new" | "reply";
type ComposeState = {
  mode: ComposeMode;
  to: string;
  subject: string;
  body: string;
  inReplyTo?: string;
  references?: string[];
};

const EMPTY_COMPOSE: ComposeState = {
  mode: "new",
  to: "",
  subject: "",
  body: "",
};

// ── Category UI helpers ──────────────────────────────────────────────────────

const CATEGORY_COLORS: Record<string, string> = {
  spam: "bg-zinc-700/80 text-zinc-400",
  newsletter: "bg-slate-700/80 text-slate-300",
  notification: "bg-slate-700/80 text-slate-300",
  vendor: "bg-amber-900/60 text-amber-400",
  media: "bg-purple-900/60 text-purple-400",
  sales_inquiry: "bg-green-900/60 text-green-400",
  customer: "bg-green-800/60 text-green-300",
  order: "bg-emerald-900/60 text-emerald-400",
  internal: "bg-blue-900/60 text-blue-300",
  other: "bg-zinc-700/80 text-zinc-400",
};

type AccountInfo = { key: string; label: string; email: string };

const CATEGORY_TABS = [
  { key: "", label: "All" },
  { key: "customer", label: "Customer" },
  { key: "sales_inquiry", label: "Sales" },
  { key: "order", label: "Orders" },
  { key: "vendor", label: "Vendor" },
  { key: "newsletter", label: "Newsletter" },
  { key: "notification", label: "Notify" },
  { key: "internal", label: "Internal" },
  { key: "media", label: "Media" },
  { key: "spam", label: "Spam" },
  { key: "other", label: "Other" },
];

// ── Account badge ────────────────────────────────────────────────────────────

function AccountBadge({ account }: { account?: string }) {
  if (!account || account === "ncho") return null;
  if (account === "gmail_personal")
    return <span className="text-[9px] px-1 py-0.5 rounded bg-blue-900/60 text-blue-400 font-medium shrink-0">Gmail</span>;
  if (account === "gmail_ncho")
    return <span className="text-[9px] px-1 py-0.5 rounded bg-green-900/60 text-green-400 font-medium shrink-0">G·NCHO</span>;
  return null;
}

// ── Message list item ─────────────────────────────────────────────────────────

function MessageRow({
  msg,
  selected,
  onClick,
}: {
  msg: MessageListItem;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 border-b border-white/5 hover:bg-white/5 transition-colors ${
        selected ? "bg-amber-600/20 border-l-2 border-l-amber-500" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {msg.action_required ? (
            <span className="w-2 h-2 rounded-full bg-red-400 shrink-0 mt-1 animate-pulse" title="Action required" />
          ) : !msg.isRead ? (
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 mt-1" />
          ) : (
            <span className="w-2 h-2 shrink-0" />
          )}
          <span
            className={`text-sm truncate ${
              msg.isRead ? "text-gray-400 font-normal" : "text-white font-semibold"
            }`}
          >
            {msg.from}
          </span>
        </div>
        <span className="text-xs text-gray-500 shrink-0 mt-0.5">
          {relativeTime(msg.date)}
        </span>
      </div>
      <div className="pl-4 mt-0.5">
        <p
          className={`text-sm truncate ${
            msg.isRead ? "text-gray-500" : "text-gray-200"
          }`}
        >
          {msg.subject}
        </p>
        <div className="flex items-center gap-1.5 mt-1 flex-wrap">
          {msg.email_account && msg.email_account !== "ncho" && (
            <AccountBadge account={msg.email_account} />
          )}
          {msg.category && (
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wide ${
                CATEGORY_COLORS[msg.category] ?? "bg-zinc-700/80 text-zinc-400"
              }`}
            >
              {msg.category.replace("_", " ")}
            </span>
          )}
          {msg.hasAttachment && (
            <Paperclip className="w-3 h-3 text-gray-500" />
          )}
          {(msg.urgency ?? 0) >= 4 && (
            <span className="text-[10px] text-red-400 font-semibold tracking-wide">
              urgent
            </span>
          )}
        </div>
        {msg.ai_summary && (
          <p className="text-xs text-gray-600 truncate mt-0.5">{msg.ai_summary}</p>
        )}
      </div>
    </button>
  );
}

// ── Compose panel ─────────────────────────────────────────────────────────────

function ComposePanel({
  compose,
  onChange,
  onSend,
  onCancel,
  sending,
}: {
  compose: ComposeState;
  onChange: (c: ComposeState) => void;
  onSend: () => void;
  onCancel: () => void;
  sending: boolean;
}) {
  return (
    <div className="flex flex-col h-full bg-gray-950">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <h2 className="text-sm font-semibold text-white">
          {compose.mode === "reply" ? "Reply" : "New Message"}
        </h2>
        <button onClick={onCancel} className="text-gray-400 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Fields */}
      <div className="flex flex-col gap-0 border-b border-white/10">
        <div className="flex items-center gap-3 px-6 py-3 border-b border-white/5">
          <span className="text-xs text-gray-500 w-16 shrink-0">To</span>
          <input
            type="email"
            value={compose.to}
            onChange={(e) => onChange({ ...compose, to: e.target.value })}
            placeholder="recipient@example.com"
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none"
          />
        </div>
        <div className="flex items-center gap-3 px-6 py-3">
          <span className="text-xs text-gray-500 w-16 shrink-0">Subject</span>
          <input
            type="text"
            value={compose.subject}
            onChange={(e) => onChange({ ...compose, subject: e.target.value })}
            placeholder="Subject"
            className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 outline-none"
          />
        </div>
      </div>

      {/* Body */}
      <textarea
        value={compose.body}
        onChange={(e) => onChange({ ...compose, body: e.target.value })}
        placeholder="Write your message…"
        className="flex-1 px-6 py-4 bg-transparent text-sm text-gray-200 placeholder-gray-600 outline-none resize-none"
      />

      {/* Actions */}
      <div className="flex items-center gap-3 px-6 py-4 border-t border-white/10">
        <button
          onClick={onSend}
          disabled={sending || !compose.to || !compose.subject || !compose.body}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-900 text-sm rounded-lg transition-colors"
        >
          {sending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          Send
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-400 hover:text-white text-sm transition-colors"
        >
          Discard
        </button>
      </div>
    </div>
  );
}

// ── Message viewer ────────────────────────────────────────────────────────────

function MessageViewer({
  message,
  onReply,
}: {
  message: FullMessage;
  onReply: () => void;
}) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-white/10 shrink-0">
        <h1 className="text-lg font-semibold text-white mb-4">{message.subject}</h1>
        <div className="flex flex-col gap-1 text-sm">
          <div className="flex items-baseline gap-2">
            <span className="text-gray-500 w-12 shrink-0">From</span>
            <span className="text-gray-200">
              {message.from}
              {message.fromAddress && message.fromAddress !== message.from && (
                <span className="text-gray-500 ml-1">&lt;{message.fromAddress}&gt;</span>
              )}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-gray-500 w-12 shrink-0">To</span>
            <span className="text-gray-400">{message.to || message.toAddress}</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-gray-500 w-12 shrink-0">Date</span>
            <span className="text-gray-400">{formatFullDate(message.date)}</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {message.html ? (
          <iframe
            srcDoc={`<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:system-ui,sans-serif;font-size:14px;color:#d1d5db;background:#0a0a0f;padding:24px;margin:0;word-break:break-word;}a{color:#60a5fa;}img{max-width:100%;}</style></head><body>${message.html}</body></html>`}
            sandbox="allow-same-origin"
            className="w-full h-full min-h-96 border-0"
            title="Email content"
            style={{ minHeight: "400px" }}
          />
        ) : (
          <pre className="px-6 py-5 text-sm text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">
            {message.text ?? "(no content)"}
          </pre>
        )}
      </div>

      {/* Reply button */}
      <div className="px-6 py-4 border-t border-white/10 shrink-0">
        <button
          onClick={onReply}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 text-white text-sm rounded-lg transition-colors"
        >
          <Reply className="w-4 h-4" />
          Reply
        </button>
      </div>
    </div>
  );
}

// ── Main inbox component ──────────────────────────────────────────────────────

export function EmailInbox() {
  const [messages, setMessages] = useState<MessageListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedUid, setSelectedUid] = useState<number | null>(null);
  const [fullMessage, setFullMessage] = useState<FullMessage | null>(null);
  const [loadingMessage, setLoadingMessage] = useState(false);
  const [composing, setComposing] = useState(false);
  const [compose, setCompose] = useState<ComposeState>(EMPTY_COMPOSE);
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<"idle" | "success" | string>("idle");
  const [mobileView, setMobileView] = useState<"list" | "message">("list");
  const limit = 30;
  // Categorized / search view state
  const [view, setView] = useState<"live" | "categorized">("live");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [searchResults, setSearchResults] = useState<MessageListItem[]>([]);
  const [searchTotal, setSearchTotal] = useState(0);
  const [searchPage, setSearchPage] = useState(1);
  const [searching, setSearching] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ total: number; inserted: number; accounts: Record<string, { inserted: number; skipped: number; total: number }> } | null>(null);
  const [accounts, setAccounts] = useState<AccountInfo[]>([]);
  const [activeAccount, setActiveAccount] = useState("all");
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const fetchMessages = useCallback(async (p: number, showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetch(`/api/email/messages?page=${p}&limit=${limit}`);
      if (!res.ok) throw new Error("Failed to fetch messages");
      const data = await res.json();
      if (isMounted.current) {
        setMessages(data.messages ?? []);
        setTotal(data.total ?? 0);
        setPage(p);
      }
    } catch (err) {
      console.error("[inbox] fetchMessages:", err);
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchMessages(1);
  }, [fetchMessages]);

  // Load configured accounts for account tabs
  useEffect(() => {
    fetch("/api/email/accounts")
      .then((r) => r.json())
      .then((d) => { if (isMounted.current) setAccounts(d.accounts ?? []); })
      .catch(console.error);
  }, []);

  const fetchCategorized = useCallback(
    async (query: string, category: string, p: number, account = "all") => {
      setSearching(true);
      try {
        const params = new URLSearchParams({ page: String(p), limit: String(limit) });
        if (query.trim()) params.set("q", query.trim());
        if (category) params.set("category", category);
        if (account && account !== "all") params.set("account", account);
        const res = await fetch(`/api/email/search?${params}`);
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        if (isMounted.current) {
          const mapped: MessageListItem[] = (data.emails ?? []).map(
            (row: Record<string, unknown>) => ({
              uid: row.uid as number,
              subject: (row.subject as string) || "(no subject)",
              from: (row.from_name as string) || (row.from_address as string) || "",
              fromAddress: (row.from_address as string) || "",
              to: (row.to_address as string) || "",
              date: (row.received_at as string) || new Date().toISOString(),
              isRead: Boolean(row.is_read),
              hasAttachment: Boolean(row.has_attachment),
              category: row.category as string | undefined,
              ai_summary: row.ai_summary as string | undefined,
              action_required: Boolean(row.action_required),
              urgency: row.urgency as number | undefined,
              email_account: row.email_account as string | undefined,
            })
          );
          setSearchResults(mapped);
          setSearchTotal(data.total ?? 0);
          setSearchPage(p);
        }
      } catch (err) {
        console.error("[inbox] fetchCategorized:", err);
      } finally {
        if (isMounted.current) setSearching(false);
      }
    },
    [limit]
  );

  const handleSearchChange = useCallback(
    (query: string) => {
      setSearchQuery(query);
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      searchTimerRef.current = setTimeout(() => {
        fetchCategorized(query, activeCategory, 1, activeAccount);
      }, 400);
    },
    [activeCategory, activeAccount, fetchCategorized]
  );

  const handleCategoryChange = useCallback(
    (cat: string) => {
      setActiveCategory(cat);
      fetchCategorized(searchQuery, cat, 1, activeAccount);
    },
    [searchQuery, activeAccount, fetchCategorized]
  );

  const handleSyncCategorize = useCallback(async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const syncRes = await fetch("/api/email/sync", { method: "POST" });
      const syncData = syncRes.ok ? await syncRes.json() : null;
      await fetch("/api/email/categorize", { method: "POST" });
      // Always switch to AI view after sync so Gmail emails are visible
      setView("categorized");
      await fetchCategorized(searchQuery, activeCategory, 1, activeAccount);
      if (isMounted.current && syncData) {
        setSyncResult({ total: syncData.total ?? 0, inserted: syncData.inserted ?? 0, accounts: syncData.accounts ?? {} });
        setTimeout(() => { if (isMounted.current) setSyncResult(null); }, 7000);
      }
    } catch (err) {
      console.error("[inbox] handleSyncCategorize:", err);
    } finally {
      if (isMounted.current) setSyncing(false);
    }
  }, [searchQuery, activeCategory, activeAccount, fetchCategorized]);

  const handleAccountChange = useCallback((acct: string) => {
    setActiveAccount(acct);
    // Non-NCHO accounts have no Live IMAP view — switch to AI automatically
    if (acct !== "all" && acct !== "ncho") {
      setView("categorized");
    }
    fetchCategorized(searchQuery, activeCategory, 1, acct);
  }, [fetchCategorized, searchQuery, activeCategory]);

  // Load categorized view when switching to it
  useEffect(() => {
    if (view === "categorized") {
      fetchCategorized("", "", 1, activeAccount);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  const selectMessage = useCallback(async (uid: number) => {
    setSelectedUid(uid);
    setComposing(false);
    setFullMessage(null);
    setLoadingMessage(true);
    setMobileView("message");

    try {
      const res = await fetch(`/api/email/messages/${uid}`);
      if (!res.ok) throw new Error("Failed to fetch message");
      const data: FullMessage = await res.json();
      if (isMounted.current) {
        setFullMessage(data);
        // Mark as read locally
        setMessages((prev) =>
          prev.map((m) => (m.uid === uid ? { ...m, isRead: true } : m))
        );
      }
    } catch (err) {
      console.error("[inbox] selectMessage:", err);
    } finally {
      if (isMounted.current) setLoadingMessage(false);
    }
  }, []);

  const openCompose = useCallback(() => {
    setCompose(EMPTY_COMPOSE);
    setComposing(true);
    setFullMessage(null);
    setSelectedUid(null);
    setMobileView("message");
  }, []);

  const openReply = useCallback(() => {
    if (!fullMessage) return;
    const reSubject = fullMessage.subject.startsWith("Re:")
      ? fullMessage.subject
      : `Re: ${fullMessage.subject}`;
    setCompose({
      mode: "reply",
      to: fullMessage.fromAddress,
      subject: reSubject,
      body: "",
      inReplyTo: fullMessage.messageId,
      references: fullMessage.references,
    });
    setComposing(true);
  }, [fullMessage]);

  const handleSend = useCallback(async () => {
    if (!compose.to || !compose.subject || !compose.body) return;
    setSending(true);
    setSendStatus("idle");

    try {
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: compose.to,
          subject: compose.subject,
          text: compose.body,
          inReplyTo: compose.inReplyTo,
          references: compose.references,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? `Send failed (${res.status})`);
      }
      setSendStatus("success");
      setComposing(false);
      setCompose(EMPTY_COMPOSE);
      setMobileView("list");

      // Brief success toast then reset
      setTimeout(() => setSendStatus("idle"), 3000);
    } catch (err) {
      console.error("[inbox] handleSend:", err);
      const msg = err instanceof Error ? err.message : "Send failed";
      setSendStatus(msg);
      setTimeout(() => setSendStatus("idle"), 6000);
    } finally {
      setSending(false);
    }
  }, [compose]);

  const handleCancelCompose = useCallback(() => {
    setComposing(false);
    setMobileView("list");
  }, []);

  const totalPages = Math.ceil((view === "live" ? total : searchTotal) / limit);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col">
      {/* Send status toast */}
      {sendStatus !== "idle" && (
        <div
          className={`fixed top-4 right-4 z-50 max-w-sm px-4 py-2 rounded-lg text-sm font-medium shadow-lg transition-all ${
            sendStatus === "success"
              ? "bg-emerald-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {sendStatus === "success" ? "Message sent." : sendStatus}
        </div>
      )}

      <div className="flex h-full overflow-hidden rounded-lg border border-white/10">
        {/* ── Left: Message list ─────────────────────────────────────────── */}
        <div
          className={`flex flex-col border-r border-white/10 bg-gray-900 ${
            mobileView === "message" ? "hidden md:flex" : "flex"
          } w-full md:w-80 shrink-0`}
        >
          {/* Toolbar */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-gray-400" />
              {/* Live tab: only available for NCHO / All — Gmail has no direct IMAP view */}
              {(activeAccount === "all" || activeAccount === "ncho") && (
                <button
                  onClick={() => setView("live")}
                  className={`text-xs px-2 py-1 rounded transition-colors ${
                    view === "live"
                      ? "bg-amber-600/30 text-amber-400 font-semibold"
                      : "text-gray-400 hover:text-white"
                  }`}
                >
                  Live
                </button>
              )}
              <button
                onClick={() => setView("categorized")}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  view === "categorized"
                    ? "bg-amber-600/30 text-amber-400 font-semibold"
                    : "text-gray-400 hover:text-white"
                }`}
              >
                AI
              </button>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleSyncCategorize}
                disabled={syncing}
                title="Sync & categorize emails"
                className="flex items-center gap-1 px-2 py-1 text-xs bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 rounded transition-colors disabled:opacity-40"
              >
                <Zap className={`w-3 h-3 ${syncing ? "animate-pulse" : ""}`} />
                {syncing ? "Syncing…" : "Sync"}
              </button>
              <button
                onClick={() => fetchMessages(1, true)}
                disabled={refreshing}
                title="Refresh"
                className="p-1.5 text-gray-400 hover:text-white transition-colors disabled:opacity-40"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              </button>
              <button
                onClick={openCompose}
                title="New message"
                className="p-1.5 text-gray-400 hover:text-white transition-colors"
              >
                <PenLine className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Account tabs — only shown when multiple accounts are configured */}
          {accounts.length > 1 && (
            <div className="flex gap-1 px-3 py-1.5 border-b border-white/5 bg-white/[0.015]">
              <button
                onClick={() => handleAccountChange("all")}
                className={`text-[10px] px-2.5 py-1 rounded-full font-medium transition-colors shrink-0 ${
                  activeAccount === "all"
                    ? "bg-amber-600/40 text-amber-300"
                    : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                }`}
              >
                All
              </button>
              {accounts.map((acct) => (
                <button
                  key={acct.key}
                  onClick={() => handleAccountChange(acct.key)}
                  title={acct.email}
                  className={`text-[10px] px-2.5 py-1 rounded-full font-medium transition-colors shrink-0 ${
                    activeAccount === acct.key
                      ? acct.key === "ncho"
                        ? "bg-amber-600/40 text-amber-300"
                        : "bg-blue-600/40 text-blue-300"
                      : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {acct.label}
                </button>
              ))}
            </div>
          )}

          {/* Sync result banner */}
          {!!syncResult && (
            <div className="px-4 py-2 bg-green-900/30 border-b border-green-700/30 text-xs text-green-400 flex items-center gap-2 flex-wrap">
              <span className="font-semibold">✓ Sync complete —</span>
              {Object.entries(syncResult.accounts).map(([acct, stats]) => (
                <span key={acct} className="text-green-300">
                  {acct === "gmail_personal" ? "Gmail" : acct === "gmail_ncho" ? "G·NCHO" : "NCHO"}:
                  {" "}{stats.inserted > 0 ? `${stats.inserted} new` : "up to date"}
                  {stats.total > 0 && <span className="text-green-600 ml-1">({stats.total} scanned)</span>}
                </span>
              ))}
              {Object.keys(syncResult.accounts).length === 0 && (
                <span className="text-green-300">No accounts configured</span>
              )}
            </div>
          )}

          {/* Search + category filter — AI view only */}
          {view === "categorized" && (
            <>
              <div className="px-3 py-2 border-b border-white/5">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Search emails…"
                    value={searchQuery}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 text-sm bg-white/5 border border-white/10 rounded-md text-white placeholder-gray-600 focus:outline-none focus:border-amber-500/50"
                  />
                </div>
              </div>
              <div className="flex gap-1 px-3 py-1.5 overflow-x-auto border-b border-white/5">
                {CATEGORY_TABS.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => handleCategoryChange(tab.key)}
                    className={`shrink-0 text-[10px] px-2 py-1 rounded-full font-medium transition-colors ${
                      activeCategory === tab.key
                        ? "bg-amber-600/40 text-amber-300"
                        : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </>
          )}
          {/* Message list */}
          <div className="flex-1 overflow-y-auto">
            {(view === "live" ? loading : searching) ? (
              <div className="flex items-center justify-center py-12 text-gray-500">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                <span className="text-sm">
                  {view === "live" ? "Loading inbox…" : "Searching…"}
                </span>
              </div>
            ) : (view === "live" ? messages : searchResults).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                <AtSign className="w-8 h-8 mb-3 text-gray-700" />
                <p className="text-sm">
                  {view === "live" ? "No messages found" : "No emails found"}
                </p>
                {view === "categorized" && (
                  <p className="text-xs text-gray-600 mt-1">Try syncing first</p>
                )}
              </div>
            ) : (
              (view === "live" ? messages : searchResults).map((msg) => (
                <MessageRow
                  key={msg.uid}
                  msg={msg}
                  selected={msg.uid === selectedUid}
                  onClick={() => selectMessage(msg.uid)}
                />
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-2 border-t border-white/10 text-xs text-gray-500">
              <button
                onClick={() =>
                  view === "live"
                    ? fetchMessages(page - 1)
                    : fetchCategorized(searchQuery, activeCategory, searchPage - 1, activeAccount)
                }
                disabled={view === "live" ? page <= 1 : searchPage <= 1}
                className="disabled:opacity-30 hover:text-white transition-colors"
              >
                ← Newer
              </button>
              <span>
                {view === "live" ? page : searchPage} / {totalPages}
              </span>
              <button
                onClick={() =>
                  view === "live"
                    ? fetchMessages(page + 1)
                    : fetchCategorized(searchQuery, activeCategory, searchPage + 1, activeAccount)
                }
                disabled={view === "live" ? page >= totalPages : searchPage >= totalPages}
                className="disabled:opacity-30 hover:text-white transition-colors"
              >
                Older →
              </button>
            </div>
          )}
        </div>

        {/* ── Right: Viewer / Compose ────────────────────────────────────── */}
        <div
          className={`flex-1 bg-gray-950 overflow-hidden ${
            mobileView === "list" ? "hidden md:block" : "block"
          }`}
        >
          {/* Mobile back button */}
          {mobileView === "message" && (
            <button
              onClick={() => setMobileView("list")}
              className="md:hidden flex items-center gap-1 px-4 py-2 text-sm text-gray-400 hover:text-white border-b border-white/10"
            >
              <ChevronLeft className="w-4 h-4" />
              Inbox
            </button>
          )}

          {composing ? (
            <ComposePanel
              compose={compose}
              onChange={setCompose}
              onSend={handleSend}
              onCancel={handleCancelCompose}
              sending={sending}
            />
          ) : loadingMessage ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              <span className="text-sm">Loading message…</span>
            </div>
          ) : fullMessage ? (
            <MessageViewer message={fullMessage} onReply={openReply} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-gray-600 select-none">
              <Mail className="w-10 h-10 mb-3 text-gray-800" />
              <p className="text-sm">Select a message to read</p>
              <button
                onClick={openCompose}
                className="mt-4 flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white text-sm rounded-lg transition-colors"
              >
                <PenLine className="w-4 h-4" />
                Compose new message
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
