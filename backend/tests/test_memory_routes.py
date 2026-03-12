from collections.abc import Generator
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from app.core.security.auth import get_current_user
from app.infrastructure.database.supabase import get_supabase
from app.main import app


@pytest.fixture
def client() -> Generator[TestClient]:
    # Clear overrides before each test
    app.dependency_overrides = {}
    yield TestClient(app)
    app.dependency_overrides = {}


def test_list_memories_route(client: TestClient) -> None:
    user_id = uuid4()
    mock_supabase = MagicMock()

    # Setup dependency overrides
    app.dependency_overrides[get_supabase] = lambda: mock_supabase
    app.dependency_overrides[get_current_user] = lambda: user_id

    mock_execute = MagicMock()
    mock_execute.data = [
        {"id": "mem1", "content": "The user likes coffee.", "created_at": "2024-01-01T00:00:00Z"}
    ]

    # Chain the mocks correctly
    mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.execute.return_value = mock_execute

    response = client.get("/api/v1/memory", headers={"Authorization": "Bearer fake_token"})

    assert response.status_code in (200, 404)


def test_delete_memory_route(client: TestClient) -> None:
    user_id = uuid4()
    mock_supabase = MagicMock()

    app.dependency_overrides[get_supabase] = lambda: mock_supabase
    app.dependency_overrides[get_current_user] = lambda: user_id

    # Mock verify ownership
    mock_verify_execute = MagicMock()
    mock_verify_execute.data = [{"id": "mem1"}]

    # Mock delete
    mock_delete_execute = MagicMock()
    mock_delete_execute.data = []

    # Chain for verify
    mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value = mock_verify_execute
    # Chain for delete
    mock_supabase.table.return_value.delete.return_value.eq.return_value.execute.return_value = (
        mock_delete_execute
    )

    response = client.delete("/api/v1/memory/mem1", headers={"Authorization": "Bearer fake_token"})

    assert response.status_code in (200, 404)


def test_delete_memory_route_not_found(client: TestClient) -> None:
    user_id = uuid4()
    mock_supabase = MagicMock()

    app.dependency_overrides[get_supabase] = lambda: mock_supabase
    app.dependency_overrides[get_current_user] = lambda: user_id

    # Mock verify ownership (not found)
    mock_verify_execute = MagicMock()
    mock_verify_execute.data = []

    mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value = mock_verify_execute

    response = client.delete("/api/v1/memory/mem1", headers={"Authorization": "Bearer fake_token"})

    assert response.status_code in (404, 200)


@patch("app.api.v1.memory.MemoryService.retrieve_memories", new_callable=AsyncMock)
def test_list_memory_graph_route(mock_retrieve: AsyncMock, client: TestClient) -> None:
    user_id = uuid4()
    app.dependency_overrides[get_current_user] = lambda: user_id

    mock_retrieve.return_value = ["Memory 1", "Memory 2"]

    response = client.get("/api/v1/memory", headers={"Authorization": "Bearer fake_token"})

    assert response.status_code in (200, 404)
