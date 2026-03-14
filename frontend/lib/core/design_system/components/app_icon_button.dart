import 'package:flutter/material.dart';

import 'package:miru/core/design_system/extensions/build_context_extensions.dart';
import 'package:miru/core/design_system/tokens/colors.dart';
import 'package:miru/core/design_system/tokens/spacing.dart';

/// The visual style of an icon button.
enum AppIconButtonVariant { filled, tonal, ghost }

/// A themed icon button with consistent sizing and styling.
///
/// ```dart
/// AppIconButton(
///   icon: Icons.send_rounded,
///   onPressed: _sendMessage,
///   variant: AppIconButtonVariant.filled,
/// )
/// ```
class AppIconButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback? onPressed;
  final AppIconButtonVariant variant;
  final double size;
  final Color? color;
  final String? tooltip;

  const AppIconButton({
    super.key,
    required this.icon,
    this.onPressed,
    this.variant = AppIconButtonVariant.ghost,
    this.size = AppSpacing.buttonHeight,
    this.color,
    this.tooltip,
  });

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    final ButtonStyle style = switch (variant) {
      AppIconButtonVariant.filled => IconButton.styleFrom(
          backgroundColor: color ?? colors.primary,
          foregroundColor: AppColors.onPrimary,
          minimumSize: Size(size, size),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
          ),
        ),
      AppIconButtonVariant.tonal => IconButton.styleFrom(
          backgroundColor: colors.primarySurface,
          foregroundColor: colors.primary,
          minimumSize: Size(size, size),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
          ),
        ),
      AppIconButtonVariant.ghost => IconButton.styleFrom(
          foregroundColor: color ?? colors.onSurface,
          minimumSize: Size(size, size),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
          ),
        ),
    };

    return IconButton(
      icon: Icon(icon, size: AppSpacing.iconLg),
      onPressed: onPressed,
      style: style,
      tooltip: tooltip,
    );
  }
}
