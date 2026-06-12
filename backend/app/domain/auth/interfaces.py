"""Auth domain interfaces."""

from __future__ import annotations

from typing import Protocol
from uuid import UUID

from app.domain.auth.entities import Passkey, PasskeyCreate
from app.domain.auth.schemas import JWTPayload


class TokenVerifierProtocol(Protocol):
    """Protocol for JWT verification.

    Implementations of this protocol are responsible for decoding and verifying
    authentication tokens (e.g., extracting claims, verifying signatures, checking expiration).
    """

    async def verify(self, token: str) -> JWTPayload:
        """Verify and decode a JWT.

        Args:
            token (str): The raw JWT string, typically extracted from an Authorization header.

        Returns:
            JWTPayload: The decoded and validated JWT payload containing user claims.

        Raises:
            jwt.InvalidTokenError: If the token is structurally invalid or signature verification fails.
            jwt.ExpiredSignatureError: If the token's expiration time has passed.
            ValueError: If the token format is fundamentally incorrect.
        """
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
