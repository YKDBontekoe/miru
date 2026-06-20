"""Supabase JWT verification implementation."""

from __future__ import annotations

import asyncio
import logging

import jwt

from app.domain.auth.interfaces import TokenVerifierProtocol
from app.domain.auth.schemas import JWTPayload

logger = logging.getLogger(__name__)


class SupabaseJWTVerifier(TokenVerifierProtocol):
    """Verifies Supabase JWTs."""

    def __init__(self, jwks_url: str, secret: str) -> None:
        self._jwks_url = jwks_url
        self._secret = secret
        self._jwks_client: jwt.PyJWKClient | None = None

    def _get_jwks_client(self) -> jwt.PyJWKClient:
        if self._jwks_client is None:
            self._jwks_client = jwt.PyJWKClient(self._jwks_url)
        return self._jwks_client

    async def verify(self, token: str) -> JWTPayload:
        """Decode and verify a Supabase JWT."""
        try:
            try:
                header = jwt.get_unverified_header(token)
            except Exception as header_exc:
                raise jwt.DecodeError("Invalid token format") from header_exc

            alg = header.get("alg")

            if alg == "HS256":
                payload = jwt.decode(
                    token,
                    self._secret,
                    algorithms=["HS256"],
                    audience="authenticated",
                )
            else:
                jwks_client = self._get_jwks_client()
                # Run the blocking network call in a separate thread
                signing_key = await asyncio.to_thread(
                    jwks_client.get_signing_key_from_jwt, token
                )
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
