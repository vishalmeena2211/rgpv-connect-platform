"""Captcha solving via Tesseract OCR.

The RGPV portal protects the result form with a 5-character image captcha.
We download the image and OCR it, retrying until we get a 5-char result or
exhaust the retry budget.
"""

from __future__ import annotations

from io import BytesIO

import pytesseract
import requests
from PIL import Image

from app.core.constants import CAPTCHA_LENGTH
from app.core.exceptions import CaptchaFailed
from app.logging_config import get_logger

logger = get_logger(__name__)


def solve_captcha(image_url: str, *, max_retries: int = 5, timeout: int = 15) -> str:
    """Download and OCR the captcha image.

    :param image_url: Absolute URL of the captcha image.
    :param max_retries: Attempts before giving up.
    :param timeout: Per-request HTTP timeout in seconds.
    :raises CaptchaFailed: if no 5-character solution is found.
    """
    last_value = ""
    for attempt in range(1, max_retries + 1):
        try:
            response = requests.get(image_url, timeout=timeout)
            response.raise_for_status()
            image = Image.open(BytesIO(response.content))
            text = pytesseract.image_to_string(image)
            cleaned = text.replace(" ", "").replace("\n", "").replace("\t", "").upper()
            last_value = cleaned
            if len(cleaned) == CAPTCHA_LENGTH:
                return cleaned
            logger.debug("Captcha attempt %d gave %r (wrong length)", attempt, cleaned)
        except Exception as exc:  # noqa: BLE001 - OCR/network errors are all retryable
            logger.debug("Captcha attempt %d failed: %s", attempt, exc)

    raise CaptchaFailed(
        f"Could not solve captcha after {max_retries} attempts (last value: {last_value!r})"
    )
