import re
filepath = "backend/app/domain/productivity/interfaces/repository.py"

with open(filepath, "r") as f:
    content = f.read()

content = re.sub(r'async def update_task\(self, user_id: UUID, task_id: UUID, valid_keys: dict\) -> TaskEntity: \.\.\.', 'async def update_task(self, user_id: UUID, task_id: UUID, valid_keys: dict) -> TaskEntity | None: ...', content)
content = re.sub(r'async def update_note\(self, user_id: UUID, note_id: UUID, valid_keys: dict\) -> NoteEntity: \.\.\.', 'async def update_note(self, user_id: UUID, note_id: UUID, valid_keys: dict) -> NoteEntity | None: ...', content)
content = re.sub(r'async def update_event\(\n\s*self, user_id: UUID, event_id: UUID, valid_keys: dict\n\s*\) -> CalendarEventEntity: \.\.\.', 'async def update_event(\n        self, user_id: UUID, event_id: UUID, valid_keys: dict\n    ) -> CalendarEventEntity | None: ...', content)

content = re.sub(r'async def delete_task\(self, user_id: UUID, task_id: UUID\) -> None: \.\.\.', 'async def delete_task(self, user_id: UUID, task_id: UUID) -> int: ...', content)
content = re.sub(r'async def delete_note\(self, user_id: UUID, note_id: UUID\) -> None: \.\.\.', 'async def delete_note(self, user_id: UUID, note_id: UUID) -> int: ...', content)
content = re.sub(r'async def delete_event\(self, user_id: UUID, event_id: UUID\) -> None: \.\.\.', 'async def delete_event(self, user_id: UUID, event_id: UUID) -> int: ...', content)


with open(filepath, "w") as f:
    f.write(content)

filepath = "backend/app/domain/productivity/use_cases/manage_productivity.py"
with open(filepath, "r") as f:
    content = f.read()

content = content.replace("        if not valid_keys:\n            return task", "        if not valid_keys:\n            return task # type: ignore[return-value]")
content = content.replace("        if not valid_keys:\n            return note", "        if not valid_keys:\n            return note # type: ignore[return-value]")
content = content.replace("        if not valid_keys:\n            return event", "        if not valid_keys:\n            return event # type: ignore[return-value]")

with open(filepath, "w") as f:
    f.write(content)
