import 'package:flutter/material.dart';
import '../extensions/build_context_extensions.dart';
import '../tokens/colors.dart';
import '../tokens/spacing.dart';
import '../tokens/typography.dart';

/// A centered empty-state placeholder with icon, title, and subtitle.
///
/// ```dart
/// AppEmptyState(
///   icon: Icons.auto_awesome_rounded,
///   title: "Hi, I'm Miru.",
///   subtitle: 'I remember things about you over time.\nTell me something!',
/// )
/// ```
class AppEmptyState extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final Widget? action;

  const AppEmptyState({
    super.key,
    required this.icon,
    required this.title,
    this.subtitle,
    this.action,
  });

  @override
  Widget build(BuildContext context) {
    final colors = context.colors;

    return Center(
      child: Padding(
        padding: AppSpacing.paddingAllXxl,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Icon
            Container(
              width: 80,
              height: 80,
              decoration: const BoxDecoration(
                color: AppColors.primarySurface,
                shape: BoxShape.circle,
              ),
              child: Icon(
                icon,
                size: AppSpacing.iconXl,
                color: AppColors.primaryLight,
              ),
            ),

            const SizedBox(height: AppSpacing.xl),

            // Title
            Text(
              title,
              style: AppTypography.headingMedium.copyWith(
                color: colors.onSurface,
              ),
              textAlign: TextAlign.center,
            ),

            // Subtitle
            if (subtitle != null) ...[
              const SizedBox(height: AppSpacing.sm),
              Text(
                subtitle!,
                textAlign: TextAlign.center,
                style: AppTypography.bodyMedium.copyWith(
                  color: colors.onSurfaceMuted,
                ),
              ),
            ],

            // Optional action
            if (action != null) ...[
              const SizedBox(height: AppSpacing.xxl),
              action!,
            ],
          ],
        ),
      ),
    );
  }
}
