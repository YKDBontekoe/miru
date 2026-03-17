"""Tests for the health endpoint."""

from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from fastapi.testclient import TestClient


def test_health_returns_ok(client: TestClient) -> None:
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_health_content_type(client: TestClient) -> None:
    response = client.get("/health")
    assert "application/json" in response.headers["content-type"]


def test_security_headers_middleware(client: TestClient) -> None:
    response = client.get("/health")
    assert response.headers.get("Content-Security-Policy") == "default-src 'self'"
    assert response.headers.get("X-Content-Type-Options") == "nosniff"
    assert response.headers.get("X-Frame-Options") == "DENY"
    assert (
        response.headers.get("Strict-Transport-Security") == "max-age=31536000; includeSubDomains"
    )

    # Also test an error path
    response_error = client.get("/does-not-exist")
    assert response_error.status_code == 404
    assert response_error.headers.get("Content-Security-Policy") == "default-src 'self'"
    assert response_error.headers.get("X-Content-Type-Options") == "nosniff"
    assert response_error.headers.get("X-Frame-Options") == "DENY"
    assert (
        response_error.headers.get("Strict-Transport-Security")
        == "max-age=31536000; includeSubDomains"
    )
