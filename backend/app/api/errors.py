"""Shared API error helpers."""

from __future__ import annotations

from fastapi import HTTPException


def raise_api_error(
    status_code: int,
    error: str,
    message: str,
    details: dict[str, object] | None = None,
) -> None:
    """Raise an HTTPException with a consistent machine-readable payload."""
    detail: dict[str, object] = {"error": error, "message": message}
    if details:
        detail["details"] = details
    raise HTTPException(status_code=status_code, detail=detail)
