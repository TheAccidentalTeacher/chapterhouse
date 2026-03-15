"""Council of the Unserious — CrewAI curriculum session task definitions."""
import io
import json
import os
import sys
from crewai import Crew, Task, Process
from agents.gandalf import create_gandalf
from agents.data_officer import create_data_officer
from agents.polgara import create_polgara
from agents.earl import create_earl
from agents.beavis import create_beavis
from lib.progress import update_progress

# National standards framework mapping — auto-detected from subject
NATIONAL_STANDARDS = {
    "ela": "Common Core State Standards for English Language Arts (CCSS-ELA)",
    "english": "Common Core State Standards for English Language Arts (CCSS-ELA)",
    "reading": "Common Core State Standards for English Language Arts (CCSS-ELA)",
    "writing": "Common Core State Standards for English Language Arts (CCSS-ELA)",
    "language arts": "Common Core State Standards for English Language Arts (CCSS-ELA)",
    "math": "Common Core State Standards for Mathematics (CCSS-M)",
    "mathematics": "Common Core State Standards for Mathematics (CCSS-M)",
    "algebra": "Common Core State Standards for Mathematics (CCSS-M)",
    "geometry": "Common Core State Standards for Mathematics (CCSS-M)",
    "science": "Next Generation Science Standards (NGSS)",
    "biology": "Next Generation Science Standards (NGSS)",
    "chemistry": "Next Generation Science Standards (NGSS)",
    "physics": "Next Generation Science Standards (NGSS)",
    "earth science": "Next Generation Science Standards (NGSS)",
    "social studies": "College, Career, and Civic Life (C3) Framework for Social Studies",
    "history": "College, Career, and Civic Life (C3) Framework for Social Studies",
    "geography": "College, Career, and Civic Life (C3) Framework for Social Studies",
    "civics": "College, Career, and Civic Life (C3) Framework for Social Studies",
    "economics": "College, Career, and Civic Life (C3) Framework for Social Studies",
    "us history": "College, Career, and Civic Life (C3) Framework for Social Studies",
    "world history": "College, Career, and Civic Life (C3) Framework for Social Studies",
}


def get_standards_framework(subject: str) -> str:
    """Auto-detect the national standards framework from the subject name."""
    lower = subject.lower().strip()
    if lower in NATIONAL_STANDARDS:
        return NATIONAL_STANDARDS[lower]
    for key, framework in NATIONAL_STANDARDS.items():
        if key in lower:
            return framework
    return "National content standards for the subject area"


# ── Subject code & grade band mappings (match scope-sequence-handoff.md) ──────

SUBJECT_CODES = {
    "science": "sci", "biology": "sci", "chemistry": "sci", "physics": "sci", "earth science": "sci",
    "math": "mth", "mathematics": "mth", "algebra": "mth", "geometry": "mth",
    "language arts": "ela", "ela": "ela", "english": "ela", "reading": "ela", "writing": "ela",
    "history": "hst", "social studies": "hst", "geography": "hst", "civics": "hst",
    "economics": "hst", "us history": "hst", "world history": "hst",
    "bible": "bib", "art": "art", "music": "mus", "pe": "pe",
}

STANDARDS_FRAMEWORK_SHORT = {
    "science": "NGSS", "biology": "NGSS", "chemistry": "NGSS", "physics": "NGSS", "earth science": "NGSS",
    "math": "CCSS-Math", "mathematics": "CCSS-Math", "algebra": "CCSS-Math", "geometry": "CCSS-Math",
    "language arts": "CCSS-ELA", "ela": "CCSS-ELA", "english": "CCSS-ELA", "reading": "CCSS-ELA", "writing": "CCSS-ELA",
    "history": "C3", "social studies": "C3", "geography": "C3", "civics": "C3",
    "economics": "C3", "us history": "C3", "world history": "C3",
    "bible": "internal", "art": "internal", "music": "internal", "pe": "internal",
}


def get_subject_code(subject: str) -> str:
    lower = subject.lower().strip()
    if lower in SUBJECT_CODES:
        return SUBJECT_CODES[lower]
    for key, code in SUBJECT_CODES.items():
        if key in lower:
            return code
    return lower[:3]


