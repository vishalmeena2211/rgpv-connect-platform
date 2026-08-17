"""Parse an RGPV result HTML page into a :class:`SemesterResult`.

The RGPV grading panel (``#ctl00_ContentPlaceHolder1_pnlGrading``) is a stack
of ``table.gridtable`` elements rendered as newline-separated text. The header
table holds the student details at fixed line offsets; the trailing tables hold
the result summary (description, SGPA, CGPA); the tables in between are one per
subject. These offsets are brittle by nature — they mirror exactly what the
legacy workers parsed, centralised here with explanatory comments.
"""

from __future__ import annotations

from requests_html import HTML

from app.core.constants import ERR_NOT_FOUND, ERR_WRONG_CAPTCHA, subject_table_count
from app.core.exceptions import CaptchaFailed, ResultNotFound, ResultParseError
from app.core.models import ResultStatus, SemesterResult, SubjectResult
from app.logging_config import get_logger

logger = get_logger(__name__)

GRADING_PANEL = "#ctl00_ContentPlaceHolder1_pnlGrading"

# Line offsets within the header gridtable's text (see module docstring).
_HEADER_OFFSETS = {
    "name": 2,
    "enrollment": 4,
    "course": 6,
    "branch": 8,
    "semester": 10,
    "status": 12,
}


def _alert_text(html: HTML, line: int) -> str:
    """Extract the message from an ``alert("...")`` rendered in div.rslmain."""
    block = html.find("div.rslmain")
    if not block:
        return ""
    lines = block[0].text.split("\n")
    if line >= len(lines):
        return ""
    return lines[line].split('");')[0].replace('alert("', "")


def detect_error(html: HTML) -> None:
    """Raise the appropriate typed error if the page is an error page."""
    if _alert_text(html, 17) == ERR_NOT_FOUND:
        raise ResultNotFound("Result for this Enrollment No. not found")
    if _alert_text(html, 19) == ERR_WRONG_CAPTCHA:
        raise CaptchaFailed("RGPV rejected the captcha text")


def _to_float(value: str) -> float | None:
    try:
        return float(value)
    except (ValueError, TypeError):
        return None


def _status(raw: str) -> ResultStatus:
    upper = raw.strip().upper()
    if "PASS" in upper:
        return ResultStatus.PASS
    if "FAIL" in upper:
        return ResultStatus.FAIL
    if "WITHHELD" in upper:
        return ResultStatus.WITHHELD
    return ResultStatus.UNKNOWN


def parse_result(html: HTML) -> SemesterResult:
    """Parse a result page into a :class:`SemesterResult`.

    :raises ResultNotFound: the enrollment has no result.
    :raises CaptchaFailed: the portal rejected the captcha.
    :raises ResultParseError: the page was unexpected/unparseable.
    """
    detect_error(html)

    panels = html.find(GRADING_PANEL)
    if not panels:
        raise ResultParseError("Grading panel missing from result page")

    tables = panels[0].find("table.gridtable")
    if len(tables) < 3:
        raise ResultParseError("Result page has too few grading tables")

    header = tables[0].text.split("\n")

    def header_at(key: str) -> str:
        idx = _HEADER_OFFSETS[key]
        return header[idx] if idx < len(header) else ""

    session_label = header[0].split("\xa0- ")[1] if "\xa0- " in header[0] else None
    semester_raw = header_at("semester")
    try:
        semester = int(semester_raw)
    except ValueError as exc:
        raise ResultParseError(f"Unparseable semester {semester_raw!r}") from exc

    # The last-but-one table holds the result summary (description/SGPA/CGPA).
    summary = tables[-2].text.split("\n")
    description = summary[3] if len(summary) > 3 else None
    sgpa = _to_float(summary[4]) if len(summary) > 4 else None
    cgpa = _to_float(summary[5]) if len(summary) > 5 else None

    subjects: list[SubjectResult] = []
    for table in tables[2 : subject_table_count(semester)]:
        cells = table.text.split("\n")
        if len(cells) < 4:
            continue
        subjects.append(
            SubjectResult(
                name=cells[0],
                total_marks=_to_float(cells[1]),
                earned_marks=_to_float(cells[2]),
                grade=cells[3],
            )
        )

    return SemesterResult(
        name=header_at("name"),
        enrollment=header_at("enrollment"),
        session=session_label,
        course=header_at("course"),
        branch=header_at("branch"),
        semester=semester,
        status=_status(header_at("status")),
        subjects=subjects,
        result_description=description,
        sgpa=sgpa,
        cgpa=cgpa,
    )
