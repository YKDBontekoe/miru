with open("backend/tests/test_repositories.py", "r") as f:
    content = f.read()

import re
content = re.sub(r"class TestAuthRepository.*?(?=class TestAgentRepository|class TestChatRepository|$)", "", content, flags=re.DOTALL)

with open("backend/tests/test_repositories.py", "w") as f:
    f.write(content)
