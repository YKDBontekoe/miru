with open('backend/tests/test_chat_service.py', 'r') as f:
    lines = f.readlines()

new_lines = []
for i, line in enumerate(lines):
    if 'await asyncio.sleep(0.01)' in line:
        new_lines.append('        for _ in range(10):\n')
        new_lines.append('            if mock_hub.broadcast_to_room.call_count > 0:\n')
        new_lines.append('                break\n')
        new_lines.append('            await asyncio.sleep(0.01)\n')
    else:
        new_lines.append(line)

with open('backend/tests/test_chat_service.py', 'w') as f:
    f.writelines(new_lines)
