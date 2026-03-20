"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Sparkles,
  Plus,
  ChevronDown,
  ChevronRight,
  Loader2,
  Archive,
  X,
  Trash2,
  Edit3,
  Check,
  RefreshCw,
  Bot,
  Zap,
} from "lucide-react";
import { PageFrame } from "@/components/page-frame";

// ── Types ──────────────────────────────────────────────────────────────────────

type DreamStatus = "seed" | "active" | "building" | "shipped" | "archived" | "dismissed";

type Dream = {
  id: string;
  text: string;
  notes: string | null;
  status: DreamStatus;
  category: string;
  priority_score: number;
  source_type: string | null;
  source_label: string | null;
  sort_order: number;
  promoted_at: string | null;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
};

type AISuggestion = {
  id: string;
  text: string;
  suggested_action: "promote" | "dismiss" | "hold" | "merge";
  suggested_status: DreamStatus;
  suggested_category: string;
  suggested_priority: number;
  rationale: string;
  urgency: "now" | "soon" | "later" | "never";
};

// ── Constants ──────────────────────────────────────────────────────────────────

const COLUMNS: { status: DreamStatus; label: string; color: string; dotColor: string }[] = [
  { status: "seed",     label: "Seeds",    color: "border-yellow-500/30 bg-yellow-500/5",  dotColor: "bg-yellow-400" },
  { status: "active",   label: "Active",   color: "border-amber-500/30 bg-amber-500/5",      dotColor: "bg-amber-400" },
  { status: "building", label: "Building", color: "border-orange-500/30 bg-orange-500/5",  dotColor: "bg-orange-400" },
  { status: "shipped",  label: "Shipped",  color: "border-emerald-500/30 bg-emerald-500/5",dotColor: "bg-emerald-400" },
];

const ARCHIVE_STATUSES: DreamStatus[] = ["archived", "dismissed"];

const CATEGORIES = [
  "general", "product", "curriculum", "marketing", "tech",
  "personal", "ncho", "somersschool", "biblesaas",
];

const URGENCY_COLOR: Record<string, string> = {
  now:   "text-red-400 bg-red-500/10",
  soon:  "text-orange-400 bg-orange-500/10",
  later: "text-amber-400 bg-amber-500/10",
  never: "text-muted-foreground bg-muted/10",
};

const ACTION_COLOR: Record<string, string> = {
  promote: "text-emerald-400",
  dismiss: "text-red-400",
  hold:    "text-yellow-400",
  merge:   "text-amber-400",
};

// ── Dream Card ─────────────────────────────────────────────────────────────────

