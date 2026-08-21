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
