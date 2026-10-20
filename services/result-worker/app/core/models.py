"""Pydantic models for requests and responses.

The response shapes mirror the ``SemesterResult`` TypeScript type in
``@rgpv/shared`` so the web app and worker share one contract.
"""

from __future__ import annotations

from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel


class ResultStatus(StrEnum):
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


class CamelModel(BaseModel):
    """Response model serialised with camelCase keys, matching the TS contract.

    FastAPI serialises response models by alias, so the web app receives
    ``totalMarks`` / ``resultDescription`` exactly as ``@rgpv/shared`` names
    them. Python code keeps using snake_case attributes.
    """

    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class SubjectResult(CamelModel):
    name: str
    code: str | None = None
    total_marks: float | None = None
    earned_marks: float | None = None
    grade: str | None = None


class SemesterResult(CamelModel):
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
    # RGPV's header "Status" cell: the student's category (Regular, Ex), not pass/fail.
    candidate_status: str | None = None
    revaluation_date: str | None = None
    revaluation_late_fee_date: str | None = None


class BulkResultItem(CamelModel):
    """One entry in a bulk response: either a result or an error message."""

    enrollment: str
    result: SemesterResult | None = None
    error: str | None = None
