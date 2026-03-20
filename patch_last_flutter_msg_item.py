with open("frontend/lib/features/rooms/widgets/message_item.dart", "r") as f:
    content = f.read()

# Add onFeedback to MessageItem
content = content.replace("final VoidCallback? onRetry;", "final VoidCallback? onRetry;\n  final void Function(ChatMessage, bool)? onFeedback;")
content = content.replace("this.onRetry,", "this.onRetry,\n    this.onFeedback,")

# Pass it to ChatBubble
content = content.replace("              onRetry: onRetry,\n            ),", "              onRetry: onRetry,\n              onFeedback: onFeedback != null ? (isPositive) => onFeedback!(message, isPositive) : null,\n              feedback: message.feedback,\n            ),")

with open("frontend/lib/features/rooms/widgets/message_item.dart", "w") as f:
    f.write(content)

with open("frontend/lib/features/rooms/pages/group_chat_page.dart", "r") as f:
    content = f.read()

# Pass it to MessageItem
content = content.replace("                            onRetry: _retryLastMessage,\n                          ),", "                            onRetry: _retryLastMessage,\n                            onFeedback: _handleFeedback,\n                          ),")

with open("frontend/lib/features/rooms/pages/group_chat_page.dart", "w") as f:
    f.write(content)
