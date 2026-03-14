"""Auth repository for Supabase passkey operations."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any, cast

from app.domain.auth.models import PasskeyRecord

if TYPE_CHECKING:
    from uuid import UUID

    from supabase import Client


class AuthRepository:
    def __init__(self, db: Client):
        self.db = db

    async def get_passkeys_by_user(self, user_id: str | UUID) -> list[PasskeyRecord]:
        """Fetch all registered passkeys for a user."""
        response = self.db.table("passkeys").select("*").eq("user_id", str(user_id)).execute()
        data = cast("list[dict[str, Any]]", response.data)
        return [PasskeyRecord(**record) for record in data]

    async def update_sign_count(self, passkey_id: str | UUID, new_count: int) -> None:
        """Update the signature count for a passkey."""
        self.db.table("passkeys").update(
            {
                "sign_count": new_count,
                "last_used_at": "now()",
            }
        ).eq("id", str(passkey_id)).execute()

    async def create_passkey(self, row: dict[str, Any]) -> PasskeyRecord:
        """Insert a new passkey record."""
        response = self.db.table("passkeys").insert(row).execute()
        data = cast("list[dict[str, Any]]", response.data)[0]
        return PasskeyRecord(**data)

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
