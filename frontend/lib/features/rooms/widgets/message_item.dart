import 'package:flutter/material.dart';
import 'package:miru/core/models/chat_message.dart';
import 'package:miru/core/design_system/design_system.dart';

class MessageItem extends StatelessWidget {
  final ChatMessage message;
  final String senderName;
  final void Function(ChatMessage, bool)? onFeedback;

  const MessageItem({
    super.key,
    required this.message,
    required this.senderName,
    this.onFeedback,
  });

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final isUser = message.isUser;

    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.xs),
      child: Column(
        crossAxisAlignment: isUser
            ? CrossAxisAlignment.end
            : CrossAxisAlignment.start,
        children: [
          Padding(
            padding: EdgeInsets.only(
              left: isUser ? 0 : AppSpacing.xs,
              right: isUser ? AppSpacing.xs : 0,
              bottom: AppSpacing.xxs,
            ),
            child: Text(
              senderName,
              style: AppTypography.caption.copyWith(
                color: colors.onSurfaceMuted,
              ),
            ),
          ),
          ChatBubble(
            text: message.text,
            isUser: isUser,
            agentName: isUser ? null : senderName,
            status: message.status,
          ),
        ],
      ),
    );
  }
}