def get_standards_fw_short(subject: str) -> str:
    lower = subject.lower().strip()
    if lower in STANDARDS_FRAMEWORK_SHORT:
        return STANDARDS_FRAMEWORK_SHORT[lower]
    for key, fw in STANDARDS_FRAMEWORK_SHORT.items():
        if key in lower:
            return fw
    return "internal"


def get_grade_band(grade: int) -> str:
    if grade <= 2:
        return "early_elementary"
    if grade <= 5:
        return "upper_elementary"
    if grade <= 8:
        return "middle"
    return "high"


def extract_structured_output(
    polgara_markdown: str,
    subject: str,
    grade_level: int,
) -> dict | None:
    """Convert Polgara's finalized markdown to handoff JSON via Claude."""
    import anthropic

    subject_code = get_subject_code(subject)
    grade_band = get_grade_band(grade_level)
    framework_short = get_standards_fw_short(subject)
    course_id = f"{subject_code}-g{grade_level}"

    extraction_prompt = f"""You are a precise data extraction engine. Convert the following curriculum scope & sequence document into a structured JSON object.

DESIGN PRINCIPLE: NO COOKIE CUTTERS. Every unit can have a different number of lessons, different styles, and different energy levels. Structure serves learning — learning does not serve structure.

REQUIRED OUTPUT FORMAT (respond with ONLY valid JSON — no markdown fences, no commentary):

{{
  "id": "{course_id}",
  "schema_version": "1.0",
  "subject": "{subject}",
  "subject_code": "{subject_code}",
  "grade": {grade_level},
  "grade_band": "{grade_band}",
  "title": "Grade {grade_level} {subject}",
  "subtitle": "<descriptive subtitle extracted from the document>",
  "faith_integration": false,
  "theology_profile": "none",
  "standards_framework": "{framework_short}",
  "units": [
    {{
      "unit_number": 1,
      "title": "<unit title>",
      "description": "<1-3 sentence description>",
      "pacing": "<N+1 pattern, e.g. 5+1, 4+1, 3+1, 6+1, 7+1>",
      "lessons": [
        {{
          "lesson_number": 1,
          "title": "<lesson title>",
          "big_idea": "<one sentence core takeaway>",
          "standards": ["<real standard codes from {framework_short}>"],
          "key_concepts": ["<2-5 short phrases>"],
          "style": "<exploration|deep_dive|hands_on|story_driven|challenge|creative|review_game|field_journal|debate|lab>",
          "energy": "<high|medium|low>"
        }},
        {{
          "lesson_number": "<last>",
          "title": "<Unit N Review: ...>",
          "big_idea": "<cumulative review sentence>",
          "standards": ["<all major standards from this unit>"],
          "key_concepts": ["<cumulative takeaways>"],
          "is_review_lesson": true,
          "style": "review_game",
          "energy": "high"
        }}
      ]
    }}
  ],
  "meta": {{
    "generated_at": "<ISO 8601 timestamp>",
    "generated_by": "chapterhouse-curriculum-factory",
    "total_units": "<number>",
    "total_lessons": "<actual sum of all lessons across all units>"
  }}
}}

STRUCTURAL RULES:
- Each unit has 3-8 lessons. Different units CAN have different lesson counts.
- The pacing field = "N+1" where N = teaching lessons, 1 = review. E.g. 5 teaching + 1 review = "5+1" (6 total lessons).
- The LAST lesson in every unit is ALWAYS a review with "is_review_lesson": true.
- total_lessons in meta = the actual SUM of all lessons across all units (not a formula).

LESSON VARIETY RULES:
- Every lesson MUST have a "style" hint from: exploration, deep_dive, hands_on, story_driven, challenge, creative, review_game, field_journal, debate, lab.
- Every lesson MUST have an "energy" level: high, medium, or low.
- Vary styles and energy levels WITHIN each unit — do not repeat the same style or energy consecutively.
- Review lessons should use style "review_game" and energy "high".
- A well-designed unit alternates energy: high → medium → low → high → medium → review.

CONTENT RULES:
- Standards codes must be real codes from {framework_short} appropriate for grade {grade_level}.
- key_concepts: 2-5 short phrases per lesson.
- big_idea: one clear sentence per lesson, written at the target grade's reading level.
- All content secular (Alaska Statute 14.03.320).
- Output ONLY the JSON object. No explanation, no markdown fences.

SOURCE DOCUMENT:
{polgara_markdown}"""

    try:
        client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        msg = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=8192,
            system="You output only valid JSON. No markdown fences, no commentary, no explanation.",
            messages=[{"role": "user", "content": extraction_prompt}],
        )
        raw = msg.content[0].text if msg.content else ""
        try:
            return json.loads(raw)
        except json.JSONDecodeError:
            import re
            match = re.search(r"```(?:json)?\s*([\s\S]+?)```", raw)
            if match:
                return json.loads(match.group(1))
            return None
    except Exception as exc:
        print(f"[curriculum_session] Structured extraction failed: {exc}")
        return None


