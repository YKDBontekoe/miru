"""Auth domain interfaces."""

from __future__ import annotations

from typing import Any, Protocol
from uuid import UUID

from app.domain.auth.entities import Passkey


class AuthRepositoryProtocol(Protocol):
    """Protocol for the Auth Repository."""

    async def get_passkeys_by_user(self, user_id: str | UUID) -> list[Passkey]:
        """Fetch all registered passkeys for a user."""
        ...

    async def update_sign_count(self, passkey_id: str | UUID, new_count: int) -> None:
        """Update the signature count for a passkey."""
        ...

    async def create_passkey(self, row: dict[str, Any]) -> Passkey:
        """Insert a new passkey record."""
        ...

    async def delete_passkey(self, passkey_id: str | UUID, user_id: str | UUID) -> bool:
        """Delete a passkey belonging to a user."""
        ...
