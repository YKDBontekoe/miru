import 'package:flutter/material.dart';
import 'package:flutter_markdown_plus/flutter_markdown_plus.dart';
import 'package:google_fonts/google_fonts.dart';

import 'package:miru/core/models/message_status.dart';
import 'package:miru/core/design_system/extensions/build_context_extensions.dart';
import 'package:miru/core/design_system/theme/app_theme_data.dart';
import 'package:miru/core/design_system/tokens/colors.dart';
import 'package:miru/core/design_system/tokens/spacing.dart';
import 'package:miru/core/design_system/tokens/typography.dart';
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
  final String? agentName;

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
    this.agentName,
    this.status = MessageStatus.sent,
    this.crewTaskType,
    this.onCopy,
    this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    final screenWidth = context.screenWidth;

    if (isUser) {
      return _UserBubble(
        text: text,
        screenWidth: screenWidth,
      );
    }

    return _AssistantBubble(
      text: text,
      status: status,
      agentName: agentName,
      onCopy: onCopy,
      onRetry: onRetry,
      screenWidth: screenWidth,
    );
  }
}

// ---------------------------------------------------------------------------
// User bubble
// ---------------------------------------------------------------------------

class _UserBubble extends StatelessWidget {
  final String text;
  final double screenWidth;

  const _UserBubble({required this.text, required this.screenWidth});

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.centerRight,
      child: Container(
        margin: const EdgeInsets.only(
          top: AppSpacing.xs,
          bottom: AppSpacing.xs,
          left: AppSpacing.xxxl,
        ),
        constraints: BoxConstraints(
          maxWidth: screenWidth * AppSpacing.bubbleMaxWidthFraction,
        ),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [AppColors.primary, AppColors.primaryDark],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(AppSpacing.radiusXl),
            topRight: Radius.circular(AppSpacing.radiusXl),
            bottomLeft: Radius.circular(AppSpacing.radiusXl),
            bottomRight: Radius.circular(AppSpacing.radiusSm),
          ),
          boxShadow: [
            BoxShadow(
              color: AppColors.primary.withValues(alpha: 0.25),
              blurRadius: 12,
              offset: const Offset(0, 4),
            ),
          ],
        ),
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.lg,
          vertical: AppSpacing.md,
        ),
        child: Text(
          text,
          style: GoogleFonts.inter(
            fontSize: 15,
            fontWeight: FontWeight.w400,
            height: 1.55,
            color: AppColors.onPrimary,
          ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Assistant bubble
// ---------------------------------------------------------------------------

class _AssistantBubble extends StatelessWidget {
  final String text;
  final MessageStatus status;
  final String? agentName;
  final VoidCallback? onCopy;
  final VoidCallback? onRetry;
  final double screenWidth;

  const _AssistantBubble({
    required this.text,
    required this.status,
    this.agentName,
    this.onCopy,
    this.onRetry,
    required this.screenWidth,
  });

  /// Returns a deterministic accent color for a named agent.
  Color _agentColor(String name) {
    const palette = [
      Color(0xFF3B82F6), // blue
      Color(0xFF14B8A6), // teal
      Color(0xFFEC4899), // pink
      Color(0xFF8B5CF6), // violet
      Color(0xFFF59E0B), // amber
      Color(0xFF10B981), // emerald
    ];
    return palette[name.hashCode.abs() % palette.length];
  }

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;
    final isDark = context.isDark;
    final isFailed = status == MessageStatus.failed;
    final isStreaming = status == MessageStatus.streaming;
    final isEmpty = text.isEmpty;

    final accentColor = agentName != null && agentName!.isNotEmpty
        ? _agentColor(agentName!)
        : colors.primary;

    return Align(
      alignment: Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(
          top: AppSpacing.xs,
          bottom: AppSpacing.xs,
          right: AppSpacing.xxxl,
        ),
        constraints: BoxConstraints(
          maxWidth: screenWidth * AppSpacing.bubbleMaxWidthFraction,
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Avatar column
            _AssistantAvatar(
              agentName: agentName,
              accentColor: accentColor,
              isFailed: isFailed,
            ),
            const SizedBox(width: AppSpacing.sm),

            // Bubble + actions
            Flexible(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Agent name label (if named agent)
                  if (agentName != null && agentName!.isNotEmpty) ...[
                    Padding(
                      padding: const EdgeInsets.only(
                        left: AppSpacing.xs,
                        bottom: AppSpacing.xxs,
                      ),
                      child: Text(
                        agentName!,
                        style: GoogleFonts.inter(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: accentColor,
                          letterSpacing: 0.3,
                        ),
                      ),
                    ),
                  ],

                  // Bubble
                  GestureDetector(
                    onLongPress: onCopy,
                    child: _AssistantBubbleContainer(
                      isFailed: isFailed,
                      isDark: isDark,
                      accentColor: accentColor,
                      hasAgentName: agentName != null && agentName!.isNotEmpty,
                      colors: colors,
                      child: isEmpty && !isFailed
                          ? TypingIndicator(agentName: agentName)
                          : _AssistantContent(
                              text: text,
                              colors: colors,
                              isFailed: isFailed,
                            ),
                    ),
                  ),

                  // Action row
                  if (!isStreaming && !isEmpty)
                    _ActionRow(
                      onCopy: onCopy,
                      onRetry: isFailed ? onRetry : null,
                      colors: colors,
                    ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Assistant avatar
// ---------------------------------------------------------------------------

class _AssistantAvatar extends StatelessWidget {
  final String? agentName;
  final Color accentColor;
  final bool isFailed;

  const _AssistantAvatar({
    required this.agentName,
    required this.accentColor,
    required this.isFailed,
  });

  @override
  Widget build(BuildContext context) {
    final isDark = context.isDark;
    final colors = context.colors;

    // Slightly offset from top to align with text baseline
    return Padding(
      padding: const EdgeInsets.only(top: 2),
      child: Container(
        width: 28,
        height: 28,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: isFailed
              ? colors.errorSurface
              : accentColor.withValues(alpha: isDark ? 0.18 : 0.12),
          border: Border.all(
            color: isFailed
                ? AppColors.error.withValues(alpha: 0.4)
                : accentColor.withValues(alpha: isDark ? 0.35 : 0.25),
            width: 1,
          ),
        ),
        child: Center(
          child: agentName != null && agentName!.isNotEmpty
              ? Text(
                  agentName![0].toUpperCase(),
                  style: GoogleFonts.inter(
                    fontSize: 11,
                    fontWeight: FontWeight.w700,
                    color: isFailed ? AppColors.error : accentColor,
                  ),
                )
              : Icon(
                  isFailed
                      ? Icons.error_outline_rounded
                      : Icons.blur_on_rounded,
                  size: 14,
                  color: isFailed ? AppColors.error : accentColor,
                ),
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Assistant bubble container
// ---------------------------------------------------------------------------

class _AssistantBubbleContainer extends StatelessWidget {
  final bool isFailed;
  final bool isDark;
  final Color accentColor;
  final bool hasAgentName;
  final AppThemeColors colors;
  final Widget child;

  const _AssistantBubbleContainer({
    required this.isFailed,
    required this.isDark,
    required this.accentColor,
    required this.hasAgentName,
    required this.colors,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    final bgColor = isFailed
        ? colors.errorSurface
        : hasAgentName
            ? accentColor.withValues(alpha: isDark ? 0.08 : 0.06)
            : (isDark ? AppColors.surfaceHighDark : AppColors.surfaceHighLight);

    final borderColor = isFailed
        ? AppColors.error.withValues(alpha: 0.35)
        : hasAgentName
            ? accentColor.withValues(alpha: isDark ? 0.22 : 0.18)
            : colors.border.withValues(alpha: 0.7);

    return Container(
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(AppSpacing.radiusSm),
          topRight: Radius.circular(AppSpacing.radiusXl),
          bottomLeft: Radius.circular(AppSpacing.radiusXl),
          bottomRight: Radius.circular(AppSpacing.radiusXl),
        ),
        border: Border.all(color: borderColor, width: 1),
      ),
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.lg,
        vertical: AppSpacing.md,
      ),
      child: child,
    );
  }
}

// ---------------------------------------------------------------------------
// Assistant bubble content (Markdown)
// ---------------------------------------------------------------------------

class _AssistantContent extends StatelessWidget {
  final String text;
  final AppThemeColors colors;
  final bool isFailed;

  const _AssistantContent({
    required this.text,
    required this.colors,
    required this.isFailed,
  });

  @override
  Widget build(BuildContext context) {
    final textColor = isFailed ? AppColors.error : colors.onSurface;

    final base = GoogleFonts.inter(
      fontSize: 15,
      fontWeight: FontWeight.w400,
      height: 1.6,
      color: textColor,
    );

    return MarkdownBody(
      data: text,
      selectable: true,
      styleSheet: MarkdownStyleSheet(
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
              color: colors.primary.withValues(alpha: 0.4),
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
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Action row (copy + retry)
// ---------------------------------------------------------------------------

class _ActionRow extends StatelessWidget {
  final VoidCallback? onCopy;
  final VoidCallback? onRetry;
  final AppThemeColors colors;

  const _ActionRow({
    required this.onCopy,
    required this.onRetry,
    required this.colors,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(
        top: AppSpacing.xxs,
        left: AppSpacing.xxs,
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (onCopy != null)
            _ActionChip(
              icon: Icons.copy_all_rounded,
              label: 'Copy',
              onPressed: onCopy!,
              color: colors.onSurfaceMuted,
            ),
          if (onRetry != null) ...[
            const SizedBox(width: AppSpacing.xs),
            _ActionChip(
              icon: Icons.refresh_rounded,
              label: 'Retry',
              onPressed: onRetry!,
              color: AppColors.error,
            ),
          ],
        ],
      ),
    );
  }
}

class _ActionChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onPressed;
  final Color color;

  const _ActionChip({
    required this.icon,
    required this.label,
    required this.onPressed,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: label,
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.sm,
            vertical: AppSpacing.xxs + 1,
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon, size: 13, color: color.withValues(alpha: 0.7)),
              const SizedBox(width: 3),
              Text(
                label,
                style: GoogleFonts.inter(
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                  color: color.withValues(alpha: 0.7),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
