import re

with open("backend/app/domain/chat/crew_orchestrator.py", "r") as f:
    content = f.read()

content = content.replace('from typing import TYPE_CHECKING, Any', 'from typing import TYPE_CHECKING, Any, cast')

with open("backend/app/domain/chat/crew_orchestrator.py", "w") as f:
    f.write(content)
