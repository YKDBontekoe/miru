"""Tests for IDOR vulnerabilities in ChatRepository."""

from __future__ import annotations

import uuid
from collections.abc import AsyncGenerator

import pytest
import pytest_asyncio

from app.infrastructure.database.models.chat_models import ChatRoom
from app.infrastructure.repositories.chat_repo import ChatRepository

# Deterministic UUIDs for testing
OWNER_ID = uuid.UUID("11111111-1111-1111-1111-111111111111")
ATTACKER_ID = uuid.UUID("22222222-2222-2222-2222-222222222222")
ROOM_ID = uuid.UUID("33333333-3333-3333-3333-333333333333")
NON_EXISTENT_ID = uuid.UUID("44444444-4444-4444-4444-444444444444")


@pytest.fixture
def repo() -> ChatRepository:
    return ChatRepository()


@pytest_asyncio.fixture(autouse=True)
async def cleanup_rooms() -> AsyncGenerator[None, None]:
    # Targeted cleanup before and after to prevent IntegrityError due to hardcoded UUIDs
    # and prevent global state pollution
    await ChatRoom.filter(id=ROOM_ID).delete()
    yield
    await ChatRoom.filter(id=ROOM_ID).delete()


@pytest.mark.asyncio
async def test_update_room_fails_for_non_owner(repo: ChatRepository) -> None:
    # Arrange
    await ChatRoom.create(id=ROOM_ID, name="Original Name", user_id=OWNER_ID)

    # Act
    result = await repo.update_room(ROOM_ID, "Hacked Name", user_id=ATTACKER_ID)

    # Assert
    assert result is None
    room = await ChatRoom.get(id=ROOM_ID)
    assert room.name == "Original Name"


@pytest.mark.asyncio
async def test_update_room_succeeds_for_owner(repo: ChatRepository) -> None:
    # Arrange
    await ChatRoom.create(id=ROOM_ID, name="Original Name", user_id=OWNER_ID)

    # Act
    result = await repo.update_room(ROOM_ID, "New Name", user_id=OWNER_ID)

    # Assert
    assert result is not None
    assert result.name == "New Name"
    room = await ChatRoom.get(id=ROOM_ID)
    assert room.name == "New Name"


@pytest.mark.asyncio
async def test_update_room_chaos_non_existent_room(repo: ChatRepository) -> None:
    # Act
    # This checks a malformed or invalid request scenario
    result = await repo.update_room(NON_EXISTENT_ID, "New Name", user_id=OWNER_ID)

    # Assert
    assert result is None


@pytest.mark.asyncio
async def test_delete_room_fails_for_non_owner(repo: ChatRepository) -> None:
    # Arrange
    await ChatRoom.create(id=ROOM_ID, name="Original Name", user_id=OWNER_ID)

    # Act
    result = await repo.delete_room(ROOM_ID, user_id=ATTACKER_ID)

    # Assert
    assert result is False
    room = await ChatRoom.get_or_none(id=ROOM_ID)
    assert room is not None
    assert room.id == ROOM_ID


@pytest.mark.asyncio
async def test_delete_room_succeeds_for_owner(repo: ChatRepository) -> None:
    # Arrange
    await ChatRoom.create(id=ROOM_ID, name="Original Name", user_id=OWNER_ID)

    # Act
    result = await repo.delete_room(ROOM_ID, user_id=OWNER_ID)

    # Assert
    assert result is True
    room = await ChatRoom.get_or_none(id=ROOM_ID)
    assert room is None


@pytest.mark.asyncio
async def test_delete_room_chaos_non_existent_room(repo: ChatRepository) -> None:
    # Act
    # Testing an invalid room ID provides a realistic chaos scenario for boundary logic
    result = await repo.delete_room(NON_EXISTENT_ID, user_id=OWNER_ID)

    # Assert
    assert result is False
