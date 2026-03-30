"""Tests for ChatService logic."""

from __future__ import annotations

import typing
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest
from tortoise.exceptions import BaseORMException

from app.domain.chat.crew_orchestrator import CrewOrchestrator
from app.domain.chat.service import ChatService


@pytest.fixture
def chat_service() -> ChatService:
    chat_repo = AsyncMock()

    from typing import Any

    async def mock_save_message(msg: Any) -> Any:
        msg.id = msg.id or uuid4()
        return msg

    chat_repo.save_message = AsyncMock(side_effect=mock_save_message)

    agent_repo = AsyncMock()
    memory_repo = AsyncMock()
    agent_service = AsyncMock()
    bg_service = AsyncMock()
    return ChatService(chat_repo, agent_repo, memory_repo, agent_service, bg_service)


def test_get_agent_tools(chat_service: typing.Any) -> None:
    """_get_agent_tools is synchronous and reads from prefetched agent_integrations."""
    # Agent with no integrations
    agent1 = MagicMock()
    agent1.id = uuid4()
    agent1.agent_integrations = []

    user_id = uuid4()
    tools = CrewOrchestrator.get_agent_tools(agent1, user_id)
    # Ensure expected productivity and calendar tools are present
    tool_types = [type(t).__name__ for t in tools]
    assert "ListTasksTool" in tool_types
    assert "CreateTaskTool" in tool_types
    assert "UpdateTaskTool" in tool_types
    assert "ListNotesTool" in tool_types
    assert "CreateNoteTool" in tool_types
    assert "ListEventsTool" in tool_types
    assert "CreateEventTool" in tool_types
    assert "UpdateEventTool" in tool_types
    assert "DeleteEventTool" in tool_types

    # Agent with a steam integration
    steam_id = "12345678901234567"
    agent2 = MagicMock()
    agent2.id = uuid4()

    mock_ai = MagicMock()
    mock_ai.integration_id = "steam"
    mock_ai.enabled = True
    mock_ai.config = {"steam_id": steam_id}

    agent2.agent_integrations = [mock_ai]

    tools = CrewOrchestrator.get_agent_tools(agent2, user_id)
    # Ensure expected productivity and calendar tools are present
    tool_types = [type(t).__name__ for t in tools]
    assert "ListTasksTool" in tool_types
    assert "CreateTaskTool" in tool_types
    assert "UpdateTaskTool" in tool_types
    assert "ListNotesTool" in tool_types
    assert "CreateNoteTool" in tool_types
    assert "ListEventsTool" in tool_types
    assert "CreateEventTool" in tool_types
    assert "UpdateEventTool" in tool_types
    assert "DeleteEventTool" in tool_types
    assert "SteamOwnedGamesTool" in tool_types
    assert "SteamPlayerSummaryTool" in tool_types
    assert tools[0].name == "steam_player_summary"
    assert tools[1].name == "steam_owned_games"


def test_get_agent_tools_disabled_integration(chat_service: typing.Any) -> None:
    """Disabled integrations are skipped."""
    agent = MagicMock()
    agent.id = uuid4()
    mock_ai = MagicMock()
    mock_ai.integration_id = "steam"
    mock_ai.enabled = False
    mock_ai.config = {"steam_id": "12345678901234567"}
    agent.agent_integrations = [mock_ai]

    user_id = uuid4()
    tools = CrewOrchestrator.get_agent_tools(agent, user_id)
    # Ensure expected productivity and calendar tools are present
    tool_types = [type(t).__name__ for t in tools]
    assert "ListTasksTool" in tool_types
    assert "CreateTaskTool" in tool_types
    assert "UpdateTaskTool" in tool_types
    assert "ListNotesTool" in tool_types
    assert "CreateNoteTool" in tool_types
    assert "ListEventsTool" in tool_types
    assert "CreateEventTool" in tool_types
    assert "UpdateEventTool" in tool_types
    assert "DeleteEventTool" in tool_types


