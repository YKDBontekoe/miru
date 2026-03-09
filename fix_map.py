import re

def fix_map(filename):
    with open(filename, "r") as f:
        content = f.read()

    # Revert back the .map cast issue which was broken
    content = content.replace("e as Map<String, dynamic>", "Map<String, dynamic> e")

    with open(filename, "w") as f:
        f.write(content)

fix_map("frontend/lib/agents_page.dart")
fix_map("frontend/lib/rooms_page.dart")
fix_map("frontend/lib/group_chat_page.dart")

with open("frontend/lib/api_service.dart", "r") as f:
    content = f.read()

content = content.replace("throw ApiAuthException", "throw const ApiAuthException")
with open("frontend/lib/api_service.dart", "w") as f:
    f.write(content)
