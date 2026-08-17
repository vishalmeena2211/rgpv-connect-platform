"""Enrollment-number parsing — the Python mirror of ``@rgpv/shared/enrollment``.

Kept in sync with the TypeScript implementation so both sides agree on the
``CCCCBBYYNNN`` layout (e.g. ``0751BT16012``).
"""

from __future__ import annotations

import re
from dataclasses import dataclass

_PATTERN = re.compile(r"^(\d{4})([A-Z]{2})(\d{2})(\d{3})$")
_COURSE_YEARS = 4


@dataclass(frozen=True)
class ParsedEnrollment:
    raw: str
    college_code: str
    branch_code: str
    admission_year: int
    graduating_batch: int
    serial: str


def normalise(value: str) -> str:
    """Trim, strip spaces/hyphens and uppercase an enrollment string."""
    return re.sub(r"[\s-]", "", value.strip()).upper()


def parse_enrollment(value: str, reference_year: int | None = None) -> ParsedEnrollment | None:
    """Parse an enrollment number, or return ``None`` if malformed."""
    if reference_year is None:
        from datetime import datetime

        reference_year = datetime.now().year

    raw = normalise(value)
    match = _PATTERN.match(raw)
    if not match:
        return None

    college_code, branch_code, year_digits, serial = match.groups()
    century = (reference_year // 100) * 100
    admission_year = century + int(year_digits)
    if admission_year > reference_year:  # future-looking → previous century
        admission_year -= 100

    return ParsedEnrollment(
        raw=raw,
        college_code=college_code,
        branch_code=branch_code,
        admission_year=admission_year,
        graduating_batch=admission_year + _COURSE_YEARS,
        serial=serial,
    )


def expand_range(first: str, last: str, max_count: int = 500) -> list[str]:
    """Expand an inclusive enrollment range into the full list of numbers.

    Returns an empty list if the endpoints don't share a prefix, the range is
    reversed, or it exceeds ``max_count``.
    """
    start = parse_enrollment(first)
    end = parse_enrollment(last)
    if not start or not end:
        return []
    if (start.college_code, start.branch_code, start.admission_year) != (
        end.college_code,
        end.branch_code,
        end.admission_year,
    ):
        return []

    from_serial, to_serial = int(start.serial), int(end.serial)
    if to_serial < from_serial or to_serial - from_serial + 1 > max_count:
        return []

    prefix = start.raw[: len(start.raw) - len(start.serial)]
    width = len(start.serial)
    return [f"{prefix}{serial:0{width}d}" for serial in range(from_serial, to_serial + 1)]
