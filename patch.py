import re

with open('backend/tests/test_memory_service.py', 'r') as f:
    content = f.read()

# Add imports
imports_to_add = "from typing import Any\nfrom collections.abc import Coroutine\n"
content = content.replace("from uuid import UUID\n", "from uuid import UUID\n" + imports_to_add)

# Replace long definitions
def repl_long_def(match):
    name = match.group(1)
    return f"async def {name}(\n    mock_embed: MagicMock, monkeypatch: pytest.MonkeyPatch\n) -> None:"

content = re.sub(r'async def (test_[a-zA-Z0-9_]+)\(mock_embed: MagicMock, monkeypatch: pytest.MonkeyPatch\) -> None:', repl_long_def, content)

# Replace local helpers
content = content.replace("async def fake_match_memories(*args, **kwargs):", "async def fake_match_memories(*args: Any, **kwargs: Any) -> list[Memory]:")
content = content.replace("async def fake_create_relationship(*args, **kwargs):", "async def fake_create_relationship(*args: Any, **kwargs: Any) -> MemoryRelationship:")
content = content.replace("def side_effect_create_task(coro):", "def side_effect_create_task(coro: Coroutine[Any, Any, Any]) -> MagicMock:")

with open('backend/tests/test_memory_service.py', 'w') as f:
    f.write(content)
