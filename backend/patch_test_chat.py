import re

with open('backend/tests/test_chat_service.py', 'r') as f:
    content = f.read()

# Mock the bg_service explicitly to prevent real coroutines from being created and garbage collected unawaited
content = content.replace(
'''        # Return empty list so no mood/affinity tasks are scheduled
        m_agent_resp.return_value = []
        m_create_task.return_value = MagicMock()

        await chat_service.run_room_chat_ws(room_id, "Hello", user_id, accept_language="es-MX")''',
'''        # Return empty list so no mood/affinity tasks are scheduled
        m_agent_resp.return_value = []
        m_create_task.return_value = MagicMock()

        chat_service.bg_service.store_memories_background = AsyncMock()

        await chat_service.run_room_chat_ws(room_id, "Hello", user_id, accept_language="es-MX")''')

with open('backend/tests/test_chat_service.py', 'w') as f:
    f.write(content)
