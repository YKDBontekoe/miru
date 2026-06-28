"""Authentication dependencies and JWT verification."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import Depends, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.api.dependencies import get_jwt_verifier
from app.api.errors import raise_api_error
from app.domain.auth.interfaces import JWTVerifierProtocol

# HTTPBearer extracts the Bearer token from the Authorization header.
_bearer = HTTPBearer(auto_error=True)


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(_bearer)],
    jwt_verifier: Annotated[JWTVerifierProtocol, Depends(get_jwt_verifier)],
) -> UUID:
    """FastAPI dependency that validates the Bearer token and returns the user UUID."""
    try:
        payload = await jwt_verifier.verify_token(credentials.credentials)
    except Exception:
        raise_api_error(
            status_code=status.HTTP_401_UNAUTHORIZED,
            error="invalid_authentication_token",
            message="Invalid authentication token.",
        )

    # payload is now a JWTPayload model, use attribute access
    return payload.sub


# Convenience type alias for route signatures.
CurrentUser = Annotated[UUID, Depends(get_current_user)]
