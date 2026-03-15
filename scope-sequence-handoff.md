# Scope & Sequence Handoff Format

> **Purpose:** This document defines the exact JSON format that the scope/sequence generator must output for the SomersSchool curriculum pipeline to consume. One file per course. The pipeline uses this to auto-generate course manifests, unit outlines, and all downstream content (lesson bundles, audio, images, quizzes, worksheets).

---

## Output Location

Place files in a `scope-sequence/` directory:

```
scope-sequence/
  sci-g1.json        ← Grade 1 Science
  sci-g2.json        ← Grade 2 Science
  mth-g1.json        ← Grade 1 Math
  ela-g3.json        ← Grade 3 ELA
  hst-g5.json        ← Grade 5 History
  ...
```

**Filename pattern:** `{subject_code}-g{grade}.json`

---

## Subject Codes (Required — Use These Exactly)

| Subject | Code |
|---|---|
| Science | `sci` |
| Math | `mth` |
| Language Arts | `ela` |
| History | `hst` |
| Bible | `bib` |
| Art | `art` |
| Music | `mus` |
| PE | `pe` |

---

## Grade Bands (Auto-Derived — Do Not Guess)

The pipeline maps grades to bands automatically. Include the correct `grade_band` for reference:

| Grades | Band |
|---|---|
| K (0), 1, 2 | `early_elementary` |
| 3, 4, 5 | `upper_elementary` |
| 6, 7, 8 | `middle` |
| 9, 10, 11, 12 | `high` |

---

## Standards Frameworks (Use the Correct One Per Subject)

| Subject | Framework | Example Codes |
|---|---|---|
| Science | NGSS (Next Generation Science Standards) | `K-LS1-1`, `1-ESS1-2`, `MS-PS1-3` |
| Math | CCSS-Math (Common Core) | `1.OA.A.1`, `3.NF.A.2`, `6.RP.A.3` |
| Language Arts | CCSS-ELA (Common Core) | `RL.1.1`, `W.3.2`, `L.5.4` |
| History | C3 Framework | `D2.His.1.3-5`, `D2.Geo.2.6-8` |
| Bible | None — use internal SomerSchool objectives | `SS-BIB-OT-1.1` (free format) |

**Rules:**
- NATIONWIDE standards ONLY — never use state-specific standards (no TEKS, no SOL, no state frameworks)
- Every lesson must have at least 1 standard code
- Standards can repeat across lessons within a unit (common for spiral curricula)

---

## Unit/Lesson Structure Rules

| Rule | Value |
|---|---|
| Lessons per unit | **6** (always — lessons 1–5 teach, lesson 6 reviews) |
| Lesson 6 | Always a review lesson — `"is_review": true` |
| Units per course | Typically **4** (= 24 lessons total), but flexible |
| Sections per lesson | **5** (enforced downstream in outline generation) |
| Quiz questions | 5–8 per lesson |
| Vocabulary | 4–8 new terms per teaching lesson; 0 new for review |
| Activities | 2–3 per lesson, household materials only ($0–$5) |

---

## The JSON Format

```json
{
  "id": "sci-g1",
  "schema_version": "1.0",
  "subject": "Science",
  "subject_code": "sci",
  "grade": 1,
  "grade_band": "early_elementary",
  "title": "Grade 1 Science",
  "subtitle": "Life Science and Earth Science Through Wonder and Observation",
  "faith_integration": false,
  "theology_profile": "none",
  "standards_framework": "NGSS",

  "units": [
    {
      "unit_number": 1,
      "title": "Living and Non-Living Things",
      "description": "Students explore what makes something alive by examining the four signs of life: breathing, eating, growing, and reproducing. They learn to classify objects as living, non-living, or once-living.",
      "lessons": [
        {
          "lesson_number": 1,
          "title": "Living and Non-Living Things",
          "big_idea": "Living things breathe, eat, grow, and reproduce — non-living things do not do any of these things.",
          "standards": ["K-LS1-1", "1-LS1-2"],
          "key_concepts": [
            "four signs of life: breathe, eat, grow, reproduce",
            "living vs non-living classification",
            "observation as a scientific tool"
          ]
        },
        {
          "lesson_number": 2,
          "title": "What Living Things Need",
          "big_idea": "All living things need food, water, air, and shelter to survive.",
          "standards": ["K-LS1-1"],
          "key_concepts": [
            "basic survival needs",
            "food as energy source",
            "habitats provide shelter"
          ]
        },
        {
          "lesson_number": 3,
          "title": "How Living Things Grow",
          "big_idea": "All living things grow and change over time in predictable patterns.",
          "standards": ["1-LS1-2"],
          "key_concepts": [
            "growth patterns in plants and animals",
            "life stages",
            "baby to adult progression"
          ]
        },
        {
          "lesson_number": 4,
          "title": "How Animals Respond to Their World",
          "big_idea": "Animals sense their environment and respond to survive.",
          "standards": ["1-LS1-1"],
          "key_concepts": [
            "senses help animals survive",
            "responses to stimuli",
            "instinct vs learned behavior"
          ]
        },
        {
          "lesson_number": 5,
          "title": "Parents and Babies",
          "big_idea": "Animals and plants produce offspring that resemble their parents.",
          "standards": ["1-LS1-2", "1-LS3-1"],
          "key_concepts": [
            "reproduction in animals and plants",
            "offspring resemble parents",
            "parental care and survival"
          ]
        },
        {
          "lesson_number": 6,
          "title": "Unit 1 Review: Living Things All Around Us",
          "big_idea": "Review and connect everything we learned about living and non-living things.",
          "standards": ["K-LS1-1", "1-LS1-2", "1-LS3-1"],
          "key_concepts": [
            "cumulative review of living vs non-living",
            "four signs of life",
            "basic needs and growth patterns",
            "parent-offspring relationships"
          ],
          "is_review": true
        }
      ]
    },
    {
      "unit_number": 2,
      "title": "Plants",
      "description": "Students investigate plant structures, what plants need to grow, and how plants are both alike and different.",
      "lessons": [
        {
          "lesson_number": 1,
          "title": "Parts of a Plant",
          "big_idea": "Every plant has parts — roots, stem, leaves, and sometimes flowers — and each part has a job.",
          "standards": ["1-LS1-1"],
          "key_concepts": [
            "root, stem, leaf, flower structure",
            "each part has a function",
            "observation of real plants"
          ]
        }
      ]
    }
  ],

  "meta": {
    "generated_at": "2026-03-14T00:00:00Z",
    "generated_by": "scope-sequence-app",
    "total_units": 4,
    "total_lessons": 24,
    "lessons_per_unit": 6
  }
}
```

