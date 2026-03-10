import os

def fix_types(filename):
    with open(filename, "r") as f:
        content = f.read()

    content = content.replace("def test_openrouter(mock_client):", "def test_openrouter(mock_client: MagicMock) -> None:")
    content = content.replace("def test_memory(mock_client):", "def test_memory(mock_client: MagicMock) -> None:")
    content = content.replace("def test_crew(mock_client):", "def test_crew(mock_client: MagicMock) -> None:")
    content = content.replace("def test_detect_task_type():", "def test_detect_task_type() -> None:")
    content = content.replace("def test_run_crew(", "def test_run_crew(")
    content = content.replace("def mock_llm():", "def mock_llm() -> MagicMock:")

    with open(filename, "w") as f:
        f.write(content)

fix_types("backend/tests/test_openrouter.py")
fix_types("backend/tests/test_memory.py")
fix_types("backend/tests/test_crew.py")
