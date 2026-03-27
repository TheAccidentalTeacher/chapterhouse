"use client";

import { useEffect, useState } from "react";
import { Dog, Loader2, RefreshCw, Zap, Cpu, HelpCircle } from "lucide-react";

type Character = {
  id: string;
  slug: string;
  name: string;
  art_style: string | null;
  generation_strategy: "kontext" | "lora" | "ip_adapter" | null;
  lora_training_status: "none" | "queued" | "training" | "succeeded" | "failed" | null;
  lora_model_id: string | null;
  trigger_word: string | null;
  hero_image_url: string | null;
  reference_images: string[] | null;
  preferred_provider: string | null;
};

function StrategyBadge({ character }: { character: Character }) {
  const status = character.lora_training_status;
  const strategy = character.generation_strategy ?? "kontext";

  if (status === "queued" || status === "training") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-300 animate-pulse">
        <Loader2 className="w-3 h-3 animate-spin" />
        Training…
      </span>
    );
  }
  if (strategy === "lora" && status === "succeeded") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-500/20 px-2 py-0.5 text-xs font-medium text-green-300">
        <Cpu className="w-3 h-3" />
        LoRA
      </span>
    );
  }
  if (strategy === "lora" && status === "failed") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-400">
        <Cpu className="w-3 h-3" />
        LoRA failed
      </span>
    );
  }
  if (strategy === "ip_adapter") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/20 px-2 py-0.5 text-xs font-medium text-purple-300">
        <HelpCircle className="w-3 h-3" />
        IP-Adapter
      </span>
    );
  }
  // Default: kontext
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/20 px-2 py-0.5 text-xs font-medium text-sky-300">
      <Zap className="w-3 h-3" />
      Kontext
    </span>
  );
}

function ProviderBadge({ provider }: { provider: string | null }) {
  if (!provider) return null;
  const colors: Record<string, string> = {
    leonardo: "bg-amber-500/15 text-amber-400",
    replicate: "bg-zinc-500/20 text-zinc-400",
    stability: "bg-purple-500/15 text-purple-400",
    openai: "bg-sky-500/15 text-sky-400",
  };
  const cls = colors[provider] ?? "bg-zinc-500/20 text-zinc-400";
  return (
    <span className={`rounded text-[10px] font-mono px-1.5 py-0.5 ${cls}`}>
      {provider}
    </span>
  );
}

export function CharacterLibraryPanel() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadCharacters() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/characters");
      const data = await res.json() as { characters?: Character[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? "Failed to load");
      setCharacters(data.characters ?? []);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadCharacters(); }, []);

  return (
    <section className="glass-panel rounded-3xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Dog className="w-5 h-5 text-amber-400" />
          <h2 className="text-lg font-semibold">Character Library</h2>
          <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
            {characters.length}
          </span>
        </div>
        <button
          onClick={() => void loadCharacters()}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 border border-zinc-700 rounded-lg px-2.5 py-1.5 transition-colors"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-400 mb-3">{error}</p>
      )}

      {loading && characters.length === 0 ? (
        <div className="flex items-center gap-2 text-zinc-500 text-sm py-6 justify-center">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading characters…
        </div>
      ) : characters.length === 0 ? (
        <p className="text-sm text-zinc-600 py-6 text-center">
          No characters yet — save an image as a character in Creative Studio.
        </p>
      ) : (
        <div className="space-y-2">
          {characters.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/40 px-4 py-3"
            >
              {/* Hero thumbnail */}
              {c.hero_image_url ? (
                <img
                  src={c.hero_image_url}
                  alt={c.name}
                  className="w-10 h-10 rounded-lg object-cover shrink-0 border border-zinc-700"
                />
              ) : (
                <div className="w-10 h-10 rounded-lg bg-zinc-800 border border-zinc-700 shrink-0 flex items-center justify-center">
                  <Dog className="w-5 h-5 text-zinc-600" />
                </div>
              )}

              {/* Name + slug */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-zinc-200">{c.name}</p>
                <p className="text-xs text-zinc-500 font-mono truncate">{c.slug}</p>
              </div>

              {/* Strategy badge */}
              <StrategyBadge character={c} />

              {/* Provider badge */}
              <ProviderBadge provider={c.preferred_provider} />

              {/* Reference image count */}
              {c.reference_images && c.reference_images.length > 0 && (
                <span className="text-xs text-zinc-500 shrink-0">
                  {c.reference_images.length} ref{c.reference_images.length !== 1 ? "s" : ""}
                </span>
              )}

              {/* LoRA model ID (truncated) */}
              {c.lora_model_id && (
                <span
                  title={c.lora_model_id}
                  className="text-[10px] font-mono text-zinc-600 shrink-0 max-w-[120px] truncate"
                >
                  {c.lora_model_id}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
