from collections.abc import Generator
from datetime import UTC, datetime
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest
import httpx
from fastapi.testclient import TestClient
from openai import APIConnectionError

from app.api.dependencies import get_memory_service
from app.core.security.auth import get_current_user
from app.domain.memory.models import Memory, MemoryGraphResponse, MemoryRelationship
from app.main import app


@pytest.fixture
def client() -> Generator[TestClient, None, None]:
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


def test_get_memory_graph_route(client: TestClient) -> None:
    user_id = uuid4()
    memory_id = uuid4()
    mock_memory = Memory(
        id=memory_id,
        user_id=user_id,
        content="Graph memory",
        embedding=[0.3, 0.4],
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
    )

    mock_rel = MemoryRelationship(
        id=uuid4(),
        source_id=memory_id,
        target_id=memory_id,
        relationship_type="SIMILAR_TO",
        weight=0.9,
        meta={},
        created_at=datetime.now(UTC),
    )

    mock_service = MagicMock()
    mock_service.get_memory_graph = AsyncMock(
        return_value=MemoryGraphResponse.model_validate(
            {"nodes": [mock_memory], "edges": [mock_rel]}
        )
    )

    app.dependency_overrides[get_current_user] = lambda: user_id
    app.dependency_overrides[get_memory_service] = lambda: mock_service

    response = client.get("/api/v1/memory/graph", headers={"Authorization": "Bearer fake_token"})

    assert response.status_code == 200
    data = response.json()
    assert "nodes" in data
    assert "edges" in data
    assert len(data["nodes"]) == 1
    assert data["nodes"][0]["content"] == "Graph memory"
    assert len(data["edges"]) == 1
    assert data["edges"][0]["relationship_type"] == "SIMILAR_TO"


def test_list_memories_route_network_error(client: TestClient) -> None:
    user_id = uuid4()
    mock_service = MagicMock()

    request = httpx.Request("GET", "http://test")
    mock_service.retrieve_memories = AsyncMock(side_effect=APIConnectionError(request=request))

    app.dependency_overrides[get_current_user] = lambda: user_id
    app.dependency_overrides[get_memory_service] = lambda: mock_service

    response = client.get("/api/v1/memory", headers={"Authorization": "Bearer fake_token"})

    assert response.status_code == 503
    assert response.json() == {"detail": "Upstream AI service is currently unreachable"}


def test_store_memory_route_network_error(client: TestClient) -> None:
    user_id = uuid4()
    mock_service = MagicMock()

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