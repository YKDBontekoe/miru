with open("backend/app/domain/chat/service.py", "r") as f:
    content = f.read()

# Mypy correctly complained about `message.room_id` because the foreign key field is `room`
# Tortoise adds `_id` suffix under the hood but Mypy doesn't know it unless we use `getattr`.
content = content.replace("room = await self.chat_repo.get_room(message.room_id)", "room_id: UUID = getattr(message, 'room_id')  # noqa: B009\n        room = await self.chat_repo.get_room(room_id)")
content = content.replace("room_id=message.room_id,", "room_id=getattr(message, 'room_id'),  # noqa: B009")

with open("backend/app/domain/chat/service.py", "w") as f:
    f.write(content)
