"use client";
import { useEffect, useState } from "react";
import { RefreshCw, Plus } from "lucide-react";

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

const BRANDS = ["ncho", "somersschool", "alana_terry", "scott_personal"];
const PLATFORMS = ["facebook", "instagram", "linkedin", "threads", "tiktok", "youtube", "pinterest"];

const BRAND_LABEL: Record<string, string> = {
  ncho: "NCHO",
  somersschool: "SomersSchool",
  alana_terry: "Alana Terry",
  scott_personal: "Scott Personal",
};

export function SocialAccountsPanel() {
  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [profiles, setProfiles] = useState<BufferProfile[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [form, setForm] = useState({
    brand: "ncho",
    platform: "facebook",
    buffer_profile_id: "",
    display_name: "",
  });
  const [saving, setSaving] = useState(false);

  const loadAccounts = async () => {
    const res = await fetch("/api/social/accounts");
    if (res.ok) {
      const data = await res.json() as { accounts: SocialAccount[] };
      setAccounts(data.accounts ?? []);
    }
  };

  useEffect(() => { loadAccounts(); }, []);

  const handleSync = async () => {
    setSyncing(true);
    setSyncError(null);
    const res = await fetch("/api/social/accounts/sync", { method: "POST" });
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
    const res = await fetch("/api/social/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (res.ok) {
      setForm({ brand: "ncho", platform: "facebook", buffer_profile_id: "", display_name: "" });
      loadAccounts();
    }
  };

  return (
    <div className="space-y-8 max-w-2xl">
      {/* Step 1: Sync from Buffer */}
      <section>
        <h3 className="text-sm font-semibold text-foreground mb-3">Step 1 — Sync Buffer Profiles</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Fetches your connected Buffer channels. You&apos;ll use the profile IDs below when mapping brands.
        </p>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg bg-accent/15 text-accent hover:bg-accent/25 disabled:opacity-40 transition"
        >
          <RefreshCw size={12} className={syncing ? "animate-spin" : ""} />
          {syncing ? "Fetching..." : "Sync from Buffer"}
        </button>
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
                  <tr key={p.buffer_profile_id} className="border-t border-border/30">
                    <td className="px-3 py-2 text-foreground capitalize">{p.platform}</td>
                    <td className="px-3 py-2 text-foreground">{p.display_name}</td>
                    <td className="px-3 py-2 font-mono text-muted-foreground">{p.buffer_profile_id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Step 2: Add account mapping */}
      <section>
        <h3 className="text-sm font-semibold text-foreground mb-3">Step 2 — Map Brand → Buffer Profile</h3>
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
              placeholder="From sync table above"
              className="w-full bg-background border border-border/50 rounded-md text-xs px-2 py-1.5 text-foreground placeholder:text-muted-foreground/40"
              value={form.buffer_profile_id}
              onChange={(e) => setForm((f) => ({ ...f, buffer_profile_id: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground block mb-1">Display Name</label>
            <input
              type="text"
              placeholder="e.g. NCHO Facebook"
              className="w-full bg-background border border-border/50 rounded-md text-xs px-2 py-1.5 text-foreground placeholder:text-muted-foreground/40"
              value={form.display_name}
              onChange={(e) => setForm((f) => ({ ...f, display_name: e.target.value }))}
            />
          </div>
        </div>
        <button
          onClick={handleAddAccount}
          disabled={saving || !form.buffer_profile_id || !form.display_name}
          className="mt-3 flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg bg-accent/15 text-accent hover:bg-accent/25 disabled:opacity-40 transition"
        >
          <Plus size={12} />
          {saving ? "Saving..." : "Add Account"}
        </button>
      </section>

      {/* Active accounts */}
      {accounts.length > 0 && (
        <section>
          <h3 className="text-sm font-semibold text-foreground mb-3">Active Accounts</h3>
          <div className="border border-border/40 rounded-lg overflow-hidden">
            <table className="w-full text-xs">
              <thead className="bg-muted/20">
                <tr>
                  <th className="text-left px-3 py-2 text-muted-foreground font-medium">Brand</th>
                  <th className="text-left px-3 py-2 text-muted-foreground font-medium">Platform</th>
                  <th className="text-left px-3 py-2 text-muted-foreground font-medium">Display Name</th>
                  <th className="text-left px-3 py-2 text-muted-foreground font-medium">Profile ID</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((a) => (
                  <tr key={a.id} className="border-t border-border/30">
                    <td className="px-3 py-2 text-foreground">{BRAND_LABEL[a.brand] ?? a.brand}</td>
                    <td className="px-3 py-2 text-foreground capitalize">{a.platform}</td>
                    <td className="px-3 py-2 text-foreground">{a.display_name}</td>
                    <td className="px-3 py-2 font-mono text-muted-foreground text-[10px]">{a.buffer_profile_id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
