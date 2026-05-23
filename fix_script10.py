import re
with open('backend/tests/test_memory_service.py', 'r') as f:
    content = f.read()

# Fix redefined memory_service
content = re.sub(
    r'@pytest.fixture\ndef memory_service\(\) -> MemoryService:\n    repo = MemoryRepository\(\)\n    return MemoryService\(repo\)\n\n\n@pytest.fixture\ndef memory_service\(\) -> MemoryService:\n    repo = MemoryRepository\(\)\n    return MemoryService\(repo\)',
    r'@pytest.fixture\ndef memory_service() -> MemoryService:\n    repo = MemoryRepository()\n    return MemoryService(repo)',
    content
)

# Fix C401
content = content.replace('set(n.id for n in res["nodes"])', '{n.id for n in res["nodes"]}')

with open('backend/tests/test_memory_service.py', 'w') as f:
    f.write(content)
