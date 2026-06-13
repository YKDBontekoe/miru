"""JWT token verifier implementation for Supabase."""

from __future__ import annotations

import asyncio
import logging

import jwt

from app.core.config import get_settings
from app.domain.auth.schemas import JWTPayload

logger = logging.getLogger(__name__)


class SupabaseJWTVerifier:
    """Supabase JWT token verifier."""

    def __init__(self) -> None:
        self._jwks_client: jwt.PyJWKClient | None = None

    def _get_jwks_client(self) -> jwt.PyJWKClient:
        if self._jwks_client is None:
            settings = get_settings()
            jwks_url = f"{settings.supabase_url}/auth/v1/.well-known/jwks.json"
            self._jwks_client = jwt.PyJWKClient(jwks_url)
        return self._jwks_client

    async def decode_jwt(self, token: str) -> JWTPayload:
        """Decode and verify a Supabase JWT."""
        settings = get_settings()
        try:
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

                # Offload blocking network I/O to a background thread
                signing_key = await asyncio.to_thread(jwks_client.get_signing_key_from_jwt, token)

                payload = jwt.decode(
                    token,
                    signing_key.key,
                    algorithms=["ES256", "RS256"],
                    audience="authenticated",
                )
            return JWTPayload(**payload)
        except Exception as exc:
            logger.warning("JWT validation failed: %s", exc)
            raise
