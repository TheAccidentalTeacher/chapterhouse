"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, Users, X, Save } from "lucide-react";

interface Audience {
  id: string;
  name: string;
  description?: string;
  demographics: Record<string, unknown>;
  pain_points: string[];
  motivations: string[];
  preferred_tone?: string;
  brand_voice_id?: string;
  created_at: string;
}

export default function AudiencesPage() {
  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const [form, setForm] = useState({
    name: "",
    description: "",
    pain_points: "",
    motivations: "",
    preferred_tone: "",
  });

  const loadAudiences = useCallback(async () => {
    const res = await fetch("/api/audiences");
    const data = await res.json();
    setAudiences(data.audiences ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { loadAudiences(); }, [loadAudiences]);

  function startCreate() {
    setCreating(true);
    setEditing(null);
    setForm({ name: "", description: "", pain_points: "", motivations: "", preferred_tone: "" });
  }

  function startEdit(a: Audience) {
    setEditing(a.id);
    setCreating(false);
    setForm({
      name: a.name,
      description: a.description || "",
      pain_points: (a.pain_points || []).join("\n"),
      motivations: (a.motivations || []).join("\n"),
      preferred_tone: a.preferred_tone || "",
    });
  }

  async function handleSave() {
    const payload = {
      name: form.name,
      description: form.description || undefined,
      pain_points: form.pain_points.split("\n").map((s) => s.trim()).filter(Boolean),
      motivations: form.motivations.split("\n").map((s) => s.trim()).filter(Boolean),
      preferred_tone: form.preferred_tone || undefined,
    };

    if (editing) {
      await fetch(`/api/audiences/${editing}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/audiences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    setEditing(null);
    setCreating(false);
    loadAudiences();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this audience? This cannot be undone.")) return;
    await fetch(`/api/audiences/${id}`, { method: "DELETE" });
    loadAudiences();
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-amber-500" />
          <h1 className="text-2xl font-bold text-amber-100">Target Audiences</h1>
        </div>
        <button
          onClick={startCreate}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-zinc-900 rounded-lg hover:bg-amber-500 font-medium"
        >
          <Plus className="w-4 h-4" /> New Audience
        </button>
      </div>

      <p className="text-zinc-400 mb-6 text-sm">
        Saved audiences are injected into Doc Studio generation prompts. Select one under &quot;Writing for:&quot; when generating.
      </p>

      {/* Create / Edit Form */}
      {(creating || editing) && (
        <div className="bg-zinc-800 border border-amber-700/30 rounded-lg p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-amber-200">
              {creating ? "New Audience" : "Edit Audience"}
            </h2>
            <button onClick={() => { setCreating(false); setEditing(null); }}>
              <X className="w-5 h-5 text-zinc-400 hover:text-zinc-200" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100"
                placeholder="e.g. Conviction-Stage Homeschool Parent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100"
                placeholder="Who is this person? What stage are they at?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Pain Points (one per line)</label>
              <textarea
                value={form.pain_points}
                onChange={(e) => setForm({ ...form, pain_points: e.target.value })}
                rows={3}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100"
                placeholder="state compliance complexity&#10;curriculum overwhelm&#10;isolation from other families"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Motivations (one per line)</label>
              <textarea
                value={form.motivations}
                onChange={(e) => setForm({ ...form, motivations: e.target.value })}
                rows={3}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100"
                placeholder="child learns at own pace&#10;family time and presence&#10;better academic outcomes"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Preferred Tone</label>
              <input
                type="text"
                value={form.preferred_tone}
                onChange={(e) => setForm({ ...form, preferred_tone: e.target.value })}
                className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-100"
                placeholder="e.g. warm, direct, practical — no jargon, no hedging"
              />
            </div>

            <button
              onClick={handleSave}
              disabled={!form.name.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-zinc-900 rounded-lg hover:bg-amber-500 font-medium disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> {creating ? "Create" : "Save Changes"}
            </button>
          </div>
        </div>
      )}

      {/* Audience List */}
      {loading ? (
        <div className="text-zinc-500 text-center py-12">Loading audiences...</div>
      ) : audiences.length === 0 ? (
        <div className="text-zinc-500 text-center py-12">
          No audiences yet. Create one to start targeting your content generation.
        </div>
      ) : (
        <div className="space-y-4">
          {audiences.map((a) => (
            <div key={a.id} className="bg-zinc-800/50 border border-zinc-700/50 rounded-lg p-5">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="text-lg font-semibold text-amber-200">{a.name}</h3>
                  {a.description && (
                    <p className="text-zinc-400 text-sm mt-1">{a.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startEdit(a)}
                    className="p-2 text-zinc-400 hover:text-amber-400"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(a.id)}
                    className="p-2 text-zinc-400 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
                {a.pain_points?.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-zinc-500 uppercase">Pain Points</span>
                    <ul className="mt-1 space-y-1">
                      {a.pain_points.slice(0, 3).map((p, i) => (
                        <li key={i} className="text-sm text-zinc-300">- {p}</li>
                      ))}
                      {a.pain_points.length > 3 && (
                        <li className="text-xs text-zinc-500">+{a.pain_points.length - 3} more</li>
                      )}
                    </ul>
                  </div>
                )}
                {a.motivations?.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-zinc-500 uppercase">Motivations</span>
                    <ul className="mt-1 space-y-1">
                      {a.motivations.slice(0, 3).map((m, i) => (
                        <li key={i} className="text-sm text-zinc-300">- {m}</li>
                      ))}
                      {a.motivations.length > 3 && (
                        <li className="text-xs text-zinc-500">+{a.motivations.length - 3} more</li>
                      )}
                    </ul>
                  </div>
                )}
                {a.preferred_tone && (
                  <div>
                    <span className="text-xs font-medium text-zinc-500 uppercase">Preferred Tone</span>
                    <p className="text-sm text-zinc-300 mt-1">{a.preferred_tone}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
