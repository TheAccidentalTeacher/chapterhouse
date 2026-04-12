"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, FileText, Loader2, CheckCircle, XCircle } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase";

interface UploadResult {
  documentId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  extraction: {
    characterCount: number;
    wordCount: number;
    pageCount: number | null;
    tableCount: number | null;
    extractionMethod: string;
  };
}

interface DocumentUploadZoneProps {
  onUploadComplete?: (result: UploadResult) => void;
}

const ALLOWED_EXTENSIONS = [".pdf", ".docx", ".epub", ".txt", ".md"];
const MAX_SIZE = 50 * 1024 * 1024;

export function DocumentUploadZone({ onUploadComplete }: DocumentUploadZoneProps) {
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<UploadResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setResult(null);

      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        setError(`Unsupported file type: ${ext}. Supported: ${ALLOWED_EXTENSIONS.join(", ")}`);
        return;
      }
      if (file.size > MAX_SIZE) {
        setError(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Maximum: 50MB`);
        return;
      }

      setUploading(true);
      try {
        // Step 1: Upload directly to Supabase Storage from the browser.
        // This bypasses Vercel's 4.5MB serverless body limit entirely.
        const supabase = getSupabaseBrowserClient();
        if (!supabase) throw new Error("Storage client not available");

        const storagePath = `uploads/${Date.now()}-${file.name}`;
        const { error: storageError } = await supabase.storage
          .from("documents")
          .upload(storagePath, file, { upsert: false });
        if (storageError) throw new Error(`Storage upload failed: ${storageError.message}`);

        // Step 2: Tell the API the storage path — tiny JSON body, no Vercel limit.
        const res = await fetch("/api/documents/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            storagePath,
            fileName: file.name,
            fileSize: file.size,
            mimeType: file.type,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || res.statusText);

        setResult(data);
        onUploadComplete?.(data);
      } catch (err) {
        setError(String(err instanceof Error ? err.message : err));
      } finally {
        setUploading(false);
      }
    },
    [onUploadComplete]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-8 transition ${
          dragOver
            ? "border-accent bg-accent/10"
            : "border-border/50 bg-muted-surface/30 hover:border-accent/40"
        }`}
      >
        {uploading ? (
          <Loader2 className="h-8 w-8 animate-spin text-accent" />
        ) : (
          <Upload className="h-8 w-8 text-muted" />
        )}
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">
            {uploading ? "Processing…" : "Drop files here or click to browse"}
          </p>
          <p className="mt-1 text-xs text-muted">
            PDF, DOCX, ePub, TXT, MD — up to 50MB
          </p>
        </div>
        <div className="flex gap-2">
          {ALLOWED_EXTENSIONS.map((ext) => (
            <span
              key={ext}
              className="rounded-md bg-muted-surface px-2 py-0.5 text-[10px] font-medium uppercase text-muted"
            >
              {ext.replace(".", "")}
            </span>
          ))}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={ALLOWED_EXTENSIONS.join(",")}
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-red-500/10 px-4 py-2 text-xs text-red-400">
          <XCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {result && (
        <div className="flex items-start gap-3 rounded-xl bg-emerald-500/10 px-4 py-3">
          <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
          <div className="text-xs text-emerald-300">
            <p className="font-medium">{result.fileName} uploaded successfully</p>
            <p className="mt-1 text-emerald-400/80">
              {result.extraction.wordCount.toLocaleString()} words •{" "}
              {result.extraction.characterCount.toLocaleString()} chars
              {result.extraction.pageCount ? ` • ${result.extraction.pageCount} pages` : ""}
              {result.extraction.tableCount ? ` • ${result.extraction.tableCount} tables` : ""} •{" "}
              Extracted via {result.extraction.extractionMethod}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Uploaded document card for the list ─────────────

interface UploadedDoc {
  id: string;
  file_name: string;
  file_type: string;
  file_size: number;
  character_count: number | null;
  word_count: number | null;
  page_count: number | null;
  extraction_method: string | null;
  created_at: string;
}

interface UploadedDocCardProps {
  doc: UploadedDoc;
  onAnalyze: (docId: string) => void;
}

export function UploadedDocCard({ doc, onAnalyze }: UploadedDocCardProps) {
  const typeColors: Record<string, string> = {
    pdf: "bg-red-500/20 text-red-400",
    docx: "bg-amber-500/20 text-amber-400",
    epub: "bg-amber-500/20 text-amber-400",
    txt: "bg-gray-500/20 text-gray-400",
    md: "bg-green-500/20 text-green-400",
  };

  return (
    <div className="glass-panel flex items-start gap-4 rounded-2xl p-4">
      <FileText className="mt-0.5 h-5 w-5 shrink-0 text-muted" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-foreground">{doc.file_name}</p>
          <span
            className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
              typeColors[doc.file_type] || "bg-muted-surface text-muted"
            }`}
          >
            {doc.file_type}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-muted">
          {doc.word_count?.toLocaleString() || "?"} words •{" "}
          {doc.character_count?.toLocaleString() || "?"} chars
          {doc.page_count ? ` • ${doc.page_count} pages` : ""} •{" "}
          {(doc.file_size / 1024).toFixed(0)} KB •{" "}
          {new Date(doc.created_at).toLocaleDateString()}
        </p>
      </div>
      <button
        onClick={() => onAnalyze(doc.id)}
        className="shrink-0 rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-accent-foreground transition hover:opacity-90"
      >
        Analyze
      </button>
    </div>
  );
}
