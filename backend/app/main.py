"""Miru FastAPI application entry point."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import TYPE_CHECKING

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.agents import router as agents_router
from app.api.v1.auth import router as auth_router
from app.api.v1.chat import router as chat_router
from app.api.v1.integrations import router as integrations_router
from app.api.v1.memory import router as memory_router
from app.core.config import get_settings
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

origins = settings.cors_allowed_origins.split(",")
allow_all_origins = "*" in origins

app.add_middleware(
    CORSMiddleware,
    # When allow_credentials=True, allow_origins cannot be ["*"].
    # We use allow_origin_regex to allow everything while being compatible with credentials.
    allow_origins=[] if allow_all_origins else origins,
    allow_origin_regex=".*" if allow_all_origins else None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(agents_router, prefix="/api/v1/agents")
app.include_router(auth_router, prefix="/api/v1/auth")
app.include_router(chat_router, prefix="/api/v1")
app.include_router(memory_router, prefix="/api/v1/memory")
app.include_router(integrations_router, prefix="/api/v1/integrations")


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}
