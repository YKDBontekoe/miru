with open("frontend/lib/core/design_system/components/chat_bubble.dart", "r") as f:
    content = f.read()

content = content.replace("    return _AssistantBubble(\n      text: text,\n      status: status,\n      agentName: agentName,\n      onCopy: onCopy,\n      onRetry: onRetry,\n      screenWidth: screenWidth,\n    );",
"""    return _AssistantBubble(
      text: text,
      status: status,
      agentName: agentName,
      onCopy: onCopy,
      onRetry: onRetry,
      onFeedback: onFeedback,
      feedback: feedback,
      screenWidth: screenWidth,
    );""")

with open("frontend/lib/core/design_system/components/chat_bubble.dart", "w") as f:
    f.write(content)
