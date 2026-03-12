import 'package:flutter/material.dart';
import 'package:miru/core/design_system/extensions/build_context_extensions.dart';
import 'package:miru/core/design_system/tokens/colors.dart';
import 'package:miru/core/design_system/tokens/spacing.dart';
import 'package:miru/core/design_system/tokens/typography.dart';

/// A consistent avatar component for displaying user/assistant identity.
///
/// Supports icon, initials, or image content.
///
/// ```dart
/// AppAvatar.icon(Icons.smart_toy_rounded)
/// AppAvatar.initials('YB')
/// ```
class AppAvatar extends StatelessWidget {
  final Widget child;
  final double size;
  final Color? backgroundColor;

  const AppAvatar({
    super.key,
    required this.child,
    this.size = AppSpacing.avatarMd,
    this.backgroundColor,
  });

  /// Avatar with an icon.
  factory AppAvatar.icon(
    IconData icon, {
    Key? key,
    double size = AppSpacing.avatarMd,
    Color? backgroundColor,
    Color? iconColor,
  }) {
    return AppAvatar(
      key: key,
      size: size,
      backgroundColor: backgroundColor,
      child: Icon(
        icon,
        size: size * 0.5,
        color: iconColor ?? AppColors.onPrimary,
      ),
    );
  }

  /// Avatar with initials text.
  factory AppAvatar.initials(
    String text, {
    Key? key,
    double size = AppSpacing.avatarMd,
    Color? backgroundColor,
    Color? textColor,
  }) {
    return AppAvatar(
      key: key,
      size: size,
      backgroundColor: backgroundColor,
      child: Text(
        text.substring(0, text.length.clamp(0, 2)).toUpperCase(),
        style: AppTypography.labelMedium.copyWith(
          color: textColor ?? AppColors.onPrimary,
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: backgroundColor ?? context.colors.surfaceHigh,
        shape: BoxShape.circle,
      ),
      alignment: Alignment.center,
      child: child,
    );
  }
}
