"""Tests for result-page error detection and status mapping.

Full result parsing is covered by integration tests against saved HTML
fixtures; here we verify the error-detection branches and the status mapper,
which are the most failure-prone parts of the parser.
"""

from __future__ import annotations

import pytest
from requests_html import HTML

from app.core.exceptions import CaptchaFailed, ResultNotFound
from app.core.parser import _status, detect_error
from app.core.models import ResultStatus


def _alert_page(line_count: int, line_index: int, message: str) -> HTML:
    """Build a minimal div.rslmain page with an alert() at a given line."""
    lines = ["" for _ in range(line_count)]
    lines[line_index] = f'alert("{message}");'
    return HTML(html=f'<div class="rslmain">{chr(10).join(lines)}</div>')


def test_detect_error_raises_not_found() -> None:
    page = _alert_page(20, 17, "Result for this Enrollment No. not Found")
    with pytest.raises(ResultNotFound):
        detect_error(page)


def test_detect_error_raises_captcha() -> None:
    page = _alert_page(21, 19, "you have entered a wrong text")
    with pytest.raises(CaptchaFailed):
        detect_error(page)


def test_detect_error_passes_clean_page() -> None:
    detect_error(HTML(html="<div class='rslmain'>ok</div>"))  # should not raise


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("PASS", ResultStatus.PASS),
        ("FAIL", ResultStatus.FAIL),
        ("WITHHELD", ResultStatus.WITHHELD),
        ("something else", ResultStatus.UNKNOWN),
    ],
)
def test_status_mapping(raw: str, expected: ResultStatus) -> None:
    assert _status(raw) == expected
