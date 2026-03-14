import os
import json
from supabase import create_client, Client
from datetime import datetime, timezone

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

_client: Client | None = None


def get_supabase() -> Client | None:
    global _client
    if not SUPABASE_URL or not SUPABASE_SERVICE_ROLE_KEY:
        return None
    if _client is None:
        _client = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    return _client


def update_progress(
    job_id: str,
    progress: int,
    message: str,
    status: str = "running",
    output: dict | None = None,
    error: str | None = None,
) -> None:
    """Write progress to the jobs table. Non-fatal if Supabase is unavailable."""
    client = get_supabase()
    if client is None:
        print(f"[progress] {job_id} {progress}% — {message}")
        return

    now = datetime.now(timezone.utc).isoformat()
    patch: dict = {
        "progress": progress,
        "progress_message": message,
        "status": status,
        "updated_at": now,
    }
    if status == "running" and progress <= 5:
        patch["started_at"] = now
    if status in ("completed", "failed"):
        patch["completed_at"] = now
    if output is not None:
        patch["output"] = output
    if error is not None:
        patch["error"] = error

    try:
        client.table("jobs").update(patch).eq("id", job_id).execute()
    except Exception as exc:
        print(f"[progress] Supabase write failed: {exc}")
