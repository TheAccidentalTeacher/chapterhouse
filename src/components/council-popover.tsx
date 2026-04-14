"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Swords, X, Loader2, Send } from "lucide-react";
import ReactMarkdown from "react-markdown";

const MEMBERS = [
  { id: "gandalf", name: "Gandalf", emoji: "🧙", color: "text-zinc-400" },
  { id: "data", name: "Data", emoji: "🤖", color: "text-green-400" },
  { id: "polgara", name: "Polgara", emoji: "🦉", color: "text-fuchsia-400" },
  { id: "earl", name: "Earl", emoji: "🐺", color: "text-amber-400" },
  { id: "silk", name: "Silk", emoji: "🐀", color: "text-violet-400" },
  { id: "all", name: "All", emoji: "✨", color: "text-amber-300" },
] as const;

type MemberResponse = {
  member: string;
  emoji: string;
  response: string;
};

export function CouncilPopover() {
  const [open, setOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<string>("gandalf");
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [responses, setResponses] = useState<MemberResponse[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut: Ctrl+Shift+C
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey && e.shiftKey && e.key === "C") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const handleAsk = useCallback(async () => {
    if (!question.trim() || loading) return;
    setLoading(true);
    setResponses([]);
    try {
      const res = await fetch("/api/council/quick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          member: selectedMember,
          question,
          page_context: typeof window !== "undefined" ? window.location.pathname : undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.responses) {
        setResponses(data.responses);
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [question, selectedMember, loading]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 hover:bg-amber-500/30 hover:border-amber-500/50 shadow-lg transition-all"
        title="Quick Council (Ctrl+Shift+C)"
      >
        <Swords className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80 rounded-2xl border border-zinc-700 bg-zinc-900 shadow-2xl flex flex-col max-h-[70vh]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <Swords className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-semibold text-amber-300">Quick Council</span>
        </div>
        <button
          onClick={() => setOpen(false)}
          className="text-zinc-500 hover:text-zinc-300"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Member selector */}
      <div className="flex flex-wrap gap-1 px-3 py-2 border-b border-zinc-800/50">
        {MEMBERS.map((m) => (
          <button
            key={m.id}
            onClick={() => setSelectedMember(m.id)}
            className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs transition-colors ${
              selectedMember === m.id
                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
            }`}
          >
            <span>{m.emoji}</span>
            <span>{m.name}</span>
          </button>
        ))}
      </div>

      {/* Responses */}
      {responses.length > 0 && (
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
          {responses.map((r, i) => (
            <div key={i} className="text-sm">
              <div className="flex items-center gap-1.5 mb-1">
                <span>{r.emoji}</span>
                <span className="text-xs font-semibold text-zinc-300">{r.member}</span>
              </div>
              <div className="prose prose-sm prose-invert max-w-none prose-p:my-1 prose-headings:text-amber-300 text-xs leading-relaxed">
                <ReactMarkdown>{r.response}</ReactMarkdown>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="border-t border-zinc-800 px-3 py-2 flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAsk();
            if (e.key === "Escape") setOpen(false);
          }}
          placeholder="Ask the Council..."
          className="flex-1 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
        />
        <button
          onClick={handleAsk}
          disabled={loading || !question.trim()}
          className="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Send className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}
