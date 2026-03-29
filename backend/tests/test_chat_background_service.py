"""Tests for ChatBackgroundService."""

import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.domain.chat.background_service import ChatBackgroundService


@pytest.fixture
def background_service() -> ChatBackgroundService:
    agent_repo = AsyncMock()
    memory_repo = AsyncMock()
    agent_service = AsyncMock()
    chat_repo = AsyncMock()
    return ChatBackgroundService(agent_repo, memory_repo, agent_service, chat_repo)


@pytest.mark.asyncio
async def test_update_mood_background_success(background_service: ChatBackgroundService) -> None:
    agent_id = uuid.uuid4()
    recent_context = "User: Hello\nAgent: Hi!"

    await background_service.update_mood_background(agent_id, recent_context)
    background_service.agent_service.update_mood.assert_called_once_with(  # type: ignore
        agent_id, recent_context
    )


@pytest.mark.asyncio
async def test_update_mood_background_exception(background_service: ChatBackgroundService) -> None:
    agent_id = uuid.uuid4()
    recent_context = "User: Hello\nAgent: Hi!"
    background_service.agent_service.update_mood.side_effect = Exception("Failed")  # type: ignore

    # Should not raise
    with patch("app.domain.chat.background_service.logger.warning") as mock_logger:
        await background_service.update_mood_background(agent_id, recent_context)
        mock_logger.assert_called_once()


@pytest.mark.asyncio
async def test_update_affinity_background_success(
    background_service: ChatBackgroundService,
) -> None:
    user_id = uuid.uuid4()
    agent_id = uuid.uuid4()

    await background_service.update_affinity_background(user_id, agent_id)
    background_service.agent_repo.upsert_affinity.assert_called_once_with(user_id, agent_id)  # type: ignore


@pytest.mark.asyncio
async def test_update_affinity_background_exception(
    background_service: ChatBackgroundService,
) -> None:
    user_id = uuid.uuid4()
    agent_id = uuid.uuid4()
    background_service.agent_repo.upsert_affinity.side_effect = Exception("Failed")  # type: ignore

    # Should not raise
    with patch("app.domain.chat.background_service.logger.warning") as mock_logger:
        await background_service.update_affinity_background(user_id, agent_id)
        mock_logger.assert_called_once()


@pytest.mark.asyncio
async def test_store_memories_background_success(background_service: ChatBackgroundService) -> None:
    user_id = uuid.uuid4()
    room_id = uuid.uuid4()
    user_message = "Hello world"
    result_text = "Agent1: How can I help?"

    agent1 = MagicMock()
    agent1.name = "Agent1"
    agent1.id = uuid.uuid4()

    responded_agents = [agent1]
    agent_names = ["Agent1"]

    with (
        patch(
            "app.domain.chat.websocket_broadcaster.ChatWebSocketBroadcaster.parse_transcript"
        ) as mock_parse,
        patch("app.infrastructure.external.openrouter.embed", new_callable=AsyncMock) as mock_embed,
    ):
        mock_parse.return_value = [("Agent1", "How can I help?")]
        mock_embed.return_value = [0.1, 0.2, 0.3]

        await background_service.store_memories_background(
            user_id,
            room_id,
            user_message,
            responded_agents,  # type: ignore
            result_text,
            agent_names,
        )

        # 1 for user message, 1 for agent message
        assert background_service.memory_repo.insert_memory.call_count == 2  # type: ignore
        assert mock_embed.call_count == 2


@pytest.mark.asyncio
async def test_store_memories_background_exception(
    background_service: ChatBackgroundService,
) -> None:
    user_id = uuid.uuid4()
    room_id = uuid.uuid4()

    with (
        patch("app.infrastructure.external.openrouter.embed", new_callable=AsyncMock) as mock_embed,
        patch("app.domain.chat.background_service.logger.warning") as mock_logger,
    ):
        mock_embed.side_effect = Exception("Embed failed")

        # Should not raise
        await background_service.store_memories_background(user_id, room_id, "Hello", [], "", [])

        mock_logger.assert_called_once()


@pytest.mark.asyncio
async def test_update_room_summary_background_skip_small_history(
    background_service: ChatBackgroundService,
) -> None:
    room_id = uuid.uuid4()
    # History too short, should return early
    await background_service.update_room_summary_background(
        room_id, [{"role": "user", "content": "hi"}]
    )
    background_service.chat_repo.get_room.assert_not_called()


@pytest.mark.asyncio
async def test_update_room_summary_background_success(
    background_service: ChatBackgroundService,
) -> None:
    room_id = uuid.uuid4()

    # Needs at least 25 messages
    history = [{"role": "user", "content": "hi"} for _ in range(26)]

    mock_room = MagicMock()
    mock_room.summary = "old summary"
    background_service.chat_repo.get_room = AsyncMock(return_value=mock_room)

    with patch(
        "app.infrastructure.external.openrouter.chat_completion", new_callable=AsyncMock
    ) as mock_chat_completion:
        mock_chat_completion.return_value = "new updated summary"

        await background_service.update_room_summary_background(room_id, history)

        mock_chat_completion.assert_called_once()
        background_service.chat_repo.update_room_summary.assert_called_once_with(
            room_id, "new updated summary"
        )


@pytest.mark.asyncio
async def test_update_room_summary_background_exception(
    background_service: ChatBackgroundService,
) -> None:
    room_id = uuid.uuid4()
    history = [{"role": "user", "content": "hi"} for _ in range(26)]

    mock_room = MagicMock()
    mock_room.summary = "old summary"
    background_service.chat_repo.get_room = AsyncMock(return_value=mock_room)

    with patch(
        "app.infrastructure.external.openrouter.chat_completion", new_callable=AsyncMock
    ) as mock_chat_completion:
        mock_chat_completion.side_effect = Exception("error")

        with patch("app.domain.chat.background_service.logger.warning") as mock_logger:
            await background_service.update_room_summary_background(room_id, history)
            mock_logger.assert_called_once()
