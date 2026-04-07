"use client";
import { useState, useMemo } from "react";
import {
  Sparkles,
  Store,
  GraduationCap,
  Feather,
  User,
  Camera,
  Pin,
  Briefcase,
  MessageCircle,
  Minus,
  Plus,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { logEvent, loggedFetch } from "@/lib/debug-log";
import { Tooltip } from "@/components/tooltip";

// ─── Brand Configuration ───────────────────────────────

interface BrandConfig {
  id: string;
  label: string;
  subtitle: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  selected: string;
  unselected: string;
  iconColor: string;
  dotColor: string;
  textColor: string;
}

const BRANDS: BrandConfig[] = [
  {
    id: "ncho",
    label: "NCHO",
    subtitle: "Homeschool Store",
    Icon: Store,
    selected:
      "bg-amber-500/15 border-amber-500/50 shadow-lg shadow-amber-500/10",
    unselected:
      "border-border/30 hover:border-amber-500/30 hover:bg-amber-500/5",
    iconColor: "text-amber-400",
    dotColor: "bg-amber-500",
    textColor: "text-amber-300",
  },
  {
    id: "somersschool",
    label: "SomersSchool",
    subtitle: "Course Platform",
    Icon: GraduationCap,
    selected: "bg-red-500/15 border-red-500/50 shadow-lg shadow-red-500/10",
    unselected:
      "border-border/30 hover:border-red-500/30 hover:bg-red-500/5",
    iconColor: "text-red-400",
    dotColor: "bg-red-500",
    textColor: "text-red-300",
  },
  {
    id: "alana_terry",
    label: "Alana Terry",
    subtitle: "Author Brand",
    Icon: Feather,
    selected:
      "bg-rose-500/15 border-rose-500/50 shadow-lg shadow-rose-500/10",
    unselected:
      "border-border/30 hover:border-rose-500/30 hover:bg-rose-500/5",
    iconColor: "text-rose-400",
    dotColor: "bg-rose-500",
    textColor: "text-rose-300",
  },
  {
    id: "scott_personal",
    label: "Scott",
    subtitle: "Personal",
    Icon: User,
    selected:
      "bg-slate-500/15 border-slate-400/50 shadow-lg shadow-slate-500/10",
    unselected:
      "border-border/30 hover:border-slate-500/30 hover:bg-slate-500/5",
    iconColor: "text-slate-400",
    dotColor: "bg-slate-500",
    textColor: "text-slate-300",
  },
];

// ─── Platform Configuration ────────────────────────────

interface PlatformConfig {
  id: string;
  label: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  selected: string;
  unselected: string;
  iconColor: string;
  dotColor: string;
}

const PLATFORMS: PlatformConfig[] = [
  {
    id: "facebook",
    label: "Facebook",
    Icon: MessageCircle,
    selected: "bg-sky-500/15 border-sky-500/50",
    unselected: "border-border/30 hover:border-sky-500/30 hover:bg-sky-500/5",
    iconColor: "text-sky-400",
    dotColor: "bg-sky-500",
  },
  {
    id: "instagram",
    label: "Instagram",
    Icon: Camera,
    selected: "bg-pink-500/15 border-pink-500/50",
    unselected:
      "border-border/30 hover:border-pink-500/30 hover:bg-pink-500/5",
    iconColor: "text-pink-400",
    dotColor: "bg-pink-500",
  },
  {
    id: "pinterest",
    label: "Pinterest",
    Icon: Pin,
    selected: "bg-red-600/15 border-red-600/50",
    unselected:
      "border-border/30 hover:border-red-600/30 hover:bg-red-600/5",
    iconColor: "text-red-500",
    dotColor: "bg-red-600",
  },
  {
    id: "linkedin",
    label: "LinkedIn",
    Icon: Briefcase,
    selected: "bg-blue-500/15 border-blue-500/50",
    unselected:
      "border-border/30 hover:border-blue-500/30 hover:bg-blue-500/5",
    iconColor: "text-blue-400",
    dotColor: "bg-blue-500",
  },
];

// ─── Topic Quick-Picks ─────────────────────────────────

const TOPIC_SUGGESTIONS = [
  "Product launch",
  "Seasonal / holiday",
  "Educational tip",
  "Behind the scenes",
  "Customer story",
  "Free resource",
];

// ─── Component ─────────────────────────────────────────

interface Props {
  onGenerated?: () => void;
}

export function SocialGeneratePanel({ onGenerated }: Props) {
  const [selectedBrands, setSelectedBrands] = useState<string[]>(["ncho"]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([
    "facebook",
    "instagram",
  ]);
  const [countPerCombo, setCountPerCombo] = useState(2);
  const [topicSeed, setTopicSeed] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ count: number } | null>(null);
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

  const matrix = useMemo(() => {
    return selectedBrands.map((brandId) => {
      const brand = BRANDS.find((b) => b.id === brandId)!;
      return {
        brand,
        platforms: selectedPlatforms.map((platId) => {
          const plat = PLATFORMS.find((p) => p.id === platId)!;
          return { platform: plat, count: countPerCombo };
        }),
      };
    });
  }, [selectedBrands, selectedPlatforms, countPerCombo]);

  const appendTopic = (suggestion: string) => {
    setTopicSeed((prev) => {
      if (prev.trim()) return `${prev.trim()}, ${suggestion.toLowerCase()}`;
      return suggestion.toLowerCase();
    });
  };

  const handleSubmit = async () => {
    if (!selectedBrands.length || !selectedPlatforms.length) return;
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      logEvent("click", "Social · Generate submitted", { brands: selectedBrands, platforms: selectedPlatforms, count: countPerCombo });
      const res = await loggedFetch("/api/social/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          brands: selectedBrands,
          platforms: selectedPlatforms,
          count_per_combo: countPerCombo,
          topic_seed: topicSeed || undefined,
        }),
      }, "Social · Generate posts");

      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        setError(err.error ?? "Generation failed");
        return;
      }

      const data = (await res.json()) as { count?: number };
      setResult({ count: data.count ?? 0 });
      setTopicSeed("");
      setTimeout(() => onGenerated?.(), 1800);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-8">
      {/* ─── Header ─── */}
      <div>
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <Sparkles size={18} className="text-accent" />
          Content Generator
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Select brands and platforms, then let AI craft tailored posts for each
          combination.
        </p>
      </div>

      {/* ─── Brand Selection Cards ─── */}
      <section>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Brands
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {BRANDS.map((brand) => {
            const active = selectedBrands.includes(brand.id);
            const Icon = brand.Icon;
            return (
              <button
                key={brand.id}
                onClick={() => toggleBrand(brand.id)}
                className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                  active ? brand.selected : brand.unselected
                }`}
              >
                {active && (
                  <div
                    className={`absolute top-2.5 right-2.5 w-2 h-2 rounded-full ${brand.dotColor}`}
                  />
                )}
                <Icon
                  size={24}
                  className={
                    active ? brand.iconColor : "text-muted-foreground/50"
                  }
                />
                <div className="text-center">
                  <p
                    className={`text-sm font-medium ${
                      active ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {brand.label}
                  </p>
                  <p className="text-[11px] text-muted-foreground/60">
                    {brand.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ─── Platform Selection Cards ─── */}
      <section>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Platforms
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {PLATFORMS.map((plat) => {
            const active = selectedPlatforms.includes(plat.id);
            const Icon = plat.Icon;
            return (
              <button
                key={plat.id}
                onClick={() => togglePlatform(plat.id)}
                className={`flex items-center gap-2.5 px-3.5 py-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                  active ? plat.selected : plat.unselected
                }`}
              >
                <Icon
                  size={18}
                  className={
                    active ? plat.iconColor : "text-muted-foreground/50"
                  }
                />
                <span
                  className={`text-sm font-medium ${
                    active ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {plat.label}
                </span>
                {active && (
                  <div
                    className={`ml-auto w-1.5 h-1.5 rounded-full ${plat.dotColor}`}
                  />
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* ─── Posts Per Combo (stepper) ─── */}
      <section>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Posts per combination
        </p>
        <div className="flex items-center gap-3">
          <Tooltip content="Fewer posts per combo" position="top">
            <button
              onClick={() => setCountPerCombo(Math.max(1, countPerCombo - 1))}
              disabled={countPerCombo <= 1}
              className="w-9 h-9 rounded-lg border border-border/50 flex items-center justify-center text-muted-foreground hover:border-accent/50 hover:text-foreground disabled:opacity-30 transition"
            >
              <Minus size={14} />
            </button>
          </Tooltip>
          <span className="text-2xl font-bold text-foreground w-8 text-center tabular-nums">
            {countPerCombo}
          </span>
          <Tooltip content="More posts per combo" position="top">
            <button
              onClick={() => setCountPerCombo(Math.min(5, countPerCombo + 1))}
              disabled={countPerCombo >= 5}
              className="w-9 h-9 rounded-lg border border-border/50 flex items-center justify-center text-muted-foreground hover:border-accent/50 hover:text-foreground disabled:opacity-30 transition"
            >
              <Plus size={14} />
            </button>
          </Tooltip>
          <span className="text-xs text-muted-foreground ml-1">
            per brand × platform
          </span>
        </div>
      </section>

      {/* ─── Topic Seed with Quick Picks ─── */}
      <section>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Topic{" "}
          <span className="font-normal normal-case tracking-normal">
            (optional)
          </span>
        </p>
        <textarea
          value={topicSeed}
          onChange={(e) => setTopicSeed(e.target.value)}
          placeholder="e.g. new product: Saxon Math 5/4, back to homeschool season, Alaska allotment guide"
          rows={3}
          className="w-full bg-card/50 border border-border/30 rounded-xl text-sm px-4 py-3 text-foreground placeholder:text-muted-foreground/40 resize-none focus:outline-none focus:border-accent/40 transition"
        />
        <div className="flex flex-wrap gap-1.5 mt-2">
          {TOPIC_SUGGESTIONS.map((s) => (
            <Tooltip key={s} content={`Add "${s}" to topic seed`} position="top">
              <button
                onClick={() => appendTopic(s)}
                className="text-[11px] px-2.5 py-1 rounded-full border border-border/30 text-muted-foreground hover:border-accent/30 hover:text-foreground transition"
              >
                {s}
              </button>
            </Tooltip>
          ))}
        </div>
      </section>

      {/* ─── Generation Plan Preview ─── */}
      {matrix.length > 0 && selectedPlatforms.length > 0 && (
        <section className="bg-card/30 border border-border/20 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Generation Plan
            </p>
            <span className="text-sm font-bold text-accent tabular-nums">
              {total} post{total !== 1 ? "s" : ""}
            </span>
          </div>
          <div className="space-y-3">
            {matrix.map(({ brand, platforms: platList }) => (
              <div key={brand.id} className="flex items-start gap-3">
                <div
                  className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${brand.dotColor}`}
                />
                <div className="flex-1 min-w-0">
                  <span className={`text-sm font-medium ${brand.textColor}`}>
                    {brand.label}
                  </span>
                  <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-0.5">
                    {platList.map(({ platform, count }) => (
                      <span
                        key={platform.id}
                        className="text-xs text-muted-foreground"
                      >
                        {platform.label}{" "}
                        <span className="text-foreground/80 font-medium">
                          ×{count}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ─── Generate / Status ─── */}
      <div className="pt-2">
        {result ? (
          <div className="flex items-center gap-2.5 px-5 py-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <CheckCircle2 size={18} />
            <span className="text-sm font-medium">
              Generated {result.count} posts — switching to Review Queue…
            </span>
          </div>
        ) : error ? (
          <div className="space-y-3">
            <div className="px-5 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              {error}
            </div>
            <GenerateButton
              loading={loading}
              disabled={!selectedBrands.length || !selectedPlatforms.length}
              total={total}
              onClick={handleSubmit}
            />
          </div>
        ) : (
          <GenerateButton
            loading={loading}
            disabled={!selectedBrands.length || !selectedPlatforms.length}
            total={total}
            onClick={handleSubmit}
          />
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────

function GenerateButton({
  loading,
  disabled,
  total,
  onClick,
}: {
  loading: boolean;
  disabled: boolean;
  total: number;
  onClick: () => void;
}) {
  return (
    <Tooltip content="Send selected brands × platforms to Claude for content generation" position="top">
      <button
        onClick={onClick}
        disabled={loading || disabled}
        className="w-full flex items-center justify-center gap-2.5 px-5 py-3.5 text-sm font-semibold rounded-xl bg-accent text-zinc-900 disabled:opacity-30 hover:opacity-90 transition-all duration-200"
      >
        {loading ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            <span>Generating {total} posts…</span>
          </>
        ) : (
          <>
            <Sparkles size={16} />
            <span>Generate {total > 0 ? `${total} Posts` : "Posts"}</span>
          </>
        )}
      </button>
    </Tooltip>
  );
}
