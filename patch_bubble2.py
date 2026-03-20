with open("frontend/lib/core/design_system/components/chat_bubble.dart", "r") as f:
    content = f.read()

import re

# Revert previous bad regex and do a clean replacement
content = re.sub(
    r"class ChatBubble extends StatelessWidget \{.*?const ChatBubble\(\{[^}]*\}\);",
    r"""class ChatBubble extends StatelessWidget {
  final String text;
  final bool isUser;
  final MessageStatus status;
  final String? agentName;
  final String? crewTaskType;
  final VoidCallback? onCopy;
  final VoidCallback? onRetry;
  final void Function(bool isPositive)? onFeedback;
  final String? feedback;

  const ChatBubble({
    super.key,
    required this.text,
    required this.isUser,
    this.status = MessageStatus.sent,
    this.onCopy,
    this.agentName,
    this.crewTaskType,
    this.onRetry,
    this.onFeedback,
    this.feedback,
  });""", content, flags=re.DOTALL
)

content = re.sub(
    r"class _AssistantBubble extends StatelessWidget \{.*?const _AssistantBubble\(\{[^}]*\}\);",
    r"""class _AssistantBubble extends StatelessWidget {
  final String text;
  final MessageStatus status;
  final String? agentName;
  final VoidCallback? onCopy;
  final VoidCallback? onRetry;
  final void Function(bool isPositive)? onFeedback;
  final String? feedback;
  final double screenWidth;

  const _AssistantBubble({
    required this.text,
    required this.status,
    this.agentName,
    this.onCopy,
    this.onRetry,
    this.onFeedback,
    this.feedback,
    required this.screenWidth,
  });""", content, flags=re.DOTALL
)

with open("frontend/lib/core/design_system/components/chat_bubble.dart", "w") as f:
    f.write(content)
