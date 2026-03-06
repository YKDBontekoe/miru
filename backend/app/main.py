"""Miru FastAPI application entry point."""

from __future__ import annotations

from contextlib import asynccontextmanager
from typing import TYPE_CHECKING

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.graph import close_neo4j_driver, get_neo4j_driver
from app.routes import router

if TYPE_CHECKING:
    from collections.abc import AsyncIterator


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    # App startup - initialize Neo4j connection
    await get_neo4j_driver()
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
