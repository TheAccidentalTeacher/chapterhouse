"use client";

import { useState } from "react";
import {
  Loader2,
  Download,
  Copy,
  Check,
  Upload,
  Search,
  ZoomIn,
  Sparkles,
  Image as ImageIcon,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

type Provider = "openai" | "stability" | "replicate" | "leonardo";

interface GeneratedImage {
  url: string;
  provider: string;
  model: string;
  width: number;
  height: number;
  prompt: string;
  timestamp: number;
}

interface StockImage {
  id: string;
  source: "pexels" | "pixabay" | "unsplash";
  url: string;
  thumbnailUrl: string;
  width: number;
  height: number;
  description: string;
  photographer: string;
  downloadUrl: string;
  license: string;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const PROVIDERS: {
  id: Provider;
  label: string;
  description: string;
}[] = [
  {
    id: "openai",
    label: "GPT Image 1",
    description: "Best for text-in-images and photorealistic scenes",
  },
  {
    id: "stability",
    label: "Stability AI",
    description: "Controllable art styles, curriculum illustrations",
  },
  {
    id: "replicate",
    label: "Flux (Replicate)",
    description: "Fast, high-quality generation via Flux Schnell",
  },
  {
    id: "leonardo",
    label: "Leonardo.ai",
    description: "Phoenix model for character consistency (Gimli)",
  },
];

const SIZE_PRESETS = [
  { label: "Square (1024)", width: 1024, height: 1024 },
  { label: "Landscape (1280×720)", width: 1280, height: 720 },
  { label: "Portrait (768×1024)", width: 768, height: 1024 },
  { label: "Wide (1792×1024)", width: 1792, height: 1024 },
];

const SOURCE_COLORS: Record<string, string> = {
  pexels: "bg-green-500/20 text-green-400",
  pixabay: "bg-amber-500/20 text-amber-400",
  unsplash: "bg-zinc-500/20 text-zinc-400",
};

// ── Small Helpers ──────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="inline-flex items-center gap-1 rounded-full border border-border/70 px-2 py-1 text-xs text-muted hover:text-accent hover:border-accent/40 transition"
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? "Copied" : "Copy URL"}
    </button>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function ImageGenerationStudio() {
  // ── Generate tab state ─────────────────────────────────────────────────────
  const [prompt, setPrompt] = useState("");
  const [provider, setProvider] = useState<Provider>("openai");
  const [sizeIndex, setSizeIndex] = useState(0);
  const [negativePrompt, setNegativePrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState("");
  const [generatedImages, setGeneratedImages] = useState<GeneratedImage[]>([]);

  // ── Stock tab state ────────────────────────────────────────────────────────
  const [stockQuery, setStockQuery] = useState("");
  const [stockSearching, setStockSearching] = useState(false);
  const [stockResults, setStockResults] = useState<StockImage[]>([]);
  const [stockError, setStockError] = useState("");

  // ── Upscale/save state ─────────────────────────────────────────────────────
  const [upscaling, setUpscaling] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // ── Tab ────────────────────────────────────────────────────────────────────
  const [tab, setTab] = useState<"generate" | "stock">("generate");

  // ── Generate ───────────────────────────────────────────────────────────────
  async function handleGenerate() {
    if (!prompt.trim()) return;
    setGenerating(true);
    setGenError("");
    try {
      const size = SIZE_PRESETS[sizeIndex];
      const res = await fetch("/api/images/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          provider,
          width: size.width,
          height: size.height,
          negativePrompt: negativePrompt.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");

      setGeneratedImages((prev) => [
        {
          url: data.url,
          provider: data.provider,
          model: data.model,
          width: data.width,
          height: data.height,
          prompt: prompt.trim(),
          timestamp: Date.now(),
        },
        ...prev,
      ]);
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setGenerating(false);
    }
  }

  // ── Stock Search ───────────────────────────────────────────────────────────
  async function handleStockSearch() {
    if (!stockQuery.trim()) return;
    setStockSearching(true);
    setStockError("");
    try {
      const res = await fetch(
        `/api/images/search?q=${encodeURIComponent(stockQuery.trim())}&perPage=10`,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");
      setStockResults(data.images || []);
    } catch (err) {
      setStockError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setStockSearching(false);
    }
  }

  // ── Upscale ────────────────────────────────────────────────────────────────
  async function handleUpscale(imageUrl: string) {
    setUpscaling(imageUrl);
    try {
      const res = await fetch("/api/images/upscale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl, scale: 4 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upscale failed");

      setGeneratedImages((prev) => [
        {
          url: data.url,
          provider: "replicate",
          model: "real-esrgan-4x",
          width: 0,
          height: 0,
          prompt: "Upscaled image",
          timestamp: Date.now(),
        },
        ...prev,
      ]);
    } catch (err) {
      setGenError(
        err instanceof Error ? err.message : "Upscale failed",
      );
    } finally {
      setUpscaling(null);
    }
  }

  // ── Save to Cloudinary ─────────────────────────────────────────────────────
  async function handleSave(imageUrl: string) {
    setSaving(imageUrl);
    try {
      const res = await fetch("/api/images/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");
      setSaveSuccess(data.url);
      setTimeout(() => setSaveSuccess(null), 4000);
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Tab selector */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab("generate")}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
            tab === "generate"
              ? "bg-accent/20 text-accent"
              : "text-muted hover:text-foreground"
          }`}
        >
          <Sparkles className="h-4 w-4" />
          Generate
        </button>
        <button
          onClick={() => setTab("stock")}
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
            tab === "stock"
              ? "bg-accent/20 text-accent"
              : "text-muted hover:text-foreground"
          }`}
        >
          <Search className="h-4 w-4" />
          Stock Images
        </button>
      </div>

      {/* ── GENERATE TAB ──────────────────────────────────────────────────── */}
      {tab === "generate" && (
        <div className="space-y-4">
          {/* Prompt */}
          <div className="glass-panel rounded-3xl p-6 space-y-4">
            <label className="block text-sm font-medium text-foreground">
              Image Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image you want to generate..."
              rows={3}
              className="w-full rounded-xl bg-surface border border-border/70 p-3 text-sm text-foreground placeholder-muted resize-none focus:outline-none focus:border-accent/50"
            />

            {/* Provider */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted uppercase tracking-wider">
                Provider
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PROVIDERS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setProvider(p.id)}
                    className={`rounded-xl border p-3 text-left transition ${
                      provider === p.id
                        ? "border-accent/50 bg-accent/10"
                        : "border-border/70 hover:border-accent/30"
                    }`}
                  >
                    <div className="text-sm font-medium text-foreground">
                      {p.label}
                    </div>
                    <div className="text-xs text-muted mt-0.5">
                      {p.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Size */}
            <div className="flex gap-3 items-center flex-wrap">
              <span className="text-xs font-medium text-muted uppercase tracking-wider">
                Size
              </span>
              {SIZE_PRESETS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setSizeIndex(i)}
                  className={`rounded-full px-3 py-1 text-xs transition ${
                    sizeIndex === i
                      ? "bg-accent/20 text-accent"
                      : "text-muted hover:text-foreground"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Negative prompt (for Stability) */}
            {provider === "stability" && (
              <div>
                <label className="text-xs font-medium text-muted">
                  Negative Prompt (optional)
                </label>
                <input
                  type="text"
                  value={negativePrompt}
                  onChange={(e) => setNegativePrompt(e.target.value)}
                  placeholder="What to avoid..."
                  className="w-full mt-1 rounded-xl bg-surface border border-border/70 p-2 text-sm text-foreground placeholder-muted focus:outline-none focus:border-accent/50"
                />
              </div>
            )}

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={generating || !prompt.trim()}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-accent/20 text-accent font-medium py-3 transition hover:bg-accent/30 disabled:opacity-50"
            >
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Generating…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" /> Generate Image
                </>
              )}
            </button>

            {genError && (
              <p className="text-sm text-red-400">{genError}</p>
            )}
          </div>

          {/* Generated images gallery */}
          {generatedImages.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted uppercase tracking-wider">
                Generated Images
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {generatedImages.map((img, idx) => (
                  <div
                    key={idx}
                    className="glass-panel rounded-2xl overflow-hidden"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt={img.prompt}
                      className="w-full h-auto object-contain max-h-[400px] bg-black/20"
                    />
                    <div className="p-3 space-y-2">
                      <p className="text-xs text-muted line-clamp-2">
                        {img.prompt}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="rounded-full bg-accent/20 text-accent px-2 py-0.5 text-xs">
                          {img.provider}
                        </span>
                        <span className="text-xs text-muted">
                          {img.model}
                        </span>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <CopyButton text={img.url} />
                        {img.url.startsWith("http") && (
                          <>
                            <a
                              href={img.url}
                              download
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 rounded-full border border-border/70 px-2 py-1 text-xs text-muted hover:text-accent hover:border-accent/40 transition"
                            >
                              <Download className="h-3 w-3" /> Download
                            </a>
                            <button
                              onClick={() => handleUpscale(img.url)}
                              disabled={upscaling === img.url}
                              className="inline-flex items-center gap-1 rounded-full border border-border/70 px-2 py-1 text-xs text-muted hover:text-accent hover:border-accent/40 transition disabled:opacity-50"
                            >
                              {upscaling === img.url ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <ZoomIn className="h-3 w-3" />
                              )}
                              4× Upscale
                            </button>
                            <button
                              onClick={() => handleSave(img.url)}
                              disabled={saving === img.url}
                              className="inline-flex items-center gap-1 rounded-full border border-border/70 px-2 py-1 text-xs text-muted hover:text-accent hover:border-accent/40 transition disabled:opacity-50"
                            >
                              {saving === img.url ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : saveSuccess === img.url ? (
                                <Check className="h-3 w-3 text-green-500" />
                              ) : (
                                <Upload className="h-3 w-3" />
                              )}
                              {saveSuccess === img.url ? "Saved!" : "Save to CDN"}
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {generatedImages.length === 0 && !generating && (
            <div className="glass-panel rounded-3xl p-12 flex flex-col items-center justify-center text-center text-muted">
              <ImageIcon className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm">
                Enter a prompt and select a provider to generate images
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── STOCK TAB ─────────────────────────────────────────────────────── */}
      {tab === "stock" && (
        <div className="space-y-4">
          <div className="glass-panel rounded-3xl p-6 space-y-4">
            <label className="block text-sm font-medium text-foreground">
              Search Stock Images
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={stockQuery}
                onChange={(e) => setStockQuery(e.target.value)}
                placeholder="roman colosseum, medieval castle, science lab..."
                className="flex-1 rounded-xl bg-surface border border-border/70 p-3 text-sm text-foreground placeholder-muted focus:outline-none focus:border-accent/50"
                onKeyDown={(e) => e.key === "Enter" && handleStockSearch()}
              />
              <button
                onClick={handleStockSearch}
                disabled={stockSearching || !stockQuery.trim()}
                className="flex items-center gap-2 rounded-xl bg-accent/20 text-accent font-medium px-5 transition hover:bg-accent/30 disabled:opacity-50"
              >
                {stockSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                Search
              </button>
            </div>
            <p className="text-xs text-muted">
              Searches Pexels, Pixabay, and Unsplash simultaneously
            </p>
          </div>

          {stockError && (
            <p className="text-sm text-red-400">{stockError}</p>
          )}

          {stockResults.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {stockResults.map((img) => (
                <div
                  key={img.id}
                  className="glass-panel rounded-2xl overflow-hidden"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.thumbnailUrl}
                    alt={img.description}
                    className="w-full h-40 object-cover"
                  />
                  <div className="p-2 space-y-1">
                    <p className="text-xs text-foreground line-clamp-1">
                      {img.description}
                    </p>
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${SOURCE_COLORS[img.source]}`}
                      >
                        {img.source}
                      </span>
                      <span className="text-[10px] text-muted">
                        {img.photographer}
                      </span>
                    </div>
                    <div className="flex gap-1.5">
                      <CopyButton text={img.url} />
                      <a
                        href={img.downloadUrl}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 rounded-full border border-border/70 px-2 py-1 text-xs text-muted hover:text-accent hover:border-accent/40 transition"
                      >
                        <Download className="h-3 w-3" />
                      </a>
                      <button
                        onClick={() => handleSave(img.url)}
                        disabled={saving === img.url}
                        className="inline-flex items-center gap-1 rounded-full border border-border/70 px-2 py-1 text-xs text-muted hover:text-accent hover:border-accent/40 transition disabled:opacity-50"
                      >
                        {saving === img.url ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : saveSuccess === img.url ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <Upload className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {stockResults.length === 0 && !stockSearching && (
            <div className="glass-panel rounded-3xl p-12 flex flex-col items-center justify-center text-center text-muted">
              <Search className="h-12 w-12 mb-3 opacity-30" />
              <p className="text-sm">
                Search across Pexels, Pixabay, and Unsplash for free stock
                images
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
