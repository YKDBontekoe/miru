"""Miru FastAPI application entry point."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import close_pool, get_pool
from app.routes import router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Warm up the connection pool on startup
    await get_pool()
    yield
    await close_pool()


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
