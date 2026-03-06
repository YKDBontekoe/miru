"""Pytest configuration and shared fixtures."""

from __future__ import annotations

import os

import pytest
from fastapi.testclient import TestClient

# Set required env vars before importing the app so settings initialises cleanly.
os.environ.setdefault("OPENROUTER_API_KEY", "test-key")
os.environ.setdefault("SUPABASE_URL", "http://localhost:54321")
os.environ.setdefault("SUPABASE_KEY", "test-key")
os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost:5432/test")
os.environ.setdefault("NEO4J_URI", "bolt://localhost:7687")
os.environ.setdefault("NEO4J_USER", "neo4j")
os.environ.setdefault("NEO4J_PASSWORD", "test-password")


@pytest.fixture()
def client() -> TestClient:
    """Return a test client for the FastAPI app."""
    from app.main import app

    return TestClient(app, raise_server_exceptions=False)
