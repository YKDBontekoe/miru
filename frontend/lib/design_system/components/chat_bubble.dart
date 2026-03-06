import 'package:flutter/material.dart';
import 'package:flutter_markdown/flutter_markdown.dart';

import '../extensions/build_context_extensions.dart';
import '../tokens/colors.dart';
import '../tokens/spacing.dart';
import '../tokens/typography.dart';
import 'crew_task_badge.dart';
import 'typing_indicator.dart';

/// A themed chat bubble that adapts to user vs. assistant messages.
///
/// Assistant messages are rendered as Markdown (via `flutter_markdown`).
/// When a [crewTaskType] is provided, a [CrewTaskBadge] is shown above
/// the bubble to indicate which CrewAI agent pipeline was used.
///
/// ```dart
/// ChatBubble(text: 'Hello!', isUser: true)
/// ChatBubble(text: '**Summary:** ...', isUser: false, crewTaskType: 'summarisation')
/// ```
class ChatBubble extends StatelessWidget {
  final String text;
  final bool isUser;

  /// If set, shows a [CrewTaskBadge] above the bubble.
  final String? crewTaskType;

  const ChatBubble({
    super.key,
    required this.text,
    required this.isUser,
    this.crewTaskType,
  });

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final screenWidth = context.screenWidth;

    final bubbleColor = isUser ? colors.userBubble : colors.assistantBubble;
    final textColor = isUser ? AppColors.onPrimary : colors.onSurface;

    return Align(
      alignment: isUser ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.symmetric(vertical: AppSpacing.xs),
        constraints: BoxConstraints(
          maxWidth: screenWidth * AppSpacing.bubbleMaxWidthFraction,
        ),
        child: Column(
          crossAxisAlignment:
              isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
          children: [
            // Crew task type badge (assistant only)
            if (!isUser && crewTaskType != null) ...[
              CrewTaskBadge(taskType: crewTaskType!),
              const SizedBox(height: AppSpacing.xs),
            ],

            // Bubble
            Container(
              decoration: BoxDecoration(
                color: bubbleColor,
                borderRadius: BorderRadius.only(
                  topLeft: const Radius.circular(AppSpacing.radiusXl),
                  topRight: const Radius.circular(AppSpacing.radiusXl),
                  bottomLeft: Radius.circular(
                    isUser ? AppSpacing.radiusXl : AppSpacing.radiusXs,
                  ),
                  bottomRight: Radius.circular(
                    isUser ? AppSpacing.radiusXs : AppSpacing.radiusXl,
                  ),
                ),
              ),
              padding: AppSpacing.bubblePadding,
              child: _buildContent(context, textColor),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildContent(BuildContext context, Color textColor) {
    // Show typing indicator for empty assistant messages (waiting for response).
    if (text.isEmpty && !isUser) {
      return const TypingIndicator();
    }

    // User messages: plain text.
    if (isUser) {
      return Text(
        text,
        style: AppTypography.bodyMedium.copyWith(color: textColor),
      );
    }

    // Assistant messages: render as Markdown.
    return MarkdownBody(
      data: text,
      selectable: true,
      styleSheet: _buildMarkdownStyle(context, textColor),
    );
  }

  MarkdownStyleSheet _buildMarkdownStyle(
    BuildContext context,
    Color textColor,
  ) {
    final colors = context.colors;
    final base = AppTypography.bodyMedium.copyWith(color: textColor);

    return MarkdownStyleSheet(
      p: base,
      strong: base.copyWith(fontWeight: FontWeight.w600),
      em: base.copyWith(fontStyle: FontStyle.italic),
      h1: AppTypography.headingMedium.copyWith(color: textColor),
      h2: AppTypography.headingSmall.copyWith(color: textColor),
      h3: AppTypography.labelLarge.copyWith(color: textColor),
      h4: AppTypography.labelMedium.copyWith(color: textColor),
      listBullet: base,
      code: AppTypography.code.copyWith(
        color: AppColors.primaryLight,
        backgroundColor: colors.surfaceHighest,
      ),
      codeblockDecoration: BoxDecoration(
        color: colors.surfaceHighest,
        borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
      ),
      blockquoteDecoration: BoxDecoration(
        border: Border(
          left: BorderSide(color: AppColors.primary.withAlpha(120), width: 3),
        ),
      ),
      blockquotePadding: const EdgeInsets.only(left: AppSpacing.md),
      blockquote: base.copyWith(
        color: colors.onSurfaceMuted,
        fontStyle: FontStyle.italic,
      ),
      horizontalRuleDecoration: BoxDecoration(
        border: Border(top: BorderSide(color: colors.border)),
      ),
    );
  }
}