def test_get_agent_tools_steam_missing_id(chat_service: typing.Any) -> None:
    """Steam integration without steam_id produces no tools."""
    agent = MagicMock()
    agent.id = uuid4()
    mock_ai = MagicMock()
    mock_ai.integration_id = "steam"
    mock_ai.enabled = True
    mock_ai.config = {}
    agent.agent_integrations = [mock_ai]

    user_id = uuid4()
    tools = CrewOrchestrator.get_agent_tools(agent, user_id)
    # Ensure expected productivity and calendar tools are present
    tool_types = [type(t).__name__ for t in tools]
    assert "ListTasksTool" in tool_types
    assert "CreateTaskTool" in tool_types
    assert "UpdateTaskTool" in tool_types
    assert "ListNotesTool" in tool_types
    assert "CreateNoteTool" in tool_types
    assert "ListEventsTool" in tool_types
    assert "CreateEventTool" in tool_types
    assert "UpdateEventTool" in tool_types
    assert "DeleteEventTool" in tool_types


@pytest.mark.asyncio
async def test_run_crew_task_has_single_agent(
    chat_service: typing.Any, monkeypatch: pytest.MonkeyPatch
) -> None:

    user_id = uuid4()

    agent = MagicMock()
    agent.id = uuid4()
    agent.name = "Test Agent"
    agent.personality = "Helpful"
    agent.description = "A helpful agent"
    agent.agent_integrations = []

    chat_service.agent_repo.list_by_user.return_value = [agent]

    # Mock _get_crew_llm to prevent it looking for OPENAI_API_KEY
    mock_llm = MagicMock()
    mock_llm.model = "openrouter/test-model"
    monkeypatch.setattr(
        "app.domain.chat.crew_orchestrator.CrewOrchestrator.get_crew_llm",
        MagicMock(return_value=mock_llm),
    )

    with (
        patch("app.domain.chat.crew_orchestrator.Task") as mock_task_cls,
        patch("app.domain.chat.crew_orchestrator.Crew") as mock_crew_cls,
        patch("app.domain.chat.crew_orchestrator.crewai.Agent") as mock_agent_cls,
    ):
        mock_crew_agent = MagicMock()
        mock_crew_agent.role = "Test Agent"
        mock_agent_cls.return_value = mock_crew_agent

        mock_crew_instance = MagicMock()
        mock_crew_instance.kickoff_async = AsyncMock(return_value="Crew output")
        mock_crew_cls.return_value = mock_crew_instance

        result = await chat_service.run_crew("hello", user_id, accept_language="es-ES")

        assert result["task_type"] == "general"
        assert result["result"] == "Crew output"

        # Verify Task was instantiated with single agent and locale instruction
        mock_task_cls.assert_called_once()
        _, kwargs = mock_task_cls.call_args
        assert "agent" in kwargs
        assert kwargs["agent"] == mock_crew_agent
        # Language code is resolved to name before being injected into the prompt
        assert "Spanish" in kwargs["description"]

        # Verify Crew was instantiated with agents list
        mock_crew_cls.assert_called_once()
        _, crew_kwargs = mock_crew_cls.call_args
        assert "agents" in crew_kwargs
        assert crew_kwargs["agents"] == [mock_crew_agent]


