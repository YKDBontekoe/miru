with open("app/domain/chat/crew_orchestrator.py") as f:
    content = f.read()

content = content.replace(
    """_MEMORY_PREFIX = (
    "Relevant memories from past conversations (background context — do not repeat verbatim):\\n"
    "{memories}\\n\\n"
)""",
    """_MEMORY_PREFIX = (
    "Relevant memories from past conversations (background context — do not repeat verbatim):\\n"
    "{memories}\\n\\n"
)

_SUMMARY_PREFIX = (
    "Summary of the older parts of this conversation:\\n"
    "{summary}\\n\\n"
)""",
)

with open("app/domain/chat/crew_orchestrator.py", "w") as f:
    f.write(content)
