with open('backend/app/infrastructure/repositories/productivity_repo.py', 'r') as f:
    content = f.read()

content = content.replace(
'''    async def update_note(
        self, user_id: UUID, note_id: UUID, valid_keys: dict
    ) -> NoteEntity | None:
        async with handle_db_errors("update note"):
            note = await Note.get_or_none(id=note_id, user_id=user_id).prefetch_related(
                "agent", "origin_message"
            )
            if not note:
                return None
            for field, value in valid_keys.items():
                setattr(note, field, value)
            await note.save(update_fields=list(valid_keys.keys()))
            return _map_note(note)''',
'''    async def update_note(
        self, user_id: UUID, note_id: UUID, valid_keys: dict
    ) -> NoteEntity | None:
        async with handle_db_errors("update note"):
            note = await Note.get_or_none(id=note_id, user_id=user_id).prefetch_related(
                "agent", "origin_message"
            )
            if not note:
                return None
            for field, value in valid_keys.items():
                setattr(note, field, value)
            await note.save(update_fields=list(valid_keys.keys()))
            # Fetch again to ensure relations are properly loaded
            note = await Note.get_or_none(id=note_id, user_id=user_id).prefetch_related(
                "agent", "origin_message"
            )
            if not note:
                return None
            return _map_note(note)'''
)

with open('backend/app/infrastructure/repositories/productivity_repo.py', 'w') as f:
    f.write(content)
