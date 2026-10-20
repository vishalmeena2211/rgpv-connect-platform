"""Tests for session acquisition and captcha poll pacing."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

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


@patch("app.services.result_service.record_fetch")
@patch("app.services.result_service.parse_result")
@patch("app.services.result_service.fetch_result_html")
@patch("app.services.result_service._await_submit_window")
@patch("app.services.result_service.solve_captcha_candidates")
@patch("app.services.result_service.acquire_session")
def test_a_solver_failure_keeps_the_session(
    mock_acquire: MagicMock,
    mock_solve: MagicMock,
    _wait: MagicMock,
    mock_fetch: MagicMock,
    mock_parse: MagicMock,
    _record: MagicMock,
) -> None:
    """AZCaptcha erroring says nothing about the RGPV session, which has already aged."""
    from app.core.exceptions import CaptchaFailed
    from app.services.result_service import fetch_single

    session = MagicMock(name="warmed-session")
    mock_acquire.return_value = session
    mock_solve.side_effect = [CaptchaFailed("ERROR_WORKER_EXCEPTION"), ["ABCDE"]]
    mock_parse.return_value = MagicMock(name="result")

    assert fetch_single("0111AL230001", 6) is mock_parse.return_value
    mock_acquire.assert_called_once()
    assert mock_fetch.call_args.args[0] is session


@patch("app.services.result_service.record_fetch")
@patch("app.services.result_service._await_submit_window")
@patch("app.services.result_service.solve_captcha_candidates")
@patch("app.services.result_service.acquire_session")
def test_a_session_is_not_reused_forever(
    mock_acquire: MagicMock, mock_solve: MagicMock, _wait: MagicMock, _record: MagicMock
) -> None:
    from app.core.exceptions import CaptchaFailed
    from app.services.result_service import MAX_SESSION_REUSE, fetch_single

    mock_solve.side_effect = CaptchaFailed("bad image")
    with pytest.raises(CaptchaFailed):
        fetch_single("0111AL230001", 6, max_retries=MAX_SESSION_REUSE + 2)
    # First session plus its reuses, then a fresh one.
    assert mock_acquire.call_count == 2
