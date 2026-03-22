filepath = "backend/app/domain/productivity/use_cases/manage_productivity.py"

with open(filepath, "r") as f:
    content = f.read()

# Replace delete_task
content = content.replace(
"""    async def delete_task(self, user_id: UUID, task_id: UUID) -> None:
        \"\"\"Delete a specific task.\"\"\"
        # Ensure task exists
        await self.get_task(user_id, task_id)
        await self._repo.delete_task(user_id, task_id)""",
"""    async def delete_task(self, user_id: UUID, task_id: UUID) -> None:
        \"\"\"Delete a specific task.\"\"\"
        deleted_count = await self._repo.delete_task(user_id, task_id)
        if not deleted_count:
            raise TaskNotFoundError("Task not found")"""
)

# Replace delete_note
content = content.replace(
"""    async def delete_note(self, user_id: UUID, note_id: UUID) -> None:
        \"\"\"Delete a specific note.\"\"\"
        # Ensure note exists
        await self.get_note(user_id, note_id)
        await self._repo.delete_note(user_id, note_id)""",
"""    async def delete_note(self, user_id: UUID, note_id: UUID) -> None:
        \"\"\"Delete a specific note.\"\"\"
        deleted_count = await self._repo.delete_note(user_id, note_id)
        if not deleted_count:
            raise NoteNotFoundError("Note not found")"""
)

# Replace delete_event
content = content.replace(
"""    async def delete_event(self, user_id: UUID, event_id: UUID) -> None:
        \"\"\"Delete a specific calendar event.\"\"\"
        # Ensure event exists
        await self.get_event(user_id, event_id)
        await self._repo.delete_event(user_id, event_id)""",
"""    async def delete_event(self, user_id: UUID, event_id: UUID) -> None:
        \"\"\"Delete a specific calendar event.\"\"\"
        deleted_count = await self._repo.delete_event(user_id, event_id)
        if not deleted_count:
            raise CalendarEventNotFoundError("Calendar event not found")"""
)

with open(filepath, "w") as f:
    f.write(content)
