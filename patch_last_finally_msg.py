with open("frontend/lib/features/rooms/widgets/message_item.dart", "r") as f:
    content = f.read()

# I apparently modified the wrong thing or didn't actually save it right in MessageItem earlier
content = content.replace("  final String senderName;", "  final String senderName;\n  final void Function(ChatMessage, bool)? onFeedback;")
content = content.replace("required this.senderName,\n  });", "required this.senderName,\n    this.onFeedback,\n  });")

content = content.replace("            status: message.status,\n            onCopy: () => _copyMessage(context, message),\n          )", "            status: message.status,\n            onCopy: () => _copyMessage(context, message),\n            onFeedback: onFeedback != null ? (isPositive) => onFeedback!(message, isPositive) : null,\n            feedback: message.feedback,\n          )")

with open("frontend/lib/features/rooms/widgets/message_item.dart", "w") as f:
    f.write(content)
