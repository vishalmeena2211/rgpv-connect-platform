"""FastAPI application factory.

Assembles the unified worker: CORS, rate limiting, the session pool lifecycle,
and the single/bulk/queue/health routers.
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from starlette.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.logging_config import configure_logging, get_logger
from app.rate_limit import limiter
from app.routers import bulk, health, queue, single
from app.services.session_pool import get_session_pool

logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Create the session pool on startup and stop it on shutdown."""
    settings = get_settings()
    configure_logging(settings.log_level)
    app.state.session_pool = get_session_pool()
    logger.info("RGPV result worker ready (origins=%s)", settings.cors_origins)
    try:
        yield
    finally:
        app.state.session_pool.stop()


def create_app() -> FastAPI:
    """Build and configure the FastAPI application."""
    settings = get_settings()
    app = FastAPI(
        title="RGPV Result Worker",
        version="0.1.0",
        description="Unified service for single, bulk and pooled RGPV result fetching.",
        lifespan=lifespan,
    )

    app.state.limiter = limiter
    # slowapi's handler is typed against its own concrete exception rather than
    # Starlette's broader `Exception` signature; the registration is correct.
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)  # type: ignore[arg-type]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health.router)
    app.include_router(single.router)
    app.include_router(bulk.router)
    app.include_router(queue.router)
    return app


app = create_app()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