@pytest.mark.asyncio
async def test_run_crew_task_has_multiple_agents(
    chat_service: typing.Any, monkeypatch: pytest.MonkeyPatch
) -> None:

    user_id = uuid4()

    agent1 = MagicMock()
    agent1.id = uuid4()
    agent1.name = "Agent 1"
    agent1.personality = "Helpful"
    agent1.description = "A helpful agent"
    agent1.agent_integrations = []

    agent2 = MagicMock()
    agent2.id = uuid4()
    agent2.name = "Agent 2"
    agent2.personality = "Funny"
    agent2.description = "A funny agent"
    agent2.agent_integrations = []

    chat_service.agent_repo.list_by_user.return_value = [agent1, agent2]

    mock_llm = MagicMock()
    mock_llm.model = "openrouter/test-model"
    monkeypatch.setattr(
        "app.domain.chat.crew_orchestrator.CrewOrchestrator.get_crew_llm",
        MagicMock(return_value=mock_llm),
    )

    with (
        patch("app.domain.chat.crew_orchestrator.Task") as mock_task_cls,
        patch("app.domain.chat.crew_orchestrator.Crew") as mock_crew_cls,
        patch("app.domain.chat.crew_orchestrator.crewai.Agent") as mock_agent_cls,
        patch("app.domain.chat.crew_orchestrator.Process") as mock_process,
    ):
        mock_crew_agent1 = MagicMock()
        mock_crew_agent1.role = "Agent 1"
        mock_crew_agent2 = MagicMock()
        mock_crew_agent2.role = "Agent 2"
        mock_agent_cls.side_effect = [mock_crew_agent1, mock_crew_agent2]

        mock_crew_instance = MagicMock()
        mock_crew_instance.kickoff_async = AsyncMock(return_value="Crew output")
        mock_crew_cls.return_value = mock_crew_instance

        result = await chat_service.run_crew("hello", user_id, accept_language="es-ES")

        assert result["task_type"] == "general"
        assert result["result"] == "Crew output"

        # Verify Task was instantiated without an assigned agent (hierarchical)
        mock_task_cls.assert_called_once()
        _, kwargs = mock_task_cls.call_args
        assert "agent" not in kwargs
        # Language code is resolved to name before being injected into the prompt
        assert "Spanish" in kwargs["description"]

        # Verify Crew was instantiated hierarchically with manager_llm
        mock_crew_cls.assert_called_once()
        _, crew_kwargs = mock_crew_cls.call_args
        assert "agents" in crew_kwargs
        assert crew_kwargs["agents"] == [mock_crew_agent1, mock_crew_agent2]
        assert "manager_llm" in crew_kwargs
        assert crew_kwargs["manager_llm"] == mock_llm
        assert crew_kwargs["process"] == mock_process.hierarchical


@pytest.mark.asyncio
async def test_stream_responses_timeout_error(chat_service: typing.Any) -> None:
    from unittest.mock import AsyncMock

    user_id = uuid4()
    agent = MagicMock()
    agent.personality = "Helpful"
    chat_service.agent_repo.list_by_user.return_value = [agent]

    with patch(
        "app.domain.chat.service.stream_chat",
        new_callable=AsyncMock,
    ) as mock_stream_chat:
        mock_stream_chat.side_effect = TimeoutError("Connection timed out")
        responses = []
        async for r in chat_service.stream_responses("Hi", user_id):
            responses.append(r)

    assert responses == ["\n[[STATUS:error]]\nConnection timed out. Please try again later.\n"]
    mock_stream_chat.assert_called_once()


@pytest.mark.asyncio
async def test_stream_responses_api_connection_error(chat_service: typing.Any) -> None:
    from unittest.mock import AsyncMock

    import httpx
    import openai

    user_id = uuid4()
    agent = MagicMock()
    agent.personality = "Helpful"
    chat_service.agent_repo.list_by_user.return_value = [agent]

    with patch(
        "app.domain.chat.service.stream_chat",
        new_callable=AsyncMock,
    ) as mock_stream_chat:
        request = httpx.Request("POST", "http://test")
        mock_stream_chat.side_effect = openai.APIConnectionError(request=request)
        responses = []
        async for r in chat_service.stream_responses("Hi", user_id):
            responses.append(r)

    assert responses == ["\n[[STATUS:error]]\nConnection error. Please try again later.\n"]
    mock_stream_chat.assert_called_once()


