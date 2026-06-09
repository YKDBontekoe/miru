"""Auth service for business logic and Authlib WebAuthn orchestration."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING
from uuid import UUID

from app.domain.auth.entities import Passkey
from app.domain.auth.schemas import JWTPayload

if TYPE_CHECKING:
    from app.domain.auth.interfaces import AuthRepositoryProtocol, TokenVerifierProtocol

logger = logging.getLogger(__name__)


class AuthService:
    def __init__(self, repo: "AuthRepositoryProtocol", verifier: "TokenVerifierProtocol") -> None:
        self.repo = repo
        self.verifier = verifier

    async def list_passkeys(
        self, user_id: str | UUID, limit: int = 50, cursor: str | None = None
    ) -> tuple[list[Passkey], str | None]:
        """Fetch a paginated list of passkeys for a user."""
        return await self.repo.get_passkeys_by_user(user_id, limit=limit, cursor=cursor)

    async def decode_jwt(self, token: str) -> JWTPayload:
        """Decode and verify a Supabase JWT using the injected verifier."""
        return await self.verifier.verify_token(token)

    # --- WebAuthn / Passkey Logic (Authlib Integration) ---

    async def verify_registration(self, challenge: str, credential_json: str) -> None:
        """Skeleton for Authlib WebAuthn registration verification."""
        # Implementation would use Authlib to validate credential_json
        pass

    async def delete_passkey(self, passkey_id: str | UUID, user_id: str | UUID) -> bool:
        """Delete a passkey belonging to a user."""
        return await self.repo.delete_passkey(passkey_id, user_id)
