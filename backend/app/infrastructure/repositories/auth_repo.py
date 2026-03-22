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

    async def update_consent(
        self, user_id: str | UUID, marketing: bool, data_processing: bool
    ) -> bool:
        from app.domain.auth.models import Profile

        try:
            profile = await Profile.get_or_none(id=user_id)
            if profile:
                profile.marketing_consent = marketing
                profile.data_processing_consent = data_processing
                await profile.save(
                    update_fields=["marketing_consent", "data_processing_consent", "updated_at"]
                )
                return True
            return False
        except Exception as e:
            import logging

            logger = logging.getLogger(__name__)
            logger.error("Failed to update consent for user %s: %s", user_id, e)
            return False

    async def delete_account(self, user_id: str | UUID) -> bool:
        """Completely delete a user and all their data."""
        import logging

        from tortoise.transactions import in_transaction

        from app.domain.agents.models import Agent, AgentActionLog, UserAgentAffinity
        from app.domain.auth.models import Passkey, Profile
        from app.domain.chat.models import ChatMessage, ChatRoom
        from app.domain.memory.models import Memory, MemoryCollection, MemoryGraphNode
        from app.domain.productivity.models import CalendarEvent, Note, Task

        logger = logging.getLogger(__name__)

        try:
            # Note: We must delete from Supabase Auth explicitly.
            # Using the service_role client to delete auth.users
            import asyncio

            if asyncio.iscoroutinefunction(self.db.auth.admin.delete_user):
                await self.db.auth.admin.delete_user(str(user_id))
            else:
                self.db.auth.admin.delete_user(str(user_id))

            # Since many tables have ON DELETE CASCADE to auth.users in Postgres
            # (assuming standard Supabase setup), or we can delete manually via Tortoise.
            # We'll also do Tortoise explicit deletes to ensure application-level cascades
            # and signal triggers run if any exist, but Supabase auth delete is the primary driver.
            async with in_transaction():
                # Delete domain entities explicitly just in case FK cascades are missing
                # from auth.users (though typically they are present, it's safer to ensure it).

                await Passkey.filter(user_id=user_id).delete()
                await Profile.filter(id=user_id).delete()

                await AgentActionLog.filter(user_id=user_id).delete()
                await UserAgentAffinity.filter(user_id=user_id).delete()
                await Agent.filter(user_id=user_id).delete()

                await ChatMessage.filter(user_id=user_id).delete()
                await ChatRoom.filter(user_id=user_id).delete()

                await Memory.filter(user_id=user_id).delete()
                await MemoryCollection.filter(user_id=user_id).delete()
                await MemoryGraphNode.filter(user_id=user_id).delete()

                await Task.filter(user_id=user_id).delete()
                await Note.filter(user_id=user_id).delete()
                await CalendarEvent.filter(user_id=user_id).delete()

            # Empty user's S3 bucket objects if they have any, or relying on
            # supabase storage bucket configuration to delete on auth.user cascade.
            # Standard practice is to list objects in a 'user_id' folder and delete.
            # Let's attempt to delete from the standard 'avatars' or 'attachments' buckets if they exist.
            try:
                # Assuming simple structured paths like `avatars/{user_id}/*`
                # If these buckets don't exist, it will raise an exception, so catch it.
                files = self.db.storage.from_("avatars").list(str(user_id))
                if files:
                    file_names = [f"{user_id}/{f['name']}" for f in files]
                    self.db.storage.from_("avatars").remove(file_names)
            except Exception as e:
                logger.warning("Failed to delete S3 avatars for %s: %s", user_id, e)

            try:
                files = self.db.storage.from_("attachments").list(str(user_id))
                if files:
                    file_names = [f"{user_id}/{f['name']}" for f in files]
                    self.db.storage.from_("attachments").remove(file_names)
            except Exception as e:
                logger.warning("Failed to delete S3 attachments for %s: %s", user_id, e)

            return True
        except Exception as e:
            logger.error("Failed to delete account for user %s: %s", user_id, e)
            return False
