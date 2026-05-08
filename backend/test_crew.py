import asyncio
import os
import sys

sys.path.insert(0, os.path.abspath("backend"))

from app.domain.chat.crew_orchestrator import CrewOrchestrator
from pydantic import BaseModel

class AgentMessage(BaseModel):
    agent_name: str
    message: str

class CrewResponse(BaseModel):
    responses: list[AgentMessage]

async def main():
    result = type('Dummy', (object,), {"pydantic": CrewResponse(responses=[AgentMessage(agent_name="TestAgent", message="Hello world!")])})()
    crew_response = result.pydantic
    lines = []
    for r in crew_response.responses:
        lines.append(f"{r.agent_name}: {r.message}")
    print("\n\n".join(lines))

if __name__ == "__main__":
    asyncio.run(main())
