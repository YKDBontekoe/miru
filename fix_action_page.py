import re

file_path = 'frontend/lib/features/productivity/pages/action_page.dart'

with open(file_path, 'r') as f:
    content = f.read()

# Make _showEventDialog async
content = content.replace("void _showEventDialog(", "Future<void> _showEventDialog(")

# Add try-finally wrapper for showDialog
content = re.sub(
    r'(\s+)showDialog\(\n\s+context: context,\n\s+builder: \(context\) => StatefulBuilder\(',
    r'\1try {\n\1  await showDialog(\n\1    context: context,\n\1    builder: (context) => StatefulBuilder(',
    content
)

# Add finally block
content = re.sub(
    r'(\s+)child: const Text\(\'Save\'\),\n\s+\),\n\s+\],\n\s+\);\n\s+\},\n\s+\),\n\s+\);',
    r'\1child: const Text(\'Save\'),\n            ),\n          ],\n        );\n      },\n    ),\n  );\n  } finally {\n    titleController.dispose();\n    descController.dispose();\n  }',
    content
)

# Replace the previous invalid validation block with a clean injection
content = content.replace(
"""                  if (selectedEnd.isBefore(selectedStart) ||
                      selectedEnd.isAtSameMomentAs(selectedStart)) {
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('End time must be after start time'),
                        ),
                      );
                    }
                    return;
                  }

                  final service = ref.read(productivityServiceProvider);
""", "                  final service = ref.read(productivityServiceProvider);")

validation_code = """
                  if (selectedEnd.isBefore(selectedStart) ||
                      selectedEnd.isAtSameMomentAs(selectedStart)) {
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('End time must be after start time'),
                        ),
                      );
                    }
                    return;
                  }

                  final service = ref.read(productivityServiceProvider);"""

content = content.replace("                  final service = ref.read(productivityServiceProvider);", validation_code)

with open(file_path, 'w') as f:
    f.write(content)
