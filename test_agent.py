import asyncio
from app.infrastructure.repositories.agent_repo import AgentRepository

async def main():
    repo = AgentRepository()
    print("Agent repo imported successfully")

if __name__ == "__main__":
    asyncio.run(main())
