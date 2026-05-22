"""Chat repository using Tortoise ORM."""

from __future__ import annotations

from typing import TYPE_CHECKING
from uuid import UUID

from tortoise.expressions import Q

from app.domain.agents.entities import AgentEntity
from app.domain.chat.entities import ChatMessageEntity, ChatRoomAgentEntity, ChatRoomEntity
from app.infrastructure.database.models.chat_models import ChatMessage, ChatRoom, ChatRoomAgent
from app.infrastructure.repositories.agent_repo import _map_agent_to_entity

if TYPE_CHECKING:
    from app.domain.chat.dtos import ChatMessageCreate


def _map_room_to_entity(room: ChatRoom) -> ChatRoomEntity:
    """Map Tortoise ChatRoom model to ChatRoomEntity."""
    return ChatRoomEntity(
        id=room.id,
        user_id=room.user_id,
        name=room.name,
        created_at=room.created_at,
        updated_at=room.updated_at,
        summary=room.summary,
        deleted_at=room.deleted_at,
    )


def _map_message_to_entity(msg: ChatMessage) -> ChatMessageEntity:
    """Map Tortoise ChatMessage model to ChatMessageEntity."""
    return ChatMessageEntity(
        id=msg.id,
        room_id=msg.room_id,
        content=msg.content,
        message_type=msg.message_type,
        user_id=msg.user_id,
        agent_id=msg.agent_id,
        attachments=msg.attachments or [],
        created_at=msg.created_at,
        updated_at=msg.updated_at,
        deleted_at=msg.deleted_at,
    )


