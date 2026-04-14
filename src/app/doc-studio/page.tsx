"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  DOC_TYPES,
  DOC_CATEGORIES,
  DOC_TYPE_MAP,
  type DocTypeDefinition,
  type DocField,
} from "@/lib/doc-type-prompts";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Copy,
  Check,
  Save,
  Loader2,
  FileText,
  Sparkles,
  RotateCcw,
  Download,
  FileDown,
  ListOrdered,
  Pencil,
  History,
  ArrowUp,
  ArrowDown,
  X,
} from "lucide-react";
import { downloadAsDocx, exportAsPdf } from "@/lib/export-document";

// ── Category grouping ─────────────────────────────────────────────────────────

type CategoryId = (typeof DOC_CATEGORIES)[number]["id"];

const CATEGORY_COLORS: Record<CategoryId, string> = {
  strategy:   "text-amber-400",
  writing:    "text-sky-400",
  planning:   "text-emerald-400",
  research:   "text-violet-400",
  brainstorm: "text-rose-400",
};

// ── Field renderer ────────────────────────────────────────────────────────────

function FieldInput({
  field,
  value,
  onChange,
  availableDocs = [],
}: {
  field: DocField;
  value: string;
  onChange: (val: string) => void;
  availableDocs?: { id: string; title: string }[];
}) {
  const base =
    "w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50";

  if (field.type === "textarea") {
    return (
      <textarea
        className={`${base} h-28 resize-none`}
        placeholder={field.placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={field.required}
      />
    );
  }

  if (field.type === "select") {
    return (
      <select
        className={base}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={field.required}
      >
        <option value="">Select…</option>
        {field.options?.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === "document_picker") {
    return (
      <select
        className={base}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={field.required}
      >
        <option value="">— select a document —</option>
        {availableDocs.map((doc) => (
          <option key={doc.id} value={doc.id}>
            {doc.title}
          </option>
        ))}
      </select>
    );
  }

  return (
    <input
      type="text"
      className={base}
      placeholder={field.placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required={field.required}
    />
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function DocStudioPage() {
  const [selectedType, setSelectedType] = useState<DocTypeDefinition | null>(null);
  const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
    strategy: true,
    writing:  true,
    planning: true,
    research: false,
    brainstorm: false,
  });
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [output, setOutput] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);
  const [recentDocs, setRecentDocs] = useState<
    { id: string; doc_type: string; title: string; created_at: string }[]
  >([]);
  const [availableDocs, setAvailableDocs] = useState<
    { id: string; title: string; doc_type: string }[]
  >([]);
  const [brandVoiceId, setBrandVoiceId] = useState<string>("");
  const [brandVoices, setBrandVoices] = useState<{ id: string; brand: string }[]>([]);
  // Phase 21A: Outline-first generation
  const [outlineFirst, setOutlineFirst] = useState(false);
  const [outline, setOutline] = useState<{ id: string; title: string; guidance: string; sort_order: number }[] | null>(null);
  const [isOutlining, setIsOutlining] = useState(false);
  // Phase 21B: Agentic editing
  const [editInstruction, setEditInstruction] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [docVersion, setDocVersion] = useState(1);
  const [editHistory, setEditHistory] = useState<{ version: number; instruction: string; changed_at: string; previous_content: string }[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [currentDocId, setCurrentDocId] = useState<string | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    fetch("/api/brand-voices")
      .then((r) => (r.ok ? r.json() : { voices: [] }))
      .then((data) => setBrandVoices(Array.isArray(data) ? data : data.voices ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/documents/list?limit=50")
      .then((r) => (r.ok ? r.json() : { documents: [] }))
      .then((data) => setAvailableDocs(data.documents ?? []))
      .catch(() => {});
  }, []);

  // ── Type selection ──────────────────────────────────────────────────────────

  const handleSelectType = useCallback((def: DocTypeDefinition) => {
    setSelectedType(def);
    setInputs({});
    setOutput("");
    setError(null);
    setIsSaved(false);
    setSavedId(null);
    setOutline(null);
    setEditInstruction("");
    setDocVersion(1);
    setEditHistory([]);
    setShowHistory(false);
    setCurrentDocId(null);
  }, []);

  // ── Generate ────────────────────────────────────────────────────────────────

  const handleGenerate = useCallback(
    async (saveAfter = false) => {
      if (!selectedType) return;

      // Validate required fields
      const missing = selectedType.fields
        .filter((f) => f.required && !inputs[f.key]?.trim())
        .map((f) => f.label);
      if (missing.length > 0) {
        setError(`Required: ${missing.join(", ")}`);
        return;
      }

      setError(null);
      setIsGenerating(true);
      setOutput("");
      setIsSaved(false);
      setSavedId(null);

      abortRef.current = new AbortController();

      try {
        const res = await fetch("/api/documents/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            doc_type: selectedType.id,
            inputs,
            save: saveAfter,
            ...(brandVoiceId ? { brand_voice_id: brandVoiceId } : {}),
            ...(outline ? { outline: { sections: outline } } : {}),
          }),
          signal: abortRef.current.signal,
        });

        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `HTTP ${res.status}`);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          accumulated += chunk;
          setOutput(accumulated);
          // Auto-scroll output area
          if (outputRef.current) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight;
          }
        }

        if (saveAfter) {
          setIsSaved(true);
          // Refresh recent docs after save
          fetchRecentDocs();
        }
      } catch (err: unknown) {
        if ((err as Error)?.name !== "AbortError") {
          setError((err as Error).message || "Generation failed");
        }
      } finally {
        setIsGenerating(false);
      }
    },
    [selectedType, inputs]
  );

  // ── Copy to clipboard ───────────────────────────────────────────────────────

  const handleCopy = useCallback(async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }, [output]);

  // Phase 21A: Generate outline
  const handleGenerateOutline = useCallback(async () => {
    if (!selectedType) return;
    setIsOutlining(true);
    setError(null);
    try {
      const title = inputs.feature_name || inputs.product || inputs.topic || inputs.thesis || selectedType.label;
      const res = await fetch("/api/documents/outline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doc_type: selectedType.id,
          title,
          fields: inputs,
          ...(brandVoiceId ? { brand_voice_id: brandVoiceId } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Outline failed");
      setOutline(data.outline.sections);
    } catch (err: unknown) {
      setError((err as Error).message || "Outline generation failed");
    } finally {
      setIsOutlining(false);
    }
  }, [selectedType, inputs, brandVoiceId]);

  // Phase 21A: Move outline section
  const moveOutlineSection = useCallback((index: number, direction: "up" | "down") => {
    if (!outline) return;
    const newOutline = [...outline];
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= newOutline.length) return;
    [newOutline[index], newOutline[target]] = [newOutline[target], newOutline[index]];
    setOutline(newOutline.map((s, i) => ({ ...s, sort_order: i + 1 })));
  }, [outline]);

  // Phase 21B: Agentic edit
  const handleEdit = useCallback(async () => {
    if (!currentDocId || !editInstruction.trim()) return;
    setIsEditing(true);
    setError(null);
    try {
      const res = await fetch("/api/documents/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          document_id: currentDocId,
          instruction: editInstruction,
          expected_version: docVersion,
        }),
      });
      const data = await res.json();
      if (res.status === 409) {
        setError(`Version conflict: ${data.error}`);
        return;
      }
      if (!res.ok) throw new Error(data.error || "Edit failed");
      // Save previous version to local history
      setEditHistory((prev) => [...prev, { version: docVersion, instruction: editInstruction, changed_at: new Date().toISOString(), previous_content: output }]);
      setOutput(data.content);
      setDocVersion(data.version);
      setEditInstruction("");
    } catch (err: unknown) {
      setError((err as Error).message || "Edit failed");
    } finally {
      setIsEditing(false);
    }
  }, [currentDocId, editInstruction, docVersion, output]);

  // Phase 21B: Revert to previous version
  const handleRevert = useCallback((entry: { previous_content: string; version: number }) => {
    setOutput(entry.previous_content);
    setDocVersion(entry.version);
    setShowHistory(false);
  }, []);

  const [showExportMenu, setShowExportMenu] = useState(false);

  const handleExport = useCallback(
    (format: "md" | "docx" | "pdf") => {
      if (!output) return;
      setShowExportMenu(false);
      const title = selectedType?.label ?? "document";

      if (format === "md") {
        const blob = new Blob([output], { type: "text/markdown;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${title}.md`;
        a.click();
        URL.revokeObjectURL(url);
      } else if (format === "docx") {
        downloadAsDocx(`${title}.docx`, output, title);
      } else if (format === "pdf") {
        exportAsPdf(output, title);
      }
    },
    [output, selectedType]
  );

  // ── Save existing output ────────────────────────────────────────────────────

  const handleSaveExisting = useCallback(async () => {
    if (!selectedType || !output) return;
    try {
      const res = await fetch("/api/documents/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doc_type: selectedType.id,
          inputs,
          save: true,
          // Pass existing output as pre-filled content  
          // — actually we need a dedicated save endpoint. For now regenerate+save.
        }),
      });
      if (res.ok) {
        setIsSaved(true);
        fetchRecentDocs();
      }
    } catch { /* ignore */ }
  }, [selectedType, output, inputs]);

  // ── Recent docs ─────────────────────────────────────────────────────────────

  const fetchRecentDocs = useCallback(async () => {
    try {
      const res = await fetch("/api/documents/list?limit=10");
      if (res.ok) {
        const data = await res.json();
        setRecentDocs(data.documents ?? []);
      }
    } catch { /* ignore */ }
  }, []);

  const handleDeleteDoc = useCallback(
    async (id: string) => {
      await fetch(`/api/documents/${id}`, { method: "DELETE" });
      setRecentDocs((prev) => prev.filter((d) => d.id !== id));
    },
    []
  );

  // ── Category toggle ─────────────────────────────────────────────────────────

  const toggleCategory = useCallback((id: string) => {
    setOpenCategories((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  // ── Derived ─────────────────────────────────────────────────────────────────

  const docsByCategory = DOC_CATEGORIES.map((cat) => ({
    ...cat,
    items: DOC_TYPES.filter((d) => d.category === cat.id),
  }));

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full min-h-0 bg-background">
      {/* ── Left sidebar: type picker ───────────────────────────────────────── */}
      <aside className="w-64 flex-none border-r border-zinc-800 flex flex-col overflow-y-auto">
        <div className="px-4 pt-5 pb-3">
          <h1 className="text-sm font-semibold text-amber-400 tracking-wide uppercase">
            Doc Studio
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            15 document generators
          </p>
        </div>

        {/* Type categories */}
        <div className="flex-1 px-2 pb-4 space-y-1">
          {docsByCategory.map((cat) => (
            <div key={cat.id}>
              <button
                className="w-full flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200 rounded"
                onClick={() => toggleCategory(cat.id)}
              >
                {openCategories[cat.id] ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
                <span className="mr-0.5">{cat.icon}</span>
                {cat.label}
              </button>
              {openCategories[cat.id] && (
                <div className="ml-2 space-y-0.5">
                  {cat.items.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => handleSelectType(doc)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs leading-snug transition-colors ${
                        selectedType?.id === doc.id
                          ? "bg-amber-500/10 text-amber-300 border border-amber-500/30"
                          : "text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
                      }`}
                    >
                      <span className="mr-1.5">{doc.icon}</span>
                      {doc.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Recent docs */}
        {recentDocs.length > 0 && (
          <div className="border-t border-zinc-800 px-4 py-3">
            <p className="text-xs font-medium text-zinc-500 mb-2 uppercase tracking-wide">
              Recent
            </p>
            <div className="space-y-1">
              {recentDocs.slice(0, 6).map((doc) => {
                const def = DOC_TYPE_MAP[doc.doc_type];
                return (
                  <div
                    key={doc.id}
                    className="flex items-center gap-1.5 group"
                  >
                    <button
                      className="flex-1 text-left text-xs text-zinc-400 hover:text-amber-300 truncate"
                      onClick={() => {
                        if (def) handleSelectType(def);
                      }}
                    >
                      <span className="mr-1">{def?.icon ?? "📄"}</span>
                      {doc.title}
                    </button>
                    <button
                      className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-opacity"
                      onClick={() => handleDeleteDoc(doc.id)}
                      title="Delete"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </aside>

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <main className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {!selectedType ? (
          /* ── Empty state ── */
          <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
            <div className="text-4xl mb-4">📄</div>
            <h2 className="text-lg font-semibold text-zinc-200 mb-2">
              Pick a document type
            </h2>
            <p className="text-sm text-zinc-500 max-w-sm">
              Full Scott context is pre-loaded into every generation. Brand voice, pricing, deadlines, decisions — all in.
            </p>
            <div className="mt-6 grid grid-cols-3 gap-3 max-w-lg">
              {DOC_TYPES.slice(0, 6).map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => handleSelectType(doc)}
                  className="p-3 rounded-xl border border-zinc-800 hover:border-amber-500/40 hover:bg-zinc-800/60 text-left transition-colors"
                >
                  <div className="text-2xl mb-1.5">{doc.icon}</div>
                  <div className="text-xs font-medium text-zinc-300 leading-snug">
                    {doc.label}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* ── Two-column: form + output ── */
          <div className="flex flex-1 min-h-0 gap-0">
            {/* Form panel */}
            <div className="w-96 flex-none border-r border-zinc-800 overflow-y-auto px-5 py-5">
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">{selectedType.icon}</span>
                  <h2 className="text-base font-semibold text-zinc-100">
                    {selectedType.label}
                  </h2>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  {selectedType.description}
                </p>
                {selectedType.useCouncilDefault && (
                  <div className="mt-2 text-xs text-amber-500/80 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Council-recommended for this type
                  </div>
                )}
              </div>

              {/* Fields */}
              <div className="space-y-4">
                {selectedType.fields.map((field) => (
                  <div key={field.key}>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      {field.label}
                      {field.required && (
                        <span className="text-amber-400 ml-1">*</span>
                      )}
                    </label>
                    <FieldInput
                      field={field}
                      value={inputs[field.key] ?? ""}
                      onChange={(val) =>
                        setInputs((prev) => ({ ...prev, [field.key]: val }))
                      }
                      availableDocs={availableDocs}
                    />
                  </div>
                ))}
              </div>

              {/* Error */}
              {error && (
                <div className="mt-3 rounded-lg bg-red-950/40 border border-red-800/40 px-3 py-2 text-xs text-red-300">
                  {error}
                </div>
              )}

              {/* Brand Voice Selector */}
              {brandVoices.length > 0 && (
                <div className="mt-4">
                  <label className="block text-xs text-zinc-500 mb-1.5">
                    Brand Voice (optional)
                  </label>
                  <select
                    value={brandVoiceId}
                    onChange={(e) => setBrandVoiceId(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500/50 focus:border-amber-500/50"
                  >
                    <option value="">None (default voice)</option>
                    {brandVoices.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.brand.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Phase 21A: Outline toggle */}
              <div className="mt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={outlineFirst}
                    onChange={(e) => {
                      setOutlineFirst(e.target.checked);
                      if (!e.target.checked) setOutline(null);
                    }}
                    className="rounded border-zinc-600 bg-zinc-800 text-amber-500 focus:ring-amber-500/50"
                  />
                  <span className="text-xs text-zinc-400 flex items-center gap-1">
                    <ListOrdered className="w-3 h-3" />
                    Generate outline first
                  </span>
                </label>
              </div>

              {/* Phase 21A: Outline cards */}
              {outline && outline.length > 0 && (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-medium text-amber-400 uppercase tracking-wide">
                    Outline — reorder or edit below
                  </p>
                  {outline.map((section, idx) => (
                    <div
                      key={section.id}
                      className="flex items-start gap-2 bg-zinc-800/60 border border-zinc-700/50 rounded-lg p-2.5"
                    >
                      <div className="flex flex-col gap-0.5 pt-0.5">
                        <button
                          onClick={() => moveOutlineSection(idx, "up")}
                          disabled={idx === 0}
                          className="text-zinc-500 hover:text-amber-300 disabled:opacity-20"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => moveOutlineSection(idx, "down")}
                          disabled={idx === outline.length - 1}
                          className="text-zinc-500 hover:text-amber-300 disabled:opacity-20"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                      </div>
                      <div className="flex-1 min-w-0">
                        <input
                          className="w-full bg-transparent text-xs font-medium text-zinc-200 focus:outline-none focus:text-amber-200"
                          value={section.title}
                          onChange={(e) => {
                            const updated = [...outline];
                            updated[idx] = { ...updated[idx], title: e.target.value };
                            setOutline(updated);
                          }}
                        />
                        <input
                          className="w-full bg-transparent text-xs text-zinc-500 focus:outline-none focus:text-zinc-300 mt-0.5"
                          value={section.guidance}
                          onChange={(e) => {
                            const updated = [...outline];
                            updated[idx] = { ...updated[idx], guidance: e.target.value };
                            setOutline(updated);
                          }}
                        />
                      </div>
                      <button
                        onClick={() => setOutline(outline.filter((_, i) => i !== idx))}
                        className="text-zinc-600 hover:text-red-400 mt-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Actions */}
              <div className="mt-5 flex flex-col gap-2">
                {outlineFirst && !outline ? (
                  <button
                    onClick={handleGenerateOutline}
                    disabled={isOutlining}
                    className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium bg-amber-500 hover:bg-amber-400 text-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isOutlining ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating outline…
                      </>
                    ) : (
                      <>
                        <ListOrdered className="w-4 h-4" />
                        Generate Outline
                      </>
                    )}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => handleGenerate(false)}
                      disabled={isGenerating}
                      className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium bg-amber-500 hover:bg-amber-400 text-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Generating…
                        </>
                      ) : (
                        <>
                          <FileText className="w-4 h-4" />
                          {outline ? "Generate from Outline" : "Generate"}
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleGenerate(true)}
                      disabled={isGenerating}
                      className="w-full flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium border border-zinc-700 text-zinc-300 hover:border-amber-500/40 hover:text-amber-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <Save className="w-3.5 h-3.5" />
                      Generate &amp; Save
                    </button>
                  </>
                )}

                {outline && (
                  <button
                    onClick={() => setOutline(null)}
                    className="w-full text-xs text-zinc-600 hover:text-zinc-400 transition-colors"
                  >
                    Skip outline — generate directly
                  </button>
                )}

                {isGenerating && (
                  <button
                    onClick={() => abortRef.current?.abort()}
                    className="w-full flex items-center justify-center gap-2 rounded-lg py-2 text-xs text-zinc-500 hover:text-red-400 transition-colors"
                  >
                    Cancel
                  </button>
                )}

                <button
                  onClick={() => {
                    setInputs({});
                    setOutput("");
                    setError(null);
                    setIsSaved(false);
                    setSavedId(null);
                    setOutline(null);
                    setDocVersion(1);
                    setEditHistory([]);
                    setCurrentDocId(null);
                  }}
                  className="w-full flex items-center justify-center gap-1.5 text-xs text-zinc-600 hover:text-zinc-400 transition-colors mt-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Clear
                </button>
              </div>
            </div>

            {/* Output panel */}
            <div className="flex-1 min-w-0 flex flex-col">
              {/* Output toolbar */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-medium uppercase tracking-wide ${
                      CATEGORY_COLORS[selectedType.category as CategoryId] ??
                      "text-zinc-400"
                    }`}
                  >
                    {selectedType.label}
                  </span>
                  {isSaved && (
                    <span className="text-xs text-emerald-400 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Saved
                    </span>
                  )}
                  {docVersion > 1 && (
                    <span className="text-xs text-zinc-500">
                      v{docVersion} · {editHistory.length} edit{editHistory.length !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {output && !isGenerating && (
                    <>
                      <button
                        onClick={handleCopy}
                        className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-amber-300 transition-colors"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            Copy
                          </>
                        )}
                      </button>
                      {!isSaved && (
                        <button
                          onClick={handleSaveExisting}
                          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-amber-300 transition-colors"
                        >
                          <Save className="w-3.5 h-3.5" />
                          Save
                        </button>
                      )}
                      <div className="relative">
                        <button
                          onClick={() => setShowExportMenu((v) => !v)}
                          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-amber-300 transition-colors"
                        >
                          <FileDown className="w-3.5 h-3.5" />
                          Export
                          <ChevronDown className="w-3 h-3" />
                        </button>
                        {showExportMenu && (
                          <div className="absolute right-0 top-full mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-20 min-w-[140px] py-1">
                            <button
                              onClick={() => handleExport("md")}
                              className="w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700 hover:text-amber-300"
                            >
                              Markdown (.md)
                            </button>
                            <button
                              onClick={() => handleExport("docx")}
                              className="w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700 hover:text-amber-300"
                            >
                              Word (.docx)
                            </button>
                            <button
                              onClick={() => handleExport("pdf")}
                              className="w-full text-left px-3 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700 hover:text-amber-300"
                            >
                              PDF (Print)
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Output content */}
              <div
                ref={outputRef}
                className="flex-1 overflow-y-auto px-6 py-5"
              >
                {!output && !isGenerating && (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="text-3xl mb-3 opacity-30">
                      {selectedType.icon}
                    </div>
                    <p className="text-sm text-zinc-600">
                      Fill in the fields and hit Generate
                    </p>
                  </div>
                )}
                {(output || isGenerating) && (
                  <div className="prose prose-sm prose-invert max-w-none prose-headings:text-amber-300 prose-a:text-amber-400 prose-strong:text-zinc-100 prose-code:text-amber-200 prose-code:bg-zinc-800 prose-code:px-1 prose-code:rounded prose-pre:bg-zinc-900 prose-pre:border prose-pre:border-zinc-800">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {output}
                    </ReactMarkdown>
                    {isGenerating && (
                      <span className="inline-block w-2 h-4 bg-amber-400 animate-pulse ml-0.5 align-middle" />
                    )}
                  </div>
                )}
              </div>

              {/* Phase 21B: Edit bar */}
              {output && !isGenerating && currentDocId && (
                <div className="border-t border-zinc-800 px-5 py-3 flex items-center gap-2">
                  <Pencil className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                  <input
                    type="text"
                    value={editInstruction}
                    onChange={(e) => setEditInstruction(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && editInstruction.trim()) handleEdit(); }}
                    placeholder="Edit this document... (e.g. 'Make the introduction shorter')"
                    className="flex-1 bg-transparent text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
                  />
                  <button
                    onClick={handleEdit}
                    disabled={isEditing || !editInstruction.trim()}
                    className="flex items-center gap-1.5 rounded-lg bg-amber-500/20 px-3 py-1.5 text-xs font-medium text-amber-300 hover:bg-amber-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isEditing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Pencil className="w-3 h-3" />}
                    Apply
                  </button>
                  {editHistory.length > 0 && (
                    <button
                      onClick={() => setShowHistory(!showHistory)}
                      className="flex items-center gap-1 text-xs text-zinc-500 hover:text-amber-300"
                    >
                      <History className="w-3 h-3" />
                      Revert
                    </button>
                  )}
                </div>
              )}

              {/* Phase 21B: Edit history panel */}
              {showHistory && editHistory.length > 0 && (
                <div className="border-t border-zinc-800 px-5 py-3 bg-zinc-900/50 max-h-40 overflow-y-auto">
                  <p className="text-xs font-medium text-zinc-500 mb-2 uppercase tracking-wide">Edit History</p>
                  {[...editHistory].reverse().map((entry, idx) => (
                    <div key={idx} className="flex items-center justify-between py-1.5 border-b border-zinc-800/50 last:border-0">
                      <div className="min-w-0">
                        <p className="text-xs text-zinc-300 truncate">{entry.instruction}</p>
                        <p className="text-xs text-zinc-600">v{entry.version} · {new Date(entry.changed_at).toLocaleTimeString()}</p>
                      </div>
                      <button
                        onClick={() => handleRevert(entry)}
                        className="text-xs text-amber-400 hover:text-amber-300 shrink-0 ml-2"
                      >
                        Restore
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
