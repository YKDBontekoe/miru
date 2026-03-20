with open("frontend/lib/features/chat/widgets/message_list.dart", "r") as f:
    content = f.read()

# Re-apply MessageList feedback changes that seem to have been lost/reverted
content = content.replace("  final VoidCallback onRetry;", "  final VoidCallback onRetry;\n  final void Function(ChatMessage msg, bool isPositive)? onFeedback;")
content = content.replace("required this.onRetry,", "required this.onRetry,\n    this.onFeedback,")
content = content.replace("onRetry: msg.status == MessageStatus.failed ? onRetry : null,\n          ),", "onRetry: msg.status == MessageStatus.failed ? onRetry : null,\n            onFeedback: onFeedback != null && !msg.isUser && !isPlaceholder\n                ? (isPositive) => onFeedback!(msg, isPositive)\n                : null,\n            feedback: msg.feedback,\n          ),")

with open("frontend/lib/features/chat/widgets/message_list.dart", "w") as f:
    f.write(content)

with open("frontend/lib/features/rooms/pages/group_chat_page.dart", "r") as f:
    content = f.read()

# Pass onFeedback down in group_chat_page
if "onFeedback: (msg, isPositive) => _handleFeedback(msg, isPositive)," not in content:
    content = content.replace("                        onRetry: _retryLastMessage,", "                        onRetry: _retryLastMessage,\n                        onFeedback: (msg, isPositive) => _handleFeedback(msg, isPositive),")
    with open("frontend/lib/features/rooms/pages/group_chat_page.dart", "w") as f:
        f.write(content)
