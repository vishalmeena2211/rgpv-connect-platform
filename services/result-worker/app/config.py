"""Environment-driven application settings.

All configuration is read from environment variables (or a local ``.env``)
via pydantic-settings, replacing the hardcoded URLs/CORS origins that were
scattered across the three legacy workers.
"""

from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Typed application settings."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Origins permitted by CORS (comma-separated in the env var).
    allowed_origins: str = "http://localhost:3000"

    # RGPV result portal base URL (no trailing slash).
    rgpv_base_url: str = "http://result.rgpv.ac.in/Result"

    # Redis connection string for the session pool.
    redis_url: str = "redis://localhost:6379"

    log_level: str = "INFO"
    bulk_rate_limit: str = "5/minute"

    # Captcha solving — AZCaptcha (primary) or local Tesseract (fallback).
    azcaptcha_api_key: str = ""
    azcaptcha_base_url: str = "https://azcaptcha.com"
    captcha_provider: str = "azcaptcha"

    # OCR captcha solving is probabilistic: a wrong read is rejected by RGPV and
    # the only remedy is another attempt with a fresh captcha. Attempts are
    # cheap (~2s each), so the budget is generous — but bounded by a wall-clock
    # deadline so a caller on a serverless timeout still gets an answer.
    captcha_max_retries: int = 8
    fetch_deadline_seconds: float = 45.0

    # RGPV rejects a result POST that arrives too soon after the session was
    # created — an anti-bot check, not a captcha problem (it misreports as a
    # wrong captcha). Measured against the live portal, 3 trials per value:
    #
    #     submit at ~3.4-4.1s -> 0/3 accepted
    #     submit at ~4.4-4.6s -> 0/3 accepted
    #     submit at ~5.6-6.5s -> 3/3 accepted
    #
    # The real threshold sits near 5s; 6.0 keeps a margin without over-waiting.
    # Lowering this below ~5s makes every request fail, so it is a correctness
    # floor rather than a tuning knob.
    #
    # Crucially the clock runs from session establishment, not from the captcha
    # fetch — so a pre-warmed session out of the pool has already served this
    # time and submits with no delay at all. Keeping the pool full is how you
    # get fast lookups; shortening this value only breaks them.
    min_session_age_seconds: float = 6.0

    @property
    def use_azcaptcha(self) -> bool:
        """True when AZCaptcha should be used (key present or provider forced)."""
        if self.captcha_provider.lower() == "tesseract":
            return False
        return bool(self.azcaptcha_api_key)

    @property
    def cors_origins(self) -> list[str]:
        """CORS origins as a list, trimmed of empties."""
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]


@lru_cache
def get_settings() -> Settings:
    """Return a cached Settings instance (read once per process)."""
    return Settings()
