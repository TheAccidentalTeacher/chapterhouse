"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  Bot,
  Brain,
  Check,
  ChevronDown,
  Edit3,
  Loader2,
  MessageSquarePlus,
  Pin,
  PinOff,
  Trash2,
  Users,
  X,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { log, mountConsoleHelpers, type SystemStatus } from "@/lib/debug-logger";

// ── Types ──────────────────────────────────────────────────────────────────────

type Message = {
  role: "user" | "assistant" | "system";
  content: string;
};

type Thread = {
  id: string;
  title: string;
  owner: string;
  model: string;
  pinned: boolean;
  created_at: string;
  updated_at: string;
  messages?: Message[];
};

type ModelOption = {
  id: string;
  label: string;
  provider: "openai" | "anthropic";
};

const MODELS: ModelOption[] = [
  { id: "gpt-5.4", label: "GPT-5.4", provider: "openai" },
  { id: "gpt-5.4-pro", label: "GPT-5.4 Pro", provider: "openai" },
  { id: "gpt-5-mini", label: "GPT-5 Mini", provider: "openai" },
  { id: "claude-opus-4-6", label: "Claude Opus 4.6", provider: "anthropic" },
  { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6", provider: "anthropic" },
];

const SUGGESTED_PROMPTS = [
  "What should I be focused on this week?",
  "What's the biggest opportunity we haven't moved on yet?",
  "Analyze our brand positioning vs. the homeschool market.",
  "What product should we build next?",
];

// Debounce delay for auto-saving messages to DB (ms)
const SAVE_DELAY = 1500;

// ── Council Types ──────────────────────────────────────────────────────────────

type CouncilMemberInfo = {
  name: string;
  role: string;
  color: string;
};

type CouncilMessage = {
  role: "council";
  memberName: string;
  memberColor: string;
  content: string;
  isStreaming?: boolean;
};

type DisplayMessage = Message | CouncilMessage;

function isCouncilMessage(msg: DisplayMessage): msg is CouncilMessage {
  return msg.role === "council";
}

// ── Chat Interface ─────────────────────────────────────────────────────────────

export function ChatInterface() {
  // Thread state
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [loadingThreads, setLoadingThreads] = useState(true);

  // Message state
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelOption>(MODELS[0]);
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const [learnedCount, setLearnedCount] = useState(0);
  const [isLearning, setIsLearning] = useState(false);

  // Council mode
  const [councilMode, setCouncilMode] = useState(false);
  const [activeCouncilMembers, setActiveCouncilMembers] = useState<CouncilMemberInfo[]>([]);
  const [currentSpeaker, setCurrentSpeaker] = useState<string | null>(null);

  // Rename state
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");

  // Refs
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messagesRef = useRef<DisplayMessage[]>(messages);
  messagesRef.current = messages;

  // Whether thread persistence is available (null = unknown, true = ok, false = unavailable)
  const [threadsAvailable, setThreadsAvailable] = useState<boolean | null>(null);

  // ── Thread list operations ────────────────────────────────────────────────

  const fetchThreads = useCallback(async () => {
    try {
      const res = await fetch("/api/threads");
      const data = await res.json();
      if (res.ok) {
        setThreads(data.threads ?? []);
        setThreadsAvailable(true);
      } else {
        setThreadsAvailable(false);
      }
    } catch {
      setThreadsAvailable(false);
    } finally {
      setLoadingThreads(false);
    }
  }, []);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  // Listen for debug panel "Ask AI" — pre-fills the input and focuses textarea
  useEffect(() => {
    function handlePrefill(e: Event) {
      const text = (e as CustomEvent<string>).detail;
      setInput(text);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
    window.addEventListener("chapterhouse:prefill", handlePrefill);
    return () => window.removeEventListener("chapterhouse:prefill", handlePrefill);
  }, []);

  // Migrate from localStorage on first load (one-time)
  useEffect(() => {
    if (loadingThreads) return;
    try {
      const saved = localStorage.getItem("chapterhouse_messages");
      if (!saved) return;
      const oldMessages: Message[] = JSON.parse(saved);
      if (!oldMessages || oldMessages.length === 0) return;

      // Create a thread from the old localStorage messages
      fetch("/api/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Migrated conversation",
          messages: oldMessages,
          owner: "scott",
        }),
      })
        .then((r) => r.json())
        .then((data) => {
          if (data.thread) {
            setThreads((prev) => [data.thread, ...prev]);
            loadThread(data.thread.id);
            localStorage.removeItem("chapterhouse_messages");
            log.success("Migrated localStorage chat to persistent thread");
          }
        });
    } catch {
      // ignore migration errors
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadingThreads]);

  async function loadThread(id: string) {
    try {
      const res = await fetch(`/api/threads/${id}`);
      const data = await res.json();
      if (data.thread) {
        setActiveThreadId(id);
        setMessages(data.thread.messages ?? []);
        const model = MODELS.find((m) => m.id === data.thread.model);
        if (model) setSelectedModel(model);
        setLearnedCount(0);
      }
    } catch {
      log.error("Failed to load thread", id);
    }
  }

  async function createThread() {
    try {
      const res = await fetch("/api/threads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "New chat",
          owner: "scott",
          model: selectedModel.id,
        }),
      });
      const data = await res.json();
      if (data.thread) {
        setThreads((prev) => [data.thread, ...prev]);
        setActiveThreadId(data.thread.id);
        setMessages([]);
        setLearnedCount(0);
      }
    } catch {
      log.error("Failed to create thread");
    }
  }

  async function deleteThread(id: string) {
    try {
      await fetch(`/api/threads/${id}`, { method: "DELETE" });
      setThreads((prev) => prev.filter((t) => t.id !== id));
      if (activeThreadId === id) {
        setActiveThreadId(null);
        setMessages([]);
      }
    } catch {
      log.error("Failed to delete thread", id);
    }
  }

  async function renameThread(id: string, title: string) {
    if (!title.trim()) return;
    try {
      await fetch(`/api/threads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim() }),
      });
      setThreads((prev) =>
        prev.map((t) => (t.id === id ? { ...t, title: title.trim() } : t))
      );
    } catch {
      log.error("Failed to rename thread", id);
    }
    setRenamingId(null);
  }

  async function togglePin(id: string, currentlyPinned: boolean) {
    try {
      await fetch(`/api/threads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned: !currentlyPinned }),
      });
      setThreads((prev) =>
        prev.map((t) => (t.id === id ? { ...t, pinned: !currentlyPinned } : t))
      );
    } catch {
      log.error("Failed to toggle pin", id);
    }
  }

  // ── Auto-save messages to DB (debounced) ──────────────────────────────────

  const saveMessages = useCallback(
    (msgs: Message[], threadId: string | null) => {
      if (!threadId) return; // persistence unavailable — skip save
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(async () => {
        try {
          await fetch(`/api/threads/${threadId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: msgs,
              model: selectedModel.id,
            }),
          });
          // Update the thread's updated_at in sidebar without refetching
          setThreads((prev) =>
            prev.map((t) =>
              t.id === threadId ? { ...t, updated_at: new Date().toISOString() } : t
            )
          );
        } catch {
          log.error("Auto-save failed for thread", threadId);
        }
      }, SAVE_DELAY);
    },
    [selectedModel.id]
  );

  // Auto-title: generate a title from the first user message
  async function autoTitle(threadId: string, firstMessage: string) {
    const title =
      firstMessage.length > 60
        ? firstMessage.slice(0, 57) + "…"
        : firstMessage;
    await renameThread(threadId, title);
  }

  // ── Scroll & system status ────────────────────────────────────────────────

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    mountConsoleHelpers(MODELS);
    fetch("/api/debug")
      .then((r) => r.json())
      .then((data) => {
        const status: SystemStatus = {
          env: data.env,
          buildTime: data.timestamp,
          openai: data.openai?.apiReachable ?? (data.openai?.configured ? "unknown" : false),
          anthropic: data.anthropic?.configured ?? false,
          supabase: data.supabase?.connected ?? false,
          models: MODELS.map((m) => `${m.id} (${m.provider})`),
          errors: [
            !data.openai?.configured ? "OPENAI_API_KEY not set" : null,
            !data.anthropic?.configured ? "ANTHROPIC_API_KEY not set" : null,
            !data.supabase?.urlConfigured ? "NEXT_PUBLIC_SUPABASE_URL not set" : null,
            !data.supabase?.serviceRoleConfigured ? "SUPABASE_SERVICE_ROLE_KEY not set" : null,
            data.supabase?.error ? `Supabase error: ${data.supabase.error}` : null,
            data.openai?.error ? `OpenAI error: ${data.openai.error}` : null,
          ].filter(Boolean) as string[],
        };
        log.systemStatus(status);
        console.log("%c  Full debug payload:", "color:#6b7280", data);
      })
      .catch((e) => {
        log.error("Failed to fetch /api/debug", e);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function autoResize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }

  // ── Send message ──────────────────────────────────────────────────────────

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;

    // If no active thread, try to create one first (best-effort — chat works even if this fails)
    let threadId = activeThreadId;
    if (!threadId) {
      try {
        const res = await fetch("/api/threads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "New chat",
            owner: "scott",
            model: selectedModel.id,
          }),
        });
        const data = await res.json();
        if (res.ok && data.thread) {
          threadId = data.thread.id;
          setThreads((prev) => [data.thread, ...prev]);
          setActiveThreadId(threadId);
          setThreadsAvailable(true);
        } else {
          log.error("Thread creation failed — chat will work without persistence", data.error);
          setThreadsAvailable(false);
        }
      } catch (e) {
        log.error("Thread creation threw — chat will work without persistence", e);
        setThreadsAvailable(false);
      }
    }

    // Thread creation is best-effort — we continue regardless

    // /remember command
    const rememberMatch = trimmed.match(/^\/remember\s+(.+)/i);
    if (rememberMatch) {
      const note = rememberMatch[1].trim();
      setInput("");
      if (textareaRef.current) textareaRef.current.style.height = "auto";
      try {
        await fetch("/api/founder-notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: note, source: "chat" }),
        });
        const updated = [
          ...messages,
          { role: "system" as const, content: `Saved to founder memory: "${note}"` },
        ];
        setMessages(updated);
        saveMessages(updated as Message[], threadId);
      } catch {
        const updated = [
          ...messages,
          { role: "system" as const, content: `Failed to save: "${note}" — try again.` },
        ];
        setMessages(updated);
      }
      return;
    }

    const newMessages: DisplayMessage[] = [
      ...messages,
      { role: "user" as const, content: trimmed },
    ];
    setMessages(newMessages);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setIsStreaming(true);

    // Auto-title on first user message
    const isFirstMessage = messages.filter((m) => m.role === "user").length === 0;
    if (isFirstMessage && threadId) {
      autoTitle(threadId, trimmed);
    }

    // Auto-learn in parallel
    setIsLearning(true);
    fetch("/api/extract-learnings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: newMessages }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.extracted && d.extracted.length > 0) {
          setLearnedCount((n) => n + d.extracted.length);
          log.success(`Auto-learned ${d.extracted.length} fact(s) from user message`);
        }
      })
      .catch(() => null)
      .finally(() => setIsLearning(false));

    // ── Council Mode ──────────────────────────────────────────────────────
    if (councilMode) {
      log.group("Council Session");
      log.data("Mode", "Fellowship Council");
      log.data("Messages in context", newMessages.length);
      setActiveCouncilMembers([]);
      setCurrentSpeaker(null);

      try {
        const response = await fetch("/api/chat/council", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: newMessages.filter((m) => !isCouncilMessage(m)), model: selectedModel.id }),
        });

        if (!response.ok || !response.body) {
          throw new Error(`HTTP ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Parse SSE events from buffer
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? ""; // keep incomplete line in buffer

          let eventType = "";
          for (const line of lines) {
            if (line.startsWith("event: ")) {
              eventType = line.slice(7).trim();
            } else if (line.startsWith("data: ") && eventType) {
              try {
                const data = JSON.parse(line.slice(6));

                if (eventType === "council_start") {
                  setActiveCouncilMembers(data.members);
                  log.info(`Council convened: ${data.members.map((m: CouncilMemberInfo) => m.name).join(", ")}`);
                } else if (eventType === "member_start") {
                  setCurrentSpeaker(data.name);
                  log.info(`${data.name} is thinking... (${data.index + 1}/${data.total})`);
                  // Add a new council message for this member
                  setMessages((prev) => [
                    ...prev,
                    { role: "council" as const, memberName: data.name, memberColor: data.color, content: "", isStreaming: true },
                  ]);
                } else if (eventType === "member_delta") {
                  // Stream text into the current council member's message
                  setMessages((prev) => {
                    const updated = [...prev];
                    const lastIdx = updated.length - 1;
                    const last = updated[lastIdx];
                    if (isCouncilMessage(last) && last.memberName === data.name) {
                      updated[lastIdx] = { ...last, content: last.content + data.delta };
                    }
                    return updated;
                  });
                } else if (eventType === "member_done") {
                  // Mark done streaming
                  setMessages((prev) => {
                    const updated = [...prev];
                    const lastIdx = updated.length - 1;
                    const last = updated[lastIdx];
                    if (isCouncilMessage(last) && last.memberName === data.name) {
                      updated[lastIdx] = { ...last, isStreaming: false };
                    }
                    return updated;
                  });
                  log.success(`${data.name} done`);
                } else if (eventType === "member_error") {
                  setMessages((prev) => {
                    const updated = [...prev];
                    const lastIdx = updated.length - 1;
                    const last = updated[lastIdx];
                    if (isCouncilMessage(last) && last.memberName === data.name) {
                      updated[lastIdx] = { ...last, content: `*${data.name} encountered an error: ${data.error}*`, isStreaming: false };
                    }
                    return updated;
                  });
                } else if (eventType === "council_done") {
                  setCurrentSpeaker(null);
                  log.success(`Council complete: ${data.membersResponded.join(", ")}`);
                  // Save conversation
                  setMessages((prev) => {
                    if (threadId) {
                      // Convert council messages to regular messages for storage
                      const storable = prev.map((m) =>
                        isCouncilMessage(m)
                          ? { role: "assistant" as const, content: `**${m.memberName}:**\n${m.content}` }
                          : m
                      );
                      saveMessages(storable as Message[], threadId);
                    }
                    return prev;
                  });
                }
              } catch {
                // skip malformed JSON
              }
              eventType = "";
            }
          }
        }
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : String(e);
        log.error("Council session failed", errorMsg);
        setMessages((prev) => [...prev, { role: "assistant" as const, content: `Council error: ${errorMsg}` }]);
      } finally {
        log.groupEnd();
        setIsStreaming(false);
        setCurrentSpeaker(null);
      }
      return;
    }

    // ── Standard Chat Mode ────────────────────────────────────────────────
    const t0 = performance.now();
    let firstChunkTime: number | null = null;
    let totalChars = 0;
    let chunkCount = 0;

    log.group(`Chat → ${selectedModel.label}`);
    log.data("Model", selectedModel.id);
    log.data("Provider", selectedModel.provider);
    log.data("Messages in context", newMessages.length);
    log.data("User prompt", trimmed.slice(0, 120) + (trimmed.length > 120 ? "…" : ""));

    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      log.info("Sending request to /api/chat...");
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages.filter((m) => !isCouncilMessage(m)), model: selectedModel.id }),
      });

      log.data("HTTP status", `${response.status} ${response.statusText}`);

      if (!response.ok || !response.body) {
        const errorText = await response.text().catch(() => "(no body)");
        log.error(`Request failed — ${response.status}`, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      log.success("Stream opened");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        accumulated += chunk;
        chunkCount++;
        totalChars += chunk.length;

        if (firstChunkTime === null) {
          firstChunkTime = performance.now();
          log.timing("Time to first token", Math.round(firstChunkTime - t0));
        }

        const captured = accumulated;
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: captured };
          return updated;
        });
      }

      const totalTime = Math.round(performance.now() - t0);
      log.success("Stream complete");
      log.data("Chunks received", chunkCount);
      log.data("Characters received", totalChars);
      log.data("Est. tokens (~4 chars/token)", Math.round(totalChars / 4));
      log.timing("Total response time", totalTime);

      // Save the complete conversation to DB
      // Use a callback to get the final messages state
      setMessages((prev) => {
        if (threadId) saveMessages(prev as Message[], threadId);
        return prev;
      });
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      log.error("Chat failed", errorMsg);
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: `Error: ${errorMsg}` };
        if (threadId) saveMessages(updated as Message[], threadId);
        return updated;
      });
    } finally {
      log.groupEnd();
      setIsStreaming(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  const isEmpty = messages.length === 0;
  const pinnedThreads = threads.filter((t) => t.pinned);
  const recentThreads = threads.filter((t) => !t.pinned);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full">
      {/* ── Thread Sidebar ─────────────────────────────────────────────────── */}
      <div className="hidden w-64 shrink-0 flex-col border-r border-border/70 bg-sidebar/50 md:flex">
        <div className="flex items-center justify-between border-b border-border/70 px-4 py-3">
          <h2 className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            Threads
          </h2>
          <button
            onClick={createThread}
            title="New chat"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted transition hover:bg-muted-surface hover:text-foreground"
          >
            <MessageSquarePlus className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2">
          {loadingThreads && (
            <div className="flex items-center justify-center py-8 text-muted">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          )}

          {/* Pinned */}
          {pinnedThreads.length > 0 && (
            <div className="mb-3">
              <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted/60">
                Pinned
              </p>
              {pinnedThreads.map((thread) => (
                <ThreadRow
                  key={thread.id}
                  thread={thread}
                  isActive={thread.id === activeThreadId}
                  isRenaming={renamingId === thread.id}
                  renameValue={renameValue}
                  onSelect={() => loadThread(thread.id)}
                  onDelete={() => deleteThread(thread.id)}
                  onStartRename={() => {
                    setRenamingId(thread.id);
                    setRenameValue(thread.title);
                  }}
                  onCancelRename={() => setRenamingId(null)}
                  onConfirmRename={() => renameThread(thread.id, renameValue)}
                  onRenameChange={setRenameValue}
                  onTogglePin={() => togglePin(thread.id, thread.pinned)}
                />
              ))}
            </div>
          )}

          {/* Recent */}
          {recentThreads.length > 0 && (
            <div>
              {pinnedThreads.length > 0 && (
                <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-widest text-muted/60">
                  Recent
                </p>
              )}
              {recentThreads.map((thread) => (
                <ThreadRow
                  key={thread.id}
                  thread={thread}
                  isActive={thread.id === activeThreadId}
                  isRenaming={renamingId === thread.id}
                  renameValue={renameValue}
                  onSelect={() => loadThread(thread.id)}
                  onDelete={() => deleteThread(thread.id)}
                  onStartRename={() => {
                    setRenamingId(thread.id);
                    setRenameValue(thread.title);
                  }}
                  onCancelRename={() => setRenamingId(null)}
                  onConfirmRename={() => renameThread(thread.id, renameValue)}
                  onRenameChange={setRenameValue}
                  onTogglePin={() => togglePin(thread.id, thread.pinned)}
                />
              ))}
            </div>
          )}

          {!loadingThreads && threads.length === 0 && (
            <div className="px-2 py-8 text-center">
              {threadsAvailable === false ? (
                <p className="text-xs text-amber-400/80">
                  Thread storage unavailable — chat works but history won&apos;t be saved.
                </p>
              ) : (
                <p className="text-xs text-muted/60">
                  No threads yet. Start chatting.
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── Main Chat Area ─────────────────────────────────────────────────── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Message area */}
        <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
          {isEmpty ? (
            <div className="flex h-full flex-col items-center justify-center gap-8 pb-8">
              <div className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-accent text-accent-foreground shadow-lg shadow-accent/25">
                  <Bot className="h-6 w-6" />
                </div>
                <h2 className="mt-5 text-2xl font-semibold tracking-tight">
                  What do you need?
                </h2>
                <p className="mt-2 text-sm text-muted">
                  Ask about strategy, products, positioning, or anything Next Chapter.
                </p>
              </div>
              <div className="grid w-full max-w-2xl gap-2 sm:grid-cols-2">
                {SUGGESTED_PROMPTS.map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => sendMessage(prompt)}
                    className="rounded-2xl border border-border bg-card/80 px-4 py-3 text-left text-sm text-muted transition hover:border-accent/40 hover:bg-card hover:text-foreground"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-3xl space-y-6">
              {/* Council members bar — shows when council is active */}
              {councilMode && activeCouncilMembers.length > 0 && isStreaming && (
                <div className="flex items-center gap-2 rounded-2xl border border-border/40 bg-card/60 px-4 py-2.5">
                  <Users className="h-4 w-4 text-muted" />
                  <span className="text-xs text-muted">Council:</span>
                  {activeCouncilMembers.map((m) => (
                    <span
                      key={m.name}
                      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium transition-all ${
                        currentSpeaker === m.name
                          ? "ring-2 ring-offset-1 ring-offset-background"
                          : "opacity-50"
                      }`}
                      style={{
                        backgroundColor: m.color + "18",
                        color: m.color,
                        ...(currentSpeaker === m.name ? { ringColor: m.color } : {}),
                      }}
                    >
                      {currentSpeaker === m.name && <Loader2 className="h-3 w-3 animate-spin" />}
                      {m.name}
                    </span>
                  ))}
                </div>
              )}

              {messages.map((msg, i) => {
                // Council member message
                if (isCouncilMessage(msg)) {
                  return (
                    <div key={i} className="flex gap-3 flex-row">
                      <div
                        className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl text-xs font-bold shadow"
                        style={{ backgroundColor: msg.memberColor + "25", color: msg.memberColor }}
                        title={msg.memberName}
                      >
                        {msg.memberName.charAt(0)}
                      </div>
                      <div
                        className="max-w-[80%] rounded-3xl px-5 py-4 text-sm leading-7 glass-panel border"
                        style={{ borderColor: msg.memberColor + "40" }}
                      >
                        {msg.content ? (
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                              h1: ({ children }) => <h1 className="mb-3 mt-4 text-lg font-semibold first:mt-0">{children}</h1>,
                              h2: ({ children }) => <h2 className="mb-2 mt-4 text-base font-semibold first:mt-0">{children}</h2>,
                              h3: ({ children }) => <h3 className="mb-2 mt-3 text-sm font-semibold first:mt-0">{children}</h3>,
                              ul: ({ children }) => <ul className="mb-3 ml-4 list-disc space-y-1 last:mb-0">{children}</ul>,
                              ol: ({ children }) => <ol className="mb-3 ml-4 list-decimal space-y-1 last:mb-0">{children}</ol>,
                              li: ({ children }) => <li className="leading-6">{children}</li>,
                              strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                              code: ({ children, className }) => {
                                const isInline = !className;
                                return isInline ? (
                                  <code className="rounded bg-muted-surface px-1.5 py-0.5 font-mono text-xs">{children}</code>
                                ) : (
                                  <code className="block overflow-x-auto rounded-xl bg-muted-surface px-4 py-3 font-mono text-xs leading-5">{children}</code>
                                );
                              },
                              pre: ({ children }) => <pre className="mb-3 last:mb-0">{children}</pre>,
                              blockquote: ({ children }) => <blockquote className="mb-3 border-l-2 border-accent/50 pl-4 text-muted last:mb-0">{children}</blockquote>,
                              a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-2 hover:opacity-80">{children}</a>,
                              table: ({ children }) => <div className="mb-3 overflow-x-auto last:mb-0"><table className="min-w-full text-xs">{children}</table></div>,
                              th: ({ children }) => <th className="border border-border/70 bg-muted-surface px-3 py-2 text-left font-semibold">{children}</th>,
                              td: ({ children }) => <td className="border border-border/70 px-3 py-2">{children}</td>,
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        ) : (
                          <div className="flex items-center gap-2 text-muted">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-xs" style={{ color: msg.memberColor }}>{msg.memberName} is thinking…</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                }

                // Regular messages
                return (
                <div
                  key={i}
                  className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : msg.role === "system" ? "justify-center" : "flex-row"}`}
                >
                  {msg.role === "system" && (
                    <div className="flex items-center gap-2 rounded-full border border-border/50 bg-muted-surface px-4 py-1.5 text-xs text-muted">
                      <span className="status-dot bg-success shrink-0" />
                      {msg.content}
                    </div>
                  )}
                  {msg.role !== "system" && msg.role === "assistant" && (
                    <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground shadow shadow-accent/20">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}
                  {msg.role !== "system" && (
                    <div
                      className={`max-w-[80%] rounded-3xl px-5 py-4 text-sm leading-7 ${
                        msg.role === "user"
                          ? "bg-accent text-accent-foreground"
                          : "glass-panel border border-border/70"
                      }`}
                    >
                      {msg.role === "assistant" ? (
                        msg.content ? (
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
                              h1: ({ children }) => <h1 className="mb-3 mt-4 text-lg font-semibold first:mt-0">{children}</h1>,
                              h2: ({ children }) => <h2 className="mb-2 mt-4 text-base font-semibold first:mt-0">{children}</h2>,
                              h3: ({ children }) => <h3 className="mb-2 mt-3 text-sm font-semibold first:mt-0">{children}</h3>,
                              ul: ({ children }) => <ul className="mb-3 ml-4 list-disc space-y-1 last:mb-0">{children}</ul>,
                              ol: ({ children }) => <ol className="mb-3 ml-4 list-decimal space-y-1 last:mb-0">{children}</ol>,
                              li: ({ children }) => <li className="leading-6">{children}</li>,
                              strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                              em: ({ children }) => <em className="italic">{children}</em>,
                              code: ({ children, className }) => {
                                const isInline = !className;
                                return isInline ? (
                                  <code className="rounded bg-muted-surface px-1.5 py-0.5 font-mono text-xs">{children}</code>
                                ) : (
                                  <code className="block overflow-x-auto rounded-xl bg-muted-surface px-4 py-3 font-mono text-xs leading-5">{children}</code>
                                );
                              },
                              pre: ({ children }) => <pre className="mb-3 last:mb-0">{children}</pre>,
                              blockquote: ({ children }) => <blockquote className="mb-3 border-l-2 border-accent/50 pl-4 text-muted last:mb-0">{children}</blockquote>,
                              hr: () => <hr className="my-4 border-border/50" />,
                              a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-accent underline underline-offset-2 hover:opacity-80">{children}</a>,
                              table: ({ children }) => <div className="mb-3 overflow-x-auto last:mb-0"><table className="min-w-full text-xs">{children}</table></div>,
                              th: ({ children }) => <th className="border border-border/70 bg-muted-surface px-3 py-2 text-left font-semibold">{children}</th>,
                              td: ({ children }) => <td className="border border-border/70 px-3 py-2">{children}</td>,
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        ) : (
                          <Loader2 className="h-4 w-4 animate-spin text-muted" />
                        )
                      ) : (
                        msg.content
                      )}
                    </div>
                  )}
                </div>
              );
              })}
              <div ref={bottomRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <div className="border-t border-border/70 bg-background/80 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-end gap-3 rounded-3xl border border-border bg-card/80 px-4 py-3 focus-within:border-accent/40">
              <button
                onClick={() => setCouncilMode((c) => !c)}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                  councilMode
                    ? "border-amber-500/50 bg-amber-500/10 text-amber-400"
                    : "border-border/70 bg-card/60 text-muted hover:border-accent/40 hover:text-foreground"
                }`}
                title={councilMode ? "Council Mode ON — all members will respond" : "Switch to Council Mode"}
              >
                <Users className="h-3 w-3" />
                {councilMode ? "Council" : "Solo"}
              </button>
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  autoResize();
                }}
                onKeyDown={handleKeyDown}
                placeholder="Ask Chapterhouse anything..."
                className="flex-1 resize-none bg-transparent text-sm text-foreground placeholder:text-muted focus:outline-none"
                disabled={isStreaming}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || isStreaming}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground shadow shadow-accent/25 transition hover:opacity-90 disabled:opacity-30"
              >
                {isStreaming ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowUp className="h-4 w-4" />
                )}
              </button>
            </div>
            <div className="mt-2 flex items-center justify-between px-1">
              {/* Model picker */}
              <div className="flex items-center gap-2">
                <div className="relative">
                <button
                  onClick={() => setModelPickerOpen((o) => !o)}
                  className={`inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/60 px-3 py-1 text-xs text-muted transition hover:border-accent/40 hover:text-foreground ${councilMode ? "opacity-50 pointer-events-none" : ""}`}
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${selectedModel.provider === "openai" ? "bg-green-400" : "bg-orange-400"}`} />
                  {councilMode ? "Multi-model" : selectedModel.label}
                  <ChevronDown className="h-3 w-3" />
                </button>
                {modelPickerOpen && (
                  <div className="absolute bottom-full left-0 mb-2 min-w-48 overflow-hidden rounded-2xl border border-border bg-card shadow-xl shadow-black/20">
                    {MODELS.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => {
                          log.info(`Model switched → ${m.id} (${m.provider})`);
                          setSelectedModel(m);
                          setModelPickerOpen(false);
                        }}
                        className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition hover:bg-muted-surface ${m.id === selectedModel.id ? "text-accent" : "text-foreground"}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${m.provider === "openai" ? "bg-green-400" : "bg-orange-400"}`} />
                        {m.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              </div>

              {/* Brain indicator */}
              <div className="flex items-center gap-2">
                {(isLearning || learnedCount > 0) && (
                  <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition ${isLearning ? "border-accent/40 text-accent animate-pulse" : "border-border/50 text-muted"}`}>
                    <Brain className="h-3 w-3" />
                    {isLearning ? "learning…" : `${learnedCount} learned`}
                  </span>
                )}
                <p className="hidden text-xs text-muted lg:block">
                  <span className="font-mono">/remember [fact]</span> · Shift+Enter for new line
                </p>
              </div>

              {/* New thread button (mobile — sidebar is hidden) */}
              <button
                onClick={createThread}
                className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/60 px-3 py-1 text-xs text-muted transition hover:border-accent/40 hover:text-foreground md:hidden"
              >
                <MessageSquarePlus className="h-3 w-3" />
                New
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Thread Row Component ────────────────────────────────────────────────────────

function ThreadRow({
  thread,
  isActive,
  isRenaming,
  renameValue,
  onSelect,
  onDelete,
  onStartRename,
  onCancelRename,
  onConfirmRename,
  onRenameChange,
  onTogglePin,
}: {
  thread: Thread;
  isActive: boolean;
  isRenaming: boolean;
  renameValue: string;
  onSelect: () => void;
  onDelete: () => void;
  onStartRename: () => void;
  onCancelRename: () => void;
  onConfirmRename: () => void;
  onRenameChange: (v: string) => void;
  onTogglePin: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isRenaming) inputRef.current?.focus();
  }, [isRenaming]);

  const timeLabel = (() => {
    const d = new Date(thread.updated_at);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "just now";
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    if (diffDay < 7) return `${diffDay}d ago`;
    return d.toLocaleDateString();
  })();

  if (isRenaming) {
    return (
      <div className="flex items-center gap-1 rounded-xl border border-accent/40 bg-accent/5 px-2 py-1.5">
        <input
          ref={inputRef}
          value={renameValue}
          onChange={(e) => onRenameChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onConfirmRename();
            if (e.key === "Escape") onCancelRename();
          }}
          className="min-w-0 flex-1 bg-transparent text-xs text-foreground focus:outline-none"
        />
        <button onClick={onConfirmRename} className="text-accent hover:text-foreground">
          <Check className="h-3 w-3" />
        </button>
        <button onClick={onCancelRename} className="text-muted hover:text-foreground">
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  }

  return (
    <div
      className={`group flex items-center gap-1 rounded-xl px-2 py-1.5 text-xs transition cursor-pointer ${
        isActive
          ? "border border-accent/30 bg-accent/10 text-foreground"
          : "border border-transparent text-muted hover:bg-muted-surface hover:text-foreground"
      }`}
    >
      <button onClick={onSelect} className="min-w-0 flex-1 text-left">
        <p className="truncate font-medium">{thread.title}</p>
        <p className="truncate text-[10px] text-muted/60">
          {thread.owner} · {timeLabel}
        </p>
      </button>
      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition group-hover:opacity-100">
        <button
          onClick={(e) => { e.stopPropagation(); onTogglePin(); }}
          title={thread.pinned ? "Unpin" : "Pin"}
          className="rounded p-0.5 text-muted hover:text-accent"
        >
          {thread.pinned ? <PinOff className="h-3 w-3" /> : <Pin className="h-3 w-3" />}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onStartRename(); }}
          title="Rename"
          className="rounded p-0.5 text-muted hover:text-accent"
        >
          <Edit3 className="h-3 w-3" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          title="Delete"
          className="rounded p-0.5 text-muted hover:text-red-400"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
