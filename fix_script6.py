import re

with open("backend/tests/test_memory_service.py", "r") as f:
    content = f.read()

# Fix memory_service.memory_service
content = content.replace("memory_service.memory_service", "memory_service")

# Fix fixture patch order
content = re.sub(
    r"async def test_([a-zA-Z0-9_]+)\(\n    memory_service: MemoryService, (.*?)\) -> None:",
    r"async def test_\1(\n    \2, memory_service: MemoryService) -> None:",
    content,
)
content = re.sub(
    r"async def test_([a-zA-Z0-9_]+)\(\n    memory_service: MemoryService, \n    (.*?)\n\) -> None:",
    r"async def test_\1(\n    \2, memory_service: MemoryService\n) -> None:",
    content,
)

# For lines like `memory_service: MemoryService, mock_embed: AsyncMock`
content = re.sub(
    r"memory_service: MemoryService, mock_embed: AsyncMock",
    r"mock_embed: AsyncMock, memory_service: MemoryService",
    content,
)
content = re.sub(
    r"memory_service: MemoryService, \n    mock_create_task: MagicMock, mock_embed: AsyncMock",
    r"mock_create_task: MagicMock, mock_embed: AsyncMock, memory_service: MemoryService",
    content,
)
content = re.sub(
    r"memory_service: MemoryService, \n    mock_chunk_text: MagicMock, mock_extract_text: MagicMock",
    r"mock_chunk_text: MagicMock, mock_extract_text: MagicMock, memory_service: MemoryService",
    content,
)

with open("backend/tests/test_memory_service.py", "w") as f:
    f.write(content)
