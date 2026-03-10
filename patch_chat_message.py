import re

with open("frontend/lib/models/chat_message.dart", "r") as f:
    content = f.read()

# Fix isUser mapping in toJson
content = content.replace("'crewTaskType': crewTaskType,", "'crewTaskType': crewTaskType,\n        'isUser': isUser,")

# The original model used "timestamp" for serialization:
# 'timestamp': timestamp.toIso8601String(),
# 'status': status.name,
# The new api model uses "created_at". Let's support both properly for UI tests:
content = content.replace("'created_at': timestamp.toIso8601String(),", "'created_at': timestamp.toIso8601String(),\n        'timestamp': timestamp.toIso8601String(),")

with open("frontend/lib/models/chat_message.dart", "w") as f:
    f.write(content)
