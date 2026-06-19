import re

with open("backend/app/domain/chat/crew_orchestrator.py", "r") as f:
    content = f.read()

content = content.replace("return cast(ChatTranscript, result.pydantic)", "return cast('ChatTranscript', result.pydantic)")

with open("backend/app/domain/chat/crew_orchestrator.py", "w") as f:
    f.write(content)
