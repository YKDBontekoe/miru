"""Authentication dependencies and JWT verification."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from app.api.dependencies import get_auth_service
from app.domain.auth.service import AuthService  # noqa: TCH001
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

# HTTPBearer extracts the Bearer token from the Authorization header.
_bearer = HTTPBearer(auto_error=True)


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(_bearer)],
    auth_service: Annotated[AuthService, Depends(get_auth_service)],
) -> UUID:
    """FastAPI dependency that validates the Bearer token and returns the user UUID."""
    try:
        payload = await auth_service.decode_jwt(credentials.credentials)
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token: {exc}",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc

    # payload is now a JWTPayload model, use attribute access
    return payload.sub


# Convenience type alias for route signatures.
CurrentUser = Annotated[UUID, Depends(get_current_user)]
