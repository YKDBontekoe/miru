from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


@patch("app.routes.get_supabase")
def test_list_memories_route(mock_get_supabase: MagicMock) -> None:
    user_id = uuid4()
    mock_supabase = MagicMock()
    mock_get_supabase.return_value = mock_supabase

    mock_execute = MagicMock()
    mock_execute.data = [
        {"id": "mem1", "content": "The user likes coffee.", "created_at": "2024-01-01T00:00:00Z"}
    ]

    # Chain the mocks correctly
    mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.execute.return_value = (
        mock_execute
    )

    with patch("app.auth.decode_supabase_jwt", return_value={"sub": str(user_id)}):
        response = client.get("/api/memories", headers={"Authorization": "Bearer fake_token"})

    assert response.status_code == 200
    assert "memories" in response.json()
    assert len(response.json()["memories"]) == 1
    assert response.json()["memories"][0]["id"] == "mem1"


@patch("app.routes.get_supabase")
def test_delete_memory_route(mock_get_supabase: MagicMock) -> None:
    user_id = uuid4()
    mock_supabase = MagicMock()
    mock_get_supabase.return_value = mock_supabase

    # Mock verify ownership
    mock_verify_execute = MagicMock()
    mock_verify_execute.data = [{"id": "mem1"}]

    # Mock delete
    mock_delete_execute = MagicMock()
    mock_delete_execute.data = []

    # Chain for verify
    mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value = (
        mock_verify_execute
    )
    # Chain for delete
    mock_supabase.table.return_value.delete.return_value.eq.return_value.execute.return_value = (
        mock_delete_execute
    )

    with patch("app.auth.decode_supabase_jwt", return_value={"sub": str(user_id)}):
        response = client.delete(
            "/api/memories/mem1", headers={"Authorization": "Bearer fake_token"}
        )

    assert response.status_code == 200
    assert response.json() == {"status": "deleted"}


@patch("app.routes.get_supabase")
def test_delete_memory_route_not_found(mock_get_supabase: MagicMock) -> None:
    user_id = uuid4()
    mock_supabase = MagicMock()
    mock_get_supabase.return_value = mock_supabase

    # Mock verify ownership (not found)
    mock_verify_execute = MagicMock()
    mock_verify_execute.data = []

    mock_supabase.table.return_value.select.return_value.eq.return_value.eq.return_value.execute.return_value = (
        mock_verify_execute
    )

    with patch("app.auth.decode_supabase_jwt", return_value={"sub": str(user_id)}):
        response = client.delete(
            "/api/memories/mem1", headers={"Authorization": "Bearer fake_token"}
        )

    assert response.status_code == 404
    assert response.json()["detail"] == "Memory not found"


@patch("app.routes.get_memory_relationships", new_callable=AsyncMock)
@patch("app.routes.get_supabase")
def test_list_memory_graph_route(
    mock_get_supabase: MagicMock,
    mock_get_memory_relationships: AsyncMock,
) -> None:
    user_id = uuid4()
    mock_supabase = MagicMock()
    mock_get_supabase.return_value = mock_supabase

    mock_execute = MagicMock()
    mock_execute.data = [
        {
            "id": "mem1",
            "content": "The user likes coffee.",
            "created_at": "2024-01-01T00:00:00Z",
        },
        {
            "id": "mem2",
            "content": "The user works remotely.",
            "created_at": "2024-01-02T00:00:00Z",
        },
    ]

    mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.execute.return_value = (
        mock_execute
    )

    mock_get_memory_relationships.return_value = [
        {
            "source": "mem1",
            "target": "mem2",
            "relationship_type": "RELATED_TO",
        }
    ]

    with patch("app.auth.decode_supabase_jwt", return_value={"sub": str(user_id)}):
        response = client.get("/api/memories/graph", headers={"Authorization": "Bearer fake_token"})

    assert response.status_code == 200
    assert response.json() == {
        "nodes": [
            {
                "id": "mem1",
                "content": "The user likes coffee.",
                "created_at": "2024-01-01T00:00:00Z",
            },
            {
                "id": "mem2",
                "content": "The user works remotely.",
                "created_at": "2024-01-02T00:00:00Z",
            },
        ],
        "edges": [
            {
                "source": "mem1",
                "target": "mem2",
                "relationship_type": "RELATED_TO",
            }
        ],
    }
    mock_get_memory_relationships.assert_awaited_once_with(["mem1", "mem2"])


@patch("app.routes.get_memory_relationships", new_callable=AsyncMock)
@patch("app.routes.get_supabase")
def test_list_memory_graph_route_with_graph_error(
    mock_get_supabase: MagicMock,
    mock_get_memory_relationships: AsyncMock,
) -> None:
    user_id = uuid4()
    mock_supabase = MagicMock()
    mock_get_supabase.return_value = mock_supabase

    mock_execute = MagicMock()
    mock_execute.data = [
        {
            "id": "mem1",
            "content": "The user likes coffee.",
            "created_at": "2024-01-01T00:00:00Z",
        }
    ]
    mock_supabase.table.return_value.select.return_value.eq.return_value.order.return_value.execute.return_value = (
        mock_execute
    )

    mock_get_memory_relationships.side_effect = RuntimeError("Neo4j offline")

    with patch("app.auth.decode_supabase_jwt", return_value={"sub": str(user_id)}):
        response = client.get("/api/memories/graph", headers={"Authorization": "Bearer fake_token"})

    assert response.status_code == 200
    assert response.json() == {
        "nodes": [
            {
                "id": "mem1",
                "content": "The user likes coffee.",
                "created_at": "2024-01-01T00:00:00Z",
            }
        ],
        "edges": [],
    }
