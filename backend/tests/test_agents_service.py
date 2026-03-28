from __future__ import annotations

import uuid
from unittest.mock import AsyncMock, patch

import pytest

from app.domain.agents.models import MoodResponse
from app.domain.agents.service import AgentService


@pytest.mark.asyncio
async def test_update_mood_empty_history():
    repo = AsyncMock()
    service = AgentService(repo)

    await service.update_mood(str(uuid.uuid4()), "")
    repo.update_mood.assert_not_called()


@pytest.mark.asyncio
async def test_update_mood_success():
    repo = AsyncMock()
    service = AgentService(repo)
    agent_id = str(uuid.uuid4())

    with patch("app.domain.agents.service.structured_completion") as mock_completion:
        mock_completion.return_value = MoodResponse(mood="Happy")

        await service.update_mood(agent_id, "User said something nice")

        mock_completion.assert_called_once()
        repo.update_mood.assert_called_once_with(agent_id, "Happy")


@pytest.mark.asyncio
async def test_update_mood_invalid_mood():
    repo = AsyncMock()
    service = AgentService(repo)
    agent_id = str(uuid.uuid4())

    with patch("app.domain.agents.service.structured_completion") as mock_completion:
        mock_completion.return_value = MoodResponse(mood="UnknownMood")

        await service.update_mood(agent_id, "User said something weird")

        mock_completion.assert_called_once()
        repo.update_mood.assert_called_once_with(agent_id, "Neutral")


@pytest.mark.asyncio
async def test_update_mood_exception():
    repo = AsyncMock()
    service = AgentService(repo)
    agent_id = str(uuid.uuid4())

    with patch(
        "app.domain.agents.service.structured_completion", side_effect=Exception("API Error")
    ):
        await service.update_mood(agent_id, "User said something")
        repo.update_mood.assert_not_called()
