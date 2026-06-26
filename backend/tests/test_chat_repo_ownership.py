"""Integration tests for IDOR and ownership enforcement in ChatRepository."""

from datetime import datetime, UTC
from uuid import UUID

import pytest
import pytest_asyncio

from app.infrastructure.database.models.chat_models import ChatMessage, ChatRoom
from app.infrastructure.repositories.chat_repo import ChatRepository

# Deterministic UUIDs
OWNER_ID = UUID("11111111-1111-1111-1111-111111111111")
ATTACKER_ID = UUID("22222222-2222-2222-2222-222222222222")
ROOM_ID_1 = UUID("33333333-3333-3333-3333-333333333333")
ROOM_ID_2 = UUID("44444444-4444-4444-4444-444444444444")
MESSAGE_ID_1 = UUID("55555555-5555-5555-5555-555555555555")
NON_EXISTENT_ID = UUID("66666666-6666-6666-6666-666666666666")


@pytest_asyncio.fixture(autouse=True)
async def cleanup_test_data() -> None:
    """Targeted cleanup of deterministic UUIDs before and after tests."""

    async def _clean() -> None:
        await ChatMessage.filter(id__in=[MESSAGE_ID_1, NON_EXISTENT_ID]).delete()
        await ChatRoom.filter(id__in=[ROOM_ID_1, ROOM_ID_2, NON_EXISTENT_ID]).delete()

    await _clean()
    # Explicitly not using yield value since we just want the cleanup hook
    yield  # type: ignore[misc]
    await _clean()


class TestChatRepositoryOwnership:
    @pytest.mark.asyncio
    async def test_idor_get_room_attacker_can_access_without_user_id(self) -> None:
        # Arrange
        await ChatRoom.create(id=ROOM_ID_1, name="Secret Room", user_id=OWNER_ID)
        repo = ChatRepository()

        # Act
        # IDOR: attacker retrieves room without passing user_id
        result = await repo.get_room(ROOM_ID_1)

        # Assert
        assert result is not None
        assert result.id == ROOM_ID_1
        assert result.user_id == OWNER_ID

    @pytest.mark.asyncio
    async def test_get_room_rejects_attacker_with_user_id(self) -> None:
        # Arrange
        await ChatRoom.create(id=ROOM_ID_1, name="Secret Room", user_id=OWNER_ID)
        repo = ChatRepository()

        # Act
        # Correctly enforcing ownership by passing attacker's user_id
        result = await repo.get_room(ROOM_ID_1, user_id=ATTACKER_ID)

        # Assert
        assert result is None

    @pytest.mark.asyncio
    async def test_idor_update_room_attacker_can_update_without_user_id(self) -> None:
        # Arrange
        await ChatRoom.create(id=ROOM_ID_1, name="Secret Room", user_id=OWNER_ID)
        repo = ChatRepository()

        # Act
        result = await repo.update_room(ROOM_ID_1, name="Hacked Room")

        # Assert
        assert result is not None
        assert result.name == "Hacked Room"
        db_room = await ChatRoom.get(id=ROOM_ID_1)
        assert db_room.name == "Hacked Room"

    @pytest.mark.asyncio
    async def test_idor_delete_room_attacker_can_delete_without_user_id(self) -> None:
        # Arrange
        await ChatRoom.create(id=ROOM_ID_1, name="Secret Room", user_id=OWNER_ID)
        repo = ChatRepository()

        # Act
        result = await repo.delete_room(ROOM_ID_1)

        # Assert
        assert result is True
        db_room = await ChatRoom.get_or_none(id=ROOM_ID_1)
        assert db_room is None

    @pytest.mark.asyncio
    async def test_idor_update_room_summary_no_user_id_enforcement(self) -> None:
        # Arrange
        await ChatRoom.create(id=ROOM_ID_1, name="Secret Room", user_id=OWNER_ID)
        repo = ChatRepository()

        # Act
        # No user_id parameter exists on update_room_summary
        result = await repo.update_room_summary(ROOM_ID_1, "Hacked Summary")

        # Assert
        assert result is True
        db_room = await ChatRoom.get(id=ROOM_ID_1)
        assert db_room.summary == "Hacked Summary"

    @pytest.mark.asyncio
    async def test_idor_update_message_attacker_can_update_without_user_id(self) -> None:
        # Arrange
        await ChatRoom.create(id=ROOM_ID_1, name="Secret Room", user_id=OWNER_ID)
        await ChatMessage.create(
            id=MESSAGE_ID_1,
            room_id=ROOM_ID_1,
            user_id=OWNER_ID,
            content="My secret",
            message_type="user",
        )
        repo = ChatRepository()

        # Act
        result = await repo.update_message(MESSAGE_ID_1, content="Hacked content")

        # Assert
        assert result is not None
        assert result.content == "Hacked content"
        db_message = await ChatMessage.get(id=MESSAGE_ID_1)
        assert db_message.content == "Hacked content"

    @pytest.mark.asyncio
    async def test_idor_soft_delete_message_attacker_can_delete_without_user_id(self) -> None:
        # Arrange
        await ChatRoom.create(id=ROOM_ID_1, name="Secret Room", user_id=OWNER_ID)
        await ChatMessage.create(
            id=MESSAGE_ID_1,
            room_id=ROOM_ID_1,
            user_id=OWNER_ID,
            content="My secret",
            message_type="user",
        )
        repo = ChatRepository()

        # Act
        result = await repo.soft_delete_message(MESSAGE_ID_1)

        # Assert
        assert result is True
        db_message = await ChatMessage.get(id=MESSAGE_ID_1)
        assert db_message.deleted_at is not None

    @pytest.mark.asyncio
    async def test_chaos_non_existent_room_update(self) -> None:
        # Arrange
        repo = ChatRepository()

        # Act
        result = await repo.update_room(NON_EXISTENT_ID, "Nowhere", user_id=ATTACKER_ID)

        # Assert
        assert result is None

    @pytest.mark.asyncio
    async def test_chaos_soft_delete_already_deleted_message(self) -> None:
        # Arrange
        await ChatRoom.create(id=ROOM_ID_1, name="Secret Room", user_id=OWNER_ID)
        await ChatMessage.create(
            id=MESSAGE_ID_1,
            room_id=ROOM_ID_1,
            user_id=OWNER_ID,
            content="My secret",
            message_type="user",
            deleted_at=datetime.now(UTC),
        )
        repo = ChatRepository()

        # Act
        # soft_delete_message filters by deleted_at__isnull=True
        result = await repo.soft_delete_message(MESSAGE_ID_1, user_id=OWNER_ID)

        # Assert
        assert result is False
