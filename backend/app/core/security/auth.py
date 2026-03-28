"""Authentication dependencies and JWT verification."""

from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.api.dependencies import get_auth_service
from app.domain.auth.service import AuthService  # noqa: TCH001

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
    user_id = payload.sub

    # For Supabase RLS policies to work with raw Tortoise connections in CI,
    # we set the session variable that our auth.uid() mock expects.
    # Only execute if using PostgreSQL (asyncpg), as SQLite/other providers don't support SET LOCAL.
    # We check for AsyncpgDBClient explicitly to avoid issues with mocks or SQLite.
    from tortoise import Tortoise
    from tortoise.backends.asyncpg.client import AsyncpgDBClient

    conn = Tortoise.get_connection("default")
    if isinstance(conn, AsyncpgDBClient) and conn.in_transaction:
        await conn.execute_script(f"SET LOCAL \"request.jwt.claim.sub\" = '{user_id}';")

    return user_id


# Convenience type alias for route signatures.
CurrentUser = Annotated[UUID, Depends(get_current_user)]
