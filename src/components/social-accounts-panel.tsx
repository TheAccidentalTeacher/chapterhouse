"use client";
import { useEffect, useState } from "react";
import { RefreshCw, Plus, Trash2, ChevronDown, ChevronUp, Rss } from "lucide-react";
import { logEvent, loggedFetch } from "@/lib/debug-log";
import { Tooltip } from "@/components/tooltip";

interface SocialAccount {
  id: string;
  brand: string;
  platform: string;
  buffer_profile_id: string;
  display_name: string;
  is_active: boolean;
}

interface BufferProfile {
  buffer_profile_id: string;
  platform: string;
  display_name: string;
}

const BRANDS = ["ncho", "somersschool", "scott_personal"];
const PLATFORMS = ["facebook", "instagram", "pinterest", "linkedin", "youtube"];

const BRAND_LABEL: Record<string, string> = {
  ncho: "NCHO",
  somersschool: "SomersSchool",
  scott_personal: "Scott Personal",
};

const BRAND_COLOR: Record<string, string> = {
  ncho: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
  somersschool: "bg-sky-500/20 text-sky-400 border border-sky-500/30",
  scott_personal: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
};

const PLATFORM_COLOR: Record<string, string> = {
  facebook: "bg-blue-500/15 text-blue-400",
  instagram: "bg-pink-500/15 text-pink-400",
  pinterest: "bg-red-500/15 text-red-400",
  linkedin: "bg-sky-600/15 text-sky-400",
};

