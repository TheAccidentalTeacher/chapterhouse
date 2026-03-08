"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, Bot, ChevronDown, Loader2 } from "lucide-react";

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
  { id: "claude-opus-4-6", label: "Claude Opus 4.6", provider: "anthropic" },
  { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6", provider: "anthropic" },
];

const SUGGESTED_PROMPTS = [
  "What should I be focused on this week?",
  "What's the biggest opportunity we haven't moved on yet?",
  "Analyze our brand positioning vs. the homeschool market.",
  "What product should we build next?",
];

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedModel, setSelectedModel] = useState<ModelOption>(MODELS[0]);
  const [modelPickerOpen, setModelPickerOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, model: selectedModel.id }),
      });

      if (!response.ok || !response.body) {
        throw new Error("Request failed");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        const captured = accumulated;
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: captured,
          };
          return updated;
        });
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: "Something went wrong. Try again.",
        };
        return updated;
      });
    } finally {
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
                  {msg.content || (
                    <Loader2 className="h-4 w-4 animate-spin text-muted" />
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
                      onClick={() => { setSelectedModel(m); setModelPickerOpen(false); }}
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
          </div>
        </div>
      </div>
    </div>
  );
}
