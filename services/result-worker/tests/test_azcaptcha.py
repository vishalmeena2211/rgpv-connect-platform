"""Tests for AZCaptcha integration."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from app.core.azcaptcha import solve_image_via_azcaptcha
from app.core.exceptions import CaptchaFailed


@patch("app.core.azcaptcha.requests.post")
@patch("app.core.azcaptcha.get_settings")
def test_solve_image_via_azcaptcha(mock_settings: MagicMock, mock_post: MagicMock) -> None:
    mock_settings.return_value.azcaptcha_api_key = "test-key"
    mock_settings.return_value.azcaptcha_base_url = "https://azcaptcha.com"

    create_resp = MagicMock()
    create_resp.raise_for_status.return_value = None
    create_resp.json.return_value = {"errorId": 0, "taskId": 999}

    poll_processing = MagicMock()
    poll_processing.raise_for_status.return_value = None
    poll_processing.json.return_value = {"errorId": 0, "status": "processing"}

    poll_ready = MagicMock()
    poll_ready.raise_for_status.return_value = None
    poll_ready.json.return_value = {
        "errorId": 0,
        "status": "ready",
        "solution": {"text": "ab12c"},
    }

    mock_post.side_effect = [create_resp, poll_ready]

    result = solve_image_via_azcaptcha(b"fake-png-bytes", timeout=10)
    assert result == "AB12C"


@patch("app.core.azcaptcha.get_settings")
def test_solve_image_missing_api_key(mock_settings: MagicMock) -> None:
    mock_settings.return_value.azcaptcha_api_key = ""
    with pytest.raises(CaptchaFailed, match="AZCAPTCHA_API_KEY"):
        solve_image_via_azcaptcha(b"fake")
