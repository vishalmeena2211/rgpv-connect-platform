"""Lightweight per-stage timing helpers.

The fetch pipeline (handshake → captcha → fetch → parse) crosses two slow
third-party services, so knowing *which* stage dominates is the difference
between tuning the right knob and guessing. These helpers emit one log line per
stage and let a caller accumulate a breakdown for a whole request.
"""

from __future__ import annotations

import time
from collections.abc import Iterator
from contextlib import contextmanager

from app.logging_config import get_logger

logger = get_logger(__name__)


class StageTimings:
    """Accumulates named stage durations for a single logical operation."""

    def __init__(self) -> None:
        self._stages: dict[str, float] = {}

    def record(self, stage: str, seconds: float) -> None:
        """Add ``seconds`` to ``stage`` (repeated stages accumulate)."""
        self._stages[stage] = self._stages.get(stage, 0.0) + seconds

    @property
    def total(self) -> float:
        """Total recorded time across all stages, in seconds."""
        return sum(self._stages.values())

    def summary(self) -> str:
        """Render a compact ``stage=1.23s`` breakdown, slowest first."""
        if not self._stages:
            return "no stages recorded"
        parts = [
            f"{stage}={seconds:.2f}s"
            for stage, seconds in sorted(self._stages.items(), key=lambda kv: -kv[1])
        ]
        return f"total={self.total:.2f}s " + " ".join(parts)


@contextmanager
def timed(stage: str, timings: StageTimings | None = None) -> Iterator[None]:
    """Time a block, logging it at DEBUG and recording it into ``timings``.

    Always records — including when the block raises — so a failed attempt still
    shows where the time went.
    """
    started = time.perf_counter()
    try:
        yield
    finally:
        elapsed = time.perf_counter() - started
        if timings is not None:
            timings.record(stage, elapsed)
        logger.debug("stage %s took %.2fs", stage, elapsed)
