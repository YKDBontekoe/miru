import re

with open('backend/tests/test_openrouter.py', 'r') as f:
    content = f.read()

content = content.replace("from app.infrastructure.external.openrouter import (", "from app.infrastructure.external.openrouter import (\n    stream_chat,")

with open('backend/tests/test_openrouter.py', 'w') as f:
    f.write(content)
