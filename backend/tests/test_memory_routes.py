from starlette.testclient import TestClient
from collections.abc import Generator
from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from httpx import AsyncClient

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


@pytest.mark.asyncio
async def test_update_memory(client: TestClient) -> None:
    mock_service = AsyncMock()
    from app.core.security.auth import get_current_user

    app.dependency_overrides[get_current_user] = lambda: uuid4()
    from app.domain.memory.models import MemoryResponse

    mock_memory = MemoryResponse(
        id=uuid4(),
        user_id=uuid4(),
        agent_id=None,
        room_id=None,
        content="Updated",
        meta={},
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )
    mock_service.update_memory.return_value = mock_memory

    from app.api.dependencies import get_memory_service

    app.dependency_overrides[get_memory_service] = lambda: mock_service

    response = client.patch(
        "/api/v1/memory/" + str(mock_memory.id),
        json={"content": "Updated"},
        headers={"Authorization": "Bearer fake_token"},
    )
    assert response.status_code == 200
    assert response.json()["content"] == "Updated"


@pytest.mark.asyncio
async def test_update_memory_empty(client: TestClient) -> None:
    mock_service = AsyncMock()
    from app.core.security.auth import get_current_user

    app.dependency_overrides[get_current_user] = lambda: uuid4()

    from app.api.dependencies import get_memory_service

    app.dependency_overrides[get_memory_service] = lambda: mock_service

    response = client.patch(
        "/api/v1/memory/" + str(uuid4()), json={}, headers={"Authorization": "Bearer fake_token"}
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_merge_memories(client: TestClient) -> None:
    mock_service = AsyncMock()
    from app.core.security.auth import get_current_user

    app.dependency_overrides[get_current_user] = lambda: uuid4()
    new_id = uuid4()
    mock_service.merge_memories.return_value = new_id

    from app.api.dependencies import get_memory_service

    app.dependency_overrides[get_memory_service] = lambda: mock_service

    response = client.post(
        "/api/v1/memory/merge",
        json={"memory_ids": [str(uuid4()), str(uuid4())], "new_content": "Merged"},
        headers={"Authorization": "Bearer fake_token"},
    )
    assert response.status_code == 200
    assert response.json()["id"] == str(new_id)


@pytest.mark.asyncio
async def test_export_memories(client: TestClient) -> None:
    mock_service = AsyncMock()
    from app.core.security.auth import get_current_user

    app.dependency_overrides[get_current_user] = lambda: uuid4()
    mock_service.export_memories.return_value = '[{"id": "1", "content": "Exported"}]'

    from app.api.dependencies import get_memory_service

    app.dependency_overrides[get_memory_service] = lambda: mock_service

    response = client.get(
        "/api/v1/memory/export?format=json", headers={"Authorization": "Bearer fake_token"}
    )
    assert response.status_code == 200
    assert "Exported" in response.text


@pytest.mark.asyncio
async def test_get_on_this_day(client: TestClient) -> None:
    mock_service = AsyncMock()
    from app.core.security.auth import get_current_user

    app.dependency_overrides[get_current_user] = lambda: uuid4()
    from app.domain.memory.models import MemoryResponse

    mock_memory = MemoryResponse(
        id=uuid4(),
        user_id=uuid4(),
        agent_id=None,
        room_id=None,
        content="On this day",
        meta={},
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )
    mock_service.get_on_this_day.return_value = [mock_memory]

    from app.api.dependencies import get_memory_service

    app.dependency_overrides[get_memory_service] = lambda: mock_service

    response = client.get(
        "/api/v1/memory/on-this-day", headers={"Authorization": "Bearer fake_token"}
    )
    assert response.status_code == 200
    assert len(response.json()["memories"]) == 1


@pytest.mark.asyncio
async def test_list_collections(client: TestClient) -> None:
    mock_service = AsyncMock()
    from app.core.security.auth import get_current_user

    app.dependency_overrides[get_current_user] = lambda: uuid4()
    from app.domain.memory.models import MemoryCollectionResponse

    mock_col = MemoryCollectionResponse(
        id=uuid4(),
        user_id=uuid4(),
        name="Test Col",
        description=None,
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )
    mock_service.list_collections.return_value = [mock_col]

    from app.api.dependencies import get_memory_service

    app.dependency_overrides[get_memory_service] = lambda: mock_service

    response = client.get(
        "/api/v1/memory/collections", headers={"Authorization": "Bearer fake_token"}
    )
    assert response.status_code == 200
    assert len(response.json()["collections"]) == 1
    assert response.json()["collections"][0]["name"] == "Test Col"


@pytest.mark.asyncio
async def test_create_collection(client: TestClient) -> None:
    mock_service = AsyncMock()
    from app.core.security.auth import get_current_user

    app.dependency_overrides[get_current_user] = lambda: uuid4()
    from app.domain.memory.models import MemoryCollectionResponse

    mock_col = MemoryCollectionResponse(
        id=uuid4(),
        user_id=uuid4(),
        name="New Col",
        description="Desc",
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )
    mock_service.create_collection.return_value = mock_col

    from app.api.dependencies import get_memory_service

    app.dependency_overrides[get_memory_service] = lambda: mock_service

    response = client.post(
        "/api/v1/memory/collections",
        json={"name": "New Col", "description": "Desc"},
        headers={"Authorization": "Bearer fake_token"},
    )
    assert response.status_code == 200
    assert response.json()["name"] == "New Col"


@pytest.mark.asyncio
async def test_update_collection(client: TestClient) -> None:
    mock_service = AsyncMock()
    from app.core.security.auth import get_current_user

    app.dependency_overrides[get_current_user] = lambda: uuid4()
    from app.domain.memory.models import MemoryCollectionResponse

    col_id = uuid4()
    mock_col = MemoryCollectionResponse(
        id=col_id,
        user_id=uuid4(),
        name="Updated Col",
        description="Desc",
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )
    mock_service.update_collection.return_value = mock_col

    from app.api.dependencies import get_memory_service

    app.dependency_overrides[get_memory_service] = lambda: mock_service

    response = client.patch(
        "/api/v1/memory/collections/" + str(col_id),
        json={"name": "Updated Col"},
        headers={"Authorization": "Bearer fake_token"},
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Updated Col"


@pytest.mark.asyncio
async def test_delete_collection(client: TestClient) -> None:
    mock_service = AsyncMock()
    from app.core.security.auth import get_current_user

    app.dependency_overrides[get_current_user] = lambda: uuid4()
    mock_service.delete_collection.return_value = True

    from app.api.dependencies import get_memory_service

    app.dependency_overrides[get_memory_service] = lambda: mock_service

    response = client.delete(
        "/api/v1/memory/collections/" + str(uuid4()), headers={"Authorization": "Bearer fake_token"}
    )
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
