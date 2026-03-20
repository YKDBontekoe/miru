import re

with open("backend/app/domain/chat/models.py", "r") as f:
    content = f.read()

# I apparently lost the feedback attribute from ChatMessage entirely. I need to put it back.
content = content.replace("    attachments: list = fields.JSONField(default=[])", "    attachments: list = fields.JSONField(default=[])\n    feedback: str | None = fields.CharField(max_length=20, null=True)  # type: ignore[assignment]")

with open("backend/app/domain/chat/models.py", "w") as f:
    f.write(content)
