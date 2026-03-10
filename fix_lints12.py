import re

def fix_lints():
    with open("frontend/lib/group_chat_page.dart", "r") as f:
        content = f.read()

    # The issue is that `context` in ScaffoldMessenger.of(context) might not be mounted.
    # But wait, it is checked with `if (context.mounted)`. Why is flutter complaining?
    # Because `if (!mounted) return;` is considered the standard way or because we should use `if (!mounted)` instead of `if (context.mounted)`.
    # Let's change it to if (!mounted) return;
    content = content.replace("if (context.mounted) {\n        ScaffoldMessenger.of(\n          context,\n        ).showSnackBar(SnackBar(content: Text('Error: $e')));\n      }", "if (!mounted) return;\n      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));")
    content = content.replace("if (context.mounted) {\n        ScaffoldMessenger.of(\n          context,\n        ).showSnackBar(SnackBar(content: Text('Failed to send: $e')));\n      }", "if (!mounted) return;\n      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed to send: $e')));")
    content = content.replace("if (context.mounted) {\n        ScaffoldMessenger.of(\n          context,\n        ).showSnackBar(SnackBar(content: Text('Error loading agents: $e')));\n      }", "if (!mounted) return;\n      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error loading agents: $e')));")

    # In the builder dialogContext
    content = content.replace("if (context.mounted) {\n                                ScaffoldMessenger.of(context).showSnackBar(\n                                  SnackBar(content: Text('Error adding: $e')),\n                                );\n                              }", "if (!dialogContext.mounted) return;\n                              ScaffoldMessenger.of(dialogContext).showSnackBar(\n                                SnackBar(content: Text('Error adding: $e')),\n                              );")

    with open("frontend/lib/group_chat_page.dart", "w") as f:
        f.write(content)

    with open("frontend/lib/agents_page.dart", "r") as f:
        content = f.read()

    content = content.replace("if (context.mounted) {\n        ScaffoldMessenger.of(\n          context,\n        ).showSnackBar(SnackBar(content: Text('Error loading agents: $e')));\n      }", "if (!mounted) return;\n      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error loading agents: $e')));")
    content = content.replace("if (!context.mounted) return;\n                  ScaffoldMessenger.of(\n                    context,\n                    ).showSnackBar(SnackBar(content: Text('Error: $e')));", "if (!dialogContext.mounted) return;\n                  ScaffoldMessenger.of(dialogContext).showSnackBar(SnackBar(content: Text('Error: $e')));")

    with open("frontend/lib/agents_page.dart", "w") as f:
        f.write(content)

    with open("frontend/lib/rooms_page.dart", "r") as f:
        content = f.read()

    content = content.replace("if (context.mounted) {\n        ScaffoldMessenger.of(\n          context,\n        ).showSnackBar(SnackBar(content: Text('Error: $e')));\n      }", "if (!mounted) return;\n      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));")
    content = content.replace("if (!dialogContext.mounted) return;\n                  ScaffoldMessenger.of(\n                    dialogContext,\n                  ).showSnackBar(SnackBar(content: Text('Error: $e')));", "if (!dialogContext.mounted) return;\n                  ScaffoldMessenger.of(dialogContext).showSnackBar(SnackBar(content: Text('Error: $e')));")

    with open("frontend/lib/rooms_page.dart", "w") as f:
        f.write(content)

fix_lints()
