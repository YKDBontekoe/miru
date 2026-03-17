with open("frontend/lib/features/productivity/pages/action_page.dart", "r") as f:
    content = f.read()

content = content.replace(
    r'"${DateFormat(\'h:mm a\').format(event.startTime.toLocal())} - ${DateFormat(\'h:mm a\').format(event.endTime.toLocal())}",',
    r'"${DateFormat(\"h:mm a\").format(event.startTime.toLocal())} - ${DateFormat(\"h:mm a\").format(event.endTime.toLocal())}",'
)

with open("frontend/lib/features/productivity/pages/action_page.dart", "w") as f:
    f.write(content)
