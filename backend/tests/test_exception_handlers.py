"""Tests for the global exception handler."""

from __future__ import annotations

import json
from unittest.mock import MagicMock, patch

import pytest
from fastapi import Request
from fastapi.responses import JSONResponse

from app.api.exception_handlers import global_exception_handler, register_exception_handlers


@pytest.mark.asyncio
async def test_global_exception_handler_http():
    """Test that HTTP exceptions return a 500 JSON response."""
    # Create a mock Request
    mock_request = MagicMock(spec=Request)
    mock_request.scope = {"type": "http"}
    mock_request.method = "GET"
    mock_request.url.path = "/test/path"

    exc = ValueError("Test error")

    # Patch the logger to avoid spamming the console and to verify it was called
    with patch("app.api.exception_handlers.logger") as mock_logger:
        response = await global_exception_handler(mock_request, exc)

    # Verify logger was called
    mock_logger.exception.assert_called_once_with(
        "Unhandled exception during request %s %s", "GET", "/test/path"
    )

    # Verify the response
    assert isinstance(response, JSONResponse)
    assert response is not None
    assert response.status_code == 500

    # fastapi.responses.JSONResponse doesn't have a content property, we have to decode the body
    assert isinstance(response.body, bytes)
    body = json.loads(response.body.decode("utf-8"))
    assert body["error"] == "internal_server_error"
    assert body["message"] == "An unexpected error occurred."


@pytest.mark.asyncio
async def test_global_exception_handler_websocket():
    """Test that WebSocket exceptions are re-raised."""
    # Create a mock Request
    mock_request = MagicMock(spec=Request)
    mock_request.scope = {"type": "websocket"}
    mock_request.url.path = "/test/ws"

    exc = ValueError("Test error")

    # Patch the logger
    with (
        patch("app.api.exception_handlers.logger") as mock_logger,
        pytest.raises(ValueError, match="Test error"),
    ):
        await global_exception_handler(mock_request, exc)

    # Verify logger was called with websocket specific message
    mock_logger.exception.assert_called_once_with(
        "Unhandled exception during websocket %s", "/test/ws"
    )


def test_register_exception_handlers():
    """Test that the handler is registered to the app."""
    mock_app = MagicMock()
    register_exception_handlers(mock_app)

    # We should have called add_exception_handler with Exception and our handler
    mock_app.add_exception_handler.assert_called_once()
    args, _ = mock_app.add_exception_handler.call_args
    assert args[0] is Exception
    # The second arg is cast to Any, so it's harder to check exactly, but we know it's a function
    assert callable(args[1])
