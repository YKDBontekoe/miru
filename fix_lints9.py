import re

def fix_lints():
    with open("frontend/lib/group_chat_page.dart", "r") as f:
        content = f.read()

    content = content.replace("if (!context.mounted) return;\n      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));", "if (context.mounted) {\n        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));\n      }")
    content = content.replace("if (!context.mounted) return;\n      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to send: $e')));", "if (context.mounted) {\n        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to send: $e')));\n      }")
    content = content.replace("if (!context.mounted) return;\n      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error loading agents: $e')));", "if (context.mounted) {\n        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error loading agents: $e')));\n      }")

    with open("frontend/lib/group_chat_page.dart", "w") as f:
        f.write(content)

fix_lints()
