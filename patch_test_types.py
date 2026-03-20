import re
with open("backend/tests/test_chat_routes.py", "r") as f:
    content = f.read()

# Replace uuid4 with UUID in type annotations
content = content.replace("from uuid import uuid4", "from uuid import UUID, uuid4")
content = content.replace("user_id: uuid4", "user_id: UUID")
content = content.replace("room_id: uuid4", "room_id: UUID")
content = content.replace("def user_id() -> uuid4:", "def user_id() -> UUID:")
content = content.replace("def room_id() -> uuid4:", "def room_id() -> UUID:")

# Add return types to inner functions
content = content.replace("    async def mock_stream(): yield \"Arrr\"", "    from collections.abc import AsyncGenerator\n    async def mock_stream() -> AsyncGenerator[str, None]: yield \"Arrr\"")
content = content.replace("    async def mock_stream(): yield \"Hey\"", "    from collections.abc import AsyncGenerator\n    async def mock_stream() -> AsyncGenerator[str, None]: yield \"Hey\"")

with open("backend/tests/test_chat_routes.py", "w") as f:
    f.write(content)

with open("backend/tests/test_chat_feedback.py", "r") as f:
    content = f.read()

content = content.replace("            async def mock_stream():", "            from collections.abc import AsyncGenerator\n            async def mock_stream() -> AsyncGenerator[MagicMock, None]:")

with open("backend/tests/test_chat_feedback.py", "w") as f:
    f.write(content)
