# Focus Board + Scratchpad — Build Spec
**Date:** April 4, 2026
**Estimated build time:** ~20 minutes
**Migration:** 033

---

## What Gets Built

Two components replace the center suggestion cards on the Home page:

1. **Focus Board** — 10-item capped working list, AI-populated, manually editable
2. **Scratchpad** — freeform text area, autosave, always visible

---

## DB — Migration 033

```sql
-- Working list items (capped at 10)
CREATE TABLE focus_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  content TEXT NOT NULL,
  completed BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  source TEXT CHECK (source IN ('manual', 'folio', 'brief', 'dream')) DEFAULT 'manual',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE focus_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user owns focus items" ON focus_items FOR ALL USING (auth.uid() = user_id);

-- Scratchpad (one row per user, upsert pattern)
CREATE TABLE scratch_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL UNIQUE,
  content TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE scratch_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user owns scratch" ON scratch_notes FOR ALL USING (auth.uid() = user_id);
```

---

## API Routes

| Route | Method | What it does |
|---|---|---|
| `/api/focus-items/` | GET | List all items for user, sorted by `sort_order` |
| `/api/focus-items/` | POST | Add item (Zod-validated, rejects if count ≥ 10) |
| `/api/focus-items/[id]/` | PATCH | Edit content, toggle completed, update sort_order |
| `/api/focus-items/[id]/` | DELETE | Remove item |
| `/api/focus-items/populate/` | POST | AI populate (see below) |
| `/api/scratch-notes/` | GET | Fetch user's scratch row |
| `/api/scratch-notes/` | POST | Upsert scratch content |

---

## AI Populate Logic (`/api/focus-items/populate`)

On first Home page load, if `focus_items` count = 0 → auto-fires this route.

```
1. Fetch Folio today's entry → top_action + track_signals
2. Fetch today's brief top items (last brief, "What Actually Matters" section)
3. Fetch Dreams with status = 'active' or 'building' (limit 5)
4. Call Claude Haiku with all three sources:
   "Based on these inputs, generate up to 10 specific, actionable working items
    for Scott today. Be concrete. No vague goals. Format: one item per line."
5. Upsert up to 10 rows into focus_items with source tags (folio/brief/dream)
6. Returns {populated: N, sources: ['folio', 'brief', 'dream']}
```

Cost: ~$0.001 per call. Claude Haiku is right-sized for this.

---

## Component: `FocusBoardPanel`

```
┌─────────────────────────────────────────────┐
│ ⚡ WORKING ON NOW          [+ Add]  [↻ AI]  │
├─────────────────────────────────────────────┤
│ ☐ Build SomersSchool pricing page      [×] │  ← folio dot (amber)
│ ☑ Fix jobs RLS anon policy             [×] │  ← completed, faded
│ ☐ Contact Mat-Su re: allotment         [×] │  ← manual dot (gray)
│ ☐ Write "Robot Teacher" blog post      [×] │  ← brief dot (blue)
│  ...up to 10                                │
│                           7/10 items used   │
└─────────────────────────────────────────────┘
```

**Behavior:**
- Checkbox → marks completed (faded, stays visible until deleted)
- `[×]` → removes item
- `[+ Add]` → inline text input, Enter to save
- `[↻ AI]` → re-runs populate (merges, does NOT wipe manual items)
- Count badge `7/10` — goes amber at 8, red at 10 (can't add at 10, must delete first)

**Source dot colors:**
- 🟡 Amber = folio
- 🔵 Blue = brief
- 🟢 Green = dream
- ⚫ Gray = manual

---

## Component: `ScratchpadPanel`

```
┌─────────────────────────────────────────────┐
│ 📝 SCRATCHPAD                    Saved ✓   │
├─────────────────────────────────────────────┤
│ textarea — freeform, monospace-ish         │
│ debounce autosave at 800ms                 │
│ no formatting, no buttons, just type       │
└─────────────────────────────────────────────┘
```

**Behavior:**
- One textarea, full height of the right column
- Debounce saves to `scratch_notes` at 800ms idle
- "Saved ✓" / "Saving…" status indicator in corner
- No AI, no structure — the escape valve

---

## Home Page Layout Change

**Current center:** 4 suggestion cards in a 2×2 grid

**New center:** two-column layout

```
┌──────────────────────┬──────────────────┐
│   FocusBoardPanel    │  ScratchpadPanel │
│   (left, ~60%)       │   (right, ~40%)  │
└──────────────────────┴──────────────────┘
```

---

## Files to Touch

| File | Change |
|---|---|
| `supabase/migrations/20260404_033_focus_board.sql` | New migration |
| `src/app/api/focus-items/route.ts` | GET + POST |
| `src/app/api/focus-items/[id]/route.ts` | PATCH + DELETE |
| `src/app/api/focus-items/populate/route.ts` | AI populate |
| `src/app/api/scratch-notes/route.ts` | GET + POST (upsert) |
| `src/components/focus-board-panel.tsx` | New component |
| `src/components/scratchpad-panel.tsx` | New component |
| `src/app/page.tsx` | Replace suggestion cards with two new panels |

**Total: 8 files.**
