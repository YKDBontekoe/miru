import re

file_path = "backend/tests/test_memory_service_integration.py"
with open(file_path, "r") as f:
    content = f.read()

# Since `from uuid import UUID, uuid4` was originally there, we just need to ensure UUID is imported
# But my script replaced `uuid4()` with `UUID(...)`. Wait, `from uuid import UUID` is already there. Let's see if the import was removed.
# Looking at the original file I wrote, it had: from uuid import UUID, uuid4.
# Ah, if ruff removed the import because uuid4 was removed, we might need to add UUID if it removed it.
# Actually, the error says "Undefined name UUID", maybe ruff removed the import.
# Let's just make sure it's imported.
content = re.sub(r'from uuid import .+', 'from uuid import UUID', content)

# I should use valid UUIDs for different objects to avoid duplicate key errors
content = content.replace("UUID('00000000-0000-0000-0000-000000000001')", "UUID('00000000-0000-0000-0000-000000000001')", 1) # User ID

with open(file_path, "w") as f:
    f.write(content)
