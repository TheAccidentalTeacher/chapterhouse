"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Bot, ChevronDown, Loader2, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { log, mountConsoleHelpers, type SystemStatus } from "@/lib/debug-logger";

type Message = {
  role: "user" | "assistant";
  content: string;
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

const STORAGE_KEY = "chapterhouse_messages";

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelOption>(MODELS[0]);
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Persist messages to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // storage full or unavailable — ignore
    }
  }, [messages]);

  function clearConversation() {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
    log.info("Conversation cleared");
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mount: fetch system status, log it, attach console helpers
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
        // Pin full raw response too
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

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isStreaming) return;

    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: trimmed },
    ];
    setMessages(newMessages);
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setIsStreaming(true);

    const t0 = performance.now();
    let firstChunkTime: number | null = null;
    let totalChars = 0;
    let chunkCount = 0;

    log.group(`Chat → ${selectedModel.label}`);
    log.data("Model",    selectedModel.id);
    log.data("Provider", selectedModel.provider);
    log.data("Messages in context", newMessages.length);
    log.data("User prompt", trimmed.slice(0, 120) + (trimmed.length > 120 ? "…" : ""));

    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      log.info("Sending request to /api/chat...");
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, model: selectedModel.id }),
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

    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      log.error("Chat failed", errorMsg);
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: "assistant", content: `Error: ${errorMsg}` };
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

  return (
    <div className="flex h-full flex-col">
      {/* Message area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8">
        {isEmpty ? (
          <div className="flex h-full flex-col items-center justify-center gap-8 pb-8">
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-accent text-accent-foreground shadow-lg shadow-accent/25">
                <Bot className="h-6 w-6" />
              </div>
              <h2 className="mt-5 text-2xl font-semibold tracking-tight">
                What do you need, Scott?
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
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                {msg.role === "assistant" && (
                  <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground shadow shadow-accent/20">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
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
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-border/70 bg-background/80 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-end gap-3 rounded-3xl border border-border bg-card/80 px-4 py-3 focus-within:border-accent/40">
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
            <div className="relative">
              <button
                onClick={() => setModelPickerOpen((o) => !o)}
                className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/60 px-3 py-1 text-xs text-muted transition hover:border-accent/40 hover:text-foreground"
              >
                <span className={`h-1.5 w-1.5 rounded-full ${selectedModel.provider === "openai" ? "bg-green-400" : "bg-orange-400"}`} />
                {selectedModel.label}
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
            <p className="text-xs text-muted">Shift+Enter for new line · Enter to send</p>
            {messages.length > 0 && (
              <button
                onClick={clearConversation}
                disabled={isStreaming}
                title="Clear conversation"
                className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/60 px-3 py-1 text-xs text-muted transition hover:border-red-500/40 hover:text-red-400 disabled:opacity-30"
              >
                <Trash2 className="h-3 w-3" />
                New conversation
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
