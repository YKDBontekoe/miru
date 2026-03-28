import re

with open('backend/tests/test_chat_service.py', 'r') as f:
    content = f.read()

content = content.replace(
'''        chat_service.bg_service.store_memories_background = (
            MagicMock()
        )  # Non-async mock so it doesn't return a coroutine
        chat_service.bg_service.update_room_summary_background = MagicMock()''',
'''        typing.cast("typing.Any", chat_service.bg_service).store_memories_background = MagicMock()
        typing.cast("typing.Any", chat_service.bg_service).update_room_summary_background = MagicMock()''')

with open('backend/tests/test_chat_service.py', 'w') as f:
    f.write(content)
