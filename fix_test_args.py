import re

with open("backend/tests/chat/test_chat_ws.py", "r") as f:
    content = f.read()

content = content.replace("room_id, typing.cast(\"list[typing.Any]\", room_agents), transcript, agent_names", "room_id, typing.cast(\"list[typing.Any]\", room_agents), transcript")

with open("backend/tests/chat/test_chat_ws.py", "w") as f:
    f.write(content)
