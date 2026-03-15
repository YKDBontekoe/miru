import re

file_path = 'frontend/lib/features/productivity/pages/action_page.dart'

with open(file_path, 'r') as f:
    content = f.read()

# Make _showEventDialog properly async
content = re.sub(
    r'Future<void> _showEventDialog\(\n\s+BuildContext context,\n\s+WidgetRef ref, \[\n\s+CalendarEvent\? existingEvent,\n\s+\]\) {',
    r'Future<void> _showEventDialog(\n    BuildContext context,\n    WidgetRef ref, [\n    CalendarEvent? existingEvent,\n  ]) async {',
    content
)

with open(file_path, 'w') as f:
    f.write(content)
