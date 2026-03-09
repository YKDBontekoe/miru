import re

with open("backend/app/routes.py", "r") as f:
    content = f.read()

# Remove the duplicated import block
content = re.sub(r"from app\.agents import \([\s\S]*?\)\n    AgentCreate[\s\S]*?\)",
    "from app.agents import (\n    AgentCreate, AgentResponse, RoomCreate, RoomResponse, RoomAgentAdd,\n    ChatMessageCreate, ChatMessageResponse,\n    create_agent, get_agents, create_room, get_rooms, add_agent_to_room,\n    get_room_agents, get_room_messages, stream_room_responses\n)", content)

with open("backend/app/routes.py", "w") as f:
    f.write(content)
