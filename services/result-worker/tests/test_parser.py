"""Tests for result-page error detection and status mapping.

The error-detection branches and the status mapper are the most failure-prone
parts of the parser; full parsing is checked against ``fixtures/result_page.html``,
a page shaped like RGPV's real grading panel with a made-up student.
"""

from __future__ import annotations

from pathlib import Path

import pytest
from requests_html import HTML

from app.core.exceptions import CaptchaFailed, ResultNotFound
from app.core.models import ResultStatus
from app.core.parser import _status, detect_error, parse_result


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


PAGE = HTML(html=(Path(__file__).parent / "fixtures" / "result_page.html").read_text())


def test_pass_comes_from_the_result_description_not_the_header_status() -> None:
    result = parse_result(PAGE)
    assert result.status == ResultStatus.PASS
    assert result.result_description == "PASS"
    assert result.candidate_status == "Regular"


def test_reads_every_subject_and_the_summary() -> None:
    result = parse_result(PAGE)
    assert result.name == "ASHA VERMA"
    assert result.enrollment == "0111AL230001"
    assert result.semester == 6
    assert result.session == "June-2026"
    assert [s.name for s in result.subjects][:2] == ["AL601- [T]", "AL602- [T]"]
    assert len(result.subjects) == 9
    assert result.subjects[0].total_marks == 3
    assert result.subjects[-1].grade == "A+"
    assert (result.sgpa, result.cgpa) == (8.67, 8.09)
    assert result.revaluation_date == "05/10/2026"
    assert result.revaluation_late_fee_date == "07/10/2026"
