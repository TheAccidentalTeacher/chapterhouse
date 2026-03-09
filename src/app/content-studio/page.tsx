"use client";

import { useState } from "react";
import { Loader2, Copy, Check, Sparkles } from "lucide-react";
import { PageFrame } from "@/components/page-frame";

// ── Types ──────────────────────────────────────────────────────────────────────

type Mode = "newsletter" | "curriculum-guide" | "product-description";

const TABS: { key: Mode; label: string; description: string }[] = [
  { key: "newsletter", label: "Newsletter / Campaign", description: "Email drafts and campaign briefs grounded in brand voice" },
  { key: "curriculum-guide", label: "Curriculum Guide", description: "Book companion guides — discussion questions, units, or activities" },
  { key: "product-description", label: "Product Description", description: "Shopify-ready copy with headline, body, bullets, and meta" },
];

const GRADE_OPTIONS = ["Pre-K–K", "K–2", "3–5", "6–8", "9–12", "Adult", "General"];

// ── Copy button ────────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-1.5 rounded-full border border-border/70 px-3 py-1 text-xs text-muted transition hover:border-accent/40 hover:text-accent"
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied" : "Copy"}
    </button>
  );
}

// ── Output panel ───────────────────────────────────────────────────────────────

function OutputPanel({ text, loading }: { text: string; loading: boolean }) {
  if (loading) {
    return (
      <div className="glass-panel rounded-3xl p-8 flex items-center justify-center gap-3 text-muted min-h-[200px]">
        <Loader2 className="h-5 w-5 animate-spin" />
        Generating…
      </div>
    );
  }
  if (!text) return null;

  return (
    <div className="glass-panel rounded-3xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">Output</p>
        <CopyButton text={text} />
      </div>
      <pre className="whitespace-pre-wrap font-sans text-sm leading-7 text-foreground">{text}</pre>
    </div>
  );
}

// ── Newsletter Form ────────────────────────────────────────────────────────────

function NewsletterForm({ onResult }: { onResult: (t: string) => void }) {
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");
  const [format, setFormat] = useState<"newsletter" | "campaign">("newsletter");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    onResult("");
    const res = await fetch("/api/content-studio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "newsletter", topic, notes, format }),
    });
    const data = await res.json();
    onResult(data.text ?? data.error ?? "No output.");
    setLoading(false);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="flex gap-2">
        {(["newsletter", "campaign"] as const).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFormat(f)}
            className={`rounded-full border px-3 py-1 text-xs font-medium transition capitalize ${
              format === f
                ? "border-accent/40 bg-accent/10 text-accent"
                : "border-border/70 text-muted hover:text-foreground"
            }`}
          >
            {f === "newsletter" ? "Email newsletter" : "Campaign brief"}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-medium uppercase tracking-wide text-muted">Topic / hook *</label>
        <input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="e.g. 'Back to homeschool season — why August matters'"
          required
          className="w-full rounded-xl border border-border/60 bg-muted-surface px-4 py-2.5 text-sm placeholder:text-muted focus:border-accent/50 focus:outline-none"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-medium uppercase tracking-wide text-muted">Additional context</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any specific products, research signals, or angles to emphasize (optional)"
          rows={3}
          className="w-full resize-none rounded-xl border border-border/60 bg-muted-surface px-4 py-2.5 text-sm placeholder:text-muted focus:border-accent/50 focus:outline-none"
        />
      </div>

      <GenerateButton loading={loading} />
    </form>
  );
}

// ── Curriculum Guide Form ──────────────────────────────────────────────────────

function CurriculumGuideForm({ onResult }: { onResult: (t: string) => void }) {
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [gradeRange, setGradeRange] = useState("General");
  const [guideType, setGuideType] = useState<"discussion" | "unit" | "activities">("discussion");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    onResult("");
    const res = await fetch("/api/content-studio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "curriculum-guide", title, author, gradeRange, guideType }),
    });
    const data = await res.json();
    onResult(data.text ?? data.error ?? "No output.");
    setLoading(false);
  }

  const guideTypes = [
    { key: "discussion", label: "Discussion questions" },
    { key: "unit", label: "Full unit study" },
    { key: "activities", label: "Activity set" },
  ] as const;

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className="block text-xs font-medium uppercase tracking-wide text-muted">Book title *</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Charlotte's Web"
            required
            className="w-full rounded-xl border border-border/60 bg-muted-surface px-4 py-2.5 text-sm placeholder:text-muted focus:border-accent/50 focus:outline-none"
          />
        </div>
        <div className="space-y-2">
          <label className="block text-xs font-medium uppercase tracking-wide text-muted">Author *</label>
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="e.g. E.B. White"
            required
            className="w-full rounded-xl border border-border/60 bg-muted-surface px-4 py-2.5 text-sm placeholder:text-muted focus:border-accent/50 focus:outline-none"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-medium uppercase tracking-wide text-muted">Grade range</label>
        <div className="flex flex-wrap gap-2">
          {GRADE_OPTIONS.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGradeRange(g)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                gradeRange === g
                  ? "border-accent/40 bg-accent/10 text-accent"
                  : "border-border/70 text-muted hover:text-foreground"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-medium uppercase tracking-wide text-muted">Guide type</label>
        <div className="flex flex-wrap gap-2">
          {guideTypes.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setGuideType(key)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                guideType === key
                  ? "border-accent/40 bg-accent/10 text-accent"
                  : "border-border/70 text-muted hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <GenerateButton loading={loading} />
    </form>
  );
}

