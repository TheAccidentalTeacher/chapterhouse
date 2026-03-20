import { NextResponse } from "next/server";
import { getSupabaseServiceRoleClient } from "@/lib/supabase-server";
import { z } from "zod";

// POST /api/context/push
// API-key-authenticated endpoint so external VS Code workspaces can push context updates
// to Chapterhouse without a browser session.
//
// Authentication: Bearer token in Authorization header.
// Key: CHAPTERHOUSE_PUSH_KEY env var (set in Vercel + local .env.local)
//
// Usage from another workspace:
//   curl -X POST https://chapterhouse.vercel.app/api/context/push \
//     -H "Authorization: Bearer <CHAPTERHOUSE_PUSH_KEY>" \
//     -H "Content-Type: application/json" \
//     -d '{ "document_type": "dreamer", "action": "replace", "content": "..." }'
//
// Actions:
//   replace     — deactivates current active doc of this type, inserts new version
//   append      — appends content to end of current active doc (creates new version)
//   insert_seed — appends a formatted seed entry to the dreamer document

const INJECT_ORDER_DEFAULTS: Record<string, number> = {
  copilot_instructions: 1,
  dreamer: 2,
  extended_context: 3,
  intel: 4,
  custom: 5,
};

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  copilot_instructions: "Copilot Instructions",
  dreamer: "Dreamer",
  extended_context: "Extended Context",
  intel: "Intel",
  custom: "Custom",
};

const pushSchema = z.object({
  // Which named document slot to update
  document_type: z.enum(["copilot_instructions", "dreamer", "extended_context", "intel", "custom"]),
  // What to do with the content
  action: z.enum(["replace", "append", "insert_seed"]),
  // The content (full document for 'replace', text to add for 'append'/'insert_seed')
  content: z.string().min(1),
  // Optional: human-readable seed title (used for insert_seed action)
  seed_title: z.string().max(200).optional(),
  // Optional: which user to target (defaults to the first user found — Scott's account)
  user_email: z.string().email().optional(),
});

function checkApiKey(request: Request): boolean {
  const pushKey = process.env.CHAPTERHOUSE_PUSH_KEY;
  if (!pushKey) return false;                     // Key not configured — reject all push requests
  const authHeader = request.headers.get("Authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  return token === pushKey;
}

export async function POST(request: Request) {
  // --- Auth check ---
  if (!checkApiKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: "DB unavailable" }, { status: 503 });
  }

  // --- Parse body ---
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = pushSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { document_type, action, content, seed_title, user_email } = parsed.data;

  // --- Resolve user_id ---
  // If user_email is provided, look up the user. Otherwise use the first user in auth.users.
  let userId: string;
  if (user_email) {
    const { data: users } = await supabase.auth.admin.listUsers();
    const match = users?.users?.find((u) => u.email === user_email);
    if (!match) {
      return NextResponse.json({ error: `User not found: ${user_email}` }, { status: 404 });
    }
    userId = match.id;
  } else {
    // Default: first user (Scott's single-tenant setup)
    const { data: users } = await supabase.auth.admin.listUsers();
    const first = users?.users?.[0];
    if (!first) {
      return NextResponse.json({ error: "No users found" }, { status: 404 });
    }
    userId = first.id;
  }

  // --- Fetch current active doc for this type (needed for append/insert_seed) ---
  const { data: current } = await supabase
    .from("context_files")
    .select("id, content")
    .eq("user_id", userId)
    .eq("document_type", document_type)
    .eq("is_active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // --- Compute new content based on action ---
  let newContent: string;

  if (action === "replace") {
    newContent = content;

  } else if (action === "append") {
    newContent = current ? `${current.content}\n\n${content}` : content;

  } else {
    // insert_seed — append a formatted seed entry after the last seed in dreamer
    const existingContent = current?.content ?? "";
    const title = seed_title ?? "New Seed";
    const seedEntry = `\n\n**${title}**\n\n${content}\n`;
    newContent = existingContent + seedEntry;
  }

  const inject_order = INJECT_ORDER_DEFAULTS[document_type] ?? 5;
  const name = DOCUMENT_TYPE_LABELS[document_type] ?? "Context Document";

  // --- Deactivate current doc of this type ---
  await supabase
    .from("context_files")
    .update({ is_active: false })
    .eq("user_id", userId)
    .eq("document_type", document_type)
    .eq("is_active", true);

  // --- Insert new version ---
  const { data: inserted, error } = await supabase
    .from("context_files")
    .insert({
      user_id: userId,
      name,
      content: newContent,
      is_active: true,
      document_type,
      inject_order,
      description: `Pushed via API — action: ${action}`,
    })
    .select("id, document_type, inject_order, is_active, updated_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    document_type,
    action,
    char_count: newContent.length,
    contextFile: inserted,
  });
}