---

## Field Reference

### Top Level

| Field | Type | Required | Description |
|---|---|---|---|
| `id` | string | ✅ | `{subject_code}-g{grade}` — e.g., `sci-g1`, `mth-g5` |
| `schema_version` | string | ✅ | Always `"1.0"` |
| `subject` | string | ✅ | Full subject name: `"Science"`, `"Math"`, `"Language Arts"`, `"History"`, `"Bible"`, `"Art"`, `"Music"`, `"PE"` |
| `subject_code` | string | ✅ | 2–3 letter code from table above |
| `grade` | integer | ✅ | 0–12 (0 = Kindergarten) |
| `grade_band` | string | ✅ | `"early_elementary"`, `"upper_elementary"`, `"middle"`, or `"high"` |
| `title` | string | ✅ | Display title — e.g., `"Grade 1 Science"` |
| `subtitle` | string | ✅ | Descriptive subtitle for the course |
| `faith_integration` | boolean | ✅ | `false` for secular courses (SomersSchool default), `true` for faith-integrated |
| `theology_profile` | string | ✅ | `"none"`, `"christian-nondenominational"`, `"christian-reformed"`, or `"christian-general"` |
| `standards_framework` | string | ✅ | `"NGSS"`, `"CCSS-Math"`, `"CCSS-ELA"`, `"C3"`, or `"internal"` |
| `units` | array | ✅ | Array of unit objects (see below) |
| `meta` | object | ✅ | Generation metadata |

### Unit Object

| Field | Type | Required | Description |
|---|---|---|---|
| `unit_number` | integer | ✅ | 1-indexed unit number |
| `title` | string | ✅ | Unit title — descriptive, not generic |
| `description` | string | ✅ | 1–3 sentence summary of what students learn in this unit |
| `lessons` | array | ✅ | Exactly 6 lesson objects per unit |

### Lesson Object

| Field | Type | Required | Description |
|---|---|---|---|
| `lesson_number` | integer | ✅ | 1–6 within the unit |
| `title` | string | ✅ | Lesson title — specific and descriptive |
| `big_idea` | string | ✅ | One sentence summarizing the core takeaway |
| `standards` | array of strings | ✅ | 1+ standard codes from the correct framework |
| `key_concepts` | array of strings | ✅ | 2–5 key concepts covered in this lesson |
| `is_review` | boolean | Optional | Set to `true` for lesson 6 (review). Omit or `false` for lessons 1–5. |

### Meta Object

| Field | Type | Required | Description |
|---|---|---|---|
| `generated_at` | string (ISO 8601) | ✅ | Timestamp of generation |
| `generated_by` | string | ✅ | Name of the generating tool/model |
| `total_units` | integer | ✅ | Total number of units in the course |
| `total_lessons` | integer | ✅ | Total lessons (should equal `total_units × 6`) |
| `lessons_per_unit` | integer | ✅ | Always `6` |

---

## What This Format Provides vs. What the Pipeline Generates

