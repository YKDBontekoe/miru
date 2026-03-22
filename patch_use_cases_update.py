filepath = "backend/app/domain/productivity/use_cases/manage_productivity.py"

with open(filepath, "r") as f:
    content = f.read()

# Update update_task
content = content.replace(
"""        return await self._repo.update_task(user_id, task_id, valid_keys)""",
"""        updated_task = await self._repo.update_task(user_id, task_id, valid_keys)
        if not updated_task:
            raise TaskNotFoundError("Task not found")
        return updated_task"""
)

# Update update_note
content = content.replace(
"""        return await self._repo.update_note(user_id, note_id, valid_keys)""",
"""        updated_note = await self._repo.update_note(user_id, note_id, valid_keys)
        if not updated_note:
            raise NoteNotFoundError("Note not found")
        return updated_note"""
)

# Update update_event
content = content.replace(
"""        return await self._repo.update_event(user_id, event_id, valid_keys)""",
"""        updated_event = await self._repo.update_event(user_id, event_id, valid_keys)
        if not updated_event:
            raise CalendarEventNotFoundError("Calendar event not found")
        return updated_event"""
)

with open(filepath, "w") as f:
    f.write(content)
