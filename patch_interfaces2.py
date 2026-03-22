filepath = "backend/app/domain/productivity/interfaces/repository.py"

with open(filepath, "r") as f:
    content = f.read()

content = content.replace("async def update_task(self, user_id: UUID, task_id: UUID, valid_keys: dict) -> TaskEntity:\n", "async def update_task(self, user_id: UUID, task_id: UUID, valid_keys: dict) -> TaskEntity | None:\n")
content = content.replace("async def update_note(self, user_id: UUID, note_id: UUID, valid_keys: dict) -> NoteEntity:\n", "async def update_note(self, user_id: UUID, note_id: UUID, valid_keys: dict) -> NoteEntity | None:\n")
content = content.replace("async def update_event(self, user_id: UUID, event_id: UUID, valid_keys: dict) -> CalendarEventEntity:\n", "async def update_event(self, user_id: UUID, event_id: UUID, valid_keys: dict) -> CalendarEventEntity | None:\n")

content = content.replace("async def delete_task(self, user_id: UUID, task_id: UUID) -> None:\n", "async def delete_task(self, user_id: UUID, task_id: UUID) -> int:\n")
content = content.replace("async def delete_note(self, user_id: UUID, note_id: UUID) -> None:\n", "async def delete_note(self, user_id: UUID, note_id: UUID) -> int:\n")
content = content.replace("async def delete_event(self, user_id: UUID, event_id: UUID) -> None:\n", "async def delete_event(self, user_id: UUID, event_id: UUID) -> int:\n")

with open(filepath, "w") as f:
    f.write(content)

filepath = "backend/app/domain/productivity/use_cases/manage_productivity.py"
with open(filepath, "r") as f:
    content = f.read()

content = content.replace("if not deleted_count:", "if deleted_count == 0:")

with open(filepath, "w") as f:
    f.write(content)
