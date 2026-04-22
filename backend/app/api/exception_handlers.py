"""Global exception handlers for FastAPI to prevent leaking sensitive information."""

import logging

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)


async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle all unhandled exceptions globally, log traceback, and return safe 500 error."""
    logger.exception(f"Unhandled exception during request {request.method} {request.url.path}")
    return JSONResponse(
        status_code=500,
        content={"error": "internal_server_error", "message": "An unexpected error occurred."},
    )


def register_exception_handlers(app: FastAPI) -> None:
    """Register all exception handlers to the FastAPI app."""
    app.add_exception_handler(Exception, global_exception_handler)
