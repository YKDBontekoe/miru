"""Miru FastAPI application entry point."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import TYPE_CHECKING

import jwt
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.agents import router as agents_router
from app.api.v1.auth import router as auth_router
from app.api.v1.chat import router as chat_router
from app.api.v1.integrations import router as integrations_router
from app.api.v1.memory import router as memory_router
from app.api.v1.productivity import router as productivity_router
from app.api.v1.websocket import router as websocket_router
from app.core.config import get_settings
from app.domain.auth.models import AuditLog
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
app.include_router(websocket_router, prefix="/api/v1")


@app.middleware("http")
async def audit_log_middleware(request: Request, call_next):
    # To log status code and handle unhandled exceptions safely
    status_code = 500
    try:
        response = await call_next(request)
        status_code = response.status_code
        return response
    finally:
        user_id = None
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            token = auth_header.split(" ")[1]
            try:
                from app.api.dependencies import get_auth_service
                auth_service = get_auth_service()
                # Verify token securely
                payload = await auth_service.decode_jwt(token)
                user_id = payload.sub
            except Exception:
                pass  # Invalid token, ignore

        ip_address = request.client.host if request.client else None
        action = request.method
        resource = request.url.path

        # Format action with status code
        action_with_status = f"{action} {status_code}"

        try:
            await AuditLog.create(
                user_id=user_id,
                action=action_with_status,
                resource=resource,
                ip_address=ip_address,
            )
        except Exception:
            logger.exception("Failed to write audit log")


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}
