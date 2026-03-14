"""Council curriculum session — CrewAI task definitions."""
import io
import sys
from crewai import Crew, Task, Process
from agents.gandalf import create_gandalf
from agents.legolas import create_legolas
from agents.aragorn import create_aragorn
from agents.gimli import create_gimli
from agents.frodo import create_frodo
from lib.progress import update_progress


def run_council_session(job_id: str, payload: dict) -> None:
    """
    Run a full 5-agent Council curriculum session.
    Writes progress to Supabase in real time.
    """
    subject = payload.get("subject", "Unknown Subject")
    grade_level = payload.get("gradeLevel", payload.get("grade_level", 0))
    duration = payload.get("duration", "9 weeks")
    standards = payload.get("standards", "")
    additional_context = payload.get("additionalContext", payload.get("additional_context", ""))

    context_str = "\n".join(filter(None, [
        f"Subject: {subject}",
        f"Grade Level: {grade_level}",
        f"Duration: {duration}",
        f"Standards: {standards}" if standards else None,
        f"Additional Context: {additional_context}" if additional_context else None,
    ]))

    update_progress(job_id, 5, "Convening the Council…")

    gandalf = create_gandalf()
    legolas = create_legolas()
    aragorn = create_aragorn()
    gimli = create_gimli()
    frodo = create_frodo()

    draft_task = Task(
        description=f"Draft a comprehensive scope and sequence for:\n\n{context_str}",
        expected_output=(
            "A complete scope and sequence with unit titles, learning objectives, "
            "pacing guide, prerequisite skills, and suggested materials for each unit. "
            "Alaska-relevant, secular, teacher-ready."
        ),
        agent=gandalf,
    )

    update_progress(job_id, 10, "Gandalf is drafting the scope and sequence…")

    critique_task = Task(
        description=(
            "Review Gandalf's scope and sequence draft below. "
            "Identify every gap, missequence, missing scaffold, and weakness. "
            "Be specific — cite which unit, which objective, what is wrong and why.\n\n"
            "Gandalf's draft:\n{draft_task_output}"
        ),
        expected_output=(
            "A numbered critique — each item identifies the exact problem location, "
            "the nature of the flaw, and a specific recommended fix."
        ),
        agent=legolas,
        context=[draft_task],
    )

    update_progress(job_id, 40, "Legolas is reviewing for gaps and errors…")

    finalize_task = Task(
        description=(
            "You have Gandalf's draft and Legolas's numbered critique. "
            "Produce the final, clean, production-ready scope and sequence. "
            "Address every Legolas critique with a decision. Do not hedge. "
            "Format as a clean markdown document ready to hand to a course builder."
        ),
        expected_output=(
            "A clean, final scope and sequence in markdown. "
            "Every unit: title, learning objectives, pacing, prerequisites, materials. "
            "No placeholders. No hedging. This is the document that ships."
        ),
        agent=aragorn,
        context=[draft_task, critique_task],
    )

    update_progress(job_id, 65, "Aragorn is finalizing the curriculum…")

    stress_test_task = Task(
        description=(
            "Stress test Aragorn's final scope and sequence against real classroom conditions "
            f"in Glennallen, Alaska. Subject: {subject}. Grade: {grade_level}.\n\n"
            "Produce a 10-criteria PASS/FAIL/CONCERN report covering:\n"
            "1. Pacing feasibility\n"
            "2. Materials accessibility in rural Alaska\n"
            "3. Reading level appropriateness\n"
            "4. IEP accommodation potential\n"
            "5. Self-directed learner fit\n"
            "6. Alaska cultural relevance\n"
            "7. Secular compliance (Alaska Statute 14.03.320 — no religious content)\n"
            "8. Prerequisite realism\n"
            "9. Assessment feasibility\n"
            "10. Teacher prep load"
        ),
        expected_output=(
            "A 10-item report. Each item: criterion name, verdict (PASS / FAIL / CONCERN), "
            "one sentence of justification. No padding."
        ),
        agent=gimli,
        context=[finalize_task],
    )

    update_progress(job_id, 82, "Gimli is stress testing against classroom reality…")

    sign_off_task = Task(
        description=(
            "You have seen the final scope and sequence and Gimli's classroom reality report. "
            "Render your verdict: APPROVED or SEND BACK (with exactly one specific request).\n\n"
            "State your verdict. State the reason in one sentence. That is all."
        ),
        expected_output=(
            "Verdict: APPROVED or SEND BACK.\n"
            "Reason: [one sentence]."
        ),
        agent=frodo,
        context=[finalize_task, stress_test_task],
    )

    update_progress(job_id, 92, "Frodo is making the final call…")

    # Capture CrewAI verbose output to include in the job record
    captured = io.StringIO()
    old_stdout = sys.stdout
    sys.stdout = captured

    crew = Crew(
        agents=[gandalf, legolas, aragorn, gimli, frodo],
        tasks=[draft_task, critique_task, finalize_task, stress_test_task, sign_off_task],
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

    final_scope = task_results[2] if len(task_results) > 2 else str(result)
    gimli_report = task_results[3] if len(task_results) > 3 else ""
    frodo_verdict = task_results[4] if len(task_results) > 4 else ""

    from datetime import datetime, timezone
    output_payload = {
        "subject": subject,
        "gradeLevel": grade_level,
        "duration": duration,
        "finalScopeAndSequence": final_scope,
        "classroomViabilityReport": gimli_report,
        "frodoVerdict": frodo_verdict,
        "councilLog": council_log[:10000],  # cap at 10K chars
        "draftsRetained": {
            "gandalfInitialDraft": task_results[0] if task_results else "",
            "legolasCritique": task_results[1] if len(task_results) > 1 else "",
        },
        "generatedAt": datetime.now(timezone.utc).isoformat(),
    }

    update_progress(
        job_id,
        100,
        f"Council complete — Frodo's verdict: {frodo_verdict[:120]}",
        status="completed",
        output=output_payload,
    )
