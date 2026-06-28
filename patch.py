with open('backend/tests/test_websocket_chat.py', 'r') as f:
    content = f.read()

content = content.replace(
    '        with patch("app.api.v1.websocket.ChatService", return_value=mock_service):\n            with client.websocket_connect("/api/v1/ws/chat?token=valid") as websocket:\n',
    '        with (\n            patch("app.api.v1.websocket.ChatService", return_value=mock_service),\n            client.websocket_connect("/api/v1/ws/chat?token=valid") as websocket,\n        ):\n'
)

with open('backend/tests/test_websocket_chat.py', 'w') as f:
    f.write(content)
