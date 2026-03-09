"""Authentication utilities for Miru.

Provides JWT validation for Supabase-issued tokens and a FastAPI dependency
(``get_current_user``) that enforces authentication on protected routes.

Supabase issues standard JWTs signed with HS256 using the project's JWT secret.
We validate the token locally (no network round-trip) using python-jose.
"""

from __future__ import annotations

import logging
from typing import Annotated, Any
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import ExpiredSignatureError, JWTError, jwt

from app.config import get_settings

logger = logging.getLogger(__name__)

# HTTPBearer extracts the Bearer token from the Authorization header.
_bearer = HTTPBearer(auto_error=True)

# Supabase uses HS256 for its project JWTs.
_ALGORITHM = "HS256"


def decode_supabase_jwt(token: str) -> dict[str, Any]:
    """Decode and verify a Supabase JWT.

    Args:
        token: Raw JWT string (without "Bearer " prefix).

    Returns:
        The decoded payload dict.

    Raises:
        HTTPException 401: If the token is missing, expired, or invalid.
    """
    settings = get_settings()
    try:
        payload: dict[str, Any] = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=[_ALGORITHM],
            # Supabase sets audience to "authenticated" for logged-in users.
            options={"verify_aud": False},
        )
        return payload
    except ExpiredSignatureError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
    except JWTError as exc:
        logger.debug("JWT validation failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(_bearer)],
) -> UUID:
    """FastAPI dependency that validates the Bearer token and returns the user UUID.

    Usage::

        @router.get("/protected")
        async def protected(user_id: Annotated[UUID, Depends(get_current_user)]):
            ...

    Returns:
        The authenticated user's UUID (``sub`` claim from the JWT).

    Raises:
        HTTPException 401: If authentication fails.
    """
    payload = decode_supabase_jwt(credentials.credentials)

    sub = payload.get("sub")
    if not sub:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token missing subject claim",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        return UUID(str(sub))
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid user ID in token",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc


# Convenience type alias for route signatures.
CurrentUser = Annotated[UUID, Depends(get_current_user)]
