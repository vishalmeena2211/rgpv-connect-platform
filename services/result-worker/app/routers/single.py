"""Single-result endpoint."""

from __future__ import annotations

from fastapi import APIRouter, HTTPException

from app.core.exceptions import ResultNotFound, RGPVError
from app.core.models import SemesterResult, SingleResultRequest
from app.services.result_service import fetch_single

router = APIRouter(prefix="/api/v1", tags=["results"])


@router.post("/result", response_model=SemesterResult)
async def get_result(body: SingleResultRequest) -> SemesterResult:
    """Fetch a single student's semester result."""
    try:
        return fetch_single(body.enrollment, body.semester)
    except ResultNotFound as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except RGPVError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
