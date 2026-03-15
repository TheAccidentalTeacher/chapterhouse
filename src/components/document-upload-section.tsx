"use client";

import { useEffect, useState } from "react";
import { DocumentUploadZone, UploadedDocCard } from "@/components/document-upload-zone";
import { DocumentAnalysisPanel } from "@/components/document-analysis-panel";

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

export function DocumentUploadSection() {
  const [docs, setDocs] = useState<UploadedDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzingDocId, setAnalyzingDocId] = useState<string | null>(null);
  const [analyzingFileName, setAnalyzingFileName] = useState<string>("");

  async function fetchDocs() {
    try {
      const res = await fetch("/api/documents/upload");
      const data = await res.json();
      setDocs(data.documents ?? []);
    } catch {
      // Table may not exist yet
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDocs();
  }, []);

  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
          Upload & Analyze Documents
        </p>
        <p className="mt-1 text-xs text-muted">
          Upload PDFs, DOCX, ePub, or text files for AI-powered extraction and analysis. Full documents analyzed with Claude&apos;s 1M token context — no chunking needed.
        </p>
      </div>

      <DocumentUploadZone
        onUploadComplete={() => fetchDocs()}
      />

      {/* Analysis panel */}
      {analyzingDocId && (
        <DocumentAnalysisPanel
          documentId={analyzingDocId}
          fileName={analyzingFileName}
          onClose={() => setAnalyzingDocId(null)}
        />
      )}

      {/* Uploaded document list */}
      {loading ? (
        <p className="text-xs text-muted">Loading uploaded documents…</p>
      ) : docs.length > 0 ? (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
            Uploaded Documents ({docs.length})
          </p>
          {docs.map((doc) => (
            <UploadedDocCard
              key={doc.id}
              doc={doc}
              onAnalyze={(id) => {
                setAnalyzingDocId(id);
                setAnalyzingFileName(doc.file_name);
              }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
