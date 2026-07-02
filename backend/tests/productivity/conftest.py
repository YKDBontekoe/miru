from __future__ import annotations

import uuid
from collections.abc import AsyncGenerator, Generator

import pytest
import pytest_asyncio
from app.core.security.auth import get_current_user
from app.domain.productivity.models import CalendarEvent, Note, Task
from app.main import app
from httpx import ASGITransport, AsyncClient


@pytest_asyncio.fixture(autouse=True)
async def clear_productivity_db() -> AsyncGenerator[None]:
    await Task.all().delete()
    await Note.all().delete()
    await CalendarEvent.all().delete()
    from app.domain.agents.models import Agent
    from app.infrastructure.database.models.chat_models import (ChatMessage,
                                                                ChatRoom)

    await Agent.all().delete()
    await ChatRoom.all().delete()
    await ChatMessage.all().delete()
    yield
    await Task.all().delete()
    await Note.all().delete()
    await CalendarEvent.all().delete()
    from app.domain.agents.models import Agent
    from app.infrastructure.database.models.chat_models import (ChatMessage,
                                                                ChatRoom)

    await Agent.all().delete()
    await ChatRoom.all().delete()
    await ChatMessage.all().delete()


@pytest.fixture
def mock_user_id() -> uuid.UUID:
    return uuid.UUID("11111111-1111-1111-1111-111111111111")


@pytest.fixture
def another_user_id() -> uuid.UUID:
    return uuid.UUID("22222222-2222-2222-2222-222222222222")


@pytest.fixture
def override_get_current_user(mock_user_id: uuid.UUID) -> Generator[None]:
    app.dependency_overrides[get_current_user] = lambda: mock_user_id
    yield
    app.dependency_overrides.pop(get_current_user, None)


@pytest_asyncio.fixture
async def async_client() -> AsyncGenerator[AsyncClient]:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
