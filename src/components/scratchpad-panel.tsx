"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Check,
  FileText,
  Italic,
  List,
  ListOrdered,
  Loader2,
} from "lucide-react";

export function ScratchpadPanel() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Hold initial HTML until editor is ready
  const initialContent = useRef<string>("");

  const save = useCallback(async (html: string) => {
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/scratch-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: html }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // Silent fail
    } finally {
      setSaving(false);
    }
  }, []);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Quick notes, links to check, things to remember…",
      }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class:
          "flex-1 min-h-0 outline-none text-sm leading-relaxed prose prose-sm prose-invert max-w-none py-3 [&_.is-editor-empty:first-child::before]:text-muted/40 [&_.is-editor-empty:first-child::before]:pointer-events-none [&_.is-editor-empty:first-child::before]:float-left [&_.is-editor-empty:first-child::before]:h-0 [&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]",
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      setSaved(false);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => save(html), 800);
    },
  });

  // Load existing note after editor mounts
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/scratch-notes");
        if (res.ok) {
          const data = await res.json();
          initialContent.current = data.content ?? "";
        }
      } catch {
        // No saved note — fine
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Set content once loading is done and editor is ready
  useEffect(() => {
    if (!loading && editor && initialContent.current) {
      editor.commands.setContent(initialContent.current);
    }
  }, [loading, editor]);

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
      <div className="flex items-center justify-between border-b border-border/40 pb-2">
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

      {/* Toolbar */}
      <div className="flex items-center gap-0.5 border-b border-border/40 py-1.5">
        <button
          onClick={() => editor?.chain().focus().toggleBold().run()}
          title="Bold"
          className={`flex h-6 w-6 items-center justify-center rounded text-xs transition hover:bg-muted-surface ${editor?.isActive("bold") ? "bg-muted-surface text-foreground" : "text-muted"}`}
        >
          <Bold className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          title="Italic"
          className={`flex h-6 w-6 items-center justify-center rounded text-xs transition hover:bg-muted-surface ${editor?.isActive("italic") ? "bg-muted-surface text-foreground" : "text-muted"}`}
        >
          <Italic className="h-3.5 w-3.5" />
        </button>
        <div className="mx-1 h-4 w-px bg-border/40" />
        <button
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          title="Bullet list"
          className={`flex h-6 w-6 items-center justify-center rounded text-xs transition hover:bg-muted-surface ${editor?.isActive("bulletList") ? "bg-muted-surface text-foreground" : "text-muted"}`}
        >
          <List className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          title="Numbered list"
          className={`flex h-6 w-6 items-center justify-center rounded text-xs transition hover:bg-muted-surface ${editor?.isActive("orderedList") ? "bg-muted-surface text-foreground" : "text-muted"}`}
        >
          <ListOrdered className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} className="flex min-h-0 flex-1 flex-col overflow-y-auto" />
    </div>
  );
}
