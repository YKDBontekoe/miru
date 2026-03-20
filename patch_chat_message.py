with open("frontend/lib/core/models/chat_message.dart", "r") as f:
    content = f.read()

# Add feedback field if it's missing (it seems my previous edit didn't stick or got reverted)
old_str = """    @Default(MessageStatus.sent) MessageStatus status,
    String? crewTaskType,
  }) = _ChatMessage;"""
new_str = """    @Default(MessageStatus.sent) MessageStatus status,
    String? crewTaskType,
    String? feedback,
  }) = _ChatMessage;"""
content = content.replace(old_str, new_str)

with open("frontend/lib/core/models/chat_message.dart", "w") as f:
    f.write(content)