@pytest.mark.asyncio
async def test_stream_responses(chat_service: typing.Any, monkeypatch: pytest.MonkeyPatch) -> None:
    from unittest.mock import AsyncMock

    user_id = uuid4()

    agent = MagicMock()
    agent.personality = "Helpful"
    chat_service.agent_repo.list_by_user.return_value = [agent]

    # Create mock chunks
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

    with patch(
        "app.domain.chat.service.stream_chat",
        new_callable=AsyncMock,
    ) as mock_stream_chat:
        mock_stream_chat.return_value = mock_async_generator()
        responses = []
        async for r in chat_service.stream_responses("Hi", user_id, accept_language="fr-FR"):
            responses.append(r)

    assert responses == ["Hel", "lo!", "[[STATUS:done]]\n"]
    mock_stream_chat.assert_called_once()
    called_messages = mock_stream_chat.call_args[1]["messages"]
    assert any("fr-FR" in m["content"] and m["role"] == "system" for m in called_messages)


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
        assert getattr(user_msg, "room_id") == room_id  # noqa: B009
        typing.cast("AsyncMock", chat_service.chat_repo.save_message).assert_called_once_with(
            user_msg
        )
        mock_hub.broadcast_to_room.assert_called_once()
        mock_hub.send_to_user.assert_called_once()


@pytest.mark.asyncio
async def test_broadcast_thinking_status(chat_service: ChatService) -> None:
    room_id = uuid4()
    agent_names = ["Agent1", "Agent2"]

    with patch("app.infrastructure.websocket.manager.chat_hub") as mock_hub:
        mock_hub.broadcast_to_room = AsyncMock()

        await chat_service.ws_broadcaster.broadcast_thinking_status(room_id, agent_names)

        mock_hub.broadcast_to_room.assert_called_once()
        call_args = mock_hub.broadcast_to_room.call_args[0]
        assert call_args[0] == room_id
        assert call_args[1]["type"] == "agent_activity"
        assert call_args[1]["data"]["activity"] == "thinking"


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
        # It schedules a task in the loop, wait for it
        import asyncio

        await asyncio.sleep(0.01)

        mock_hub.broadcast_to_room.assert_called_once()
        call_args = mock_hub.broadcast_to_room.call_args[0]
        assert call_args[1]["data"]["activity"] == "using_tool"


@pytest.mark.asyncio
async def test_execute_crew_task(
    chat_service: ChatService, monkeypatch: pytest.MonkeyPatch
) -> None:
    room_agents = [
        MagicMock(
            id=uuid4(), name="Agent1", personality="Good", description="desc", agent_integrations=[]
        )
    ]
    user_id = uuid4()
    user_msg_id = uuid4()

    mock_llm = MagicMock()
    monkeypatch.setattr(
        "app.domain.chat.crew_orchestrator.CrewOrchestrator.get_crew_llm",
        MagicMock(return_value=mock_llm),
    )

    with (
        patch("app.domain.chat.crew_orchestrator.Task") as mock_task_cls,
        patch("app.domain.chat.crew_orchestrator.Crew") as mock_crew_cls,
        patch("app.domain.chat.crew_orchestrator.crewai.Agent"),
    ):
        mock_crew_instance = MagicMock()
        mock_crew_instance.kickoff_async = AsyncMock(return_value="Result")
        mock_crew_cls.return_value = mock_crew_instance

        result = await CrewOrchestrator.execute_crew_task(
            typing.cast("list[typing.Any]", room_agents),
            "Hello",
            user_id,
            user_msg_id,
            MagicMock(),
            accept_language="ja-JP",
        )
        assert result == "Result"

        mock_task_cls.assert_called_once()
        _, kwargs = mock_task_cls.call_args
        # Language code is resolved to readable name in the prompt
        assert "Japanese" in kwargs["description"]


