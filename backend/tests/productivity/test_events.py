from __future__ import annotations

import uuid

import pytest
from app.domain.productivity.models import CalendarEvent


@pytest.mark.asyncio
async def test_create_event(async_client, mock_user_id, override_get_current_user):
    from datetime import UTC, datetime, timedelta

    from app.domain.agents.models import Agent
    from app.infrastructure.database.models.chat_models import (ChatMessage,
                                                                ChatRoom)

    now = datetime.now(UTC)
    agent = await Agent.create(
        user_id=mock_user_id, name="Test Agent", description="Test", personality="Test"
    )
    room = await ChatRoom.create(user_id=mock_user_id, name="Test Room")
    msg = await ChatMessage.create(
        room=room, user_id=mock_user_id, message_type="user", content="Test"
    )
    mock_agent_id = str(agent.id)
    mock_message_id = str(msg.id)
    response = await async_client.post(
        "/api/v1/productivity/events",
        json={
            "title": "Test Event",
            "start_time": now.isoformat(),
            "end_time": (now + timedelta(hours=1)).isoformat(),
            "agent_id": mock_agent_id,
            "origin_message_id": mock_message_id,
        },
    )
    assert response.status_code == 201


@pytest.mark.asyncio
async def test_create_event_invalid_time(async_client, override_get_current_user):
    from datetime import UTC, datetime, timedelta

    now = datetime.now(UTC)
    response = await async_client.post(
        "/api/v1/productivity/events",
        json={
            "title": "Invalid Event",
            "start_time": now.isoformat(),
            "end_time": (now - timedelta(hours=1)).isoformat(),
        },
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_create_event_invalid_title(async_client, override_get_current_user):
    from datetime import UTC, datetime, timedelta

    now = datetime.now(UTC)
    response = await async_client.post(
        "/api/v1/productivity/events",
        json={
            "title": "a" * 256,
            "start_time": now.isoformat(),
            "end_time": (now + timedelta(hours=1)).isoformat(),
        },
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_list_events(async_client, mock_user_id, override_get_current_user):
    from datetime import UTC, datetime, timedelta

    now = datetime.now(UTC)
    await CalendarEvent.create(
        user_id=mock_user_id, title="Event 1", start_time=now, end_time=now + timedelta(hours=1)
    )
    response = await async_client.get("/api/v1/productivity/events")
    assert response.status_code == 200
    assert len(response.json()) == 1


@pytest.mark.asyncio
async def test_update_event(async_client, mock_user_id, override_get_current_user):
    from datetime import UTC, datetime, timedelta

    now = datetime.now(UTC)
    event = await CalendarEvent.create(
        user_id=mock_user_id, title="Event 1", start_time=now, end_time=now + timedelta(hours=1)
    )
    response = await async_client.patch(
        f"/api/v1/productivity/events/{event.id}", json={"title": "Updated Event"}
    )
    assert response.status_code == 200
    response = await async_client.patch(f"/api/v1/productivity/events/{event.id}", json={})
    assert response.status_code == 200
    response = await async_client.patch(
        f"/api/v1/productivity/events/{event.id}",
        json={"title": None, "start_time": None, "end_time": None, "is_all_day": None},
    )
    assert response.status_code == 200
    response = await async_client.patch(
        f"/api/v1/productivity/events/{event.id}",
        json={"end_time": (now - timedelta(hours=1)).isoformat()},
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_delete_event(async_client, mock_user_id, override_get_current_user):
    from datetime import UTC, datetime, timedelta

    now = datetime.now(UTC)
    event = await CalendarEvent.create(
        user_id=mock_user_id, title="Event 1", start_time=now, end_time=now + timedelta(hours=1)
    )
    response = await async_client.delete(f"/api/v1/productivity/events/{event.id}")
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_list_events_with_relations(async_client, mock_user_id, override_get_current_user):
    from datetime import UTC, datetime, timedelta

    from app.domain.agents.models import Agent
    from app.infrastructure.database.models.chat_models import (ChatMessage,
                                                                ChatRoom)

    now = datetime.now(UTC)
    agent = await Agent.create(
        id=uuid.uuid4(),
        user_id=mock_user_id,
        name="Test Agent",
        personality="Helpful",
        description="A helpful test agent",
    )
    room = await ChatRoom.create(id=uuid.uuid4(), user_id=mock_user_id, name="Test Room")
    msg = await ChatMessage.create(
        id=uuid.uuid4(), room_id=room.id, user_id=mock_user_id, content="Test Message", role="user"
    )
    await CalendarEvent.create(
        user_id=mock_user_id,
        title="Event with relations",
        start_time=now,
        end_time=now + timedelta(hours=1),
        agent_id=agent.id,
        origin_message_id=msg.id,
    )
    response = await async_client.get("/api/v1/productivity/events")
    assert response.status_code == 200
    assert len(response.json()) == 1


@pytest.mark.asyncio
async def test_update_event_not_found_or_forbidden(
    async_client, another_user_id, override_get_current_user
):
    from datetime import UTC, datetime, timedelta

    now = datetime.now(UTC)
    event = await CalendarEvent.create(
        user_id=another_user_id,
        title="Not my event",
        start_time=now,
        end_time=now + timedelta(hours=1),
    )
    response = await async_client.patch(
        f"/api/v1/productivity/events/{event.id}", json={"title": "Trying to update"}
    )
    assert response.status_code == 404
    response = await async_client.patch(
        f"/api/v1/productivity/events/{uuid.uuid4()}", json={"title": "Does not exist"}
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_delete_event_not_found_or_forbidden(
    async_client, another_user_id, override_get_current_user
):
    from datetime import UTC, datetime, timedelta

    now = datetime.now(UTC)
    event = await CalendarEvent.create(
        user_id=another_user_id,
        title="Not my event",
        start_time=now,
        end_time=now + timedelta(hours=1),
    )
    response = await async_client.delete(f"/api/v1/productivity/events/{event.id}")
    assert response.status_code == 404
    response = await async_client.delete(f"/api/v1/productivity/events/{uuid.uuid4()}")
    assert response.status_code == 404
