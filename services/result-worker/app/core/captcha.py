"""Captcha solving for the RGPV result portal.

Primary: AZCaptcha.com (when ``AZCAPTCHA_API_KEY`` is set).
Fallback: local Tesseract OCR (for offline dev without an API key).
"""

from __future__ import annotations

from io import BytesIO

import pytesseract
import requests
from PIL import Image, ImageFilter, ImageOps

from app.config import get_settings
from app.core.azcaptcha import download_captcha_image, solve_image_via_azcaptcha
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


def _tesseract_candidates(image: Image.Image) -> list[str]:
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


def _solve_with_tesseract(image_url: str, *, max_retries: int, timeout: int) -> str:
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
            cleaned = str(text).replace(" ", "").replace("\n", "").replace("\t", "").upper()
            last_value = cleaned
            if len(cleaned) == CAPTCHA_LENGTH:
                return cleaned
            logger.debug("Tesseract attempt %d gave %r (wrong length)", attempt, cleaned)
        except Exception as exc:  # noqa: BLE001 - OCR/network errors are all retryable
            logger.debug("Tesseract attempt %d failed: %s", attempt, exc)

    raise CaptchaFailed(
        f"Tesseract could not solve captcha after {max_retries} attempts "
        f"(last value: {last_value!r})"
    )


def _tesseract_candidates_from_url(
    image_url: str, *, max_retries: int, timeout: int
) -> list[str]:
    all_candidates: list[str] = []
    seen: set[str] = set()
    for attempt in range(1, max_retries + 1):
        try:
            response = requests.get(image_url, timeout=timeout)
            response.raise_for_status()
            for candidate in _tesseract_candidates(Image.open(BytesIO(response.content))):
                if candidate not in seen:
                    seen.add(candidate)
                    all_candidates.append(candidate)
        except Exception as exc:  # noqa: BLE001
            logger.debug("Tesseract candidate attempt %d failed: %s", attempt, exc)
    return all_candidates


def solve_captcha(image_url: str, *, max_retries: int = 5, timeout: int = 15) -> str:
    """Download and solve the captcha image."""
    settings = get_settings()
    if settings.use_azcaptcha:
        image_bytes = download_captcha_image(image_url, timeout=timeout)
        return solve_image_via_azcaptcha(image_bytes, timeout=max(timeout, 30))

    return _solve_with_tesseract(image_url, max_retries=max_retries, timeout=timeout)


def solve_captcha_candidates(
    image_url: str, *, max_retries: int = 5, timeout: int = 15
) -> list[str]:
    """Return captcha candidates for one image URL."""
    settings = get_settings()
    if settings.use_azcaptcha:
        try:
            image_bytes = download_captcha_image(image_url, timeout=timeout)
            return [solve_image_via_azcaptcha(image_bytes, timeout=max(timeout, 30))]
        except CaptchaFailed:
            raise

    return _tesseract_candidates_from_url(image_url, max_retries=max_retries, timeout=timeout)
