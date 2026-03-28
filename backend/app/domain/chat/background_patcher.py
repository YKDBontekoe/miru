with open("app/domain/chat/background_service.py") as f:
    content = f.read()

content = content.replace(
    """    def __init__(
        self,
        agent_repo: AgentRepository,
        memory_repo: MemoryRepository,
        agent_service: AgentService,
    ):
        self.agent_repo = agent_repo
        self.memory_repo = memory_repo
        self.agent_service = agent_service""",
    """    def __init__(
        self,
        agent_repo: AgentRepository,
        memory_repo: MemoryRepository,
        agent_service: AgentService,
        chat_repo: Any = None,
    ):
        self.agent_repo = agent_repo
        self.memory_repo = memory_repo
        self.agent_service = agent_service
        self.chat_repo = chat_repo""",
)

content = content.replace(
    "from typing import TYPE_CHECKING", "from typing import TYPE_CHECKING, Any"
)

with open("app/domain/chat/background_service.py", "w") as f:
    f.write(content)