@pytest.mark.asyncio
async def test_execute_crew_task_multi(
    chat_service: ChatService, monkeypatch: pytest.MonkeyPatch
) -> None:
    room_agents = [
        MagicMock(
            id=uuid4(), name="Agent1", personality="Good", description="desc", agent_integrations=[]
        ),
        MagicMock(
            id=uuid4(), name="Agent2", personality="Bad", description="desc", agent_integrations=[]
        ),
    ]
    user_id = uuid4()
    user_msg_id = uuid4()

    mock_llm = MagicMock()
    monkeypatch.setattr(
        "app.domain.chat.crew_orchestrator.CrewOrchestrator.get_crew_llm",
        MagicMock(return_value=mock_llm),
    )

    with (
        patch("app.domain.chat.crew_orchestrator.Task") as mock_task_cls,
        patch("app.domain.chat.crew_orchestrator.Crew") as mock_crew_cls,
        patch("app.domain.chat.crew_orchestrator.crewai.Agent"),
    ):
        mock_crew_instance = MagicMock()
        mock_crew_instance.kickoff_async = AsyncMock(return_value="ResultMulti")
        mock_crew_cls.return_value = mock_crew_instance

        result = await CrewOrchestrator.execute_crew_task(
            typing.cast("list[typing.Any]", room_agents),
            "Hello",
            user_id,
            user_msg_id,
            MagicMock(),
            accept_language="hi-IN",
        )
        assert result == "ResultMulti"

        mock_task_cls.assert_called_once()
        _, kwargs = mock_task_cls.call_args
        # Language code is resolved to readable name in the prompt
        assert "Hindi" in kwargs["description"]


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

        typing.cast("typing.Any", chat_service.chat_repo.save_message).assert_called_once()
        typing.cast("AsyncMock", chat_service.chat_repo.touch_room).assert_called_once_with(room_id)
        typing.cast(
            "AsyncMock", chat_service.agent_repo.increment_message_count
        ).assert_called_once_with(room_agents[0].id)
        assert mock_hub.broadcast_to_room.call_count == 1
        # Only the agent that actually responded is returned
        assert len(responded) == 1
        assert responded[0] == room_agents[0]


@pytest.mark.asyncio
async def test_persist_and_broadcast_agent_response_error(chat_service: ChatService) -> None:
    room_id = uuid4()
    room_agents = [MagicMock(id=uuid4(), name="Agent1")]
    agent_names = ["Agent1"]

    chat_service.chat_repo.save_message = AsyncMock(side_effect=BaseORMException("DB error"))  # ty: ignore[invalid-assignment]

    with pytest.raises(BaseORMException, match="DB error"):
        await chat_service.ws_broadcaster.persist_and_broadcast_agent_response(
            room_id, typing.cast("list[typing.Any]", room_agents), "Done!", agent_names
        )

    typing.cast("typing.Any", chat_service.chat_repo.save_message).assert_called_once()


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
        assert mock_hub.broadcast_to_room.call_args[0][1]["type"] == "error"


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
        ) as m_think,
        patch.object(
            chat_service.ws_broadcaster, "create_step_callback", return_value=MagicMock()
        ) as m_cb,
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
        # Return empty list so no mood/affinity tasks are scheduled
        m_agent_resp.return_value = []
        m_create_task.return_value = MagicMock()

        typing.cast("typing.Any", chat_service.bg_service).store_memories_background = MagicMock()
        typing.cast(
            "typing.Any", chat_service.bg_service
        ).update_room_summary_background = MagicMock()

        await chat_service.run_room_chat_ws(room_id, "Hello", user_id, accept_language="es-MX")

        m_persist.assert_called_once()
        m_think.assert_called_once()
        m_cb.assert_called_once()
        m_exec.assert_called_once()
        # Verify language is passed as a keyword to ensure robustness
        _, exec_kwargs = m_exec.call_args
        assert exec_kwargs.get("accept_language") == "es-MX"
        m_agent_resp.assert_called_once()
        mock_hub.broadcast_to_room.assert_called_once()
        assert mock_hub.broadcast_to_room.call_args[0][1]["type"] == "agent_activity"
        assert mock_hub.broadcast_to_room.call_args[0][1]["data"]["activity"] == "done"
        # Background memory task should have been scheduled
        m_create_task.assert_called_once()


