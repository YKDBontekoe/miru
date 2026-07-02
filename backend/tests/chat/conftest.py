from __future__ import annotations

import typing
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest
from app.domain.chat.service import ChatService


@pytest.fixture
def chat_service() -> ChatService:
    chat_repo = AsyncMock()

    async def mock_save_message(msg: typing.Any) -> typing.Any:
        msg.id = msg.id or uuid4()
        return msg

    typing.cast("typing.Any", chat_repo).save_message = AsyncMock(side_effect=mock_save_message)

    agent_repo = AsyncMock()
    memory_repo = AsyncMock()
    agent_service = AsyncMock()
    bg_service = AsyncMock()
    return ChatService(chat_repo, agent_repo, memory_repo, agent_service, bg_service)
