"""Shared API error helpers."""

from __future__ import annotations

from typing import Never

from fastapi import HTTPException


def raise_api_error(
    status_code: int,
    error: str,
    message: str,
    details: dict[str, object] | None = None,
    headers: dict[str, str] | None = None,
) -> Never:
    """Raise a standardized HTTPException payload for API clients.

    Args:
        status_code: HTTP status code to return.
        error: Machine-readable error code.
        message: Human-readable error message for clients.
        details: Optional structured metadata for debugging/UI context.
        headers: Optional response headers (for example, auth challenges).

    Returns:
        Never: This function always raises and never returns.

    Raises:
        HTTPException: Always, with a normalized detail payload.
    """
    detail: dict[str, object] = {"error": error, "message": message}
    if details is not None:
        detail["details"] = details
    raise HTTPException(status_code=status_code, detail=detail, headers=headers)
