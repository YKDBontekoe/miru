"""Tests for repository classes and infrastructure modules."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest

from app.domain.auth.schemas import PasskeyRecord
from app.domain.chat.entities import ChatMessageEntity
from app.domain.memory.models import Memory
from app.infrastructure.repositories.agent_repo import AgentRepository
from app.infrastructure.repositories.auth_repo import AuthRepository
from app.infrastructure.repositories.chat_repo import ChatRepository
from app.infrastructure.repositories.memory_repo import MemoryRepository

# ---------------------------------------------------------------------------
# AgentRepository
# ---------------------------------------------------------------------------


class TestAgentRepository:
    @pytest.mark.asyncio
    async def test_list_capabilities_returns_list(self) -> None:
        repo = AgentRepository()
        result = await repo.list_capabilities()
        assert isinstance(result, list)

    @pytest.mark.asyncio
    async def test_list_integrations_returns_list(self) -> None:
        repo = AgentRepository()
        result = await repo.list_integrations()
        assert isinstance(result, list)

    @pytest.mark.asyncio
    async def test_get_by_id_returns_none_for_unknown(self) -> None:
        repo = AgentRepository()
        result = await repo.get_by_id(uuid4())
        assert result is None

    @pytest.mark.asyncio
    async def test_get_by_id_accepts_str(self) -> None:
        repo = AgentRepository()
        result = await repo.get_by_id(str(uuid4()))
        assert result is None

    @pytest.mark.asyncio
    async def test_list_by_user_returns_empty_for_unknown(self) -> None:
        repo = AgentRepository()
        result = await repo.list_by_user(uuid4())
        assert result == []

    @pytest.mark.asyncio
    async def test_list_by_user_accepts_str(self) -> None:
        repo = AgentRepository()
        result = await repo.list_by_user(str(uuid4()))
        assert result == []

    @pytest.mark.asyncio
    async def test_create_returns_agent(self) -> None:
        repo = AgentRepository()
        user_id = uuid4()
        created = await repo.create_agent(
            user_id=user_id, name="Test", personality="Friendly", system_prompt="Hi"
        )
        assert created.name == "Test"
        assert created.id is not None

    @pytest.mark.asyncio
    async def test_update_mood_noop_for_unknown(self) -> None:
        repo = AgentRepository()
        # Should not raise even if agent doesn't exist
        await repo.update_mood(uuid4(), "happy")

    @pytest.mark.asyncio
    async def test_increment_message_count_noop_for_unknown(self) -> None:
        repo = AgentRepository()
        await repo.increment_message_count(uuid4())


# ---------------------------------------------------------------------------
# ChatRepository
# ---------------------------------------------------------------------------


class TestChatRepository:
    @pytest.mark.asyncio
    async def test_create_and_list_room(self) -> None:
        repo = ChatRepository()
        user_id = uuid4()
        room = await repo.create_room("My Room", user_id)
        assert room.name == "My Room"

        rooms = await repo.list_rooms(user_id)
        assert any(r.id == room.id for r in rooms)

    @pytest.mark.asyncio
    async def test_get_room_returns_none_for_unknown(self) -> None:
        repo = ChatRepository()
        result = await repo.get_room(uuid4())
        assert result is None

    @pytest.mark.asyncio
    async def test_update_room_returns_none_for_unknown(self) -> None:
        repo = ChatRepository()
        result = await repo.update_room(uuid4(), "New Name")
        assert result is None

    @pytest.mark.asyncio
    async def test_delete_room_returns_false_for_unknown(self) -> None:
        repo = ChatRepository()
        result = await repo.delete_room(uuid4())
        assert result is False

    @pytest.mark.asyncio
    async def test_create_and_delete_room(self) -> None:
        repo = ChatRepository()
        user_id = uuid4()
        room = await repo.create_room("Delete Me", user_id)
        result = await repo.delete_room(room.id)
        assert result is True

    @pytest.mark.asyncio
    async def test_update_room_name(self) -> None:
        repo = ChatRepository()
        user_id = uuid4()
        room = await repo.create_room("Old Name", user_id)
        updated = await repo.update_room(room.id, "New Name")
        assert updated is not None
        assert updated.name == "New Name"

    @pytest.mark.asyncio
    async def test_get_room_messages_empty(self) -> None:
        repo = ChatRepository()
        user_id = uuid4()
        room = await repo.create_room("Msg Room", user_id)
        messages = await repo.get_room_messages(room.id)
        assert messages == []

    @pytest.mark.asyncio
    async def test_save_message(self) -> None:
        import uuid

        repo = ChatRepository()
        user_id = uuid4()
        room = await repo.create_room("Save Msg", user_id)
        msg = ChatMessageEntity(id=uuid.uuid4(), room_id=room.id, user_id=user_id, content="Hello")
        saved = await repo.save_message(msg)
        assert saved.content == "Hello"
        assert saved.id == msg.id

    @pytest.mark.asyncio
    async def test_list_room_agents_empty(self) -> None:
        repo = ChatRepository()
        user_id = uuid4()
        room = await repo.create_room("Agent Room", user_id)
        agents = await repo.list_room_agents(room.id)
        assert agents == []

    @pytest.mark.asyncio
    async def test_touch_room_updates_timestamp(self) -> None:
        repo = ChatRepository()
        user_id = uuid4()
        room = await repo.create_room("Touch Room", user_id)
        original_updated_at = room.updated_at
        await repo.touch_room(room.id)
        refreshed = await repo.get_room(room.id)
        assert refreshed is not None
        assert refreshed.updated_at >= original_updated_at

    @pytest.mark.asyncio
    async def test_touch_room_noop_for_unknown(self) -> None:
        repo = ChatRepository()
        # Should not raise even if the room doesn't exist
        await repo.touch_room(uuid4())


# ---------------------------------------------------------------------------
# MemoryRepository
# ---------------------------------------------------------------------------


class TestMemoryRepository:
    @pytest.mark.asyncio
    async def test_insert_and_list_memory(self) -> None:
        repo = MemoryRepository()
        user_id = uuid4()
        memory = Memory(content="Test fact", user_id=user_id, embedding=[0.1, 0.2])
        await repo.insert_memory(memory)

        memories = await repo.list_all_memories(user_id)
        assert any(m.content == "Test fact" for m in memories)

    @pytest.mark.asyncio
    async def test_list_memories_empty_for_unknown_user(self) -> None:
        repo = MemoryRepository()
        result = await repo.list_all_memories(uuid4())
        assert result == []

    @pytest.mark.asyncio
    async def test_delete_memory_returns_true(self) -> None:
        repo = MemoryRepository()
        user_id = uuid4()
        memory = Memory(content="To delete", user_id=user_id, embedding=[0.0])
        await repo.insert_memory(memory)
        result = await repo.delete_memory(memory.id)
        assert result is True

    @pytest.mark.asyncio
    async def test_delete_memory_returns_false_for_unknown(self) -> None:
        repo = MemoryRepository()
        result = await repo.delete_memory(uuid4())
        assert result is False

    @pytest.mark.asyncio
    async def test_create_relationship(self) -> None:
        repo = MemoryRepository()
        user_id = uuid4()
        m1 = Memory(content="Fact A", user_id=user_id, embedding=[0.1])
        m2 = Memory(content="Fact B", user_id=user_id, embedding=[0.2])
        await repo.insert_memory(m1)
        await repo.insert_memory(m2)

        rel = await repo.create_relationship(m1.id, m2.id, "RELATED_TO")
        assert rel is not None

    @pytest.mark.asyncio
    async def test_find_related_no_relationships(self) -> None:
        repo = MemoryRepository()
        user_id = uuid4()
        memory = Memory(content="Isolated", user_id=user_id, embedding=[0.5])
        await repo.insert_memory(memory)

        related = await repo.find_related(memory.id)
        assert related == []

    @pytest.mark.asyncio
    async def test_find_related_returns_linked_memories(self) -> None:
        repo = MemoryRepository()
        user_id = uuid4()
        m1 = Memory(content="Source", user_id=user_id, embedding=[0.1])
        m2 = Memory(content="Target", user_id=user_id, embedding=[0.2])
        await repo.insert_memory(m1)
        await repo.insert_memory(m2)
        await repo.create_relationship(m1.id, m2.id)

        related = await repo.find_related(m1.id)
        assert any(m.content == "Target" for m in related)

    @pytest.mark.asyncio
    async def test_find_related_with_rel_type_filter(self) -> None:
        repo = MemoryRepository()
        user_id = uuid4()
        m1 = Memory(content="Alpha", user_id=user_id, embedding=[0.1])
        m2 = Memory(content="Beta", user_id=user_id, embedding=[0.2])
        await repo.insert_memory(m1)
        await repo.insert_memory(m2)
        await repo.create_relationship(m1.id, m2.id, "SIMILAR_TO")

        related = await repo.find_related(m1.id, rel_type="SIMILAR_TO")
        assert any(m.content == "Beta" for m in related)

        # Wrong type should return empty
        related_wrong = await repo.find_related(m1.id, rel_type="RELATED_TO")
        assert related_wrong == []

    @pytest.mark.asyncio
    async def test_get_relationships_subgraph_empty(self) -> None:
        repo = MemoryRepository()
        result = await repo.get_relationships_subgraph([uuid4(), uuid4()])
        assert result == []

    @pytest.mark.asyncio
    async def test_match_memories_delegates_to_raw_sql(self) -> None:
        """match_memories uses raw SQL — mock the connection to verify call."""
        repo = MemoryRepository()
        mock_conn = AsyncMock()
        mock_conn.execute_query_dict = AsyncMock(return_value=[])
        uid = uuid4()
        aid = uuid4()
        rid = uuid4()
        with patch("app.infrastructure.repositories.memory_repo.Tortoise") as mock_tortoise:
            mock_tortoise.get_connection.return_value = mock_conn
            result = await repo.match_memories([0.1, 0.2], 0.5, 5, uid, aid, rid)
        assert result == []
        mock_conn.execute_query_dict.assert_awaited_once()
        call_args = mock_conn.execute_query_dict.call_args
        sql_query = call_args[0][0]
        params = call_args[0][1]

        # Verify the explicit casts are in the SQL string
        assert "$4::uuid" in sql_query
        assert "$5::uuid" in sql_query
        assert "$6::uuid" in sql_query

        # Verify parameters are passed as strings, not UUID objects
        assert params[3] == str(uid)
        assert params[4] == str(aid)
        assert params[5] == str(rid)

    @pytest.mark.asyncio
    async def test_search_fulltext_delegates_to_raw_sql(self) -> None:
        repo = MemoryRepository()
        mock_conn = AsyncMock()
        mock_conn.execute_query_dict = AsyncMock(return_value=[])
        with patch("app.infrastructure.repositories.memory_repo.Tortoise") as mock_tortoise:
            mock_tortoise.get_connection.return_value = mock_conn
            result = await repo.search_fulltext("hello world")
        assert result == []
        mock_conn.execute_query_dict.assert_awaited_once()


# ---------------------------------------------------------------------------
# AuthRepository
# ---------------------------------------------------------------------------


class TestAuthRepository:
    def _make_db(self, data: list[dict] | None = None) -> MagicMock:
        """Return a mock Supabase client."""
        db = MagicMock()
        resp = MagicMock()
        resp.data = data or []
        db.table.return_value.select.return_value.eq.return_value.execute.return_value = resp
        db.table.return_value.update.return_value.eq.return_value.execute.return_value = resp
        db.table.return_value.insert.return_value.execute.return_value = MagicMock(
            data=[
                {
                    "id": str(uuid4()),
                    "user_id": str(uuid4()),
                    "credential_id": "cred123",
                    "public_key": "pubkey",
                    "sign_count": 0,
                    "created_at": "2024-01-01T00:00:00",
                    "last_used_at": None,
                }
            ]
        )
        return db

    @pytest.mark.asyncio
    async def test_get_passkeys_by_user_empty(self) -> None:
        db = self._make_db(data=[])
        repo = AuthRepository(db)
        result = await repo.get_passkeys_by_user(str(uuid4()))
        assert result == []

    @pytest.mark.asyncio
    async def test_get_passkeys_by_user_returns_records(self) -> None:
        uid = str(uuid4())
        row = {
            "id": str(uuid4()),
            "user_id": uid,
            "credential_id": "cred123",
            "public_key": "pubkey",
            "sign_count": 0,
            "created_at": "2024-01-01T00:00:00",
            "last_used_at": None,
        }
        db = self._make_db(data=[row])
        repo = AuthRepository(db)
        result = await repo.get_passkeys_by_user(uid)
        assert len(result) == 1
        assert isinstance(result[0], PasskeyRecord)

    @pytest.mark.asyncio
    async def test_update_sign_count_calls_db(self) -> None:
        db = self._make_db()
        repo = AuthRepository(db)
        await repo.update_sign_count(str(uuid4()), 5)
        db.table.assert_called_with("passkeys")

    @pytest.mark.asyncio
    async def test_create_passkey_returns_record(self) -> None:
        db = self._make_db()
        repo = AuthRepository(db)
        row = {
            "user_id": str(uuid4()),
            "credential_id": "cred123",
            "public_key": "pubkey",
            "sign_count": 0,
        }
        result = await repo.create_passkey(row)
        assert isinstance(result, PasskeyRecord)
