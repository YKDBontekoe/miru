import re

with open("frontend/app/(main)/chat/[id].tsx", "r") as f:
    content = f.read()

# Update placeholder to handle dynamic insertion
content = content.replace("placeholder={`Message ${roomAgents[0].name}...`}", "placeholder={t('chat.message_placeholder', { name: roomAgents[0]?.name || 'Agent' })}")
content = content.replace(">{roomAgents.map((a) => a.name).join(', ')} {roomAgents.length === 1 ? 'is' : 'are'} in this room.<", ">{t('chat.room_agents_status', { count: roomAgents.length, names: roomAgents.map((a) => a.name).join(', ') })}<")

with open("frontend/app/(main)/chat/[id].tsx", "w") as f:
    f.write(content)
