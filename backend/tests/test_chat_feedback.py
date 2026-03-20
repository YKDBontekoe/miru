from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.api.v1.chat import submit_feedback
from app.domain.chat.models import ChatMessage, ChatRoom, MessageFeedbackRequest
from app.domain.chat.service import ChatService


@pytest.fixture
def mock_chat_repo() -> AsyncMock:
    repo = AsyncMock()
    return repo


@pytest.fixture
def mock_agent_repo() -> AsyncMock:
    repo = AsyncMock()
    return repo


@pytest.fixture
def mock_memory_repo() -> AsyncMock:
    repo = AsyncMock()
    return repo


@pytest.fixture
def chat_service(
    mock_chat_repo: AsyncMock,
    mock_agent_repo: AsyncMock,
    mock_memory_repo: AsyncMock,
) -> ChatService:
    return ChatService(
        chat_repo=mock_chat_repo,
        agent_repo=mock_agent_repo,
        memory_repo=mock_memory_repo,
    )


@pytest.mark.asyncio
async def test_handle_feedback_success(
    chat_service: ChatService, mock_chat_repo: AsyncMock
) -> None:
    user_id = uuid4()
    room_id = uuid4()
    message_id = uuid4()
    agent_id = uuid4()

    mock_room = ChatRoom(id=room_id, user_id=user_id, name="Test")
    mock_chat_repo.get_room.return_value = mock_room

    from datetime import datetime, timezone
    mock_msg = ChatMessage(
        id=message_id,
        room_id=room_id,
        user_id=None,
        agent_id=agent_id,
        content="Hello world",
        created_at=datetime.now(timezone.utc)
    )
    mock_chat_repo.get_message.return_value = mock_msg
    mock_chat_repo.update_message.return_value = mock_msg

    with patch("app.domain.chat.service.asyncio.create_task") as mock_create_task:
        response = await chat_service.handle_feedback(message_id, True, user_id)

        assert response is not None
        assert response.feedback == "positive"
        mock_chat_repo.update_message.assert_awaited_once()
        mock_create_task.assert_called_once()


@pytest.mark.asyncio
async def test_handle_feedback_not_found(
    chat_service: ChatService, mock_chat_repo: AsyncMock
) -> None:
    user_id = uuid4()
    message_id = uuid4()
    mock_chat_repo.get_message.return_value = None

    response = await chat_service.handle_feedback(message_id, True, user_id)
    assert response is None


@pytest.mark.asyncio
async def test_handle_feedback_wrong_user(
    chat_service: ChatService, mock_chat_repo: AsyncMock
) -> None:
    user_id = uuid4()
    other_user_id = uuid4()
    room_id = uuid4()
    message_id = uuid4()

    mock_room = ChatRoom(id=room_id, user_id=other_user_id, name="Test")
    mock_chat_repo.get_room.return_value = mock_room

    mock_msg = ChatMessage(
        id=message_id,
        room_id=room_id,
        content="Hello",
    )
    mock_chat_repo.get_message.return_value = mock_msg

    response = await chat_service.handle_feedback(message_id, True, user_id)
    assert response is None


@pytest.mark.asyncio
async def test_learn_from_feedback_positive() -> None:
    # Need a direct instance to test the private method
    repo = AsyncMock()
    service = ChatService(repo, AsyncMock(), AsyncMock())

    user_id = uuid4()
    agent_id = uuid4()
    message = ChatMessage(content="A useful answer", agent_id=agent_id, room_id=uuid4())

    with patch("app.domain.memory.service.MemoryService.store_memory", new_callable=AsyncMock) as mock_store:
        await service._learn_from_feedback(message, True, user_id)
        mock_store.assert_awaited_once()
        args = mock_store.call_args.kwargs
        assert "found this response helpful" in args["content"]
        assert args["agent_id"] == agent_id


@pytest.mark.asyncio
async def test_learn_from_feedback_negative() -> None:
    repo = AsyncMock()
    service = ChatService(repo, AsyncMock(), AsyncMock())

    user_id = uuid4()
    agent_id = uuid4()
    message = ChatMessage(content="A bad answer", agent_id=agent_id, room_id=uuid4())

    with patch("app.domain.memory.service.MemoryService.store_memory", new_callable=AsyncMock) as mock_store:
        await service._learn_from_feedback(message, False, user_id)
        mock_store.assert_awaited_once()
        args = mock_store.call_args.kwargs
        assert "did not find this response helpful" in args["content"]


