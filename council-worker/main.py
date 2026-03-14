"""FastAPI server — receives QStash job POSTs from the Next.js app."""
import os
import hmac
import hashlib
import json
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from lib.progress import update_progress

QSTASH_SIGNING_KEY = os.getenv("QSTASH_CURRENT_SIGNING_KEY", "")
QSTASH_NEXT_SIGNING_KEY = os.getenv("QSTASH_NEXT_SIGNING_KEY", "")


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(lifespan=lifespan)


def verify_qstash_signature(body: bytes, signature_header: str, key: str) -> bool:
    """Verify QStash HMAC-SHA256 signature."""
    if not key:
        return False
    expected = hmac.new(key.encode(), body, hashlib.sha256).hexdigest()
    return hmac.compare_digest(f"v1={expected}", signature_header)


def verify_signature(body: bytes, signature: str) -> bool:
    """Try current key first, then next key (key rotation support)."""
    if not signature:
        return False
    if verify_qstash_signature(body, signature, QSTASH_SIGNING_KEY):
        return True
    if QSTASH_NEXT_SIGNING_KEY:
        return verify_qstash_signature(body, signature, QSTASH_NEXT_SIGNING_KEY)
    return False


@app.get("/health")
async def health():
    return {"status": "ok", "service": "council-worker"}


@app.post("/council-session")
async def council_session_endpoint(request: Request, background_tasks: BackgroundTasks):
    body = await request.body()

    # Signature verification — skip in dev if keys not set
    sig = request.headers.get("Upstash-Signature", "")
    if QSTASH_SIGNING_KEY:
        if not verify_signature(body, sig):
            raise HTTPException(status_code=401, detail="Invalid QStash signature")

    try:
        data = json.loads(body)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="Invalid JSON body")

    job_id = data.get("jobId")
    payload = data.get("payload", {})

    if not job_id:
        raise HTTPException(status_code=400, detail="Missing jobId")

    # Acknowledge immediately, process in background
    background_tasks.add_task(run_council_job, job_id, payload)
    return JSONResponse({"received": True, "jobId": job_id})


async def run_council_job(job_id: str, payload: dict):
    """Run the Council session in the background."""
    import asyncio

    try:
        await asyncio.to_thread(_run_council_sync, job_id, payload)
    except Exception as exc:
        update_progress(
            job_id,
            0,
            f"Council session failed: {exc}",
            status="failed",
            error=str(exc),
        )


def _run_council_sync(job_id: str, payload: dict):
    """Synchronous Council session wrapper (CrewAI is not async-native)."""
    try:
        from tasks.curriculum_session import run_council_session
        run_council_session(job_id, payload)
    except Exception as exc:
        update_progress(
            job_id,
            0,
            f"Error: {exc}",
            status="failed",
            error=str(exc),
        )
