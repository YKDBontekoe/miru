from __future__ import annotations

import typing
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import openai
import pytest
from tortoise.exceptions import BaseORMException

from app.domain.chat.service import ChatService


@pytest.mark.asyncio
async def test_stream_responses_timeout_error(chat_service: typing.Any) -> None:
    user_id = uuid4()
    agent = MagicMock()
    agent.personality = "Helpful"
    chat_service.agent_repo.list_by_user.return_value = [agent]
    with patch("app.domain.chat.service.stream_chat", new_callable=AsyncMock) as mock_stream_chat:
        mock_stream_chat.side_effect = TimeoutError("Connection timed out")
        responses = []
        async for r in chat_service.stream_responses("Hi", user_id):
            responses.append(r)
    assert responses == ["\n[[STATUS:error]]\nConnection timed out. Please try again later.\n"]


@pytest.mark.asyncio
async def test_stream_responses_api_connection_error(chat_service: typing.Any) -> None:
    import httpx
    import openai

    user_id = uuid4()
    agent = MagicMock()
    agent.personality = "Helpful"
    chat_service.agent_repo.list_by_user.return_value = [agent]
    with patch("app.domain.chat.service.stream_chat", new_callable=AsyncMock) as mock_stream_chat:
        request = httpx.Request("POST", "http://test")
        mock_stream_chat.side_effect = openai.APIConnectionError(request=request)
        responses = []
        async for r in chat_service.stream_responses("Hi", user_id):
            responses.append(r)
    assert responses == ["\n[[STATUS:error]]\nConnection error. Please try again later.\n"]


@pytest.mark.asyncio
async def test_stream_responses(chat_service: typing.Any, monkeypatch: pytest.MonkeyPatch) -> None:
    user_id = uuid4()
    agent = MagicMock()
    agent.personality = "Helpful"
    chat_service.agent_repo.list_by_user.return_value = [agent]
    chunk1 = MagicMock()
    chunk1.choices = [MagicMock()]
    chunk1.choices[0].delta.content = "Hel"
    chunk2 = MagicMock()
    chunk2.choices = [MagicMock()]
    chunk2.choices[0].delta.content = "lo!"
    chunk3 = MagicMock()
    chunk3.choices = []

    async def mock_async_generator() -> typing.AsyncGenerator[typing.Any, None]:
        yield chunk1
        yield chunk3
        yield chunk2

    with patch("app.domain.chat.service.stream_chat", new_callable=AsyncMock) as mock_stream_chat:
        mock_stream_chat.return_value = mock_async_generator()
        responses = []
        async for r in chat_service.stream_responses("Hi", user_id, accept_language="fr-FR"):
            responses.append(r)
    assert responses == ["Hel", "lo!", "[[STATUS:done]]\n"]


@pytest.mark.asyncio
async def test_stream_responses_no_agents(chat_service: typing.Any) -> None:
    user_id = uuid4()
    chat_service.agent_repo.list_by_user.return_value = []
    responses = []
    async for r in chat_service.stream_responses("Hi", user_id):
        responses.append(r)
    assert responses == ["No agents available. Please create one first."]


@pytest.mark.asyncio
async def test_handle_message_persistence_and_broadcast(chat_service: ChatService) -> None:
    room_id = uuid4()
    user_id = uuid4()
    message = "Hello WS"
    with patch("app.infrastructure.websocket.manager.chat_hub") as mock_hub:
        mock_hub.broadcast_to_room = AsyncMock()
        mock_hub.send_to_user = AsyncMock()

        async def _save_mock(msg: typing.Any) -> typing.Any:
            from datetime import datetime

            msg.created_at = datetime.now()
            return msg

        typing.cast("AsyncMock", chat_service.chat_repo.save_message).side_effect = _save_mock
        user_msg = await chat_service.ws_broadcaster.handle_message_persistence_and_broadcast(
            room_id, message, user_id, "temp123"
        )
        assert user_msg.content == message


