import re

def fix_lints():
    with open("frontend/lib/agents_page.dart", "r") as f:
        content = f.read()

    content = content.replace("if (!context.mounted) return;\n                  ScaffoldMessenger.of(\n                    context,\n                    ).showSnackBar(SnackBar(content: Text('Error: $e')));", "if (!dialogContext.mounted) return;\n                  ScaffoldMessenger.of(\n                    dialogContext,\n                  ).showSnackBar(SnackBar(content: Text('Error: $e')));")

    with open("frontend/lib/agents_page.dart", "w") as f:
        f.write(content)

    with open("frontend/lib/rooms_page.dart", "r") as f:
        content = f.read()

    content = content.replace("if (!context.mounted) return;\n      ScaffoldMessenger.of(\n        context,\n      ).showSnackBar(SnackBar(content: Text('Error: $e')));", "if (!mounted) return;\n      ScaffoldMessenger.of(\n        context,\n      ).showSnackBar(SnackBar(content: Text('Error: $e')));")
    content = content.replace("if (!context.mounted) return;\n                  ScaffoldMessenger.of(\n                    context,\n                  ).showSnackBar(SnackBar(content: Text('Error: $e')));", "if (!dialogContext.mounted) return;\n                  ScaffoldMessenger.of(\n                    dialogContext,\n                  ).showSnackBar(SnackBar(content: Text('Error: $e')));")

    with open("frontend/lib/rooms_page.dart", "w") as f:
        f.write(content)

    with open("frontend/lib/group_chat_page.dart", "r") as f:
        content = f.read()

    content = content.replace("if (!context.mounted) return;\n      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));", "if (!mounted) return;\n      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));")
    content = content.replace("if (!context.mounted) return;\n      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to send: $e')));", "if (!mounted) return;\n      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to send: $e')));")
    content = content.replace("if (!context.mounted) return;\n      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error loading agents: $e')));", "if (!mounted) return;\n      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error loading agents: $e')));")
    content = content.replace("if (!context.mounted) return;\n                        ScaffoldMessenger.of(\n                          context,\n                        ).showSnackBar(SnackBar(content: Text('Error adding: $e')));", "if (!dialogContext.mounted) return;\n                        ScaffoldMessenger.of(\n                          dialogContext,\n                        ).showSnackBar(SnackBar(content: Text('Error adding: $e')));")

    with open("frontend/lib/group_chat_page.dart", "w") as f:
        f.write(content)

fix_lints()
