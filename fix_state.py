import re

with open("frontend/lib/features/productivity/pages/action_page.dart", "r") as f:
    content = f.read()

# Replace ConsumerState with State
content = content.replace("class _EventDialogState extends ConsumerState<_EventDialog>", "class _EventDialogState extends State<_EventDialog>")

# Fix setState for showTimePicker start
old_start_time = """                      if (time != null) {
                        setState(() {
                          _selectedStart = DateTime(
                            date.year,
                            date.month,
                            date.day,
                            time.hour,
                            time.minute,
                          );
                          if (_selectedEnd.isBefore(_selectedStart)) {
                            _selectedEnd = _selectedStart.add(
                              const Duration(hours: 1),
                            );
                          }
                        });
                      }"""

new_start_time = """                      if (time != null) {
                        if (!mounted) return;
                        setState(() {
                          _selectedStart = DateTime(
                            date.year,
                            date.month,
                            date.day,
                            time.hour,
                            time.minute,
                          );
                          if (_selectedEnd.isBefore(_selectedStart)) {
                            _selectedEnd = _selectedStart.add(
                              const Duration(hours: 1),
                            );
                          }
                        });
                      }"""
content = content.replace(old_start_time, new_start_time)

# Fix setState for showTimePicker end
old_end_time = """                      if (time != null) {
                        setState(() {
                          _selectedEnd = DateTime(
                            date.year,
                            date.month,
                            date.day,
                            time.hour,
                            time.minute,
                          );
                        });
                      }"""

new_end_time = """                      if (time != null) {
                        if (!mounted) return;
                        setState(() {
                          _selectedEnd = DateTime(
                            date.year,
                            date.month,
                            date.day,
                            time.hour,
                            time.minute,
                          );
                        });
                      }"""
content = content.replace(old_end_time, new_end_time)

with open("frontend/lib/features/productivity/pages/action_page.dart", "w") as f:
    f.write(content)

print("Fixed state and time pickers")
