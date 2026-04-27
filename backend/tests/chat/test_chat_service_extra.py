import typing
import uuid
from datetime import datetime
from unittest.mock import AsyncMock, MagicMock, patch

import pytest

from app.domain.chat.service import ChatService, _extract_marker_flags


def test_extract_marker_flags_empty():
    has_task, has_mention = _extract_marker_flags(None)
    assert not has_task
    assert not has_mention

    msg = MagicMock()
    msg.attachments = "not a list"
    has_task, has_mention = _extract_marker_flags(msg)
    assert not has_task
    assert not has_mention


def test_extract_marker_flags_valid():
    msg = MagicMock()
    msg.attachments = [
        "not a dict",
        {"markers": ["task", "mention"]},
        {"markers": ["action", "ping"]},
        {"markers": "not a list"},
    ]
    has_task, has_mention = _extract_marker_flags(msg)
    assert has_task
    assert has_mention


def test_extract_marker_flags_mention_key():
    msg = MagicMock()
    msg.attachments = [{"metadata": {"has_task": True, "has_mention": True}}]
    has_task, has_mention = _extract_marker_flags(msg)
    assert has_task
    assert has_mention


@pytest.mark.asyncio
async def test_create_room(chat_service: typing.Any) -> None:
    user_id = uuid.uuid4()
    mock_room = MagicMock()
    mock_room.id = uuid.uuid4()
    mock_room.name = "My Room"
    mock_room.created_at = datetime.now()
    mock_room.updated_at = datetime.now()

    chat_service.chat_repo.create_room = AsyncMock(return_value=mock_room)
    res = await chat_service.create_room("My Room", user_id)
    assert res.name == "My Room"


@pytest.mark.asyncio
async def test_list_rooms(chat_service: typing.Any) -> None:
    user_id = uuid.uuid4()
    mock_room = MagicMock()
    mock_room.id = uuid.uuid4()
    mock_room.name = "My Room"
    mock_room.created_at = datetime.now()
    mock_room.updated_at = datetime.now()

    chat_service.chat_repo.list_rooms = AsyncMock(return_value=[mock_room])
    res = await chat_service.list_rooms(user_id)
    assert len(res) == 1
    assert res[0].name == "My Room"


@pytest.mark.asyncio
async def test_list_room_summaries_empty(chat_service: typing.Any) -> None:
    user_id = uuid.uuid4()
    chat_service.chat_repo.list_rooms = AsyncMock(return_value=[])
    res = await chat_service.list_room_summaries(user_id)
    assert res == []


@pytest.mark.asyncio
async def test_update_message(chat_service: typing.Any) -> None:
    user_id = uuid.uuid4()
    msg_id = uuid.uuid4()
    mock_msg = MagicMock()
    mock_msg.id = msg_id
    mock_msg.room_id = uuid.uuid4()
    mock_msg.user_id = user_id
    mock_msg.agent_id = None
    mock_msg.content = "updated content"
    mock_msg.created_at = datetime.now()

    chat_service.chat_repo.update_message = AsyncMock(return_value=mock_msg)
    res = await chat_service.update_message(msg_id, "updated content", user_id)
    assert res.content == "updated content"

    chat_service.chat_repo.update_message = AsyncMock(return_value=None)
    res2 = await chat_service.update_message(msg_id, "updated content", user_id)
    assert res2 is None


@pytest.mark.asyncio
async def test_delete_message(chat_service: typing.Any) -> None:
    user_id = uuid.uuid4()
    msg_id = uuid.uuid4()
    chat_service.chat_repo.soft_delete_message = AsyncMock(return_value=True)
    res = await chat_service.delete_message(msg_id, user_id)
    assert res is True


@pytest.mark.asyncio
async def test_stream_responses_generic_error(chat_service: typing.Any) -> None:
    user_id = uuid.uuid4()
    agent = MagicMock()
    agent.personality = "Helpful"
    chat_service.agent_repo.list_by_user.return_value = [agent]
    with patch("app.domain.chat.service.stream_chat", new_callable=AsyncMock) as mock_stream_chat:
        mock_stream_chat.side_effect = Exception("General error")
        responses = []
        async for r in chat_service.stream_responses("Hi", user_id):
            responses.append(r)
    assert responses == ["\n[[STATUS:error]]\nAn unexpected error occurred.\n"]


@pytest.mark.asyncio
async def test_run_crew_no_agents(chat_service: typing.Any) -> None:
    user_id = uuid.uuid4()
    chat_service.agent_repo.list_by_user.return_value = []
    res = await chat_service.run_crew("Hi", user_id)
    assert res["task_type"] == "error"
    assert res["result"] == "No agents available."


def test_build_conversation_history(chat_service: typing.Any) -> None:
    msg1 = MagicMock()
    msg1.user_id = uuid.uuid4()
    msg1.agent_id = None
    msg1.content = "u msg"

    msg2 = MagicMock()
    msg2.user_id = None
    agent_id = uuid.uuid4()
    msg2.agent_id = agent_id
    msg2.content = "a msg"

    msg3 = MagicMock()
    msg3.user_id = None
    msg3.agent_id = uuid.uuid4()
    msg3.content = "fallback"

    hist = ChatService._build_history([msg1, msg2, msg3], {agent_id: "My Agent"})
    assert len(hist) == 3
    assert hist[0]["role"] == "user"
    assert hist[1]["name"] == "My Agent"
    assert hist[2]["name"] == "Agent"
