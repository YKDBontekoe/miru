"""Miru FastAPI application entry point."""

from __future__ import annotations

import logging
import sys
from contextlib import asynccontextmanager
from typing import TYPE_CHECKING

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import ValidationError

from app.config import get_settings
from app.graph import close_neo4j_driver, get_neo4j_driver
from app.routes import router

if TYPE_CHECKING:
    from collections.abc import AsyncIterator

logger = logging.getLogger(__name__)

# Validate settings eagerly at startup so a missing env var produces a clear
# error message in the container logs instead of a cryptic import-time crash.
try:
    get_settings()
except ValidationError as exc:
    missing = [e["loc"][0] for e in exc.errors() if e["type"] == "missing"]
    logger.critical(
        "Container startup failed: missing required environment variables: %s",
        ", ".join(str(f) for f in missing),
    )
    sys.exit(1)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    # App startup - initialize Neo4j connection
    try:
        await get_neo4j_driver()
        logger.info("Successfully connected to Neo4j")
    except Exception as exc:
        logger.error(
            "Failed to connect to Neo4j at startup: %s. Continuing without graph features.", exc
        )

    yield
    # App shutdown - close Neo4j connection
    await close_neo4j_driver()


app = FastAPI(title="Miru", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # tighten in production
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router, prefix="/api")


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}
