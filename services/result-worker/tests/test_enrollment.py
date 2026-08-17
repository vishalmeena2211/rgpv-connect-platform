"""Tests for enrollment parsing — mirrors the @rgpv/shared TS test suite."""

from __future__ import annotations

from app.core.enrollment import expand_range, normalise, parse_enrollment


def test_normalise_strips_and_uppercases() -> None:
    assert normalise(" 0751-bt16 012 ") == "0751BT16012"


def test_parse_canonical() -> None:
    parsed = parse_enrollment("0751BT16012", reference_year=2024)
    assert parsed is not None
    assert parsed.college_code == "0751"
    assert parsed.branch_code == "BT"
    assert parsed.admission_year == 2016
    assert parsed.graduating_batch == 2020
    assert parsed.serial == "012"


def test_parse_future_year_rolls_back_a_century() -> None:
    parsed = parse_enrollment("0101CS99001", reference_year=2024)
    assert parsed is not None
    assert parsed.admission_year == 1999


def test_parse_invalid_returns_none() -> None:
    assert parse_enrollment("nope") is None
    assert parse_enrollment("0751BT16") is None


def test_expand_range_inclusive() -> None:
    assert expand_range("0751BT16001", "0751BT16003") == [
        "0751BT16001",
        "0751BT16002",
        "0751BT16003",
    ]


def test_expand_range_rejects_mismatched_prefix() -> None:
    assert expand_range("0751BT16001", "0751CS16003") == []


def test_expand_range_enforces_cap() -> None:
    assert expand_range("0751BT16001", "0751BT16999", max_count=100) == []
