"""Infrastructure implementation for JWT verification."""

from __future__ import annotations

import asyncio
import logging
from typing import TYPE_CHECKING

import jwt

from app.core.config import get_settings
from app.domain.auth.schemas import JWTPayload

if TYPE_CHECKING:
    from app.core.config import Settings

logger = logging.getLogger(__name__)


class SupabaseJWTVerifier:
    """Verifier for Supabase JWTs, using PyJWKClient to fetch keys."""

    def __init__(self) -> None:
        self._jwks_client: jwt.PyJWKClient | None = None

    def _get_jwks_client(self) -> jwt.PyJWKClient:
        if self._jwks_client is None:
            settings = get_settings()
            jwks_url = f"{settings.supabase_url}/auth/v1/.well-known/jwks.json"
            self._jwks_client = jwt.PyJWKClient(jwks_url)
        return self._jwks_client

    def _decode_sync(self, token: str, settings: Settings) -> JWTPayload:
        """Synchronous decoding helper."""
        try:
            header = jwt.get_unverified_header(token)
        except Exception as header_exc:
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

    async def verify_token(self, token: str) -> JWTPayload:
        """Decode and verify a Supabase JWT off the main event loop."""
        settings = get_settings()
        loop = asyncio.get_running_loop()
        try:
            return await loop.run_in_executor(None, self._decode_sync, token, settings)
        except (
            jwt.ExpiredSignatureError,
            jwt.DecodeError,
            jwt.InvalidTokenError,
            jwt.PyJWKClientError,
        ) as exc:
            logger.warning("JWT validation failed: %s", exc)
            raise ValueError(f"Invalid token: {exc}") from exc
        except Exception:
            logger.exception("Unexpected error during JWT validation")
            raise
