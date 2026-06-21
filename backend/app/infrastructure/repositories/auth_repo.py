"""Auth repository for Supabase passkey operations."""

from __future__ import annotations

from typing import TYPE_CHECKING
from uuid import UUID

from app.domain.auth.entities import Passkey, PasskeyCreate
from app.domain.auth.interfaces import AuthRepositoryProtocol
from app.infrastructure.database.models.auth_models import Passkey as PasskeyModel

if TYPE_CHECKING:
    from supabase import Client


class AuthRepository(AuthRepositoryProtocol):
    def __init__(self, db: Client | None = None):
        self.db = db

    def _map_to_entity(self, record: PasskeyModel) -> Passkey:
        return Passkey(
            id=record.id,
            user_id=record.user_id,
            credential_id=record.credential_id,
            public_key=record.public_key,
            sign_count=record.sign_count,
            device_name=record.device_name,
            transports=record.transports or [],
            last_used_at=record.last_used_at,
            created_at=record.created_at,
        )

    async def get_passkeys_by_user(
        self, user_id: str | UUID, limit: int = 50, cursor: str | None = None
    ) -> tuple[list[Passkey], str | None]:
        """Fetch all registered passkeys for a user with pagination."""
        query = PasskeyModel.filter(user_id=user_id).order_by("-created_at")

        if cursor:
            query = query.filter(created_at__lt=cursor)

        query = query.limit(limit)

        records = await query
        entities = [self._map_to_entity(record) for record in records]

        next_cursor = None
        if len(entities) == limit and entities[-1].created_at:
            next_cursor = entities[-1].created_at.isoformat()

        return entities, next_cursor

    async def update_sign_count(self, passkey_id: str | UUID, new_count: int) -> None:
        """Update the signature count for a passkey."""

        # Update sign_count and set last_used_at
        # Using tortoise ORM directly
        import datetime

        await PasskeyModel.filter(id=passkey_id).update(
            sign_count=new_count, last_used_at=datetime.datetime.now(datetime.UTC)
        )

    async def create_passkey(self, input: PasskeyCreate) -> Passkey:
        """Insert a new passkey record."""
        record = await PasskeyModel.create(
            user_id=input.user_id,
            credential_id=input.credential_id,
            public_key=input.public_key,
            device_name=input.device_name,
            transports=input.transports or [],
        )
        return self._map_to_entity(record)

    async def delete_passkey(self, passkey_id: str | UUID, user_id: str | UUID) -> bool:
        """Delete a passkey belonging to a user."""
        deleted_count = await PasskeyModel.filter(id=passkey_id, user_id=user_id).delete()
        return deleted_count > 0
