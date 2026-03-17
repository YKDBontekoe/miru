import 'package:flutter/material.dart';

import 'package:miru/core/design_system/design_system.dart';

/// A circular floating button that scrolls the message list to the bottom.
///
/// It displays an arrow pointing downwards, and appears when the user scrolls up
/// from the bottom of the chat list.
class ScrollToBottomButton extends StatelessWidget {
  /// Callback executed when the button is tapped.
  final VoidCallback onPressed;

  /// The theme colors for styling the button.
  final AppThemeColors colors;

  /// Creates a [ScrollToBottomButton].
  const ScrollToBottomButton({
    super.key,
    required this.onPressed,
    required this.colors,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        boxShadow: AppShadows.md,
      ),
      child: Material(
        color: colors.surfaceHigh,
        elevation: 0,
        shape: const CircleBorder(),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onPressed,
          child: Container(
            width: 36,
            height: 36,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: colors.border.withValues(alpha: 0.6)),
            ),
            child: Icon(
              Icons.keyboard_arrow_down_rounded,
              color: colors.onSurfaceMuted,
              size: AppSpacing.iconMd,
            ),
          ),
        ),
      ),
    );
  }
}
