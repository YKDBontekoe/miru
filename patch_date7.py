with open("frontend/lib/features/productivity/pages/action_page.dart", "r") as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "Text(" in line and "DateFormat" in line and "startTime" in line:
        lines[i] = "                                    '${DateFormat(\\'h:mm a\\').format(event.startTime.toLocal())} - ${DateFormat(\\'h:mm a\\').format(event.endTime.toLocal())}',\n"

with open("frontend/lib/features/productivity/pages/action_page.dart", "w") as f:
    f.writelines(lines)
