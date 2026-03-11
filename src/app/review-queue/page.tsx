"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, ArrowRight, Loader2, ClipboardList, FlaskConical, ChevronDown, ExternalLink } from "lucide-react";
import { PageFrame } from "@/components/page-frame";

// ── Types ──────────────────────────────────────────────────────────────────────

type ResearchItem = {
  id: string;
  url: string;
  title: string;
  summary: string;
  verdict: string;
  tags: string[];
  status: string;
  created_at: string;
};

type Opportunity = {
  id: string;
  title: string;
  description: string;
  category: string;
  store_score: string;
  curriculum_score: string;
  content_score: string;
  action: string;
  status: string;
  created_at: string;
};

// ── Helpers ────────────────────────────────────────────────────────────────────

const SCORE_COLOR: Record<string, string> = {
  "A+": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "A":  "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  "A-": "bg-green-500/15 text-green-400 border-green-500/25",
  "B+": "bg-blue-500/15 text-blue-400 border-blue-500/25",
  "B":  "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "B-": "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  "C":  "bg-muted/10 text-muted border-border/50",
};

function ScoreBadge({ label, score }: { label: string; score: string }) {
  const colors = SCORE_COLOR[score] ?? SCORE_COLOR["C"];
  return (
    <span className={`inline-flex items-center gap-1 rounded-xl border px-2.5 py-0.5 text-xs font-semibold ${colors}`}>
      <span>{score}</span>
      <span className="opacity-60">{label}</span>
    </span>
  );
}

function ActionBtn({
  onClick,
  disabled,
  variant = "default",
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  variant?: "approve" | "reject" | "default";
  children: React.ReactNode;
}) {
  const base = "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition disabled:opacity-40";
  const styles = {
    approve: `${base} border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20`,
    reject: `${base} border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20`,
    default: `${base} border-border/70 text-muted hover:border-accent/40 hover:text-foreground`,
  };
  return (
    <button onClick={onClick} disabled={disabled} className={styles[variant]}>
      {children}
    </button>
  );
}

// ── Research Item Card ─────────────────────────────────────────────────────────

