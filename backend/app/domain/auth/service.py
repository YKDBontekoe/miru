"""Auth service for business logic and Authlib WebAuthn orchestration."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING

import jwt

from app.core.config import get_settings
from app.domain.auth.models import JWTPayload

if TYPE_CHECKING:
    from app.infrastructure.repositories.auth_repo import AuthRepository

logger = logging.getLogger(__name__)


class AuthService:
    def __init__(self, repo: AuthRepository):
        self.repo = repo
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
            header = jwt.get_unverified_header(token)
            alg = header.get("alg")

            if alg == "HS256":
                payload = jwt.decode(
                    token,
                    settings.supabase_jwt_secret,
                    algorithms=["HS256"],
                    options={"verify_aud": False},
                )
            else:
                jwks_client = self._get_jwks_client()
                signing_key = jwks_client.get_signing_key_from_jwt(token)
                payload = jwt.decode(
                    token,
                    signing_key.key,
                    algorithms=["ES256", "RS256"],
                    options={"verify_aud": False},
                )
            return JWTPayload(**payload)
        except Exception as exc:
            logger.error("JWT validation failed: %s", exc)
            raise

    # --- WebAuthn / Passkey Logic (Authlib Integration) ---

    async def verify_registration(self, challenge: str, credential_json: str) -> None:
        """Skeleton for Authlib WebAuthn registration verification."""
        # Implementation would use Authlib to validate credential_json
        pass
