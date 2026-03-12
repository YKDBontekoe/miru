import 'dart:ui';
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

    final containerColor =
        (isDark ? AppColors.surfaceHighDark : AppColors.surfaceHighLight)
            .withValues(alpha: 0.65);
    final borderColor = (isDark ? AppColors.borderDark : AppColors.borderLight)
        .withValues(alpha: 0.8);

    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(
          AppSpacing.md,
          AppSpacing.xs,
          AppSpacing.md,
          AppSpacing.md, // Float it slightly
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(AppSpacing.radiusXl),
          child: BackdropFilter(
            filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
            child: Container(
              decoration: BoxDecoration(
                color: containerColor,
                borderRadius: BorderRadius.circular(AppSpacing.radiusXl),
                border: Border.all(color: borderColor, width: 1),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: isDark ? 0.3 : 0.08),
                    blurRadius: 16,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              padding: const EdgeInsets.symmetric(
                horizontal: AppSpacing.sm,
                vertical: AppSpacing.sm,
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Expanded(
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
                          horizontal: AppSpacing.md,
                          vertical: AppSpacing.md,
                        ),
                        border: InputBorder.none,
                        enabledBorder: InputBorder.none,
                        focusedBorder: InputBorder.none,
                      ),
                    ),
                  ),
                  const SizedBox(width: AppSpacing.xs),
                  _SendButton(
                    isStreaming: isStreaming,
                    onSend: onSend,
                    onStop: onStopStreaming,
                  ),
                ],
              ),
            ),
          ),
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
          child: SizedBox(
            width: 40,
            height: 40,
            child: Center(child: child),
          ),
        ),
      ),
    );
  }
}
