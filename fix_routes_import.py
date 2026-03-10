with open("backend/app/routes.py", "r") as f:
    content = f.read()

import_statement = """from app.agents import (
    AgentCreate,
    AgentResponse,
    ChatMessageCreate,
    ChatMessageResponse,
    RoomAgentAdd,
    RoomCreate,
    RoomResponse,
    add_agent_to_room,
    create_agent,
    create_room,
    get_agents,
    get_room_agents,
    get_room_messages,
    get_rooms,
    stream_room_responses,
)
"""

content = content.replace(import_statement, "")
content = content.replace("from app.auth import CurrentUser  # noqa: TC001", "from app.auth import CurrentUser  # noqa: TC001\n" + import_statement)

with open("backend/app/routes.py", "w") as f:
    f.write(content)
