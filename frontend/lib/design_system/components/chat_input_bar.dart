import 'package:flutter/material.dart';

import '../extensions/build_context_extensions.dart';
import '../theme/app_theme_data.dart';
import '../tokens/colors.dart';
import '../tokens/spacing.dart';
import '../tokens/typography.dart';
import 'app_icon_button.dart';

/// The bottom input bar for composing and sending messages.
///
/// Includes:
/// - A text field for composing the message.
/// - A crew-mode toggle that enables CrewAI multi-agent routing.
/// - A send button or stop button (during streaming).
///
/// ```dart
/// ChatInputBar(
///   controller: _inputController,
///   focusNode: _inputFocusNode,
///   onSend: _sendMessage,
///   isStreaming: _isStreaming,
///   onStopStreaming: _stopGeneration,
///   useCrew: _useCrew,
///   onToggleCrew: (v) => setState(() => _useCrew = v),
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

  /// Whether CrewAI multi-agent mode is active.
  final bool useCrew;

  /// Called when the user toggles crew mode.
  final ValueChanged<bool> onToggleCrew;

  const ChatInputBar({
    super.key,
    required this.controller,
    required this.onSend,
    required this.onToggleCrew,
    this.focusNode,
    this.isStreaming = false,
    this.onStopStreaming,
    this.useCrew = false,
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
            // Toolbar row: crew toggle
            _ToolbarRow(
              useCrew: useCrew,
              onToggleCrew: onToggleCrew,
              colors: colors,
            ),
            const SizedBox(height: AppSpacing.xs),

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

// ---------------------------------------------------------------------------
// Toolbar row
// ---------------------------------------------------------------------------

class _ToolbarRow extends StatelessWidget {
  final bool useCrew;
  final ValueChanged<bool> onToggleCrew;
  final AppThemeColors colors;

  const _ToolbarRow({
    required this.useCrew,
    required this.onToggleCrew,
    required this.colors,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        _ToggleChip(
          label: 'Crew',
          icon: Icons.groups_rounded,
          active: useCrew,
          onTap: () => onToggleCrew(!useCrew),
          activeColor: AppColors.primary,
          activeSurface: AppColors.primarySurface,
          colors: colors,
        ),
      ],
    );
  }
}

class _ToggleChip extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool active;
  final VoidCallback onTap;
  final Color activeColor;
  final Color activeSurface;
  final AppThemeColors colors;

  const _ToggleChip({
    required this.label,
    required this.icon,
    required this.active,
    required this.onTap,
    required this.activeColor,
    required this.activeSurface,
    required this.colors,
  });

  @override
  Widget build(BuildContext context) {
    final bg = active ? activeSurface : colors.surfaceHighest;
    final fg = active ? activeColor : colors.onSurfaceMuted;

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: AppSpacing.xs,
        ),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
          border: Border.all(
            color: active ? activeColor.withAlpha(80) : colors.border,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 14, color: fg),
            const SizedBox(width: 4),
            Text(label, style: AppTypography.labelSmall.copyWith(color: fg)),
          ],
        ),
      ),
    );
  }
}
