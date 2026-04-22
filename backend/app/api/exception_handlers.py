"""Global exception handlers for FastAPI to prevent leaking sensitive information."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING

from fastapi.responses import JSONResponse

if TYPE_CHECKING:
    from fastapi import FastAPI, Request

logger = logging.getLogger(__name__)


async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse | None:
    """Handle all unhandled exceptions globally, log traceback, and return safe 500 error."""
    scope_type = request.scope.get("type")
    if scope_type == "websocket":
        logger.exception("Unhandled exception during websocket %s", request.url.path)
        raise exc

    logger.exception("Unhandled exception during request %s %s", request.method, request.url.path)
    return JSONResponse(
        status_code=500,
        content={"error": "internal_server_error", "message": "An unexpected error occurred."},
    )


def register_exception_handlers(app: FastAPI) -> None:
    """Register all exception handlers to the FastAPI app."""
    # We use a cast or ignore type check since Starlette's add_exception_handler is strictly typed
    # for Request vs WebSocket handlers, but a single global handler may be invoked for both
    app.add_exception_handler(Exception, global_exception_handler)  # type: ignore[arg-type]
