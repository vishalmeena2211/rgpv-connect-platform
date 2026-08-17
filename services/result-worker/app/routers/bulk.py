"""Bulk-result endpoint (rate-limited)."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request

from app.config import get_settings
from app.core.models import BulkResultItem, BulkResultRequest
from app.rate_limit import limiter
from app.services.result_service import fetch_bulk

router = APIRouter(prefix="/api/v1", tags=["results"])


@router.post("/bulk-results", response_model=list[BulkResultItem])
@limiter.limit(get_settings().bulk_rate_limit)
async def get_bulk_results(request: Request, body: BulkResultRequest) -> list[BulkResultItem]:
    """Fetch results for an inclusive enrollment range.

    ``request`` is required by slowapi to identify the caller for rate limiting.
    """
    try:
        return await fetch_bulk(body.first_enrollment, body.last_enrollment, body.semester)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
