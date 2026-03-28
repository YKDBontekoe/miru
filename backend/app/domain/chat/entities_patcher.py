with open("app/domain/chat/entities.py") as f:
    content = f.read()

# Fix dataclass ordering
content = content.replace(
    """    name: str
    summary: str | None = None
    created_at: datetime
    updated_at: datetime
    deleted_at: datetime | None = None""",
    """    name: str
    created_at: datetime
    updated_at: datetime
    summary: str | None = None
    deleted_at: datetime | None = None""",
)

with open("app/domain/chat/entities.py", "w") as f:
    f.write(content)
