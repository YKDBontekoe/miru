from __future__ import annotations

import uuid
from unittest.mock import AsyncMock, patch

import pytest
from app.domain.agents.schemas import AgentGenerationResponse, MoodResponse
from app.domain.agents.service import AgentService

_uuid_counter = 0


def get_deterministic_uuid() -> uuid.UUID:
    global _uuid_counter
    _uuid_counter += 1
    return uuid.UUID(f"00000000-0000-0000-0000-{_uuid_counter:012d}")


@pytest.mark.asyncio
async def test_update_mood_empty_history():
    repo = AsyncMock()
    service = AgentService(repo)
    await service.update_mood(str(get_deterministic_uuid()), "")
    repo.update_mood.assert_not_called()


@pytest.mark.asyncio
async def test_update_mood_success():
    repo = AsyncMock()
    service = AgentService(repo)
    agent_id = str(get_deterministic_uuid())
    with patch(
        "app.domain.agents.service.structured_completion", new_callable=AsyncMock
    ) as mock_completion:
        mock_completion.return_value = MoodResponse(mood="Happy")
        await service.update_mood(agent_id, "User said something nice")
        repo.update_mood.assert_called_once_with(agent_id, "Happy")


@pytest.mark.asyncio
async def test_update_mood_invalid_mood():
    repo = AsyncMock()
    service = AgentService(repo)
    agent_id = str(get_deterministic_uuid())
    with patch(
        "app.domain.agents.service.structured_completion", new_callable=AsyncMock
    ) as mock_completion:
        mock_completion.return_value = MoodResponse(mood="UnknownMood")
        await service.update_mood(agent_id, "User said something weird")
        repo.update_mood.assert_called_once_with(agent_id, "Neutral")


@pytest.mark.asyncio
async def test_update_mood_exception():
    repo = AsyncMock()
    service = AgentService(repo)
    agent_id = str(get_deterministic_uuid())
    with patch(
        "app.domain.agents.service.structured_completion", new_callable=AsyncMock
    ) as mock_completion:
        mock_completion.side_effect = Exception("API Error")
        await service.update_mood(agent_id, "User said something")
        repo.update_mood.assert_not_called()


@pytest.mark.asyncio
async def test_generate_agent_profile():
    repo = AsyncMock()
    service = AgentService(repo)
    mock_response = AgentGenerationResponse(
        name="Generated Agent",
        personality="Creative",
        description="A generated agent",
        capabilities=["web_search"],
        suggested_integrations=["discord"],
        goals=["Create art"],
    )
    with patch(
        "app.domain.agents.service.structured_completion", new_callable=AsyncMock
    ) as mock_completion:
        mock_completion.return_value = mock_response
        response = await service.generate_agent_profile("creative artist")
        assert response.name == "Generated Agent"


@pytest.mark.asyncio
async def test_build_system_prompt_with_goals():
    repo = AsyncMock()
    service = AgentService(repo)
    prompt = await service.build_system_prompt(
        name="Bot", personality="Friendly", goals=["Help users", "Be nice"]
    )
    assert "Your Goals:" in prompt


@pytest.mark.asyncio
async def test_build_system_prompt_with_description():
    repo = AsyncMock()
    service = AgentService(repo)
    prompt = await service.build_system_prompt(
        name="Bot", personality="Friendly", description="A super cool bot"
    )
    assert "A super cool bot" in prompt


@pytest.mark.asyncio
async def test_generate_agent_profile_chaos_timeout():
    repo = AsyncMock()
    service = AgentService(repo)
    with patch(
        "app.domain.agents.service.structured_completion", new_callable=AsyncMock
    ) as mock_completion:
        mock_completion.side_effect = TimeoutError("LLM API Timeout")
        with pytest.raises(TimeoutError):
            await service.generate_agent_profile("impossible keywords")
