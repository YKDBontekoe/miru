"""Auth repository for Supabase passkey operations."""

from __future__ import annotations

from datetime import datetime
from typing import TYPE_CHECKING, Any, cast

from app.domain.auth.entities import Passkey
from app.domain.auth.interfaces import AuthRepositoryProtocol

if TYPE_CHECKING:
    from uuid import UUID

    from supabase import Client


class AuthRepository(AuthRepositoryProtocol):
    def __init__(self, db: Client):
        self.db = db

    def _map_to_entity(self, record: dict[str, Any]) -> Passkey:
        return Passkey(
            id=record["id"],
            user_id=record["user_id"],
            credential_id=record["credential_id"],
            public_key=record["public_key"],
            sign_count=record.get("sign_count", 0),
            device_name=record.get("device_name"),
            transports=record.get("transports", []),
            last_used_at=datetime.fromisoformat(record["last_used_at"])
            if record.get("last_used_at")
            else None,
            created_at=datetime.fromisoformat(record["created_at"])
            if record.get("created_at")
            else None,
        )

    async def get_passkeys_by_user(self, user_id: str | UUID) -> list[Passkey]:
        """Fetch all registered passkeys for a user."""
        response = self.db.table("passkeys").select("*").eq("user_id", str(user_id)).execute()
        data = cast("list[dict[str, Any]]", response.data)
        return [self._map_to_entity(record) for record in data]

    async def update_sign_count(self, passkey_id: str | UUID, new_count: int) -> None:
        """Update the signature count for a passkey."""
        self.db.table("passkeys").update(
            {
                "sign_count": new_count,
                "last_used_at": "now()",
            }
        ).eq("id", str(passkey_id)).execute()

    async def create_passkey(self, row: dict[str, Any]) -> Passkey:
        """Insert a new passkey record."""
        response = self.db.table("passkeys").insert(row).execute()
        data = cast("list[dict[str, Any]]", response.data)[0]
        return self._map_to_entity(data)

    async def delete_passkey(self, passkey_id: str | UUID, user_id: str | UUID) -> bool:
        """Delete a passkey belonging to a user."""
        response = (
            self.db.table("passkeys")
            .delete()
            .eq("id", str(passkey_id))
            .eq("user_id", str(user_id))
            .execute()
        )
        return len(response.data) > 0
