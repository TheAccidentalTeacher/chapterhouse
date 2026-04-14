# Session 23 — Test Questions

Use these in Chapterhouse chat to verify push log, email intent, and dismiss signals.

---

## Push Log (tests stale-answer fix)

1. `What was the most recent session and what was built?`
2. `What did Session 22 add to the app?`

## Email Intent Detection

3. `Do I have any new emails?`
4. `What's in my inbox — anything urgent?`

## Dismiss Command

5. `/dismiss Claude Code webinar — not relevant right now`
6. `Stop worrying about the Grammarly lawsuit` *(natural language — tests extract-learnings detection)*

## Dismiss Propagation

7. After dismissing something, ask: `What should I be paying attention to this week?`
   - ✅ Pass: dismissed topic does NOT appear in the answer
   - ❌ Fail: dismissed topic surfaces anyway

8. Generate a daily brief and verify the dismissed topic appears under **⚫ Filtered Out** instead of in any actionable section.

## Undismiss

9. `/undismiss webinar` — should confirm deletion and restore the topic

## Debug Panel

10. Open the debug panel → **App Map tab** → scroll to bottom → verify "Dismissed Signals" section shows the item dismissed in step 5, with an un-dismiss button.

---

## Highest-Risk Tests

- **#7** — dismiss propagation to briefs — most likely to surface a bug
- **#6** — natural language detection — GPT-5.4 must correctly categorize as `dismissed` vs a normal memory fact
