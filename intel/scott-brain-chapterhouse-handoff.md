# Scott-Brain → Chapterhouse Integration Handoff
*Created: March 28, 2026*

## What This Is

Scott's email workspace is his **central brain document** — the source of truth for:
- Council personas (Gandalf, Data, Polgara, Earl, Silk)
- `copilot-instructions.md` — the master identity/context file (115KB)
- `dreamer.md` — the live seed/idea queue
- Intel sweep files — daily AI landscape research
- Dev process methodology

This document tells a future Claude Code session exactly how to wire Chapterhouse to read from the `scott-brain` private GitHub repo so that Chapterhouse's context always reflects the current state of Scott's brain — even when his computer is off.

---

## The Architecture

```
email workspace (local)
      │
      │ SYNC-BRAIN.bat (git add/commit/push)
      ▼
GitHub: TheAccidentalTeacher/scott-brain (PRIVATE)
      │
      │ GitHub Contents API (with PAT)
      │ called by Chapterhouse cron or manual trigger
      ▼
Supabase: context_files table
      │
      │ buildLiveContext() already reads this
      ▼
Every Council chat + solo chat — current brain injected automatically
```

**The key insight:** Chapterhouse already has `buildLiveContext()` which reads from `context_files`. We don't need to change the chat system at all — we just need a sync route that writes the right files into `context_files` with the right `inject_order` values.

---

## What to Build in Chapterhouse

### Step 1: Add the env var

Add to Railway (worker) AND Vercel (app) env vars:

```
GITHUB_BRAIN_TOKEN=<github_pat_here>
```

**How to get the PAT:**
1. Go to `github.com/settings/tokens` → "Tokens (classic)"
2. Generate new token, name it `chapterhouse-brain-reader`
3. Scope: **`repo` only** (read access to private repos — this is all it needs)
4. No expiry (or 1 year max)
5. Copy the token, add to Railway + Vercel env vars

---

### Step 2: Create the sync API route

**File:** `src/app/api/brain/sync/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const GITHUB_BRAIN_TOKEN = process.env.GITHUB_BRAIN_TOKEN!;
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Files to fetch from scott-brain repo
// inject_order determines position in buildLiveContext() assembly
const BRAIN_FILES = [
  {
    path: '.github/copilot-instructions.md',
    slug: 'brain_copilot_instructions',
    label: 'Scott Brain — Master Context',
    inject_order: 1,
  },
  {
    path: 'dreamer.md',
    slug: 'brain_dreamer',
    label: 'Scott Brain — Dreamer Queue',
    inject_order: 2,
  },
  {
    path: '.claude/agents/gandalf.md',
    slug: 'brain_persona_gandalf',
    label: 'Council Persona — Gandalf',
    inject_order: 10,
  },
  {
    path: '.claude/agents/data.md',
    slug: 'brain_persona_data',
    label: 'Council Persona — Data',
    inject_order: 11,
  },
  {
    path: '.claude/agents/polgara.md',
    slug: 'brain_persona_polgara',
    label: 'Council Persona — Polgara',
    inject_order: 12,
  },
  {
    path: '.claude/agents/earl-harbinger.md',
    slug: 'brain_persona_earl',
    label: 'Council Persona — Earl',
    inject_order: 13,
  },
  {
    path: '.claude/agents/silk.md',
    slug: 'brain_persona_silk',
    label: 'Council Persona — Silk',
    inject_order: 14,
  },
];

async function fetchFromGitHub(filePath: string): Promise<string> {
  const url = `https://api.github.com/repos/TheAccidentalTeacher/scott-brain/contents/${filePath}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${GITHUB_BRAIN_TOKEN}`,
      Accept: 'application/vnd.github.v3.raw',
      'User-Agent': 'Chapterhouse-BrainSync/1.0',
    },
  });
  if (!res.ok) {
    throw new Error(`GitHub fetch failed for ${filePath}: ${res.status} ${res.statusText}`);
  }
  return res.text();
}

export async function POST(req: Request) {
  // Verify request is from Scott (or internal cron)
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.BRAIN_SYNC_KEY}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const results: { slug: string; status: string; error?: string }[] = [];

  for (const file of BRAIN_FILES) {
    try {
      const content = await fetchFromGitHub(file.path);

      const { error } = await supabase
        .from('context_files')
        .upsert(
          {
            slug: file.slug,
            label: file.label,
            content,
            inject_order: file.inject_order,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'slug' }
        );

      if (error) throw error;
      results.push({ slug: file.slug, status: 'ok' });
    } catch (err: any) {
      results.push({ slug: file.slug, status: 'error', error: err.message });
    }
  }

  // Also fetch the most recent intel sweep
  try {
    const intelContent = await fetchLatestIntelSweep();
    if (intelContent) {
      const { error } = await supabase
        .from('context_files')
        .upsert(
          {
            slug: 'brain_intel_latest',
            label: 'Scott Brain — Latest Intel Sweep',
            content: intelContent,
            inject_order: 3,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'slug' }
        );
      if (error) throw error;
      results.push({ slug: 'brain_intel_latest', status: 'ok' });
    }
  } catch (err: any) {
    results.push({ slug: 'brain_intel_latest', status: 'error', error: err.message });
  }

  const failed = results.filter(r => r.status === 'error');
  return NextResponse.json({
    synced: results.filter(r => r.status === 'ok').length,
    failed: failed.length,
    results,
    timestamp: new Date().toISOString(),
  });
}

