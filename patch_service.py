import re

with open("app/domain/chat/service.py", "r") as f:
    content = f.read()

replacement = """        result = await crew.kickoff_async()

        # 5. Save agent response
        # In a hierarchical multi-agent response, attributing to a single agent
        # is incorrect, so we leave agent_id as None. Otherwise use the single agent's ID.
        agent_id_for_msg = None if len(db_agents) > 1 else db_agents[0].id

        agent_msg = ChatMessage(
            room_id=room_id,
            agent_id=agent_id_for_msg,
            content=str(result),
        )
        await self.chat_repo.save_message(agent_msg)"""

pattern = r"        result = await crew\.kickoff_async\(\)\n\n        # 5\. Save agent response\n        agent_msg = ChatMessage\(\n            room_id=room_id,\n            agent_id=db_agents\[0\]\.id,\n            content=str\(result\),\n        \)\n        await self\.chat_repo\.save_message\(agent_msg\)"

content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open("app/domain/chat/service.py", "w") as f:
    f.write(content)
