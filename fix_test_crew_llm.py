import re

filepath = 'backend/tests/test_chat_service.py'
with open(filepath, 'r') as f:
    content = f.read()

content = content.replace(
    'assert llm.additional_params.get("default_headers") == {"Accept-Language": "es-ES"}',
    'assert llm.accept_language == "es-ES"'
)
content = content.replace(
    'assert llm.additional_params.get("default_headers") is None',
    'assert llm.accept_language is None'
)

with open(filepath, 'w') as f:
    f.write(content)
