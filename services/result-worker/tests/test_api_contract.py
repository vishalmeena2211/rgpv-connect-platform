"""The worker's HTTP contract with the web app: auth guard and camelCase output."""

from __future__ import annotations

from collections.abc import Iterator
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.config import get_settings
from app.core.models import SemesterResult, SubjectResult
from app.services.metrics import mask_enrollment

RESULT = SemesterResult(
    name="PRIYANSHI RATHORE",
    enrollment="0151CS241042",
    semester=4,
    subjects=[SubjectResult(name="CS401- [T]", total_marks=100, earned_marks=81, grade="A")],
    result_description="PASS",
    sgpa=8.41,
    cgpa=7.95,
)


@pytest.fixture
def client(monkeypatch: pytest.MonkeyPatch) -> Iterator[TestClient]:
    monkeypatch.setenv("WORKER_API_KEY", "test-key")
    get_settings.cache_clear()
    with patch("app.main.get_session_pool", return_value=MagicMock()):
        from app.main import create_app

        with TestClient(create_app()) as test_client:
            yield test_client
    get_settings.cache_clear()


def test_health_needs_no_key(client: TestClient) -> None:
    assert client.get("/health").json() == {"status": "ok"}


def test_result_refuses_a_missing_key(client: TestClient) -> None:
    response = client.post("/api/v1/result", json={"enrollment": "0151CS241042", "semester": 4})
    assert response.status_code == 401


def test_result_refuses_a_wrong_key(client: TestClient) -> None:
    response = client.post(
        "/api/v1/result",
        json={"enrollment": "0151CS241042", "semester": 4},
        headers={"X-Worker-Key": "nope"},
    )
    assert response.status_code == 401


@patch("app.routers.single.fetch_single", return_value=RESULT)
def test_result_is_camel_case(_fetch: MagicMock, client: TestClient) -> None:
    response = client.post(
        "/api/v1/result",
        json={"enrollment": "0151CS241042", "semester": 4},
        headers={"X-Worker-Key": "test-key"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["resultDescription"] == "PASS"
    assert body["subjects"][0]["totalMarks"] == 100
    assert body["subjects"][0]["earnedMarks"] == 81
    assert "result_description" not in body


def test_mask_enrollment_hides_the_serial() -> None:
    assert mask_enrollment("0151CS241042") == "0151CS24••••"
    assert mask_enrollment("0751BT16012") == "0751BT16•••"
