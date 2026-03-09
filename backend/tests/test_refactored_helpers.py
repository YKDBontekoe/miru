from unittest.mock import AsyncMock, MagicMock, patch
import pytest

from app.memory import _search_memories_by_vector
from app.openrouter import _get_client_and_model
from app.crew import _create_sequential_crew, detect_task_type
from app.config import Settings
from crewai import Agent, Task, Process


@pytest.mark.asyncio
async def test_search_memories_by_vector():
    # Mock embed and get_supabase
    with patch("app.memory.embed", new_callable=AsyncMock) as mock_embed, \
         patch("app.memory.get_supabase") as mock_supabase_getter:

        mock_embed.return_value = [0.1, 0.2, 0.3]
        mock_supabase = MagicMock()
        mock_supabase_getter.return_value = mock_supabase

        mock_rpc = MagicMock()
        mock_rpc.execute.return_value.data = [{"id": "1", "content": "mock_memory"}]
        mock_supabase.rpc.return_value = mock_rpc

        result = await _search_memories_by_vector("test query", 2)

        assert result == [{"id": "1", "content": "mock_memory"}]
        mock_embed.assert_awaited_once_with("test query")
        mock_supabase.rpc.assert_called_once_with(
            "match_memories",
            {"query_embedding": [0.1, 0.2, 0.3], "match_threshold": 0.0, "match_count": 2}
        )

def test_get_client_and_model():
    with patch("app.openrouter.get_client") as mock_get_client, \
         patch("app.openrouter.get_settings") as mock_settings:

        mock_client = MagicMock()
        mock_get_client.return_value = mock_client
        mock_settings.return_value = MagicMock(default_chat_model="default-model")

        # Test with no model provided
        client, model = _get_client_and_model()
        assert client == mock_client
        assert model == "default-model"

        # Test with a specific model provided
        client, model = _get_client_and_model("custom-model")
        assert client == mock_client
        assert model == "custom-model"


@patch("app.crew.Crew")
def test_create_sequential_crew(mock_crew_class):
    agent1 = MagicMock(spec=Agent)
    task1 = MagicMock(spec=Task)

    crew = _create_sequential_crew([agent1], [task1])

    mock_crew_class.assert_called_once_with(agents=[agent1], tasks=[task1], process=Process.sequential, verbose=False)



def test_detect_task_type():
    assert detect_task_type("I want to research something") == "research"
    assert detect_task_type("Help me plan my day") == "planning"
    assert detect_task_type("Please summarize this text") == "summarisation"
    assert detect_task_type("Hello how are you?") == "general"
