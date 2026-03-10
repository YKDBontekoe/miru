import re

def fix_lints():
    with open("frontend/lib/rooms_page.dart", "r") as f:
        content = f.read()

    content = content.replace("if (mounted)\n        ScaffoldMessenger.of(\n          context,\n        ).showSnackBar(SnackBar(content: Text('Error: $e')));", "if (context.mounted) {\n        ScaffoldMessenger.of(\n          context,\n        ).showSnackBar(SnackBar(content: Text('Error: $e')));\n      }")
    content = content.replace("if (mounted)\n                    ScaffoldMessenger.of(\n                      context,\n                    ).showSnackBar(SnackBar(content: Text('Error: $e')));", "if (context.mounted) {\n                    ScaffoldMessenger.of(\n                      context,\n                    ).showSnackBar(SnackBar(content: Text('Error: $e')));\n                  }")

    with open("frontend/lib/rooms_page.dart", "w") as f:
        f.write(content)

    with open("frontend/lib/group_chat_page.dart", "r") as f:
        content = f.read()

    content = content.replace("if (mounted)\n        ScaffoldMessenger.of(\n          context,\n        ).showSnackBar(SnackBar(content: Text('Error: $e')));", "if (context.mounted) {\n        ScaffoldMessenger.of(\n          context,\n        ).showSnackBar(SnackBar(content: Text('Error: $e')));\n      }")
    content = content.replace("if (mounted)\n        ScaffoldMessenger.of(\n          context,\n        ).showSnackBar(SnackBar(content: Text('Failed to send: $e')));", "if (context.mounted) {\n        ScaffoldMessenger.of(\n          context,\n        ).showSnackBar(SnackBar(content: Text('Failed to send: $e')));\n      }")
    content = content.replace("if (mounted)\n        ScaffoldMessenger.of(\n          context,\n        ).showSnackBar(SnackBar(content: Text('Error loading agents: $e')));", "if (context.mounted) {\n        ScaffoldMessenger.of(\n          context,\n        ).showSnackBar(SnackBar(content: Text('Error loading agents: $e')));\n      }")
    content = content.replace("if (mounted)\n                          ScaffoldMessenger.of(\n                            context,\n                          ).showSnackBar(SnackBar(content: Text('Error adding: $e')));", "if (context.mounted) {\n                          ScaffoldMessenger.of(\n                            context,\n                          ).showSnackBar(SnackBar(content: Text('Error adding: $e')));\n                        }")

    with open("frontend/lib/group_chat_page.dart", "w") as f:
        f.write(content)

fix_lints()
