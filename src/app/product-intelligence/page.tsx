"use client";

import { useEffect, useState } from "react";
import { BarChart2, CheckCircle, ChevronDown, Loader2, Sparkles, XCircle } from "lucide-react";

type Opportunity = {
  id: string;
  title: string;
  description: string;
  category: string;
  store_score: string;
  curriculum_score: string;
  content_score: string;
  evidence: string[];
  action: string;
  status: string;
  created_at: string;
};

const SCORE_COLOR: Record<string, string> = {
  "A+": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "A":  "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  "A-": "bg-green-500/15 text-green-400 border-green-500/25",
  "B+": "bg-blue-500/15 text-blue-400 border-blue-500/25",
  "B":  "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "B-": "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  "C":  "bg-muted/10 text-muted border-border/50",
};

const STATUS_OPTIONS = ["open", "in-progress", "passed", "done"] as const;

function ScoreBadge({ label, score }: { label: string; score: string }) {
  const colors = SCORE_COLOR[score] ?? SCORE_COLOR["C"];
  return (
    <div className={`flex items-center gap-1 rounded-xl border px-2.5 py-1 text-xs ${colors}`}>
      <span className="font-bold">{score}</span>
      <span className="opacity-60">{label}</span>
    </div>
  );
}

function OpportunityCard({ opp, onStatusChange }: { opp: Opportunity; onStatusChange: (id: string, status: string) => void }) {
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);

  async function changeStatus(newStatus: string) {
    setSaving(true);
    try {
      await fetch(`/api/opportunities/${opp.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      onStatusChange(opp.id, newStatus);
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="glass-panel rounded-3xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="rounded-full border border-border/60 bg-muted-surface px-2.5 py-0.5 text-xs font-medium text-muted capitalize">
              {opp.category}
            </span>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
              opp.status === "open" ? "bg-accent/10 text-accent" :
              opp.status === "in-progress" ? "bg-blue-500/10 text-blue-400" :
              opp.status === "done" ? "bg-emerald-500/10 text-emerald-400" :
              "bg-muted/10 text-muted"
            }`}>
              {opp.status}
            </span>
          </div>
          <h2 className="font-semibold leading-snug">{opp.title}</h2>
          <p className="mt-1.5 text-sm leading-6 text-muted">{opp.description}</p>
        </div>
        <button
          onClick={() => setExpanded((o) => !o)}
          className="shrink-0 text-muted hover:text-foreground transition"
        >
          <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
        </button>
      </div>

      {/* Scores */}
      <div className="flex flex-wrap gap-2">
        <ScoreBadge label="Store" score={opp.store_score} />
        <ScoreBadge label="Curriculum" score={opp.curriculum_score} />
        <ScoreBadge label="Content" score={opp.content_score} />
      </div>

      {expanded && (
        <div className="space-y-4 border-t border-border/50 pt-4">
          {/* Evidence */}
          {opp.evidence?.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted">Evidence</p>
              <ul className="space-y-1">
                {opp.evidence.map((e, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent/60" />
                    {e}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommended action */}
          {opp.action && (
            <div className="rounded-2xl border border-accent/20 bg-accent/5 px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent mb-1">Next action</p>
              <p className="text-sm text-foreground">{opp.action}</p>
            </div>
          )}

          {/* Status controls */}
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.filter((s) => s !== opp.status).map((s) => (
              <button
                key={s}
                onClick={() => changeStatus(s)}
                disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-full border border-border/70 px-3 py-1 text-xs text-muted transition hover:border-accent/40 hover:text-foreground disabled:opacity-40"
              >
                {s === "done" && <CheckCircle className="h-3 w-3" />}
                {s === "passed" && <XCircle className="h-3 w-3" />}
                Mark {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </article>
  );
}

export default function ProductIntelligencePage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    fetch("/api/opportunities")
      .then((r) => r.json())
      .then((d) => setOpportunities(d.opportunities ?? []))
      .catch(() => setOpportunities([]))
      .finally(() => setLoading(false));
  }, []);

  async function handleAnalyze() {
    setAnalyzing(true);
    setError(null);
    try {
      const res = await fetch("/api/opportunities/analyze", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || res.statusText);
      setOpportunities((prev) => [...(data.opportunities ?? []), ...prev]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setAnalyzing(false);
    }
  }

  function handleStatusChange(id: string, status: string) {
    setOpportunities((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status } : o))
    );
  }

  const categories = ["all", ...Array.from(new Set(opportunities.map((o) => o.category)))];
  const filtered = filter === "all" ? opportunities : opportunities.filter((o) => o.category === filter);
  const open = filtered.filter((o) => o.status === "open" || o.status === "in-progress");
  const closed = filtered.filter((o) => o.status === "done" || o.status === "passed");

  return (
    <div className="p-6 sm:p-8 lg:p-10">
      <div className="mx-auto max-w-4xl space-y-8">

        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Product Intelligence</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">What deserves to be built.</h1>
            <p className="mt-2 text-sm text-muted">
              AI-scored opportunities from your ingested research. Every source you add in Research feeds this analysis.
            </p>
          </div>
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-accent-foreground shadow shadow-accent/25 transition hover:opacity-90 disabled:opacity-50 shrink-0"
          >
            {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {analyzing ? "Analyzing…" : "Run Opportunity Analysis"}
          </button>
        </div>

        {analyzing && (
          <div className="rounded-3xl border border-accent/20 bg-accent/5 px-5 py-4 text-sm text-muted animate-pulse">
            Reading research + briefs and generating scored opportunities — takes ~15 seconds…
          </div>
        )}

        {error && (
          <div className="rounded-3xl border border-red-500/20 bg-red-500/5 px-5 py-4 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Category filter */}
        {categories.length > 1 && (
          <div className="flex flex-wrap gap-1.5">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition capitalize ${
                  filter === c
                    ? "border-accent/50 bg-accent/10 text-accent"
                    : "border-border/70 bg-muted-surface text-muted hover:text-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-3 text-sm text-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading opportunities…
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl border border-border/40 bg-muted-surface/50 px-8 py-12 text-center space-y-3">
            <BarChart2 className="mx-auto h-8 w-8 text-muted/50" />
            <p className="text-sm text-muted">No opportunities yet.</p>
            <p className="text-xs text-muted/70">
              Add sources in Research, then click &ldquo;Run Opportunity Analysis&rdquo; to generate scored opportunities.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {open.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                  Active — {open.length}
                </p>
                {open.map((o) => (
                  <OpportunityCard key={o.id} opp={o} onStatusChange={handleStatusChange} />
                ))}
              </div>
            )}

            {closed.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted/60">
                  Closed — {closed.length}
                </p>
                {closed.map((o) => (
                  <OpportunityCard key={o.id} opp={o} onStatusChange={handleStatusChange} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}