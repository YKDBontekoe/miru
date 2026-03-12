"""Authentication utilities for Miru.

Provides JWT validation for Supabase-issued tokens and a FastAPI dependency
(``get_current_user``) that enforces authentication on protected routes.
"""

from __future__ import annotations

import logging
from typing import Annotated, Any
from uuid import UUID

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.config import get_settings

logger = logging.getLogger(__name__)

# HTTPBearer extracts the Bearer token from the Authorization header.
_bearer = HTTPBearer(auto_error=True)

# Global JWK Client for asymmetric verification.
_jwks_client: jwt.PyJWKClient | None = None


def get_jwks_client() -> jwt.PyJWKClient:
    """Return the lazy-initialized JWKS client."""
    global _jwks_client
    if _jwks_client is None:
        settings = get_settings()
        jwks_url = f"{settings.supabase_url}/auth/v1/.well-known/jwks.json"
        _jwks_client = jwt.PyJWKClient(jwks_url)
    return _jwks_client


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
        # Get the unverified header to check the algorithm.
        header = jwt.get_unverified_header(token)
        alg = header.get("alg")

        if alg == "HS256":
            # Symmetric verification using secret.
            # Supabase usually provides the JWT secret as a plain string.
            payload = jwt.decode(
                token,
                settings.supabase_jwt_secret,
                algorithms=["HS256"],
                options={"verify_aud": False},
            )
        else:
            # Asymmetric verification using JWKS.
            jwks_client = get_jwks_client()
            signing_key = jwks_client.get_signing_key_from_jwt(token)
            payload = jwt.decode(
                token,
                signing_key.key,
                algorithms=["ES256", "RS256"],
                options={"verify_aud": False},
            )
        return payload

    except jwt.ExpiredSignatureError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
    except (jwt.InvalidTokenError, Exception) as exc:
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
