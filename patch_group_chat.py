import re

with open("frontend/lib/group_chat_page.dart", "r") as f:
    content = f.read()

# Fix the usage of createdAt versus timestamp
content = content.replace("createdAt: DateTime.now().toIso8601String(),", "timestamp: DateTime.now(),")

with open("frontend/lib/group_chat_page.dart", "w") as f:
    f.write(content)
