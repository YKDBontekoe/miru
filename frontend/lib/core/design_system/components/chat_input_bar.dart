import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import 'package:miru/core/design_system/extensions/build_context_extensions.dart';
import 'package:miru/core/design_system/tokens/colors.dart';
import 'package:miru/core/design_system/tokens/spacing.dart';

/// The bottom input bar for composing and sending messages.
///
/// Includes:
/// - A text field for composing the message.
/// - A send button or stop button (during streaming).
///
/// ```dart
/// ChatInputBar(
///   controller: _inputController,
///   focusNode: _inputFocusNode,
///   onSend: _sendMessage,
///   isStreaming: _isStreaming,
///   onStopStreaming: _stopGeneration,
/// )
/// ```
class ChatInputBar extends StatelessWidget {
  final TextEditingController controller;
  final FocusNode? focusNode;
  final VoidCallback onSend;
  final bool isStreaming;
  final String hintText;

  /// Called when the user taps the stop button during streaming.
  final VoidCallback? onStopStreaming;

  const ChatInputBar({
    super.key,
    required this.controller,
    required this.onSend,
    this.focusNode,
    this.isStreaming = false,
    this.onStopStreaming,
    this.hintText = 'Message Miru...',
  });

  @override
  Widget build(BuildContext context) {
    final isDark = context.isDark;

    // Subtle top border instead of full container color
    final containerColor = isDark
        ? AppColors.backgroundDark
        : AppColors.backgroundLight;
    final borderColor = isDark ? AppColors.borderDark : AppColors.borderLight;

    return SafeArea(
      child: Container(
        color: containerColor,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Hairline separator
            Container(height: 1, color: borderColor.withValues(alpha: 0.5)),
            Padding(
              padding: const EdgeInsets.fromLTRB(
                AppSpacing.md,
                AppSpacing.sm,
                AppSpacing.md,
                AppSpacing.md,
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  // Text field in a card-like container
                  Expanded(
                    child: Container(
                      decoration: BoxDecoration(
                        color: isDark
                            ? AppColors.surfaceHighDark
                            : AppColors.surfaceLight,
                        borderRadius: BorderRadius.circular(
                          AppSpacing.radiusXl,
                        ),
                        border: Border.all(
                          color: borderColor.withValues(alpha: 0.8),
                          width: 1,
                        ),
                        boxShadow: [
                          BoxShadow(
                            color:
                                (isDark
                                        ? AppColors.onSurfaceDark
                                        : AppColors.onSurfaceLight)
                                    .withValues(alpha: isDark ? 0.15 : 0.04),
                            blurRadius: 8,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: TextField(
                        controller: controller,
                        focusNode: focusNode,
                        maxLines: null,
                        minLines: 1,
                        textInputAction: TextInputAction.send,
                        onSubmitted: (_) => onSend(),
                        style: GoogleFonts.inter(
                          fontSize: 15,
                          fontWeight: FontWeight.w400,
                          height: 1.5,
                          color: isDark
                              ? AppColors.onSurfaceDark
                              : AppColors.onSurfaceLight,
                        ),
                        decoration: InputDecoration(
                          hintText: hintText,
                          hintStyle: GoogleFonts.inter(
                            fontSize: 15,
                            fontWeight: FontWeight.w400,
                            color: isDark
                                ? AppColors.onSurfaceMutedDark
                                : AppColors.onSurfaceMutedLight,
                          ),
                          filled: false,
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: AppSpacing.lg,
                            vertical: AppSpacing.md,
                          ),
                          border: InputBorder.none,
                          enabledBorder: InputBorder.none,
                          focusedBorder: InputBorder.none,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  _SendButton(
                    isStreaming: isStreaming,
                    onSend: onSend,
                    onStop: onStopStreaming,
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
// Send / Stop button
// ---------------------------------------------------------------------------

class _SendButton extends StatelessWidget {
  final bool isStreaming;
  final VoidCallback onSend;
  final VoidCallback? onStop;

  const _SendButton({
    required this.isStreaming,
    required this.onSend,
    required this.onStop,
  });

  @override
  Widget build(BuildContext context) {
    if (isStreaming) {
      return _CircleButton(
        onPressed: onStop,
        tooltip: 'Stop generating',
        backgroundColor: AppColors.error.withValues(alpha: 0.12),
        child: Container(
          width: 12,
          height: 12,
          decoration: BoxDecoration(
            color: AppColors.error,
            borderRadius: BorderRadius.circular(2),
          ),
        ),
      );
    }

    return _CircleButton(
      onPressed: onSend,
      tooltip: 'Send message',
      backgroundColor: AppColors.primary,
      child: const Icon(
        Icons.arrow_upward_rounded,
        color: AppColors.onPrimary,
        size: 20,
      ),
    );
  }
}

class _CircleButton extends StatelessWidget {
  final VoidCallback? onPressed;
  final String tooltip;
  final Color backgroundColor;
  final Widget child;

  const _CircleButton({
    required this.onPressed,
    required this.tooltip,
    required this.backgroundColor,
    required this.child,
  });

  @override
  Widget build(BuildContext context) {
    return Tooltip(
      message: tooltip,
      child: Material(
        color: backgroundColor,
        shape: const CircleBorder(),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onPressed,
          child: SizedBox(width: 40, height: 40, child: Center(child: child)),
        ),
      ),
    );
  }
}
