"""Tests for the health endpoint."""

from __future__ import annotations

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def no_raise_client() -> TestClient:
    return TestClient(app, raise_server_exceptions=False)


def test_health_returns_ok(client: TestClient) -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_health_content_type(client: TestClient) -> None:
    response = client.get("/health")
    assert "application/json" in response.headers["content-type"]


def test_global_exception_handler(no_raise_client: TestClient) -> None:
    @app.get("/test-error")
    async def error_route() -> None:
        raise ValueError("Test error")

    response = no_raise_client.get("/test-error")
    assert response.status_code == 500
    assert response.json() == {
        "error": "Internal Server Error",
        "message": "An unexpected error occurred",
    }


def test_global_exception_handler_sentry(no_raise_client: TestClient) -> None:
    from unittest.mock import patch

    from app.main import settings

    @app.get("/test-error-sentry")
    async def error_route() -> None:
        raise ValueError("Test error")

    with (
        patch.object(settings, "sentry_dsn", "dummy"),
        patch("sentry_sdk.capture_exception") as mock_capture,
    ):
        response = no_raise_client.get("/test-error-sentry")
        assert response.status_code == 500
        mock_capture.assert_called_once()
