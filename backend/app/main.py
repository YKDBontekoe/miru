"""Miru FastAPI application entry point."""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # App startup - no pool initialization needed with Supabase
    yield
    # App shutdown


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
