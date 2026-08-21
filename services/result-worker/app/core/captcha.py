"""Captcha solving via Tesseract OCR.

The RGPV portal protects the result form with a 5-character image captcha.
We download the image and OCR it, retrying until we get a 5-char result or
exhaust the retry budget.
"""

from __future__ import annotations

from io import BytesIO

import pytesseract
import requests
from PIL import Image, ImageFilter, ImageOps

from app.core.constants import CAPTCHA_LENGTH
from app.core.exceptions import CaptchaFailed
from app.logging_config import get_logger

logger = get_logger(__name__)


def _preprocess(image: Image.Image) -> Image.Image:
    grey = ImageOps.grayscale(image)
    grey = ImageOps.invert(grey)
    grey = ImageOps.autocontrast(grey)
    grey = grey.filter(ImageFilter.SHARPEN)
    grey = grey.point(lambda px: 0 if px < 128 else 255)
    return grey.resize((grey.width * 2, grey.height * 2), Image.Resampling.NEAREST)


def _captcha_candidates(image: Image.Image) -> list[str]:
    variants: list[Image.Image] = [
        image,
        _preprocess(image.copy()),
    ]
    candidates: list[str] = []
    seen: set[str] = set()
    for variant in variants:
        for psm in (7, 8, 13):
            text = pytesseract.image_to_string(
                variant,
                config=(
                    f"--psm {psm} "
                    "-c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
                ),
            )
            cleaned = text.replace(" ", "").replace("\n", "").replace("\t", "").upper()
            if len(cleaned) == CAPTCHA_LENGTH and cleaned not in seen:
                seen.add(cleaned)
                candidates.append(cleaned)
    return candidates


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
            image = _preprocess(Image.open(BytesIO(response.content)))
            text = pytesseract.image_to_string(
                image,
                config="--psm 8 -c tessedit_char_whitelist=ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789",
            )
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


def solve_captcha_candidates(image_url: str, *, max_retries: int = 5, timeout: int = 15) -> list[str]:
    """Return OCR candidates for one captcha image URL."""
    all_candidates: list[str] = []
    seen: set[str] = set()
    for attempt in range(1, max_retries + 1):
        try:
            response = requests.get(image_url, timeout=timeout)
            response.raise_for_status()
            for candidate in _captcha_candidates(Image.open(BytesIO(response.content))):
                if candidate not in seen:
                    seen.add(candidate)
                    all_candidates.append(candidate)
        except Exception as exc:  # noqa: BLE001
            logger.debug("Captcha candidate attempt %d failed: %s", attempt, exc)
    return all_candidates
