"""Auth repository for Supabase passkey operations."""

from __future__ import annotations

import uuid
from datetime import datetime
from typing import TYPE_CHECKING, Any, cast

from app.domain.auth.entities import Passkey, PasskeyCreate
from app.domain.auth.interfaces import AuthRepositoryProtocol

if TYPE_CHECKING:
    from uuid import UUID

    from supabase import Client


class AuthRepository(AuthRepositoryProtocol):
    def __init__(self, db: Client):
        self.db = db

    def _map_to_entity(self, record: dict[str, Any]) -> Passkey:
        last_used = record.get("last_used_at")
        if last_used and isinstance(last_used, str):
            last_used = datetime.fromisoformat(last_used.replace("Z", "+00:00"))

        created = record.get("created_at")
        if created and isinstance(created, str):
            created = datetime.fromisoformat(created.replace("Z", "+00:00"))

        transports = record.get("transports")
        if transports is None:
            transports = []
        elif not isinstance(transports, list):
            transports = list(transports)

        return Passkey(
            id=uuid.UUID(record["id"]) if isinstance(record["id"], str) else record["id"],
            user_id=uuid.UUID(record["user_id"])
            if isinstance(record["user_id"], str)
            else record["user_id"],
            credential_id=record["credential_id"],
            public_key=record["public_key"],
            sign_count=record.get("sign_count", 0),
            device_name=record.get("device_name"),
            transports=transports,
            last_used_at=last_used,
            created_at=created,
        )

    async def get_passkeys_by_user(
        self, user_id: str | UUID, limit: int = 50, cursor: str | None = None
    ) -> tuple[list[Passkey], str | None]:
        """Fetch all registered passkeys for a user with pagination."""
        query = (
            self.db.table("passkeys")
            .select("*")
            .eq("user_id", str(user_id))
            .order("created_at", desc=True)
            .limit(limit)
        )

        if cursor:
            query = query.lt("created_at", cursor)

        response = query.execute()
        data = cast("list[dict[str, Any]]", response.data)

        entities = [self._map_to_entity(record) for record in data]
        next_cursor = None
        if len(entities) == limit and entities[-1].created_at:
            next_cursor = entities[-1].created_at.isoformat()

        return entities, next_cursor

    async def update_sign_count(self, passkey_id: str | UUID, new_count: int) -> None:
        """Update the signature count for a passkey."""
        self.db.table("passkeys").update(
            {
                "sign_count": new_count,
                "last_used_at": "now()",
            }
        ).eq("id", str(passkey_id)).execute()

    async def create_passkey(self, input: PasskeyCreate) -> Passkey:
        """Insert a new passkey record."""
        row = {
            "user_id": str(input.user_id),
            "credential_id": input.credential_id,
            "public_key": input.public_key,
            "device_name": input.device_name,
            "transports": input.transports or [],
        }
        response = self.db.table("passkeys").insert(row).execute()
        if not response.data or len(response.data) == 0:
            raise ValueError(f"Failed to insert passkey. Raw response: {response}")

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
