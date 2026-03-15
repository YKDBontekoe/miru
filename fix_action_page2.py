import re

file_path = 'frontend/lib/features/productivity/pages/action_page.dart'

with open(file_path, 'r') as f:
    content = f.read()

# Make async
content = content.replace("void _showEventDialog(", "Future<void> _showEventDialog(")

# Inject try
content = re.sub(
    r'(    showDialog\()',
    r'    try {\n      await \1',
    content
)

# Inject finally
content = re.sub(
    r'(\s+child: const Text\(\'Save\'\),\n\s+\),\n\s+\],\n\s+\);\n\s+\},\n\s+\),\n\s+\);)',
    r'\1\n    } finally {\n      titleController.dispose();\n      descController.dispose();\n    }',
    content
)

# Add Validation
validation_code = """                  if (selectedEnd.isBefore(selectedStart) ||
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
