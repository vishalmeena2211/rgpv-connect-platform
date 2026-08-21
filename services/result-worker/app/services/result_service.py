"""Orchestrates the full single/bulk result-fetching flow.

Ties together the core primitives (session → captcha → fetch → parse) with a
retry loop, and runs bulk ranges concurrently in a thread pool (the scraping
stack is blocking ``requests``, so threads give real parallelism).
"""

from __future__ import annotations

import asyncio
import time

from app.config import get_settings
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


def _await_submit_window(rgpv: RGPVSession) -> None:
    """Block until the session is old enough for RGPV to accept a submission.

    RGPV rejects a result POST that lands too soon after the handshake — it
    reports it as a wrong captcha, which is misleading, since the captcha text
    is fine. Because the clock runs from session establishment rather than from
    the captcha fetch, a pre-warmed session out of the pool has already served
    this time and returns immediately.
    """
    remaining = get_settings().min_session_age_seconds - (time.time() - rgpv.established_at)
    if remaining > 0:
        logger.debug("Waiting %.1fs for the RGPV submit window", remaining)
        time.sleep(remaining)


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


def fetch_single(
    enrollment: str, semester: int, *, max_retries: int | None = None
) -> SemesterResult:
    """Fetch one student's result, retrying on captcha failure.

    Flow per attempt: acquire session (pooled if available, else a fresh
    handshake) → solve captcha (AZCaptcha or Tesseract fallback) → POST result
    form → parse HTML. On captcha rejection the same session is retried with the
    remaining candidates before re-handshaking.

    Captcha OCR is probabilistic, so a rejected read is an expected outcome
    rather than an error: retries continue until ``max_retries`` is exhausted or
    the wall-clock deadline passes. :class:`ResultNotFound` is raised
    immediately, since re-trying can't conjure a result that doesn't exist.

    Emits a per-stage timing breakdown at INFO so it's clear which leg (RGPV
    handshake, captcha service, result POST) dominates a given request.
    """
    settings = get_settings()
    if max_retries is None:
        max_retries = settings.captcha_max_retries
    deadline = time.monotonic() + settings.fetch_deadline_seconds

    last_error: RGPVError | None = None
    timings = StageTimings()

    try:
        for attempt in range(1, max_retries + 1):
            if attempt > 1 and time.monotonic() >= deadline:
                logger.warning(
                    "Deadline reached for %s after %d attempt(s)", enrollment, attempt - 1
                )
                break
            try:
                with timed("session", timings):
                    rgpv: RGPVSession = acquire_session()

                with timed("captcha", timings):
                    candidates = solve_captcha_candidates(rgpv.captcha_url)
                    if not candidates:
                        candidates = [solve_captcha(rgpv.captcha_url)]

                with timed("submit_delay", timings):
                    _await_submit_window(rgpv)

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
