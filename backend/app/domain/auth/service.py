"""Auth service for business logic and Authlib WebAuthn orchestration."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING
from uuid import UUID

import jwt

from app.core.config import get_settings
from app.domain.auth.entities import Passkey
from app.domain.auth.schemas import JWTPayload

if TYPE_CHECKING:
    from app.domain.auth.interfaces import AuthRepositoryProtocol

logger = logging.getLogger(__name__)


class AuthService:
    def __init__(self, repo: AuthRepositoryProtocol) -> None:
        self.repo = repo
        self._jwks_client: jwt.PyJWKClient | None = None

    async def list_passkeys(
        self, user_id: str | UUID, limit: int = 50, cursor: str | None = None
    ) -> tuple[list[Passkey], str | None]:
        """Fetch a paginated list of passkeys for a user."""
        return await self.repo.get_passkeys_by_user(user_id, limit=limit, cursor=cursor)

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
                signing_key = jwks_client.get_signing_key_from_jwt(token)
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

    # --- WebAuthn / Passkey Logic (Authlib Integration) ---

    async def verify_registration(self, challenge: str, credential_json: str) -> None:
        """Skeleton for Authlib WebAuthn registration verification."""
        # Implementation would use Authlib to validate credential_json
        pass

    async def delete_passkey(self, passkey_id: str | UUID, user_id: str | UUID) -> bool:
        """Delete a passkey belonging to a user."""
        return await self.repo.delete_passkey(passkey_id, user_id)
