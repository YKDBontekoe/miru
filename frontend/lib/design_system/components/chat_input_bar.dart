import 'package:flutter/material.dart';

import '../extensions/build_context_extensions.dart';
import '../tokens/colors.dart';
import '../tokens/spacing.dart';
import '../tokens/typography.dart';
import 'app_icon_button.dart';

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
    final colors = context.colors;

    return SafeArea(
      child: Container(
        color: colors.surfaceHigh,
        padding: AppSpacing.inputBarPadding,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Input row: text field + action button
            Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Expanded(
                  child: TextField(
                    controller: controller,
                    focusNode: focusNode,
                    maxLines: null,
                    textInputAction: TextInputAction.send,
                    onSubmitted: (_) => onSend(),
                    style: AppTypography.bodyMedium.copyWith(
                      color: colors.onSurface,
                    ),
                    decoration: InputDecoration(
                      hintText: hintText,
                      hintStyle: AppTypography.bodyMedium.copyWith(
                        color: colors.onSurfaceMuted,
                      ),
                      filled: true,
                      fillColor: colors.background,
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.lg,
                        vertical: AppSpacing.md,
                      ),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(
                          AppSpacing.radiusXxl,
                        ),
                        borderSide: BorderSide.none,
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(
                          AppSpacing.radiusXxl,
                        ),
                        borderSide: BorderSide.none,
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(
                          AppSpacing.radiusXxl,
                        ),
                        borderSide: BorderSide(
                          color: AppColors.primary.withAlpha(100),
                          width: 1.5,
                        ),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                _buildActionButton(),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildActionButton() {
    if (isStreaming) {
      return AppIconButton(
        icon: Icons.stop_rounded,
        onPressed: onStopStreaming,
        variant: AppIconButtonVariant.filled,
        color: AppColors.error,
        tooltip: 'Stop generating',
      );
    }

    return AppIconButton(
      icon: Icons.send_rounded,
      onPressed: onSend,
      variant: AppIconButtonVariant.filled,
      tooltip: 'Send message',
    );
  }
}
