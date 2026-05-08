import asyncio
import os
import sys

sys.path.insert(0, os.path.abspath("backend"))


async def main():
    print("CrewOrchestrator imports successfully!")


if __name__ == "__main__":
    asyncio.run(main())
