import re

with open("backend/tests/chat/test_chat_ws.py", "r") as f:
    content = f.read()

content = content.replace("    agent_names = [\"Agent1\"]\n", "")

with open("backend/tests/chat/test_chat_ws.py", "w") as f:
    f.write(content)
