with open("backend/tests/test_agents.py", "r") as f:
    content = f.read()

content = content.replace("""async def test_stream_room_responses(
    mock_stream_chat: MagicMock,
    mock_retrieve_memories: MagicMock,
    mock_get_room_agents: MagicMock,
    mock_get_agents: MagicMock,
    mock_get_room_messages: MagicMock,
    mock_save_message: MagicMock
) -> None:
    mock_stream_chat,
    mock_retrieve_memories,
    mock_get_room_agents,
    mock_get_agents,
    mock_get_room_messages,
    mock_save_message
):""", """async def test_stream_room_responses(
    mock_stream_chat: MagicMock,
    mock_retrieve_memories: MagicMock,
    mock_get_room_agents: MagicMock,
    mock_get_agents: MagicMock,
    mock_get_room_messages: MagicMock,
    mock_save_message: MagicMock
) -> None:""")

with open("backend/tests/test_agents.py", "w") as f:
    f.write(content)
