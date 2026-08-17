"""Session-pool control endpoints."""

from __future__ import annotations

from fastapi import APIRouter, Request

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
