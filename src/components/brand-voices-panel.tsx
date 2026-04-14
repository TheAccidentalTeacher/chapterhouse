"use client";

import { useEffect, useState } from "react";
import { Megaphone, ChevronDown, ChevronUp, Loader2, Check, AlertCircle, Search, X } from "lucide-react";

type BrandVoice = {
  id: string;
  brand: string;
  display_name: string;
  audience: string;
  tone: string;
  rules: string;
  forbidden_words: string[];
  platform_hints: Record<string, string>;
  full_voice_prompt: string;
  is_active: boolean;
  version: number;
  updated_at: string;
};

const BRAND_COLORS: Record<string, string> = {
  ncho: "amber",
  somersschool: "sky",
  alana_terry: "rose",
  scott_personal: "emerald",
};

function colorClass(brand: string, variant: "border" | "bg" | "text" | "badge") {
  const c = BRAND_COLORS[brand] ?? "zinc";
  if (variant === "border") return `border-${c}-500/30 hover:border-${c}-500/50`;
  if (variant === "bg") return `bg-${c}-500/8`;
  if (variant === "text") return `text-${c}-300`;
  if (variant === "badge") return `bg-${c}-500/20 text-${c}-300`;
  return "";
}

function BrandVoiceCard({ voice, onSave }: { voice: BrandVoice; onSave: (v: BrandVoice) => void }) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState(voice.full_voice_prompt);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dirty = prompt !== voice.full_voice_prompt;

  async function handleSave() {
    if (!dirty || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/brand-voices/${voice.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_voice_prompt: prompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);
      onSave(data);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  }

  const borderCol = `border-${BRAND_COLORS[voice.brand] ?? "zinc"}-500/30 hover:border-${BRAND_COLORS[voice.brand] ?? "zinc"}-500/50`;
  const bgCol = `bg-${BRAND_COLORS[voice.brand] ?? "zinc"}-500/8`;
  const textCol = `text-${BRAND_COLORS[voice.brand] ?? "zinc"}-300`;
  const badgeCol = `bg-${BRAND_COLORS[voice.brand] ?? "zinc"}-500/20 text-${BRAND_COLORS[voice.brand] ?? "zinc"}-300`;

  return (
    <div className={`rounded-2xl border ${borderCol} ${bgCol} transition-colors`}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <span className={`font-semibold ${textCol}`}>{voice.display_name}</span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${badgeCol}`}>
            v{voice.version}
          </span>
          {!voice.is_active && (
            <span className="rounded-full bg-zinc-500/20 px-2 py-0.5 text-xs text-zinc-400">
              inactive
            </span>
          )}
        </div>
        {open ? (
          <ChevronUp size={16} className="text-muted shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-muted shrink-0" />
        )}
      </button>

      {open && (
        <div className="border-t border-border/40 px-5 pb-5 pt-4 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-muted">
              Full voice prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={12}
              className="w-full rounded-xl border border-border/70 bg-muted-surface px-4 py-3 font-mono text-xs leading-relaxed text-foreground focus:border-amber-500/60 focus:outline-none resize-y"
            />
            <p className="mt-1 text-xs text-muted">
              This is the exact text injected as the brand voice system prompt into every social post generation call that includes this brand.
            </p>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-xs text-muted">
              Last updated: {new Date(voice.updated_at).toLocaleDateString()}
            </p>
            <button
              onClick={handleSave}
              disabled={!dirty || saving}
              className="flex items-center gap-2 rounded-xl bg-amber-500/20 px-4 py-2 text-sm font-semibold text-amber-300 transition-all hover:bg-amber-500/30 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {saving ? (
                <Loader2 size={14} className="animate-spin" />
              ) : saved ? (
                <Check size={14} className="text-green-400" />
              ) : null}
              {saved ? "Saved" : "Save changes"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function VoiceAnalyzerModal({
  onApply,
  onClose,
}: {
  onApply: (voiceText: string) => void;
  onClose: () => void;
}) {
  const [samples, setSamples] = useState("");
  const [brandName, setBrandName] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAnalyze() {
    const sampleArr = samples
      .split("---")
      .map((s) => s.trim())
      .filter((s) => s.length >= 50);
    if (sampleArr.length < 1) {
      setError("Need at least 1 sample with 50+ characters. Separate samples with ---");
      return;
    }
    setAnalyzing(true);
    setError(null);
    try {
      const res = await fetch("/api/brand-voices/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ samples: sampleArr.slice(0, 5), brand_name: brandName || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);
      setResult(data.voice_text);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-xl rounded-2xl border border-zinc-700 bg-zinc-900 p-6 shadow-2xl max-h-[80vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200">
          <X size={18} />
        </button>
        <h3 className="text-base font-semibold text-amber-300 mb-3">Analyze Voice from Samples</h3>
        <p className="text-xs text-zinc-400 mb-4">
          Paste 1–5 writing samples separated by <code className="text-amber-200">---</code>. AI extracts the voice/tone/style.
        </p>
        <input
          type="text"
          placeholder="Brand name (optional)"
          value={brandName}
          onChange={(e) => setBrandName(e.target.value)}
          className="w-full mb-3 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
        />
        <textarea
          value={samples}
          onChange={(e) => setSamples(e.target.value)}
          rows={8}
          placeholder="Paste writing sample 1 here...\n---\nPaste writing sample 2 here...\n---\nPaste writing sample 3 here..."
          className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-amber-500/50 resize-y font-mono"
        />
        {error && (
          <div className="mt-2 text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
        <button
          onClick={handleAnalyze}
          disabled={analyzing || !samples.trim()}
          className="mt-3 flex items-center gap-2 rounded-lg bg-amber-500/20 px-4 py-2 text-sm font-medium text-amber-300 hover:bg-amber-500/30 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {analyzing ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
          {analyzing ? "Analyzing…" : "Analyze Voice"}
        </button>
        {result && (
          <div className="mt-4 space-y-3">
            <h4 className="text-xs font-semibold text-zinc-300 uppercase tracking-wide">Extracted Voice</h4>
            <div className="rounded-lg bg-zinc-800/80 border border-zinc-700 p-4 text-sm text-zinc-200 leading-relaxed whitespace-pre-wrap">
              {result}
            </div>
            <button
              onClick={() => onApply(result)}
              className="flex items-center gap-2 rounded-lg bg-emerald-500/20 px-4 py-2 text-sm font-medium text-emerald-300 hover:bg-emerald-500/30"
            >
              <Check size={14} />
              Apply to Brand Voice
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function BrandVoicesPanel() {
  const [voices, setVoices] = useState<BrandVoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [analyzeTarget, setAnalyzeTarget] = useState<BrandVoice | null>(null);

  useEffect(() => {
    fetch("/api/brand-voices")
      .then((r) => r.json())
      .then((d) => setVoices(Array.isArray(d) ? d : []))
      .catch(() => setError("Could not load brand voices"))
      .finally(() => setLoading(false));
  }, []);

  function handleSave(updated: BrandVoice) {
    setVoices((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
  }

  async function handleApplyAnalysis(voiceText: string) {
    if (!analyzeTarget) return;
    try {
      const res = await fetch(`/api/brand-voices/${analyzeTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_voice_prompt: voiceText }),
      });
      const data = await res.json();
      if (res.ok) handleSave(data);
    } catch { /* ignore */ }
    setAnalyzeTarget(null);
  }

  return (
    <div className="glass-panel rounded-3xl p-6">
      <div className="flex items-center gap-3 mb-5">
        <Megaphone size={18} className="text-amber-400" />
        <h2 className="text-lg font-semibold">Brand voices</h2>
        <span className="rounded-full bg-muted-surface px-3 py-1 text-xs font-semibold text-muted ml-auto">
          Editable — no redeploy needed
        </span>
      </div>

      <p className="mb-4 text-sm text-muted leading-relaxed">
        These prompts are injected directly into every social post generation call. Edit here and save — the change takes effect on the next generation run without a code deploy.
      </p>

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted py-4">
          <Loader2 size={16} className="animate-spin" />
          Loading brand voices…
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error} — run migrations 023 and 023b in Supabase first.
        </div>
      )}

      {!loading && !error && voices.length === 0 && (
        <div className="rounded-xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
          No brand voices found. Run migrations 023 + 023b in Supabase Dashboard to seed initial voices.
        </div>
      )}

      <div className="space-y-3">
        {voices.map((v) => (
          <div key={v.id} className="relative">
            <BrandVoiceCard voice={v} onSave={handleSave} />
            <button
              onClick={() => setAnalyzeTarget(v)}
              className="absolute top-4 right-14 flex items-center gap-1.5 rounded-lg bg-zinc-800/80 px-2.5 py-1 text-xs text-zinc-400 hover:text-amber-300 hover:bg-zinc-700 transition-colors"
              title="Analyze voice from writing samples"
            >
              <Search size={12} />
              Analyze
            </button>
          </div>
        ))}
      </div>

      {analyzeTarget && (
        <VoiceAnalyzerModal
          onApply={handleApplyAnalysis}
          onClose={() => setAnalyzeTarget(null)}
        />
      )}
    </div>
  );
}
