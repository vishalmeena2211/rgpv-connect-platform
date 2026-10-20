"""Operational endpoints for the admin "Result worker" screen."""

from __future__ import annotations

import time
from typing import Any

from fastapi import APIRouter, Request

from app.config import get_settings
from app.core.azcaptcha import get_balance
from app.core.exceptions import ResultNotFound, RGPVError
from app.services import metrics
from app.services.result_service import fetch_single

router = APIRouter(prefix="/api/v1", tags=["ops"])

_balance_cache: dict[str, Any] = {"at": 0.0, "value": None, "error": None}
BALANCE_TTL_SECONDS = 300


def _captcha_balance() -> dict[str, Any]:
    settings = get_settings()
    if not settings.use_azcaptcha:
        return {"provider": "tesseract", "balance": None, "error": None}
    if time.monotonic() - float(_balance_cache["at"]) > BALANCE_TTL_SECONDS:
        try:
            _balance_cache.update(at=time.monotonic(), value=get_balance(), error=None)
        except RGPVError as exc:
            _balance_cache.update(at=time.monotonic(), value=None, error=str(exc))
    return {
        "provider": "azcaptcha",
        "balance": _balance_cache["value"],
        "error": _balance_cache["error"],
    }


@router.get("/stats")
def stats(request: Request) -> dict[str, Any]:
    """Today's fetch counters and timings, pool size, captcha balance, last parser check."""
    settings = get_settings()
    pool = request.app.state.session_pool
    try:
        pool_size: int | None = pool.size()
    except Exception:  # noqa: BLE001 - Redis down
        pool_size = None
    return {
        "today": metrics.today_summary(),
        "pool": {"size": pool_size, "target": 20},
        "captcha": _captcha_balance(),
        "submitWaitSeconds": settings.min_session_age_seconds,
        "parserCheck": metrics.last_parser_check(),
    }


@router.post("/checks/parser")
def run_parser_check() -> dict[str, Any]:
    """Fetch the configured known-good result and check it still parses.

    This is the early warning for a change in the portal's page layout. It
    costs one captcha solve, so it is triggered by an admin, not on a timer.
    """
    settings = get_settings()
    started = time.time()
    outcome: dict[str, Any] = {
        "at": started,
        "enrollment": metrics.mask_enrollment(settings.check_enrollment),
        "semester": settings.check_semester,
    }
    try:
        result = fetch_single(settings.check_enrollment, settings.check_semester)
        outcome.update(
            ok=bool(result.name) and result.sgpa is not None and len(result.subjects) > 0,
            detail=f"{len(result.subjects)} subjects, SGPA {result.sgpa}",
        )
    except ResultNotFound:
        outcome.update(ok=False, detail="The check enrollment returned no result")
    except RGPVError as exc:
        outcome.update(ok=False, detail=str(exc))
    outcome["seconds"] = round(time.time() - started, 1)
    metrics.save_parser_check(outcome)
    return outcome
