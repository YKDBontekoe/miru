import re

def fix_file(filename):
    with open(filename, "r") as f:
        content = f.read()

    # ApiService is fully static, so we can't instantiate it
    content = content.replace("final ApiService _apiService = ApiService();", "")
    content = content.replace("_apiService.", "ApiService.")

    with open(filename, "w") as f:
        f.write(content)

fix_file("frontend/lib/agents_page.dart")
fix_file("frontend/lib/rooms_page.dart")
fix_file("frontend/lib/group_chat_page.dart")

with open("frontend/lib/group_chat_page.dart", "r") as f:
    content = f.read()

content = content.replace("content: userMessageText,", "text: userMessageText,")

with open("frontend/lib/group_chat_page.dart", "w") as f:
    f.write(content)
