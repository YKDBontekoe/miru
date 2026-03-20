from collections.abc import Generator
from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from httpx import AsyncClient  # noqa: TC002

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


def test_upload_document(client: TestClient) -> None:
    from app.core.security.auth import get_current_user
    user_id = uuid4()
    mock_service = AsyncMock()
    mock_service.store_document_memory.return_value = [uuid4(), uuid4()]

    app.dependency_overrides[get_memory_service] = lambda: mock_service
    app.dependency_overrides[get_current_user] = lambda: user_id

    response = client.post(
        "/api/v1/memory/upload",
        files={"file": ("test.txt", b"Hello World", "text/plain")},
    )

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "2 chunks" in data["message"]
    assert len(data["memory_ids"]) == 2
    mock_service.store_document_memory.assert_awaited_once()


def test_upload_document_service_unavailable(client: TestClient) -> None:
    from app.core.security.auth import get_current_user
    from httpx import Request
    from openai import APIConnectionError

    user_id = uuid4()
    mock_service = AsyncMock()
    mock_service.store_document_memory.side_effect = APIConnectionError(
        request=Request("POST", "https://api.openai.com")
    )

    app.dependency_overrides[get_memory_service] = lambda: mock_service
    app.dependency_overrides[get_current_user] = lambda: user_id

    response = client.post(
        "/api/v1/memory/upload",
        files={"file": ("test.txt", b"Hello World", "text/plain")},
    )

    assert response.status_code == 503
    assert response.json() == {"detail": "Upstream AI service is currently unreachable"}
