"""Typed exceptions for the result-fetching pipeline.

Replaces the legacy ``{"error": "..."}`` dicts with real exceptions that the
router layer maps to HTTP responses.
"""

from __future__ import annotations


class RGPVError(Exception):
    """Base class for all RGPV worker errors."""


class ResultNotFound(RGPVError):
    """The enrollment number has no result for the requested semester."""


class CaptchaFailed(RGPVError):
    """The captcha could not be solved within the retry budget."""


class SessionUnavailable(RGPVError):
    """No RGPV session could be established or pulled from the pool."""


class ResultParseError(RGPVError):
    """The result page was returned but could not be parsed."""
