from __future__ import annotations

import uuid

import pytest
from app.domain.productivity.models import Note


@pytest.mark.asyncio
async def test_create_note(async_client, mock_user_id, override_get_current_user):
    from app.domain.agents.models import Agent

    agent = await Agent.create(
        user_id=mock_user_id, name="Test Agent", description="Test", personality="Test"
    )
    mock_agent_id = str(agent.id)
    response = await async_client.post(
        "/api/v1/productivity/notes",
        json={"title": "Test Note", "content": "This is a test note.", "agent_id": mock_agent_id},
    )
    assert response.status_code == 201


@pytest.mark.asyncio
async def test_create_note_invalid_title(async_client, override_get_current_user):
    response = await async_client.post(
        "/api/v1/productivity/notes", json={"title": "a" * 256, "content": "This is a test note."}
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_list_notes(async_client, mock_user_id, another_user_id, override_get_current_user):
    await Note.create(user_id=mock_user_id, title="Note 1", content="C1")
    await Note.create(user_id=mock_user_id, title="Note 2", content="C2", is_pinned=True)
    await Note.create(user_id=another_user_id, title="Other User Note", content="O1")
    response = await async_client.get("/api/v1/productivity/notes")
    assert response.status_code == 200
    assert len(response.json()) == 2


@pytest.mark.asyncio
async def test_update_note(async_client, mock_user_id, override_get_current_user):
    note = await Note.create(user_id=mock_user_id, title="Old Note", content="Old content")
    response = await async_client.patch(
        f"/api/v1/productivity/notes/{note.id}", json={"is_pinned": True}
    )
    assert response.status_code == 200
    response = await async_client.patch(f"/api/v1/productivity/notes/{note.id}", json={})
    assert response.status_code == 200
    response = await async_client.patch(
        f"/api/v1/productivity/notes/{note.id}",
        json={"title": None, "content": None, "is_pinned": None},
    )
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_update_note_not_found_or_forbidden(
    async_client, another_user_id, override_get_current_user
):
    note = await Note.create(user_id=another_user_id, title="Not my note", content="C1")
    response = await async_client.patch(
        f"/api/v1/productivity/notes/{note.id}", json={"title": "Updated Note"}
    )
    assert response.status_code == 404
    response = await async_client.patch(
        f"/api/v1/productivity/notes/{uuid.uuid4()}", json={"title": "Does not exist"}
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_note(async_client, mock_user_id, override_get_current_user):
    note = await Note.create(user_id=mock_user_id, title="Note to Delete", content="Content")
    response = await async_client.delete(f"/api/v1/productivity/notes/{note.id}")
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_delete_note_not_found_or_forbidden(
    async_client, another_user_id, override_get_current_user
):
    note = await Note.create(user_id=another_user_id, title="Not my note", content="C1")
    response = await async_client.delete(f"/api/v1/productivity/notes/{note.id}")
    assert response.status_code == 404
    response = await async_client.delete(f"/api/v1/productivity/notes/{uuid.uuid4()}")
    assert response.status_code == 404
