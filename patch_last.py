import re

with open("frontend/lib/core/design_system/components/chat_bubble.dart", "r") as f:
    content = f.read()

# Clean up constructors to have `this.feedback, this.onFeedback` properly
# ChatBubble constructor
content = re.sub(r"    required this\.onCopy,\n    this\.onFeedback,\n    this\.feedback,\n    this\.onRetry,", "    required this.onCopy,\n    this.onRetry,\n    this.onFeedback,\n    this.feedback,", content)

# Check if ChatBubble has the fields
if "final String? feedback;" not in content:
    content = content.replace("final VoidCallback? onRetry;", "final VoidCallback? onRetry;\n  final void Function(bool isPositive)? onFeedback;\n  final String? feedback;")

# _AssistantBubble constructor
content = re.sub(r"    required this\.colors,\n    this\.onFeedback,\n    this\.feedback,\n  }\);", "    required this.colors,\n  });", content)

# _ActionRow constructor duplicate removal
content = re.sub(r"  const _ActionRow\(\{.*?\n  \}\);", """  const _ActionRow({
    required this.onCopy,
    required this.onRetry,
    this.onFeedback,
    this.feedback,
    required this.colors,
  });""", content, flags=re.DOTALL)

with open("frontend/lib/core/design_system/components/chat_bubble.dart", "w") as f:
    f.write(content)


with open("frontend/lib/features/chat/widgets/message_list.dart", "r") as f:
    content = f.read()

# Make sure ChatBubble is called with the named parameters correctly in message_list
content = re.sub(r"            onRetry: msg\.status == MessageStatus\.failed \? onRetry : null,\n            onFeedback: onFeedback != null && !msg\.isUser && !isPlaceholder\n                \? \(bool isPositive\) => onFeedback!\(msg, isPositive\)\n                : null,\n            feedback: msg\.feedback,\n          \),", """            onRetry: msg.status == MessageStatus.failed ? onRetry : null,
          ),""", content)

content = content.replace("onRetry: msg.status == MessageStatus.failed ? onRetry : null,\n          ),", """onRetry: msg.status == MessageStatus.failed ? onRetry : null,
            onFeedback: onFeedback != null && !msg.isUser && !isPlaceholder
                ? (bool isPositive) => onFeedback!(msg, isPositive)
                : null,
            feedback: msg.feedback,
          ),""")

with open("frontend/lib/features/chat/widgets/message_list.dart", "w") as f:
    f.write(content)
