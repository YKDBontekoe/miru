import re

file_path = "backend/tests/test_memory_service_integration.py"
with open(file_path, "r") as f:
    content = f.read()

# Replace dynamic uuid4() calls with hardcoded strings based on Memory constraint
content = content.replace("uuid4()", "UUID('00000000-0000-0000-0000-000000000001')")

# Add the refactor comment where 4 mocks are used
refactor_comment = "\n# TEST(miru-agent): refactor-required\n"
content = content.replace("async def test_store_memory_creates_new_memory_and_triggers_graph(", refactor_comment + "async def test_store_memory_creates_new_memory_and_triggers_graph(")
content = content.replace("async def test_store_memory_creates_relationships(", refactor_comment + "async def test_store_memory_creates_relationships(")
content = content.replace("async def test_store_memory_handles_relationship_creation_error(", refactor_comment + "async def test_store_memory_handles_relationship_creation_error(")

with open(file_path, "w") as f:
    f.write(content)

file_path_2 = "backend/tests/test_graph_service.py"
with open(file_path_2, "r") as f:
    content_2 = f.read()

# Replace dynamic uuid.uuid4() calls with hardcoded strings
content_2 = content_2.replace("uuid.uuid4()", "uuid.UUID('00000000-0000-0000-0000-000000000001')")

with open(file_path_2, "w") as f:
    f.write(content_2)
