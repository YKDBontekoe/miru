import re

def fix_lints():
    with open("frontend/lib/group_chat_page.dart", "r") as f:
        content = f.read()

    content = content.replace("if (mounted)\n                                ScaffoldMessenger.of(context).showSnackBar(\n                                  SnackBar(content: Text('Error adding: $e')),\n                                );", "if (context.mounted) {\n                                ScaffoldMessenger.of(context).showSnackBar(\n                                  SnackBar(content: Text('Error adding: $e')),\n                                );\n                              }")

    with open("frontend/lib/group_chat_page.dart", "w") as f:
        f.write(content)

fix_lints()
