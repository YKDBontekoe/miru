with open("backend/tests/test_chat_feedback.py", "r") as f:
    content = f.read()

content = content.replace("        async def mock_stream():", "        async def mock_stream() -> AsyncGenerator[MagicMock, None]:")

with open("backend/tests/test_chat_feedback.py", "w") as f:
    f.write(content)
