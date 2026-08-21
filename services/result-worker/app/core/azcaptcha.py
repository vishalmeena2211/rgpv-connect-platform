"""AZCaptcha.com image captcha solver.

Uses the JSON API (createTask / getTaskResult) compatible with 2captcha-style
clients. RGPV captchas are 5-character alphanumeric images.
"""

from __future__ import annotations

import base64
import time

import requests

from app.config import get_settings
from app.core.constants import CAPTCHA_LENGTH
from app.core.exceptions import CaptchaFailed
from app.logging_config import get_logger

logger = get_logger(__name__)

# AZCaptcha solves image captchas with OCR (not humans), typically in a few
# hundred milliseconds. Poll on a short backoff rather than a flat multi-second
# interval, or nearly all of the perceived solve time is just us sleeping.
POLL_BACKOFF_SECONDS = (0.2, 0.3, 0.5, 0.8, 1.0)
MAX_POLL_SECONDS = 30.0


def _poll_delay(poll: int) -> float:
    """Delay before poll number ``poll`` (1-indexed); first poll is immediate."""
    if poll <= 1:
        return 0.0
    index = min(poll - 2, len(POLL_BACKOFF_SECONDS) - 1)
    return POLL_BACKOFF_SECONDS[index]


def download_captcha_image(image_url: str, *, timeout: int = 15) -> bytes:
    """Download the captcha PNG from the RGPV portal."""
    response = requests.get(image_url, timeout=timeout)
    response.raise_for_status()
    return response.content


def solve_image_via_azcaptcha(image_bytes: bytes, *, timeout: int = 30) -> str:
    """Submit a captcha image to AZCaptcha and poll until solved."""
    settings = get_settings()
    api_key = settings.azcaptcha_api_key
    if not api_key:
        raise CaptchaFailed("AZCAPTCHA_API_KEY is not configured")

    base = settings.azcaptcha_base_url.rstrip("/")
    encoded = base64.b64encode(image_bytes).decode("ascii")

    create_response = requests.post(
        f"{base}/createTask",
        json={
            "clientKey": api_key,
            "task": {
                "type": "ImageToTextTask",
                "body": encoded,
                "module": "azcaptcha_v2",
                "minLength": CAPTCHA_LENGTH,
                "maxLength": CAPTCHA_LENGTH,
                "textinstructions": (
                    "5 alphanumeric characters — letters and digits only, no spaces"
                ),
                "case": False,
            },
        },
        timeout=timeout,
    )
    create_response.raise_for_status()
    create_data = create_response.json()

    if create_data.get("errorId"):
        raise CaptchaFailed(
            "AZCaptcha createTask failed: "
            f"{create_data.get('errorCode')} — {create_data.get('errorDescription')}"
        )

    task_id = create_data.get("taskId")
    if not task_id:
        raise CaptchaFailed("AZCaptcha createTask returned no taskId")

    logger.debug("AZCaptcha task %s submitted", task_id)

    poll = 0
    deadline = time.monotonic() + MAX_POLL_SECONDS
    while time.monotonic() < deadline:
        poll += 1
        time.sleep(_poll_delay(poll))

        result_response = requests.post(
            f"{base}/getTaskResult",
            json={"clientKey": api_key, "taskId": task_id},
            timeout=timeout,
        )
        result_response.raise_for_status()
        result_data = result_response.json()

        if result_data.get("errorId"):
            raise CaptchaFailed(
                "AZCaptcha getTaskResult failed: "
                f"{result_data.get('errorCode')} — {result_data.get('errorDescription')}"
            )

        status = result_data.get("status")
        if status == "processing":
            continue

        if status == "ready":
            solution = result_data.get("solution") or {}
            text = solution.get("text") or solution.get("answer") or ""
            cleaned = str(text).replace(" ", "").replace("\n", "").upper()
            if len(cleaned) == CAPTCHA_LENGTH:
                logger.info(
                    "AZCaptcha solved task %s in %d poll(s) -> %s", task_id, poll, cleaned
                )
                return cleaned
            raise CaptchaFailed(
                f"AZCaptcha returned wrong length ({len(cleaned)}): {cleaned!r}"
            )

    raise CaptchaFailed(
        f"AZCaptcha timed out after {MAX_POLL_SECONDS:.0f}s / {poll} polls (task {task_id})"
    )
