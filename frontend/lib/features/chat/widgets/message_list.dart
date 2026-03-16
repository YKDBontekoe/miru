import 'package:miru/features/chat/widgets/animated_message_item.dart';
import 'package:flutter/material.dart';
import 'package:miru/core/design_system/design_system.dart';
import 'package:miru/core/models/chat_message.dart';
import 'package:miru/core/models/message_status.dart';

class MessageList extends StatelessWidget {
  final List<ChatMessage> messages;
  final ScrollController scrollController;
  final bool isStreaming;
  final String? streamingStatus;
  final void Function(ChatMessage) onCopy;
  final VoidCallback onRetry;

  const MessageList({
    super.key,
    required this.messages,
    required this.scrollController,
    required this.isStreaming,
    required this.streamingStatus,
    required this.onCopy,
    required this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      controller: scrollController,
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.md,
        vertical: AppSpacing.lg,
      ),
      itemCount: messages.length,
      itemBuilder: (context, index) {
        final msg = messages[index];

        // Show streaming status label in the placeholder bubble while we're
        // waiting for the first token.
        final isPlaceholder =
            !msg.isUser && msg.text.isEmpty && streamingStatus != null;

        return AnimatedMessageItem(
          key: ValueKey(msg.id),
          child: ChatBubble(
            text: isPlaceholder ? streamingStatus! : msg.text,
            isUser: msg.isUser,
            crewTaskType: msg.crewTaskType,
            status: isPlaceholder ? MessageStatus.streaming : msg.status,
            onCopy: () => onCopy(msg),
            onRetry: msg.status == MessageStatus.failed ? onRetry : null,
          ),
        );
      },
    );
  }
}