function DreamCard({
  dream,
  suggestion,
  onUpdate,
  onDelete,
}: {
  dream: Dream;
  suggestion?: AISuggestion;
  onUpdate: (id: string, updates: Partial<Dream>) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState(dream.text);
  const [editNotes, setEditNotes] = useState(dream.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [showNotes, setShowNotes] = useState(!!dream.notes);

  async function save() {
    if (!editText.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/dreams/${dream.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: editText.trim(), notes: editNotes.trim() || null }),
      });
      const json = await res.json();
      if (json.dream) {
        onUpdate(dream.id, { text: json.dream.text, notes: json.dream.notes });
        setEditing(false);
      }
    } finally {
      setSaving(false);
    }
  }

  async function moveTo(status: DreamStatus) {
    const res = await fetch(`/api/dreams/${dream.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const json = await res.json();
    if (json.dream) onUpdate(dream.id, { status });
  }

  async function applyAISuggestion() {
    if (!suggestion) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/dreams/${dream.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: suggestion.suggested_status,
          category: suggestion.suggested_category,
          priority_score: suggestion.suggested_priority,
        }),
      });
      const json = await res.json();
      if (json.dream) onUpdate(dream.id, json.dream);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded-lg border border-border/50 bg-card p-3 space-y-2 group hover:border-border transition-colors">
      {/* Text */}
      {editing ? (
        <div className="space-y-2">
          <textarea
            className="w-full bg-background border border-border rounded px-2 py-1 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-accent"
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            rows={3}
            autoFocus
          />
          <textarea
            className="w-full bg-background border border-border rounded px-2 py-1 text-xs text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-accent"
            value={editNotes}
            onChange={(e) => setEditNotes(e.target.value)}
            placeholder="Notes (optional)"
            rows={2}
          />
          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={saving}
              className="flex items-center gap-1 text-xs bg-accent/20 text-accent px-2 py-1 rounded hover:bg-accent/30 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
              Save
            </button>
            <button
              onClick={() => { setEditing(false); setEditText(dream.text); setEditNotes(dream.notes ?? ""); }}
              className="text-xs text-muted-foreground px-2 py-1 rounded hover:text-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div>
          <p className="text-sm leading-snug">{dream.text}</p>
          {dream.notes && showNotes && (
            <p className="mt-1 text-xs text-muted-foreground italic">{dream.notes}</p>
          )}
        </div>
      )}

      {/* Category badge */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground bg-muted/20 px-1.5 py-0.5 rounded">
          {dream.category}
        </span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {dream.notes && (
            <button
              onClick={() => setShowNotes((v) => !v)}
              className="text-xs text-muted-foreground hover:text-foreground"
              title={showNotes ? "Hide notes" : "Show notes"}
            >
              {showNotes ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            </button>
          )}
          <button
            onClick={() => setEditing(true)}
            className="text-muted-foreground hover:text-foreground"
            title="Edit"
          >
            <Edit3 className="w-3 h-3" />
          </button>
          <button
            onClick={() => moveTo("archived")}
            className="text-muted-foreground hover:text-yellow-400"
            title="Archive"
          >
            <Archive className="w-3 h-3" />
          </button>
          <button
            onClick={() => onDelete(dream.id)}
            className="text-muted-foreground hover:text-red-400"
            title="Delete permanently"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Status move buttons */}
      {!editing && (
        <div className="flex gap-1 flex-wrap">
          {dream.status !== "seed" && (
            <button
              onClick={() => moveTo("seed")}
              className="text-xs text-muted-foreground hover:text-yellow-400 border border-border/40 px-1.5 py-0.5 rounded hover:border-yellow-500/50 transition-colors"
            >
              → Seed
            </button>
          )}
          {dream.status !== "active" && !ARCHIVE_STATUSES.includes(dream.status) && (
            <button
              onClick={() => moveTo("active")}
              className="text-xs text-muted-foreground hover:text-amber-400 border border-border/40 px-1.5 py-0.5 rounded hover:border-amber-500/50 transition-colors"
            >
              → Active
            </button>
          )}
          {dream.status !== "building" && !ARCHIVE_STATUSES.includes(dream.status) && (
            <button
              onClick={() => moveTo("building")}
              className="text-xs text-muted-foreground hover:text-orange-400 border border-border/40 px-1.5 py-0.5 rounded hover:border-orange-500/50 transition-colors"
            >
              → Building
            </button>
          )}
          {dream.status !== "shipped" && !ARCHIVE_STATUSES.includes(dream.status) && (
            <button
              onClick={() => moveTo("shipped")}
              className="text-xs text-muted-foreground hover:text-emerald-400 border border-border/40 px-1.5 py-0.5 rounded hover:border-emerald-500/50 transition-colors"
            >
              → Shipped ✓
            </button>
          )}
          {dream.status !== "dismissed" && (
            <button
              onClick={() => moveTo("dismissed")}
              className="text-xs text-muted-foreground hover:text-red-400 border border-border/40 px-1.5 py-0.5 rounded hover:border-red-500/50 transition-colors"
            >
              Dismiss
            </button>
          )}
        </div>
      )}

      {/* AI suggestion panel */}
      {suggestion && (
        <div className="mt-2 pt-2 border-t border-border/30 space-y-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Bot className="w-3 h-3 text-amber-400" />
              <span className={`text-xs font-medium ${ACTION_COLOR[suggestion.suggested_action]}`}>
                Earl says: {suggestion.suggested_action.toUpperCase()}
              </span>
              <span className={`text-xs px-1.5 py-0.5 rounded ${URGENCY_COLOR[suggestion.urgency]}`}>
                {suggestion.urgency}
              </span>
            </div>
            {suggestion.suggested_action !== "hold" && (
              <button
                onClick={applyAISuggestion}
                disabled={saving}
                className="text-xs text-accent bg-accent/10 hover:bg-accent/20 px-2 py-0.5 rounded flex items-center gap-1 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                Apply
              </button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{suggestion.rationale}</p>
        </div>
      )}
    </div>
  );
}

// ── Column ─────────────────────────────────────────────────────────────────────

function DreamerColumn({
  status,
  label,
  color,
  dotColor,
  dreams,
  suggestions,
  onUpdate,
  onDelete,
}: {
  status: DreamStatus;
  label: string;
  color: string;
  dotColor: string;
  dreams: Dream[];
  suggestions: Record<string, AISuggestion>;
  onUpdate: (id: string, updates: Partial<Dream>) => void;
  onDelete: (id: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`flex flex-col rounded-xl border ${color} min-w-[260px] w-[260px] flex-shrink-0`}>
      {/* Column header */}
      <button
        onClick={() => setCollapsed((v) => !v)}
        className="flex items-center justify-between px-3 py-2.5 hover:bg-white/5 transition-colors rounded-t-xl"
      >
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${dotColor}`} />
          <span className="text-sm font-medium">{label}</span>
          <span className="text-xs text-muted-foreground bg-muted/20 px-1.5 py-0.5 rounded-full">
            {dreams.length}
          </span>
        </div>
        {collapsed ? <ChevronRight className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
      </button>

      {/* Cards */}
      {!collapsed && (
        <div className="flex flex-col gap-2 px-2 pb-3 overflow-y-auto max-h-[calc(100vh-240px)]">
          {dreams.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4 opacity-60">No dreams here yet</p>
          )}
          {dreams.map((d) => (
            <DreamCard
              key={d.id}
              dream={d}
              suggestion={suggestions[d.id]}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Add Dream Form ─────────────────────────────────────────────────────────────

function AddDreamForm({ onAdd }: { onAdd: (dream: Dream) => void }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [notes, setNotes] = useState("");
  const [category, setCategory] = useState("general");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/dreams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim(), notes: notes.trim() || undefined, category, source_type: "manual" }),
      });
      const json = await res.json();
      if (json.dream) {
        onAdd(json.dream);
        setText("");
        setNotes("");
        setCategory("general");
        setOpen(false);
      }
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground border border-dashed border-border/50 hover:border-border rounded-lg px-3 py-2 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add dream seed
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="bg-card border border-border rounded-xl p-4 space-y-3 w-full max-w-md">
      <textarea
        className="w-full bg-background border border-border rounded px-3 py-2 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-accent"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What's the dream? Be specific."
        rows={3}
        autoFocus
      />
      <textarea
        className="w-full bg-background border border-border rounded px-3 py-2 text-xs text-muted-foreground resize-none focus:outline-none focus:ring-1 focus:ring-accent"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes or context (optional)"
        rows={2}
      />
      <div className="flex items-center gap-3">
        <select
          className="bg-background border border-border rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-accent"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <div className="flex gap-2 ml-auto">
          <button
            type="button"
            onClick={() => { setOpen(false); setText(""); setNotes(""); }}
            className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !text.trim()}
            className="text-xs bg-accent/20 text-accent hover:bg-accent/30 px-3 py-1 rounded flex items-center gap-1 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
            Add seed
          </button>
        </div>
      </div>
    </form>
  );
}

