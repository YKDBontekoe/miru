import re

def fix():
    with open("backend/tests/test_agents.py", "r") as f:
        content = f.read()

    content = content.replace("def mock_supabase() -> MagicMock:", "def mock_supabase() -> Any:")
    content = content.replace("import pytest", "import pytest\nfrom typing import Any, AsyncGenerator")
    content = content.replace("def test_stream_room_responses(", "def test_stream_room_responses(\n    mock_stream_chat: MagicMock,\n    mock_retrieve_memories: MagicMock,\n    mock_get_room_agents: MagicMock,\n    mock_get_agents: MagicMock,\n    mock_get_room_messages: MagicMock,\n    mock_save_message: MagicMock\n) -> None:")
    content = content.replace("    async def mock_stream(*args, **kwargs):", "    async def mock_stream(*args: Any, **kwargs: Any) -> AsyncGenerator[str, None]:")

    with open("backend/tests/test_agents.py", "w") as f:
        f.write(content)

    with open("backend/tests/test_agents_routes.py", "r") as f:
        content = f.read()

    content = content.replace("import pytest", "import pytest\nfrom typing import Any, AsyncGenerator")
    content = content.replace("    async def mock_generator(*args, **kwargs):", "    async def mock_generator(*args: Any, **kwargs: Any) -> AsyncGenerator[str, None]:")

    with open("backend/tests/test_agents_routes.py", "w") as f:
        f.write(content)

fix()
