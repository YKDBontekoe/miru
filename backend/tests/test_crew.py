from unittest.mock import MagicMock, patch

from crewai import Agent, Process, Task

from app.crew import _create_sequential_crew, detect_task_type


@patch("app.crew.Crew")
def test_create_sequential_crew(mock_crew_class):
    agent1 = MagicMock(spec=Agent)
    task1 = MagicMock(spec=Task)

    _create_sequential_crew([agent1], [task1])

    mock_crew_class.assert_called_once_with(
        agents=[agent1], tasks=[task1], process=Process.sequential, verbose=False
    )


def test_detect_task_type():
    assert detect_task_type("I want to research something") == "research"
    assert detect_task_type("Help me plan my day") == "planning"
    assert detect_task_type("Please summarize this text") == "summarisation"
    assert detect_task_type("Hello how are you?") == "general"
