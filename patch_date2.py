with open("frontend/lib/features/productivity/pages/action_page.dart", "r") as f:
    content = f.read()

# Let's fix the specific line
lines = content.split('\n')
for i, line in enumerate(lines):
    if "Text(" in line and "DateFormat" in line and "startTime" in line:
        lines[i] = "                                    \"${DateFormat('h:mm a').format(event.startTime.toLocal())} - ${DateFormat('h:mm a').format(event.endTime.toLocal())}\","

with open("frontend/lib/features/productivity/pages/action_page.dart", "w") as f:
    f.write('\n'.join(lines))
