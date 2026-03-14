import pytest
import os

if __name__ == "__main__":
    os.system("uv run --extra dev coverage run -m pytest tests/test_chat_service.py")
    os.system("uv run --extra dev coverage report -m")