@pytest.mark.asyncio
async def test_broadcast_thinking_status(chat_service: ChatService) -> None:
    room_id = uuid4()
    agent_names = ["Agent1", "Agent2"]
    with patch("app.infrastructure.websocket.manager.chat_hub") as mock_hub:
        mock_hub.broadcast_to_room = AsyncMock()
        await chat_service.ws_broadcaster.broadcast_thinking_status(room_id, agent_names)
        mock_hub.broadcast_to_room.assert_called_once()


@pytest.mark.asyncio
async def test_create_step_callback(chat_service: ChatService) -> None:
    room_id = uuid4()
    agent_names = ["Agent1"]
    with patch("app.infrastructure.websocket.manager.chat_hub") as mock_hub:
        mock_hub.broadcast_to_room = AsyncMock()
        callback = chat_service.ws_broadcaster.create_step_callback(room_id, agent_names)
        mock_output = MagicMock()
        mock_output.tool = "SearchTool"
        mock_output.agent = "Agent1"
        callback(mock_output)
        import asyncio

        await asyncio.sleep(0.01)
        mock_hub.broadcast_to_room.assert_called_once()


@pytest.mark.asyncio
async def test_persist_and_broadcast_agent_response(chat_service: ChatService) -> None:
    room_id = uuid4()
    room_agents = [MagicMock(id=uuid4(), name="Agent1")]
    agent_names = ["Agent1"]
    with patch("app.infrastructure.websocket.manager.chat_hub") as mock_hub:
        mock_hub.broadcast_to_room = AsyncMock()

        async def _save_mock(msg: typing.Any) -> typing.Any:
            from datetime import datetime

            msg.created_at = datetime.now()
            return msg

        typing.cast("AsyncMock", chat_service.chat_repo.save_message).side_effect = _save_mock
        typing.cast(
            "AsyncMock", chat_service.agent_repo.increment_message_count
        ).return_value = None
        responded = await chat_service.ws_broadcaster.persist_and_broadcast_agent_response(
            room_id, typing.cast("list[typing.Any]", room_agents), "Done!", agent_names
        )
        assert len(responded) == 1


@pytest.mark.asyncio
async def test_persist_and_broadcast_agent_response_error(chat_service: ChatService) -> None:
    room_id = uuid4()
    room_agents = [MagicMock(id=uuid4(), name="Agent1")]
    agent_names = ["Agent1"]
    typing.cast("typing.Any", chat_service.chat_repo).save_message = AsyncMock(
        side_effect=BaseORMException("DB error")
    )
    with pytest.raises(BaseORMException, match="DB error"):
        await chat_service.ws_broadcaster.persist_and_broadcast_agent_response(
            room_id, typing.cast("list[typing.Any]", room_agents), "Done!", agent_names
        )


@pytest.mark.asyncio
async def test_run_room_chat_ws_no_agents(chat_service: ChatService) -> None:
    room_id = uuid4()
    user_id = uuid4()
    typing.cast("AsyncMock", chat_service.chat_repo.list_room_agents).return_value = []
    with (
        patch.object(
            chat_service.ws_broadcaster,
            "handle_message_persistence_and_broadcast",
            new_callable=AsyncMock,
        ),
        patch("app.infrastructure.websocket.manager.chat_hub") as mock_hub,
    ):
        mock_hub.broadcast_to_room = AsyncMock()
        await chat_service.run_room_chat_ws(room_id, "Hello", user_id)
        mock_hub.broadcast_to_room.assert_called_once()


