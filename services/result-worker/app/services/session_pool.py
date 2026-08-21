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
import time

import redis
import requests

from app.config import get_settings
from app.core.session import RGPVSession, establish_session
from app.logging_config import get_logger

logger = get_logger(__name__)

POOL_KEY = "rgpv:session-pool"
TARGET_SIZE = 20

# An ASP.NET session (and the captcha image bound to it) goes stale quickly.
# Anything older than this is discarded on pop rather than risking a wasted
# captcha solve against a dead session.
MAX_SESSION_AGE_SECONDS = 240


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
                            "created_at": time.time(),
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

    # -- consumption ---------------------------------------------------------

    def pop(self) -> RGPVSession | None:
        """Pop a pre-warmed session, or ``None`` if none is usable.

        Popping is destructive by design: an ASP.NET ``__VIEWSTATE`` is
        single-use, so a session must never be handed out twice. Entries older
        than :data:`MAX_SESSION_AGE_SECONDS` are discarded and the next one is
        tried. Never raises — a pool miss simply means the caller does an inline
        handshake instead.
        """
        while True:
            try:
                raw = self._redis.lpop(POOL_KEY)
            except Exception as exc:  # noqa: BLE001 - pool is best-effort
                logger.warning("Session pool pop failed: %s", exc)
                return None

            # `lpop` is typed as possibly returning a list (it accepts a count
            # argument); we never pass one, so narrow to the single-value case.
            if not isinstance(raw, (str, bytes, bytearray)):
                return None

            try:
                payload = json.loads(raw)
            except (TypeError, ValueError):
                logger.warning("Discarding malformed pooled session")
                continue

            age = time.time() - float(payload.get("created_at", 0))
            if age > MAX_SESSION_AGE_SECONDS:
                logger.debug("Discarding stale pooled session (age %.0fs)", age)
                continue

            return self._rehydrate(payload)

    @staticmethod
    def _rehydrate(payload: dict[str, object]) -> RGPVSession:
        """Rebuild a live :class:`RGPVSession` from a serialised pool entry."""
        session = requests.Session()
        cookie = str(payload["cookie"])
        session.cookies.set(
            "ASP.NET_SessionId", cookie.split("=", 1)[1], domain="result.rgpv.ac.in"
        )
        return RGPVSession(
            session=session,
            viewstate=str(payload["viewstate"]),
            eventvalidation=str(payload["eventvalidation"]),
            cookie=cookie,
            captcha_url=str(payload["captcha_url"]),
        )

    # -- introspection -------------------------------------------------------

    def size(self) -> int:
        """Current number of pooled sessions."""
        return int(self._redis.llen(POOL_KEY))


_pool: SessionPool | None = None
_pool_lock = threading.Lock()


def get_session_pool() -> SessionPool:
    """Return the process-wide pool, creating it on first use.

    A single instance keeps one refill thread per process; the pooled sessions
    themselves live in Redis, so multiple worker processes still share them.
    """
    global _pool
    if _pool is None:
        with _pool_lock:
            if _pool is None:
                _pool = SessionPool()
    return _pool
