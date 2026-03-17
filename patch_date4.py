with open("frontend/lib/features/productivity/pages/action_page.dart", "r") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if r"Text('Failed to process request: \$e')" in line:
        lines[i] = "          content: Text('Failed to process request: $e'),\n"
    elif r"Text('Error loading events: \$e'))" in line:
        lines[i] = "        error: (e, _) => Center(child: Text('Error loading events: $e')),\n"
    elif r"Text('Error loading tasks: \$e'))" in line:
        lines[i] = "        error: (e, _) => Center(child: Text('Error loading tasks: $e')),\n"
    elif r"Text('Error loading notes: \$e'))" in line:
        lines[i] = "        error: (e, _) => Center(child: Text('Error loading notes: $e')),\n"

with open("frontend/lib/features/productivity/pages/action_page.dart", "w") as f:
    f.writelines(lines)
