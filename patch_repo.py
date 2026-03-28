import re
with open('backend/app/domain/chat/entities.py', 'r') as f:
    content = f.read()

content = content.replace(
    '    name: str\n    created_at: datetime',
    '    name: str\n    summary: str | None = None\n    created_at: datetime'
)
with open('backend/app/domain/chat/entities.py', 'w') as f:
    f.write(content)


with open('backend/app/infrastructure/repositories/chat_repo.py', 'r') as f:
    content = f.read()

content = content.replace(
    '        name=room.name,\n        created_at=room.created_at,',
    '        name=room.name,\n        summary=room.summary,\n        created_at=room.created_at,'
)

with open('backend/app/infrastructure/repositories/chat_repo.py', 'w') as f:
    f.write(content)
