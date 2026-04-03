import re

file = 'backend/tests/test_infrastructure.py'
with open(file, 'r') as f:
    content = f.read()

content = re.sub(
    r'mock_client\.chat_completion\.assert_awaited_once_with\(\n\s*\[\{"role": "user", "content": "Hi"\}\], "custom/model", accept_language=None\n\s*\)',
    r'mock_client.chat_completion.assert_awaited_once_with(\n            [{"role": "user", "content": "Hi"}], "custom/model"\n        )',
    content
)

content = re.sub(
    r'client\.structured_completion\.assert_called_once_with\(\n\s*\[\{"role": "user", "content": "Hi"\}\], "model", ChatResponse, accept_language=None\n\s*\)',
    r'client.structured_completion.assert_called_once_with(\n            [{"role": "user", "content": "Hi"}], "model", ChatResponse\n        )',
    content
)

with open(file, 'w') as f:
    f.write(content)
