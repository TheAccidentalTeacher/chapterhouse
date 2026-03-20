"use client";

import { useCallback, useEffect, useState } from "react";
import { GitBranch, Play, RefreshCw, CheckCircle, XCircle, Loader2, Clock } from "lucide-react";

interface N8nWorkflow {
  id: string;
  name: string;
  active: boolean;
  updatedAt: string;
}

interface N8nExecution {
  id: string;
  workflowId: string;
  finished: boolean;
  mode: string;
  startedAt: string;
  stoppedAt?: string;
  status: "success" | "error" | "running" | "waiting" | "crashed";
}

function StatusBadge({ status }: { status: N8nExecution["status"] }) {
  const styles: Record<N8nExecution["status"], string> = {
    success: "text-green-600 bg-green-50",
    error: "text-red-600 bg-red-50",
    crashed: "text-red-600 bg-red-50",
    running: "text-amber-600 bg-amber-50 animate-pulse",
    waiting: "text-yellow-600 bg-yellow-50",
  };
  const icons: Record<N8nExecution["status"], React.ReactNode> = {
    success: <CheckCircle className="w-3 h-3" />,
    error: <XCircle className="w-3 h-3" />,
    crashed: <XCircle className="w-3 h-3" />,
    running: <Loader2 className="w-3 h-3 animate-spin" />,
    waiting: <Clock className="w-3 h-3" />,
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${styles[status]}`}>
      {icons[status]} {status}
    </span>
  );
}

function ActiveToggle({
  id,
  active,
  onToggle,
}: {
  id: string;
  active: boolean;
  onToggle: (id: string, next: boolean) => void;
}) {
  return (
    <button
      onClick={() => onToggle(id, !active)}
      title={active ? "Deactivate" : "Activate"}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
        active ? "bg-[var(--accent)]" : "bg-[var(--border)]"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ${
          active ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export default function PipelinesPage() {
  const [workflows, setWorkflows] = useState<N8nWorkflow[]>([]);
  const [executions, setExecutions] = useState<N8nExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [notConfigured, setNotConfigured] = useState(false);
  const [triggering, setTriggering] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const fetchData = useCallback(async () => {
    try {
      const [wfRes, exRes] = await Promise.all([
        fetch("/api/n8n/workflows"),
        fetch("/api/n8n/executions"),
      ]);

      if (wfRes.status === 503) { setNotConfigured(true); return; }
      setNotConfigured(false);

      if (wfRes.ok) {
        const wfData = await wfRes.json();
        setWorkflows(wfData.data ?? wfData ?? []);
      }
      if (exRes.ok) {
        const exData = await exRes.json();
        setExecutions(exData.data ?? exData ?? []);
      }
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  async function handleTrigger(id: string, name: string) {
    setTriggering(id);
    try {
      const res = await fetch(`/api/n8n/workflows/${id}/trigger`, { method: "POST" });
      if (res.ok) {
        setTimeout(fetchData, 2000); // re-fetch after 2s to catch new execution
      }
    } finally {
      setTriggering(null);
    }
  }

  async function handleToggle(id: string, next: boolean) {
    // Optimistic update
    setWorkflows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, active: next } : w))
    );
    const endpoint = next ? "activate" : "deactivate";
    const res = await fetch(`/api/n8n/workflows/${id}/${endpoint}`, { method: "POST" });
    if (!res.ok) {
      // Revert on failure
      setWorkflows((prev) =>
        prev.map((w) => (w.id === id ? { ...w, active: !next } : w))
      );
    }
  }

  function lastExecForWorkflow(workflowId: string): N8nExecution | undefined {
    return executions
      .filter((e) => e.workflowId === workflowId)
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())[0];
  }

  function relativeTime(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60_000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  }

  if (notConfigured) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-2 mb-6">
          <GitBranch className="w-5 h-5 text-[var(--accent)]" />
          <h1 className="text-xl font-semibold">Pipelines</h1>
        </div>
        <div className="bg-[var(--muted-surface)] rounded-xl p-6 text-center space-y-3">
          <p className="text-sm font-medium text-[var(--foreground)]">n8n not configured</p>
          <p className="text-sm text-[var(--muted)]">
            Add <code className="bg-[var(--border)] px-1 rounded text-xs">N8N_BASE_URL</code> and{" "}
            <code className="bg-[var(--border)] px-1 rounded text-xs">N8N_API_KEY</code> to your
            environment variables to connect your Railway n8n instance.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitBranch className="w-5 h-5 text-[var(--accent)]" />
          <h1 className="text-xl font-semibold text-[var(--foreground)]">Pipelines</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-[var(--muted)]">
            Refreshes every 30s — last: {lastRefresh.toLocaleTimeString()}
          </span>
          <button
            onClick={fetchData}
            className="p-1.5 rounded-md hover:bg-[var(--muted-surface)] text-[var(--muted)] transition-colors"
            title="Refresh now"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Workflows table */}
      <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--muted-surface)]">
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--muted)] uppercase tracking-wide">Workflow</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--muted)] uppercase tracking-wide">Active</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--muted)] uppercase tracking-wide">Last Run</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-[var(--muted)] uppercase tracking-wide">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <tr key={i} className="border-b border-[var(--border)] last:border-0 animate-pulse">
                  <td className="px-4 py-3"><div className="h-4 bg-[var(--muted-surface)] rounded w-40" /></td>
                  <td className="px-4 py-3"><div className="h-5 bg-[var(--muted-surface)] rounded w-9" /></td>
                  <td className="px-4 py-3"><div className="h-4 bg-[var(--muted-surface)] rounded w-16" /></td>
                  <td className="px-4 py-3"><div className="h-5 bg-[var(--muted-surface)] rounded w-16" /></td>
                  <td className="px-4 py-3"><div className="h-7 bg-[var(--muted-surface)] rounded w-20" /></td>
                </tr>
              ))
            ) : workflows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-sm text-[var(--muted)]">
                  No workflows found. Create workflows in your n8n instance.
                </td>
              </tr>
            ) : (
              workflows.map((wf) => {
                const lastExec = lastExecForWorkflow(wf.id);
                return (
                  <tr key={wf.id} className="border-b border-[var(--border)] last:border-0 hover:bg-[var(--muted-surface)]/40 transition-colors">
                    <td className="px-4 py-3 font-medium text-[var(--foreground)]">{wf.name}</td>
                    <td className="px-4 py-3">
                      <ActiveToggle id={wf.id} active={wf.active} onToggle={handleToggle} />
                    </td>
                    <td className="px-4 py-3 text-[var(--muted)]">
                      {lastExec ? relativeTime(lastExec.startedAt) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {lastExec ? <StatusBadge status={lastExec.status} /> : <span className="text-[var(--muted)] text-xs">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleTrigger(wf.id, wf.name)}
                        disabled={triggering === wf.id}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-[var(--accent)] text-[var(--accent-foreground)] rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
                      >
                        {triggering === wf.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Play className="w-3 h-3 fill-current" />
                        )}
                        Run now
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Recent executions */}
      {!loading && executions.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-medium text-[var(--muted)] uppercase tracking-wide">Recent Executions</h2>
          <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] bg-[var(--muted-surface)]">
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-[var(--muted)] uppercase tracking-wide">Workflow</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-[var(--muted)] uppercase tracking-wide">Started</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-[var(--muted)] uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-2.5 text-xs font-medium text-[var(--muted)] uppercase tracking-wide">Mode</th>
                </tr>
              </thead>
              <tbody>
                {executions.slice(0, 15).map((ex) => {
                  const wf = workflows.find((w) => w.id === ex.workflowId);
                  return (
                    <tr key={ex.id} className="border-b border-[var(--border)] last:border-0">
                      <td className="px-4 py-2.5 text-[var(--foreground)]">{wf?.name ?? ex.workflowId}</td>
                      <td className="px-4 py-2.5 text-[var(--muted)]">{relativeTime(ex.startedAt)}</td>
                      <td className="px-4 py-2.5"><StatusBadge status={ex.status} /></td>
                      <td className="px-4 py-2.5 text-[var(--muted)] capitalize">{ex.mode}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
