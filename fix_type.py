import re

def fix_type(filename):
    with open(filename, "r") as f:
        content = f.read()

    # Revert back the .map cast issue which was broken
    content = content.replace("(Map<String, dynamic> e) =>", "(dynamic e) =>")
    content = content.replace(".fromJson(Map<String, dynamic> e)", ".fromJson(e as Map<String, dynamic>)")

    with open(filename, "w") as f:
        f.write(content)

fix_type("frontend/lib/agents_page.dart")
fix_type("frontend/lib/rooms_page.dart")
fix_type("frontend/lib/group_chat_page.dart")
