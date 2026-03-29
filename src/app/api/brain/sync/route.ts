import { NextResponse } from "next/server";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";

// POST /api/brain/sync
// Fetches Scott's brain from the private GitHub repo and upserts into context_files.
// Auth: Bearer BRAIN_SYNC_KEY
// Called by: SYNC-BRAIN.bat (after git push) and daily cron.

const GITHUB_REPO = "TheAccidentalTeacher/scott-brain";

// Files to sync from scott-brain → context_files.
// document_type is the unique key (deactivate old → insert new pattern).
// inject_order determines position in buildLiveContext() assembly.
const BRAIN_FILES: {
  path: string;
  document_type: string;
  label: string;
  inject_order: number;
}[] = [
  {
    path: ".github/copilot-instructions.md",
    document_type: "brain_master_context",
    label: "Scott Brain — Master Context",
    inject_order: 1,
  },
  {
    path: "dreamer.md",
    document_type: "brain_dreamer",
    label: "Scott Brain — Dreamer Queue",
    inject_order: 2,
  },
  {
    path: ".claude/agents/gandalf.md",
    document_type: "brain_persona_gandalf",
    label: "Council Persona — Gandalf",
    inject_order: 10,
  },
  {
    path: ".claude/agents/data.md",
    document_type: "brain_persona_data",
    label: "Council Persona — Data",
    inject_order: 11,
  },
  {
    path: ".claude/agents/polgara.md",
    document_type: "brain_persona_polgara",
    label: "Council Persona — Polgara",
    inject_order: 12,
  },
  {
    path: ".claude/agents/earl-harbinger.md",
    document_type: "brain_persona_earl",
    label: "Council Persona — Earl",
    inject_order: 13,
  },
  {
    path: ".claude/agents/silk.md",
    document_type: "brain_persona_silk",
    label: "Council Persona — Silk",
    inject_order: 14,
  },
];

async function fetchFromGitHub(filePath: string): Promise<string> {
  const token = process.env.GITHUB_BRAIN_TOKEN;
  if (!token) throw new Error("GITHUB_BRAIN_TOKEN not configured");

  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/${filePath}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3.raw",
      "User-Agent": "Chapterhouse-BrainSync/1.0",
    },
  });
  if (!res.ok) {
    throw new Error(
      `GitHub fetch failed for ${filePath}: ${res.status} ${res.statusText}`
    );
  }
  return res.text();
}

async function fetchLatestIntelSweep(): Promise<string | null> {
  const token = process.env.GITHUB_BRAIN_TOKEN;
  if (!token) return null;

  // List intel/ directory to find newest dated folder
  const url = `https://api.github.com/repos/${GITHUB_REPO}/contents/intel`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "Chapterhouse-BrainSync/1.0",
    },
  });
  if (!res.ok) return null;

  const items: { name: string; type: string }[] = await res.json();
  const dateFolders = items
    .filter((i) => i.type === "dir" && /^\d{4}-\d{2}-\d{2}$/.test(i.name))
    .sort((a, b) => b.name.localeCompare(a.name));

  if (dateFolders.length === 0) return null;

  const newestFolder = dateFolders[0].name;
  const folderUrl = `https://api.github.com/repos/${GITHUB_REPO}/contents/intel/${newestFolder}`;
  const folderRes = await fetch(folderUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.v3+json",
      "User-Agent": "Chapterhouse-BrainSync/1.0",
    },
  });
  if (!folderRes.ok) return null;

  const folderItems: { name: string; path: string }[] = await folderRes.json();
  const mdFiles = folderItems.filter((f) => f.name.endsWith(".md"));

  const contents = await Promise.all(
    mdFiles.map(async (f) => {
      const text = await fetchFromGitHub(f.path);
      return `<!-- ${f.name} -->\n${text}`;
    })
  );

  return `# Intel Sweep: ${newestFolder}\n\n${contents.join("\n\n---\n\n")}`;
}

async function syncFile(
  supabase: ReturnType<typeof getSupabaseServiceRoleClient>,
  userId: string,
  documentType: string,
  label: string,
  injectOrder: number,
  content: string
): Promise<{ document_type: string; status: string; error?: string }> {
  try {
    // Deactivate any existing active doc of this type
    await supabase!
      .from("context_files")
      .update({ is_active: false })
      .eq("user_id", userId)
      .eq("document_type", documentType)
      .eq("is_active", true);

    // Insert new version
    const { error } = await supabase!.from("context_files").insert({
      user_id: userId,
      name: label,
      content,
      is_active: true,
      document_type: documentType,
      inject_order: injectOrder,
      description: `Brain sync — ${new Date().toISOString()}`,
    });

    if (error) throw error;
    return { document_type: documentType, status: "ok" };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { document_type: documentType, status: "error", error: message };
  }
}

export async function POST(req: Request) {
  // Auth check
  const brainSyncKey = process.env.BRAIN_SYNC_KEY;
  if (!brainSyncKey) {
    return NextResponse.json(
      { error: "BRAIN_SYNC_KEY not configured" },
      { status: 503 }
    );
  }
  const authHeader = req.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : "";
  if (token !== brainSyncKey) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: "DB unavailable" }, { status: 503 });
  }

  // Resolve user_id — single-tenant, use first user (Scott)
  const { data: users } = await supabase.auth.admin.listUsers();
  const firstUser = users?.users?.[0];
  if (!firstUser) {
    return NextResponse.json({ error: "No users found" }, { status: 404 });
  }
  const userId = firstUser.id;

  const results: { document_type: string; status: string; error?: string }[] =
    [];

  // Sync each brain file
  for (const file of BRAIN_FILES) {
    try {
      const content = await fetchFromGitHub(file.path);
      const result = await syncFile(
        supabase,
        userId,
        file.document_type,
        file.label,
        file.inject_order,
        content
      );
      results.push(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      results.push({
        document_type: file.document_type,
        status: "error",
        error: message,
      });
    }
  }

  // Sync latest intel sweep
  try {
    const intelContent = await fetchLatestIntelSweep();
    if (intelContent) {
      const result = await syncFile(
        supabase,
        userId,
        "brain_intel_latest",
        "Scott Brain — Latest Intel Sweep",
        3,
        intelContent
      );
      results.push(result);
    } else {
      results.push({
        document_type: "brain_intel_latest",
        status: "skipped",
        error: "No intel folders found",
      });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    results.push({
      document_type: "brain_intel_latest",
      status: "error",
      error: message,
    });
  }

  const synced = results.filter((r) => r.status === "ok").length;
  const failed = results.filter((r) => r.status === "error").length;

  return NextResponse.json({
    synced,
    failed,
    total: results.length,
    results,
    timestamp: new Date().toISOString(),
  });
}
