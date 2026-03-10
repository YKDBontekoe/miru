import re

def fix_lints():
    with open("frontend/lib/group_chat_page.dart", "r") as f:
        content = f.read()

    content = content.replace("if (mounted) setState(() => _isLoading = false);", "if (mounted) {\n        setState(() => _isLoading = false);\n      }")
    content = content.replace("if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error loading agents: $e')));", "if (context.mounted) {\n        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error loading agents: $e')));\n      }")
    content = content.replace("if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));", "if (context.mounted) {\n        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));\n      }")

    with open("frontend/lib/group_chat_page.dart", "w") as f:
        f.write(content)

    with open("frontend/lib/rooms_page.dart", "r") as f:
        content = f.read()

    content = content.replace("if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));", "if (context.mounted) {\n        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));\n      }")
    content = content.replace("if (mounted) setState(() => _isLoading = false);", "if (mounted) {\n        setState(() => _isLoading = false);\n      }")

    with open("frontend/lib/rooms_page.dart", "w") as f:
        f.write(content)

fix_lints()