export function SocialAccountsPanel() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [profiles, setProfiles] = useState<BufferProfile[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [form, setForm] = useState({
    brand: "ncho",
    platform: "facebook",
    buffer_profile_id: "",
    display_name: "",
  });
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadAccounts = async () => {
    const res = await loggedFetch("/api/social/accounts", undefined, "Social · Load accounts");
    if (res.ok) {
      const data = await res.json() as { accounts: SocialAccount[] };
      setAccounts(data.accounts ?? []);
    }
  };

  useEffect(() => { loadAccounts(); }, []);
  useEffect(() => { if (accounts.length === 0) setShowAddForm(true); }, [accounts.length]);

  const handleSync = async () => {
    setSyncing(true);
    setSyncError(null);
    logEvent("click", "Social · Sync Buffer clicked");
      const res = await loggedFetch("/api/social/accounts/sync", { method: "POST" }, "Social · Sync Buffer profiles");
    setSyncing(false);
    if (res.ok) {
      const data = await res.json() as { profiles: BufferProfile[] };
      setProfiles(data.profiles ?? []);
    } else {
      setSyncError("Could not fetch Buffer profiles. Check BUFFER_ACCESS_TOKEN.");
    }
  };

  const handleAddAccount = async () => {
    if (!form.buffer_profile_id || !form.display_name) return;
    setSaving(true);
    logEvent("click", "Social · Add account", { brand: form.brand, platform: form.platform });
    const res = await loggedFetch("/api/social/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    }, "Social · Add account");
    setSaving(false);
    if (res.ok) {
      setForm({ brand: "ncho", platform: "facebook", buffer_profile_id: "", display_name: "" });
      setProfiles([]);
      setShowAddForm(false);
      loadAccounts();
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    logEvent("click", "Social · Delete account", { id });
    await loggedFetch(`/api/social/accounts?id=${id}`, { method: "DELETE" }, "Social · Delete account");
    setDeletingId(null);
    loadAccounts();
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Context banner */}
      <div className="flex gap-3 rounded-xl border border-border/30 bg-muted/10 p-4">
        <Rss size={16} className="text-accent mt-0.5 shrink-0" />
        <div className="space-y-1">
          <p className="text-xs font-medium text-foreground">How posting works</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Each brand (NCHO, SomersSchool, Alana Terry) maps to a Buffer channel for each platform.
            When you approve a post in the Review Queue, it routes to the matching Buffer channel and
            gets scheduled there. Add one mapping per brand + platform combo.
          </p>
        </div>
      </div>

      {/* Connected Channels */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">
            Connected Channels
            {accounts.length > 0 && (
              <span className="ml-2 text-xs font-normal text-muted-foreground">({accounts.length})</span>
            )}
          </h3>
          <Tooltip content="Map a new Buffer channel to a brand" position="left">
            <button
              onClick={() => setShowAddForm((v) => !v)}
              className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg bg-accent/15 text-accent hover:bg-accent/25 transition"
            >
              <Plus size={11} />
              Add channel
              {showAddForm ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>
          </Tooltip>
        </div>

        {accounts.length === 0 && !showAddForm && (
          <p className="text-xs text-muted-foreground">No channels mapped yet.</p>
        )}

        {accounts.length > 0 && (
          <div className="space-y-2">
            {accounts.map((a) => (
              <div
                key={a.id}
                className="group flex items-center gap-3 rounded-xl border border-border/30 bg-muted/10 px-4 py-3"
              >
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${BRAND_COLOR[a.brand] ?? "bg-zinc-500/20 text-zinc-400 border border-zinc-500/30"}`}>
                  {BRAND_LABEL[a.brand] ?? a.brand}
                </span>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full capitalize ${PLATFORM_COLOR[a.platform] ?? "bg-zinc-500/15 text-zinc-300"}`}>
                  {a.platform}
                </span>
                <span className="text-xs text-foreground flex-1 min-w-0 truncate">{a.display_name}</span>
                <span className="font-mono text-[10px] text-muted-foreground/60 truncate max-w-[140px] hidden sm:block">
                  {a.buffer_profile_id}
                </span>
                <Tooltip content="Remove this channel mapping" position="left">
                  <button
                    onClick={() => handleDelete(a.id)}
                    disabled={deletingId === a.id}
                    className="opacity-0 group-hover:opacity-100 text-muted-foreground/50 hover:text-red-400 disabled:opacity-30 transition ml-1 shrink-0"
                  >
                    {deletingId === a.id
                      ? <RefreshCw size={13} className="animate-spin" />
                      : <Trash2 size={13} />
                    }
                  </button>
                </Tooltip>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Add channel form (collapsible) */}
      {showAddForm && (
        <section className="rounded-xl border border-border/40 bg-muted/5 p-4 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Add a Channel Mapping</h3>

          {/* Step 1: Sync */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">
              Step 1 — Sync your Buffer channels to get the profile ID, then click a row to auto-fill below.
            </p>
            <Tooltip content="Fetch latest channels from your Buffer account" position="right">
              <button
                onClick={handleSync}
                disabled={syncing}
                className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg bg-accent/15 text-accent hover:bg-accent/25 disabled:opacity-40 transition"
              >
                <RefreshCw size={12} className={syncing ? "animate-spin" : ""} />
                {syncing ? "Fetching..." : "Sync from Buffer"}
              </button>
            </Tooltip>
            {syncError && <p className="text-xs text-red-400 mt-2">{syncError}</p>}

            {profiles.length > 0 && (
              <div className="mt-3 border border-border/40 rounded-lg overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-muted/20">
                    <tr>
                      <th className="text-left px-3 py-2 text-muted-foreground font-medium">Platform</th>
                      <th className="text-left px-3 py-2 text-muted-foreground font-medium">Display Name</th>
                      <th className="text-left px-3 py-2 text-muted-foreground font-medium">Profile ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {profiles.map((p) => (
                      <tr
                        key={p.buffer_profile_id}
                        className="border-t border-border/30 cursor-pointer hover:bg-accent/10 transition"
                        title="Click to auto-fill form"
                        onClick={() => setForm((f) => ({
                          ...f,
                          buffer_profile_id: p.buffer_profile_id,
                          display_name: p.display_name,
                          platform: p.platform,
                        }))}
                      >
                        <td className="px-3 py-2 text-foreground capitalize">{p.platform}</td>
                        <td className="px-3 py-2 text-foreground">{p.display_name}</td>
                        <td className="px-3 py-2 font-mono text-muted-foreground">{p.buffer_profile_id}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Step 2: Form */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Step 2 — Assign a brand and save.</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Brand</label>
                <select
                  className="w-full bg-background border border-border/50 rounded-md text-xs px-2 py-1.5 text-foreground"
                  value={form.brand}
                  onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
                >
                  {BRANDS.map((b) => (
                    <option key={b} value={b}>{BRAND_LABEL[b] ?? b}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Platform</label>
                <select
                  className="w-full bg-background border border-border/50 rounded-md text-xs px-2 py-1.5 text-foreground"
                  value={form.platform}
                  onChange={(e) => setForm((f) => ({ ...f, platform: e.target.value }))}
                >
                  {PLATFORMS.map((p) => (
                    <option key={p} value={p} className="capitalize">{p}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Buffer Profile ID</label>
                <input
                  type="text"
                  placeholder="Click a row above to fill"
                  className="w-full bg-background border border-border/50 rounded-md text-xs px-2 py-1.5 text-foreground placeholder:text-muted-foreground/40"
                  value={form.buffer_profile_id}
                  onChange={(e) => setForm((f) => ({ ...f, buffer_profile_id: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Display Name</label>
                <input
                  type="text"
                  placeholder="e.g. NCHO Facebook Page"
                  className="w-full bg-background border border-border/50 rounded-md text-xs px-2 py-1.5 text-foreground placeholder:text-muted-foreground/40"
                  value={form.display_name}
                  onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))}
                />
              </div>
            </div>
            <Tooltip content="Save this brand–channel mapping to the database" position="right">
              <button
                onClick={handleAddAccount}
                disabled={saving || !form.buffer_profile_id || !form.display_name}
                className="mt-3 flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg bg-accent/15 text-accent hover:bg-accent/25 disabled:opacity-40 transition"
              >
                <Plus size={12} />
                {saving ? "Saving..." : "Save mapping"}
              </button>
            </Tooltip>
          </div>
        </section>
      )}
    </div>
  );
}
