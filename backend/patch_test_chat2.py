import re

with open('backend/tests/test_chat_service.py', 'r') as f:
    content = f.read()

# Instead of patching async mocked methods which return coroutines that must be awaited,
# let's just make create_task return None and do nothing, or make the bg_service methods normal mocks.
content = content.replace(
'''        chat_service.bg_service.store_memories_background = AsyncMock()

        await chat_service.run_room_chat_ws(room_id, "Hello", user_id, accept_language="es-MX")''',
'''        chat_service.bg_service.store_memories_background = MagicMock() # Non-async mock so it doesn't return a coroutine
        chat_service.bg_service.update_room_summary_background = MagicMock()

        await chat_service.run_room_chat_ws(room_id, "Hello", user_id, accept_language="es-MX")''')

with open('backend/tests/test_chat_service.py', 'w') as f:
    f.write(content)
