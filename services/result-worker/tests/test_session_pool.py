"""Tests for the pre-warmed session pool's consumption path."""

from __future__ import annotations

import json
import time
from unittest.mock import MagicMock, patch

from app.services.session_pool import MAX_SESSION_AGE_SECONDS, SessionPool


def _entry(*, age_seconds: float = 0.0, **overrides: object) -> bytes:
    """Build a serialised pool entry, optionally aged and/or overridden."""
    payload: dict[str, object] = {
        "viewstate": "vs-token",
        "eventvalidation": "ev-token",
        "cookie": "ASP.NET_SessionId=abc123",
        "captcha_url": "http://result.rgpv.ac.in/Result/captcha.png",
        "created_at": time.time() - age_seconds,
    }
    payload.update(overrides)
    return json.dumps(payload).encode()


def _pool(redis_mock: MagicMock) -> SessionPool:
    with patch("app.services.session_pool.redis.from_url", return_value=redis_mock):
        return SessionPool()


def test_pop_returns_none_when_pool_is_empty() -> None:
    redis_mock = MagicMock()
    redis_mock.rpop.return_value = None

    assert _pool(redis_mock).pop() is None


def test_pop_rehydrates_a_fresh_session() -> None:
    redis_mock = MagicMock()
    redis_mock.rpop.return_value = _entry()

    session = _pool(redis_mock).pop()

    assert session is not None
    assert session.viewstate == "vs-token"
    assert session.eventvalidation == "ev-token"
    assert session.captcha_url.endswith("captcha.png")
    # The ASP.NET cookie must be attached to the rebuilt requests session.
    assert session.session.cookies.get("ASP.NET_SessionId") == "abc123"


def test_pop_discards_stale_sessions_and_keeps_looking() -> None:
    redis_mock = MagicMock()
    redis_mock.rpop.side_effect = [
        _entry(age_seconds=MAX_SESSION_AGE_SECONDS + 60),
        _entry(),
    ]

    session = _pool(redis_mock).pop()

    assert session is not None
    assert redis_mock.rpop.call_count == 2


def test_pop_returns_none_when_every_entry_is_stale() -> None:
    redis_mock = MagicMock()
    redis_mock.rpop.side_effect = [
        _entry(age_seconds=MAX_SESSION_AGE_SECONDS + 1),
        None,
    ]

    assert _pool(redis_mock).pop() is None


def test_pop_skips_malformed_entries() -> None:
    redis_mock = MagicMock()
    redis_mock.rpop.side_effect = [b"not-json", _entry()]

    assert _pool(redis_mock).pop() is not None


def test_pop_treats_entry_without_timestamp_as_stale() -> None:
    """Legacy entries written before timestamps existed must not be trusted."""
    redis_mock = MagicMock()
    redis_mock.rpop.side_effect = [_entry(created_at=0), None]

    assert _pool(redis_mock).pop() is None


def test_pop_never_raises_when_redis_is_down() -> None:
    """A pool miss must degrade to an inline handshake, not an error."""
    redis_mock = MagicMock()
    redis_mock.rpop.side_effect = ConnectionError("redis unreachable")

    assert _pool(redis_mock).pop() is None


def test_falls_back_to_memory_when_redis_does_not_answer() -> None:
    redis_mock = MagicMock()
    redis_mock.ping.side_effect = ConnectionError("refused")
    pool = _pool(redis_mock)

    assert pool.size() == 0
    with patch("app.services.session_pool.establish_session") as establish:
        establish.return_value = MagicMock(
            viewstate="vs",
            eventvalidation="ev",
            cookie="ASP.NET_SessionId=abc",
            captcha_url="http://result.rgpv.ac.in/Result/captcha.png",
            established_at=time.time() - 10,
        )
        assert pool.warm(target=2) == 1
        assert pool.warm(target=2) == 2
        assert pool.warm(target=2) == 2  # already enough waiting: no third handshake
        assert establish.call_count == 2

    session = pool.pop()
    assert session is not None
    # The handshake time travels with the session, so it can submit straight away.
    assert time.time() - session.established_at >= 10
    assert pool.size() == 1
