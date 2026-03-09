"""Authentication utilities for Miru.

Provides JWT validation for Supabase-issued tokens and a FastAPI dependency
(``get_current_user``) that enforces authentication on protected routes.

Supabase issues standard JWTs signed with HS256 using the project's JWT secret.
We validate the token locally (no network round-trip) using python-jose.
"""

from __future__ import annotations

import base64
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
    secret = settings.supabase_jwt_secret

    # Supabase JWT secrets are often base64 encoded.
    # If the secret looks like base64, decode it.
    try:
        if secret and (len(secret) % 4 == 0) and ("=" in secret or len(secret) > 40):
            decoded_secret = base64.b64decode(secret)
            # Only use if it actually looks like valid bytes
            secret_to_use = decoded_secret
        else:
            secret_to_use = secret
    except Exception:
        secret_to_use = secret

    try:
        payload: dict[str, Any] = jwt.decode(
            token,
            secret_to_use,
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
        print(f"CRITICAL JWT FAILURE: {exc} | Secret length: {len(secret)}")
        logger.error("JWT validation failed: %s (Secret length: %d)", exc, len(secret))
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token: {exc}",
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
