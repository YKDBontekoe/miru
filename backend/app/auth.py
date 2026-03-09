"""Authentication utilities for Miru.

Provides JWT validation for Supabase-issued tokens and a FastAPI dependency
(``get_current_user``) that enforces authentication on protected routes.

Modern Supabase projects issue standard JWTs signed with ES256 (asymmetric).
We validate the token using the project's JWKS endpoint.
"""

from __future__ import annotations

import base64
import logging
from typing import Annotated, Any, cast
from uuid import UUID

import httpx
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import ExpiredSignatureError, JWTError, jwt

from app.config import get_settings

logger = logging.getLogger(__name__)

# HTTPBearer extracts the Bearer token from the Authorization header.
_bearer = HTTPBearer(auto_error=True)

# Cache for JWKS to avoid fetching on every request.
_jwks_cache: dict[str, dict[str, Any]] = {}


async def get_jwks(supabase_url: str) -> dict[str, Any]:
    """Fetch the JSON Web Key Set from Supabase."""
    if supabase_url in _jwks_cache:
        return _jwks_cache[supabase_url]

    jwks_url = f"{supabase_url}/auth/v1/.well-known/jwks.json"
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(jwks_url)
            response.raise_for_status()
            jwks = cast("dict[str, Any]", response.json())
            _jwks_cache[supabase_url] = jwks
            return jwks
    except Exception as exc:
        logger.error("Failed to fetch JWKS from %s: %s", jwks_url, exc)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not verify authentication tokens",
        ) from exc


async def decode_supabase_jwt(token: str) -> dict[str, Any]:
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
        # First, get the header to see which key/algorithm is used.
        header = jwt.get_unverified_header(token)
        alg = header.get("alg")

        if alg == "HS256":
            # Symmetric verification using secret.
            secret = settings.supabase_jwt_secret
            # Handle potential base64 encoding for legacy secrets.
            try:
                if secret and (len(secret) % 4 == 0) and ("=" in secret or len(secret) > 40):
                    secret_to_use: str | bytes = base64.b64decode(secret)
                else:
                    secret_to_use = secret
            except Exception:
                secret_to_use = secret

            payload = jwt.decode(
                token,
                secret_to_use,
                algorithms=["HS256"],
                options={"verify_aud": False},
            )
        else:
            # Asymmetric verification using JWKS.
            jwks = await get_jwks(settings.supabase_url)
            payload = jwt.decode(
                token,
                jwks,
                algorithms=["ES256", "RS256"],
                options={"verify_aud": False},
            )
        return cast("dict[str, Any]", payload)

    except ExpiredSignatureError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
    except JWTError as exc:
        logger.error("JWT validation failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid authentication token: {exc}",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(_bearer)],
) -> UUID:
    """FastAPI dependency that validates the Bearer token and returns the user UUID."""
    payload = await decode_supabase_jwt(credentials.credentials)

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
