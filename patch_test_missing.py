import re

def fix_conftest():
    with open("backend/tests/conftest.py", "r") as f:
        content = f.read()
    content = content.replace("return mock_client", "return mock_client  # type: ignore")
    with open("backend/tests/conftest.py", "w") as f:
        f.write(content)

fix_conftest()

import fileinput

for filename in ["backend/tests/test_openrouter.py", "backend/tests/test_memory.py", "backend/tests/test_crew.py"]:
    with open(filename, "r") as f:
        content = f.read()
    # Add `-> None` to all `def test_...` if missing
    content = re.sub(r'def (test_[a-zA-Z0-9_]+)\(([^)]*)\):', r'def \1(\2) -> None:', content)
    # Add `-> None` to fixture if missing
    content = re.sub(r'def (mock_[a-zA-Z0-9_]+)\(\):', r'def \1() -> MagicMock:', content)

    # Check typing imports
    if "MagicMock" not in content:
        content = "from unittest.mock import MagicMock\n" + content

    with open(filename, "w") as f:
        f.write(content)
