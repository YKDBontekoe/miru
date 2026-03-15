import re

with open("frontend/lib/features/productivity/pages/action_page.dart", "r") as f:
    content = f.read()

# Fix Save button
old_save_button = r"        ElevatedButton\(\n          onPressed: \(\) async \{.*?\n          \},(.*?\n.*?)\),"
old_save_button_match = re.search(old_save_button, content, re.DOTALL)

if old_save_button_match:
    print("Found save button")
    new_save_button = """        ElevatedButton(
          onPressed: _isSaving
              ? null
              : () async {
                  final title = _titleController.text.trim();
                  if (title.isEmpty) return;

                  if (_selectedEnd.isBefore(_selectedStart) ||
                      _selectedEnd.isAtSameMomentAs(_selectedStart)) {
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('End time must be after start time'),
                        ),
                      );
                    }
                    return;
                  }

                  setState(() {
                    _isSaving = true;
                  });

                  try {
                    if (widget.existingEvent == null) {
                      await widget.productivityService.createCalendarEvent(
                        CalendarEventCreate(
                          title: title,
                          description: _descController.text.trim(),
                          startTime: _selectedStart.toUtc(),
                          endTime: _selectedEnd.toUtc(),
                        ),
                      );
                    } else {
                      await widget.productivityService.updateCalendarEvent(
                        widget.existingEvent!.id,
                        CalendarEventUpdate(
                          title: title,
                          description: _descController.text.trim(),
                          startTime: _selectedStart.toUtc(),
                          endTime: _selectedEnd.toUtc(),
                        ),
                      );
                    }
                    if (context.mounted) {
                      Navigator.pop(context);
                      widget.onRefresh();
                    }
                  } catch (e) {
                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Failed to save event')),
                      );
                    }
                  } finally {
                    if (mounted) {
                      setState(() {
                        _isSaving = false;
                      });
                    }
                  }
                },
          child: _isSaving
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Text('Save'),
        ),"""
    content = content.replace(old_save_button_match.group(0), new_save_button)
else:
    print("Did not find save button")

with open("frontend/lib/features/productivity/pages/action_page.dart", "w") as f:
    f.write(content)
