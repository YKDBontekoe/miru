import re

file_path = 'frontend/lib/features/productivity/pages/action_page.dart'

with open(file_path, 'r') as f:
    content = f.read()

# Add validation logic
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

                  final service = ref.read(productivityServiceProvider);
"""

content = re.sub(
    r'(\s+)final service = ref\.read\(productivityServiceProvider\);',
    validation_code,
    content
)

with open(file_path, 'w') as f:
    f.write(content)
