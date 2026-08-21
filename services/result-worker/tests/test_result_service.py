"""Tests for session acquisition and captcha poll pacing."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

from app.core.azcaptcha import POLL_BACKOFF_SECONDS, _poll_delay
from app.services.result_service import acquire_session


def test_first_poll_is_immediate() -> None:
    """AZCaptcha often has an answer already; don't sleep before asking."""
    assert _poll_delay(1) == 0.0


def test_early_polls_are_sub_second() -> None:
    """The solver is OCR-based (~0.2-0.3s), so early polls must be tight."""
    assert _poll_delay(2) < 1.0
    assert _poll_delay(3) < 1.0


def test_poll_delay_backs_off_then_plateaus() -> None:
    delays = [_poll_delay(poll) for poll in range(2, 12)]
    assert delays == sorted(delays), "backoff must be non-decreasing"
    assert delays[-1] == POLL_BACKOFF_SECONDS[-1], "should plateau, not grow forever"


@patch("app.services.result_service.establish_session")
@patch("app.services.result_service.get_session_pool")
def test_acquire_session_prefers_the_pool(
    mock_get_pool: MagicMock, mock_establish: MagicMock
) -> None:
    pooled = MagicMock(name="pooled-session")
    mock_get_pool.return_value.pop.return_value = pooled

    assert acquire_session() is pooled
    mock_establish.assert_not_called()


@patch("app.services.result_service.establish_session")
@patch("app.services.result_service.get_session_pool")
def test_acquire_session_falls_back_to_inline_handshake(
    mock_get_pool: MagicMock, mock_establish: MagicMock
) -> None:
    """An empty pool is a cache miss, not a failure."""
    mock_get_pool.return_value.pop.return_value = None
    fresh = MagicMock(name="fresh-session")
    mock_establish.return_value = fresh

    assert acquire_session() is fresh
    mock_establish.assert_called_once()
