import re

file_path = 'frontend/lib/features/productivity/pages/action_page.dart'

with open(file_path, 'r') as f:
    content = f.read()

# Make _showEventDialog async and wrap showDialog in try-finally
content = re.sub(
    r'void _showEventDialog\(',
    r'Future<void> _showEventDialog(',
    content
)

content = re.sub(
    r'(\s+)showDialog\(\s+context: context,\s+builder: \(context\) => StatefulBuilder\(',
    r'\1try {\n\1  await showDialog(\n\1    context: context,\n\1    builder: (context) => StatefulBuilder(',
    content
)

content = re.sub(
    r'(\s+)child: const Text\(\'Save\'\),\n(\s+),\n(\s+),\n(\s+),\n(\s+)\);',
    r'\1child: const Text(\'Save\'),\n\2,\n\3,\n\4,\n\5);\n\5} finally {\n\5  titleController.dispose();\n\5  descController.dispose();\n\5}',
    content
)

with open(file_path, 'w') as f:
    f.write(content)
