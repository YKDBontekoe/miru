with open("backend/tests/test_chat_service.py", "r") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "async def mock_acreate(" in line:
        lines[i] = line.replace("):", ") -> typing.AsyncGenerator[typing.Any, None]:")

with open("backend/tests/test_chat_service.py", "w") as f:
    f.writelines(lines)
