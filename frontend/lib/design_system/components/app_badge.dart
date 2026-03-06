import 'package:flutter/material.dart';
import '../extensions/build_context_extensions.dart';
import '../tokens/colors.dart';
import '../tokens/spacing.dart';
import '../tokens/typography.dart';

/// The semantic intent of a badge.
enum AppBadgeVariant { primary, success, warning, error, info, neutral }

/// A small label/badge for status, counts, or categorization.
///
/// ```dart
/// AppBadge(label: 'Online', variant: AppBadgeVariant.success)
/// AppBadge(label: '3', variant: AppBadgeVariant.primary)
/// ```
class AppBadge extends StatelessWidget {
  final String label;
  final AppBadgeVariant variant;
  final IconData? icon;

  const AppBadge({
    super.key,
    required this.label,
    this.variant = AppBadgeVariant.neutral,
    this.icon,
  });

  @override
  Widget build(BuildContext context) {
    final (bg, fg) = _resolveColors(context);

    return Container(
      padding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.sm,
        vertical: AppSpacing.xxs,
      ),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: AppSpacing.iconSm, color: fg),
            const SizedBox(width: AppSpacing.xs),
          ],
          Text(
            label,
            style: AppTypography.captionSmall.copyWith(
              color: fg,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  (Color, Color) _resolveColors(BuildContext context) {
    final colors = context.colors;
    return switch (variant) {
      AppBadgeVariant.primary => (
          colors.primarySurface,
          colors.primaryLight,
        ),
      AppBadgeVariant.success => (colors.successSurface, colors.success),
      AppBadgeVariant.warning => (colors.warningSurface, colors.warning),
      AppBadgeVariant.error => (colors.errorSurface, colors.error),
      AppBadgeVariant.info => (colors.infoSurface, colors.info),
      AppBadgeVariant.neutral => (colors.surfaceHigh, colors.onSurfaceMuted),
    };
  }
}
