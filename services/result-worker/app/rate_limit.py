"""Shared slowapi rate limiter.

Kept in its own module so routers and the app factory import the same limiter
instance without a circular dependency.
"""

from __future__ import annotations

from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
