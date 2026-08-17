"""Pydantic models for requests and responses.

The response shapes mirror the ``SemesterResult`` TypeScript type in
``@rgpv/shared`` so the web app and worker share one contract.
"""

from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, Field


class ResultStatus(str, Enum):
    PASS = "PASS"
    FAIL = "FAIL"
    WITHHELD = "WITHHELD"
    UNKNOWN = "UNKNOWN"


class SingleResultRequest(BaseModel):
    enrollment: str = Field(..., examples=["0151CS21001"])
    semester: int = Field(..., ge=1, le=10)


class BulkResultRequest(BaseModel):
    first_enrollment: str = Field(..., examples=["0151CS21001"])
    last_enrollment: str = Field(..., examples=["0151CS21030"])
    semester: int = Field(..., ge=1, le=10)


class SubjectResult(BaseModel):
    name: str
    code: str | None = None
    total_marks: float | None = None
    earned_marks: float | None = None
    grade: str | None = None


class SemesterResult(BaseModel):
    name: str
    enrollment: str
    session: str | None = None
    course: str | None = None
    branch: str | None = None
    semester: int
    status: ResultStatus = ResultStatus.UNKNOWN
    subjects: list[SubjectResult] = Field(default_factory=list)
    result_description: str | None = None
    sgpa: float | None = None
    cgpa: float | None = None


class BulkResultItem(BaseModel):
    """One entry in a bulk response: either a result or an error message."""

    enrollment: str
    result: SemesterResult | None = None
    error: str | None = None
