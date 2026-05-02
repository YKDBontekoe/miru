import sys
import asyncio
sys.path.append('backend')
from app.infrastructure.repositories.agent_repo import AgentRepository

async def test():
    print("Testing")

if __name__ == "__main__":
    asyncio.run(test())
