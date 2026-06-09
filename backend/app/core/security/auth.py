"""Authentication dependencies and JWT verification."""

from __future__ import annotations

import logging
from typing import Annotated
from uuid import UUID

import jwt
from fastapi import Depends, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.api.dependencies import get_token_verifier
from app.api.errors import raise_api_error
from app.core.config import get_settings
from app.domain.auth.interfaces import TokenVerifierProtocol
from app.domain.auth.schemas import JWTPayload

logger = logging.getLogger(__name__)

# HTTPBearer extracts the Bearer token from the Authorization header.
_bearer = HTTPBearer(auto_error=True)


class SupabaseJWTVerifier:
    def __init__(self, jwks_client: jwt.PyJWKClient | None = None) -> None:
        self._jwks_client = jwks_client

    def _get_jwks_client(self) -> jwt.PyJWKClient:
        if self._jwks_client is None:
            settings = get_settings()
            jwks_url = f"{settings.supabase_url}/auth/v1/.well-known/jwks.json"
            self._jwks_client = jwt.PyJWKClient(jwks_url)
        return self._jwks_client

    async def verify_token(self, token: str) -> JWTPayload:
        """Decode and verify a Supabase JWT."""
        settings = get_settings()
        try:
            try:
                header = jwt.get_unverified_header(token)
            except jwt.DecodeError as header_exc:
                raise jwt.DecodeError("Invalid token format") from header_exc

            alg = header.get("alg")

            if alg == "HS256":
                payload = jwt.decode(
                    token,
                    settings.supabase_jwt_secret,
                    algorithms=["HS256"],
                    audience="authenticated",
                )
            else:
                jwks_client = self._get_jwks_client()
                signing_key = jwks_client.get_signing_key_from_jwt(token)
                payload = jwt.decode(
                    token,
                    signing_key.key,
                    algorithms=["ES256", "RS256"],
                    audience="authenticated",
                )
            return JWTPayload(**payload)
        except (
            jwt.ExpiredSignatureError,
            jwt.DecodeError,
            jwt.InvalidTokenError,
            jwt.PyJWKClientError,
        ) as exc:
            logger.warning("JWT validation failed: %s", exc)
            raise


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(_bearer)],
    token_verifier: Annotated[TokenVerifierProtocol, Depends(get_token_verifier)],
) -> UUID:
    """FastAPI dependency that validates the Bearer token and returns the user UUID."""
    try:
        payload = await token_verifier.verify_token(credentials.credentials)
    except jwt.PyJWTError:
        raise_api_error(
            status_code=status.HTTP_401_UNAUTHORIZED,
            error="invalid_authentication_token",
            message="Invalid authentication token.",
        )
    except Exception:
        logger.exception("Unexpected error during token verification")
        raise_api_error(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            error="internal_server_error",
            message="An unexpected error occurred during authentication.",
        )

    # payload is now a JWTPayload model, use attribute access
    return payload.sub


# Convenience type alias for route signatures.
CurrentUser = Annotated[UUID, Depends(get_current_user)]