// ── Product Description Form ───────────────────────────────────────────────────

function ProductDescriptionForm({ onResult }: { onResult: (t: string) => void }) {
  const [productName, setProductName] = useState("");
  const [productType, setProductType] = useState("Physical book");
  const [gradeRange, setGradeRange] = useState("General");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);

  const productTypes = ["Physical book", "Curriculum guide (digital)", "Activity pack", "Course module", "Workbook"];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    onResult("");
    const res = await fetch("/api/content-studio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode: "product-description", productName, productType, gradeRange, notes }),
    });
    const data = await res.json();
    onResult(data.text ?? data.error ?? "No output.");
    setLoading(false);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-2">
        <label className="block text-xs font-medium uppercase tracking-wide text-muted">Product name *</label>
        <input
          value={productName}
          onChange={(e) => setProductName(e.target.value)}
          placeholder="e.g. Charlotte's Web Curriculum Guide"
          required
          className="w-full rounded-xl border border-border/60 bg-muted-surface px-4 py-2.5 text-sm placeholder:text-muted focus:border-accent/50 focus:outline-none"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-medium uppercase tracking-wide text-muted">Product type</label>
        <div className="flex flex-wrap gap-2">
          {productTypes.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setProductType(t)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                productType === t
                  ? "border-accent/40 bg-accent/10 text-accent"
                  : "border-border/70 text-muted hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-medium uppercase tracking-wide text-muted">Grade range</label>
        <div className="flex flex-wrap gap-2">
          {GRADE_OPTIONS.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGradeRange(g)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                gradeRange === g
                  ? "border-accent/40 bg-accent/10 text-accent"
                  : "border-border/70 text-muted hover:text-foreground"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-xs font-medium uppercase tracking-wide text-muted">Key features / notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any highlights — e.g. '45 discussion questions, Charlotte Mason approach, faith-neutral'"
          rows={3}
          className="w-full resize-none rounded-xl border border-border/60 bg-muted-surface px-4 py-2.5 text-sm placeholder:text-muted focus:border-accent/50 focus:outline-none"
        />
      </div>

      <GenerateButton loading={loading} />
    </form>
  );
}

// ── Shared generate button ─────────────────────────────────────────────────────

function GenerateButton({ loading }: { loading: boolean }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-2xl border border-accent/40 bg-accent/10 px-5 py-2.5 text-sm font-medium text-accent transition hover:bg-accent/20 disabled:opacity-40"
    >
      {loading ? (
        <><Loader2 className="h-4 w-4 animate-spin" /> Generating…</>
      ) : (
        <><Sparkles className="h-4 w-4" /> Generate</>
      )}
    </button>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ContentStudioPage() {
  const [activeTab, setActiveTab] = useState<Mode>("newsletter");
  const [result, setResult] = useState("");
  const [generatingLoading, setGeneratingLoading] = useState(false);

  function handleResult(text: string) {
    setResult(text);
    setGeneratingLoading(false);
  }

  function handleGenerating(text: string) {
    if (text === "") setGeneratingLoading(true);
    setResult(text);
  }

  return (
    <PageFrame
      eyebrow="Content Studio"
      title="Draft content without losing the plot."
      description="Brand-voice grounded drafts for newsletters, curriculum guides, and product descriptions — generated in seconds, ready to edit."
    >
      <div className="space-y-6">
        {/* Tab bar */}
        <div className="flex flex-wrap gap-2">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setActiveTab(tab.key); setResult(""); }}
              className={`rounded-2xl border px-4 py-2.5 text-left transition ${
                activeTab === tab.key
                  ? "border-accent/35 bg-accent/10 text-foreground shadow-sm"
                  : "border-border/70 bg-transparent text-muted hover:border-border hover:text-foreground"
              }`}
            >
              <p className="text-sm font-medium">{tab.label}</p>
              <p className="mt-0.5 text-xs text-muted">{tab.description}</p>
            </button>
          ))}
        </div>

        {/* Form panel */}
        <div className="glass-panel rounded-3xl p-6">
          {activeTab === "newsletter" && (
            <NewsletterForm onResult={(t) => { handleGenerating(t); if (t) handleResult(t); }} />
          )}
          {activeTab === "curriculum-guide" && (
            <CurriculumGuideForm onResult={(t) => { handleGenerating(t); if (t) handleResult(t); }} />
          )}
          {activeTab === "product-description" && (
            <ProductDescriptionForm onResult={(t) => { handleGenerating(t); if (t) handleResult(t); }} />
          )}
        </div>

        {/* Output */}
        <OutputPanel text={result} loading={generatingLoading} />
      </div>
    </PageFrame>
  );
}