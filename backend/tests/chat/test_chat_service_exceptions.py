import typing
import uuid
from unittest.mock import AsyncMock, MagicMock, patch

import openai
import pytest


@pytest.mark.asyncio
async def test_run_room_chat_ws_openai_error_coverage(chat_service: typing.Any) -> None:
    room_id = uuid.uuid4()
    user_id = uuid.uuid4()
    chat_service.chat_repo.list_room_agents.return_value = [
        MagicMock(id=uuid.uuid4(), name="Agent1")
    ]
    chat_service.chat_repo.get_room.return_value = MagicMock()
    chat_service.bg_service.update_room_summary_background = MagicMock()
    chat_service.bg_service.store_memories_background = MagicMock()

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
        patch.object(
            chat_service.ws_broadcaster,
            "persist_and_broadcast_agent_response",
            new_callable=AsyncMock,
        ) as m_agent_resp,
        patch(
            "app.domain.chat.crew_orchestrator.CrewOrchestrator.execute_crew_task",
            new_callable=AsyncMock,
        ) as m_exec,
        patch(
            "app.infrastructure.websocket.manager.chat_hub.broadcast_to_room",
            new_callable=AsyncMock,
        ) as mock_broadcast,
        patch("app.domain.chat.service.asyncio.create_task") as m_create_task,
    ):
        m_persist.return_value = MagicMock(id=uuid.uuid4())
        m_agent_resp.return_value = []
        m_create_task.return_value = MagicMock()

        m_exec.side_effect = openai.OpenAIError("OpenAI API Failure")

        await chat_service.run_room_chat_ws(room_id, "Hello", user_id, accept_language="es-MX")

        assert mock_broadcast.call_count >= 2
        call_args = mock_broadcast.call_args_list[0][0]
        assert call_args[1]["type"] == "agent_activity"
        assert call_args[1]["data"]["activity"] == "error"


@pytest.mark.asyncio
async def test_run_room_chat_ws_generic_error_coverage(chat_service: typing.Any) -> None:
    room_id = uuid.uuid4()
    user_id = uuid.uuid4()
    chat_service.chat_repo.list_room_agents.return_value = [
        MagicMock(id=uuid.uuid4(), name="Agent1")
    ]
    chat_service.chat_repo.get_room.return_value = MagicMock()
    chat_service.bg_service.update_room_summary_background = MagicMock()
    chat_service.bg_service.store_memories_background = MagicMock()

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
        patch.object(
            chat_service.ws_broadcaster,
            "persist_and_broadcast_agent_response",
            new_callable=AsyncMock,
        ) as m_agent_resp,
        patch(
            "app.domain.chat.crew_orchestrator.CrewOrchestrator.execute_crew_task",
            new_callable=AsyncMock,
        ) as m_exec,
        patch(
            "app.infrastructure.websocket.manager.chat_hub.broadcast_to_room",
            new_callable=AsyncMock,
        ) as mock_broadcast,
        patch("app.domain.chat.service.asyncio.create_task") as m_create_task,
    ):
        m_persist.return_value = MagicMock(id=uuid.uuid4())
        m_agent_resp.return_value = []
        m_create_task.return_value = MagicMock()

        m_exec.side_effect = Exception("General Failure")

        await chat_service.run_room_chat_ws(room_id, "Hello", user_id, accept_language="es-MX")

        assert mock_broadcast.call_count >= 2
        call_args = mock_broadcast.call_args_list[0][0]
        assert call_args[1]["type"] == "agent_activity"
        assert call_args[1]["data"]["activity"] == "error"


