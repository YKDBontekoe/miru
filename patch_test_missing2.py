import re

with open("backend/tests/conftest.py", "r") as f:
    content = f.read()

content = content.replace('def override_get_settings() -> str:', 'def override_get_settings() -> Any:')
with open("backend/tests/conftest.py", "w") as f:
    f.write(content)

with open("backend/tests/test_crew.py", "r") as f:
    content = f.read()

content = content.replace("def test_run_crew(mock_llm) -> None:", "def test_run_crew(mock_llm: MagicMock) -> None:")

with open("backend/tests/test_crew.py", "w") as f:
    f.write(content)
