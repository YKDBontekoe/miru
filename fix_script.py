import re

with open("backend/tests/test_memory_service.py", "r") as f:
    content = f.read()

# Fix repeated setup
fixture_str = """
@pytest.fixture
def memory_service() -> MemoryService:
    repo = MemoryRepository()
    return MemoryService(repo)
"""
content = re.sub(
    r"from app.infrastructure.repositories.memory_repo import MemoryRepository\n",
    "from app.infrastructure.repositories.memory_repo import MemoryRepository\n"
    + fixture_str,
    content,
)

content = re.sub(
    r"    repo = MemoryRepository\(\)\n    service = MemoryService\(repo\)", "", content
)
content = re.sub(
    r"async def test_([a-zA-Z0-9_]+)\(",
    r"async def test_\1(\n    memory_service: MemoryService, ",
    content,
)

# Fix empty params from regex sub
content = re.sub(
    r"\((\n    memory_service: MemoryService, )\)",
    r"(memory_service: MemoryService)",
    content,
)


# Fix docstrings
def add_docstring(match):
    name = match.group(1)
    params = match.group(2)
    indent = match.group(3)
    return f'async def test_{name}({params}):\n{indent}"""Test {name}.\n\n{indent}Args: None\n{indent}Returns: None\n{indent}"""'


content = re.sub(
    r"async def test_([a-zA-Z0-9_]+)\((.*?)\) -> None:\n(\s+)", add_docstring, content
)

# Write it out
with open("backend/tests/test_memory_service.py", "w") as f:
    f.write(content)