@pytest.mark.asyncio
async def test_update_room(chat_service: ChatService) -> None:
    room_id = uuid4()
    user_id = uuid4()

    from datetime import UTC, datetime

    from app.domain.chat.entities import ChatRoomEntity

    # Setup mock
    now = datetime.now(UTC)
    chat_service.chat_repo.update_room.return_value = ChatRoomEntity(  # type: ignore
        id=room_id,
        user_id=user_id,
        name="New Name",
        created_at=now,
        updated_at=now,
        deleted_at=None,
        summary=None,
    )

    result = await chat_service.update_room(room_id, "New Name", user_id)
    assert result is not None
    assert result.name == "New Name"
    chat_service.chat_repo.update_room.assert_awaited_once_with(  # type: ignore
        room_id, "New Name", user_id=user_id
    )

    # Test failure
    chat_service.chat_repo.update_room.return_value = None  # type: ignore
    result_fail = await chat_service.update_room(room_id, "New Name", user_id)
    assert result_fail is None


@pytest.mark.asyncio
async def test_delete_room(chat_service: ChatService) -> None:
    room_id = uuid4()
    user_id = uuid4()

    chat_service.chat_repo.delete_room.return_value = True  # type: ignore
    result = await chat_service.delete_room(room_id, user_id)
    assert result is True
    chat_service.chat_repo.delete_room.assert_awaited_once_with(room_id, user_id=user_id)  # type: ignore


@pytest.mark.asyncio
async def test_add_agent_to_room_ownership(chat_service: ChatService) -> None:
    room_id = uuid4()
    user_id = uuid4()
    agent_id = uuid4()

    chat_service.chat_repo.room_belongs_to_user.return_value = False  # type: ignore
    result = await chat_service.add_agent_to_room(room_id, agent_id, user_id)
    assert result is None

    chat_service.chat_repo.room_belongs_to_user.return_value = True  # type: ignore
    chat_service.chat_repo.add_agent_to_room.return_value = True  # type: ignore
    result_success = await chat_service.add_agent_to_room(room_id, agent_id, user_id)
    assert result_success is True


@pytest.mark.asyncio
async def test_remove_agent_from_room_ownership(chat_service: ChatService) -> None:
    room_id = uuid4()
    user_id = uuid4()
    agent_id = uuid4()

    chat_service.chat_repo.room_belongs_to_user.return_value = False  # type: ignore
    result = await chat_service.remove_agent_from_room(room_id, agent_id, user_id)
    assert result is False

    chat_service.chat_repo.room_belongs_to_user.return_value = True  # type: ignore
    chat_service.chat_repo.remove_agent_from_room.return_value = True  # type: ignore
    result_success = await chat_service.remove_agent_from_room(room_id, agent_id, user_id)
    assert result_success is True


@pytest.mark.asyncio
async def test_list_room_agents_ownership(chat_service: ChatService) -> None:
    room_id = uuid4()
    user_id = uuid4()

    chat_service.chat_repo.room_belongs_to_user.return_value = False  # type: ignore
    result = await chat_service.list_room_agents(room_id, user_id)
    assert result == []

    chat_service.chat_repo.room_belongs_to_user.return_value = True  # type: ignore
    chat_service.chat_repo.list_room_agents.return_value = ["agent"]  # type: ignore
    result_success = await chat_service.list_room_agents(room_id, user_id)
    assert result_success == ["agent"]


@pytest.mark.asyncio
async def test_get_room_messages_ownership(chat_service: ChatService) -> None:
    room_id = uuid4()
    user_id = uuid4()

    chat_service.chat_repo.room_belongs_to_user.return_value = False  # type: ignore
    result = await chat_service.get_room_messages(room_id, user_id)
    assert result == []

    chat_service.chat_repo.room_belongs_to_user.return_value = True  # type: ignore
    from app.domain.chat.entities import ChatMessageEntity

    chat_service.chat_repo.get_room_messages.return_value = [  # type: ignore
        ChatMessageEntity(id=uuid4(), room_id=room_id, user_id=user_id, content="test")
    ]
    result_success = await chat_service.get_room_messages(room_id, user_id)
    assert len(result_success) == 1
    assert result_success[0].content == "test"
