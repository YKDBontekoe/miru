import re

with open("frontend/app/(main)/chat/[id].tsx", "r") as f:
    content = f.read()

content = content.replace("Start a conversation", "{t('chat.start_conversation')}")
content = content.replace(">Add an agent to get started.<", ">{t('chat.add_agent_to_start')}<")
content = content.replace(">Add an Agent<", ">{t('chat.add_an_agent')}<")
content = content.replace("No agents yet. Create one in the Agents tab.", "{t('chat.no_agents_create')}")

# Update placeholder to handle dynamic insertion
placeholder_original = "placeholder={`Message ${roomAgents[0]?.name || 'Agent'}...`}"
placeholder_new = "placeholder={t('chat.message_placeholder', { name: roomAgents[0]?.name || 'Agent' })}"
content = content.replace(placeholder_original, placeholder_new)
content = content.replace("placeholder={`Message ${roomAgents[0].name}...`}", placeholder_new)

# Update plural status for room agents
agents_status_original = "{roomAgents.map((a) => a.name).join(', ')} {roomAgents.length === 1 ? 'is' : 'are'} in this room."
agents_status_new = "{t('chat.room_agents_status', { count: roomAgents.length, names: roomAgents.map((a) => a.name).join(', ') })}"
content = content.replace(agents_status_original, agents_status_new)

with open("frontend/app/(main)/chat/[id].tsx", "w") as f:
    f.write(content)
