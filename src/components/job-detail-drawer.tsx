"use client";

import { useEffect, useState } from "react";
import { type Job } from "@/hooks/use-jobs-realtime";
import { X, Download, Copy, Check, FileText, Printer, FileDown } from "lucide-react";
import {
  downloadAsHtml,
  exportAsPdf,
  downloadAsDocx,
} from "@/lib/export-document";

function downloadMarkdown(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-100 transition-colors"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

function OutputViewer({ job }: { job: Job }) {
  const output = job.output as Record<string, unknown> | null;
  if (!output) return null;

  const finalDoc = (output.finalScopeAndSequence as string) ?? null;
  const structuredOutput = (output.structuredOutput as Record<string, unknown>) ?? null;
  const earlReport = (output.operationalAssessment as string) ?? null;
  const beavisReport = (output.engagementReport as string) ?? null;
  const [showDrafts, setShowDrafts] = useState(false);
  const [showStructured, setShowStructured] = useState(false);

  const filename = `${job.label.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.md`;
  const jsonFilename = structuredOutput
    ? `${(structuredOutput.id as string) ?? job.label.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.json`
    : "";
  const docTitle = job.label;

  const exportOptions = earlReport
    ? { includeCouncilReport: true, councilReportMarkdown: earlReport }
    : undefined;

  return (
    <div className="space-y-4">
      {finalDoc && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-zinc-200">Final Scope &amp; Sequence</h4>
            <div className="flex items-center gap-3">
              <CopyButton text={finalDoc} />
              <button
                onClick={() => downloadMarkdown(filename, finalDoc)}
                className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-100 transition-colors"
              >
                <Download size={12} />
                Download .md
              </button>
            </div>
          </div>

          {/* Export toolbar */}
          <div className="flex items-center gap-2 mb-3 p-2.5 bg-zinc-900/60 rounded-lg border border-zinc-800">
            <span className="text-xs text-zinc-500 mr-1">Export:</span>
            <button
              onClick={() => downloadAsHtml(filename, finalDoc, docTitle, exportOptions)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors border border-zinc-700"
              title="Download as styled HTML file"
            >
              <FileText size={12} />
              HTML
            </button>
            <button
              onClick={() => exportAsPdf(finalDoc, docTitle, exportOptions)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors border border-zinc-700"
              title="Open print dialog to save as PDF"
            >
              <Printer size={12} />
              PDF
            </button>
            <button
              onClick={() => downloadAsDocx(filename, finalDoc, docTitle, exportOptions)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors border border-zinc-700"
              title="Download as Word document"
            >
              <FileDown size={12} />
              DOCX
            </button>
          </div>

          <div className="bg-zinc-900 rounded-lg p-4 text-sm text-zinc-300 whitespace-pre-wrap font-mono max-h-96 overflow-y-auto border border-zinc-800">
            {finalDoc}
          </div>
        </div>
      )}

      {structuredOutput && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-semibold text-emerald-400">Pipeline Handoff JSON</h4>
            <div className="flex items-center gap-3">
              <CopyButton text={JSON.stringify(structuredOutput, null, 2)} />
              <button
                onClick={() => downloadJson(jsonFilename, structuredOutput)}
                className="flex items-center gap-1.5 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <Download size={12} />
                Download .json
              </button>
              <button
                onClick={() => setShowStructured((v) => !v)}
                className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                {showStructured ? "▲ Hide" : "▼ Preview"}
              </button>
            </div>
          </div>
          <p className="text-xs text-zinc-500 mb-2">
            Ready for the SomersSchool pipeline — drop this file into <code className="text-zinc-400">scope-sequence/</code>
          </p>
          {showStructured && (
            <div className="bg-zinc-900 rounded-lg p-4 text-xs text-emerald-300/80 whitespace-pre-wrap font-mono max-h-64 overflow-y-auto border border-emerald-900/30">
              {JSON.stringify(structuredOutput, null, 2)}
            </div>
          )}
        </div>
      )}

      {earlReport && (
        <div>
          <h4 className="text-sm font-semibold text-zinc-200 mb-2">
            Earl&apos;s Operational Assessment
          </h4>
          <div className="bg-zinc-900 rounded-lg p-4 text-sm text-zinc-300 whitespace-pre-wrap font-mono max-h-64 overflow-y-auto border border-zinc-800">
            {earlReport}
          </div>
        </div>
      )}

      {beavisReport && (
        <div>
          <h4 className="text-sm font-semibold text-zinc-200 mb-2">
            Beavis &amp; Butthead&apos;s Engagement Report
          </h4>
          <div className="bg-zinc-900 rounded-lg p-4 text-sm text-zinc-300 whitespace-pre-wrap font-mono max-h-64 overflow-y-auto border border-zinc-800">
            {beavisReport}
          </div>
        </div>
      )}

      {!!output.draftsRetained && (
        <div>
          <button
            onClick={() => setShowDrafts((v) => !v)}
            className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            {showDrafts ? "▲ Hide" : "▼ Show"} full Council session (Gandalf draft + Data critique)
          </button>
          {showDrafts && (
            <div className="mt-2 bg-zinc-900 rounded-lg p-4 text-xs text-zinc-400 whitespace-pre-wrap font-mono max-h-64 overflow-y-auto border border-zinc-800">
              {JSON.stringify(output.draftsRetained as Record<string, unknown>, null, 2)}
            </div>
          )}
        </div>
      )}

      {!finalDoc && (
        <div className="bg-zinc-900 rounded-lg p-4 text-sm text-zinc-400 font-mono max-h-96 overflow-y-auto border border-zinc-800 whitespace-pre-wrap">
          {JSON.stringify(output, null, 2)}
        </div>
      )}
    </div>
  );
}

export function JobDetailDrawer({
  job,
  onClose,
}: {
  job: Job | null;
  onClose: () => void;
}) {
  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!job) return null;

  const duration =
    job.started_at && job.completed_at
      ? Math.round(
          (new Date(job.completed_at).getTime() -
            new Date(job.started_at).getTime()) /
            1000
        )
      : null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-zinc-950 border-l border-zinc-800 z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-zinc-800">
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-zinc-100 truncate">{job.label}</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-xs text-zinc-500">{job.type}</span>
              <span className="text-xs text-zinc-600">•</span>
              <span className="text-xs text-zinc-500">id: {job.id.slice(0, 8)}...</span>
              {duration && (
                <>
                  <span className="text-xs text-zinc-600">•</span>
                  <span className="text-xs text-zinc-500">{duration}s</span>
                </>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-100 transition-colors ml-3 shrink-0"
          >
            <X size={18} />
          </button>
        </div>

        {/* Progress */}
        {(job.status === "running" || job.status === "queued") && (
          <div className="px-5 py-3 border-b border-zinc-800">
            <div className="flex justify-between text-xs text-zinc-500 mb-1.5">
              <span>{job.progress_message ?? "Waiting..."}</span>
              <span>{job.progress}%</span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  job.status === "running" ? "bg-amber-500" : "bg-zinc-600"
                }`}
                style={{ width: `${job.progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error */}
        {job.status === "failed" && job.error && (
          <div className="px-5 py-3 border-b border-zinc-800 bg-red-950/30">
            <p className="text-xs font-semibold text-red-400 mb-1">Error</p>
            <p className="text-xs text-red-300 font-mono">{job.error}</p>
          </div>
        )}

        {/* Output */}
        <div className="flex-1 overflow-y-auto p-5">
          {job.status === "completed" ? (
            <OutputViewer job={job} />
          ) : job.status === "running" ? (
            <div className="text-sm text-zinc-500 text-center py-12">
              Working... progress updates appear live above.
            </div>
          ) : job.status === "queued" ? (
            <div className="text-sm text-zinc-500 text-center py-12">
              Job is queued — waiting for the Railway worker to pick it up.
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
