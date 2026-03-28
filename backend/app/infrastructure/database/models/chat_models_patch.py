with open("app/infrastructure/database/models/chat_models.py") as f:
    content = f.read()

content = content.replace(
    "    name = fields.CharField(max_length=255)",
    "    name = fields.CharField(max_length=255)\n    summary = fields.TextField(null=True)",
)

with open("app/infrastructure/database/models/chat_models.py", "w") as f:
    f.write(content)
