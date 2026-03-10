import re
import os

def fix_types(filename):
    with open(filename, "r") as f:
        content = f.read()

    # Add -> None and -> Any appropriately to make mypy happy
    content = content.replace("def mock_supabase():", "def mock_supabase() -> MagicMock:")
    content = content.replace("def test_create_agent(mock_supabase):", "def test_create_agent(mock_supabase: MagicMock) -> None:")
    content = content.replace("def test_get_agents(mock_supabase):", "def test_get_agents(mock_supabase: MagicMock) -> None:")
    content = content.replace("def test_create_room(mock_supabase):", "def test_create_room(mock_supabase: MagicMock) -> None:")
    content = content.replace("def test_get_rooms(mock_supabase):", "def test_get_rooms(mock_supabase: MagicMock) -> None:")
    content = content.replace("def test_add_agent_to_room(mock_supabase):", "def test_add_agent_to_room(mock_supabase: MagicMock) -> None:")
    content = content.replace("def test_get_room_agents(mock_supabase):", "def test_get_room_agents(mock_supabase: MagicMock) -> None:")
    content = content.replace("def test_get_room_messages(mock_supabase):", "def test_get_room_messages(mock_supabase: MagicMock) -> None:")
    content = content.replace("def test_save_message_user(mock_supabase):", "def test_save_message_user(mock_supabase: MagicMock) -> None:")
    content = content.replace("def test_save_message_agent(mock_supabase):", "def test_save_message_agent(mock_supabase: MagicMock) -> None:")

    content = content.replace("def test_stream_room_responses(", "def test_stream_room_responses(")

    with open(filename, "w") as f:
        f.write(content)

fix_types("backend/tests/test_agents.py")

def fix_routes_types(filename):
    with open(filename, "r") as f:
        content = f.read()

    content = content.replace("def mock_current_user():", "def mock_current_user() -> Any:")
    content = content.replace("def override_auth():", "def override_auth() -> Any:")

    content = content.replace("def test_create_agent_route(mock_create_agent):", "def test_create_agent_route(mock_create_agent: MagicMock) -> None:")
    content = content.replace("def test_get_agents_route(mock_get_agents):", "def test_get_agents_route(mock_get_agents: MagicMock) -> None:")
    content = content.replace("def test_create_room_route(mock_create_room):", "def test_create_room_route(mock_create_room: MagicMock) -> None:")
    content = content.replace("def test_get_rooms_route(mock_get_rooms):", "def test_get_rooms_route(mock_get_rooms: MagicMock) -> None:")
    content = content.replace("def test_add_agent_to_room_route(mock_add):", "def test_add_agent_to_room_route(mock_add: MagicMock) -> None:")
    content = content.replace("def test_get_room_agents_route(mock_get):", "def test_get_room_agents_route(mock_get: MagicMock) -> None:")
    content = content.replace("def test_get_room_messages_route(mock_get):", "def test_get_room_messages_route(mock_get: MagicMock) -> None:")
    content = content.replace("def test_room_chat_route(mock_stream):", "def test_room_chat_route(mock_stream: MagicMock) -> None:")

    with open(filename, "w") as f:
        f.write(content)

fix_routes_types("backend/tests/test_agents_routes.py")
