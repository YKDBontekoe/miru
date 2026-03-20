import 'package:flutter/material.dart';

import 'package:miru/core/design_system/design_system.dart';
import 'package:miru/core/models/chat_message.dart';
import 'package:miru/core/models/message_status.dart';
import 'package:miru/features/chat/widgets/animated_message_item.dart';

/// A scrollable list of chat messages.
///
/// It displays user and assistant messages, animating them as they appear. It also
/// supports copying message contents and retrying failed messages.
class MessageList extends StatelessWidget {
  /// The list of messages to display.
  final List<ChatMessage> messages;

  /// The controller for scrolling behavior.
  final ScrollController scrollController;

  /// Whether the assistant is currently streaming a response.
  final bool isStreaming;

  /// The current streaming status description.
  final String? streamingStatus;

  /// Callback to copy a message's content.
  final void Function(ChatMessage) onCopy;

  /// Callback to retry a failed message.
  final VoidCallback onRetry;

  /// Creates a [MessageList].
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

        // Justification: ListView.builder intrinsically adds a RepaintBoundary
        // to each item (addRepaintBoundaries: true by default). Manually
        // wrapping items in another RepaintBoundary is redundant, adding
        // unnecessary depth and memory overhead to the widget tree.
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
