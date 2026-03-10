with open("backend/tests/test_crew.py", "r") as f:
    content = f.read()

content = content.replace("def test_create_sequential_crew(mock_crew_class) -> None:", "def test_create_sequential_crew(mock_crew_class: MagicMock) -> None:")

with open("backend/tests/test_crew.py", "w") as f:
    f.write(content)

with open("backend/tests/conftest.py", "r") as f:
    content = f.read()

content = content.replace("def test_user_id() -> str:", "def test_user_id() -> Any:")
content = content.replace("def authed_headers(test_user_id: str) -> dict[str, str]:", "def authed_headers(test_user_id: Any) -> dict[str, str]:")

with open("backend/tests/conftest.py", "w") as f:
    f.write(content)