// ── Archive drawer ─────────────────────────────────────────────────────────────

function ArchiveDrawer({
  dreams,
  onUpdate,
  onDelete,
  onClose,
}: {
  dreams: Dream[];
  onUpdate: (id: string, updates: Partial<Dream>) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}) {
  const archived = dreams.filter((d) => d.status === "archived");
  const dismissed = dreams.filter((d) => d.status === "dismissed");

  return (
    <div className="fixed inset-y-0 right-0 w-80 bg-card border-l border-border shadow-2xl z-50 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h3 className="font-medium text-sm">Archive</h3>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {archived.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-2">ARCHIVED ({archived.length})</p>
            <div className="space-y-2">
              {archived.map((d) => (
                <DreamCard key={d.id} dream={d} onUpdate={onUpdate} onDelete={onDelete} />
              ))}
            </div>
          </div>
        )}
        {dismissed.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground font-medium mb-2">DISMISSED ({dismissed.length})</p>
            <div className="space-y-2">
              {dismissed.map((d) => (
                <DreamCard key={d.id} dream={d} onUpdate={onUpdate} onDelete={onDelete} />
              ))}
            </div>
          </div>
        )}
        {archived.length === 0 && dismissed.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">Nothing archived yet.</p>
        )}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function DreamerPage() {
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<Record<string, AISuggestion>>({});
  const [reviewing, setReviewing] = useState(false);
  const [showArchive, setShowArchive] = useState(false);
  const [reviewMessage, setReviewMessage] = useState("");

  const fetchDreams = useCallback(async () => {
    const res = await fetch("/api/dreams");
    const json = await res.json();
    setDreams(json.dreams ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchDreams(); }, [fetchDreams]);

  function handleUpdate(id: string, updates: Partial<Dream>) {
    setDreams((prev) => prev.map((d) => (d.id === id ? { ...d, ...updates } : d)));
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this dream permanently? This can't be undone. (Use archive or dismiss to preserve it.)")) return;
    await fetch(`/api/dreams/${id}`, { method: "DELETE" });
    setDreams((prev) => prev.filter((d) => d.id !== id));
  }

  function handleAdd(dream: Dream) {
    setDreams((prev) => [dream, ...prev]);
  }

  async function runAIReview() {
    setReviewing(true);
    setSuggestions({});
    setReviewMessage("");
    try {
      const res = await fetch("/api/dreams/ai-review", { method: "POST" });
      const json = await res.json();
      if (json.error) {
        setReviewMessage(`Error: ${json.error}`);
        return;
      }
      if (json.message) {
        setReviewMessage(json.message);
        return;
      }
      const map: Record<string, AISuggestion> = {};
      for (const s of (json.suggestions ?? [])) {
        map[s.id] = s;
      }
      setSuggestions(map);
      setReviewMessage(`Earl reviewed ${json.seedCount} seeds.`);
    } finally {
      setReviewing(false);
    }
  }

  const activeDreams = (status: DreamStatus) =>
    dreams.filter((d) => d.status === status).sort((a, b) => a.sort_order - b.sort_order);

  const archiveCount = dreams.filter((d) => ARCHIVE_STATUSES.includes(d.status)).length;
  const seedCount = dreams.filter((d) => d.status === "seed").length;

  return (
    <PageFrame
      eyebrow="AI & Automation"
      title="Dreamer."
      description="Your idea queue. Seeds wait here until they're ready to move. You promote everything — nothing auto-advances."
    >
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap mb-6">
        <AddDreamForm onAdd={handleAdd} />

        {seedCount > 0 && (
          <button
            onClick={runAIReview}
            disabled={reviewing}
            className="flex items-center gap-2 text-sm bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30 px-3 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {reviewing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Bot className="w-4 h-4" />
            )}
            {reviewing ? "Earl is thinking..." : `Ask Earl to review ${seedCount} seed${seedCount !== 1 ? "s" : ""}`}
          </button>
        )}

        <button
          onClick={fetchDreams}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground border border-border/50 hover:border-border px-3 py-2 rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>

        {archiveCount > 0 && (
          <button
            onClick={() => setShowArchive(true)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground border border-border/50 hover:border-border px-3 py-2 rounded-lg transition-colors ml-auto"
          >
            <Archive className="w-4 h-4" />
            Archive ({archiveCount})
          </button>
        )}
      </div>

      {reviewMessage && (
        <div className="mb-4 flex items-center gap-2 text-sm text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
          <Zap className="w-4 h-4 flex-shrink-0" />
          {reviewMessage}
          {Object.keys(suggestions).length > 0 && (
            <span className="ml-1 text-muted-foreground">— suggestions appear on each card below.</span>
          )}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {COLUMNS.map((col) => (
              <DreamerColumn
                key={col.status}
                status={col.status}
                label={col.label}
                color={col.color}
                dotColor={col.dotColor}
                dreams={activeDreams(col.status)}
                suggestions={suggestions}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </div>
      )}

      {dreams.length === 0 && !loading && (
        <div className="text-center py-16 space-y-2">
          <Sparkles className="w-8 h-8 text-muted-foreground mx-auto opacity-40" />
          <p className="text-muted-foreground">No dreams yet. Add your first seed above.</p>
        </div>
      )}

      {showArchive && (
        <>
          <div className="fixed inset-0 bg-black/40 z-40" onClick={() => setShowArchive(false)} />
          <ArchiveDrawer
            dreams={dreams}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onClose={() => setShowArchive(false)}
          />
        </>
      )}
    </PageFrame>
  );
}
