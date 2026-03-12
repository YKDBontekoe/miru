"""Chat repository for Supabase operations."""

from __future__ import annotations

from typing import TYPE_CHECKING, Any, cast

from app.domain.chat.models import ChatMessageResponse, RoomResponse

if TYPE_CHECKING:
    from uuid import UUID

    from supabase import Client


class ChatRepository:
    def __init__(self, db: Client):
        self.db = db

    async def create_room(self, name: str, user_id: UUID | str) -> RoomResponse:
        """Create a new chat room."""
        response = (
            self.db.table("chat_rooms")
            .insert({"user_id": str(user_id), "name": name})
            .execute()
        )
        data = cast("list[dict[str, Any]]", response.data)[0]
        return RoomResponse(**data)

    async def list_rooms(self, user_id: UUID | str) -> list[RoomResponse]:
        """List all chat rooms for a user."""
        response = self.db.table("chat_rooms").select("*").eq("user_id", str(user_id)).execute()
        return [RoomResponse(**record) for record in cast("list[dict[str, Any]]", response.data)]

    async def update_room(self, room_id: str, name: str, user_id: UUID | str) -> RoomResponse | None:
        """Update a chat room name."""
        response = (
            self.db.table("chat_rooms")
            .update({"name": name})
            .eq("id", room_id)
            .eq("user_id", str(user_id))
            .execute()
        )
        if not response.data:
            return None
        data = cast("list[dict[str, Any]]", response.data)[0]
        return RoomResponse(**data)

    async def add_agent_to_room(self, room_id: str, agent_id: str) -> None:
        """Link an agent to a chat room."""
        self.db.table("chat_room_agents").insert({"room_id": room_id, "agent_id": agent_id}).execute()

    async def get_room_agents_raw(self, room_id: str) -> list[dict[str, Any]]:
        """Fetch raw agent data for agents in a room."""
        response = (
            self.db.table("chat_room_agents").select("agents(*)").eq("room_id", room_id).execute()
        )
        agents_data = []
        for record in cast("list[dict[str, Any]]", response.data):
            if record.get("agents"):
                agents_data.append(record["agents"])
        return agents_data

    async def get_room_messages(self, room_id: str) -> list[ChatMessageResponse]:
        """Fetch all messages in a room."""
        response = (
            self.db.table("chat_messages")
            .select("*")
            .eq("room_id", room_id)
            .order("created_at", desc=False)
            .execute()
        )
        return [ChatMessageResponse(**record) for record in cast("list[dict[str, Any]]", response.data)]

    async def save_message(
        self, room_id: str, content: str, sender_id: str, is_agent: bool
    ) -> ChatMessageResponse:
        """Save a new message to the database."""
        insert_data: dict[str, Any] = {"room_id": room_id, "content": content}
        if is_agent:
            insert_data["agent_id"] = sender_id
        else:
            insert_data["user_id"] = sender_id

        response = self.db.table("chat_messages").insert(insert_data).execute()
        data = cast("list[dict[str, Any]]", response.data)[0]
        return ChatMessageResponse(**data)
