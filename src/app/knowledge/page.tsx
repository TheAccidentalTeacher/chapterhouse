"use client";

import { useState, useEffect, useCallback } from "react";
import { BookOpen, Plus, Trash2, Pencil, Check, X, ChevronRight, Zap, ZapOff, Loader2 } from "lucide-react";

interface KnowledgeNode {
  id: string;
  created_at: string;
  updated_at: string;
  folder: string;
  subfolder: string | null;
  title: string;
  body: string;
  source_type: string;
  source_ref: string | null;
  is_active: boolean;
  inject_order: number;
  tags: string[];
}

interface ApiResponse {
  nodes: KnowledgeNode[];
  folders: string[];
}

// ── Inline edit helpers ─────────────────────────────────────────────────────

function FolderSidebar({
  folders,
  active,
  counts,
  onSelect,
}: {
  folders: string[];
  active: string | null;
  counts: Record<string, number>;
  onSelect: (f: string | null) => void;
}) {
  return (
    <nav className="w-52 shrink-0 border-r border-zinc-800 pr-4 flex flex-col gap-1">
      <button
        onClick={() => onSelect(null)}
        className={`text-left px-3 py-2 rounded text-sm font-medium transition-colors ${
          active === null ? "bg-amber-900/30 text-amber-400" : "text-zinc-400 hover:text-zinc-200"
        }`}
      >
        All nodes
        <span className="ml-1 text-xs text-zinc-500">({counts["__all__"] ?? 0})</span>
      </button>
      {folders.map((f) => (
        <button
          key={f}
          onClick={() => onSelect(f)}
          className={`text-left px-3 py-2 rounded text-sm flex items-center gap-1 transition-colors ${
            active === f ? "bg-amber-900/30 text-amber-400" : "text-zinc-400 hover:text-zinc-200"
          }`}
        >
          <ChevronRight size={12} className="shrink-0" />
          <span className="truncate">{f}</span>
          <span className="ml-auto text-xs text-zinc-600">({counts[f] ?? 0})</span>
        </button>
      ))}
    </nav>
  );
}

function NodeCard({
  node,
  onToggleActive,
  onDelete,
  onUpdate,
}: {
  node: KnowledgeNode;
  onToggleActive: (id: string, next: boolean) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, patch: Partial<KnowledgeNode>) => void;
}) {
  const [editMode, setEditMode] = useState(false);
  const [editTitle, setEditTitle] = useState(node.title);
  const [editBody, setEditBody] = useState(node.body);
  const [editFolder, setEditFolder] = useState(node.folder);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    onUpdate(node.id, { title: editTitle, body: editBody, folder: editFolder });
    setEditMode(false);
    setSaving(false);
  };

  const handleCancel = () => {
    setEditTitle(node.title);
    setEditBody(node.body);
    setEditFolder(node.folder);
    setEditMode(false);
  };

  const folderLabel = node.subfolder ? `${node.folder} / ${node.subfolder}` : node.folder;
  const preview = node.body.length > 200 ? node.body.slice(0, 200) + "…" : node.body;

  return (
    <div
      className={`rounded-lg border p-4 flex flex-col gap-3 transition-all ${
        node.is_active
          ? "border-amber-700/60 bg-amber-950/20"
          : "border-zinc-800 bg-zinc-900/40"
      }`}
    >
      {/* Header row */}
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          {editMode ? (
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-sm text-zinc-100 font-medium"
            />
          ) : (
            <p className="text-sm font-medium text-zinc-100 leading-snug">{node.title}</p>
          )}
        </div>

        {/* Active toggle */}
        <button
          onClick={() => onToggleActive(node.id, !node.is_active)}
          title={node.is_active ? "Remove from chat context" : "Promote to chat context"}
          className={`shrink-0 p-1.5 rounded transition-colors ${
            node.is_active
              ? "text-amber-400 hover:text-amber-300 bg-amber-900/30"
              : "text-zinc-600 hover:text-amber-400"
          }`}
        >
          {node.is_active ? <Zap size={14} /> : <ZapOff size={14} />}
        </button>

        {/* Edit / Delete */}
        {!editMode ? (
          <>
            <button
              onClick={() => setEditMode(true)}
              className="shrink-0 p-1.5 rounded text-zinc-600 hover:text-zinc-300 transition-colors"
            >
              <Pencil size={13} />
            </button>
            {confirmDelete ? (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onDelete(node.id)}
                  className="text-xs px-2 py-1 bg-red-900/40 text-red-400 rounded hover:bg-red-900/60"
                >
                  Delete
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="text-xs px-2 py-1 text-zinc-500 hover:text-zinc-300"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="shrink-0 p-1.5 rounded text-zinc-700 hover:text-red-500 transition-colors"
              >
                <Trash2 size={13} />
              </button>
            )}
          </>
        ) : (
          <>
            <button
              onClick={handleSave}
              disabled={saving}
              className="shrink-0 p-1.5 rounded text-green-500 hover:text-green-400"
            >
              {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
            </button>
            <button
              onClick={handleCancel}
              className="shrink-0 p-1.5 rounded text-zinc-600 hover:text-zinc-300"
            >
              <X size={13} />
            </button>
          </>
        )}
      </div>

      {/* Body */}
      {editMode ? (
        <textarea
          value={editBody}
          onChange={(e) => setEditBody(e.target.value)}
          rows={4}
          className="w-full bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-300 resize-y"
        />
      ) : (
        <p className="text-xs text-zinc-400 leading-relaxed">{preview}</p>
      )}

      {/* Footer */}
      <div className="flex items-center gap-3 text-xs text-zinc-600">
        {editMode ? (
          <input
            value={editFolder}
            onChange={(e) => setEditFolder(e.target.value)}
            placeholder="folder"
            className="bg-zinc-800 border border-zinc-700 rounded px-2 py-0.5 text-xs text-zinc-400 w-32"
          />
        ) : (
          <span className="px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-500">{folderLabel}</span>
        )}
        {node.source_ref && (
          <span className="truncate max-w-[240px]" title={node.source_ref}>
            {node.source_ref}
          </span>
        )}
        {node.is_active && (
          <span className="ml-auto text-amber-600 font-medium">● In context</span>
        )}
      </div>
    </div>
  );
}

