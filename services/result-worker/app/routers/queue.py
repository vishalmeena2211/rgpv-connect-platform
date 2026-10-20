"""Session-pool control endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Request
from starlette.concurrency import run_in_threadpool

from app.core.exceptions import RGPVError

router = APIRouter(prefix="/api/v1/queue", tags=["session-pool"])


@router.post("/refresh")
async def refresh_pool(request: Request) -> dict[str, object]:
    """Start (or extend) the background session-pool refill task."""
    pool = request.app.state.session_pool
    pool.start()
    return {"status": "refilling", "size": pool.size()}


@router.get("/status")
async def pool_status(request: Request) -> dict[str, int]:
    """Report how many sessions are currently pooled."""
    pool = request.app.state.session_pool
    return {"size": pool.size()}


@router.post("/warm")
async def warm_pool(request: Request) -> dict[str, object]:
    """Open one RGPV session ahead of a lookup that is about to arrive.

    The web app calls this when someone starts typing an enrollment number.
    RGPV only accepts a result request once the session is a few seconds old,
    so a session opened now is ready to submit by the time they press Check.
    """
    pool = request.app.state.session_pool
    try:
        size = await run_in_threadpool(pool.warm)
    except RGPVError as exc:
        return {"status": "skipped", "reason": str(exc)}
    return {"status": "ready", "size": size}
