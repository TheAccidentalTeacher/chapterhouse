"""Council of the Unserious — CrewAI curriculum session task definitions."""
import io
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
        description=f"Draft a comprehensive scope and sequence for:\n\n{context_str}\n\nAlign to the national standards framework specified above. Every unit should clearly connect to relevant standards from that framework.",
        expected_output=(
            "A complete scope and sequence with unit titles, learning objectives, "
            "standards alignment, pacing guide, prerequisite skills, and suggested "
            "materials for each unit. Secular, teacher-ready."
        ),
        agent=gandalf,
    )

    update_progress(job_id, 10, "Gandalf is drafting the scope and sequence…")

    # Pass 2: Data audits with systematic, ego-free critique
    audit_task = Task(
        description=(
            f"Review Gandalf's scope and sequence draft. "
            f"Audit alignment to {framework}. "
            "Identify grade-level standards that should be covered but are missing, "
            "and flag content that does not map to a real standard. "
            "Also check logical sequencing, prerequisite alignment, "
            "age-appropriateness, internal consistency, and pacing math. "
            "Every finding must be numbered, specific, and reference exact items."
        ),
        expected_output=(
            "A numbered analysis — each item identifies the exact location, "
            "the nature of the structural issue, and a specific recommended fix. "
            "Not opinion — data."
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
            "Format as a clean markdown document ready to hand to a course builder."
        ),
        expected_output=(
            "A clean, final scope and sequence in markdown. "
            "Every unit: title, learning objectives, pacing, prerequisites, materials. "
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
            "for the same minutes."
        ),
        expected_output=(
            "Each unit gets: unit name, COOL/SUCKS/MEH verdict, "
            "and a short Beavis-and-Butthead-style commentary. "
            "End with an overall verdict."
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

    from datetime import datetime, timezone
    output_payload = {
        "subject": subject,
        "gradeLevel": grade_level,
        "duration": duration,
        "finalScopeAndSequence": final_scope,
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
