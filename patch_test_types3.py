with open("backend/tests/test_chat_routes.py", "r") as f:
    content = f.read()

content = content.replace("from collections.abc import AsyncGenerator\n", "")
content = content.replace("from __future__ import annotations", "from __future__ import annotations\nfrom collections.abc import AsyncGenerator")
content = content.replace("self.capabilities = []", "self.capabilities: list = []")
content = content.replace("self.integrations = []", "self.integrations: list = []")
content = content.replace("self.goals = []", "self.goals: list = []")
content = content.replace("self.integration_configs = {}", "self.integration_configs: dict = {}")

with open("backend/tests/test_chat_routes.py", "w") as f:
    f.write(content)

with open("backend/tests/test_chat_feedback.py", "r") as f:
    content = f.read()

import re
content = re.sub(r"(            async def mock_stream\(\)) -> AsyncGenerator\[MagicMock, None\]:", r"\1 -> AsyncGenerator[MagicMock, None]:", content)

if "from collections.abc import AsyncGenerator" not in content:
    content = content.replace("from __future__ import annotations", "from __future__ import annotations\nfrom collections.abc import AsyncGenerator")

with open("backend/tests/test_chat_feedback.py", "w") as f:
    f.write(content)
