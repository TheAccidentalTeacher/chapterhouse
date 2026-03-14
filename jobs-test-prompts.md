# Jobs — Test Prompts

Use these in the `/jobs` UI. Create a job, paste the payload, hit Run.
Start with **council_session** — fastest, no external fetch, confirms the whole pipeline in ~10 seconds.

---

## 1. council_session

**Label:** `Test — Council Session`

**Payload:**
```json
{
  "question": "Should I launch SomerSchool with a waitlist before courses are done, or wait until at least 5 courses are fully built?",
  "context": "Teaching contract ends May 24, 2026. Revenue target is meaningful income before August 2026. COPPA compliance is required. Red-and-white brand. Secular content only."
}
```

---

## 2. curriculum_factory

**Label:** `Test — Water Cycle Grade 3`

**Payload:**
```json
{
  "subject": "Science",
  "grade": "3",
  "topic": "The Water Cycle",
  "lessons": 3
}
```

---

## 3. research_batch

**Label:** `Test — Research Batch`

**Payload:**
```json
{
  "urls": [
    "https://www.rainbowresource.com/blog",
    "https://www.cnn.com/tech"
  ],
  "sourceLabel": "Manual test batch"
}
```

> Saves analyzed items directly to `/research` on completion.