// Fetches a directory listing and grabs the newest dated folder
async function fetchLatestIntelSweep(): Promise<string | null> {
  const url = 'https://api.github.com/repos/TheAccidentalTeacher/scott-brain/contents/intel';
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${GITHUB_BRAIN_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'Chapterhouse-BrainSync/1.0',
    },
  });
  if (!res.ok) return null;

  const items: { name: string; type: string }[] = await res.json();
  const dateFolders = items
    .filter(i => i.type === 'dir' && /^\d{4}-\d{2}-\d{2}$/.test(i.name))
    .sort((a, b) => b.name.localeCompare(a.name));

  if (dateFolders.length === 0) return null;

  const newestFolder = dateFolders[0].name;
  const folderUrl = `https://api.github.com/repos/TheAccidentalTeacher/scott-brain/contents/intel/${newestFolder}`;
  const folderRes = await fetch(folderUrl, {
    headers: {
      Authorization: `Bearer ${GITHUB_BRAIN_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
      'User-Agent': 'Chapterhouse-BrainSync/1.0',
    },
  });
  if (!folderRes.ok) return null;

  const folderItems: { name: string; path: string }[] = await folderRes.json();
  const mdFiles = folderItems.filter(f => f.name.endsWith('.md'));

  const contents = await Promise.all(
    mdFiles.map(async f => {
      const text = await fetchFromGitHub(f.path);
      return `<!-- ${f.name} -->\n${text}`;
    })
  );

  return `# Intel Sweep: ${newestFolder}\n\n${contents.join('\n\n---\n\n')}`;
}
```

---

### Step 3: Add BRAIN_SYNC_KEY env var

This key protects the `/api/brain/sync` endpoint. Generate a random string:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Add to Vercel env vars:
```
BRAIN_SYNC_KEY=<random_32_byte_hex>
```

---

### Step 4: Add to SYNC-BRAIN.bat (already done on email side)

The email workspace `SYNC-BRAIN.bat` should call `/api/brain/sync` after pushing to GitHub. Add this to `tools/push_to_chapterhouse.mjs` as a new `--doc brain` option, OR call it directly from the bat file:

```bat
:: In SYNC-BRAIN.bat, after git push succeeds, add:
curl -s -X POST https://chapterhouse.vercel.app/api/brain/sync ^
  -H "Authorization: Bearer %BRAIN_SYNC_KEY%" ^
  -H "Content-Type: application/json" ^
  && echo Chapterhouse brain sync triggered.
```

Add `BRAIN_SYNC_KEY` to `.env.master` alongside `CHAPTERHOUSE_PUSH_KEY`.

---

### Step 5: (Optional) Daily cron

In `src/app/api/cron/brain-sync/route.ts` — a GET handler on a Vercel cron schedule:

```typescript
// vercel.json cron: "0 12 * * *"  (noon UTC = 4am Alaska)
export async function GET() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/brain/sync`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.BRAIN_SYNC_KEY}` },
  });
  const data = await res.json();
  return NextResponse.json(data);
}
```

---

## What Changes in Chapterhouse Chat

**Nothing.** `buildLiveContext()` already assembles from `context_files`. Once the brain files are in that table, every Council chat and solo chat will automatically have:

- Scott's full master context (`inject_order: 1`)
- Current dreamer queue (`inject_order: 2`)  
- Latest intel sweep (`inject_order: 3`)
- All 5 Council persona files (`inject_order: 10-14`)

The Council route (`src/app/api/chat/council/route.ts`) will need persona slugs updated from the old B&B reference to pull from the new `brain_persona_*` slugs. See the B&B → Silk migration section below.

---

## B&B → Silk Migration (Council Code)

These three Chapterhouse files still reference Beavis & Butthead and need to be updated:

### 1. `src/app/api/chat/council/route.ts`
Find the COUNCIL array (5th member is B&B). Replace with Silk:

```typescript
// OLD:
{ id: 'beavis', name: 'Beavis & Butthead', ... }

// NEW:
{
  id: 'silk',
  name: 'Prince Kheldar (Silk)',
  role: 'Pattern Breaker / Devoted Cynic',
  systemPrompt: '', // loaded from context_files slug: brain_persona_silk
}
```

### 2. `worker/src/lib/council-prompts.ts`
The `COUNCIL_PROMPTS` object has a `beavis` key with inline prompt. Replace key `beavis` with `silk` and content with the persona from `.claude/agents/silk.md`.

### 3. `council-worker/agents/beavis.py`
This is the legacy Python CrewAI agent. It's deprecated — mark as LEGACY, do not delete:
```python
# LEGACY: Beavis & Butthead Council pass — replaced by Silk (Prince Kheldar)
# architecture reference only — do not extend
```

---

## Summary of New Env Vars Needed

| Variable | Where | What |
|---|---|---|
| `GITHUB_BRAIN_TOKEN` | Vercel + Railway | GitHub PAT with `repo` scope (read private repos) |
| `BRAIN_SYNC_KEY` | Vercel + `.env.master` | Auth key for `/api/brain/sync` endpoint |

---

## File Checklist for the Build Session

- [ ] Add `GITHUB_BRAIN_TOKEN` to Vercel env vars
- [ ] Add `BRAIN_SYNC_KEY` to Vercel env vars and `.env.master`
- [ ] Create `src/app/api/brain/sync/route.ts` (code above)
- [ ] Test: `POST /api/brain/sync` with `Authorization: Bearer <key>`
- [ ] Verify `context_files` table received the brain slugs
- [ ] Verify next Council chat includes persona content from the new slugs
- [ ] (Optional) Add daily cron at noon UTC
- [ ] Update `SYNC-BRAIN.bat` with curl call to `/api/brain/sync`
- [ ] Update `worker/src/lib/council-prompts.ts` — beavis → silk
- [ ] Update `src/app/api/chat/council/route.ts` — 5th member
- [ ] Mark `council-worker/agents/beavis.py` as LEGACY

---

*This handoff was generated from the scott-brain workspace on March 28, 2026.*
*Source repo: `https://github.com/TheAccidentalTeacher/scott-brain` (private)*
