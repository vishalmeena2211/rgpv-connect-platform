"""Fetch metrics kept in Redis, for the admin "Result worker" screen.

Every single-result fetch records its outcome, duration and attempt count:

- a per-day hash of outcome counters (``rgpv:metrics:<date>``), kept 8 days;
- a per-day list of durations in ms for median / 90th percentile, capped;
- a short log of the most recent fetches with the enrollment number masked.

Metrics are best effort: if Redis is down nothing is recorded and nothing
raises, so a metrics problem can never fail a student's lookup.
"""

from __future__ import annotations

import json
import time
from dataclasses import asdict, dataclass
from datetime import UTC, datetime
from enum import StrEnum
from typing import Any

import redis

from app.config import get_settings
from app.logging_config import get_logger

logger = get_logger(__name__)

RECENT_KEY = "rgpv:recent-fetches"
RECENT_LIMIT = 50
DURATIONS_LIMIT = 5000
RETENTION_SECONDS = 8 * 86_400
PARSER_CHECK_KEY = "rgpv:parser-check"


class Outcome(StrEnum):
    FOUND = "found"
    NOT_FOUND = "not_found"
    FAILED = "failed"


@dataclass(frozen=True)
class FetchRecord:
    at: float
    enrollment: str
    semester: int
    outcome: Outcome
    duration_ms: int
    attempts: int


def mask_enrollment(enrollment: str) -> str:
    """Keep the college/branch/year prefix and hide the serial: 0151CS24••••."""
    return enrollment[:8] + "•" * max(0, len(enrollment) - 8)


def _today() -> str:
    return datetime.now(UTC).strftime("%Y-%m-%d")


_client: redis.Redis | None = None


def _redis() -> redis.Redis:
    global _client
    if _client is None:
        _client = redis.from_url(
            get_settings().redis_url, socket_timeout=1, socket_connect_timeout=1
        )
    return _client


def record_fetch(
    enrollment: str, semester: int, outcome: Outcome, started: float, attempts: int
) -> None:
    """Record one fetch. Never raises."""
    duration_ms = int((time.monotonic() - started) * 1000)
    record = FetchRecord(
        at=time.time(),
        enrollment=mask_enrollment(enrollment),
        semester=semester,
        outcome=outcome,
        duration_ms=duration_ms,
        attempts=attempts,
    )
    day = _today()
    try:
        pipe = _redis().pipeline()
        counters = f"rgpv:metrics:{day}"
        pipe.hincrby(counters, "total", 1)
        pipe.hincrby(counters, outcome.value, 1)
        if outcome == Outcome.FOUND and attempts == 1:
            pipe.hincrby(counters, "first_try", 1)
        pipe.expire(counters, RETENTION_SECONDS)
        if outcome != Outcome.NOT_FOUND:
            durations = f"rgpv:durations:{day}"
            pipe.lpush(durations, duration_ms)
            pipe.ltrim(durations, 0, DURATIONS_LIMIT - 1)
            pipe.expire(durations, RETENTION_SECONDS)
        pipe.lpush(RECENT_KEY, json.dumps(asdict(record)))
        pipe.ltrim(RECENT_KEY, 0, RECENT_LIMIT - 1)
        pipe.execute()
    except Exception as exc:  # noqa: BLE001 - metrics are best effort
        logger.debug("Could not record fetch metrics: %s", exc)


def _percentile(sorted_values: list[int], fraction: float) -> int | None:
    if not sorted_values:
        return None
    index = min(len(sorted_values) - 1, max(0, round(fraction * (len(sorted_values) - 1))))
    return sorted_values[index]


def today_summary() -> dict[str, Any]:
    """Counters and timings for today (UTC), plus the recent-fetch log."""
    day = _today()
    try:
        client = _redis()
        raw_counters = client.hgetall(f"rgpv:metrics:{day}")
        raw_durations = client.lrange(f"rgpv:durations:{day}", 0, -1)
        raw_recent = client.lrange(RECENT_KEY, 0, 19)
    except Exception as exc:  # noqa: BLE001
        logger.warning("Metrics unavailable: %s", exc)
        return {"available": False}

    counters = {
        (k.decode() if isinstance(k, bytes) else str(k)): int(v)
        for k, v in dict(raw_counters).items()
    }
    durations = sorted(int(v) for v in list(raw_durations))
    recent = [json.loads(item) for item in list(raw_recent)]
    total = counters.get("total", 0)
    found = counters.get(Outcome.FOUND.value, 0)
    return {
        "available": True,
        "day": day,
        "total": total,
        "found": found,
        "notFound": counters.get(Outcome.NOT_FOUND.value, 0),
        "failed": counters.get(Outcome.FAILED.value, 0),
        "firstTry": counters.get("first_try", 0),
        "medianMs": _percentile(durations, 0.5),
        "p90Ms": _percentile(durations, 0.9),
        "recent": [
            {
                "at": item["at"],
                "enrollment": item["enrollment"],
                "semester": item["semester"],
                "outcome": item["outcome"],
                "durationMs": item["duration_ms"],
                "attempts": item["attempts"],
            }
            for item in recent
        ],
    }


def save_parser_check(result: dict[str, Any]) -> None:
    try:
        _redis().set(PARSER_CHECK_KEY, json.dumps(result), ex=RETENTION_SECONDS)
    except Exception as exc:  # noqa: BLE001
        logger.debug("Could not store parser check: %s", exc)


def last_parser_check() -> dict[str, Any] | None:
    try:
        raw = _redis().get(PARSER_CHECK_KEY)
    except Exception:  # noqa: BLE001
        return None
    if not isinstance(raw, (str, bytes, bytearray)):
        return None
    loaded: dict[str, Any] = json.loads(raw)
    return loaded
