with open("frontend/lib/core/design_system/components/chat_bubble.dart", "r") as f:
    content = f.read()

content = content.replace("required this.isUser,\n    required this.status,\n    required this.onCopy,", "required this.isUser,\n    required this.status,\n    required this.onCopy,\n    this.onFeedback,\n    this.feedback,")
content = content.replace("required this.colors,\n  });", "required this.colors,\n    this.onFeedback,\n    this.feedback,\n  });")

with open("frontend/lib/core/design_system/components/chat_bubble.dart", "w") as f:
    f.write(content)

with open("frontend/lib/features/chat/widgets/message_list.dart", "r") as f:
    content = f.read()

content = content.replace("  final VoidCallback onRetry;\n  final void Function(ChatMessage msg, bool isPositive)? onFeedback;", "  final VoidCallback onRetry;\n  final void Function(ChatMessage, bool)? onFeedback;")

content = content.replace("? (isPositive) => onFeedback!(msg, isPositive)", "? (bool isPositive) => onFeedback!(msg, isPositive)")

with open("frontend/lib/features/chat/widgets/message_list.dart", "w") as f:
    f.write(content)

with open("frontend/lib/features/chat/pages/chat_page.dart", "r") as f:
    content = f.read()

# remove duplicate import
import re
content = re.sub(r"import 'package:shared_preferences/shared_preferences\.dart';\nimport 'package:shared_preferences/shared_preferences\.dart';", "import 'package:shared_preferences/shared_preferences.dart';", content)

with open("frontend/lib/features/chat/pages/chat_page.dart", "w") as f:
    f.write(content)

with open("frontend/lib/features/rooms/pages/group_chat_page.dart", "r") as f:
    content = f.read()

if "onFeedback: (msg, isPositive) => _handleFeedback(msg, isPositive)," not in content:
    content = content.replace("                        onRetry: _retryLastMessage,", "                        onRetry: _retryLastMessage,\n                        onFeedback: _handleFeedback,")

with open("frontend/lib/features/rooms/pages/group_chat_page.dart", "w") as f:
    f.write(content)
