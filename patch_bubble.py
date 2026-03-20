import re
with open("frontend/lib/core/design_system/components/chat_bubble.dart", "r") as f:
    content = f.read()

# Fix ChatBubble constructor
content = re.sub(
    r"(  const ChatBubble\({)(.*?)(  }\);)",
    r"\1\n    super.key,\n    required this.text,\n    required this.isUser,\n    required this.status,\n    required this.onCopy,\n    this.agentName,\n    this.crewTaskType,\n    this.onRetry,\n    this.onFeedback,\n    this.feedback,\n\3",
    content,
    flags=re.DOTALL
)

# Fix _AssistantBubble constructor
content = re.sub(
    r"(  const _AssistantBubble\({)(.*?)(  }\);)",
    r"\1\n    required this.text,\n    required this.status,\n    this.agentName,\n    this.onCopy,\n    this.onRetry,\n    this.onFeedback,\n    this.feedback,\n    required this.screenWidth,\n    required this.colors,\n\3",
    content,
    flags=re.DOTALL
)

with open("frontend/lib/core/design_system/components/chat_bubble.dart", "w") as f:
    f.write(content)
