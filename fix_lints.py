import re

def fix_lints():
    # 1. agents_page.dart
    with open("frontend/lib/agents_page.dart", "r") as f:
        content = f.read()

    # fix if without braces
    content = content.replace("if (nameController.text.isEmpty ||\n                    personalityController.text.isEmpty)\n                  return;", "if (nameController.text.isEmpty ||\n                    personalityController.text.isEmpty) {\n                  return;\n                }")

    content = content.replace("if (mounted)\n                    ScaffoldMessenger.of(\n                      context,\n                    ).showSnackBar(SnackBar(content: Text('Error: $e')));", "if (mounted) {\n                    ScaffoldMessenger.of(\n                      context,\n                    ).showSnackBar(SnackBar(content: Text('Error: $e')));\n                  }")

    with open("frontend/lib/agents_page.dart", "w") as f:
        f.write(content)

    # 2. group_chat_page.dart
    with open("frontend/lib/group_chat_page.dart", "r") as f:
        content = f.read()

    content = content.replace("if (_messageController.text.trim().isEmpty || _isSending) return;", "if (_messageController.text.trim().isEmpty || _isSending) {\n      return;\n    }")
    content = content.replace("if (!mounted) break;", "if (!mounted) {\n          break;\n        }")
    content = content.replace("if (!mounted) return;", "if (!mounted) {\n        return;\n      }")

    content = content.replace("if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error adding: $e')));", "if (mounted) {\n                          ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error adding: $e')));\n                        }")

    content = content.replace("if (msg.isUser) return 'Me';", "if (msg.isUser) {\n      return 'Me';\n    }")

    content = content.replace("Theme.of(context).colorScheme.surfaceVariant", "Theme.of(context).colorScheme.surfaceContainerHighest")

    with open("frontend/lib/group_chat_page.dart", "w") as f:
        f.write(content)

    # 3. rooms_page.dart
    with open("frontend/lib/rooms_page.dart", "r") as f:
        content = f.read()

    content = content.replace("if (nameController.text.isEmpty) return;", "if (nameController.text.isEmpty) {\n                  return;\n                }")

    content = content.replace("if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));", "if (mounted) {\n                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));\n                }")

    content = content.replace("""      floatingActionButton: FloatingActionButton(
        onPressed: _showCreateRoomDialog,
        child: const Icon(Icons.add),
        tooltip: 'New Group Chat',
      ),""", """      floatingActionButton: FloatingActionButton(
        onPressed: _showCreateRoomDialog,
        tooltip: 'New Group Chat',
        child: const Icon(Icons.add),
      ),""")

    with open("frontend/lib/rooms_page.dart", "w") as f:
        f.write(content)

fix_lints()
