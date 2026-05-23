import re

with open("backend/tests/test_memory_service.py", "r") as f:
    content = f.read()

# Replace memory_memory_memory_service with memory_service
content = re.sub(
    r"memory_service\.(repo\.)?memory_service\.", "memory_service.", content
)
content = content.replace("memory_memory_memory_service", "memory_service")
content = content.replace("memory_memory_service", "memory_service")

with open("backend/tests/test_memory_service.py", "w") as f:
    f.write(content)