@pytest.mark.asyncio
async def test_submit_feedback_route_success() -> None:
    service_mock = AsyncMock()
    service_mock.handle_feedback.return_value = MagicMock()

    req = MessageFeedbackRequest(is_positive=True)
    msg_id = uuid4()
    user_id = uuid4()

    res = await submit_feedback(message_id=msg_id, request=req, user_id=user_id, service=service_mock)
    assert res is not None
    service_mock.handle_feedback.assert_awaited_once_with(msg_id, True, user_id)


@pytest.mark.asyncio
async def test_submit_feedback_route_not_found() -> None:
    service_mock = AsyncMock()
    service_mock.handle_feedback.return_value = None

    req = MessageFeedbackRequest(is_positive=True)
    msg_id = uuid4()

    with pytest.raises(HTTPException) as exc:
        await submit_feedback(message_id=msg_id, request=req, user_id=uuid4(), service=service_mock)
    assert exc.value.status_code == 404


@pytest.mark.asyncio
async def test_stream_responses(chat_service: ChatService, mock_agent_repo: AsyncMock) -> None:
    user_id = uuid4()

    mock_agent = MagicMock()
    mock_agent.name = "A"
    mock_agent.personality = "P"
    mock_agent.description = "D"
    mock_agent.personality = "Helpful AI"
    mock_agent_repo.list_by_user.return_value = [mock_agent]

    with patch("app.domain.chat.service.get_openrouter_client") as mock_get_client:
        mock_llm = MagicMock()

        async def mock_stream():
            yield MagicMock(choices=[MagicMock(delta=MagicMock(content="Hello"))])
            yield MagicMock(choices=[MagicMock(delta=MagicMock(content=" World"))])
            yield MagicMock(choices=[])

        mock_create = AsyncMock()
        mock_create.return_value = mock_stream()
        mock_llm.chat.completions.create = mock_create
        mock_get_client.return_value.openai_client = mock_llm

        chunks = []
        async for chunk in chat_service.stream_responses("Hi", user_id, style_preference="Pirate"):
            chunks.append(chunk)

        assert "Hello" in chunks
        assert " World" in chunks
        assert "[[STATUS:done]]\n" in chunks

        # Verify style_preference was added
        call_args = mock_llm.chat.completions.create.call_args
        assert call_args is not None
        messages = call_args.kwargs["messages"]
        system_msg = next((m["content"] for m in messages if m["role"] == "system"), "")
        assert "Pirate" in system_msg

@pytest.mark.asyncio
async def test_run_crew(chat_service: ChatService, mock_agent_repo: AsyncMock) -> None:
    user_id = uuid4()
    mock_agent = MagicMock(id=uuid4())
    mock_agent.name = "Test"
    mock_agent.personality = "P"
    mock_agent.description = "D"
    mock_agent.agent_integrations = []
    mock_agent.capabilities.related_objects = []
    mock_agent_repo.list_by_user.return_value = [mock_agent]

    with patch("app.domain.chat.service.Crew") as mock_crew:
        mock_instance = AsyncMock()
        mock_instance.kickoff_async.return_value = "Crew result"
        mock_crew.return_value = mock_instance

        res = await chat_service.run_crew("Help me", user_id)
        assert res["result"] == "Crew result"

@pytest.mark.asyncio
async def test_stream_room_responses(chat_service: ChatService, mock_chat_repo: AsyncMock) -> None:
    user_id = uuid4()
    room_id = uuid4()

    mock_agent = MagicMock(id=uuid4())
    mock_agent.name = "Test"
    mock_agent.personality = "P"
    mock_agent.description = "D"
    mock_agent.agent_integrations = []
    mock_agent.capabilities.related_objects = []
    mock_chat_repo.list_room_agents.return_value = [mock_agent]

    with patch("app.domain.chat.service.Crew") as mock_crew, \
         patch("app.domain.chat.service.Task") as mock_task, \
         patch("app.domain.chat.service.asyncio.create_task") as mock_create_task, \
         patch("app.domain.chat.service.asyncio.sleep") as mock_sleep:

        mock_crew_instance = MagicMock()
        mock_crew_instance.kickoff_async = AsyncMock(return_value="Room result")
        mock_crew.return_value = mock_crew_instance

        # Mock background task behaviour for kickoff_async
        bg_task = MagicMock()
        bg_task.done.side_effect = [False, True, True]
        bg_task.result.return_value = "Room result"
        mock_create_task.return_value = bg_task

        chunks = []
        async for chunk in chat_service.stream_room_responses(room_id, "Hi", user_id, style_preference="Pirate"):
            chunks.append(chunk)

        assert "[[STATUS:thinking]]\n" in chunks
        assert "Room result" in chunks
        assert "[[STATUS:done]]\n" in chunks
