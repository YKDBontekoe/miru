import re

with open("backend/app/domain/chat/service.py", "r") as f:
    content = f.read()

content = content.replace('result_str = "\\n\\n".join(f"{msg.agent_name}: {msg.message}" for msg in result.messages)', 'result_str = str(result)')
content = content.replace('result_text = "\\n\\n".join(f"{msg.agent_name}: {msg.message}" for msg in result.messages)', 'result_text = str(result)')
content = content.replace('responded_agents = await self.ws_broadcaster.persist_and_broadcast_agent_response(\n                room_id, room_agents, result, agent_names\n            )', 'responded_agents = await self.ws_broadcaster.persist_and_broadcast_agent_response(\n                room_id, room_agents, result\n            )')

with open("backend/app/domain/chat/service.py", "w") as f:
    f.write(content)

with open("backend/app/domain/chat/websocket_broadcaster.py", "r") as f:
    content = f.read()

content = content.replace('''    async def persist_and_broadcast_agent_response(
        self,
        room_id: UUID,
        room_agents: list[Agent],
        result: ChatTranscript,
        agent_names: list[str],
    ) -> list[Agent]:''', '''    async def persist_and_broadcast_agent_response(
        self,
        room_id: UUID,
        room_agents: list[Agent],
        result: ChatTranscript,
    ) -> list[Agent]:''')

with open("backend/app/domain/chat/websocket_broadcaster.py", "w") as f:
    f.write(content)

with open("backend/app/domain/chat/crew_orchestrator.py", "r") as f:
    content = f.read()

content = content.replace('raise RuntimeError("Crew task failed to return a valid output.")', 'raise RuntimeError("LLM output failed to match the ChatTranscript schema validation.")')

with open("backend/app/domain/chat/crew_orchestrator.py", "w") as f:
    f.write(content)