function ResearchCard({
  item,
  onDismiss,
  onTagFilter,
}: {
  item: ResearchItem;
  onDismiss: (id: string) => void;
  onTagFilter?: (tag: string) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);

  async function updateStatus(status: string) {
    setSaving(true);
    try {
      await fetch(`/api/research?id=${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      onDismiss(item.id);
    } finally {
      setSaving(false);
    }
  }

  const isImage = item.url?.startsWith("image://");
  const isPaste = item.url?.startsWith("paste://");
  const isBrief = item.url?.startsWith("brief://");
  const sourceLabel = isImage ? "Screenshot" : isPaste ? "Pasted text" : isBrief ? "Daily Brief" : item.url;

  return (
    <article className="glass-panel rounded-3xl p-5 space-y-3">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="rounded-full border border-border/60 bg-muted-surface px-2.5 py-0.5 text-xs font-medium text-muted">
              Research
            </span>
            {item.tags?.map((tag) => (
              <button
                key={tag}
                onClick={() => onTagFilter?.(tag)}
                className={`cursor-pointer rounded-full px-2 py-0.5 text-xs font-medium transition ${
                  tag === "vibe-coding"
                    ? "bg-accent/15 text-accent border border-accent/30 hover:ring-1 hover:ring-accent/50"
                    : tag === "competitor"
                    ? "bg-orange-500/10 text-orange-400 border border-orange-500/20 hover:ring-1 hover:ring-orange-500/40"
                    : "bg-muted-surface text-muted border border-border/50 hover:border-border hover:text-foreground"
                } ${onTagFilter ? "cursor-pointer" : "cursor-default"}`}
              >
                {tag}
              </button>
            ))}
          </div>
          <div className="flex items-start justify-between gap-2">
            <button
              className="text-left font-semibold leading-snug hover:text-accent transition cursor-pointer flex-1"
              onClick={() => setExpanded(!expanded)}
            >
              {item.title || sourceLabel}
            </button>
            <button
              onClick={() => setExpanded(!expanded)}
              className="shrink-0 rounded-lg p-1 text-muted hover:text-foreground transition"
            >
              <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
            </button>
          </div>
          {item.summary && (
            <p className={`mt-1 text-sm text-muted leading-6 ${expanded ? "" : "line-clamp-2"}`}>
              {item.summary}
            </p>
          )}
          {expanded && item.verdict && (
            <p className="mt-2 text-sm text-foreground/80 italic leading-6">&ldquo;{item.verdict}&rdquo;</p>
          )}
          {expanded && !isImage && !isPaste && !isBrief && item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 rounded-xl border border-accent/40 bg-accent/10 px-3 py-1.5 text-xs font-medium text-accent hover:bg-accent/20 transition"
            >
              Open article <ExternalLink className="h-3 w-3" />
            </a>
          )}
          {!expanded && !isImage && !isPaste && !isBrief && item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 block truncate text-xs text-muted/60 hover:text-accent transition"
            >
              {item.url}
            </a>
          )}
          {isBrief && (
            <span className="mt-1 block text-xs text-muted/60">Source: Daily Brief</span>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/40">
        <ActionBtn variant="approve" onClick={() => updateStatus("saved")} disabled={saving}>
          <CheckCircle className="h-3 w-3" />
          Save
        </ActionBtn>
        <ActionBtn variant="reject" onClick={() => updateStatus("rejected")} disabled={saving}>
          <XCircle className="h-3 w-3" />
          Reject
        </ActionBtn>
        {saving && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted" />}
      </div>
    </article>
  );
}

// ── Opportunity Card ───────────────────────────────────────────────────────────

function OpportunityCard({
  opp,
  onDismiss,
}: {
  opp: Opportunity;
  onDismiss: (id: string) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [creatingTask, setCreatingTask] = useState(false);

  async function updateOppStatus(status: string) {
    setSaving(true);
    try {
      await fetch(`/api/opportunities/${opp.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      onDismiss(opp.id);
    } finally {
      setSaving(false);
    }
  }

  async function convertToTask() {
    setCreatingTask(true);
    try {
      await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: opp.title,
          description: opp.action || opp.description,
          source_type: "opportunity",
          source_id: opp.id,
          source_title: opp.title,
        }),
      });
      await fetch(`/api/opportunities/${opp.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "in-progress" }),
      });
      onDismiss(opp.id);
    } finally {
      setCreatingTask(false);
    }
  }

  const busy = saving || creatingTask;

  return (
    <article className="glass-panel rounded-3xl p-5 space-y-3">
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          <span className="rounded-full border border-border/60 bg-muted-surface px-2.5 py-0.5 text-xs font-medium text-muted capitalize">
            {opp.category}
          </span>
          <span className="rounded-full bg-accent/10 text-accent px-2.5 py-0.5 text-xs font-medium">
            open
          </span>
        </div>
        <h2 className="font-semibold leading-snug">{opp.title}</h2>
        <p className="mt-1 text-sm text-muted leading-6">{opp.description}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <ScoreBadge label="Store" score={opp.store_score} />
        <ScoreBadge label="Curriculum" score={opp.curriculum_score} />
        <ScoreBadge label="Content" score={opp.content_score} />
      </div>

      {opp.action && (
        <div className="rounded-2xl border border-accent/20 bg-accent/5 px-3 py-2">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-accent mb-0.5">Next action</p>
          <p className="text-sm text-foreground">{opp.action}</p>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/40">
        <ActionBtn variant="approve" onClick={() => updateOppStatus("in-progress")} disabled={busy}>
          <ArrowRight className="h-3 w-3" />
          In progress
        </ActionBtn>
        <ActionBtn variant="default" onClick={convertToTask} disabled={busy}>
          <ClipboardList className="h-3 w-3" />
          {creatingTask ? "Creating…" : "Create task"}
        </ActionBtn>
        <ActionBtn variant="reject" onClick={() => updateOppStatus("passed")} disabled={busy}>
          <XCircle className="h-3 w-3" />
          Pass
        </ActionBtn>
        {saving && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted" />}
      </div>
    </article>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function ReviewQueuePage() {
  const [researchItems, setResearchItems] = useState<ResearchItem[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterTag, setFilterTag] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const [rRes, oRes] = await Promise.all([
          fetch("/api/research"),
          fetch("/api/opportunities"),
        ]);
        const rData = await rRes.json();
        const oData = await oRes.json();

        setResearchItems(
          (rData.items ?? []).filter((i: ResearchItem) => i.status === "review")
        );
        setOpportunities(
          (oData.opportunities ?? []).filter((o: Opportunity) => o.status === "open")
        );
      } catch (e) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filteredResearch = filterTag
    ? researchItems.filter((i) => i.tags?.includes(filterTag))
    : researchItems;

  function dismissResearch(id: string) {
    setResearchItems((prev) => prev.filter((i) => i.id !== id));
  }

  function dismissOpportunity(id: string) {
    setOpportunities((prev) => prev.filter((o) => o.id !== id));
  }

  const total = researchItems.length + opportunities.length;

  return (
    <PageFrame
      eyebrow="Review Queue"
      title="Review before automation gets ideas."
      description="Approve, pass, or convert signals into work. Nothing moves forward until it clears this gate."
    >
      {loading && (
        <div className="flex items-center justify-center py-20 text-muted">
          <Loader2 className="h-5 w-5 animate-spin mr-2" />
          Loading queue…
        </div>
      )}

      {error && (
        <div className="glass-panel rounded-3xl p-6 text-sm text-red-400">
          Failed to load queue: {error}
        </div>
      )}

      {!loading && !error && total === 0 && (
        <div className="glass-panel rounded-3xl p-12 text-center space-y-2">
          <p className="text-2xl">✓</p>
          <p className="font-semibold">Queue is clear.</p>
          <p className="text-sm text-muted">
            New research items and scored opportunities will appear here for review.
          </p>
        </div>
      )}

      {!loading && !error && total > 0 && (
        <div className="space-y-8">
          <div className="flex flex-wrap gap-3 text-sm text-muted">
            {researchItems.length > 0 && (
              <span className="flex items-center gap-1.5">
                <FlaskConical className="h-3.5 w-3.5" />
                {researchItems.length} research item{researchItems.length !== 1 ? "s" : ""}
              </span>
            )}
            {researchItems.length > 0 && opportunities.length > 0 && (
              <span className="text-border">·</span>
            )}
            {opportunities.length > 0 && (
              <span className="flex items-center gap-1.5">
                <ClipboardList className="h-3.5 w-3.5" />
                {opportunities.length} opportunit{opportunities.length !== 1 ? "ies" : "y"}
              </span>
            )}
          </div>

          {researchItems.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                  Research — awaiting review
                </h2>
                {filterTag && (
                  <button
                    onClick={() => setFilterTag(null)}
                    className="flex items-center gap-1.5 rounded-full border border-accent/40 bg-accent/10 px-2.5 py-1 text-xs text-accent hover:bg-accent/20 transition"
                  >
                    {filterTag} <XCircle className="h-3 w-3" />
                  </button>
                )}
              </div>
              {filteredResearch.map((item) => (
                <ResearchCard key={item.id} item={item} onDismiss={dismissResearch} onTagFilter={setFilterTag} />
              ))}
              {filterTag && filteredResearch.length === 0 && (
                <p className="text-sm text-muted px-1">No items with tag &ldquo;{filterTag}&rdquo;.</p>
              )}
            </section>
          )}

          {opportunities.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-muted px-1">
                Opportunities — open
              </h2>
              {opportunities.map((opp) => (
                <OpportunityCard key={opp.id} opp={opp} onDismiss={dismissOpportunity} />
              ))}
            </section>
          )}
        </div>
      )}
    </PageFrame>
  );
}