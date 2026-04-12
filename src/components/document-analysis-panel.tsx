"use client";

import { useState } from "react";
import { Loader2, Copy, Download, BookOpen } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const ANALYSIS_TYPES = [
  { id: "summary", label: "Summary", description: "Executive summary with thesis and conclusions" },
  { id: "key-findings", label: "Key Findings", description: "Organized bullet points by theme" },
  { id: "curriculum-map", label: "Curriculum Map", description: "Map content to education standards" },
  { id: "chapter-outline", label: "Chapter Outline", description: "Section-by-section outline" },
  { id: "vocabulary", label: "Vocabulary", description: "Key terms with definitions" },
  { id: "discussion-guide", label: "Discussion Guide", description: "Questions and activities" },
  { id: "critique", label: "Critique", description: "Academic critical analysis" },
  { id: "full-analysis", label: "Full Analysis", description: "Comprehensive multi-section report" },
  { id: "custom", label: "Ask Anything", description: "Your own instruction" },
] as const;

interface DocumentAnalysisPanelProps {
  documentId: string;
  fileName: string;
  onClose: () => void;
}

export function DocumentAnalysisPanel({
  documentId,
  fileName,
  onClose,
}: DocumentAnalysisPanelProps) {
  const [analysisType, setAnalysisType] = useState<string>("summary");
  const [gradeLevel, setGradeLevel] = useState<number | "">("");
  const [subject, setSubject] = useState("");
  const [maxLength, setMaxLength] = useState<"brief" | "standard" | "detailed">("standard");
  const [customPrompt, setCustomPrompt] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<{
    inputTokens: number;
    outputTokens: number;
    model: string;
  } | null>(null);

  async function handleAnalyze() {
    setAnalyzing(true);
    setError(null);
    setResult(null);
    setMetadata(null);

    try {
      const res = await fetch("/api/documents/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          documentId,
          analysisType,
          gradeLevel: gradeLevel || undefined,
          subject: subject || undefined,
          maxLength,
          customPrompt: analysisType === "custom" ? customPrompt : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);

      setResult(data.analysis);
      setMetadata(data.metadata);
    } catch (err) {
      setError(String(err instanceof Error ? err.message : err));
    } finally {
      setAnalyzing(false);
    }
  }

  function handleCopy() {
    if (result) navigator.clipboard.writeText(result);
  }

  function handleDownload() {
    if (!result) return;
    const blob = new Blob([result], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${fileName}-${analysisType}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="glass-panel space-y-4 rounded-3xl p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-semibold text-foreground">Analyze: {fileName}</h3>
        </div>
        <button
          onClick={onClose}
          className="text-xs text-muted hover:text-foreground transition"
        >
          Close
        </button>
      </div>

      {/* Analysis type selector */}
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {ANALYSIS_TYPES.map((t) => (
          <button
            key={t.id}
            onClick={() => setAnalysisType(t.id)}
            className={`rounded-xl px-3 py-2 text-left transition ${
              analysisType === t.id
                ? "bg-accent text-accent-foreground"
                : "bg-muted-surface text-muted hover:text-foreground"
            }`}
          >
            <p className="text-xs font-medium">{t.label}</p>
            <p className="mt-0.5 text-[10px] opacity-70">{t.description}</p>
          </button>
        ))}
      </div>

      {/* Custom prompt textarea */}
      {analysisType === "custom" && (
        <textarea
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder="Type your instruction — e.g. 'Create a 2-page study guide on Revelation chapter 20 from a Reformed Baptist perspective, leaning toward historical premillennialism.'"
          rows={4}
          className="w-full rounded-xl border border-border/70 bg-muted-surface px-3 py-2.5 text-xs text-foreground placeholder:text-muted focus:border-accent/40 focus:outline-none resize-none"
        />
      )}

      {/* Options row */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={gradeLevel}
          onChange={(e) =>
            setGradeLevel(e.target.value ? Number(e.target.value) : "")
          }
          className="rounded-lg border border-border/70 bg-muted-surface px-3 py-1.5 text-xs text-foreground focus:border-accent/40 focus:outline-none"
        >
          <option value="">Grade (optional)</option>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              Grade {i + 1}
            </option>
          ))}
        </select>

        <input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Subject (optional)"
          className="rounded-lg border border-border/70 bg-muted-surface px-3 py-1.5 text-xs text-foreground placeholder:text-muted focus:border-accent/40 focus:outline-none"
        />

        <select
          value={maxLength}
          onChange={(e) =>
            setMaxLength(e.target.value as "brief" | "standard" | "detailed")
          }
          className="rounded-lg border border-border/70 bg-muted-surface px-3 py-1.5 text-xs text-foreground focus:border-accent/40 focus:outline-none"
        >
          <option value="brief">Brief</option>
          <option value="standard">Standard</option>
          <option value="detailed">Detailed</option>
        </select>

        <button
          onClick={handleAnalyze}
          disabled={analyzing || (analysisType === "custom" && !customPrompt.trim())}
          className="flex items-center gap-2 rounded-xl bg-accent px-4 py-1.5 text-xs font-medium text-accent-foreground shadow shadow-accent/25 transition hover:opacity-90 disabled:opacity-40"
        >
          {analyzing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <BookOpen className="h-3.5 w-3.5" />
          )}
          {analyzing ? "Analyzing…" : "Analyze"}
        </button>
      </div>

      {error && <p className="text-xs text-red-400">{error}</p>}

      {/* Results */}
      {result && (
        <div className="space-y-3">
          {/* Metadata bar */}
          {metadata && (
            <div className="flex items-center gap-4 text-[10px] text-muted">
              <span>Model: {metadata.model}</span>
              <span>In: {metadata.inputTokens.toLocaleString()} tokens</span>
              <span>Out: {metadata.outputTokens.toLocaleString()} tokens</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 rounded-lg bg-muted-surface px-3 py-1 text-xs text-muted hover:text-foreground transition"
            >
              <Copy className="h-3 w-3" />
              Copy
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1 rounded-lg bg-muted-surface px-3 py-1 text-xs text-muted hover:text-foreground transition"
            >
              <Download className="h-3 w-3" />
              Download
            </button>
          </div>

          {/* Rendered output */}
          <div className="rounded-2xl border border-border/40 bg-muted-surface/50 p-4">
            <div className="prose prose-invert prose-sm max-w-none text-foreground/90">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{result}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