@pytest.mark.asyncio
async def test_run_room_chat_ws_success(chat_service: ChatService) -> None:
    room_id = uuid4()
    user_id = uuid4()
    typing.cast("AsyncMock", chat_service.chat_repo.list_room_agents).return_value = [
        MagicMock(id=uuid4(), name="Agent1")
    ]
    with (
        patch.object(
            chat_service.ws_broadcaster,
            "handle_message_persistence_and_broadcast",
            new_callable=AsyncMock,
        ) as m_persist,
        patch.object(
            chat_service.ws_broadcaster, "broadcast_thinking_status", new_callable=AsyncMock
        ),
        patch.object(chat_service.ws_broadcaster, "create_step_callback", return_value=MagicMock()),
        patch(
            "app.domain.chat.crew_orchestrator.CrewOrchestrator.execute_crew_task",
            new_callable=AsyncMock,
        ) as m_exec,
        patch.object(
            chat_service.ws_broadcaster,
            "persist_and_broadcast_agent_response",
            new_callable=AsyncMock,
        ) as m_agent_resp,
        patch("app.infrastructure.websocket.manager.chat_hub") as mock_hub,
        patch("app.domain.chat.service.asyncio.create_task") as m_create_task,
    ):
        mock_hub.broadcast_to_room = AsyncMock()
        m_persist.return_value = MagicMock(id=uuid4())
        m_exec.return_value = "Result"
        m_agent_resp.return_value = []
        m_create_task.return_value = MagicMock()
        typing.cast("typing.Any", chat_service.bg_service).store_memories_background = MagicMock()
        typing.cast(
            "typing.Any", chat_service.bg_service
        ).update_room_summary_background = MagicMock()
        await chat_service.run_room_chat_ws(room_id, "Hello", user_id, accept_language="es-MX")
        m_persist.assert_called_once()


@pytest.mark.asyncio
async def test_run_room_chat_ws_unauthorized(chat_service: ChatService) -> None:
    room_id = uuid4()
    user_id = uuid4()
    user_message = "hello"
    typing.cast("AsyncMock", chat_service.chat_repo.room_belongs_to_user).return_value = False
    with patch("app.infrastructure.websocket.manager.chat_hub") as mock_hub:
        mock_hub.broadcast_to_room = AsyncMock()
        await chat_service.run_room_chat_ws(room_id, user_message, user_id)
        mock_hub.broadcast_to_room.assert_awaited_once()


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "side_effect, log_message_part",
    [
        (openai.OpenAIError("API error"), "OpenAI error"),
        (ValueError("Unexpected error"), "Unexpected error"),
    ],
)
async def test_run_room_chat_ws_exceptions(
    chat_service: ChatService,
    caplog: pytest.LogCaptureFixture,
    side_effect: Exception,
    log_message_part: str,
) -> None:
    room_id = uuid4()
    user_id = uuid4()
    agent_name = "Agent1"
    mock_agent = MagicMock(id=uuid4())
    mock_agent.name = agent_name
    typing.cast("AsyncMock", chat_service.chat_repo.list_room_agents).return_value = [mock_agent]
    with (
        patch.object(
            chat_service.ws_broadcaster,
            "handle_message_persistence_and_broadcast",
            new_callable=AsyncMock,
        ) as m_persist,
        patch.object(
            chat_service.ws_broadcaster, "broadcast_thinking_status", new_callable=AsyncMock
        ),
        patch.object(chat_service.ws_broadcaster, "create_step_callback", return_value=MagicMock()),
        patch(
            "app.domain.chat.crew_orchestrator.CrewOrchestrator.execute_crew_task",
            new_callable=AsyncMock,
        ) as m_exec,
        patch("app.infrastructure.websocket.manager.chat_hub") as mock_hub,
    ):
        mock_hub.broadcast_to_room = AsyncMock()
        m_persist.return_value = MagicMock(id=uuid4())
        m_exec.side_effect = side_effect
        await chat_service.run_room_chat_ws(room_id, "Hello", user_id)

        assert mock_hub.broadcast_to_room.call_count == 2

        # Check first broadcast (agent_activity error)
        call_args_1 = mock_hub.broadcast_to_room.call_args_list[0][0]
        assert call_args_1[0] == room_id
        assert call_args_1[1]["type"] == "agent_activity"
        assert call_args_1[1]["data"]["activity"] == "error"
        assert agent_name in call_args_1[1]["data"]["agent_names"]

        # Check second broadcast (generic error payload)
        call_args_2 = mock_hub.broadcast_to_room.call_args_list[1][0]
        assert call_args_2[0] == room_id
        assert call_args_2[1]["type"] == "error"
        assert "Something went wrong" in call_args_2[1]["data"]["message"]

        # Assert logging contains specific message
        assert any(log_message_part in record.message for record in caplog.records)