@pytest.mark.asyncio
async def test_run_room_chat_ws_memory_value_error(chat_service: typing.Any) -> None:
    room_id = uuid.uuid4()
    user_id = uuid.uuid4()
    chat_service.chat_repo.list_room_agents.return_value = [
        MagicMock(id=uuid.uuid4(), name="Agent1")
    ]
    chat_service.chat_repo.get_room.return_value = MagicMock()
    chat_service.bg_service.update_room_summary_background = MagicMock()
    chat_service.bg_service.store_memories_background = MagicMock()

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
        patch.object(
            chat_service.ws_broadcaster,
            "persist_and_broadcast_agent_response",
            new_callable=AsyncMock,
        ) as m_agent_resp,
        patch(
            "app.domain.chat.crew_orchestrator.CrewOrchestrator.execute_crew_task",
            new_callable=AsyncMock,
        ) as m_exec,
        patch(
            "app.infrastructure.websocket.manager.chat_hub.broadcast_to_room",
            new_callable=AsyncMock,
        ),
        patch("app.domain.chat.service.asyncio.create_task") as m_create_task,
        patch("app.infrastructure.external.openrouter.embed", new_callable=AsyncMock) as m_embed,
    ):
        m_persist.return_value = MagicMock(id=uuid.uuid4())
        m_exec.return_value = "Result"
        m_agent_resp.return_value = []
        m_create_task.return_value = MagicMock()

        m_embed.side_effect = ValueError("Value error")

        await chat_service.run_room_chat_ws(room_id, "Hello", user_id, accept_language="es-MX")
        m_exec.assert_called_once()


@pytest.mark.asyncio
async def test_run_room_chat_ws_memory_generic_error(chat_service: typing.Any) -> None:
    room_id = uuid.uuid4()
    user_id = uuid.uuid4()
    chat_service.chat_repo.list_room_agents.return_value = [
        MagicMock(id=uuid.uuid4(), name="Agent1")
    ]
    chat_service.chat_repo.get_room.return_value = MagicMock()
    chat_service.bg_service.update_room_summary_background = MagicMock()
    chat_service.bg_service.store_memories_background = MagicMock()

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
        patch.object(
            chat_service.ws_broadcaster,
            "persist_and_broadcast_agent_response",
            new_callable=AsyncMock,
        ) as m_agent_resp,
        patch(
            "app.domain.chat.crew_orchestrator.CrewOrchestrator.execute_crew_task",
            new_callable=AsyncMock,
        ) as m_exec,
        patch(
            "app.infrastructure.websocket.manager.chat_hub.broadcast_to_room",
            new_callable=AsyncMock,
        ),
        patch("app.domain.chat.service.asyncio.create_task") as m_create_task,
        patch("app.infrastructure.external.openrouter.embed", new_callable=AsyncMock) as m_embed,
    ):
        m_persist.return_value = MagicMock(id=uuid.uuid4())
        m_exec.return_value = "Result"
        m_agent_resp.return_value = []
        m_create_task.return_value = MagicMock()

        m_embed.side_effect = Exception("General error")

        await chat_service.run_room_chat_ws(room_id, "Hello", user_id, accept_language="es-MX")
        m_exec.assert_called_once()


@pytest.mark.asyncio
async def test_run_room_chat_ws_background_tasks(chat_service: typing.Any) -> None:
    room_id = uuid.uuid4()
    user_id = uuid.uuid4()
    agent1 = MagicMock(id=uuid.uuid4(), name="Agent1")
    chat_service.chat_repo.list_room_agents.return_value = [agent1]
    chat_service.chat_repo.get_room.return_value = MagicMock()

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
        patch.object(
            chat_service.ws_broadcaster,
            "persist_and_broadcast_agent_response",
            new_callable=AsyncMock,
        ) as m_agent_resp,
        patch(
            "app.domain.chat.crew_orchestrator.CrewOrchestrator.execute_crew_task",
            new_callable=AsyncMock,
        ) as m_exec,
        patch(
            "app.infrastructure.websocket.manager.chat_hub.broadcast_to_room",
            new_callable=AsyncMock,
        ),
        patch("app.domain.chat.service.asyncio.create_task") as m_create_task,
        patch("app.infrastructure.external.openrouter.embed", new_callable=AsyncMock),
    ):
        m_persist.return_value = MagicMock(id=uuid.uuid4())
        m_exec.return_value = "Result"
        m_agent_resp.return_value = [agent1]

        chat_service.bg_service.update_mood_background = AsyncMock()
        chat_service.bg_service.update_affinity_background = AsyncMock()
        chat_service.bg_service.store_memories_background = AsyncMock()
        chat_service.bg_service.update_room_summary_background = AsyncMock()

        mock_msg = MagicMock()
        mock_msg.role = "user"
        mock_msg.content = "hi"
        chat_service.chat_repo.get_room_messages.return_value = [mock_msg] * 26

        await chat_service.run_room_chat_ws(room_id, "Hello", user_id, accept_language="es-MX")

        assert m_create_task.call_count >= 4
