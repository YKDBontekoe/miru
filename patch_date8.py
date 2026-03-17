import re

with open("frontend/lib/features/productivity/pages/action_page.dart", "r") as f:
    content = f.read()

# Fix the string literal issue
content = re.sub(
    r'\"\$?\{DateFormat\(\\"h:mm a\\"\)\.format\(event\.startTime\.toLocal\(\)\)\} \- \$?\{DateFormat\(\\"h:mm a\\"\)\.format\(event\.endTime\.toLocal\(\)\)\}\"',
    r"'\${DateFormat(\'h:mm a\').format(event.startTime.toLocal())} - \${DateFormat(\'h:mm a\').format(event.endTime.toLocal())}'",
    content
)

# Also fix the weird string interpolation bug if there is one
content = content.replace('"${DateFormat(\\"h:mm a\\").format(event.startTime.toLocal())} - ${DateFormat(\\"h:mm a\\").format(event.endTime.toLocal())}",', "DateFormat('h:mm a').format(event.startTime.toLocal()) + ' - ' + DateFormat('h:mm a').format(event.endTime.toLocal()),")

with open("frontend/lib/features/productivity/pages/action_page.dart", "w") as f:
    f.write(content)
