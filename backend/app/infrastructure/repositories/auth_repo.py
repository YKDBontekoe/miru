"""Auth repository for Supabase passkey operations."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any, cast

if TYPE_CHECKING:
    from uuid import UUID

    from supabase import Client


class AuthRepository:
    def __init__(self, db: Client):
        self.db = db

    async def get_passkeys_by_user(self, user_id: str | UUID) -> list[dict[str, Any]]:
        """Fetch all registered passkeys for a user."""
        response = (
            self.db.table("passkeys")
            .select("id, credential_id, public_key, sign_count, transports, user_id")
            .eq("user_id", str(user_id))
            .execute()
        )
        return cast("list[dict[str, Any]]", response.data)

    async def update_sign_count(self, passkey_id: str, new_count: int) -> None:
        """Update the signature count for a passkey."""
        self.db.table("passkeys").update(
            {
                "sign_count": new_count,
                "last_used_at": "now()",
            }
        ).eq("id", passkey_id).execute()

    async def create_passkey(self, row: dict[str, Any]) -> dict[str, Any]:
        """Insert a new passkey record."""
        response = self.db.table("passkeys").insert(row).execute()
        return cast("list[dict[str, Any]]", response.data)[0]