| **You provide (scope/sequence)** | **Pipeline auto-generates** |
|---|---|
| Subject, grade, grade band | Bundle IDs (`sci-g1-u1-l01` — auto-derived from subject_code + grade + unit + lesson) |
| Unit titles + descriptions | Course manifest (`data/bundles/courses/sci-g1.json`) |
| Lesson titles + big ideas | Unit outlines with section titles, vocabulary plans, misconceptions |
| Standards codes per lesson | Full lesson scripts (intro, 5 sections, conclusion) |
| Key concepts per lesson | Interactive activities (quick_sort, true_false_burst, fill_blank) |
| Review lesson flag | Quizzes (5–8 questions, MC + T/F, 85% pass threshold) |
| Faith integration toggle | Vocabulary with definitions and example sentences |
| | Worksheets (draw & label, matching, fill-in-blank) |
| | Hands-on activities with household materials |
| | ElevenLabs TTS audio narration |
| | GPT Image 1 slide illustrations → Cloudinary CDN |
| | Celebration video assignment |

---

## Quality Guidelines for Scope/Sequence Content

### Lesson Titles
- ✅ Specific and descriptive: `"Living and Non-Living Things"`, `"Parts of a Plant"`, `"How Sound Travels"`
- ❌ Generic: `"Lesson 1"`, `"Introduction"`, `"Chapter 3"`
- ❌ Too broad: `"Science"`, `"Animals"`, `"Numbers"`

### Big Ideas
- ✅ One clear sentence a student could repeat back: `"Living things breathe, eat, grow, and reproduce."`
- ❌ Vague: `"Students will learn about living things."`
- ❌ Too complex: `"Through systematic observation and classification of organisms and non-organisms..."`
- Write at the target grade's reading level

### Key Concepts
- 2–5 per lesson, each a short phrase
- These become the backbone of the AI-generated lesson — they tell the AI what to teach
- More specific = better generated content: `"four signs of life: breathe, eat, grow, reproduce"` beats `"characteristics of life"`

### Standards
- Must be real, verifiable standard codes from the correct framework
- Science: NGSS only (e.g., `K-LS1-1`, `1-ESS1-2`, `MS-PS1-3`, `HS-LS1-1`)
- Math: Common Core Math (e.g., `1.OA.A.1`, `3.NF.A.2`)
- ELA: Common Core ELA (e.g., `RL.1.1`, `W.3.2`, `L.5.4`)
- History: C3 Framework (e.g., `D2.His.1.3-5`)
- Never use state-specific standards (TEKS, SOL, etc.)

### Unit Descriptions
- 1–3 sentences describing the unit's learning arc
- Should make clear what a student will be able to DO after the unit
- These feed directly into the AI outline generator as context

### Review Lessons (Lesson 6)
- Always `"is_review": true`
- Big idea should reference the whole unit: `"Review and connect everything we learned about..."`
- Key concepts should be cumulative — list the major takeaways from lessons 1–5
- Standards should include all major standards from the unit

---

## Validation Checklist (Before Handoff)

Run these checks before passing the file to the pipeline:

- [ ] Filename matches `{subject_code}-g{grade}.json`
- [ ] `id` matches filename (without `.json`)
- [ ] `subject_code` matches the subject code table exactly
- [ ] `grade_band` matches the grade-to-band mapping
- [ ] Every unit has exactly 6 lessons
- [ ] Lesson 6 in every unit has `"is_review": true`
- [ ] Every lesson has at least 1 standard code
- [ ] Standard codes are from the correct framework (no state standards)
- [ ] Every lesson has 2–5 key concepts
- [ ] Big ideas are single sentences, grade-appropriate
- [ ] No duplicate lesson titles within a unit
- [ ] `total_lessons` equals `total_units × 6`
- [ ] `faith_integration` and `theology_profile` are consistent (`false` + `"none"` or `true` + a profile name)
- [ ] Valid JSON — no trailing commas, no comments

---

## What Happens After Handoff

Once the scope/sequence file is placed in `scope-sequence/`, the pipeline runs:

```
1. ingest-scope-sequence.js    → Reads scope/sequence JSON
                                → Generates course manifest (data/bundles/courses/)
                                → Triggers outline generation per unit

2. generate-unit-outline.js    → AI generates detailed unit outline
                                → Section titles, vocabulary plan, misconceptions
                                → Saved to data/outlines/

3. generate-course.js          → Generates all bundles for the course
   └── generate-bundle.js      → AI writes full lesson (script, quiz, activities)
   └── validate-bundle.js      → Schema validation
   └── verify-bundle.js        → AI fact-checking (Gemini + Grok)

4. cross-check-unit.js         → Unit-wide consistency checks (14 checks)

5. generate-audio.js           → ElevenLabs TTS for all lessons

6. generate-slide-images.mjs   → GPT Image 1 illustrations → Cloudinary

7. upload-media.mjs            → Push all media to Cloudinary CDN
```

The entire chain from scope/sequence to deployable lesson takes approximately 3–5 minutes per lesson (dominated by AI generation + image creation time).
