import re

with open("backend/tests/chat/test_chat_ws.py", "r") as f:
    content = f.read()

content = content.replace('''@pytest.mark.asyncio
async def test_create_step_callback(chat_service: ChatService) -> None:
    room_id = uuid4()
    with patch("app.infrastructure.websocket.manager.chat_hub") as mock_hub:''', '''@pytest.mark.asyncio
async def test_create_step_callback(chat_service: ChatService) -> None:
    room_id = uuid4()
    agent_names = ["Agent1"]
    with patch("app.infrastructure.websocket.manager.chat_hub") as mock_hub:''')

with open("backend/tests/chat/test_chat_ws.py", "w") as f:
    f.write(content)
