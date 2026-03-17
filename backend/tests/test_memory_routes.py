from collections.abc import Generator
from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.api.dependencies import get_memory_service
from app.core.security.auth import get_current_user
from app.domain.memory.models import Memory
from app.main import app


@pytest.fixture
def client() -> Generator[TestClient]:
    app.dependency_overrides = {}
    yield TestClient(app)
    app.dependency_overrides = {}


def test_list_memories_route(client: TestClient) -> None:
    user_id = uuid4()
    memory_id = uuid4()
    mock_memory = Memory(
        id=memory_id,
        user_id=user_id,
        content="Memory 1",
        embedding=[0.1, 0.2],
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )
    mock_service = MagicMock()
    mock_service.retrieve_memories = AsyncMock(return_value=[mock_memory])

    app.dependency_overrides[get_current_user] = lambda: user_id
    app.dependency_overrides[get_memory_service] = lambda: mock_service

    response = client.get("/api/v1/memory", headers={"Authorization": "Bearer fake_token"})

    assert response.status_code == 200
    data = response.json()
    assert "memories" in data
    assert len(data["memories"]) == 1
    assert data["memories"][0]["content"] == "Memory 1"
    assert data["memories"][0]["id"] == str(memory_id)


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
        json={"message": "Important fact"},
    )

    assert response.status_code == 200
    assert response.json()["id"] == str(memory_id)


def test_list_memories_route_network_error(client: TestClient) -> None:
    user_id = uuid4()
    mock_service = MagicMock()

    import httpx
    from openai import APIConnectionError

    request = httpx.Request("GET", "http://test")
    mock_service.retrieve_memories = AsyncMock(side_effect=APIConnectionError(request=request))

    app.dependency_overrides[get_current_user] = lambda: user_id
    app.dependency_overrides[get_memory_service] = lambda: mock_service

    response = client.get("/api/v1/memory", headers={"Authorization": "Bearer fake_token"})

    assert response.status_code == 503
    assert response.json() == {"detail": "Upstream AI service is currently unreachable"}


def test_delete_memory_route_success(client: TestClient) -> None:
    user_id = uuid4()
    memory_id = uuid4()
    mock_service = MagicMock()

    mock_service.delete_memory = AsyncMock(return_value=True)

    app.dependency_overrides[get_current_user] = lambda: user_id
    app.dependency_overrides[get_memory_service] = lambda: mock_service

    response = client.delete(
        f"/api/v1/memory/{memory_id}",
        headers={"Authorization": "Bearer fake_token"},
    )

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_delete_memory_route_not_found(client: TestClient) -> None:
    user_id = uuid4()
    memory_id = uuid4()
    mock_service = MagicMock()

    mock_service.delete_memory = AsyncMock(return_value=False)

    app.dependency_overrides[get_current_user] = lambda: user_id
    app.dependency_overrides[get_memory_service] = lambda: mock_service

    response = client.delete(
        f"/api/v1/memory/{memory_id}",
        headers={"Authorization": "Bearer fake_token"},
    )

    assert response.status_code == 404
    assert response.json() == {"detail": "Memory not found"}


def test_get_memory_graph_network_error(client: TestClient) -> None:
    user_id = uuid4()
    mock_service = MagicMock()

    import httpx
    from openai import APIConnectionError

    request = httpx.Request("GET", "http://test")
    mock_service.get_memory_graph = AsyncMock(side_effect=APIConnectionError(request=request))

    app.dependency_overrides[get_current_user] = lambda: user_id
    app.dependency_overrides[get_memory_service] = lambda: mock_service

    response = client.get("/api/v1/memory/graph", headers={"Authorization": "Bearer fake_token"})

    assert response.status_code == 503
    assert response.json() == {"detail": "Upstream AI service is currently unreachable"}


def test_get_memory_graph_oserror(client: TestClient) -> None:
    user_id = uuid4()
    mock_service = MagicMock()

    mock_service.get_memory_graph = AsyncMock(side_effect=OSError(101, "Network is unreachable"))

    app.dependency_overrides[get_current_user] = lambda: user_id
    app.dependency_overrides[get_memory_service] = lambda: mock_service

    response = client.get("/api/v1/memory/graph", headers={"Authorization": "Bearer fake_token"})

    assert response.status_code == 503
    assert response.json() == {"detail": "Upstream AI service is currently unreachable"}


def test_list_memories_route_oserror(client: TestClient) -> None:
    user_id = uuid4()
    mock_service = MagicMock()

    mock_service.retrieve_memories = AsyncMock(side_effect=OSError(101, "Network is unreachable"))

    app.dependency_overrides[get_current_user] = lambda: user_id
    app.dependency_overrides[get_memory_service] = lambda: mock_service

    response = client.get("/api/v1/memory", headers={"Authorization": "Bearer fake_token"})

    assert response.status_code == 503
    assert response.json() == {"detail": "Upstream AI service is currently unreachable"}


def test_store_memory_route_network_error(client: TestClient) -> None:
    user_id = uuid4()
    mock_service = MagicMock()

    import httpx
    from openai import APIConnectionError

    request = httpx.Request("POST", "http://test")
    mock_service.store_memory = AsyncMock(side_effect=APIConnectionError(request=request))

    app.dependency_overrides[get_current_user] = lambda: user_id
    app.dependency_overrides[get_memory_service] = lambda: mock_service

    response = client.post(
        "/api/v1/memory",
        headers={"Authorization": "Bearer fake_token"},
        json={"message": "Important fact"},
    )

    assert response.status_code == 503
    assert response.json() == {"detail": "Upstream AI service is currently unreachable"}


def test_store_memory_route_oserror(client: TestClient) -> None:
    user_id = uuid4()
    mock_service = MagicMock()

    mock_service.store_memory = AsyncMock(side_effect=OSError(101, "Network is unreachable"))

    app.dependency_overrides[get_current_user] = lambda: user_id
    app.dependency_overrides[get_memory_service] = lambda: mock_service

    response = client.post(
        "/api/v1/memory",
        headers={"Authorization": "Bearer fake_token"},
        json={"message": "Important fact"},
    )

    assert response.status_code == 503
    assert response.json() == {"detail": "Upstream AI service is currently unreachable"}
