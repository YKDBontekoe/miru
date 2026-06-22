"""Auth domain interfaces."""

from __future__ import annotations

from typing import Protocol
from uuid import UUID

from app.domain.auth.entities import Passkey, PasskeyCreate
from app.domain.auth.schemas import JWTPayload


class TokenVerifierProtocol(Protocol):
    """Protocol for the JWT Token Verifier."""

    async def verify_token(self, token: str) -> JWTPayload:
        """Verify the given token and return its payload."""
        pass


class AuthRepositoryProtocol(Protocol):
    """Protocol for the Auth Repository."""

    async def get_passkeys_by_user(
        self, user_id: str | UUID, limit: int = 50, cursor: str | None = None
    ) -> tuple[list[Passkey], str | None]:
        """Fetch all registered passkeys for a user with pagination."""
        pass

    async def update_sign_count(self, passkey_id: str | UUID, new_count: int) -> None:
        """Update the signature count for a passkey."""
        pass

    async def create_passkey(self, input: PasskeyCreate) -> Passkey:
        """Insert a new passkey record."""
        pass

    async def delete_passkey(self, passkey_id: str | UUID, user_id: str | UUID) -> bool:
        """Delete a passkey belonging to a user."""
        pass