class ChatRepository:
    def __init__(self) -> None:
        pass

    # ---------------------------------------------------------------------------
    # ROOMS
    # ---------------------------------------------------------------------------
    async def create_room(self, name: str, user_id: UUID | str) -> ChatRoomEntity:
        """Create a new chat room."""
        if isinstance(user_id, str):
            user_id = UUID(user_id)
        room = await ChatRoom.create(name=name, user_id=user_id)
        return _map_room_to_entity(room)

    async def list_rooms(self, user_id: UUID | str) -> list[ChatRoomEntity]:
        """List all non-deleted chat rooms for a user."""
        if isinstance(user_id, str):
            user_id = UUID(user_id)
        rooms = await ChatRoom.filter(user_id=user_id, deleted_at__isnull=True).order_by(
            "-updated_at"
        )
        return [_map_room_to_entity(r) for r in rooms]

    async def get_room(self, room_id: UUID | str) -> ChatRoomEntity | None:
        """Get a chat room by ID."""
        if isinstance(room_id, str):
            room_id = UUID(room_id)
        room = await ChatRoom.get_or_none(id=room_id)
        if not room:
            return None
        return _map_room_to_entity(room)

    async def update_room(self, room_id: UUID | str, name: str) -> ChatRoomEntity | None:
        """Update a chat room's name."""
        if isinstance(room_id, str):
            room_id = UUID(room_id)
        room = await ChatRoom.get_or_none(id=room_id)
        if not room:
            return None
        room.name = name
        await room.save()
        return _map_room_to_entity(room)

    async def delete_room(self, room_id: UUID | str, user_id: UUID | str | None = None) -> bool:
        """Soft delete a chat room."""
        if isinstance(room_id, str):
            room_id = UUID(room_id)
        if isinstance(user_id, str):
            user_id = UUID(user_id)
        filters = {"id": room_id, "deleted_at__isnull": True}
        if user_id is not None:
            filters["user_id"] = user_id

        room = await ChatRoom.get_or_none(**filters)
        if not room:
            return False

        from datetime import UTC, datetime

        room.deleted_at = datetime.now(UTC)
        await room.save()
        return True

    # ---------------------------------------------------------------------------
    # AGENT ASSOCIATIONS
    # ---------------------------------------------------------------------------
    async def add_agent_to_room(self, room_id: UUID, agent_id: UUID) -> ChatRoomAgentEntity:
        """Associate an agent with a room."""
        assoc, _created = await ChatRoomAgent.get_or_create(room_id=room_id, agent_id=agent_id)
        return ChatRoomAgentEntity(
            room_id=assoc.room_id,
            agent_id=assoc.agent_id,
            created_at=assoc.created_at,
        )

    async def remove_agent_from_room(self, room_id: UUID, agent_id: UUID) -> bool:
        """Remove an agent from a room."""
        deleted_count = await ChatRoomAgent.filter(room_id=room_id, agent_id=agent_id).delete()
        return deleted_count > 0

    async def list_room_agents(self, room_id: UUID) -> list[AgentEntity]:
        """Fetch all agents associated with a room, with integrations prefetched."""
        assocs = await ChatRoomAgent.filter(room_id=room_id).prefetch_related(
            "agent__capabilities", "agent__agent_integrations__integration"
        )
        entities = []
        for assoc in assocs:
            agent = assoc.agent
            entity = _map_agent_to_entity(agent)
            if hasattr(agent, "capabilities"):
                entity.capability_ids = [cap.pk for cap in agent.capabilities]
            if hasattr(agent, "agent_integrations"):
                entity.integration_ids = [
                    ai.integration_id
                    for ai in agent.agent_integrations
                    if getattr(ai, "enabled", True)
                ]
                entity.integration_configs = {
                    ai.integration_id: getattr(ai, "config", {})
                    for ai in agent.agent_integrations
                    if getattr(ai, "enabled", True) and getattr(ai, "config", {})
                }
            entities.append(entity)
        return entities

    # ---------------------------------------------------------------------------
    # MESSAGES
    # ---------------------------------------------------------------------------
    async def create_message(self, data: ChatMessageCreate) -> ChatMessageEntity:
        """Create a new message in a room."""
        msg = await ChatMessage.create(**data.model_dump())

        # Update room's updated_at timestamp to bubble it to the top of lists
        await ChatRoom.filter(id=msg.room_id).update(updated_at=msg.created_at)

        return _map_message_to_entity(msg)

    async def get_message(self, message_id: UUID | str) -> ChatMessageEntity | None:
        """Get a message by ID."""
        if isinstance(message_id, str):
            message_id = UUID(message_id)
        msg = await ChatMessage.get_or_none(id=message_id)
        if not msg:
            return None
        return _map_message_to_entity(msg)

    async def list_messages(
        self, room_id: UUID | str, limit: int = 50, offset: int = 0
    ) -> list[ChatMessageEntity]:
        """List messages in a room, ordered by creation (oldest first)."""
        if isinstance(room_id, str):
            room_id = UUID(room_id)
        msgs = (
            await ChatMessage.filter(room_id=room_id, deleted_at__isnull=True)
            .order_by("created_at")
            .offset(offset)
            .limit(limit)
        )
        return [_map_message_to_entity(m) for m in msgs]

    async def delete_message(
        self, message_id: UUID | str, user_id: UUID | str | None = None
    ) -> bool:
        """Soft delete a message.

        If user_id is provided, only deletes if the message was sent by the user,
        or if the user owns the room.
        """
        if isinstance(message_id, str):
            message_id = UUID(message_id)
        if isinstance(user_id, str):
            user_id = UUID(user_id)

        msg = await ChatMessage.get_or_none(
            id=message_id, deleted_at__isnull=True
        ).prefetch_related("room")
        if not msg:
            return False

        from datetime import UTC, datetime

        if user_id is not None and msg.user_id != user_id and msg.room.user_id != user_id:
            return False

        msg.deleted_at = datetime.now(UTC)
        await msg.save()
        return True

    async def search_messages(
        self, user_id: UUID | str, query: str, limit: int = 20
    ) -> list[ChatMessageEntity]:
        """Search messages globally for a user."""
        if isinstance(user_id, str):
            user_id = UUID(user_id)

        # Basic ILIKE search, filtering for the user's rooms and non-deleted messages
        msgs = (
            await ChatMessage.filter(
                Q(content__ilike=f"%{query}%")
                & Q(room__user_id=user_id)
                & Q(deleted_at__isnull=True)
                & Q(room__deleted_at__isnull=True)
            )
            .order_by("-created_at")
            .limit(limit)
        )

        return [_map_message_to_entity(m) for m in msgs]
