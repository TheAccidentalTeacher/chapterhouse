"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, FileText, Loader2 } from "lucide-react";

export function ScratchpadPanel() {
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load existing note
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/scratch-notes");
        if (res.ok) {
          const data = await res.json();
          setContent(data.content ?? "");
        }
      } catch {
        // No saved note yet — that's fine
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = useCallback(async (text: string) => {
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/scratch-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // Silent fail — user will see no "Saved" indicator
    } finally {
      setSaving(false);
    }
  }, []);

  const handleChange = (value: string) => {
    setContent(value);
    setSaved(false);

    // Debounce 800ms
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => save(value), 800);
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-muted" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-semibold tracking-tight">Scratchpad</h3>
        </div>
        <span className="flex items-center gap-1 text-xs text-muted/60">
          {saving && (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              Saving…
            </>
          )}
          {saved && !saving && (
            <>
              <Check className="h-3 w-3 text-green-500" />
              Saved
            </>
          )}
        </span>
      </div>

      {/* Textarea */}
      <textarea
        value={content}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="Quick notes, links to check, things to remember…"
        className="flex-1 resize-none bg-transparent py-3 text-sm leading-relaxed placeholder:text-muted/40 focus:outline-none"
        spellCheck={false}
      />
    </div>
  );
}
