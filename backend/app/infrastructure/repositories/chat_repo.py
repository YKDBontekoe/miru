"""Chat repository using Tortoise ORM."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any
from uuid import UUID

from tortoise import Tortoise
from tortoise.expressions import Q

from app.domain.agents.models import Agent
from app.domain.chat.entities import ChatMessageEntity, ChatRoomAgentEntity, ChatRoomEntity
from app.infrastructure.database.models.chat_models import ChatMessage, ChatRoom, ChatRoomAgent


def _map_room_to_entity(room: ChatRoom) -> ChatRoomEntity:
    return ChatRoomEntity(
        id=room.id,
        user_id=room.user_id,
        name=room.name,
        summary=room.summary,
        created_at=room.created_at,
        updated_at=room.updated_at,
        deleted_at=room.deleted_at,
    )


def _map_message_to_entity(message: ChatMessage) -> ChatMessageEntity:
    return ChatMessageEntity(
        id=message.id,
        room_id=message.room_id,
        content=message.content,
        message_type=message.message_type,
        user_id=message.user_id,
        agent_id=message.agent_id,
        attachments=message.attachments,
        created_at=message.created_at,
        updated_at=message.updated_at,
        deleted_at=message.deleted_at,
    )


class ChatRepository:
    def __init__(self) -> None:
        pass

    async def create_room(self, name: str, user_id: UUID) -> ChatRoomEntity:
        """Create a new chat room."""
        room = await ChatRoom.create(name=name, user_id=user_id)
        return _map_room_to_entity(room)

    async def list_rooms(
        self, user_id: UUID, limit: int | None = None, before_id: UUID | None = None
    ) -> list[ChatRoomEntity]:
        """List chat rooms for a user ordered by recency, with optional cursor pagination."""
        query = ChatRoom.filter(user_id=user_id)
        if before_id is not None:
            anchor = await ChatRoom.get_or_none(id=before_id, user_id=user_id)
            if anchor is None:
                return []
            query = query.filter(
                Q(updated_at__lt=anchor.updated_at)
                | Q(updated_at=anchor.updated_at, id__lt=before_id)
            )
        query = query.order_by("-updated_at", "-id")
        if limit is not None:
            query = query.limit(limit)
        rooms = await query.all()
        return [_map_room_to_entity(room) for room in rooms]

    async def get_room(self, room_id: UUID, user_id: UUID | None = None) -> ChatRoomEntity | None:
        """Fetch a single room. Optionally enforce ownership."""
        filters: dict[str, Any] = {"id": room_id}
        if user_id is not None:
            filters["user_id"] = user_id
        room = await ChatRoom.get_or_none(**filters)
        return _map_room_to_entity(room) if room else None

    async def update_room(
        self, room_id: UUID, name: str, user_id: UUID | None = None
    ) -> ChatRoomEntity | None:
        """Update a room's name. Optionally enforce ownership."""
        filters: dict[str, Any] = {"id": room_id}
        if user_id is not None:
            filters["user_id"] = user_id
        room = await ChatRoom.get_or_none(**filters)
        if room:
            room.name = name
            await room.save()
            return _map_room_to_entity(room)
        return None

    async def delete_room(self, room_id: UUID, user_id: UUID | None = None) -> bool:
        """Delete a room. Optionally enforce ownership."""
        filters: dict[str, Any] = {"id": room_id}
        if user_id is not None:
            filters["user_id"] = user_id
        room = await ChatRoom.get_or_none(**filters)
        if room:
            await room.delete()
            return True
        return False

    async def add_agent_to_room(self, room_id: UUID, agent_id: UUID) -> ChatRoomAgentEntity:
        """Associate an agent with a room."""
        assoc = await ChatRoomAgent.create(room_id=room_id, agent_id=agent_id)
        return ChatRoomAgentEntity(
            room_id=assoc.room_id,
            agent_id=assoc.agent_id,
            created_at=assoc.created_at,
        )

    async def remove_agent_from_room(self, room_id: UUID, agent_id: UUID) -> bool:
        """Remove an agent from a room."""
        deleted_count = await ChatRoomAgent.filter(room_id=room_id, agent_id=agent_id).delete()
        return deleted_count > 0

    async def list_room_agents(self, room_id: UUID) -> list[Agent]:
        """Fetch all agents associated with a room, with integrations prefetched."""
        assocs = await ChatRoomAgent.filter(room_id=room_id).prefetch_related(
            "agent__capabilities", "agent__agent_integrations__integration"
        )
        return [assoc.agent for assoc in assocs]

    async def list_rooms_agents(self, room_ids: list[UUID]) -> dict[UUID, list[Agent]]:
        """Fetch agents for multiple rooms in one query and return a room->agents map."""
        if not room_ids:
            return {}
        assocs = await ChatRoomAgent.filter(room_id__in=room_ids).prefetch_related(
            "agent__capabilities", "agent__agent_integrations__integration"
        )
        grouped: dict[UUID, list[Agent]] = {room_id: [] for room_id in room_ids}
        for assoc in assocs:
            grouped.setdefault(assoc.room_id, []).append(assoc.agent)
        return grouped

    async def get_room_messages(
        self, room_id: UUID, limit: int = 50, before_id: UUID | None = None
    ) -> list[ChatMessageEntity]:
        """Fetch the most recent *limit* non-deleted messages in a room, in ascending order.

        Pass *before_id* as a cursor to page backwards through older messages.
        """
        q = ChatMessage.filter(room_id=room_id, deleted_at__isnull=True)
        if before_id is not None:
            anchor = await ChatMessage.get_or_none(id=before_id, room_id=room_id)
            if anchor:
                q = q.filter(
                    Q(created_at__lt=anchor.created_at)
                    | Q(created_at=anchor.created_at, id__lt=before_id)
                )
        # Fetch descending so LIMIT cuts off the oldest, then reverse for chronological output.
        messages = await q.order_by("-created_at", "-id").limit(limit).all()
        return [_map_message_to_entity(msg) for msg in reversed(messages)]

    async def get_latest_room_message(self, room_id: UUID) -> ChatMessageEntity | None:
        """Fetch the most recent non-deleted message for a room."""
        message = (
            await ChatMessage.filter(room_id=room_id, deleted_at__isnull=True)
            .order_by("-created_at", "-id")
            .first()
        )
        return _map_message_to_entity(message) if message else None

    async def get_latest_messages_for_rooms(
        self, room_ids: list[UUID]
    ) -> dict[UUID, ChatMessageEntity]:
        """Fetch latest non-deleted message per room for a list of room IDs."""
        if not room_ids:
            return {}
        conn = Tortoise.get_connection("default")
        sql = """
            SELECT DISTINCT ON (room_id)
                id,
                room_id,
                content,
                message_type,
                user_id,
                agent_id,
                attachments,
                created_at,
                updated_at,
                deleted_at
            FROM chat_messages
            WHERE deleted_at IS NULL
              AND room_id = ANY($1::uuid[])
            ORDER BY room_id, created_at DESC, id DESC
        """
        rows = await conn.execute_query_dict(sql, [room_ids])
        latest_by_room: dict[UUID, ChatMessageEntity] = {}
        for row in rows:
            message = ChatMessageEntity(
                id=row["id"],
                room_id=row["room_id"],
                content=row["content"],
                message_type=row["message_type"],
                user_id=row["user_id"],
                agent_id=row["agent_id"],
                attachments=row.get("attachments") or [],
                created_at=row["created_at"],
                updated_at=row["updated_at"],
                deleted_at=row["deleted_at"],
            )
            latest_by_room[message.room_id] = message
        return latest_by_room

    async def update_message(
        self, message_id: UUID, content: str, user_id: UUID | None = None
    ) -> ChatMessageEntity | None:
        """Update the content of a non-deleted message.

        When *user_id* is provided the message must belong to that user (i.e. it
        is a user-authored message, not an agent reply).
        """
        filters: dict[str, Any] = {"id": message_id, "deleted_at__isnull": True}
        if user_id is not None:
            filters["user_id"] = user_id
        msg = await ChatMessage.get_or_none(**filters)
        if msg:
            msg.content = content
            await msg.save()
            return _map_message_to_entity(msg)
        return None

    async def soft_delete_message(self, message_id: UUID, user_id: UUID | None = None) -> bool:
        """Soft-delete a message by stamping deleted_at.

        When *user_id* is provided the message must belong to that user.
        """
        filters: dict[str, Any] = {"id": message_id, "deleted_at__isnull": True}
        if user_id is not None:
            filters["user_id"] = user_id
        msg = await ChatMessage.get_or_none(**filters)
        if msg:
            msg.deleted_at = datetime.now(UTC)
            await msg.save()
            return True
        return False

    async def room_belongs_to_user(self, room_id: UUID, user_id: UUID) -> bool:
        """Return True if the room exists and is owned by *user_id*."""
        return await ChatRoom.filter(id=room_id, user_id=user_id).exists()

    async def save_message(self, message: ChatMessageEntity) -> ChatMessageEntity:
        """Save a new message or update an existing one."""
        if message.id:
            # Check if it exists
            msg_model = await ChatMessage.get_or_none(id=message.id)
            if msg_model:
                msg_model.content = message.content
                msg_model.message_type = message.message_type
                msg_model.attachments = message.attachments
                await msg_model.save()
                return _map_message_to_entity(msg_model)

        # Create new
        msg_model = await ChatMessage.create(
            id=message.id,
            room_id=message.room_id,
            user_id=message.user_id,
            agent_id=message.agent_id,
            content=message.content,
            message_type=message.message_type,
            attachments=message.attachments,
        )
        return _map_message_to_entity(msg_model)

    async def touch_room(self, room_id: UUID) -> None:
        """Bump updated_at on a room so recent-chat sorting reflects new messages."""
        room = await ChatRoom.get_or_none(id=room_id)
        if room:
            await room.save()  # auto_now=True on updated_at refreshes the timestamp

    async def update_room_summary(self, room_id: UUID, summary: str) -> bool:
        """Update a room's summary."""
        room = await ChatRoom.get_or_none(id=room_id)
        if not room:
            return False
        room.summary = summary
        await room.save()
        return True
