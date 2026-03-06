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
/// - A crew-mode toggle (agents icon) that enables CrewAI routing.
/// - A model selector button showing the active model shortname.
/// - A send button (or spinner during streaming).
///
/// ```dart
/// ChatInputBar(
///   controller: _inputController,
///   onSend: _sendMessage,
///   onSelectModel: _openModelSheet,
///   isStreaming: _isStreaming,
///   useCrew: _useCrew,
///   onToggleCrew: (v) => setState(() => _useCrew = v),
///   selectedModelName: _selectedModelName,
/// )
/// ```
class ChatInputBar extends StatelessWidget {
  final TextEditingController controller;
  final VoidCallback onSend;
  final bool isStreaming;
  final String hintText;

  /// Whether CrewAI multi-agent mode is active.
  final bool useCrew;

  /// Called when the user toggles crew mode.
  final ValueChanged<bool> onToggleCrew;

  /// Short display name of the currently selected model (e.g. "claude-3.5-sonnet").
  /// Null means the server default is used.
  final String? selectedModelName;

  /// Called when the user taps the model selector button.
  final VoidCallback onSelectModel;

  const ChatInputBar({
    super.key,
    required this.controller,
    required this.onSend,
    required this.onToggleCrew,
    required this.onSelectModel,
    this.isStreaming = false,
    this.useCrew = false,
    this.selectedModelName,
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
            // Toolbar row: crew toggle + model selector
            _ToolbarRow(
              useCrew: useCrew,
              onToggleCrew: onToggleCrew,
              selectedModelName: selectedModelName,
              onSelectModel: onSelectModel,
              colors: colors,
            ),
            const SizedBox(height: AppSpacing.xs),

            // Input row: text field + send button
            Row(
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Expanded(
                  child: TextField(
                    controller: controller,
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
                if (isStreaming)
                  const Padding(
                    padding: EdgeInsets.all(AppSpacing.md),
                    child: SizedBox(
                      width: AppSpacing.iconLg,
                      height: AppSpacing.iconLg,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: AppColors.primary,
                      ),
                    ),
                  )
                else
                  AppIconButton(
                    icon: Icons.send_rounded,
                    onPressed: onSend,
                    variant: AppIconButtonVariant.filled,
                    tooltip: 'Send message',
                  ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// ---------------------------------------------------------------------------
// Toolbar row
// ---------------------------------------------------------------------------

class _ToolbarRow extends StatelessWidget {
  final bool useCrew;
  final ValueChanged<bool> onToggleCrew;
  final String? selectedModelName;
  final VoidCallback onSelectModel;
  final dynamic colors;

  const _ToolbarRow({
    required this.useCrew,
    required this.onToggleCrew,
    required this.selectedModelName,
    required this.onSelectModel,
    required this.colors,
  });

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        // Crew mode toggle chip
        _ToggleChip(
          label: 'Crew',
          icon: Icons.groups_rounded,
          active: useCrew,
          onTap: () => onToggleCrew(!useCrew),
          activeColor: AppColors.primary,
          activeSurface: AppColors.primarySurface,
          colors: colors,
        ),

        const SizedBox(width: AppSpacing.sm),

        // Model selector chip
        _ModelChip(
          label: selectedModelName ?? 'Default model',
          onTap: onSelectModel,
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
  final dynamic colors;

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
    final bg =
        active ? activeSurface : (colors as dynamic).surfaceHighest as Color;
    final fg =
        active ? activeColor : (colors as dynamic).onSurfaceMuted as Color;

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
            color: active
                ? activeColor.withAlpha(80)
                : (colors as dynamic).border as Color,
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

class _ModelChip extends StatelessWidget {
  final String label;
  final VoidCallback onTap;
  final dynamic colors;

  const _ModelChip({
    required this.label,
    required this.onTap,
    required this.colors,
  });

  /// Trims a full model ID like "anthropic/claude-3.5-sonnet" to just
  /// "claude-3.5-sonnet" for display.
  String get _displayLabel {
    final parts = label.split('/');
    return parts.length > 1 ? parts.last : label;
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: AppSpacing.xs,
        ),
        decoration: BoxDecoration(
          color: (colors as dynamic).surfaceHighest as Color,
          borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
          border: Border.all(color: (colors as dynamic).border as Color),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.tune_rounded,
              size: 13,
              color: (colors as dynamic).onSurfaceMuted as Color,
            ),
            const SizedBox(width: 4),
            ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 160),
              child: Text(
                _displayLabel,
                style: AppTypography.labelSmall.copyWith(
                  color: (colors as dynamic).onSurfaceMuted as Color,
                ),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            const SizedBox(width: 2),
            Icon(
              Icons.expand_more_rounded,
              size: 14,
              color: (colors as dynamic).onSurfaceMuted as Color,
            ),
          ],
        ),
      ),
    );
  }
}
