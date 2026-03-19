"""Miru FastAPI application entry point."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import TYPE_CHECKING

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.agents import router as agents_router
from app.api.v1.auth import router as auth_router
from app.api.v1.chat import router as chat_router
from app.api.v1.integrations import router as integrations_router
from app.api.v1.memory import router as memory_router
from app.api.v1.productivity import router as productivity_router
from app.core.config import get_settings
from app.domain.notifications.api.router import router as notifications_router
from app.infrastructure.database.tortoise import close_db, init_db

if TYPE_CHECKING:
    from collections.abc import AsyncIterator

logger = logging.getLogger(__name__)

settings = get_settings()

if settings.sentry_dsn:
    import sentry_sdk
    from sentry_sdk.integrations.fastapi import FastApiIntegration
    from sentry_sdk.integrations.litellm import LiteLLMIntegration
    from sentry_sdk.integrations.openai import OpenAIIntegration
    from sentry_sdk.integrations.starlette import StarletteIntegration

    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        environment=settings.sentry_environment,
        release=settings.sentry_release,
        traces_sample_rate=1.0,
        integrations=[
            StarletteIntegration(transaction_style="endpoint"),
            FastApiIntegration(transaction_style="endpoint"),
            OpenAIIntegration(include_prompts=True),
            LiteLLMIntegration(include_prompts=True),
        ],
    )
    logger.info("Sentry error tracking enabled (environment=%s)", settings.sentry_environment)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    """Manage application startup and shutdown events."""
    await init_db()
    yield
    await close_db()


app = FastAPI(
    title="Miru Backend",
    description="Personal AI assistant API",
    version="0.2.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allowed_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(agents_router, prefix="/api/v1/agents")
app.include_router(auth_router, prefix="/api/v1/auth")
app.include_router(chat_router, prefix="/api/v1")
app.include_router(memory_router, prefix="/api/v1/memory")
app.include_router(productivity_router, prefix="/api/v1/productivity")
app.include_router(integrations_router, prefix="/api/v1/integrations")
app.include_router(notifications_router, prefix="/api/v1/notifications")


@app.middleware("http")
async def security_headers_middleware(request: Request, call_next) -> Response:  # type: ignore
    """Middleware to inject standard security headers into all responses."""
    response = await call_next(request)
    # SEC(agent): Inject security headers to mitigate XSS, Clickjacking, and ensure secure transport (CWE-116, CWE-693)
    # Allows cdn.jsdelivr.net to ensure FastAPI's Swagger UI and ReDoc work
    response.headers["Content-Security-Policy"] = (
        "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; img-src 'self' data: https://fastapi.tiangolo.com"
    )
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    return response


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}
