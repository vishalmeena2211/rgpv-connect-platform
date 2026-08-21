"""Orchestrates the full single/bulk result-fetching flow.

Ties together the core primitives (session → captcha → fetch → parse) with a
retry loop, and runs bulk ranges concurrently in a thread pool (the scraping
stack is blocking ``requests``, so threads give real parallelism).
"""

from __future__ import annotations

import asyncio

from app.core import enrollment as enroll
from app.core.captcha import solve_captcha, solve_captcha_candidates
from app.core.exceptions import CaptchaFailed, ResultNotFound, RGPVError
from app.core.fetch import fetch_result_html
from app.core.models import BulkResultItem, SemesterResult
from app.core.parser import parse_result
from app.core.session import RGPVSession, establish_session
from app.core.timing import StageTimings, timed
from app.logging_config import get_logger
from app.services.session_pool import get_session_pool

logger = get_logger(__name__)

# Bound concurrency so we don't hammer the RGPV portal during bulk fetches.
_BULK_CONCURRENCY = 5


def acquire_session() -> RGPVSession:
    """Return a ready RGPV session, preferring a pre-warmed one.

    The pool removes two RGPV round-trips from the critical path. A miss (empty
    pool, stale entries, or Redis down) transparently falls back to an inline
    handshake, so the pool is a pure optimisation and never a dependency.
    """
    pooled = get_session_pool().pop()
    if pooled is not None:
        logger.debug("Using pre-warmed session from pool")
        return pooled
    return establish_session()


def fetch_single(enrollment: str, semester: int, *, max_retries: int = 3) -> SemesterResult:
    """Fetch one student's result, retrying on captcha failure.

    Flow per attempt: acquire session (pooled if available, else a fresh
    handshake) → solve captcha (AZCaptcha or Tesseract fallback) → POST result
    form → parse HTML. On captcha rejection the same session is retried with the
    remaining candidates before re-handshaking. Up to ``max_retries`` full
    attempts; :class:`ResultNotFound` is raised immediately.

    Emits a per-stage timing breakdown at INFO so it's clear which leg (RGPV
    handshake, captcha service, result POST) dominates a given request.
    """
    last_error: RGPVError | None = None
    timings = StageTimings()

    try:
        for attempt in range(1, max_retries + 1):
            try:
                with timed("session", timings):
                    rgpv: RGPVSession = acquire_session()

                with timed("captcha", timings):
                    candidates = solve_captcha_candidates(rgpv.captcha_url)
                    if not candidates:
                        candidates = [solve_captcha(rgpv.captcha_url)]

                for captcha in candidates:
                    with timed("fetch", timings):
                        html = fetch_result_html(rgpv, enrollment, semester, captcha)
                    try:
                        with timed("parse", timings):
                            return parse_result(html)
                    except CaptchaFailed:
                        logger.info("Captcha candidate rejected for %s: %s", enrollment, captcha)
                        continue

                raise CaptchaFailed(f"All captcha candidates rejected for {enrollment}")
            except ResultNotFound:
                raise
            except CaptchaFailed as exc:
                last_error = exc
                logger.info("Captcha retry %d/%d for %s", attempt, max_retries, enrollment)
            except RGPVError as exc:
                last_error = exc
                logger.warning("Fetch attempt %d failed for %s: %s", attempt, enrollment, exc)

        raise last_error or RGPVError(f"Failed to fetch result for {enrollment}")
    finally:
        logger.info("fetch_single %s sem %d — %s", enrollment, semester, timings.summary())


async def _fetch_single_async(
    enrollment: str, semester: int, semaphore: asyncio.Semaphore
) -> BulkResultItem:
    """Run the blocking single-fetch in a thread, bounded by ``semaphore``."""
    async with semaphore:
        try:
            result = await asyncio.to_thread(fetch_single, enrollment, semester)
            return BulkResultItem(enrollment=enrollment, result=result)
        except RGPVError as exc:
            return BulkResultItem(enrollment=enrollment, error=str(exc))


async def fetch_bulk(
    first: str, last: str, semester: int, *, max_count: int = 500
) -> list[BulkResultItem]:
    """Fetch every result in an inclusive enrollment range, concurrently.

    :raises ValueError: if the range is invalid (mismatched prefix, reversed,
        or larger than ``max_count``).
    """
    enrollments = enroll.expand_range(first, last, max_count)
    if not enrollments:
        raise ValueError("Invalid enrollment range")

    semaphore = asyncio.Semaphore(_BULK_CONCURRENCY)
    tasks = [_fetch_single_async(e, semester, semaphore) for e in enrollments]
    return await asyncio.gather(*tasks)
