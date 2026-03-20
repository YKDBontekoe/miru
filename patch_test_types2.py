import re

with open("backend/tests/test_chat_routes.py", "r") as f:
    content = f.read()

# I apparently missed a couple. Look for 'def ' inside tests
content = re.sub(r"(    async def mock_stream\(\)):", r"\1 -> AsyncGenerator[str, None]:", content)
content = content.replace("    def __init__(self):", "    def __init__(self) -> None:")

with open("backend/tests/test_chat_routes.py", "w") as f:
    f.write(content)

with open("backend/tests/test_chat_feedback.py", "r") as f:
    content = f.read()

content = re.sub(r"(            async def mock_stream\(\)):", r"\1 -> AsyncGenerator[MagicMock, None]:", content)

with open("backend/tests/test_chat_feedback.py", "w") as f:
    f.write(content)
