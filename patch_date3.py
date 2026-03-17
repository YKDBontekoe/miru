with open("frontend/lib/features/productivity/pages/action_page.dart", "r") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "Text(" in line and "DateFormat" in line and "startTime" in line:
        lines[i] = "                                    \"${DateFormat('h:mm a').format(event.startTime.toLocal())} - ${DateFormat('h:mm a').format(event.endTime.toLocal())}\",\n"
    if "Text('Error loading events: \$e'))" in line:
        lines[i] = "        error: (e, _) => Center(child: Text('Error loading events: $e')),\n"
    if "Text('Error loading tasks: \$e'))" in line:
        lines[i] = "        error: (e, _) => Center(child: Text('Error loading tasks: $e')),\n"
    if "Text('Error loading notes: \$e'))" in line:
        lines[i] = "        error: (e, _) => Center(child: Text('Error loading notes: $e')),\n"
    if "Text('Failed to process request: \$e')" in line:
        lines[i] = "          content: Text('Failed to process request: $e'),\n"

with open("frontend/lib/features/productivity/pages/action_page.dart", "w") as f:
    f.writelines(lines)
