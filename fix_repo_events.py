with open('backend/app/infrastructure/repositories/productivity_repo.py', 'r') as f:
    content = f.read()

content = content.replace(
'''    async def update_event(
        self, user_id: UUID, event_id: UUID, valid_keys: dict
    ) -> CalendarEventEntity | None:
        async with handle_db_errors("update calendar event"):
            event = await CalendarEvent.get_or_none(id=event_id, user_id=user_id).prefetch_related(
                "agent", "origin_message"
            )
            if not event:
                return None
            for field, value in valid_keys.items():
                setattr(event, field, value)
            await event.save(update_fields=list(valid_keys.keys()))
            # Fetch again to ensure relations are properly loaded
            event = await CalendarEvent.get_or_none(id=event_id, user_id=user_id).prefetch_related(
                "agent", "origin_message"
            )
            if not event:
                return None
            return _map_event(event)''',
'''    async def update_event(
        self, user_id: UUID, event_id: UUID, valid_keys: dict
    ) -> CalendarEventEntity | None:
        async with handle_db_errors("update calendar event"):
            event = await CalendarEvent.get_or_none(id=event_id, user_id=user_id).prefetch_related(
                "agent", "origin_message"
            )
            if not event:
                return None
            for field, value in valid_keys.items():
                setattr(event, field, value)
            await event.save(update_fields=list(valid_keys.keys()))
            # Fetch again to ensure relations are properly loaded
            event = await CalendarEvent.get_or_none(id=event_id, user_id=user_id).prefetch_related(
                "agent", "origin_message"
            )
            return _map_event(event)'''
)

with open('backend/app/infrastructure/repositories/productivity_repo.py', 'w') as f:
    f.write(content)
