"""Redis-backed pool of pre-warmed RGPV sessions.

Establishing an RGPV session (the ASP.NET handshake + captcha image fetch) is
slow. To keep result lookups fast under load, a background task keeps a small
pool of ready session payloads in Redis; consumers pop one instead of doing the
handshake inline. This unifies the producer (legacy ``py-result-worker``) and
consumer (legacy ``result-docker-py-worker``) into a single component.

The pool stores only the serialisable handshake output (tokens + cookie +
captcha URL); it does not pickle live ``requests.Session`` objects.

Without a reachable Redis (the Cloud Run deployment has none) the pool keeps
its entries in this process's memory instead. That is enough there because the
service runs a single instance, and it is what lets ``warm`` work: the web app
asks for a session as soon as someone starts typing an enrollment number, so by
the time they press Check the session is past RGPV's submit window.
"""

from __future__ import annotations

import json
import threading
import time
from collections import deque

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


# Sessions kept ahead for people about to press Check. Each one costs a single
# RGPV handshake (no captcha), so a few are plenty for one instance.
WARM_TARGET = 3


class _MemoryList:
    """The few Redis list commands the pool uses, held in this process's memory."""

    def __init__(self, max_length: int) -> None:
        self._items: deque[bytes] = deque(maxlen=max_length)
        self._lock = threading.Lock()

    def llen(self, _key: str) -> int:
        with self._lock:
            return len(self._items)

    def lpush(self, _key: str, value: str | bytes) -> int:
        # Pushes go to the head; when full, deque drops the oldest from the tail.
        with self._lock:
            self._items.appendleft(value.encode() if isinstance(value, str) else value)
            return len(self._items)

    def rpop(self, _key: str) -> bytes | None:
        with self._lock:
            return self._items.pop() if self._items else None


def _connect(redis_url: str, target_size: int) -> redis.Redis | _MemoryList:
    """Redis when it answers, otherwise an in-memory list."""
    client = redis.from_url(redis_url, socket_timeout=1, socket_connect_timeout=1)
    try:
        client.ping()
        return client
    except Exception:  # noqa: BLE001 - any failure means no usable Redis
        logger.info("No Redis at the configured URL; keeping the session pool in memory")
        return _MemoryList(max_length=target_size)


def _created_at(payload: dict[str, object]) -> float:
    """Read a pool entry's creation timestamp, tolerating missing/odd values."""
    raw = payload.get("created_at", 0)
    if isinstance(raw, (int, float, str)):
        try:
            return float(raw)
        except ValueError:
            return 0.0
    return 0.0


class SessionPool:
    """Maintains a Redis list of pre-warmed session payloads."""

    def __init__(self, redis_url: str | None = None, target_size: int = TARGET_SIZE) -> None:
        self._redis = _connect(redis_url or get_settings().redis_url, target_size)
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
                self._add_session()
            except Exception as exc:  # noqa: BLE001 - keep the loop alive
                logger.warning("Session refill failed: %s", exc)
                self._stop.wait(2)

    def _add_session(self) -> None:
        """Do one RGPV handshake and pool the result."""
        rgpv = establish_session()
        self._redis.lpush(
            POOL_KEY,
            json.dumps(
                {
                    "viewstate": rgpv.viewstate,
                    "eventvalidation": rgpv.eventvalidation,
                    "cookie": rgpv.cookie,
                    "captcha_url": rgpv.captcha_url,
                    "created_at": rgpv.established_at,
                }
            ),
        )

    def warm(self, target: int = WARM_TARGET) -> int:
        """Pool one more session if fewer than ``target`` are waiting; return the size.

        Called while someone is typing an enrollment number. It runs inside that
        request, so it works on hosts that pause the CPU between requests, and
        it never solves a captcha, so a warm that is never used costs nothing
        but one RGPV page load.
        """
        if self.size() < target:
            self._add_session()
        return self.size()

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
                # Oldest-first (refill lpushes to the head, so the tail is the
                # oldest). The most-aged session is the most likely to already
                # be past RGPV's submit window, so it needs no extra wait.
                raw = self._redis.rpop(POOL_KEY)
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

            age = time.time() - _created_at(payload)
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
            # Preserve the original handshake time: the session has been ageing
            # in Redis, which is exactly what lets it skip the submit delay.
            established_at=_created_at(payload) or time.time(),
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
