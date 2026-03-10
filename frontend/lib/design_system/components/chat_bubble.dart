import 'package:flutter/material.dart';
import 'package:flutter_markdown_plus/flutter_markdown_plus.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../models/message_status.dart';
import '../extensions/build_context_extensions.dart';
import '../theme/app_theme_data.dart';
import '../tokens/colors.dart';
import '../tokens/spacing.dart';
import '../tokens/typography.dart';
import 'crew_task_badge.dart';
import 'typing_indicator.dart';

/// A themed chat bubble that adapts to user vs. assistant messages.
///
/// User bubbles have a gradient fill. Assistant messages are rendered as
/// Markdown (via `flutter_markdown`). When a [crewTaskType] is provided,
/// a [CrewTaskBadge] is shown above the bubble to indicate which CrewAI
/// agent pipeline was used.
///
/// Supports long-press to copy and a retry button for failed messages.
///
/// ```dart
/// ChatBubble(text: 'Hello!', isUser: true)
/// ChatBubble(
///   text: '**Summary:** ...',
///   isUser: false,
///   crewTaskType: 'summarisation',
///   onCopy: () => _copyMessage(msg),
///   onRetry: () => _retry(),
/// )
/// ```
class ChatBubble extends StatelessWidget {
  final String text;
  final bool isUser;
  final MessageStatus status;

  /// If set, shows a [CrewTaskBadge] above the bubble.
  final String? crewTaskType;

  /// Called when the user long-presses to copy the message.
  final VoidCallback? onCopy;

  /// Called when the user taps retry on a failed message.
  final VoidCallback? onRetry;

  const ChatBubble({
    super.key,
    required this.text,
    required this.isUser,
    this.status = MessageStatus.sent,
    this.crewTaskType,
    this.onCopy,
    this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final screenWidth = context.screenWidth;

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

            // Bubble with long-press to copy
            GestureDetector(
              onLongPress: onCopy,
              child: _BubbleContainer(
                isUser: isUser,
                isFailed: status == MessageStatus.failed,
                colors: colors,
                child: _buildContent(context, textColor),
              ),
            ),

            // Action row below bubble
            if (!isUser) _buildActionRow(context),
          ],
        ),
      ),
    );
  }

  Widget _buildContent(BuildContext context, Color textColor) {
    // Show typing indicator for empty assistant messages (waiting for
    // response).
    if (text.isEmpty && !isUser) {
      return const TypingIndicator();
    }

    // User messages: plain text with Inter font.
    if (isUser) {
      return Text(
        text,
        style: GoogleFonts.inter(
          fontSize: 15,
          fontWeight: FontWeight.w400,
          height: 1.5,
          color: textColor,
        ),
      );
    }

    // Assistant messages: render as Markdown.
    return MarkdownBody(
      data: text,
      selectable: true,
      styleSheet: _buildMarkdownStyle(context, textColor),
    );
  }

  /// Action row: copy button + retry button (when failed).
  Widget _buildActionRow(BuildContext context) {
    final colors = context.colors;

    // Don't show actions while streaming or for empty messages.
    if (status == MessageStatus.streaming || text.isEmpty) {
      return const SizedBox.shrink();
    }

    return Padding(
      padding: const EdgeInsets.only(top: AppSpacing.xxs),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          // Copy button
          if (text.isNotEmpty && onCopy != null)
            _BubbleActionButton(
              icon: Icons.copy_rounded,
              tooltip: 'Copy',
              onPressed: onCopy!,
              colors: colors,
            ),

          // Retry button (failed messages only)
          if (status == MessageStatus.failed && onRetry != null) ...[
            const SizedBox(width: AppSpacing.xs),
            _BubbleActionButton(
              icon: Icons.refresh_rounded,
              tooltip: 'Retry',
              onPressed: onRetry!,
              colors: colors,
              color: AppColors.error,
            ),
          ],
        ],
      ),
    );
  }

  MarkdownStyleSheet _buildMarkdownStyle(
    BuildContext context,
    Color textColor,
  ) {
    final colors = context.colors;
    final base = GoogleFonts.inter(
      fontSize: 15,
      fontWeight: FontWeight.w400,
      height: 1.5,
      color: textColor,
    );

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
        color: colors.primaryLight,
        backgroundColor: colors.surfaceHighest,
      ),
      codeblockDecoration: BoxDecoration(
        color: colors.surfaceHighest,
        borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
      ),
      blockquoteDecoration: BoxDecoration(
        border: Border(
          left: BorderSide(
            color: colors.primary.withValues(alpha: 0.5),
            width: 3,
          ),
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

// ---------------------------------------------------------------------------
// Bubble container
// ---------------------------------------------------------------------------

class _BubbleContainer extends StatelessWidget {
  final bool isUser;
  final bool isFailed;
  final AppThemeColors colors;
  final Widget child;

  const _BubbleContainer({
    required this.isUser,
    required this.isFailed,
    required this.colors,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    if (isUser) {
      // Gradient user bubble using design tokens.
      return Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [AppColors.primary, AppColors.primaryDark],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(AppSpacing.radiusXl),
            topRight: Radius.circular(AppSpacing.radiusXl),
            bottomLeft: Radius.circular(AppSpacing.radiusXl),
            bottomRight: Radius.circular(AppSpacing.radiusXs),
          ),
          boxShadow: [
            BoxShadow(
              color: AppColors.primary.withValues(alpha: 0.3),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        padding: AppSpacing.bubblePadding,
        child: child,
      );
    }

    // Flat assistant bubble -- red border if failed.
    return Container(
      decoration: BoxDecoration(
        color: isFailed ? colors.errorSurface : colors.assistantBubble,
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(AppSpacing.radiusXl),
          topRight: Radius.circular(AppSpacing.radiusXl),
          bottomLeft: Radius.circular(AppSpacing.radiusXs),
          bottomRight: Radius.circular(AppSpacing.radiusXl),
        ),
        border: Border.all(
          color:
              isFailed ? AppColors.error.withValues(alpha: 0.5) : colors.border,
          width: 0.5,
        ),
      ),
      padding: AppSpacing.bubblePadding,
      child: child,
    );
  }
}

// ---------------------------------------------------------------------------
// Bubble action button (copy, retry)
// ---------------------------------------------------------------------------

class _BubbleActionButton extends StatelessWidget {
  final IconData icon;
  final String tooltip;
  final VoidCallback onPressed;
  final AppThemeColors colors;
  final Color? color;

  const _BubbleActionButton({
    required this.icon,
    required this.tooltip,
    required this.onPressed,
    required this.colors,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: tooltip,
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.xs),
          child: Icon(
            icon,
            size: AppSpacing.iconSm,
            color: color ?? colors.onSurfaceMuted,
          ),
        ),
      ),
    );
  }
}
