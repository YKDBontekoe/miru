filepath = "backend/app/infrastructure/repositories/productivity_repo.py"

with open(filepath, "r") as f:
    content = f.read()

# Update update_task
content = content.replace(
"""    async def update_task(self, user_id: UUID, task_id: UUID, valid_keys: dict) -> TaskEntity:
        async with handle_db_errors("update task"):
            task = await Task.get(id=task_id, user_id=user_id)
            for field, value in valid_keys.items():
                setattr(task, field, value)
            await task.save(update_fields=list(valid_keys.keys()))
            return _map_task(task)""",
"""    async def update_task(self, user_id: UUID, task_id: UUID, valid_keys: dict) -> TaskEntity | None:
        async with handle_db_errors("update task"):
            task = await Task.get_or_none(id=task_id, user_id=user_id)
            if not task:
                return None
            for field, value in valid_keys.items():
                setattr(task, field, value)
            await task.save(update_fields=list(valid_keys.keys()))
            return _map_task(task)"""
)

# Update delete_task
content = content.replace(
"""    async def delete_task(self, user_id: UUID, task_id: UUID) -> None:
        async with handle_db_errors("delete task"):
            await Task.filter(id=task_id, user_id=user_id).delete()""",
"""    async def delete_task(self, user_id: UUID, task_id: UUID) -> int:
        async with handle_db_errors("delete task"):
            return await Task.filter(id=task_id, user_id=user_id).delete()"""
)


# Update update_note
content = content.replace(
"""    async def update_note(self, user_id: UUID, note_id: UUID, valid_keys: dict) -> NoteEntity:
        async with handle_db_errors("update note"):
            note = await Note.get(id=note_id, user_id=user_id).prefetch_related(
                "agent", "origin_message"
            )
            for field, value in valid_keys.items():
                setattr(note, field, value)
            await note.save(update_fields=list(valid_keys.keys()))
            return _map_note(note)""",
"""    async def update_note(self, user_id: UUID, note_id: UUID, valid_keys: dict) -> NoteEntity | None:
        async with handle_db_errors("update note"):
            note = await Note.get_or_none(id=note_id, user_id=user_id).prefetch_related(
                "agent", "origin_message"
            )
            if not note:
                return None
            for field, value in valid_keys.items():
                setattr(note, field, value)
            await note.save(update_fields=list(valid_keys.keys()))
            return _map_note(note)"""
)

# Update delete_note
content = content.replace(
"""    async def delete_note(self, user_id: UUID, note_id: UUID) -> None:
        async with handle_db_errors("delete note"):
            await Note.filter(id=note_id, user_id=user_id).delete()""",
"""    async def delete_note(self, user_id: UUID, note_id: UUID) -> int:
        async with handle_db_errors("delete note"):
            return await Note.filter(id=note_id, user_id=user_id).delete()"""
)

# Update update_event
content = content.replace(
"""    async def update_event(self, user_id: UUID, event_id: UUID, valid_keys: dict) -> CalendarEventEntity:
        async with handle_db_errors("update calendar event"):
            event = await CalendarEvent.get(id=event_id, user_id=user_id).prefetch_related(
                "agent", "origin_message"
            )
            for field, value in valid_keys.items():
                setattr(event, field, value)
            await event.save(update_fields=list(valid_keys.keys()))
            return _map_event(event)""",
"""    async def update_event(self, user_id: UUID, event_id: UUID, valid_keys: dict) -> CalendarEventEntity | None:
        async with handle_db_errors("update calendar event"):
            event = await CalendarEvent.get_or_none(id=event_id, user_id=user_id).prefetch_related(
                "agent", "origin_message"
            )
            if not event:
                return None
            for field, value in valid_keys.items():
                setattr(event, field, value)
            await event.save(update_fields=list(valid_keys.keys()))
            return _map_event(event)"""
)

# Update delete_event
content = content.replace(
"""    async def delete_event(self, user_id: UUID, event_id: UUID) -> None:
        async with handle_db_errors("delete calendar event"):
            await CalendarEvent.filter(id=event_id, user_id=user_id).delete()""",
"""    async def delete_event(self, user_id: UUID, event_id: UUID) -> int:
        async with handle_db_errors("delete calendar event"):
            return await CalendarEvent.filter(id=event_id, user_id=user_id).delete()"""
)


with open(filepath, "w") as f:
    f.write(content)
