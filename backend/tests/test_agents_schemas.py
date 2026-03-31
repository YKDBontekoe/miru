from __future__ import annotations

from datetime import datetime
from unittest.mock import MagicMock
from uuid import UUID

from app.domain.agents.schemas import AgentResponse


def test_extract_capabilities_related_objects() -> None:
    # Test extract_capabilities with related_objects
    agent_id = UUID("12345678-1234-5678-1234-567812345678")

    cap_mock = MagicMock()
    cap_mock.pk = "cap_id_1"

    related_objects_mock = MagicMock()
    related_objects_mock.related_objects = [cap_mock]

    data: dict = {
        "id": agent_id,
        "name": "Test",
        "personality": "Friendly",
        "description": "A test agent",
        "status": "active",
        "mood": "Neutral",
        "goals": [],
        "capabilities": related_objects_mock,
        "integrations": [],
        "integration_configs": {},
        "message_count": 0,
        "created_at": datetime(2025, 1, 1, 12, 0),
        "updated_at": datetime(2025, 1, 1, 12, 0),
    }
    response = AgentResponse(**data)
    assert response.capabilities == ["cap_id_1"]


def test_extract_capabilities_plain_list() -> None:
    # Test extract_capabilities with a plain list instead of Tortoise related_objects
    agent_id = UUID("12345678-1234-5678-1234-567812345678")
    data: dict = {
        "id": agent_id,
        "name": "Test",
        "personality": "Friendly",
        "description": "A test agent",
        "status": "active",
        "mood": "Neutral",
        "goals": [],
        "capabilities": ["cap1", "cap2"],
        "integrations": [],
        "integration_configs": {},
        "message_count": 0,
        "created_at": datetime(2025, 1, 1, 12, 0),
        "updated_at": datetime(2025, 1, 1, 12, 0),
    }
    response = AgentResponse(**data)
    assert response.capabilities == ["cap1", "cap2"]


def test_extract_capabilities_empty() -> None:
    # Test extract_capabilities with a falsy value
    agent_id = UUID("12345678-1234-5678-1234-567812345678")
    data: dict = {
        "id": agent_id,
        "name": "Test",
        "personality": "Friendly",
        "description": "A test agent",
        "status": "active",
        "mood": "Neutral",
        "goals": [],
        "capabilities": None,
        "integrations": [],
        "integration_configs": {},
        "message_count": 0,
        "created_at": datetime(2025, 1, 1, 12, 0),
        "updated_at": datetime(2025, 1, 1, 12, 0),
    }
    response = AgentResponse(**data)
    assert response.capabilities == []


def test_extract_integrations_related_objects_no_integration_id() -> None:
    # Test extract_integrations with related_objects missing integration_id (should fall back to pk)
    agent_id = UUID("12345678-1234-5678-1234-567812345678")

    int_mock = MagicMock()
    del int_mock.integration_id  # ensure it doesn't have it
    int_mock.pk = "int_pk_1"
    int_mock.enabled = True

    related_objects_mock = MagicMock()
    related_objects_mock.related_objects = [int_mock]

    data: dict = {
        "id": agent_id,
        "name": "Test",
        "personality": "Friendly",
        "description": "A test agent",
        "status": "active",
        "mood": "Neutral",
        "goals": [],
        "capabilities": [],
        "integrations": related_objects_mock,
        "integration_configs": {},
        "message_count": 0,
        "created_at": datetime(2025, 1, 1, 12, 0),
        "updated_at": datetime(2025, 1, 1, 12, 0),
    }
    response = AgentResponse(**data)
    assert response.integrations == ["int_pk_1"]


def test_extract_integrations_iterable_no_id() -> None:
    # Test extract_integrations with an iterable whose items do not have integration_id
    class ItemNoId:
        def __init__(self, val):
            self.val = val

        def __str__(self):
            return str(self.val)

    agent_id = UUID("12345678-1234-5678-1234-567812345678")
    data: dict = {
        "id": agent_id,
        "name": "Test",
        "personality": "Friendly",
        "description": "A test agent",
        "status": "active",
        "mood": "Neutral",
        "goals": [],
        "capabilities": [],
        "integrations": [ItemNoId("int1"), ItemNoId("int2")],
        "integration_configs": {},
        "message_count": 0,
        "created_at": datetime(2025, 1, 1, 12, 0),
        "updated_at": datetime(2025, 1, 1, 12, 0),
    }
    response = AgentResponse(**data)
    # The str() is called on the items
    assert response.integrations == ["int1", "int2"]


def test_extract_integrations_iterable_with_id() -> None:
    # Test extract_integrations with an iterable whose items have integration_id
    class ItemWithId:
        def __init__(self, val, enabled=True):
            self.integration_id = val
            self.enabled = enabled

    agent_id = UUID("12345678-1234-5678-1234-567812345678")
    data: dict = {
        "id": agent_id,
        "name": "Test",
        "personality": "Friendly",
        "description": "A test agent",
        "status": "active",
        "mood": "Neutral",
        "goals": [],
        "capabilities": [],
        "integrations": [ItemWithId("int1"), ItemWithId("int2", enabled=False), ItemWithId("int3")],
        "integration_configs": {},
        "message_count": 0,
        "created_at": datetime(2025, 1, 1, 12, 0),
        "updated_at": datetime(2025, 1, 1, 12, 0),
    }
    response = AgentResponse(**data)
    # item 2 is disabled so it shouldn't be extracted
    assert response.integrations == ["int1", "int3"]


def test_extract_integrations_empty() -> None:
    # Test extract_integrations with a falsy value
    agent_id = UUID("12345678-1234-5678-1234-567812345678")
    data: dict = {
        "id": agent_id,
        "name": "Test",
        "personality": "Friendly",
        "description": "A test agent",
        "status": "active",
        "mood": "Neutral",
        "goals": [],
        "capabilities": [],
        "integrations": None,
        "integration_configs": {},
        "message_count": 0,
        "created_at": datetime(2025, 1, 1, 12, 0),
        "updated_at": datetime(2025, 1, 1, 12, 0),
    }
    response = AgentResponse(**data)
    assert response.integrations == []


def test_extract_integrations_related_objects_with_integration_id() -> None:
    # Test extract_integrations with related_objects where items have integration_id
    agent_id = UUID("12345678-1234-5678-1234-567812345678")

    int_mock1 = MagicMock()
    int_mock1.integration_id = "int_id_1"
    int_mock1.enabled = True

    int_mock2 = MagicMock()
    int_mock2.integration_id = "int_id_2"
    int_mock2.enabled = False

    related_objects_mock = MagicMock()
    related_objects_mock.related_objects = [int_mock1, int_mock2]

    data: dict = {
        "id": agent_id,
        "name": "Test",
        "personality": "Friendly",
        "description": "A test agent",
        "status": "active",
        "mood": "Neutral",
        "goals": [],
        "capabilities": [],
        "integrations": related_objects_mock,
        "integration_configs": {},
        "message_count": 0,
        "created_at": datetime(2025, 1, 1, 12, 0),
        "updated_at": datetime(2025, 1, 1, 12, 0),
    }
    response = AgentResponse(**data)
    assert response.integrations == ["int_id_1"]
