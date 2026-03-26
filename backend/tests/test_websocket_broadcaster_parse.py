from app.domain.chat.websocket_broadcaster import ChatWebSocketBroadcaster


def test_parse_transcript_single_agent():
    # Test fallback text parsing when single agent
    result = ChatWebSocketBroadcaster.parse_transcript("Hello, this is my message.", ["Agent A"])
    assert result == [("", "Hello, this is my message.")]

    # Test JSON parsing when single agent
    json_result = ChatWebSocketBroadcaster.parse_transcript(
        '{"message": "Hello from JSON."}', ["Agent A"]
    )
    assert json_result == [("", "Hello from JSON.")]


def test_parse_transcript_multi_agent():
    agent_names = ["Alice", "Bob"]

    # Test valid JSON multi agent format
    json_input = '{"messages": [{"agent_name": "Alice", "message": "Hi Bob!"}, {"agent_name": "Bob", "message": "Hello Alice."}]}'
    result = ChatWebSocketBroadcaster.parse_transcript(json_input, agent_names)
    assert result == [("Alice", "Hi Bob!"), ("Bob", "Hello Alice.")]

    # Test invalid JSON format falls back to raw string
    invalid_json = "This is not JSON."
    result2 = ChatWebSocketBroadcaster.parse_transcript(invalid_json, agent_names)
    assert result2 == [("", "This is not JSON.")]

    # Test valid JSON but missing keys
    bad_json_input = '{"messages": [{"wrong_key": "Alice", "message": "Hi Bob!"}]}'
    result3 = ChatWebSocketBroadcaster.parse_transcript(bad_json_input, agent_names)
    assert result3 == [("", bad_json_input)]


def test_parse_transcript_no_agents():
    result = ChatWebSocketBroadcaster.parse_transcript("Something", [])
    assert result == [("", "Something")]
