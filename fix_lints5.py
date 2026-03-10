import re

def fix_lints():
    with open("frontend/lib/rooms_page.dart", "r") as f:
        content = f.read()

    # Create dialog context needs to use its own context or be checked properly.
    # In flutter, if (context.mounted) works for the widget's context, but inside the builder
    # we have a local context. We can rename the dialog context.
    content = content.replace("builder: (context) {", "builder: (dialogContext) {")
    content = content.replace("Navigator.pop(context);", "Navigator.pop(dialogContext);")

    with open("frontend/lib/rooms_page.dart", "w") as f:
        f.write(content)

    with open("frontend/lib/group_chat_page.dart", "r") as f:
        content = f.read()
    content = content.replace("builder: (context) {", "builder: (dialogContext) {")
    content = content.replace("Navigator.pop(context);", "Navigator.pop(dialogContext);")
    content = content.replace("if (isAlreadyInRoom) return null;", "if (isAlreadyInRoom) {\n                        return null;\n                      }")

    with open("frontend/lib/group_chat_page.dart", "w") as f:
        f.write(content)

    with open("frontend/lib/agents_page.dart", "r") as f:
        content = f.read()
    content = content.replace("builder: (context) {", "builder: (dialogContext) {")
    content = content.replace("Navigator.pop(context);", "Navigator.pop(dialogContext);")
    with open("frontend/lib/agents_page.dart", "w") as f:
        f.write(content)


fix_lints()
