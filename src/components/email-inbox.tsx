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
  Send,
  X,
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
        selected ? "bg-blue-600/20 border-l-2 border-l-blue-500" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {!msg.isRead && (
            <span className="w-2 h-2 rounded-full bg-blue-400 shrink-0 mt-1" />
          )}
          {msg.isRead && <span className="w-2 h-2 shrink-0" />}
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
        {msg.hasAttachment && (
          <Paperclip className="inline w-3 h-3 text-gray-500 mt-0.5" />
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
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm rounded-lg transition-colors"
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
  const [sendStatus, setSendStatus] = useState<"idle" | "success" | "error">("idle");
  const [mobileView, setMobileView] = useState<"list" | "message">("list");
  const limit = 30;
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

      if (!res.ok) throw new Error("Send failed");
      setSendStatus("success");
      setComposing(false);
      setCompose(EMPTY_COMPOSE);
      setMobileView("list");

      // Brief success toast then reset
      setTimeout(() => setSendStatus("idle"), 3000);
    } catch (err) {
      console.error("[inbox] handleSend:", err);
      setSendStatus("error");
      setTimeout(() => setSendStatus("idle"), 4000);
    } finally {
      setSending(false);
    }
  }, [compose]);

  const handleCancelCompose = useCallback(() => {
    setComposing(false);
    setMobileView("list");
  }, []);

  const totalPages = Math.ceil(total / limit);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col">
      {/* Send status toast */}
      {sendStatus !== "idle" && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg text-sm font-medium shadow-lg transition-all ${
            sendStatus === "success"
              ? "bg-emerald-600 text-white"
              : "bg-red-600 text-white"
          }`}
        >
          {sendStatus === "success" ? "Message sent." : "Failed to send. Try again."}
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
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-semibold text-white">Inbox</span>
              {total > 0 && (
                <span className="text-xs text-gray-500">({total})</span>
              )}
            </div>
            <div className="flex items-center gap-2">
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

          {/* Message list */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12 text-gray-500">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                <span className="text-sm">Loading inbox…</span>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                <AtSign className="w-8 h-8 mb-3 text-gray-700" />
                <p className="text-sm">No messages found</p>
              </div>
            ) : (
              messages.map((msg) => (
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
                onClick={() => fetchMessages(page - 1)}
                disabled={page <= 1}
                className="disabled:opacity-30 hover:text-white transition-colors"
              >
                ← Newer
              </button>
              <span>
                {page} / {totalPages}
              </span>
              <button
                onClick={() => fetchMessages(page + 1)}
                disabled={page >= totalPages}
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
