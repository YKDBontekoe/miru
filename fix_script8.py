with open("backend/tests/test_memory_service.py", "r") as f:
    content = f.read()

content = content.replace(
    '"app.domain.memory.document_memory_service.DocumentService',
    '"app.domain.memory.document_service.DocumentService',
)

with open("backend/tests/test_memory_service.py", "w") as f:
    f.write(content)