def run_council_session(job_id: str, payload: dict) -> None:
    """
    Run a full 5-agent Council of the Unserious curriculum session.
    Pass flow: Gandalf → Data → Polgara → Earl → Beavis & Butthead.
    Writes progress to Supabase in real time.
    """
    subject = payload.get("subject", "Unknown Subject")
    grade_level = payload.get("gradeLevel", payload.get("grade_level", 0))
    duration = payload.get("duration", "9 weeks")
    standards = payload.get("standards", "")
    additional_context = payload.get("additionalContext", payload.get("additional_context", ""))

    framework = get_standards_framework(subject)

    context_str = "\n".join(filter(None, [
        f"Subject: {subject}",
        f"Grade Level: {grade_level}",
        f"Duration: {duration}",
        f"National Standards Framework: {framework}",
        f"Additional Standards: {standards}" if standards else None,
        f"Additional Context: {additional_context}" if additional_context else None,
    ]))

    update_progress(job_id, 5, "Convening the Council of the Unserious…")

    gandalf = create_gandalf()
    data = create_data_officer()
    polgara = create_polgara()
    earl = create_earl()
    beavis = create_beavis()

    # Pass 1: Gandalf drafts from zero
    draft_task = Task(
        description=(
            f"Draft a comprehensive scope and sequence for:\n\n{context_str}\n\n"
            "STRUCTURAL REQUIREMENTS:\n"
            "- Design units with 3-8 lessons each. Different units SHOULD have different lesson counts.\n"
            "- Express pacing as 'N+1' (e.g., '5+1' = 5 teaching + 1 review = 6 total).\n"
            "- Last lesson in every unit = review/assessment.\n"
            "- Every lesson needs: title, big idea, standards codes, key concepts (2-5), style hint, energy level.\n"
            "- Style options: exploration, deep_dive, hands_on, story_driven, challenge, creative, field_journal, debate, lab, review_game.\n"
            "- Energy options: high, medium, low. Alternate within each unit \u2014 no 3 consecutive same-energy lessons.\n"
            "- Vary styles within each unit \u2014 no consecutive repeats."
        ),
        expected_output=(
            "A complete scope and sequence with unit titles, descriptions (1-3 sentences), "
            "pacing patterns ('N+1'), and all lessons. Each lesson has: number, title, big idea, "
            "standards codes, key concepts (2-5), style hint, and energy level. "
            "Variable unit sizes. Secular, teacher-ready."
        ),
        agent=gandalf,
    )

    update_progress(job_id, 10, "Gandalf is drafting the scope and sequence…")

    # Pass 2: Data audits with systematic, ego-free critique
    audit_task = Task(
        description=(
            f"Review Gandalf's scope and sequence draft. "
            f"Audit alignment to {framework}. "
            "Check BOTH content quality AND structural integrity:\n"
            "- Standards: Are codes real? Is every lesson mapped to at least 1 standard? Any missing grade-level standards?\n"
            f"- Pacing math: Does each unit's lesson count match its stated pacing ('N+1' = N+1 lessons)?\n"
            "- Unit variety: Do units have DIFFERENT lesson counts? Flag if all units are identical size.\n"
            "- Style variety: Does each unit use 3+ different styles? No consecutive repeats?\n"
            "- Energy alternation: Do energy levels vary? No 3+ consecutive same-energy lessons?\n"
            "- Review lessons: Does every unit end with review? Is review the ONLY lesson marked is_review_lesson?\n"
            "- Key concepts: 2-5 per lesson? Specific enough to be useful?\n"
            f"- Pedagogical sequencing: Do prerequisites flow correctly for grade {grade_level}?"
        ),
        expected_output=(
            "A numbered analysis organized by category: Content issues, Structural issues, "
            "Standards issues, Variety issues. Each item identifies the exact location, "
            "the nature of the issue, and a specific fix. Not opinion \u2014 data. "
            "Include a revised version with corrections applied."
        ),
        agent=data,
        context=[draft_task],
    )

    update_progress(job_id, 30, "Data is auditing for structural issues…")

    # Pass 3: Polgara finalizes — does this serve the child?
    finalize_task = Task(
        description=(
            "You have Gandalf's draft and Data's numbered analysis. "
            "Produce the final, production-ready scope and sequence. "
            "Your lens: does this serve the child? Not the standards document — the actual child. "
            "Address every Data finding with a decision. Do not hedge. "
            "'Consider adding' is not in your vocabulary. "
            "Format as a clean markdown document ready to hand to a course builder.\n\n"
            "PRESERVE these structural elements in your output (the pipeline needs them):\n"
            "- Unit pacing pattern ('N+1' format)\n"
            "- Lesson style hint per lesson (exploration, deep_dive, hands_on, etc.)\n"
            "- Lesson energy level per lesson (high, medium, low)\n"
            "- Standards codes per lesson\n"
            "- Key concepts (2-5) per lesson\n"
            "- is_review_lesson flag on the last lesson of each unit\n\n"
            "You may CHANGE any of these values if they don't serve the child \u2014 but you must INCLUDE them all. "
            "If Data flagged monotone styles or flat energy, fix those sequences."
        ),
        expected_output=(
            "A clean, final scope and sequence in markdown. "
            "Every unit: title, description, pacing, and all lessons with style/energy/standards. "
            "No placeholders. No hedging. This is the document that ships."
        ),
        agent=polgara,
        context=[draft_task, audit_task],
    )

    update_progress(job_id, 50, "Polgara is finalizing the curriculum…")

    # Pass 4: Earl — operational assessment
    ops_task = Task(
        description=(
            "Review Polgara's finalized scope and sequence. "
            f"Subject: {subject}. Grade: {grade_level}.\n\n"
            "Produce a concrete operational assessment:\n"
            "1. Build order — what gets built first?\n"
            "2. Resource requirements — what does Scott actually need?\n"
            "3. Revenue timeline — when can this generate income?\n"
            "4. Minimum viable version — what ships next week?\n"
            "5. Go/no-go recommendation\n\n"
            "Remember: teaching contract ends May 24, 2026. Revenue by August 2026. "
            "Be terse. Two sentences where Gandalf needs a paragraph."
        ),
        expected_output=(
            "A 5-section operational assessment. Each section: heading, 1-3 sentences, "
            "concrete recommendation. End with GO or NO-GO verdict and one sentence why."
        ),
        agent=earl,
        context=[finalize_task],
    )

    update_progress(job_id, 70, "Earl is running the operational assessment…")

    # Pass 5: Beavis & Butthead — engagement stress test
    engagement_task = Task(
        description=(
            "You have the final scope and sequence. "
            "Go through each unit and give a verdict: COOL, SUCKS, or MEH.\n\n"
            "Talk to each other, not to the Council. "
            "Be brutally honest about what would bore a real kid. "
            "Also call out what is actually cool. "
            "Remember: you are competing against TikTok, YouTube Shorts, and Roblox "
            "for the same minutes.\n\n"
            "ALSO CHECK:\n"
            "- Does the energy flow feel like a roller coaster (good) or a flatline (bad)?\n"
            "- Is there enough variety in lesson types or does it all feel the same?\n"
            "- Is there at least one 'wait, that's actually cool' lesson per unit?\n"
            "- Does the review lesson feel like a game or a boring test?"
        ),
        expected_output=(
            "Each unit gets: unit name, COOL/SUCKS/MEH verdict, "
            "which specific lessons are cool vs boring, energy flow assessment, "
            "variety assessment, and Beavis-and-Butthead-style commentary. "
            "End with an overall verdict and one accidentally profound insight."
        ),
        agent=beavis,
        context=[finalize_task],
    )

    update_progress(job_id, 88, "Beavis & Butthead are stress-testing engagement…")

    # Capture CrewAI verbose output to include in the job record
    captured = io.StringIO()
    old_stdout = sys.stdout
    sys.stdout = captured

    crew = Crew(
        agents=[gandalf, data, polgara, earl, beavis],
        tasks=[draft_task, audit_task, finalize_task, ops_task, engagement_task],
        process=Process.sequential,
        verbose=True,
    )

    try:
        result = crew.kickoff()
    finally:
        sys.stdout = old_stdout

    council_log = captured.getvalue()

    # Extract task outputs
    outputs = crew.tasks if hasattr(crew, "tasks") else []
    task_results = [t.output.raw if hasattr(t, "output") and t.output else "" for t in outputs]

    gandalf_draft = task_results[0] if task_results else ""
    data_critique = task_results[1] if len(task_results) > 1 else ""
    final_scope = task_results[2] if len(task_results) > 2 else str(result)
    earl_ops = task_results[3] if len(task_results) > 3 else ""
    beavis_report = task_results[4] if len(task_results) > 4 else ""

    # Pass 6: Structured extraction — convert to handoff JSON
    update_progress(job_id, 92, "Extracting structured handoff JSON…")
    structured_output = extract_structured_output(final_scope, subject, grade_level)

    # Post-extraction validation — pacing math, total_lessons, is_review_lesson
    if structured_output and isinstance(structured_output, dict):
        units = structured_output.get("units", [])
        running_total = 0
        for unit in units:
            if not isinstance(unit, dict):
                continue
            lessons = unit.get("lessons", [])
            lesson_count = len(lessons)
            running_total += lesson_count

            # Validate pacing: "N+1" must equal actual lesson count
            pacing = unit.get("pacing", "")
            if isinstance(pacing, str) and "+" in pacing:
                parts = pacing.split("+")
                try:
                    expected = int(parts[0]) + int(parts[1])
                    if expected != lesson_count:
                        unit["pacing"] = f"{lesson_count - 1}+1"
                except (ValueError, IndexError):
                    unit["pacing"] = f"{lesson_count - 1}+1"
            elif lesson_count > 0:
                unit["pacing"] = f"{lesson_count - 1}+1"

            # Ensure last lesson has is_review_lesson = True
            if lessons:
                for lesson in lessons:
                    if isinstance(lesson, dict):
                        lesson["is_review_lesson"] = False
                lessons[-1]["is_review_lesson"] = True

            # Renumber lessons sequentially
            for i, lesson in enumerate(lessons):
                if isinstance(lesson, dict):
                    lesson["lesson_number"] = i + 1

        # Compute accurate total_lessons
        meta = structured_output.get("meta", {})
        if not isinstance(meta, dict):
            meta = {}
            structured_output["meta"] = meta
        meta["total_lessons"] = running_total

        # Remove legacy field
        meta.pop("lessons_per_unit", None)

    from datetime import datetime, timezone
    output_payload = {
        "subject": subject,
        "gradeLevel": grade_level,
        "duration": duration,
        "finalScopeAndSequence": final_scope,
        "structuredOutput": structured_output,
        "operationalAssessment": earl_ops,
        "engagementReport": beavis_report,
        "councilLog": council_log[:10000],  # cap at 10K chars
        "draftsRetained": {
            "gandalfInitialDraft": gandalf_draft,
            "dataCritique": data_critique,
        },
        "generatedAt": datetime.now(timezone.utc).isoformat(),
    }

    update_progress(
        job_id,
        100,
        "Council of the Unserious — session complete.",
        status="completed",
        output=output_payload,
    )
