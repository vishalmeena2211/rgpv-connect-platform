"""Redis-backed pool of pre-warmed RGPV sessions.

Establishing an RGPV session (the ASP.NET handshake + captcha image fetch) is
slow. To keep result lookups fast under load, a background task keeps a small
pool of ready session payloads in Redis; consumers pop one instead of doing the
handshake inline. This unifies the producer (legacy ``py-result-worker``) and
consumer (legacy ``result-docker-py-worker``) into a single component.

The pool stores only the serialisable handshake output (tokens + cookie +
captcha URL); it does not pickle live ``requests.Session`` objects.
"""

from __future__ import annotations

import json
import threading

import redis

from app.config import get_settings
from app.core.session import establish_session
from app.logging_config import get_logger

logger = get_logger(__name__)

POOL_KEY = "rgpv:session-pool"
TARGET_SIZE = 20


class SessionPool:
    """Maintains a Redis list of pre-warmed session payloads."""

    def __init__(self, redis_url: str | None = None, target_size: int = TARGET_SIZE) -> None:
        self._redis = redis.from_url(redis_url or get_settings().redis_url)
        self._target_size = target_size
        self._stop = threading.Event()
        self._thread: threading.Thread | None = None
        self._timer: threading.Timer | None = None

    # -- background refill ---------------------------------------------------

    def _refill_loop(self) -> None:
        """Top up the pool toward ``target_size`` until stopped."""
        while not self._stop.is_set():
            try:
                if self._redis.llen(POOL_KEY) >= self._target_size:
                    self._stop.wait(2)
                    continue
                rgpv = establish_session()
                self._redis.lpush(
                    POOL_KEY,
                    json.dumps(
                        {
                            "viewstate": rgpv.viewstate,
                            "eventvalidation": rgpv.eventvalidation,
                            "cookie": rgpv.cookie,
                            "captcha_url": rgpv.captcha_url,
                        }
                    ),
                )
            except Exception as exc:  # noqa: BLE001 - keep the loop alive
                logger.warning("Session refill failed: %s", exc)
                self._stop.wait(2)

    def start(self, run_seconds: int = 600) -> None:
        """Start (or extend) the background refill task.

        The task auto-stops after ``run_seconds`` of inactivity; calling
        ``start`` again resets that timer — mirroring the legacy ``/run`` trigger.
        """
        if self._thread and self._thread.is_alive():
            if self._timer:
                self._timer.cancel()
        else:
            self._stop.clear()
            self._thread = threading.Thread(target=self._refill_loop, daemon=True)
            self._thread.start()
            logger.info("Session pool refill started")

        self._timer = threading.Timer(run_seconds, self.stop)
        self._timer.start()

    def stop(self) -> None:
        """Signal the refill task to stop and wait for it to finish."""
        self._stop.set()
        if self._thread:
            self._thread.join(timeout=5)
        logger.info("Session pool refill stopped")

    # -- introspection -------------------------------------------------------

    def size(self) -> int:
        """Current number of pooled sessions."""
        return int(self._redis.llen(POOL_KEY))
