import re

with open("frontend/lib/features/productivity/pages/action_page.dart", "r") as f:
    content = f.read()

# Fix the trailing parenthesis issue
old_trailing = """              : const Text('Save'),
        ),
        ),
      ],"""

new_trailing = """              : const Text('Save'),
        ),
      ],"""

content = content.replace(old_trailing, new_trailing)

with open("frontend/lib/features/productivity/pages/action_page.dart", "w") as f:
    f.write(content)
