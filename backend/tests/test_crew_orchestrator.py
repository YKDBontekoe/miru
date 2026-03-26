import asyncio
import uuid
from unittest.mock import AsyncMock, patch

import pytest

from app.domain.chat.crew_orchestrator import (
    AgentMessage,
    CrewOrchestrator,
    MultiAgentResponse,
    SingleAgentResponse,
)


class MockAgent:
    def __init__(self, id, user_id, name, personality, system_prompt):
        self.id = id
        self.user_id = user_id
        self.name = name
        self.personality = personality
        self.system_prompt = system_prompt
        self.agent_integrations = []
        self.description = None


@pytest.fixture
def mock_agent():
    return MockAgent(
        id=uuid.uuid4(),
        user_id=uuid.uuid4(),
        name="Test Agent",
        personality="Helpful",
        system_prompt="Be helpful",
    )


class MockOutput:
    def __init__(self, pydantic_obj=None, str_val=""):
        self.pydantic = pydantic_obj
        self.str_val = str_val

    def __str__(self):
        return self.str_val


@pytest.mark.asyncio
async def test_execute_crew_task_single_agent_success(mock_agent):
    with patch("app.domain.chat.crew_orchestrator.Crew") as mock_crew_class:
        mock_crew_instance = mock_crew_class.return_value
        mock_result = MockOutput(pydantic_obj=SingleAgentResponse(message="Success"))

        async def mock_kickoff_async():
            return mock_result

        mock_crew_instance.kickoff_async.side_effect = mock_kickoff_async

        result = await CrewOrchestrator.execute_crew_task(
            room_agents=[mock_agent], user_message="Hello", user_id=uuid.uuid4()
        )
        assert result.replace(" ", "") == '{"message":"Success"}'


@pytest.mark.asyncio
async def test_execute_crew_task_multi_agent_success(mock_agent):
    mock_agent2 = MockAgent(
        id=uuid.uuid4(),
        user_id=uuid.uuid4(),
        name="Test Agent 2",
        personality="Helpful",
        system_prompt="Be helpful",
    )
    with patch("app.domain.chat.crew_orchestrator.Crew") as mock_crew_class:
        mock_crew_instance = mock_crew_class.return_value
        mock_result = MockOutput(
            pydantic_obj=MultiAgentResponse(
                messages=[AgentMessage(agent_name="Test Agent", message="Success")]
            )
        )

        async def mock_kickoff_async():
            return mock_result

        mock_crew_instance.kickoff_async.side_effect = mock_kickoff_async

        result = await CrewOrchestrator.execute_crew_task(
            room_agents=[mock_agent, mock_agent2], user_message="Hello", user_id=uuid.uuid4()
        )
        assert (
            result.replace(" ", "")
            == '{"messages":[{"agent_name":"TestAgent","message":"Success"}]}'
        )


@pytest.mark.asyncio
async def test_execute_crew_task_retry(mock_agent):
    with (
        patch("app.domain.chat.crew_orchestrator.Crew") as mock_crew_class,
        patch(
            "app.domain.chat.crew_orchestrator.asyncio.sleep", new_callable=AsyncMock
        ) as mock_sleep,
    ):
        mock_crew_instance = mock_crew_class.return_value

        mock_result = MockOutput(pydantic_obj=SingleAgentResponse(message="Success"))

        call_count = 0

        async def mock_kickoff_async():
            nonlocal call_count
            call_count += 1
            if call_count == 1:
                raise Exception("Failed")
            return mock_result

        mock_crew_instance.kickoff_async.side_effect = mock_kickoff_async

        result = await CrewOrchestrator.execute_crew_task(
            room_agents=[mock_agent], user_message="Hello", user_id=uuid.uuid4()
        )
        assert mock_crew_instance.kickoff_async.call_count == 2
        assert mock_sleep.call_count == 1
        assert result.replace(" ", "") == '{"message":"Success"}'


@pytest.mark.asyncio
async def test_execute_crew_task_fallback_to_str(mock_agent):
    with patch("app.domain.chat.crew_orchestrator.Crew") as mock_crew_class:
        mock_crew_instance = mock_crew_class.return_value
        mock_result = MockOutput(str_val="Fallback string")

        async def mock_kickoff_async():
            return mock_result

        mock_crew_instance.kickoff_async.side_effect = mock_kickoff_async

        result = await CrewOrchestrator.execute_crew_task(
            room_agents=[mock_agent], user_message="Hello", user_id=uuid.uuid4()
        )
        assert result == "Fallback string"


@pytest.mark.asyncio
async def test_execute_crew_task_cancel(mock_agent):
    with patch("app.domain.chat.crew_orchestrator.Crew") as mock_crew_class:
        mock_crew_instance = mock_crew_class.return_value

        async def mock_kickoff_async():
            raise asyncio.CancelledError()

        mock_crew_instance.kickoff_async.side_effect = mock_kickoff_async

        with pytest.raises(asyncio.CancelledError):
            await CrewOrchestrator.execute_crew_task(
                room_agents=[mock_agent], user_message="Hello", user_id=uuid.uuid4()
            )


@pytest.mark.asyncio
async def test_execute_crew_task_all_retries_fail(mock_agent):
    with (
        patch("app.domain.chat.crew_orchestrator.Crew") as mock_crew_class,
        patch("app.domain.chat.crew_orchestrator.asyncio.sleep", new_callable=AsyncMock),
    ):
        mock_crew_instance = mock_crew_class.return_value

        async def mock_kickoff_async():
            raise Exception("Failed repeatedly")

        mock_crew_instance.kickoff_async.side_effect = mock_kickoff_async

        with pytest.raises(Exception, match="Failed repeatedly"):
            await CrewOrchestrator.execute_crew_task(
                room_agents=[mock_agent], user_message="Hello", user_id=uuid.uuid4()
            )