function NewNodeForm({
  defaultFolder,
  onCreated,
  onCancel,
}: {
  defaultFolder: string;
  onCreated: (node: KnowledgeNode) => void;
  onCancel: () => void;
}) {
  const [folder, setFolder] = useState(defaultFolder);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !body.trim()) return;
    setSaving(true);
    const res = await fetch("/api/knowledge", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folder: folder || "general", title: title.trim(), body: body.trim() }),
    });
    const data = await res.json() as { node: KnowledgeNode };
    onCreated(data.node);
    setSaving(false);
  };

  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-4 flex flex-col gap-3">
      <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">New Note</p>
      <input
        value={folder}
        onChange={(e) => setFolder(e.target.value)}
        placeholder="Folder (e.g. newsletters, competitors)"
        className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-300 placeholder-zinc-600"
      />
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title — short and specific"
        className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-sm text-zinc-100 placeholder-zinc-600"
        autoFocus
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={4}
        placeholder="Distilled insight — 2 to 5 sentences, evergreen"
        className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1.5 text-xs text-zinc-300 placeholder-zinc-600 resize-y"
      />
      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={saving || !title.trim() || !body.trim()}
          className="px-3 py-1.5 bg-amber-700 hover:bg-amber-600 text-white text-xs rounded disabled:opacity-50 flex items-center gap-1.5"
        >
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
          Save
        </button>
        <button onClick={onCancel} className="px-3 py-1.5 text-zinc-500 hover:text-zinc-300 text-xs">
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function KnowledgePage() {
  const [nodes, setNodes] = useState<KnowledgeNode[]>([]);
  const [folders, setFolders] = useState<string[]>([]);
  const [activeFolder, setActiveFolder] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [activeOnly, setActiveOnly] = useState(false);

  const fetchNodes = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeFolder) params.set("folder", activeFolder);
    if (activeOnly) params.set("active_only", "true");
    const res = await fetch(`/api/knowledge?${params.toString()}`);
    const data = await res.json() as ApiResponse;
    setNodes(data.nodes ?? []);
    setFolders(data.folders ?? []);
    setLoading(false);
  }, [activeFolder, activeOnly]);

  useEffect(() => { void fetchNodes(); }, [fetchNodes]);

  // Build per-folder counts from ALL nodes (after folder-filtered fetch, all counts = filtered)
  // To show global counts, we track a separate all-nodes list here.
  const [allNodes, setAllNodes] = useState<KnowledgeNode[]>([]);
  useEffect(() => {
    fetch("/api/knowledge")
      .then((r) => r.json())
      .then((d: ApiResponse) => setAllNodes(d.nodes ?? []))
      .catch(() => { /* ignore */ });
  }, []);

  const folderCounts = allNodes.reduce<Record<string, number>>((acc, n) => {
    acc["__all__"] = (acc["__all__"] ?? 0) + 1;
    acc[n.folder] = (acc[n.folder] ?? 0) + 1;
    return acc;
  }, {});

  const handleToggleActive = async (id: string, next: boolean) => {
    await fetch("/api/knowledge", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, is_active: next }),
    });
    setNodes((prev) => prev.map((n) => (n.id === id ? { ...n, is_active: next } : n)));
    setAllNodes((prev) => prev.map((n) => (n.id === id ? { ...n, is_active: next } : n)));
  };

  const handleDelete = async (id: string) => {
    await fetch(`/api/knowledge?id=${id}`, { method: "DELETE" });
    setNodes((prev) => prev.filter((n) => n.id !== id));
    setAllNodes((prev) => prev.filter((n) => n.id !== id));
  };

  const handleUpdate = async (id: string, patch: Partial<KnowledgeNode>) => {
    const res = await fetch("/api/knowledge", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...patch }),
    });
    const data = await res.json() as { node: KnowledgeNode };
    setNodes((prev) => prev.map((n) => (n.id === id ? data.node : n)));
    setAllNodes((prev) => prev.map((n) => (n.id === id ? data.node : n)));
  };

  const handleCreated = (node: KnowledgeNode) => {
    setNodes((prev) => [node, ...prev]);
    setAllNodes((prev) => [node, ...prev]);
    if (!folders.includes(node.folder)) setFolders((prev) => [...prev, node.folder].sort());
    setShowNewForm(false);
  };

  const activeCount = allNodes.filter((n) => n.is_active).length;

  return (
    <div className="flex flex-col h-full gap-0">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 shrink-0">
        <div className="flex items-center gap-3">
          <BookOpen size={18} className="text-amber-500" />
          <div>
            <h1 className="text-sm font-semibold text-zinc-100">Knowledge Library</h1>
            <p className="text-xs text-zinc-500">
              {allNodes.length} nodes · {activeCount} in chat context
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveOnly(!activeOnly)}
            className={`text-xs px-3 py-1.5 rounded border transition-colors ${
              activeOnly
                ? "border-amber-700 bg-amber-900/30 text-amber-400"
                : "border-zinc-700 text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {activeOnly ? "● In context only" : "All nodes"}
          </button>
          <button
            onClick={() => setShowNewForm(true)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-amber-800/50 hover:bg-amber-700/60 text-amber-300 rounded border border-amber-800 transition-colors"
          >
            <Plus size={13} />
            New note
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <div className="p-4 overflow-y-auto shrink-0">
          <FolderSidebar
            folders={folders}
            active={activeFolder}
            counts={folderCounts}
            onSelect={setActiveFolder}
          />
        </div>

        {/* Node list */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
          {showNewForm && (
            <NewNodeForm
              defaultFolder={activeFolder ?? "general"}
              onCreated={handleCreated}
              onCancel={() => setShowNewForm(false)}
            />
          )}

          {loading && (
            <div className="flex items-center gap-2 text-zinc-500 text-sm py-8 justify-center">
              <Loader2 size={16} className="animate-spin" />
              Loading…
            </div>
          )}

          {!loading && nodes.length === 0 && !showNewForm && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-zinc-600">
              <BookOpen size={32} />
              <p className="text-sm">No knowledge nodes yet.</p>
              <p className="text-xs">
                Extract insights from newsletters in the Email inbox, or click{" "}
                <strong className="text-zinc-400">New note</strong> to add one manually.
              </p>
            </div>
          )}

          {nodes.map((node) => (
            <NodeCard
              key={node.id}
              node={node}
              onToggleActive={handleToggleActive}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
