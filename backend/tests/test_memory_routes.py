from collections.abc import Generator
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.api.dependencies import get_memory_service
from app.core.security.auth import get_current_user
from app.main import app


@pytest.fixture
def client() -> Generator[TestClient]:
    app.dependency_overrides = {}
    yield TestClient(app)
    app.dependency_overrides = {}


def test_list_memories_route(client: TestClient) -> None:
    user_id = uuid4()
    mock_service = MagicMock()
    mock_service.retrieve_memories = AsyncMock(return_value=["Memory 1"])

    app.dependency_overrides[get_current_user] = lambda: user_id
    app.dependency_overrides[get_memory_service] = lambda: mock_service

    response = client.get("/api/v1/memory", headers={"Authorization": "Bearer fake_token"})

    assert response.status_code == 200
    assert response.json() == ["Memory 1"]


def test_store_memory_route(client: TestClient) -> None:
    user_id = uuid4()
    mock_service = MagicMock()
    memory_id = uuid4()
    mock_service.store_memory = AsyncMock(return_value=memory_id)

    app.dependency_overrides[get_current_user] = lambda: user_id
    app.dependency_overrides[get_memory_service] = lambda: mock_service

    response = client.post(
        "/api/v1/memory",
        headers={"Authorization": "Bearer fake_token"},
        json={"message": "Important fact"}
    )

    assert response.status_code == 200
    assert response.json()["id"] == str(memory_id)
