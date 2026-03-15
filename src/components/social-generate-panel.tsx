"use client";
import { useState } from "react";
import { Sparkles } from "lucide-react";

const BRANDS = [
  { id: "ncho", label: "NCHO" },
  { id: "somersschool", label: "SomersSchool" },
  { id: "alana_terry", label: "Alana Terry" },
];

const PLATFORMS = [
  { id: "facebook", label: "Facebook" },
  { id: "instagram", label: "Instagram" },
  { id: "linkedin", label: "LinkedIn" },
];

interface Props {
  onGenerated?: () => void;
}

export function SocialGeneratePanel({ onGenerated }: Props) {
  const [selectedBrands, setSelectedBrands] = useState<string[]>(["ncho"]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(["facebook", "instagram"]);
  const [countPerCombo, setCountPerCombo] = useState(2);
  const [topicSeed, setTopicSeed] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggleBrand = (id: string) =>
    setSelectedBrands((prev) =>
      prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]
    );

  const togglePlatform = (id: string) =>
    setSelectedPlatforms((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );

  const total = selectedBrands.length * selectedPlatforms.length * countPerCombo;

  const handleSubmit = async () => {
    if (!selectedBrands.length || !selectedPlatforms.length) return;
    setLoading(true);
    setResult(null);
    setError(null);

    const res = await fetch("/api/social/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brands: selectedBrands,
        platforms: selectedPlatforms,
        count_per_combo: countPerCombo,
        topic_seed: topicSeed || undefined,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      const err = await res.json() as { error?: string };
      setError(err.error ?? "Generation failed");
      return;
    }

    const data = await res.json() as { count?: number };
    setResult(`Generated ${data.count ?? 0} posts — now in Review Queue.`);
    setTopicSeed("");
    onGenerated?.();
  };

  return (
    <div className="max-w-lg space-y-6">
      {/* Brands */}
      <div>
        <p className="text-sm font-medium text-foreground mb-2">Brands</p>
        <div className="flex flex-wrap gap-2">
          {BRANDS.map((b) => (
            <button
              key={b.id}
              onClick={() => toggleBrand(b.id)}
              className={`text-xs px-3 py-1.5 rounded-full border transition ${
                selectedBrands.includes(b.id)
                  ? "bg-accent/20 border-accent text-foreground"
                  : "border-border/50 text-muted-foreground hover:border-border"
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* Platforms */}
      <div>
        <p className="text-sm font-medium text-foreground mb-2">Platforms</p>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((p) => (
            <button
              key={p.id}
              onClick={() => togglePlatform(p.id)}
              className={`text-xs px-3 py-1.5 rounded-full border transition ${
                selectedPlatforms.includes(p.id)
                  ? "bg-accent/20 border-accent text-foreground"
                  : "border-border/50 text-muted-foreground hover:border-border"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Count */}
      <div>
        <label className="text-sm font-medium text-foreground block mb-2">
          Posts per brand + platform combination
        </label>
        <input
          type="number"
          min={1}
          max={7}
          value={countPerCombo}
          onChange={(e) => setCountPerCombo(Math.min(7, Math.max(1, Number(e.target.value))))}
          className="w-20 bg-background border border-border/50 rounded-md text-sm px-3 py-1.5 text-foreground"
        />
        {total > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            {total} post{total !== 1 ? "s" : ""} will be generated
          </p>
        )}
      </div>

      {/* Topic seed */}
      <div>
        <label className="text-sm font-medium text-foreground block mb-2">
          Topic seed <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <textarea
          value={topicSeed}
          onChange={(e) => setTopicSeed(e.target.value)}
          placeholder="e.g. new product: Saxon Math 5/4, or 'back to homeschool week'"
          rows={3}
          className="w-full bg-background border border-border/50 rounded-lg text-sm px-3 py-2 text-foreground placeholder:text-muted-foreground/50 resize-none focus:outline-none focus:border-border"
        />
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={loading || !selectedBrands.length || !selectedPlatforms.length}
        className="flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-accent text-white disabled:opacity-40 hover:opacity-90 transition"
      >
        <Sparkles size={14} />
        {loading ? "Generating..." : `Generate ${total > 0 ? total : ""} posts`}
      </button>

      {result && (
        <p className="text-sm text-green-400">{result}</p>
      )}
      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}
    </div>
  );
}
