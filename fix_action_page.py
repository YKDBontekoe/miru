import re

with open("frontend/lib/features/productivity/pages/action_page.dart", "r") as f:
    content = f.read()

# Modify _showEventDialog to pass parameters
old_show = """  Future<void> _showEventDialog(
    BuildContext context, [
    CalendarEvent? existingEvent,
  ]) async {
    await showDialog(
      context: context,
      builder: (context) => _EventDialog(existingEvent: existingEvent),
    );
  }"""

new_show = """  Future<void> _showEventDialog(
    BuildContext context, [
    CalendarEvent? existingEvent,
  ]) async {
    final productivityService = ref.read(productivityServiceProvider);
    final onRefresh = () => ref.read(calendarEventsProvider.notifier).refresh();

    await showDialog(
      context: context,
      builder: (context) => _EventDialog(
        existingEvent: existingEvent,
        productivityService: productivityService,
        onRefresh: onRefresh,
      ),
    );
  }"""
content = content.replace(old_show, new_show)

# Replace the Dialog classes
old_dialog_pattern = r"class _EventDialog extends ConsumerStatefulWidget \{.*?\n\}"
old_dialog_match = re.search(old_dialog_pattern, content, re.DOTALL)
if old_dialog_match:
    new_dialog = """class _EventDialog extends StatefulWidget {
  final CalendarEvent? existingEvent;
  final ProductivityService productivityService;
  final VoidCallback onRefresh;

  const _EventDialog({
    this.existingEvent,
    required this.productivityService,
    required this.onRefresh,
  });

  @override
  State<_EventDialog> createState() => _EventDialogState();
}"""
    content = content.replace(old_dialog_match.group(0), new_dialog)

with open("frontend/lib/features/productivity/pages/action_page.dart", "w") as f:
    f.write(content)

print("Updated _showEventDialog and _EventDialog")
