"""Infrastructure implementation of the TokenVerifierProtocol."""

from __future__ import annotations

import asyncio
import logging

import jwt

from app.core.config import get_settings
from app.domain.auth.interfaces import TokenVerifierProtocol
from app.domain.auth.schemas import JWTPayload

logger = logging.getLogger(__name__)


class SupabaseJWTVerifier(TokenVerifierProtocol):
    """Verifies JWTs issued by Supabase using cached JWKS."""

    def __init__(self) -> None:
        self._jwks_client: jwt.PyJWKClient | None = None

    def _get_jwks_client(self) -> jwt.PyJWKClient:
        if self._jwks_client is None:
            settings = get_settings()
            jwks_url = f"{settings.supabase_url}/auth/v1/.well-known/jwks.json"
            self._jwks_client = jwt.PyJWKClient(jwks_url)
        return self._jwks_client

    async def verify_token(self, token: str) -> JWTPayload:
        """Decode and verify a Supabase JWT without blocking the event loop."""
        settings = get_settings()
        try:
            try:
                # CPU-bound or fast, ok to run synchronously if tiny, but better to wrap decoding.
                header = jwt.get_unverified_header(token)
            except Exception as header_exc:
                raise jwt.DecodeError("Invalid token format") from header_exc

            alg = header.get("alg")

            if alg == "HS256":
                # CPU bound
                payload = await asyncio.to_thread(
                    jwt.decode,
                    token,
                    settings.supabase_jwt_secret,
                    algorithms=["HS256"],
                    audience="authenticated",
                )
            else:
                jwks_client = self._get_jwks_client()
                # I/O bound on first fetch, CPU bound on subsequent
                signing_key = await asyncio.to_thread(
                    jwks_client.get_signing_key_from_jwt,
                    token,
                )
                payload = await asyncio.to_thread(
                    jwt.decode,
                    token,
                    signing_key.key,
                    algorithms=["ES256", "RS256"],
                    audience="authenticated",
                )
            return JWTPayload(**payload)
        except Exception as exc:
            logger.warning("JWT validation failed: %s", exc)
            raise
