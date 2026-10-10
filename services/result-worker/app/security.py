"""Shared-secret guard for the worker's API.

Every captcha the worker solves is paid for, so the API must not be open to
the internet. The web app sends ``X-Worker-Key``; requests without the right
key are refused. When ``WORKER_API_KEY`` is unset (local development) the
guard lets everything through and the app logs a warning at startup.
"""

from __future__ import annotations

import hmac

from fastapi import Header, HTTPException, status

from app.config import get_settings


def require_worker_key(x_worker_key: str | None = Header(default=None)) -> None:
    """FastAPI dependency: refuse calls without the configured worker key."""
    expected = get_settings().worker_api_key
    if not expected:
        return
    if not x_worker_key or not hmac.compare_digest(x_worker_key, expected):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing or wrong worker key"
        )
