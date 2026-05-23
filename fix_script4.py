import re

with open("backend/tests/test_memory_service.py", "r") as f:
    content = f.read()

# Make the fixture
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

# Remove old assignments
content = re.sub(
    r"    repo = MemoryRepository\(\)\n    service = MemoryService\(repo\)\n",
    "",
    content,
)
content = re.sub(
    r"    repo = MemoryRepository\(\)\n    service = MemoryService\(repo\)", "", content
)


# Inject into signatures
def fix_sig(match):
    name = match.group(1)
    params = match.group(2)
    # Add memory_service correctly
    if params.strip():
        new_params = f"memory_service: MemoryService, {params}"
    else:
        new_params = "memory_service: MemoryService"

    return f'async def test_{name}({new_params}):\n    """Test {name}.\n\n    Args: None\n    Returns: None\n    """'


content = re.sub(r"async def test_([a-zA-Z0-9_]+)\((.*?)\) -> None:", fix_sig, content)

# Replace variables
content = content.replace("repo.", "memory_service.repo.")
content = content.replace("service.", "memory_service.")

with open("backend/tests/test_memory_service.py", "w") as f:
    f.write(content)
