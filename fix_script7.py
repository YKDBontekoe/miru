with open("backend/tests/test_memory_service.py", "r") as f:
    content = f.read()

content = content.replace(
    '"app.domain.memory.memory_service.embed"', '"app.domain.memory.service.embed"'
)
content = content.replace(
    'patch.object(service, "store_memory"',
    'patch.object(memory_service, "store_memory"',
)

with open("backend/tests/test_memory_service.py", "w") as f:
    f.write(content)
