import re

file_path = "backend/tests/test_memory_service_integration.py"
with open(file_path, "r") as f:
    content = f.read()

# Make sure `from uuid import UUID` is at the top
if "from uuid import UUID" not in content:
    content = content.replace("from unittest.mock", "from uuid import UUID\nfrom unittest.mock")

# Provide unique hardcoded UUID strings
import uuid

def replace_uuid(match):
    return f"UUID('{str(uuid.uuid4())}')"

content = re.sub(r"UUID\('00000000-0000-0000-0000-000000000001'\)", replace_uuid, content)

with open(file_path, "w") as f:
    f.write(content)

file_path2 = "backend/tests/test_graph_service.py"
with open(file_path2, "r") as f:
    content2 = f.read()

# Make sure `import uuid` is at the top, and `from uuid import UUID` if we use `uuid.UUID` or just keep it as `uuid.UUID` if `import uuid` is there.
if "import uuid" not in content2:
    content2 = content2.replace("from unittest.mock", "import uuid\nfrom unittest.mock")

def replace_uuid_2(match):
    return f"uuid.UUID('{str(uuid.uuid4())}')"

content2 = re.sub(r"uuid\.UUID\('00000000-0000-0000-0000-000000000001'\)", replace_uuid_2, content2)

with open(file_path2, "w") as f:
    f.write(content2)
